import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateToken, 
  hashPassword, 
  comparePassword, 
  authenticateToken, 
  requireAdmin, 
  requireMember,
  requireAdminOrMarketing,
  requireAdminOrEspiritualidade,
  type AuthRequest 
} from "./auth";
import { 
  loginSchema, 
  registerSchema, 
  insertCandidateSchema,
  requestCodeSchema,
  verifyCodeSchema,
  addMemberSchema,
  updateMemberSchema,
  setPasswordSchema,
  loginPasswordSchema,
  getGravatarUrl,
  generatePdfVerificationHash,
} from "@shared/schema";
import type { AuthResponse } from "@shared/schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";
import { 
  generateStudyContentFromText, 
  generateStudyContentFromPDF,
  generateExercisesFromTopic, 
  generateReflectionQuestions,
  summarizeText,
  isAIConfigured 
} from "./ai";
import multer from "multer";
import { PDFParse } from "pdf-parse";

async function parsePdfBuffer(buffer: Buffer): Promise<{ text: string }> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return { text: result.text };
  } finally {
    await parser.destroy();
  }
}

// Configure multer for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  }
});

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getIconForLessonType(type: string): string {
  const icons: Record<string, string> = {
    intro: "book-open",
    study: "star",
    meditation: "heart",
    challenge: "trophy",
    review: "crown"
  };
  return icons[type] || "star";
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      const isPasswordValid = await comparePassword(
        validatedData.password,
        user.password
      );
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      const { password, ...userWithoutPassword } = user;
      const token = generateToken(userWithoutPassword);

      const response: AuthResponse = {
        user: userWithoutPassword,
        token,
      };

      res.json(response);
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao fazer login" 
      });
    }
  });

  app.post("/api/auth/request-code", async (req, res) => {
    try {
      const validatedData = requestCodeSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(404).json({ message: "Este e-mail não está cadastrado no sistema. Entre em contato com o administrador." });
      }

      // Check if user already has a password set and this is NOT a password reset request
      if (user.hasPassword && !validatedData.isPasswordReset) {
        return res.json({ 
          message: "Usuário já possui senha cadastrada",
          hasPassword: true 
        });
      }

      await storage.deleteVerificationCodesByEmail(validatedData.email);

      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const isPasswordReset = validatedData.isPasswordReset || false;

      await storage.createVerificationCode({
        email: validatedData.email,
        code,
        expiresAt,
        isPasswordReset,
      });

      const emailSent = isPasswordReset 
        ? await sendPasswordResetEmail(validatedData.email, code)
        : await sendVerificationEmail(validatedData.email, code);

      if (!emailSent) {
        console.log(`[FALLBACK] Código de ${isPasswordReset ? 'recuperação' : 'verificação'} para ${validatedData.email}: ${code}`);
      }

      res.json({ 
        message: "Código enviado para seu email",
        hasPassword: user.hasPassword 
      });
    } catch (error) {
      console.error("Request code error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao solicitar código" 
      });
    }
  });

  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const validatedData = verifyCodeSchema.parse(req.body);
      
      const verificationCode = await storage.getValidVerificationCode(
        validatedData.email,
        validatedData.code
      );

      if (!verificationCode) {
        return res.status(401).json({ message: "Código inválido ou expirado" });
      }

      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(404).json({ message: "Este e-mail não está cadastrado no sistema" });
      }

      await storage.deleteVerificationCodesByEmail(validatedData.email);

      const { password, ...userWithoutPassword } = user;
      const token = generateToken(userWithoutPassword);

      const response: AuthResponse = {
        user: userWithoutPassword,
        token,
      };

      // If this is a password reset, indicate that user needs to set new password
      if (verificationCode.isPasswordReset) {
        return res.json({
          ...response,
          requiresPasswordReset: true,
        });
      }

      res.json(response);
    } catch (error) {
      console.error("Verify code error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao verificar código" 
      });
    }
  });

  app.post("/api/auth/set-password", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = setPasswordSchema.parse(req.body);
      
      if (!req.user) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      
      const updatedUser = await storage.updateUser(req.user.id, {
        password: hashedPassword,
        hasPassword: true,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      const token = generateToken(userWithoutPassword);

      const response: AuthResponse = {
        user: userWithoutPassword,
        token,
      };

      res.json(response);
    } catch (error) {
      console.error("Set password error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao definir senha" 
      });
    }
  });

  app.post("/api/auth/login-password", async (req, res) => {
    try {
      const validatedData = loginPasswordSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      if (!user.hasPassword) {
        return res.status(400).json({ 
          message: "Você ainda não definiu uma senha. Use o código de verificação para fazer login." 
        });
      }

      const isPasswordValid = await comparePassword(
        validatedData.password,
        user.password
      );
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      const { password, ...userWithoutPassword } = user;
      const token = generateToken(userWithoutPassword);

      const response: AuthResponse = {
        user: userWithoutPassword,
        token,
      };

      res.json(response);
    } catch (error) {
      console.error("Login password error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao fazer login" 
      });
    }
  });

  app.post("/api/admin/members", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = addMemberSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      const user = await storage.createUser({
        fullName: validatedData.fullName,
        email: validatedData.email,
        password: Math.random().toString(36),
        hasPassword: false,
        photoUrl: validatedData.photoUrl,
        birthdate: validatedData.birthdate,
        isAdmin: false,
        isMember: true,
        activeMember: validatedData.activeMember,
        secretaria: validatedData.secretaria,
      } as any);

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Add member error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao adicionar membro" 
      });
    }
  });

  app.patch("/api/admin/members/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const memberId = parseInt(req.params.id);
      
      if (isNaN(memberId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const validatedData = updateMemberSchema.parse(req.body);

      if (validatedData.email) {
        const existingUser = await storage.getUserByEmail(validatedData.email);
        if (existingUser && existingUser.id !== memberId) {
          return res.status(400).json({ message: "Este email já está sendo usado por outro membro" });
        }
      }

      const updatedUser = await storage.updateUser(memberId, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Membro não encontrado" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update member error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao atualizar membro" 
      });
    }
  });

  app.delete("/api/admin/members/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const memberId = parseInt(req.params.id);
      
      if (isNaN(memberId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      await storage.deleteMember(memberId);
      res.json({ message: "Membro removido com sucesso" });
    } catch (error) {
      console.error("Delete member error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao remover membro" 
      });
    }
  });

  app.post("/api/elections", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { name } = req.body;
      
      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Nome da eleição é obrigatório" });
      }

      const election = await storage.createElection(name);
      res.json(election);
    } catch (error) {
      console.error("Create election error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao criar eleição" 
      });
    }
  });

  app.patch("/api/elections/:id/close", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      
      const election = await storage.getElectionById(electionId);
      if (!election) {
        return res.status(404).json({ message: "Eleição não encontrada" });
      }

      storage.closeElection(electionId);
      res.json({ message: "Eleição encerrada com sucesso" });
    } catch (error) {
      console.error("Close election error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao encerrar eleição" 
      });
    }
  });

  app.post("/api/elections/:id/finalize", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      
      const election = await storage.getElectionById(electionId);
      if (!election) {
        return res.status(404).json({ message: "Eleição não encontrada" });
      }

      // Verificar se todos os cargos estão decididos
      const positions = await storage.getElectionPositions(electionId);
      const allCompleted = positions.every(p => p.status === 'completed');
      
      if (!allCompleted) {
        return res.status(400).json({ message: "Todos os cargos devem estar decididos antes de finalizar a eleição" });
      }

      storage.finalizeElection(electionId);
      res.json({ message: "Eleição finalizada com sucesso" });
    } catch (error) {
      console.error("Finalize election error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao finalizar eleição" 
      });
    }
  });

  app.get("/api/elections/history", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const history = await storage.getElectionHistory();
      res.json(history);
    } catch (error) {
      console.error("Get election history error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar histórico de eleições" 
      });
    }
  });

  // Election Attendance endpoints
  app.get("/api/elections/:id/attendance", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      const attendance = await storage.getElectionAttendance(electionId);
      
      // Get winners for this election to exclude them from attendance list
      const winners = await storage.getElectionWinners(electionId);
      const winnerUserIds = new Set(winners.map(w => w.userId));
      
      // Join with user information and filter out winners
      const attendanceWithUsersPromises = attendance.map(async (att) => {
        const user = await storage.getUserById(att.memberId);
        return {
          ...att,
          memberName: user?.fullName || '',
          memberEmail: user?.email || '',
        };
      });
      const attendanceWithUsersAll = await Promise.all(attendanceWithUsersPromises);
      const attendanceWithUsers = attendanceWithUsersAll.filter(att => !winnerUserIds.has(att.memberId));
      
      res.json(attendanceWithUsers);
    } catch (error) {
      console.error("Get attendance error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar presença" 
      });
    }
  });

  app.post("/api/elections/:id/attendance/initialize", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      await storage.initializeAttendance(electionId);
      res.json({ message: "Lista de presença inicializada" });
    } catch (error) {
      console.error("Initialize attendance error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao inicializar presença" 
      });
    }
  });

  app.patch("/api/elections/:id/attendance/:memberId", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      const memberId = parseInt(req.params.memberId);
      const { isPresent } = req.body;
      
      if (typeof isPresent !== 'boolean') {
        return res.status(400).json({ message: "isPresent deve ser booleano" });
      }
      
      await storage.setMemberAttendance(electionId, memberId, isPresent);
      res.json({ message: "Presença atualizada" });
    } catch (error) {
      console.error("Set attendance error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao atualizar presença" 
      });
    }
  });

  app.get("/api/elections/:id/attendance/count", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      const count = await storage.getPresentCount(electionId);
      res.json({ presentCount: count });
    } catch (error) {
      console.error("Get present count error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao contar presentes" 
      });
    }
  });

  // Election Positions endpoints
  app.get("/api/elections/:id/positions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      const electionPositions = await storage.getElectionPositions(electionId);
      
      // Join with position names
      const allPositions = await storage.getAllPositions();
      const positionsWithNames = electionPositions.map(ep => {
        const position = allPositions.find(p => p.id === ep.positionId);
        return {
          ...ep,
          positionName: position?.name || '',
        };
      });
      
      res.json(positionsWithNames);
    } catch (error) {
      console.error("Get election positions error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar cargos da eleição" 
      });
    }
  });

  app.get("/api/elections/:id/positions/active", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      const activePosition = await storage.getActiveElectionPosition(electionId);
      
      if (!activePosition) {
        return res.json(null);
      }
      
      // Join with position name
      const allPositions = await storage.getAllPositions();
      const position = allPositions.find(p => p.id === activePosition.positionId);
      
      res.json({
        ...activePosition,
        positionName: position?.name || '',
      });
    } catch (error) {
      console.error("Get active position error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar cargo ativo" 
      });
    }
  });

  app.post("/api/elections/:id/positions/advance-scrutiny", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      const activePosition = await storage.getActiveElectionPosition(electionId);
      
      if (!activePosition) {
        return res.status(404).json({ message: "Nenhum cargo ativo encontrado" });
      }
      
      await storage.advancePositionScrutiny(activePosition.id);
      res.json({ message: "Escrutínio avançado com sucesso" });
    } catch (error) {
      console.error("Advance scrutiny error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao avançar escrutínio" 
      });
    }
  });

  app.get("/api/elections/:id/positions/check-tie", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      const activePosition = await storage.getActiveElectionPosition(electionId);
      
      if (!activePosition) {
        return res.json({ isTie: false, candidates: [] });
      }
      
      const tieCheck = await storage.checkThirdScrutinyTie(activePosition.id);
      
      // If there's a tie, get candidate details
      if (tieCheck.isTie && tieCheck.candidates) {
        const candidates = await storage.getCandidatesByPosition(activePosition.positionId, electionId);
        const tiedCandidates = tieCheck.candidates.map(tc => {
          const candidate = candidates.find(c => c.id === tc.candidateId);
          return {
            ...tc,
            name: candidate?.name || '',
            email: candidate?.email || '',
          };
        });
        
        res.json({ isTie: true, candidates: tiedCandidates, electionPositionId: activePosition.id });
      } else {
        res.json({ isTie: false, candidates: [] });
      }
    } catch (error) {
      console.error("Check tie error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao verificar empate" 
      });
    }
  });

  app.post("/api/elections/:id/positions/resolve-tie", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      const { electionPositionId, winnerId } = req.body;
      
      if (!electionPositionId || !winnerId) {
        return res.status(400).json({ message: "Dados incompletos" });
      }
      
      await storage.resolveThirdScrutinyTie(electionPositionId, winnerId);
      res.json({ message: "Empate resolvido com sucesso" });
    } catch (error) {
      console.error("Resolve tie error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao resolver empate" 
      });
    }
  });

  app.post("/api/elections/:id/positions/open-next", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      
      // Check if there are any present members before opening position
      const presentCount = await storage.getPresentCount(electionId);
      if (presentCount === 0) {
        return res.status(400).json({ message: "Registre primeiro a presença dos membros antes de abrir a votação" });
      }
      
      const nextPosition = await storage.openNextPosition(electionId);
      
      if (!nextPosition) {
        return res.status(404).json({ message: "Nenhum próximo cargo disponível" });
      }
      
      // Join with position name
      const allPositions = await storage.getAllPositions();
      const position = allPositions.find(p => p.id === nextPosition.positionId);
      
      res.json({
        ...nextPosition,
        positionName: position?.name || '',
      });
    } catch (error) {
      console.error("Open next position error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao abrir próximo cargo" 
      });
    }
  });

  app.post("/api/elections/:id/positions/:positionId/open", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      const electionPositionId = parseInt(req.params.positionId);
      
      // Check if there are any present members before opening position
      const presentCount = await storage.getPresentCount(electionId);
      if (presentCount === 0) {
        return res.status(400).json({ message: "Confirme primeiro a presença dos membros antes de abrir a votação." });
      }
      
      // Open the specific position
      const openedPosition = await storage.openPosition(electionPositionId);
      
      // Join with position name
      const allPositions = await storage.getAllPositions();
      const position = allPositions.find(p => p.id === openedPosition.positionId);
      
      res.json({
        ...openedPosition,
        positionName: position?.name || '',
      });
    } catch (error) {
      console.error("Open position error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao abrir cargo" 
      });
    }
  });

  app.post("/api/elections/:id/positions/:positionId/force-close", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.id);
      const electionPositionId = parseInt(req.params.positionId);
      const { reason, shouldReopen } = req.body;
      
      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        return res.status(400).json({ message: "É necessário fornecer um motivo para fechar manualmente" });
      }
      
      // Verify this is an active position
      const activePosition = await storage.getActiveElectionPosition(electionId);
      if (!activePosition || activePosition.id !== electionPositionId) {
        return res.status(400).json({ message: "Esta posição não está ativa" });
      }
      
      // Force complete the position
      await storage.forceCompletePosition(electionPositionId, reason, shouldReopen === true);
      
      const message = shouldReopen 
        ? "Cargo fechado e reaberto para nova votação" 
        : "Cargo fechado permanentemente com sucesso";
      
      res.json({ message });
    } catch (error) {
      console.error("Force close position error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao fechar cargo manualmente" 
      });
    }
  });

  app.post("/api/candidates", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertCandidateSchema.parse(req.body);
      
      // Validate that the user is not an admin
      const user = await storage.getUserById(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      if (user.isAdmin) {
        return res.status(400).json({ message: "Administradores não podem ser candidatos" });
      }

      // Check if user is present
      const isPresent = await storage.isMemberPresent(validatedData.electionId, validatedData.userId);
      if (!isPresent) {
        return res.status(400).json({ message: "Apenas membros com presença confirmada podem ser candidatos" });
      }
      
      // Validate that the user is not already a winner in this election
      const winners = await storage.getElectionWinners(validatedData.electionId);
      const isAlreadyWinner = winners.some(w => w.userId === validatedData.userId);
      if (isAlreadyWinner) {
        return res.status(400).json({ message: "Este membro já foi eleito para um cargo nesta eleição" });
      }

      // Check if candidate is already added to this position
      const existingCandidates = await storage.getCandidatesByPosition(validatedData.positionId, validatedData.electionId);
      const isDuplicate = existingCandidates.some(c => c.userId === validatedData.userId);
      if (isDuplicate) {
        return res.status(400).json({ message: "Este candidato já foi adicionado para este cargo" });
      }

      // Check if the position is active before adding candidates
      const activePosition = await storage.getActiveElectionPosition(validatedData.electionId);
      if (!activePosition || activePosition.positionId !== validatedData.positionId) {
        return res.status(400).json({ message: "A votação para este cargo ainda não foi aberta" });
      }
      
      const candidate = await storage.createCandidate(validatedData);
      res.json(candidate);
    } catch (error) {
      console.error("Create candidate error:", error);
      
      // Handle UNIQUE constraint violation
      if (error instanceof Error && error.message.includes("UNIQUE constraint")) {
        return res.status(409).json({ message: "Este candidato já foi adicionado para este cargo" });
      }
      
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao adicionar candidato" 
      });
    }
  });

  app.post("/api/candidates/batch", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { candidates, positionId, electionId } = req.body;

      if (!Array.isArray(candidates) || candidates.length === 0) {
        return res.status(400).json({ message: "Lista de candidatos inválida ou vazia" });
      }

      if (!positionId || !electionId) {
        return res.status(400).json({ message: "ID do cargo e eleição são obrigatórios" });
      }

      const activePosition = await storage.getActiveElectionPosition(electionId);
      if (!activePosition || activePosition.positionId !== positionId) {
        return res.status(400).json({ message: "A votação para este cargo ainda não foi aberta" });
      }

      const winners = await storage.getElectionWinners(electionId);
      const existingCandidates = await storage.getCandidatesByPosition(positionId, electionId);
      const createdCandidates = [];
      const errors = [];

      for (const candidate of candidates) {
        try {
          if (!candidate.userId || !candidate.name || !candidate.email) {
            errors.push(`Candidato inválido: dados incompletos`);
            continue;
          }

          const user = await storage.getUserById(candidate.userId);
          if (!user) {
            errors.push(`Usuário ${candidate.name} não encontrado`);
            continue;
          }
          
          if (user.isAdmin) {
            errors.push(`${candidate.name} é administrador e não pode ser candidato`);
            continue;
          }

          const isPresent = await storage.isMemberPresent(electionId, candidate.userId);
          if (!isPresent) {
            errors.push(`${candidate.name} não está presente`);
            continue;
          }
          
          const isAlreadyWinner = winners.some(w => w.userId === candidate.userId);
          if (isAlreadyWinner) {
            errors.push(`${candidate.name} já foi eleito para um cargo nesta eleição`);
            continue;
          }

          const isDuplicate = existingCandidates.some(c => c.userId === candidate.userId);
          if (isDuplicate) {
            errors.push(`${candidate.name} já foi adicionado para este cargo`);
            continue;
          }

          const created = await storage.createCandidate({
            name: candidate.name,
            email: candidate.email,
            userId: candidate.userId,
            positionId,
            electionId,
          });

          createdCandidates.push(created);
          existingCandidates.push(created);
        } catch (error) {
          errors.push(`Erro ao adicionar ${candidate.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      if (createdCandidates.length === 0) {
        return res.status(400).json({ 
          message: "Nenhum candidato foi adicionado", 
          errors 
        });
      }

      res.json({
        message: `${createdCandidates.length} candidato(s) adicionado(s) com sucesso`,
        candidates: createdCandidates,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Batch create candidates error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao adicionar candidatos em lote" 
      });
    }
  });

  app.get("/api/elections/active", async (req, res) => {
    try {
      const election = await storage.getActiveElection();
      res.json(election);
    } catch (error) {
      console.error("Get active election error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar eleição ativa" 
      });
    }
  });

  app.get("/api/members", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const members = await storage.getAllMembers();
      const membersWithoutPasswords = members.map(({ password, ...user }) => user);
      res.json(membersWithoutPasswords);
    } catch (error) {
      console.error("Get members error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar membros" 
      });
    }
  });

  app.get("/api/members/non-admins", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const members = await storage.getAllMembers(true); // Exclude admins
      let membersWithoutPasswords = members.map(({ password, ...user }) => user);
      
      // If electionId is provided, exclude members who already won a position in this election
      // and filter only members who are present
      const electionId = req.query.electionId ? parseInt(req.query.electionId as string) : null;
      if (electionId) {
        const winners = await storage.getElectionWinners(electionId);
        const winnerUserIds = new Set(winners.map(w => w.userId));
        
        console.log(`\n[API /api/members/non-admins] ========== MEMBER FILTERING DEBUG ==========`);
        console.log(`[DEBUG] Election ID: ${electionId}`);
        console.log(`[DEBUG] Winners found:`, JSON.stringify(winners, null, 2));
        console.log(`[DEBUG] Winner User IDs:`, Array.from(winnerUserIds));
        console.log(`[DEBUG] Total members before filtering:`, membersWithoutPasswords.length);
        console.log(`[DEBUG] Members before filtering (id, fullName):`, membersWithoutPasswords.map(m => ({ id: m.id, fullName: m.fullName })));
        
        // Filter by winners
        const beforeWinnerFilter = membersWithoutPasswords.length;
        membersWithoutPasswords = membersWithoutPasswords.filter(m => {
          const isWinner = winnerUserIds.has(m.id);
          if (isWinner) {
            console.log(`[DEBUG] Filtering out winner: ${m.fullName} (id: ${m.id})`);
          }
          return !isWinner;
        });
        
        console.log(`[DEBUG] Filtered out ${beforeWinnerFilter - membersWithoutPasswords.length} winners`);
        console.log(`[DEBUG] Members after winner filter:`, membersWithoutPasswords.length);
        console.log(`[DEBUG] Remaining members (id, fullName):`, membersWithoutPasswords.map(m => ({ id: m.id, fullName: m.fullName })));
        
        // Filter by presence - only include members who are present
        const presenceCheckPromises = membersWithoutPasswords.map(async m => ({
          member: m,
          isPresent: await storage.isMemberPresent(electionId, m.id)
        }));
        const presenceResults = await Promise.all(presenceCheckPromises);
        membersWithoutPasswords = presenceResults.filter(r => r.isPresent).map(r => r.member);
        
        console.log(`[DEBUG] Members after presence filter:`, membersWithoutPasswords.length);
        console.log(`[DEBUG] Final members (id, fullName):`, membersWithoutPasswords.map(m => ({ id: m.id, fullName: m.fullName })));
        console.log(`[API /api/members/non-admins] ========== END DEBUG ==========\n`);
      }
      
      res.json(membersWithoutPasswords);
    } catch (error) {
      console.error("Get non-admin members error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar membros" 
      });
    }
  });

  app.get("/api/positions", async (req, res) => {
    try {
      const positions = await storage.getAllPositions();
      res.json(positions);
    } catch (error) {
      console.error("Get positions error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar cargos" 
      });
    }
  });

  app.get("/api/candidates", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const activeElection = await storage.getActiveElection();
      if (!activeElection) {
        return res.json([]);
      }

      const candidates = await storage.getCandidatesByElection(activeElection.id);
      res.json(candidates);
    } catch (error) {
      console.error("Get candidates error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar candidatos" 
      });
    }
  });

  app.get("/api/elections/:electionId/positions/:positionId/candidates", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.electionId);
      const positionId = parseInt(req.params.positionId);
      
      if (isNaN(electionId) || isNaN(positionId)) {
        return res.status(400).json({ message: "IDs inválidos" });
      }

      const candidates = await storage.getCandidatesByPosition(positionId, electionId);
      const candidatesWithPhotosPromises = candidates.map(async (candidate) => {
        const user = await storage.getUserById(candidate.userId);
        return {
          ...candidate,
          photoUrl: user?.photoUrl || getGravatarUrl(candidate.email),
        };
      });
      const candidatesWithPhotos = await Promise.all(candidatesWithPhotosPromises);
      
      res.json(candidatesWithPhotos);
    } catch (error) {
      console.error("Get position candidates error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar candidatos" 
      });
    }
  });

  app.post("/api/vote", authenticateToken, requireMember, async (req: AuthRequest, res) => {
    try {
      const { candidateId, positionId, electionId } = req.body;
      const voterId = req.user!.id;

      if (!candidateId || !positionId || !electionId) {
        return res.status(400).json({ message: "Dados incompletos" });
      }

      // Check if voter is present
      const isPresent = await storage.isMemberPresent(electionId, voterId);
      if (!isPresent) {
        return res.status(403).json({ message: "Apenas membros com presença confirmada podem votar" });
      }

      // Get active position for this election to determine scrutiny round
      const activePosition = await storage.getActiveElectionPosition(electionId);
      if (!activePosition) {
        return res.status(400).json({ message: "Nenhum cargo ativo no momento" });
      }

      // Verify user is voting for the active position
      if (activePosition.positionId !== positionId) {
        return res.status(400).json({ message: "Este cargo não está ativo no momento" });
      }

      const scrutinyRound = activePosition.currentScrutiny;

      const hasVoted = await storage.hasUserVoted(voterId, positionId, electionId, scrutinyRound);
      if (hasVoted) {
        return res.status(403).json({ message: "Você já votou para esse cargo neste escrutínio." });
      }

      const vote = await storage.createVote({
        voterId,
        candidateId,
        positionId,
        electionId,
        scrutinyRound,
      });

      res.json({ 
        message: "Voto registrado com sucesso!",
        vote 
      });
    } catch (error) {
      console.error("Vote error:", error);
      
      if (error instanceof Error && error.message.includes("UNIQUE constraint")) {
        return res.status(403).json({ message: "Você já votou para esse cargo neste escrutínio." });
      }
      
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao registrar voto" 
      });
    }
  });

  app.get("/api/results/latest", async (req, res) => {
    try {
      const results = await storage.getLatestElectionResults();
      if (results) {
        // Add photo URLs to candidates (custom photo or Gravatar)
        for (const position of results.positions) {
          for (const candidate of position.candidates) {
            const user = await storage.getUserByEmail(candidate.candidateEmail);
            candidate.photoUrl = user?.photoUrl || getGravatarUrl(candidate.candidateEmail);
          }
        }
      }
      res.json(results);
    } catch (error) {
      console.error("Get latest results error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar resultados" 
      });
    }
  });

  app.get("/api/results/:electionId", async (req, res) => {
    try {
      const electionId = parseInt(req.params.electionId);
      const results = await storage.getElectionResults(electionId);
      
      if (!results) {
        return res.status(404).json({ message: "Eleição não encontrada" });
      }

      // Add photo URLs to candidates (custom photo or Gravatar)
      for (const position of results.positions) {
        for (const candidate of position.candidates) {
          const user = await storage.getUserByEmail(candidate.candidateEmail);
          candidate.photoUrl = user?.photoUrl || getGravatarUrl(candidate.candidateEmail);
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Get results error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar resultados" 
      });
    }
  });

  app.get("/api/elections/:electionId/winners", async (req, res) => {
    try {
      const electionId = parseInt(req.params.electionId);
      const winners = await storage.getElectionWinners(electionId);
      const results = await storage.getElectionResults(electionId);
      
      if (!results) {
        return res.status(404).json({ message: "Eleição não encontrada" });
      }
      
      // Get position, user details, and vote count for each winner
      const positions = await storage.getAllPositions();
      const formattedWinnersPromises = winners.map(async (w) => {
        const user = await storage.getUserById(w.userId);
        const position = positions.find(p => p.id === w.positionId);
        
        // Find vote count from results
        const positionResults = results.positions.find(p => p.positionId === w.positionId);
        const candidateResults = positionResults?.candidates.find(c => c.candidateId === w.candidateId);
        
        return {
          positionId: w.positionId,
          positionName: position?.name || '',
          candidateName: user?.fullName || '',
          photoUrl: user?.photoUrl || (user?.email ? getGravatarUrl(user.email) : undefined),
          voteCount: candidateResults?.voteCount || 0,
          wonAtScrutiny: w.wonAtScrutiny
        };
      });
      const formattedWinners = await Promise.all(formattedWinnersPromises);

      res.json(formattedWinners);
    } catch (error) {
      console.error("Get winners error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar vencedores" 
      });
    }
  });

  app.get("/api/elections/:electionId/audit", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.electionId);
      const auditData = await storage.getElectionAuditData(electionId);
      
      if (!auditData) {
        return res.status(404).json({ message: "Dados de auditoria não encontrados para esta eleição" });
      }

      // Add photo URLs to candidates in results
      for (const position of auditData.results.positions) {
        for (const candidate of position.candidates) {
          const user = await storage.getUserByEmail(candidate.candidateEmail);
          candidate.photoUrl = user?.photoUrl || getGravatarUrl(candidate.candidateEmail);
        }
      }

      // Generate verification hash for PDF
      const verificationHash = generatePdfVerificationHash(
        electionId,
        auditData.results.electionName,
        new Date().toISOString()
      );

      // Add verification hash to audit data
      auditData.verificationHash = verificationHash;

      res.json(auditData);
    } catch (error) {
      console.error("Get election audit data error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao buscar dados de auditoria" 
      });
    }
  });

  app.post("/api/elections/:electionId/audit/send-email", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.electionId);
      const { presidentEmail, presidentName, pdfBase64 } = req.body;

      if (!presidentEmail || !presidentName || !pdfBase64) {
        return res.status(400).json({ message: "Email do presidente, nome e PDF são obrigatórios" });
      }

      const election = await storage.getElectionById(electionId);
      if (!election) {
        return res.status(404).json({ message: "Eleição não encontrada" });
      }

      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      
      const emailModule = await import("./email");
      const success = await emailModule.sendAuditPDFEmail(
        presidentName,
        presidentEmail,
        election.name,
        pdfBuffer
      );

      if (!success) {
        return res.status(500).json({ message: "Erro ao enviar email. Verifique a configuração do serviço de email." });
      }

      res.json({ 
        message: "PDF de auditoria enviado com sucesso para o email do presidente",
        sentTo: presidentEmail
      });
    } catch (error) {
      console.error("Send audit PDF email error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao enviar PDF por email" 
      });
    }
  });

  app.post("/api/dev/seed-test-users", async (req, res) => {
    try {
      if (app.get("env") !== "development") {
        return res.status(403).json({ message: "Este endpoint só está disponível em desenvolvimento" });
      }

      const testUsers = [
        { fullName: "Admin Teste", email: "admin@teste.com", password: "senha123", isAdmin: true },
        { fullName: "João Silva", email: "joao@teste.com", password: "senha123", isAdmin: false },
        { fullName: "Maria Santos", email: "maria@teste.com", password: "senha123", isAdmin: false },
        { fullName: "Pedro Oliveira", email: "pedro@teste.com", password: "senha123", isAdmin: false },
        { fullName: "Ana Costa", email: "ana@teste.com", password: "senha123", isAdmin: false },
        { fullName: "Carlos Pereira", email: "carlos@teste.com", password: "senha123", isAdmin: false },
        { fullName: "Juliana Lima", email: "juliana@teste.com", password: "senha123", isAdmin: false },
        { fullName: "Roberto Alves", email: "roberto@teste.com", password: "senha123", isAdmin: false },
        { fullName: "Fernanda Souza", email: "fernanda@teste.com", password: "senha123", isAdmin: false },
        { fullName: "Lucas Martins", email: "lucas@teste.com", password: "senha123", isAdmin: false },
        { fullName: "Patricia Rocha", email: "patricia@teste.com", password: "senha123", isAdmin: false },
      ];

      const createdUsers = [];
      const skippedUsers = [];

      for (const userData of testUsers) {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser) {
          skippedUsers.push(userData.email);
          continue;
        }

        const hashedPassword = await hashPassword(userData.password);
        const user = await storage.createUser({
          fullName: userData.fullName,
          email: userData.email,
          password: hashedPassword,
          isAdmin: userData.isAdmin,
          isMember: true,
        });

        createdUsers.push({
          email: user.email,
          fullName: user.fullName,
          isAdmin: user.isAdmin,
        });
      }

      res.json({
        message: "Usuários de teste criados com sucesso",
        created: createdUsers,
        skipped: skippedUsers,
        credentials: {
          admin: { email: "admin@teste.com", password: "senha123" },
          members: { email: "qualquer@teste.com", password: "senha123" }
        }
      });
    } catch (error) {
      console.error("Seed test users error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao criar usuários de teste" 
      });
    }
  });

  // Public route to verify PDF authenticity
  app.get("/api/verify/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      
      if (!hash) {
        return res.status(400).json({ message: "Hash de verificação não fornecido" });
      }

      const verification = await storage.getPdfVerification(hash);
      
      if (!verification) {
        return res.status(404).json({ 
          verified: false,
          message: "Este documento não pôde ser verificado. O hash não foi encontrado no sistema." 
        });
      }

      res.json({
        verified: true,
        electionName: verification.electionName,
        electionId: verification.electionId,
        presidentName: verification.presidentName,
        createdAt: verification.createdAt,
        electionCreatedAt: verification.electionCreatedAt,
        electionClosedAt: verification.electionClosedAt,
      });
    } catch (error) {
      console.error("Verify PDF error:", error);
      res.status(500).json({ 
        verified: false,
        message: error instanceof Error ? error.message : "Erro ao verificar documento" 
      });
    }
  });

  // Route to save PDF verification hash
  app.post("/api/elections/:electionId/audit/save-hash", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const electionId = parseInt(req.params.electionId);
      const { verificationHash, presidentName } = req.body;

      if (!verificationHash) {
        return res.status(400).json({ message: "Hash de verificação é obrigatório" });
      }

      const verification = await storage.createPdfVerification(electionId, verificationHash, presidentName);
      res.json(verification);
    } catch (error) {
      console.error("Save verification hash error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao salvar hash de verificação" 
      });
    }
  });

  // ==================== STUDY SYSTEM ROUTES ====================

  // Get study profile for current user
  app.get("/api/study/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const profile = await storage.getOrCreateStudyProfile(req.user.id);
      res.json(profile);
    } catch (error) {
      console.error("Get study profile error:", error);
      res.status(500).json({ message: "Erro ao buscar perfil de estudo" });
    }
  });

  // Get all published study weeks
  app.get("/api/study/weeks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const weeks = await storage.getPublishedStudyWeeks();
      res.json(weeks);
    } catch (error) {
      console.error("Get study weeks error:", error);
      res.status(500).json({ message: "Erro ao buscar semanas de estudo" });
    }
  });

  // Get a specific study week with lessons
  app.get("/api/study/weeks/:weekId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const weekId = parseInt(req.params.weekId);
      const week = await storage.getStudyWeekById(weekId);
      if (!week) {
        return res.status(404).json({ message: "Semana de estudo nao encontrada" });
      }
      const lessons = await storage.getLessonsWithProgress(req.user.id, weekId);
      res.json({ ...week, lessons });
    } catch (error) {
      console.error("Get study week error:", error);
      res.status(500).json({ message: "Erro ao buscar semana de estudo" });
    }
  });

  // Get a specific lesson with units
  app.get("/api/study/lessons/:lessonId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const lessonId = parseInt(req.params.lessonId);
      const lesson = await storage.getLessonById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Licao nao encontrada" });
      }
      const units = await storage.getUnitsByLessonId(lessonId);
      const progress = await storage.getUserLessonProgress(req.user.id, lessonId);
      res.json({ ...lesson, units, progress });
    } catch (error) {
      console.error("Get lesson error:", error);
      res.status(500).json({ message: "Erro ao buscar licao" });
    }
  });

  // Start a lesson
  app.post("/api/study/lessons/:lessonId/start", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const lessonId = parseInt(req.params.lessonId);
      const profile = await storage.getOrCreateStudyProfile(req.user.id);
      
      if (profile.hearts <= 0) {
        return res.status(400).json({ 
          message: "Voce nao tem vidas suficientes. Leia versiculos biblicos para recuperar.",
          heartsNeeded: true
        });
      }
      
      const progress = await storage.startLesson(req.user.id, lessonId);
      res.json(progress);
    } catch (error) {
      console.error("Start lesson error:", error);
      res.status(500).json({ message: "Erro ao iniciar licao" });
    }
  });

  // Submit answer for a unit
  app.post("/api/study/units/:unitId/answer", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const unitId = parseInt(req.params.unitId);
      const { answer } = req.body;

      if (answer === undefined) {
        return res.status(400).json({ message: "O campo answer e obrigatorio" });
      }

      const result = await storage.submitUnitAnswer(req.user.id, unitId, answer);
      const profile = await storage.getStudyProfile(req.user.id);
      
      res.json({ 
        unitProgress: result.unitProgress, 
        profile,
        correct: result.isCorrect,
        explanation: result.explanation
      });
    } catch (error) {
      console.error("Submit answer error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao submeter resposta" 
      });
    }
  });

  // Mark a unit as completed (for text/reading units)
  app.post("/api/study/units/:unitId/complete", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const unitId = parseInt(req.params.unitId);
      
      const result = await storage.markUnitAsCompleted(req.user.id, unitId);
      const profile = await storage.getStudyProfile(req.user.id);
      
      res.json({ 
        unitProgress: result.unitProgress, 
        profile,
        xpAwarded: result.xpAwarded
      });
    } catch (error) {
      console.error("Complete unit error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao completar unidade" 
      });
    }
  });

  // Complete a lesson
  app.post("/api/study/lessons/:lessonId/complete", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const lessonId = parseInt(req.params.lessonId);
      const { xpEarned, mistakesCount, timeSpentSeconds } = req.body;

      const progress = await storage.completeLesson(
        req.user.id, 
        lessonId, 
        xpEarned || 0, 
        mistakesCount || 0, 
        timeSpentSeconds || 0,
        mistakesCount === 0
      );
      const profile = await storage.getStudyProfile(req.user.id);
      
      res.json({ progress, profile });
    } catch (error) {
      console.error("Complete lesson error:", error);
      res.status(500).json({ message: "Erro ao completar licao" });
    }
  });

  // Get all bible verses
  app.get("/api/study/verses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const verses = await storage.getUnreadVersesForUser(req.user.id);
      res.json(verses);
    } catch (error) {
      console.error("Get verses error:", error);
      res.status(500).json({ message: "Erro ao buscar versiculos" });
    }
  });

  // Read a verse to recover heart (3 verses = +1 heart)
  app.post("/api/study/verses/:verseId/read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const verseId = parseInt(req.params.verseId);
      const verse = await storage.getBibleVerseById(verseId);
      
      if (!verse) {
        return res.status(404).json({ message: "Versiculo nao encontrado" });
      }

      const result = await storage.readVerseAndRecoverHeart(req.user.id, verseId);
      res.json({ 
        verse, 
        profile: result.profile, 
        heartRecovered: result.heartRecovered,
        versesRead: result.versesRead,
        versesNeeded: result.versesNeeded
      });
    } catch (error) {
      console.error("Read verse error:", error);
      res.status(500).json({ message: "Erro ao ler versiculo" });
    }
  });

  // Get verse recovery progress
  app.get("/api/study/verses/recovery-progress", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const progress = await storage.getVerseRecoveryProgress(req.user.id);
      res.json(progress);
    } catch (error) {
      console.error("Get verse recovery progress error:", error);
      res.status(500).json({ message: "Erro ao buscar progresso" });
    }
  });

  // Get all achievements
  app.get("/api/study/achievements", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const allAchievements = await storage.getAllAchievements();
      const userAchievements = await storage.getUserAchievements(req.user.id);
      const unlockedCodes = new Set(userAchievements.map(a => a.code));
      
      const achievements = allAchievements.map(achievement => ({
        ...achievement,
        unlocked: unlockedCodes.has(achievement.code),
        unlockedAt: userAchievements.find(ua => ua.code === achievement.code)?.unlockedAt || null
      }));
      
      res.json(achievements);
    } catch (error) {
      console.error("Get achievements error:", error);
      res.status(500).json({ message: "Erro ao buscar conquistas" });
    }
  });

  // Get leaderboard
  app.get("/api/study/leaderboard", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const periodType = (req.query.period as string) || 'weekly';
      const now = new Date();
      let periodKey: string;
      
      if (periodType === 'weekly') {
        const weekNumber = Math.ceil((now.getDate() + now.getDay()) / 7);
        periodKey = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
      } else if (periodType === 'monthly') {
        periodKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      } else {
        periodKey = now.getFullYear().toString();
      }

      const leaderboard = await storage.getLeaderboard(periodType, periodKey, 20);
      res.json({ periodType, periodKey, entries: leaderboard });
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ message: "Erro ao buscar ranking" });
    }
  });

  // Admin: Seed study data (development only)
  app.post("/api/study/seed", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const results = {
        verses: 0,
        achievements: 0,
        weeks: 0,
        lessons: 0,
        units: 0
      };

      // Check if verses already exist
      const existingVerses = await storage.getAllBibleVerses();
      if (existingVerses.length === 0) {
        // Seed Bible verses for heart recovery
        const verses = [
          { reference: "Joao 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nele cre nao pereca, mas tenha a vida eterna.", reflection: "O amor de Deus e incondicional e oferece salvacao a todos.", category: "amor" },
          { reference: "Salmos 23:1", text: "O Senhor e o meu pastor; nada me faltara.", reflection: "Deus cuida de nos como um pastor cuida de suas ovelhas.", category: "provisao" },
          { reference: "Filipenses 4:13", text: "Posso todas as coisas naquele que me fortalece.", reflection: "Cristo nos da forca para enfrentar qualquer situacao.", category: "forca" },
          { reference: "Jeremias 29:11", text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e nao de mal, para vos dar o fim que esperais.", reflection: "Deus tem planos de esperanca e futuro para nos.", category: "esperanca" },
          { reference: "Isaias 41:10", text: "Nao temas, porque eu sou contigo; nao te assombres, porque eu sou teu Deus; eu te fortaleco, e te ajudo, e te sustento com a destra da minha justica.", reflection: "Deus esta sempre conosco para nos fortalecer.", category: "forca" },
          { reference: "Romanos 8:28", text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que sao chamados segundo o seu proposito.", reflection: "Deus transforma todas as situacoes para o nosso bem.", category: "esperanca" },
          { reference: "Salmos 46:1", text: "Deus e o nosso refugio e fortaleza, socorro bem presente na angustia.", reflection: "Podemos confiar em Deus em todos os momentos.", category: "protecao" },
          { reference: "Mateus 11:28", text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reflection: "Jesus oferece descanso para nossas almas.", category: "descanso" },
          { reference: "Proverbios 3:5-6", text: "Confia no Senhor de todo o teu coracao, e nao te estribes no teu proprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitara as tuas veredas.", reflection: "Confiar em Deus nos guia pelo caminho certo.", category: "sabedoria" },
          { reference: "1 Corintios 10:13", text: "Nao veio sobre vos tentacao, senao humana; mas fiel e Deus, que nao vos deixara tentar acima do que podeis, antes com a tentacao dara tambem o escape, para que a possais suportar.", reflection: "Deus sempre nos da um caminho de saida nas tentacoes.", category: "forca" },
          { reference: "Salmos 119:105", text: "Lampada para os meus pes e a tua palavra, e luz para o meu caminho.", reflection: "A Palavra de Deus ilumina nossa vida.", category: "sabedoria" },
          { reference: "2 Timoteo 1:7", text: "Porque Deus nao nos deu o espirito de temor, mas de fortaleza, e de amor, e de moderacao.", reflection: "Deus nos capacita com coragem e amor.", category: "coragem" },
          { reference: "Hebreus 11:1", text: "Ora, a fe e o firme fundamento das coisas que se esperam, e a prova das coisas que se nao veem.", reflection: "A fe e a certeza do que esperamos em Deus.", category: "fe" },
          { reference: "Romanos 12:2", text: "E nao sede conformados com este mundo, mas sede transformados pela renovacao do vosso entendimento, para que experimenteis qual seja a boa, agradavel, e perfeita vontade de Deus.", reflection: "Devemos buscar a transformacao em Cristo.", category: "transformacao" },
          { reference: "Galatas 5:22-23", text: "Mas o fruto do Espirito e: amor, gozo, paz, longanimidade, benignidade, bondade, fe, mansidao, temperanca. Contra estas coisas nao ha lei.", reflection: "O Espirito Santo produz frutos em nossa vida.", category: "espirito" }
        ];

        for (const verse of verses) {
          await storage.createBibleVerse(verse.reference, verse.text, verse.reflection, verse.category);
          results.verses++;
        }
      }

      // Check if achievements already exist
      const existingAchievements = await storage.getAllAchievements();
      if (existingAchievements.length === 0) {
        // Seed achievements
        const achievements = [
          { code: "first_lesson", name: "Primeiro Passo", description: "Complete sua primeira licao", icon: "Trophy", xpReward: 50, category: "progress" },
          { code: "streak_3", name: "Constante", description: "Mantenha uma sequencia de 3 dias", icon: "Flame", xpReward: 30, category: "streak" },
          { code: "streak_7", name: "Dedicado", description: "Mantenha uma sequencia de 7 dias", icon: "Flame", xpReward: 100, category: "streak" },
          { code: "streak_30", name: "Imbativel", description: "Mantenha uma sequencia de 30 dias", icon: "Flame", xpReward: 500, category: "streak" },
          { code: "perfect_lesson", name: "Perfeito!", description: "Complete uma licao sem erros", icon: "Star", xpReward: 25, category: "performance" },
          { code: "perfect_week", name: "Semana Perfeita", description: "Complete todas as licoes de uma semana sem erros", icon: "Crown", xpReward: 200, category: "performance" },
          { code: "early_bird", name: "Madrugador", description: "Estude antes das 7h da manha", icon: "Sun", xpReward: 30, category: "time" },
          { code: "night_owl", name: "Coruja Noturna", description: "Estude apos as 22h", icon: "Moon", xpReward: 30, category: "time" },
          { code: "bookworm", name: "Leitor Voraz", description: "Leia 10 versiculos biblicos", icon: "BookOpen", xpReward: 50, category: "reading" },
          { code: "level_5", name: "Aprendiz", description: "Alcance o nivel 5", icon: "Award", xpReward: 100, category: "level" },
          { code: "level_10", name: "Estudante", description: "Alcance o nivel 10", icon: "Award", xpReward: 200, category: "level" },
          { code: "level_25", name: "Mestre", description: "Alcance o nivel 25", icon: "Award", xpReward: 500, category: "level" },
          { code: "speed_demon", name: "Veloz", description: "Complete uma licao em menos de 2 minutos", icon: "Zap", xpReward: 40, category: "performance" },
          { code: "comeback_kid", name: "Nunca Desisto", description: "Recupere todas as vidas usando versiculos", icon: "Heart", xpReward: 30, category: "recovery" },
          { code: "top_10", name: "Elite", description: "Fique entre os 10 primeiros do ranking semanal", icon: "Medal", xpReward: 150, category: "ranking" }
        ];

        for (const achievement of achievements) {
          await storage.createAchievement(achievement);
          results.achievements++;
        }
      }

      // Check if study weeks already exist
      const existingWeeks = await storage.getPublishedStudyWeeks();
      if (existingWeeks.length === 0) {
        // Create a sample study week based on "Nao jogue sua vida fora"
        const week = await storage.createStudyWeek({
          weekNumber: 1,
          year: 2025,
          title: "Nao Jogue Sua Vida Fora",
          description: "Estudo sobre o proposito da vida e como viver de acordo com a vontade de Deus"
        });
        results.weeks++;

        // Create lessons for the week
        const lessonsData = [
          { 
            orderIndex: 0, 
            title: "O Valor da Vida", 
            type: "study", 
            description: "Entenda o verdadeiro valor que Deus da a sua vida",
            xpReward: 15,
            estimatedMinutes: 5
          },
          { 
            orderIndex: 1, 
            title: "Proposito Divino", 
            type: "study", 
            description: "Descubra o proposito que Deus tem para voce",
            xpReward: 15,
            estimatedMinutes: 5
          },
          { 
            orderIndex: 2, 
            title: "Decisoes que Importam", 
            type: "study", 
            description: "Aprenda a tomar decisoes sabias para sua vida",
            xpReward: 15,
            estimatedMinutes: 5
          },
          { 
            orderIndex: 3, 
            title: "Vivendo com Proposito", 
            type: "study", 
            description: "Coloque em pratica o que aprendeu",
            xpReward: 20,
            estimatedMinutes: 7
          },
          { 
            orderIndex: 4, 
            title: "Desafio da Semana", 
            type: "challenge", 
            description: "Teste seus conhecimentos sobre a revista",
            xpReward: 30,
            estimatedMinutes: 10,
            isBonus: true
          }
        ];

        for (const lessonData of lessonsData) {
          const lesson = await storage.createStudyLesson({
            studyWeekId: week.id,
            ...lessonData
          });
          results.lessons++;

          // Create units (exercises) for each lesson
          if (lessonData.orderIndex === 0) {
            // Lesson 1: O Valor da Vida
            const units = [
              {
                type: "multiple_choice",
                content: {
                  question: "Segundo a Biblia, o que faz a vida humana ter tanto valor?",
                  options: [
                    "Nossas conquistas materiais",
                    "Fomos criados a imagem e semelhanca de Deus",
                    "Nossa posicao social",
                    "Nossa inteligencia"
                  ],
                  correctIndex: 1,
                  explanation: "Genesis 1:27 nos ensina que fomos criados a imagem de Deus, isso nos da valor unico."
                },
                xpValue: 3
              },
              {
                type: "true_false",
                content: {
                  statement: "Deus conhecia voce antes mesmo de nascer e ja tinha planos para sua vida.",
                  isTrue: true,
                  reference: "Jeremias 1:5",
                  explanation: "Deus diz: 'Antes que te formasse no ventre te conheci, e antes que saísses da madre, te santifiquei'."
                },
                xpValue: 2
              },
              {
                type: "fill_blank",
                content: {
                  sentence: "Porque Deus amou o _____ de tal maneira que deu o seu Filho unigenito.",
                  correctAnswer: "mundo",
                  reference: "Joao 3:16",
                  hint: "Pense em toda a humanidade"
                },
                xpValue: 3
              },
              {
                type: "multiple_choice",
                content: {
                  question: "O que significa 'nao jogar sua vida fora'?",
                  options: [
                    "Acumular riquezas para o futuro",
                    "Viver de acordo com o proposito de Deus",
                    "Evitar todos os riscos na vida",
                    "Fazer apenas o que nos agrada"
                  ],
                  correctIndex: 1,
                  explanation: "Viver com proposito significa alinhar nossa vida com os planos de Deus para nos."
                },
                xpValue: 3
              }
            ];

            for (let i = 0; i < units.length; i++) {
              await storage.createStudyUnit({
                lessonId: lesson.id,
                orderIndex: i,
                type: units[i].type,
                content: units[i].content,
                xpValue: units[i].xpValue
              });
              results.units++;
            }
          } else if (lessonData.orderIndex === 1) {
            // Lesson 2: Proposito Divino
            const units = [
              {
                type: "multiple_choice",
                content: {
                  question: "Qual e o proposito principal do ser humano segundo Eclesiastes?",
                  options: [
                    "Buscar prazeres e diversao",
                    "Acumular conhecimento",
                    "Temer a Deus e guardar seus mandamentos",
                    "Conquistar sucesso profissional"
                  ],
                  correctIndex: 2,
                  explanation: "Eclesiastes 12:13 diz: 'Teme a Deus, e guarda os seus mandamentos; porque isto e o dever de todo o homem'."
                },
                xpValue: 3
              },
              {
                type: "true_false",
                content: {
                  statement: "Deus tem um plano especifico e unico para cada pessoa.",
                  isTrue: true,
                  reference: "Jeremias 29:11",
                  explanation: "Deus conhece os planos que tem para nos, planos de paz e nao de mal."
                },
                xpValue: 2
              },
              {
                type: "multiple_choice",
                content: {
                  question: "Como podemos descobrir nosso proposito divino?",
                  options: [
                    "Atraves da oracao e estudo da Biblia",
                    "Consultando horoscopos",
                    "Seguindo nossos impulsos",
                    "Imitando pessoas famosas"
                  ],
                  correctIndex: 0,
                  explanation: "A oracao e a Palavra de Deus sao os meios pelos quais Deus nos revela Sua vontade."
                },
                xpValue: 3
              },
              {
                type: "fill_blank",
                content: {
                  sentence: "Eu vim para que tenham _____ e a tenham em abundancia.",
                  correctAnswer: "vida",
                  reference: "Joao 10:10",
                  hint: "O oposto de morte"
                },
                xpValue: 3
              }
            ];

            for (let i = 0; i < units.length; i++) {
              await storage.createStudyUnit({
                lessonId: lesson.id,
                orderIndex: i,
                type: units[i].type,
                content: units[i].content,
                xpValue: units[i].xpValue
              });
              results.units++;
            }
          } else if (lessonData.orderIndex === 2) {
            // Lesson 3: Decisoes que Importam
            const units = [
              {
                type: "multiple_choice",
                content: {
                  question: "Qual deve ser a base para nossas decisoes importantes?",
                  options: [
                    "Opiniao dos amigos",
                    "A Palavra de Deus e oracao",
                    "Tendencias da sociedade",
                    "Nossos sentimentos momentaneos"
                  ],
                  correctIndex: 1,
                  explanation: "Proverbios 3:5-6 nos ensina a confiar no Senhor e reconhece-Lo em todos os nossos caminhos."
                },
                xpValue: 3
              },
              {
                type: "true_false",
                content: {
                  statement: "Pequenas decisoes diarias nao afetam nosso destino espiritual.",
                  isTrue: false,
                  explanation: "Cada decisao, por menor que seja, contribui para formar nosso carater e caminho."
                },
                xpValue: 2
              },
              {
                type: "multiple_choice",
                content: {
                  question: "O que acontece quando seguimos nosso proprio entendimento sem consultar a Deus?",
                  options: [
                    "Sempre damos certo",
                    "Podemos nos desviar do caminho de Deus",
                    "Nao faz diferenca",
                    "Deus fica satisfeito com nossa independencia"
                  ],
                  correctIndex: 1,
                  explanation: "Proverbios 14:12 diz: 'Ha um caminho que ao homem parece direito, mas o fim dele sao os caminhos da morte'."
                },
                xpValue: 3
              },
              {
                type: "fill_blank",
                content: {
                  sentence: "Confia no Senhor de todo o teu _____, e nao te estribes no teu proprio entendimento.",
                  correctAnswer: "coracao",
                  reference: "Proverbios 3:5",
                  hint: "Orgao que representa nossos sentimentos e vontade"
                },
                xpValue: 3
              }
            ];

            for (let i = 0; i < units.length; i++) {
              await storage.createStudyUnit({
                lessonId: lesson.id,
                orderIndex: i,
                type: units[i].type,
                content: units[i].content,
                xpValue: units[i].xpValue
              });
              results.units++;
            }
          } else if (lessonData.orderIndex === 3) {
            // Lesson 4: Vivendo com Proposito
            const units = [
              {
                type: "multiple_choice",
                content: {
                  question: "Como podemos viver cada dia com proposito?",
                  options: [
                    "Fazendo apenas o que nos agrada",
                    "Buscando primeiro o Reino de Deus e Sua justica",
                    "Focando apenas em nossa carreira",
                    "Evitando compromissos"
                  ],
                  correctIndex: 1,
                  explanation: "Mateus 6:33 nos ensina a buscar primeiro o Reino de Deus, e tudo mais nos sera acrescentado."
                },
                xpValue: 3
              },
              {
                type: "true_false",
                content: {
                  statement: "Servir aos outros e uma forma de viver com proposito segundo Jesus.",
                  isTrue: true,
                  reference: "Marcos 10:45",
                  explanation: "Jesus disse que veio para servir e dar Sua vida, e nos devemos seguir Seu exemplo."
                },
                xpValue: 2
              },
              {
                type: "multiple_choice",
                content: {
                  question: "Qual e o maior mandamento segundo Jesus?",
                  options: [
                    "Guardar o sabado",
                    "Dar dizimos",
                    "Amar a Deus de todo coracao e ao proximo como a si mesmo",
                    "Ir a igreja todos os domingos"
                  ],
                  correctIndex: 2,
                  explanation: "Em Mateus 22:37-39, Jesus resume toda a lei no amor a Deus e ao proximo."
                },
                xpValue: 3
              },
              {
                type: "fill_blank",
                content: {
                  sentence: "Portanto ide, fazei _____ de todas as nacoes.",
                  correctAnswer: "discipulos",
                  reference: "Mateus 28:19",
                  hint: "Seguidores de Jesus"
                },
                xpValue: 3
              },
              {
                type: "multiple_choice",
                content: {
                  question: "O que podemos fazer hoje para nao 'jogar nossa vida fora'?",
                  options: [
                    "Buscar Deus em primeiro lugar em todas as decisoes",
                    "Ignorar os conselhos biblicos",
                    "Viver apenas para nos mesmos",
                    "Adiar nosso relacionamento com Deus"
                  ],
                  correctIndex: 0,
                  explanation: "Colocar Deus em primeiro lugar e a chave para uma vida com proposito e significado."
                },
                xpValue: 4
              }
            ];

            for (let i = 0; i < units.length; i++) {
              await storage.createStudyUnit({
                lessonId: lesson.id,
                orderIndex: i,
                type: units[i].type,
                content: units[i].content,
                xpValue: units[i].xpValue
              });
              results.units++;
            }
          } else if (lessonData.orderIndex === 4) {
            // Bonus Challenge
            const units = [
              {
                type: "multiple_choice",
                content: {
                  question: "Qual versiculo fala sobre Deus nos conhecer antes de nascermos?",
                  options: [
                    "Joao 3:16",
                    "Jeremias 1:5",
                    "Salmos 23:1",
                    "Genesis 1:1"
                  ],
                  correctIndex: 1,
                  explanation: "Jeremias 1:5: 'Antes que te formasse no ventre te conheci'."
                },
                xpValue: 4
              },
              {
                type: "true_false",
                content: {
                  statement: "Segundo Eclesiastes, o dever de todo homem e temer a Deus e guardar seus mandamentos.",
                  isTrue: true,
                  reference: "Eclesiastes 12:13"
                },
                xpValue: 3
              },
              {
                type: "fill_blank",
                content: {
                  sentence: "Buscai primeiro o _____ de Deus e a sua justica.",
                  correctAnswer: "Reino",
                  reference: "Mateus 6:33",
                  hint: "Onde Deus reina"
                },
                xpValue: 4
              },
              {
                type: "multiple_choice",
                content: {
                  question: "Qual livro da Biblia fala 'Ha caminho que ao homem parece direito, mas o fim dele sao caminhos de morte'?",
                  options: [
                    "Salmos",
                    "Proverbios",
                    "Eclesiastes",
                    "Isaias"
                  ],
                  correctIndex: 1,
                  explanation: "Este versiculo esta em Proverbios 14:12."
                },
                xpValue: 4
              },
              {
                type: "true_false",
                content: {
                  statement: "Jesus disse que veio para que tenhamos vida e vida em abundancia.",
                  isTrue: true,
                  reference: "Joao 10:10"
                },
                xpValue: 3
              },
              {
                type: "multiple_choice",
                content: {
                  question: "Quantos mandamentos Jesus resumiu toda a lei?",
                  options: [
                    "Dez",
                    "Cinco",
                    "Dois",
                    "Tres"
                  ],
                  correctIndex: 2,
                  explanation: "Jesus resumiu em dois: Amar a Deus e amar ao proximo (Mateus 22:37-40)."
                },
                xpValue: 5
              }
            ];

            for (let i = 0; i < units.length; i++) {
              await storage.createStudyUnit({
                lessonId: lesson.id,
                orderIndex: i,
                type: units[i].type,
                content: units[i].content,
                xpValue: units[i].xpValue
              });
              results.units++;
            }
          }
        }
      }

      res.json({
        message: "Dados de estudo criados com sucesso",
        results
      });
    } catch (error) {
      console.error("Seed study data error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao criar dados de estudo" 
      });
    }
  });

  // Admin: Get all study weeks (including drafts) - admin or espiritualidade
  app.get("/api/study/admin/weeks", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const weeks = await storage.getAllStudyWeeks();
      res.json(weeks);
    } catch (error) {
      console.error("Get admin weeks error:", error);
      res.status(500).json({ message: "Erro ao buscar semanas" });
    }
  });

  // Admin: Get study stats - admin or espiritualidade
  app.get("/api/study/admin/stats", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getStudyStats();
      res.json(stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Erro ao buscar estatisticas" });
    }
  });

  // Admin: Get lessons for a week - admin or espiritualidade
  app.get("/api/study/admin/lessons", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const weekId = parseInt(req.query.weekId as string);
      if (!weekId) {
        return res.status(400).json({ message: "ID da semana e obrigatorio" });
      }
      const lessons = await storage.getLessonsForWeek(weekId);
      res.json(lessons);
    } catch (error) {
      console.error("Get admin lessons error:", error);
      res.status(500).json({ message: "Erro ao buscar licoes" });
    }
  });

  // Admin: Create a new study week - admin or espiritualidade
  app.post("/api/study/admin/weeks", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const { title, description, weekNumber, year } = req.body;
      if (!title) {
        return res.status(400).json({ message: "Titulo e obrigatorio" });
      }
      const week = await storage.createStudyWeek({
        title,
        description: description || null,
        weekNumber: weekNumber || 1,
        year: year || new Date().getFullYear(),
        createdBy: req.user!.id
      });
      res.json(week);
    } catch (error) {
      console.error("Create week error:", error);
      res.status(500).json({ message: "Erro ao criar semana" });
    }
  });

  // Admin: Publish a study week - admin or espiritualidade
  app.post("/api/study/admin/weeks/:weekId/publish", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      const week = await storage.publishStudyWeek(weekId);
      if (!week) {
        return res.status(404).json({ message: "Semana nao encontrada" });
      }
      res.json(week);
    } catch (error) {
      console.error("Publish week error:", error);
      res.status(500).json({ message: "Erro ao publicar semana" });
    }
  });

  // ============================================
  // AI-POWERED CONTENT GENERATION ROUTES
  // ============================================

  // Check if AI is configured - admin or espiritualidade
  app.get("/api/ai/status", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      res.json({ 
        configured: isAIConfigured(),
        message: isAIConfigured() 
          ? "IA configurada e pronta para uso" 
          : "Chave de API do Gemini nao configurada"
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao verificar status da IA" });
    }
  });

  // Generate complete study week content from PDF and save to database - admin or espiritualidade
  app.post("/api/ai/generate-week-from-pdf", authenticateToken, requireAdminOrEspiritualidade, upload.single('pdf'), async (req: AuthRequest, res) => {
    try {
      if (!isAIConfigured()) {
        return res.status(503).json({ message: "IA nao configurada. Adicione a chave GEMINI_API_KEY." });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo PDF enviado." });
      }

      const weekNumber = parseInt(req.body.weekNumber);
      const year = parseInt(req.body.year);

      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 53) {
        return res.status(400).json({ message: "Numero da semana invalido. Deve ser entre 1 e 53." });
      }

      if (isNaN(year) || year < 2020 || year > 2100) {
        return res.status(400).json({ message: "Ano invalido. Deve ser entre 2020 e 2100." });
      }

      // Check if week already exists
      const existingWeek = await storage.getStudyWeekByNumber(weekNumber, year);
      if (existingWeek) {
        return res.status(409).json({ 
          message: `Ja existe conteudo para a semana ${weekNumber} de ${year}. Delete a semana existente primeiro ou escolha outra semana/ano.`,
          existingWeek
        });
      }

      // Parse PDF content
      const pdfData = await parsePdfBuffer(req.file.buffer);
      const pdfText = pdfData.text;

      if (!pdfText || pdfText.trim().length < 100) {
        return res.status(400).json({ message: "PDF muito curto ou sem texto legivel. Forneca pelo menos 100 caracteres de conteudo." });
      }

      // Generate content with AI
      const generatedContent = await generateStudyContentFromPDF(pdfText, weekNumber, year);

      // Create the week in database
      const week = await storage.createStudyWeek({
        title: generatedContent.weekTitle,
        description: generatedContent.weekDescription,
        weekNumber: weekNumber,
        year: year,
        createdBy: req.user!.id,
        aiMetadata: JSON.stringify({
          generatedAt: new Date().toISOString(),
          model: "gemini-2.0-flash",
          source: "pdf",
          lessonsCount: generatedContent.lessons.length
        })
      });

      // Create lessons and units
      let totalLessons = 0;
      let totalUnits = 0;

      for (let i = 0; i < generatedContent.lessons.length; i++) {
        const lessonData = generatedContent.lessons[i];
        
        const lesson = await storage.createStudyLesson({
          studyWeekId: week.id,
          orderIndex: i,
          title: lessonData.title,
          description: lessonData.description || undefined,
          type: lessonData.type,
          xpReward: lessonData.xpReward,
          estimatedMinutes: lessonData.estimatedMinutes,
          icon: getIconForLessonType(lessonData.type),
          isBonus: false
        });
        totalLessons++;

        // Create units for this lesson - determine stage based on lesson type
        const stageMap: Record<string, string> = {
          'study': 'estude',
          'meditation': 'medite',
          'challenge': 'responda'
        };
        const stage = stageMap[lessonData.type] || 'estude';

        for (let j = 0; j < lessonData.units.length; j++) {
          const unitData = lessonData.units[j];
          
          await storage.createStudyUnit({
            lessonId: lesson.id,
            orderIndex: j,
            type: unitData.type,
            content: unitData.content,
            xpValue: unitData.xpValue,
            stage: stage
          });
          totalUnits++;
        }
      }

      res.json({
        message: "Semana criada com sucesso usando IA a partir do PDF",
        week,
        stats: {
          lessons: totalLessons,
          units: totalUnits
        }
      });
    } catch (error) {
      console.error("AI generate week from PDF error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao gerar conteudo com IA a partir do PDF" 
      });
    }
  });

  // Generate complete study week content from text - admin or espiritualidade
  app.post("/api/ai/generate-week", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      if (!isAIConfigured()) {
        return res.status(400).json({ message: "IA nao configurada. Adicione a chave GEMINI_API_KEY." });
      }

      const { text, weekNumber, year } = req.body;
      
      if (!text || text.trim().length < 100) {
        return res.status(400).json({ message: "Texto muito curto. Forneca pelo menos 100 caracteres." });
      }

      const content = await generateStudyContentFromText(
        text,
        weekNumber || 1,
        year || new Date().getFullYear()
      );

      res.json(content);
    } catch (error) {
      console.error("AI generate week error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao gerar conteudo com IA" 
      });
    }
  });

  // Generate exercises from a topic - admin or espiritualidade
  app.post("/api/ai/generate-exercises", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      if (!isAIConfigured()) {
        return res.status(400).json({ message: "IA nao configurada. Adicione a chave GEMINI_API_KEY." });
      }

      const { topic, count } = req.body;
      
      if (!topic || topic.trim().length < 10) {
        return res.status(400).json({ message: "Forneca um topico com pelo menos 10 caracteres." });
      }

      const exercises = await generateExercisesFromTopic(topic, count || 5);
      res.json({ exercises });
    } catch (error) {
      console.error("AI generate exercises error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao gerar exercicios com IA" 
      });
    }
  });

  // Generate reflection questions from text - admin or espiritualidade
  app.post("/api/ai/generate-reflections", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      if (!isAIConfigured()) {
        return res.status(400).json({ message: "IA nao configurada. Adicione a chave GEMINI_API_KEY." });
      }

      const { text, count } = req.body;
      
      if (!text || text.trim().length < 50) {
        return res.status(400).json({ message: "Texto muito curto para gerar reflexoes." });
      }

      const questions = await generateReflectionQuestions(text, count || 3);
      res.json({ questions });
    } catch (error) {
      console.error("AI generate reflections error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao gerar reflexoes com IA" 
      });
    }
  });

  // Summarize text - admin or espiritualidade
  app.post("/api/ai/summarize", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      if (!isAIConfigured()) {
        return res.status(400).json({ message: "IA nao configurada. Adicione a chave GEMINI_API_KEY." });
      }

      const { text } = req.body;
      
      if (!text || text.trim().length < 100) {
        return res.status(400).json({ message: "Texto muito curto para resumir." });
      }

      const summary = await summarizeText(text);
      res.json({ summary });
    } catch (error) {
      console.error("AI summarize error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao resumir texto com IA" 
      });
    }
  });

  // Create week with AI-generated content and save to database - admin or espiritualidade
  app.post("/api/ai/create-week-with-content", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      if (!isAIConfigured()) {
        return res.status(400).json({ message: "IA nao configurada. Adicione a chave GEMINI_API_KEY." });
      }

      const { text, weekNumber, year } = req.body;
      
      if (!text || text.trim().length < 100) {
        return res.status(400).json({ message: "Texto muito curto. Forneca pelo menos 100 caracteres." });
      }

      const currentYear = year || new Date().getFullYear();
      const currentWeekNumber = weekNumber || 1;

      // Check if week already exists
      const existingWeek = await storage.getStudyWeekByNumber(currentWeekNumber, currentYear);
      if (existingWeek) {
        return res.status(409).json({ 
          message: `Ja existe conteudo para a semana ${currentWeekNumber} de ${currentYear}. Delete a semana existente primeiro ou escolha outra semana/ano.`,
          existingWeek
        });
      }

      // Generate content with AI
      const generatedContent = await generateStudyContentFromText(text, currentWeekNumber, currentYear);

      // Create the week in database
      const week = await storage.createStudyWeek({
        title: generatedContent.weekTitle,
        description: generatedContent.weekDescription,
        weekNumber: currentWeekNumber,
        year: currentYear,
        createdBy: req.user!.id,
        aiMetadata: JSON.stringify({
          generatedAt: new Date().toISOString(),
          model: "gemini-1.5-flash",
          lessonsCount: generatedContent.lessons.length
        })
      });

      // Create lessons and units
      let totalLessons = 0;
      let totalUnits = 0;

      for (let i = 0; i < generatedContent.lessons.length; i++) {
        const lessonData = generatedContent.lessons[i];
        
        const lesson = await storage.createStudyLesson({
          studyWeekId: week.id,
          orderIndex: i,
          title: lessonData.title,
          description: lessonData.description || undefined,
          type: lessonData.type,
          xpReward: lessonData.xpReward,
          estimatedMinutes: lessonData.estimatedMinutes,
          icon: getIconForLessonType(lessonData.type),
          isBonus: false
        });
        totalLessons++;

        // Create units for this lesson - determine stage based on lesson type
        const stageMap: Record<string, string> = {
          'study': 'estude',
          'meditation': 'medite',
          'challenge': 'responda'
        };
        const stage = stageMap[lessonData.type] || 'estude';

        for (let j = 0; j < lessonData.units.length; j++) {
          const unitData = lessonData.units[j];
          
          await storage.createStudyUnit({
            lessonId: lesson.id,
            orderIndex: j,
            type: unitData.type,
            content: unitData.content,
            xpValue: unitData.xpValue,
            stage: stage
          });
          totalUnits++;
        }
      }

      res.json({
        message: "Semana criada com sucesso usando IA",
        week,
        stats: {
          lessons: totalLessons,
          units: totalUnits
        }
      });
    } catch (error) {
      console.error("AI create week error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao criar semana com IA" 
      });
    }
  });

  // Admin: Create a new lesson - admin or espiritualidade
  app.post("/api/study/admin/lessons", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const { studyWeekId, title, type, description, xpReward, estimatedMinutes, isBonus } = req.body;
      
      if (!studyWeekId || !title) {
        return res.status(400).json({ message: "ID da semana e titulo sao obrigatorios" });
      }

      const existingLessons = await storage.getLessonsForWeek(studyWeekId);
      const orderIndex = existingLessons.length;

      const lesson = await storage.createStudyLesson({
        studyWeekId,
        orderIndex,
        title,
        type: type || 'study',
        description: description || undefined,
        xpReward: xpReward || 10,
        estimatedMinutes: estimatedMinutes || 5,
        icon: getIconForLessonType(type || 'study'),
        isBonus: isBonus || false
      });

      res.json(lesson);
    } catch (error) {
      console.error("Create lesson error:", error);
      res.status(500).json({ message: "Erro ao criar licao" });
    }
  });

  // Admin: Update a lesson - admin or espiritualidade
  app.put("/api/study/admin/lessons/:lessonId", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const { title, type, description, xpReward, estimatedMinutes, isBonus, orderIndex } = req.body;

      const lesson = await storage.updateStudyLesson(lessonId, {
        title,
        type,
        description,
        xpReward,
        estimatedMinutes,
        icon: type ? getIconForLessonType(type) : undefined,
        isBonus,
        orderIndex
      });

      if (!lesson) {
        return res.status(404).json({ message: "Licao nao encontrada" });
      }

      res.json(lesson);
    } catch (error) {
      console.error("Update lesson error:", error);
      res.status(500).json({ message: "Erro ao atualizar licao" });
    }
  });

  // Admin: Delete a lesson - admin or espiritualidade
  app.delete("/api/study/admin/lessons/:lessonId", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const deleted = await storage.deleteStudyLesson(lessonId);

      if (!deleted) {
        return res.status(404).json({ message: "Licao nao encontrada" });
      }

      res.json({ message: "Licao excluida com sucesso" });
    } catch (error) {
      console.error("Delete lesson error:", error);
      res.status(500).json({ message: "Erro ao excluir licao" });
    }
  });

  // Admin: Lock a lesson - admin or espiritualidade
  app.post("/api/study/admin/lessons/:lessonId/lock", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const lesson = await storage.lockLesson(lessonId);

      if (!lesson) {
        return res.status(404).json({ message: "Licao nao encontrada" });
      }

      res.json({ message: "Licao bloqueada com sucesso", lesson });
    } catch (error) {
      console.error("Lock lesson error:", error);
      res.status(500).json({ message: "Erro ao bloquear licao" });
    }
  });

  // Admin: Unlock a lesson - admin or espiritualidade
  app.post("/api/study/admin/lessons/:lessonId/unlock", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const lesson = await storage.unlockLesson(lessonId);

      if (!lesson) {
        return res.status(404).json({ message: "Licao nao encontrada" });
      }

      res.json({ message: "Licao liberada com sucesso", lesson });
    } catch (error) {
      console.error("Unlock lesson error:", error);
      res.status(500).json({ message: "Erro ao liberar licao" });
    }
  });

  // Admin: Set unlock date for a lesson - admin or espiritualidade
  app.post("/api/study/admin/lessons/:lessonId/schedule", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const { unlockDate } = req.body;
      
      const lesson = await storage.setLessonUnlockDate(lessonId, unlockDate || null);

      if (!lesson) {
        return res.status(404).json({ message: "Licao nao encontrada" });
      }

      res.json({ message: unlockDate ? "Data de liberacao agendada" : "Agendamento removido", lesson });
    } catch (error) {
      console.error("Schedule lesson error:", error);
      res.status(500).json({ message: "Erro ao agendar liberacao" });
    }
  });

  // Admin: Unlock all lessons for a week - admin or espiritualidade
  app.post("/api/study/admin/weeks/:weekId/unlock-all", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      const count = await storage.unlockAllLessonsForWeek(weekId);

      res.json({ message: `${count} licoes liberadas com sucesso` });
    } catch (error) {
      console.error("Unlock all lessons error:", error);
      res.status(500).json({ message: "Erro ao liberar todas as licoes" });
    }
  });

  // Admin: Lock all lessons for a week - admin or espiritualidade
  app.post("/api/study/admin/weeks/:weekId/lock-all", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      const count = await storage.lockAllLessonsForWeek(weekId);

      res.json({ message: `${count} licoes bloqueadas com sucesso` });
    } catch (error) {
      console.error("Lock all lessons error:", error);
      res.status(500).json({ message: "Erro ao bloquear todas as licoes" });
    }
  });

  // Admin: Set weekly unlock schedule (one lesson per week) - admin or espiritualidade
  app.post("/api/study/admin/weeks/:weekId/schedule-weekly", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      const { startDate } = req.body;

      if (!startDate) {
        return res.status(400).json({ message: "Data inicial e obrigatoria" });
      }

      const count = await storage.setWeeklyUnlockSchedule(weekId, startDate);

      res.json({ message: `Agendamento criado para ${count} licoes (uma por semana)` });
    } catch (error) {
      console.error("Schedule weekly error:", error);
      res.status(500).json({ message: "Erro ao criar agendamento semanal" });
    }
  });

  // Admin: Get units for a lesson - admin or espiritualidade
  app.get("/api/study/admin/lessons/:lessonId/units", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const units = await storage.getUnitsForLesson(lessonId);
      res.json(units);
    } catch (error) {
      console.error("Get units error:", error);
      res.status(500).json({ message: "Erro ao buscar exercicios" });
    }
  });

  // Admin: Create a new unit - admin or espiritualidade
  app.post("/api/study/admin/units", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const { lessonId, type, content, xpValue, stage } = req.body;

      if (!lessonId || !type || !content) {
        return res.status(400).json({ message: "ID da licao, tipo e conteudo sao obrigatorios" });
      }

      // Get lesson to determine stage if not provided
      let unitStage = stage;
      if (!unitStage) {
        const lesson = await storage.getLessonById(lessonId);
        if (lesson) {
          const stageMap: Record<string, string> = {
            'study': 'estude',
            'meditation': 'medite',
            'challenge': 'responda'
          };
          unitStage = stageMap[lesson.type] || 'estude';
        }
      }

      const existingUnits = await storage.getUnitsForLesson(lessonId);
      const orderIndex = existingUnits.length;

      const unit = await storage.createStudyUnit({
        lessonId,
        orderIndex,
        type,
        content,
        xpValue: xpValue || 5,
        stage: unitStage || 'estude'
      });

      res.json(unit);
    } catch (error) {
      console.error("Create unit error:", error);
      res.status(500).json({ message: "Erro ao criar exercicio" });
    }
  });

  // Admin: Update a unit - admin or espiritualidade
  app.put("/api/study/admin/units/:unitId", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const unitId = parseInt(req.params.unitId);
      const { type, content, xpValue, orderIndex } = req.body;

      const unit = await storage.updateStudyUnit(unitId, {
        type,
        content,
        xpValue,
        orderIndex
      });

      if (!unit) {
        return res.status(404).json({ message: "Exercicio nao encontrado" });
      }

      res.json(unit);
    } catch (error) {
      console.error("Update unit error:", error);
      res.status(500).json({ message: "Erro ao atualizar exercicio" });
    }
  });

  // Admin: Delete a unit - admin or espiritualidade
  app.delete("/api/study/admin/units/:unitId", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const unitId = parseInt(req.params.unitId);
      const deleted = await storage.deleteStudyUnit(unitId);

      if (!deleted) {
        return res.status(404).json({ message: "Exercicio nao encontrado" });
      }

      res.json({ message: "Exercicio excluido com sucesso" });
    } catch (error) {
      console.error("Delete unit error:", error);
      res.status(500).json({ message: "Erro ao excluir exercicio" });
    }
  });

  // Admin: Delete a week - admin or espiritualidade
  app.delete("/api/study/admin/weeks/:weekId", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      const deleted = await storage.deleteStudyWeek(weekId);

      if (!deleted) {
        return res.status(404).json({ message: "Semana nao encontrada" });
      }

      res.json({ message: "Semana excluida com sucesso" });
    } catch (error) {
      console.error("Delete week error:", error);
      res.status(500).json({ message: "Erro ao excluir semana" });
    }
  });

  // Admin: Update a week - admin or espiritualidade
  app.put("/api/study/admin/weeks/:weekId", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      const { title, description, weekNumber, year, status } = req.body;

      const week = await storage.updateStudyWeek(weekId, {
        title,
        description,
        weekNumber,
        year,
        status
      });

      if (!week) {
        return res.status(404).json({ message: "Semana nao encontrada" });
      }

      res.json(week);
    } catch (error) {
      console.error("Update week error:", error);
      res.status(500).json({ message: "Erro ao atualizar semana" });
    }
  });

  // Admin: Seed study data with real content (resets all DeoGlory data) - admin or espiritualidade
  app.post("/api/study/admin/seed", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const { seedAllData } = await import("./seed-study-data");
      await seedAllData();
      res.json({ 
        message: "Todos os dados do sistema DeoGlory foram resetados e novos dados inseridos com sucesso",
        success: true
      });
    } catch (error) {
      console.error("Seed study data error:", error);
      res.status(500).json({ message: "Erro ao inserir dados de estudo" });
    }
  });

  // ==================== DAILY MISSIONS ROUTES ====================

  // Get user's daily missions for today
  app.get("/api/missions/daily", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Assign missions for today if not already assigned
      const missions = await storage.assignDailyMissions(userId, today);
      const content = await storage.getDailyMissionContent(today);
      
      const completedCount = missions.filter(m => m.completed).length;
      const allCompleted = missions.length > 0 && completedCount === missions.length;
      
      res.json({
        missions,
        completedCount,
        totalCount: missions.length,
        allCompleted,
        bonusXpAvailable: allCompleted ? 0 : 50,
        content,
        date: today,
      });
    } catch (error) {
      console.error("Get daily missions error:", error);
      res.status(500).json({ message: "Erro ao buscar missoes diarias" });
    }
  });

  // Get mission detail for activity page
  app.get("/api/missions/:missionId/detail", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const missionId = parseInt(req.params.missionId);
      const today = new Date().toISOString().split('T')[0];
      
      const mission = await storage.getUserMissionById(userId, missionId, today);
      
      if (!mission) {
        return res.status(404).json({ message: "Missao nao encontrada" });
      }
      
      const content = await storage.getDailyMissionContent(today);
      
      res.json({
        ...mission,
        content: content || {},
      });
    } catch (error) {
      console.error("Get mission detail error:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes da missao" });
    }
  });

  // Complete a mission
  app.post("/api/missions/:missionId/complete", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const missionId = parseInt(req.params.missionId);
      const today = new Date().toISOString().split('T')[0];
      
      const result = await storage.completeMission(userId, missionId, today);
      
      if (!result) {
        return res.status(404).json({ message: "Missao nao encontrada ou ja concluida" });
      }
      
      res.json({
        message: "Missao concluida com sucesso!",
        ...result,
      });
    } catch (error) {
      console.error("Complete mission error:", error);
      res.status(500).json({ message: "Erro ao concluir missao" });
    }
  });

  // Get daily mission content (verse, fact, character)
  app.get("/api/missions/content", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const content = await storage.getDailyMissionContent(today);
      
      res.json(content || {});
    } catch (error) {
      console.error("Get mission content error:", error);
      res.status(500).json({ message: "Erro ao buscar conteudo das missoes" });
    }
  });

  // Admin: Initialize daily missions (seed templates)
  app.post("/api/missions/admin/init", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      await storage.initializeDailyMissions();
      res.json({ message: "Missoes diarias inicializadas com sucesso" });
    } catch (error) {
      console.error("Init daily missions error:", error);
      res.status(500).json({ message: "Erro ao inicializar missoes diarias" });
    }
  });

  // ==================== NOTIFICATION ENDPOINTS ====================

  // Subscribe to push notifications
  app.post("/api/notifications/subscribe", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { endpoint, p256dh, auth } = req.body;
      
      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({ message: "Dados de inscricao invalidos" });
      }
      
      await storage.savePushSubscription(userId, endpoint, p256dh, auth);
      
      res.json({ message: "Inscrito para notificacoes com sucesso" });
    } catch (error) {
      console.error("Subscribe push error:", error);
      res.status(500).json({ message: "Erro ao inscrever para notificacoes" });
    }
  });

  // Unsubscribe from push notifications
  app.post("/api/notifications/unsubscribe", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { endpoint } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ message: "Endpoint nao fornecido" });
      }
      
      await storage.removePushSubscription(userId, endpoint);
      
      res.json({ message: "Desinscrito de notificacoes com sucesso" });
    } catch (error) {
      console.error("Unsubscribe push error:", error);
      res.status(500).json({ message: "Erro ao desinscrever de notificacoes" });
    }
  });

  // Get user notifications
  app.get("/api/notifications", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const notifications = await storage.getUserNotifications(userId, limit, offset);
      const unreadCount = await storage.getUnreadNotificationCount(userId);
      
      res.json({
        notifications,
        unreadCount,
        hasMore: notifications.length === limit,
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Erro ao buscar notificacoes" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const notificationId = parseInt(req.params.id);
      
      await storage.markNotificationRead(userId, notificationId);
      
      res.json({ message: "Notificacao marcada como lida" });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Erro ao marcar notificacao como lida" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/mark-all-read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      await storage.markAllNotificationsRead(userId);
      
      res.json({ message: "Todas as notificacoes marcadas como lidas" });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ message: "Erro ao marcar notificacoes como lidas" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const notificationId = parseInt(req.params.id);
      
      await storage.deleteNotification(userId, notificationId);
      
      res.json({ message: "Notificacao removida" });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ message: "Erro ao remover notificacao" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const count = await storage.getUnreadNotificationCount(userId);
      
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Erro ao buscar contagem de notificacoes" });
    }
  });

  // ==================== SITE CONTENT API ====================

  // Get site highlights (latest devotional, upcoming events, instagram posts)
  app.get("/api/site/highlights", async (req, res) => {
    try {
      const highlights = await storage.getSiteHighlights();
      res.json(highlights);
    } catch (error) {
      console.error("Get site highlights error:", error);
      res.status(500).json({ message: "Erro ao buscar destaques do site" });
    }
  });

  // Get all devotionals
  app.get("/api/site/devotionals", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const devotionals = await storage.getAllDevotionals(limit);
      res.json(devotionals);
    } catch (error) {
      console.error("Get devotionals error:", error);
      res.status(500).json({ message: "Erro ao buscar devocionais" });
    }
  });

  // Get single devotional by ID
  app.get("/api/site/devotionals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const devotional = await storage.getDevotionalById(id);
      if (!devotional) {
        return res.status(404).json({ message: "Devocional nao encontrado" });
      }
      res.json(devotional);
    } catch (error) {
      console.error("Get devotional by ID error:", error);
      res.status(500).json({ message: "Erro ao buscar devocional" });
    }
  });

  // Get upcoming events
  app.get("/api/site/events", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const events = await storage.getUpcomingEvents(limit);
      res.json(events);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ message: "Erro ao buscar eventos" });
    }
  });

  // Get instagram posts
  app.get("/api/site/instagram", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const posts = await storage.getLatestInstagramPosts(limit);
      res.json(posts);
    } catch (error) {
      console.error("Get instagram posts error:", error);
      res.status(500).json({ message: "Erro ao buscar posts do Instagram" });
    }
  });

  // Submit prayer request (public)
  app.post("/api/site/prayer-requests", async (req, res) => {
    try {
      const { name, whatsapp, category, request, isAnonymous } = req.body;
      
      if (!category || !request) {
        return res.status(400).json({ message: "Categoria e pedido sao obrigatorios" });
      }
      
      const prayerRequest = await storage.createPrayerRequest({
        name: isAnonymous ? null : name,
        whatsapp: isAnonymous ? null : whatsapp,
        category,
        request,
        isAnonymous: isAnonymous || false,
        status: "pending",
      });
      
      res.status(201).json({ message: "Pedido de oracao recebido com sucesso", id: prayerRequest.id });
    } catch (error) {
      console.error("Create prayer request error:", error);
      res.status(500).json({ message: "Erro ao enviar pedido de oracao" });
    }
  });

  // Get board members (public)
  app.get("/api/site/board-members", async (req, res) => {
    try {
      const currentOnly = req.query.current !== "false";
      const members = await storage.getAllBoardMembers(currentOnly);
      res.json(members);
    } catch (error) {
      console.error("Get board members error:", error);
      res.status(500).json({ message: "Erro ao buscar membros da diretoria" });
    }
  });

  // Get active banners (public)
  app.get("/api/site/banners", async (req, res) => {
    try {
      const banners = await storage.getActiveBanners();
      res.json(banners);
    } catch (error) {
      console.error("Get banners error:", error);
      res.status(500).json({ message: "Erro ao buscar banners" });
    }
  });

  // ==================== ADMIN SITE MANAGEMENT API ====================

  // Get all prayer requests (admin or marketing)
  app.get("/api/admin/prayer-requests", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin && req.user?.secretaria !== "marketing") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const status = req.query.status as string | undefined;
      const requests = await storage.getAllPrayerRequests(status);
      res.json(requests);
    } catch (error) {
      console.error("Get prayer requests error:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos de oracao" });
    }
  });

  // Update prayer request status (admin or marketing)
  app.patch("/api/admin/prayer-requests/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin && req.user?.secretaria !== "marketing") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id) || !status) {
        return res.status(400).json({ message: "ID e status sao obrigatorios" });
      }
      
      const updated = await storage.updatePrayerRequestStatus(id, status, req.user.id);
      if (!updated) {
        return res.status(404).json({ message: "Pedido nao encontrado" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update prayer request error:", error);
      res.status(500).json({ message: "Erro ao atualizar pedido de oracao" });
    }
  });

  // Get all board members (admin or marketing)
  app.get("/api/admin/board-members", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin && req.user?.secretaria !== "marketing") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const members = await storage.getAllBoardMembers(false);
      res.json(members);
    } catch (error) {
      console.error("Get board members admin error:", error);
      res.status(500).json({ message: "Erro ao buscar membros da diretoria" });
    }
  });

  // Create board member (admin or marketing)
  app.post("/api/admin/board-members", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin && req.user?.secretaria !== "marketing") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const member = await storage.createBoardMember(req.body);
      res.status(201).json(member);
    } catch (error) {
      console.error("Create board member error:", error);
      res.status(500).json({ message: "Erro ao criar membro da diretoria" });
    }
  });

  // Update board member (admin or marketing)
  app.patch("/api/admin/board-members/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin && req.user?.secretaria !== "marketing") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const updated = await storage.updateBoardMember(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Membro nao encontrado" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update board member error:", error);
      res.status(500).json({ message: "Erro ao atualizar membro da diretoria" });
    }
  });

  // Delete board member (admin or marketing)
  app.delete("/api/admin/board-members/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin && req.user?.secretaria !== "marketing") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      await storage.deleteBoardMember(id);
      res.json({ message: "Membro removido com sucesso" });
    } catch (error) {
      console.error("Delete board member error:", error);
      res.status(500).json({ message: "Erro ao remover membro da diretoria" });
    }
  });

  // Get all banners (admin or marketing)
  app.get("/api/admin/banners", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin && req.user?.secretaria !== "marketing") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const banners = await storage.getAllBanners();
      res.json(banners);
    } catch (error) {
      console.error("Get banners admin error:", error);
      res.status(500).json({ message: "Erro ao buscar banners" });
    }
  });

  // Create banner (admin or marketing)
  app.post("/api/admin/banners", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin && req.user?.secretaria !== "marketing") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const banner = await storage.createBanner({ ...req.body, createdBy: req.user.id });
      res.status(201).json(banner);
    } catch (error) {
      console.error("Create banner error:", error);
      res.status(500).json({ message: "Erro ao criar banner" });
    }
  });

  // Update banner (admin or marketing)
  app.patch("/api/admin/banners/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin && req.user?.secretaria !== "marketing") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const updated = await storage.updateBanner(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Banner nao encontrado" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update banner error:", error);
      res.status(500).json({ message: "Erro ao atualizar banner" });
    }
  });

  // Delete banner (admin or marketing)
  app.delete("/api/admin/banners/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin && req.user?.secretaria !== "marketing") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      await storage.deleteBanner(id);
      res.json({ message: "Banner removido com sucesso" });
    } catch (error) {
      console.error("Delete banner error:", error);
      res.status(500).json({ message: "Erro ao remover banner" });
    }
  });

  // Get site content (admin or marketing)
  app.get("/api/admin/site-content", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin && req.user?.secretaria !== "marketing") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const content = await storage.getAllSiteContent();
      res.json(content);
    } catch (error) {
      console.error("Get site content error:", error);
      res.status(500).json({ message: "Erro ao buscar conteudo do site" });
    }
  });

  // Update site content (admin or marketing)
  app.post("/api/admin/site-content", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin && req.user?.secretaria !== "marketing") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const content = await storage.upsertSiteContent({ ...req.body, updatedBy: req.user.id });
      res.json(content);
    } catch (error) {
      console.error("Update site content error:", error);
      res.status(500).json({ message: "Erro ao atualizar conteudo do site" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
