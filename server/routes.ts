import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { getTodayBrazilDate } from "./utils/date";
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
  insertStudyEventSchema,
  insertStudyEventLessonSchema,
  insertCollectibleCardSchema,
  calculateCardRarity,
} from "@shared/schema";
import type { AuthResponse } from "@shared/schema";
import { sendVerificationEmail, sendPasswordResetEmail, sendSeasonRankingEmail } from "./email";
import { 
  generateStudyContentFromText,
  generateEventContentFromText, 
  generateStudyContentFromPDF,
  generateExercisesFromTopic, 
  generateReflectionQuestions,
  summarizeText,
  isAIConfigured,
  generateLessonFromPDFExact,
  AIProvider
} from "./ai";
import multer from "multer";
import sharp from "sharp";
import rateLimit from "express-rate-limit";
import { moderateContent, shouldAutoReject } from "./profanity-filter";
import { 
  notifyNewDevotional, 
  notifyNewEvent, 
  notifyNewPrayerRequest, 
  notifyPrayerApproved,
  notifyNewComment,
  notifySeasonPublished,
  notifyNewLessonToAll
} from "./notifications";
import { syncInstagramPosts, isInstagramConfigured, fetchInstagramComments } from "./instagram";
import { getDailyVerse as fetchDailyVerseFromAPI } from "./bible-api";

// ==================== RATE LIMITING CONFIGURATION ====================

// Rate limiter geral para APIs publicas (100 req/15min)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisicoes por janela
  message: { message: "Muitas requisicoes. Tente novamente em alguns minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter rigoroso para autenticacao (5 req/15min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // limite de 5 tentativas
  message: { message: "Muitas tentativas de login. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para envio de codigos (3 req/hora)
const codeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // limite de 3 envios por hora
  message: { message: "Muitos codigos solicitados. Tente novamente em 1 hora." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para pedidos de oracao (10 req/hora)
const prayerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // limite de 10 pedidos por hora
  message: { message: "Muitos pedidos enviados. Tente novamente mais tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================== AUDIT LOGGING HELPER ====================

async function logAuditAction(
  userId: number | undefined,
  action: string,
  resource: string,
  resourceId?: number,
  details?: string,
  req?: { ip?: string; headers?: { [key: string]: string | string[] | undefined } }
) {
  try {
    await storage.createAuditLog({
      userId: userId || null,
      action,
      resource,
      resourceId: resourceId || null,
      details: details || null,
      ipAddress: req?.ip || null,
      userAgent: (req?.headers?.['user-agent'] as string) || null,
    });
  } catch (error) {
    console.error("[Audit Log] Failed to create log:", error);
  }
}
import { PDFParse } from "pdf-parse";

async function parsePdfBuffer(buffer: Buffer): Promise<{ text: string }> {
  console.log("[PDF Parser] Starting PDF extraction, buffer size:", buffer.length);
  const parser = new PDFParse({ data: buffer });
  let textResult = "";
  
  try {
    const result = await parser.getText();
    textResult = result.text || "";
    console.log("[PDF Parser] Extraction result - pages:", result.numpages, "text length:", textResult.length);
    
    if (textResult.trim().length < 100) {
      console.log("[PDF Parser] Insufficient text extracted. PDF must contain selectable text (not scanned images).");
    } else {
      console.log("[PDF Parser] Text extraction successful. First 500 chars:", textResult.substring(0, 500));
    }
  } catch (error) {
    console.error("[PDF Parser] Error extracting text with pdf-parse:", error);
  } finally {
    await parser.destroy();
  }
  
  return { text: textResult };
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

// Configure multer for image uploads (8MB limit)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB limit for images
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens JPEG, PNG ou WebP são permitidas'));
    }
  }
});

// Image compression settings
const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1080;
const JPEG_QUALITY = 85;

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

function getWeekKeyForLesson(): string {
  // Use Brazil timezone (America/Sao_Paulo) to calculate week number
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const brazilDateStr = formatter.format(new Date());
  const [year, month, day] = brazilDateStr.split('-').map(Number);
  
  // Create date object for Brazil's current date
  const brazilDate = new Date(year, month - 1, day);
  const startOfYear = new Date(year, 0, 1);
  const weekNumber = Math.ceil(((brazilDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

function getStageFromUnitType(unitType: string): string {
  const unitTypeToStage: Record<string, string> = {
    'text': 'estude',
    'verse': 'estude',
    'meditation': 'medite',
    'reflection': 'medite',
    'multiple_choice': 'responda',
    'true_false': 'responda',
    'fill_blank': 'responda'
  };
  return unitTypeToStage[unitType] || 'estude';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Aplicar rate limiter geral para APIs publicas do site
  app.use("/api/site", generalLimiter);

  // ==================== UPLOADS DIRECTORY ====================
  const uploadsDir = path.join(process.cwd(), "server", "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // ==================== IMAGE UPLOAD API ====================
  // Images are now stored as Base64 data URLs in the database
  // This ensures images persist across deploys on platforms like Render
  app.post("/api/upload", authenticateToken, imageUpload.single('file'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const originalSizeKB = req.file.size / 1024;
      
      try {
        // Get image metadata
        const metadata = await sharp(req.file.buffer).metadata();
        const originalWidth = metadata.width || 0;
        const originalHeight = metadata.height || 0;

        // Calculate new dimensions while preserving aspect ratio
        let width = originalWidth;
        let height = originalHeight;

        if (originalWidth > MAX_IMAGE_WIDTH || originalHeight > MAX_IMAGE_HEIGHT) {
          const aspectRatio = originalWidth / originalHeight;
          if (aspectRatio > MAX_IMAGE_WIDTH / MAX_IMAGE_HEIGHT) {
            width = MAX_IMAGE_WIDTH;
            height = Math.round(MAX_IMAGE_WIDTH / aspectRatio);
          } else {
            height = MAX_IMAGE_HEIGHT;
            width = Math.round(MAX_IMAGE_HEIGHT * aspectRatio);
          }
        }

        // Process image: resize, compress, and convert to WebP for smaller size
        const processedBuffer = await sharp(req.file.buffer)
          .resize(width, height, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const compressedSizeKB = processedBuffer.length / 1024;
        
        // Check if image is too large (max 2MB after compression)
        if (processedBuffer.length > 2 * 1024 * 1024) {
          return res.status(400).json({ 
            message: `Imagem muito grande (${compressedSizeKB.toFixed(0)}KB). Máximo permitido: 2MB após compressão.` 
          });
        }

        // Convert to Base64 data URL
        const base64 = processedBuffer.toString('base64');
        const dataUrl = `data:image/webp;base64,${base64}`;

        console.log(`[Upload] Image converted to Base64: ${originalSizeKB.toFixed(1)}KB -> ${compressedSizeKB.toFixed(1)}KB (${((1 - compressedSizeKB/originalSizeKB) * 100).toFixed(0)}% reduction)`);

        res.json({ url: dataUrl, fileName: `image_${Date.now()}.webp` });
      } catch (sharpError) {
        console.error("[Upload] Sharp error, using original as Base64:", sharpError);
        
        // Fallback: convert original to Base64 if sharp fails
        const base64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64}`;
        
        res.json({ url: dataUrl, fileName: `image_${Date.now()}` });
      }
    } catch (error) {
      console.error("[Upload] Error:", error);
      res.status(500).json({ message: "Erro ao fazer upload do arquivo" });
    }
  });

  // ==================== STATIC FILES FOR UPLOADS (Legacy support) ====================
  // Keep this for backwards compatibility with existing file-based uploads
  app.use("/uploads", (await import("express")).default.static(uploadsDir));


  app.post("/api/auth/login", authLimiter, async (req, res) => {
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

  app.post("/api/auth/request-code", codeLimiter, async (req, res) => {
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

  app.post("/api/auth/verify-code", authLimiter, async (req, res) => {
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

  app.post("/api/auth/login-password", authLimiter, async (req, res) => {
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

  // Trigger birthday emails manually for today
  app.post("/api/admin/trigger-birthday-emails", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { sendBirthdayEmails } = await import("./scheduler");
      await sendBirthdayEmails();
      res.json({ message: "E-mails de aniversário disparados com sucesso para hoje" });
    } catch (error) {
      console.error("Trigger birthday emails error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao disparar e-mails de aniversário" 
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

  // Get user statistics for profile page
  app.get("/api/study/profile/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const stats = await storage.getUserProfileStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ message: "Erro ao buscar estatisticas" });
    }
  });

  // Get recent activities for profile page
  app.get("/api/study/profile/activities", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const activities = await storage.getUserRecentActivities(req.user.id, 10);
      res.json(activities);
    } catch (error) {
      console.error("Get recent activities error:", error);
      res.status(500).json({ message: "Erro ao buscar atividades recentes" });
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
        return res.status(404).json({ message: "Semana de estudo não encontrada" });
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
        return res.status(404).json({ message: "Lição não encontrada" });
      }
      const units = await storage.getUnitsByLessonId(lessonId);
      const unitsWithParsedContent = units.map((unit: any) => ({
        ...unit,
        content: typeof unit.content === 'string' ? JSON.parse(unit.content) : unit.content
      }));
      const progress = await storage.getUserLessonProgress(req.user.id, lessonId);
      res.json({ ...lesson, units: unitsWithParsedContent, progress });
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
      
      const result = await storage.startLesson(req.user.id, lessonId);
      
      if (result.alreadyCompleted) {
        return res.status(400).json({ 
          message: "Esta licao ja foi concluida. Nao e possivel refaze-la.",
          alreadyCompleted: true,
          progress: result.progress
        });
      }
      
      res.json(result);
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

  // Complete a stage/section (estude, medite) with fixed XP
  app.post("/api/study/lessons/:lessonId/complete-stage", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      const lessonId = parseInt(req.params.lessonId);
      const { stage } = req.body;
      
      const STAGE_XP = {
        estude: 60,
        medite: 60
      };
      
      const xpToAward = STAGE_XP[stage as keyof typeof STAGE_XP];
      if (!xpToAward) {
        return res.status(400).json({ message: "Stage invalido" });
      }
      
      await storage.addStageXp(req.user.id, xpToAward, stage, lessonId);
      
      // FIXED: Also track stage XP in season progress for magazine ranking
      try {
        const lesson = await storage.getLessonById(lessonId);
        if (lesson?.seasonId) {
          const currentProgress = await storage.getUserSeasonProgress(req.user.id, lesson.seasonId);
          await storage.updateUserSeasonProgress(req.user.id, lesson.seasonId, {
            xpEarned: (currentProgress?.xpEarned || 0) + xpToAward,
          });
        }
      } catch (seasonError) {
        console.error("Error updating season progress for stage XP:", seasonError);
      }
      
      const profile = await storage.getStudyProfile(req.user.id);
      
      res.json({ 
        xpAwarded: xpToAward,
        profile,
        stage
      });
    } catch (error) {
      console.error("Complete stage error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao completar secao" 
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
      
      // Update season progress - FIXED: Track lesson completion for magazine ranking
      // NOTE: Stage XP (estude, medite) is already tracked in complete-stage endpoint
      // The lesson completion only adds the bonus XP (50) + responda XP to avoid double-counting
      // The xpEarned from frontend includes answer XP from responda + completion bonus
      try {
        const lesson = await storage.getLessonById(lessonId);
        if (lesson?.seasonId) {
          const currentProgress = await storage.getUserSeasonProgress(req.user.id, lesson.seasonId);
          // Only add the xpEarned (bonus + responda XP), stage XP already tracked separately
          await storage.updateUserSeasonProgress(req.user.id, lesson.seasonId, {
            xpEarned: (currentProgress?.xpEarned || 0) + (xpEarned || 0),
            lessonsCompleted: (currentProgress?.lessonsCompleted || 0) + 1,
          });
        }
      } catch (seasonError) {
        console.error("Error updating season progress:", seasonError);
        // Don't fail the entire request if season update fails
      }
      
      // Increment weekly lesson count for weekly goals
      const weekKey = getWeekKeyForLesson();
      await storage.incrementWeeklyLesson(req.user.id, weekKey);
      
      // Increment streak
      const streakResult = await storage.incrementStreak(req.user.id);
      
      // Check and award crystals based on criteria (perfect lesson, streaks, etc.)
      const isPerfect = mistakesCount === 0;
      const crystalRewards = await storage.checkAndAwardLessonCrystals(req.user.id, isPerfect);
      
      // Check for streak milestones
      let milestoneReward = null;
      if (streakResult.newStreak > 0) {
        milestoneReward = await storage.checkAndAwardStreakMilestone(req.user.id, streakResult.newStreak);
      }
      
      // Check and unlock achievements
      const unlockedAchievements = await storage.checkAndUnlockAchievements(req.user.id, { 
        event: 'lesson_complete', 
        value: mistakesCount === 0 ? 1 : 0 
      });
      
      // Auto-complete daily missions related to lesson completion
      const today = getTodayBrazilDate();
      try {
        // First ensure missions are assigned for today
        await storage.assignDailyMissions(req.user.id, today);
        
        // Then get the missions and complete relevant ones
        const userMissions = await storage.getUserDailyMissions(req.user.id, today);
        const missionWeekKey = getCurrentWeekKey();
        console.log(`[Missions] Checking ${userMissions.length} missions for user ${req.user.id} on ${today}`);
        
        // Check if all missions were already completed before auto-completion
        const allCompletedBefore = userMissions.length > 0 && userMissions.every(m => m.completed);
        
        for (const mission of userMissions) {
          if (mission.completed) continue;
          
          const missionType = mission.mission?.type;
          console.log(`[Missions] Checking mission ${mission.missionId} type: ${missionType}`);
          
          // Complete "complete_lesson" type missions
          if (missionType === 'complete_lesson') {
            console.log(`[Missions] Completing complete_lesson mission ${mission.missionId}`);
            await storage.completeMission(req.user.id, mission.missionId, today);
          }
          // Complete "maintain_streak" type missions
          if (missionType === 'maintain_streak') {
            console.log(`[Missions] Completing maintain_streak mission ${mission.missionId}`);
            await storage.completeMission(req.user.id, mission.missionId, today);
          }
        }
        
        // Check if ALL daily missions are now completed after auto-completion
        // Only increment if they weren't already all completed before
        if (!allCompletedBefore) {
          const updatedMissions = await storage.getUserDailyMissions(req.user.id, today);
          const allCompletedAfter = updatedMissions.length > 0 && updatedMissions.every(m => m.completed);
          if (allCompletedAfter) {
            console.log(`[Missions] All daily missions completed via auto-complete, incrementing weekly count`);
            await storage.incrementWeeklyMission(req.user.id, missionWeekKey);
          }
        }
      } catch (missionError) {
        console.error("Error updating daily missions:", missionError);
      }
      
      const profile = await storage.getStudyProfile(req.user.id);
      
      res.json({ 
        progress, 
        profile,
        streakInfo: {
          newStreak: streakResult.newStreak,
          isNewRecord: streakResult.isNewRecord,
          crystalsAwarded: crystalRewards.crystalsAwarded,
          crystalRewards: crystalRewards.rewards,
          milestoneReward
        },
        unlockedAchievements: unlockedAchievements.map(ua => ua.achievement)
      });
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
      
      // Check for achievements after reading verse
      const totalVersesRead = await storage.getTotalVersesReadByUser(req.user.id);
      let unlockedAchievements = await storage.checkAndUnlockAchievements(req.user.id, { 
        event: 'verse_read', 
        value: totalVersesRead 
      });
      
      // If heart was recovered and user now has full hearts, check for comeback_kid achievement
      // Note: result.profile is the updated profile after heart recovery
      const updatedProfile = await storage.getStudyProfile(req.user.id);
      if (result.heartRecovered && updatedProfile && updatedProfile.hearts === updatedProfile.heartsMax) {
        const comebackAchievements = await storage.checkAndUnlockAchievements(req.user.id, { 
          event: 'hearts_recovered' 
        });
        unlockedAchievements = [...unlockedAchievements, ...comebackAchievements];
      }
      
      // Return the updated profile for consistent UI state
      const finalProfile = updatedProfile || result.profile;
      res.json({ 
        verse, 
        profile: finalProfile, 
        heartRecovered: result.heartRecovered,
        versesRead: result.versesRead,
        versesNeeded: result.versesNeeded,
        unlockedAchievements: unlockedAchievements.map(ua => ua.achievement)
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
      const unlockedIds = new Set(userAchievements.map(a => a.achievementId));
      
      const achievements = allAchievements.map(achievement => ({
        ...achievement,
        unlocked: unlockedIds.has(achievement.id),
        unlockedAt: userAchievements.find(ua => ua.achievementId === achievement.id)?.unlockedAt || null
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
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const now = new Date();
      let periodKey: string;
      
      if (periodType === 'weekly') {
        // Weekly/General ranking - all XP from all sources
        const weekNumber = Math.ceil((now.getDate() + now.getDay()) / 7);
        periodKey = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
        const leaderboard = await storage.getLeaderboard(periodType, periodKey, 50);
        res.json({ periodType, periodKey, entries: leaderboard });
      } else if (periodType === 'monthly' || periodType === 'annual') {
        // Annual ranking - filter by year (Jan 1 00:00 to Dec 31 23:59)
        periodKey = year.toString();
        const leaderboard = await storage.getAnnualLeaderboard(year, 50);
        res.json({ periodType: 'annual', periodKey, year, entries: leaderboard });
      } else if (periodType === 'seasonal') {
        // Seasonal (Revista) - only lesson XP from that specific season
        if (!seasonId) {
          return res.json({ periodType, periodKey: '', entries: [] });
        }
        periodKey = `season-${seasonId}`;
        const leaderboard = await storage.getSeasonLeaderboard(seasonId, 50);
        res.json({ periodType, periodKey, seasonId, entries: leaderboard });
      } else {
        periodKey = now.getFullYear().toString();
        const leaderboard = await storage.getLeaderboard(periodType, periodKey, 50);
        res.json({ periodType, periodKey, entries: leaderboard });
      }
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ message: "Erro ao buscar ranking" });
    }
  });

  // ==================== MEMBER INTERACTION ENDPOINTS ====================

  // Update online status (heartbeat)
  app.post("/api/study/online-status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      await storage.updateUserOnlineStatus(req.user.id, true);
      res.json({ success: true });
    } catch (error) {
      console.error("Update online status error:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });

  // Get online users
  app.get("/api/study/online-users", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      const onlineUserIds = await storage.getOnlineUserIds();
      res.json({ onlineUserIds });
    } catch (error) {
      console.error("Get online users error:", error);
      res.status(500).json({ message: "Erro ao buscar usuarios online" });
    }
  });

  // Get public member profile
  app.get("/api/study/member/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      const targetUserId = parseInt(req.params.userId);
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: "ID de usuario invalido" });
      }
      
      const profile = await storage.getPublicMemberProfile(targetUserId, req.user.id);
      if (!profile) {
        return res.status(404).json({ message: "Membro nao encontrado" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Get member profile error:", error);
      res.status(500).json({ message: "Erro ao buscar perfil do membro" });
    }
  });

  // Like achievement
  app.post("/api/study/member/:userId/achievement/:achievementId/like", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      const targetUserId = parseInt(req.params.userId);
      const achievementId = parseInt(req.params.achievementId);
      
      if (isNaN(targetUserId) || isNaN(achievementId)) {
        return res.status(400).json({ message: "IDs invalidos" });
      }
      
      if (targetUserId === req.user.id) {
        return res.status(400).json({ message: "Voce nao pode curtir suas proprias conquistas" });
      }
      
      const success = await storage.likeAchievement(req.user.id, targetUserId, achievementId);
      
      // Send notification to the target user
      if (success) {
        const liker = await storage.getUserById(req.user.id);
        const achievement = await storage.getAchievementById(achievementId);
        if (liker && achievement) {
          const { notifyAchievementLiked } = await import('./notifications');
          notifyAchievementLiked(targetUserId, liker.fullName, achievement.name).catch(err => 
            console.error("[Notifications] Error notifying achievement liked:", err)
          );
        }
      }
      
      res.json({ success, liked: true });
    } catch (error) {
      console.error("Like achievement error:", error);
      res.status(500).json({ message: "Erro ao curtir conquista" });
    }
  });

  // Unlike achievement
  app.delete("/api/study/member/:userId/achievement/:achievementId/like", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      const targetUserId = parseInt(req.params.userId);
      const achievementId = parseInt(req.params.achievementId);
      
      if (isNaN(targetUserId) || isNaN(achievementId)) {
        return res.status(400).json({ message: "IDs invalidos" });
      }
      
      const success = await storage.unlikeAchievement(req.user.id, targetUserId, achievementId);
      res.json({ success, liked: false });
    } catch (error) {
      console.error("Unlike achievement error:", error);
      res.status(500).json({ message: "Erro ao remover curtida" });
    }
  });

  // Get member's collectible cards
  app.get("/api/study/member/:userId/cards", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const targetUserId = parseInt(req.params.userId);
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: "ID de usuario invalido" });
      }
      
      const userCards = await storage.getUserCards(targetUserId);
      const cardsWithDetails = await Promise.all(
        userCards.map(async (uc) => {
          const card = await storage.getCollectibleCard(uc.cardId);
          if (!card) return null;
          const event = await storage.getStudyEvent(card.eventId);
          return {
            id: uc.id,
            cardId: card.id,
            rarity: uc.rarity,
            score: uc.score,
            earnedAt: uc.earnedAt,
            card: {
              name: card.name,
              imageUrl: card.imageUrl,
              description: card.description,
            },
            event: event ? {
              id: event.id,
              title: event.title,
              theme: event.theme,
            } : null,
          };
        })
      );
      
      res.json(cardsWithDetails.filter(Boolean));
    } catch (error) {
      console.error("Get member cards error:", error);
      res.status(500).json({ message: "Erro ao buscar cards do membro" });
    }
  });

  // Send encouragement message
  app.post("/api/study/member/:userId/encourage", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      const receiverId = parseInt(req.params.userId);
      const { messageKey, messageText } = req.body;
      
      if (isNaN(receiverId)) {
        return res.status(400).json({ message: "ID de usuario invalido" });
      }
      
      if (receiverId === req.user.id) {
        return res.status(400).json({ message: "Voce nao pode enviar mensagem para si mesmo" });
      }
      
      if (!messageKey || !messageText) {
        return res.status(400).json({ message: "Mensagem invalida" });
      }
      
      // Save encouragement
      const encouragement = await storage.sendEncouragement(req.user.id, receiverId, messageKey, messageText);
      
      // Create in-app notification
      const sender = await storage.getUserById(req.user.id);
      await storage.createNotification({
        userId: receiverId,
        type: "encouragement",
        title: "Mensagem de incentivo",
        body: `${sender?.fullName || 'Um membro'} te enviou: "${messageText}"`,
        data: JSON.stringify({ senderId: req.user.id, messageKey }),
      });
      
      // Send push notification
      const { sendPushToUser } = await import('./notifications');
      await sendPushToUser(receiverId, {
        title: "Mensagem de incentivo",
        body: `${sender?.fullName || 'Um membro'}: ${messageText}`,
        url: "/study",
        tag: `encouragement-${encouragement.id}`,
      });
      
      res.json({ success: true, encouragement });
    } catch (error) {
      console.error("Send encouragement error:", error);
      res.status(500).json({ message: "Erro ao enviar mensagem" });
    }
  });

  // Get predefined encouragement messages
  app.get("/api/study/encouragement-messages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      const { PREDEFINED_ENCOURAGEMENT_MESSAGES } = await import('@shared/schema');
      // Map to expected format: key, title, body
      const messages = PREDEFINED_ENCOURAGEMENT_MESSAGES.map(msg => ({
        key: msg.key,
        title: msg.text,
        body: msg.text,
        icon: msg.icon,
      }));
      res.json({ messages });
    } catch (error) {
      console.error("Get encouragement messages error:", error);
      res.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  });

  // Get received encouragements (for notifications)
  app.get("/api/study/encouragements", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      const limit = parseInt(req.query.limit as string) || 20;
      const encouragements = await storage.getReceivedEncouragements(req.user.id, limit);
      
      // Get sender info for each encouragement
      const encouragementsWithSender = await Promise.all(
        encouragements.map(async (e) => {
          const sender = await storage.getUserById(e.senderId);
          return {
            ...e,
            senderName: sender?.fullName || 'Membro',
            senderPhotoUrl: sender?.photoUrl || null,
          };
        })
      );
      
      res.json({ encouragements: encouragementsWithSender });
    } catch (error) {
      console.error("Get encouragements error:", error);
      res.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  });

  // Admin: Send encouragement to all members
  app.post("/api/admin/study/encourage-all", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const { messageKey, messageText } = req.body;
      
      if (!messageKey || !messageText) {
        return res.status(400).json({ message: "Mensagem invalida" });
      }
      
      // Send to all members
      const sentCount = await storage.sendEncouragementToAll(req.user.id, messageKey, messageText);
      
      // Send push notification to ALL members (including inactive)
      const { sendPushToAllMembersIncludingInactive } = await import('./notifications');
      await sendPushToAllMembersIncludingInactive({
        title: "Mensagem da lideranca",
        body: messageText,
        url: "/study",
        tag: `admin-encouragement-${Date.now()}`,
      });
      
      res.json({ success: true, sentCount });
    } catch (error) {
      console.error("Encourage all error:", error);
      res.status(500).json({ message: "Erro ao enviar mensagens" });
    }
  });

  // ==================== CRYSTAL AND STREAK FREEZE ENDPOINTS ====================

  app.get("/api/study/crystals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      const balance = await storage.getCrystalBalance(req.user.id);
      const profile = await storage.getStudyProfile(req.user.id);
      
      res.json({ 
        balance,
        freezesAvailable: profile?.streakFreezesAvailable ?? 0,
        currentStreak: profile?.currentStreak ?? 0,
        longestStreak: profile?.longestStreak ?? 0,
        nextFreezeCost: 10 + ((profile?.streakFreezesAvailable ?? 0) * 10)
      });
    } catch (error) {
      console.error("Get crystals error:", error);
      res.status(500).json({ message: "Erro ao buscar cristais" });
    }
  });

  app.get("/api/study/crystals/history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getCrystalHistory(req.user.id, limit);
      
      res.json({ history });
    } catch (error) {
      console.error("Get crystal history error:", error);
      res.status(500).json({ message: "Erro ao buscar historico de cristais" });
    }
  });

  app.post("/api/study/streak/freeze/purchase", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      const result = await storage.purchaseStreakFreeze(req.user.id);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Cristais insuficientes para comprar congelamento",
          cost: result.cost,
          freezesAvailable: result.freezesAvailable
        });
      }
      
      res.json({ 
        message: "Congelamento comprado com sucesso!",
        cost: result.cost,
        freezesAvailable: result.freezesAvailable
      });
    } catch (error) {
      console.error("Purchase streak freeze error:", error);
      res.status(500).json({ message: "Erro ao comprar congelamento" });
    }
  });

  app.get("/api/study/streak/freeze/history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      const history = await storage.getStreakFreezeHistory(req.user.id);
      
      res.json({ history });
    } catch (error) {
      console.error("Get streak freeze history error:", error);
      res.status(500).json({ message: "Erro ao buscar historico de congelamentos" });
    }
  });

  app.get("/api/study/streak/milestones", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      const profile = await storage.getStudyProfile(req.user.id);
      const currentStreak = profile?.currentStreak ?? 0;
      
      const milestones = [
        { days: 7, crystalReward: 5, xpReward: 50, title: "Primeira Semana", achieved: currentStreak >= 7 },
        { days: 14, crystalReward: 10, xpReward: 75, title: "Duas Semanas", achieved: currentStreak >= 14 },
        { days: 30, crystalReward: 25, xpReward: 150, title: "Um Mes", achieved: currentStreak >= 30 },
        { days: 60, crystalReward: 50, xpReward: 300, title: "Dois Meses", achieved: currentStreak >= 60 },
        { days: 100, crystalReward: 100, xpReward: 500, title: "Centenario", achieved: currentStreak >= 100 },
        { days: 180, crystalReward: 200, xpReward: 750, title: "Meio Ano", achieved: currentStreak >= 180 },
        { days: 365, crystalReward: 500, xpReward: 1500, title: "Um Ano", achieved: currentStreak >= 365 },
      ];
      
      res.json({ milestones, currentStreak });
    } catch (error) {
      console.error("Get streak milestones error:", error);
      res.status(500).json({ message: "Erro ao buscar marcos de ofensiva" });
    }
  });

  // Get practice exercises from completed lessons
  app.get("/api/study/practice-exercises", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
      }
      
      // Get all completed lessons for this user
      const completedLessons = await storage.getCompletedLessonsWithExercises(req.user.id);
      
      // Collect all exercise units from completed lessons
      const exercises: any[] = [];
      
      for (const lesson of completedLessons) {
        const units = await storage.getUnitsByLessonId(lesson.id);
        
        for (const unit of units) {
          if (unit.stage === "responda" && 
              ["multiple_choice", "true_false", "fill_blank"].includes(unit.type)) {
            const content = typeof unit.content === 'string' ? JSON.parse(unit.content) : unit.content;
            exercises.push({
              id: unit.id,
              type: unit.type,
              stage: unit.stage,
              content,
              lessonId: lesson.id,
              lessonTitle: lesson.title
            });
          }
        }
      }
      
      res.json({ exercises });
    } catch (error) {
      console.error("Get practice exercises error:", error);
      res.status(500).json({ message: "Erro ao buscar exercicios de pratica" });
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
        // Seed achievements with requirements for auto-unlocking
        const achievements = [
          { code: "first_lesson", name: "Primeiro Passo", description: "Complete sua primeira licao", icon: "trophy", xpReward: 50, category: "lessons", requirement: JSON.stringify({ lessons: 1 }) },
          { code: "lessons_5", name: "Estudante Dedicado", description: "Complete 5 licoes", icon: "book-open", xpReward: 75, category: "lessons", requirement: JSON.stringify({ lessons: 5 }) },
          { code: "lessons_10", name: "Discipulo Fiel", description: "Complete 10 licoes", icon: "book-marked", xpReward: 150, category: "lessons", requirement: JSON.stringify({ lessons: 10 }) },
          { code: "lessons_25", name: "Mestre da Palavra", description: "Complete 25 licoes", icon: "graduation-cap", xpReward: 300, category: "lessons", requirement: JSON.stringify({ lessons: 25 }) },
          { code: "streak_3", name: "Constante", description: "Mantenha uma sequencia de 3 dias", icon: "flame", xpReward: 30, category: "streak", requirement: JSON.stringify({ streak: 3 }) },
          { code: "streak_7", name: "Dedicado", description: "Mantenha uma sequencia de 7 dias", icon: "flame", xpReward: 100, category: "streak", requirement: JSON.stringify({ streak: 7 }) },
          { code: "streak_14", name: "Perseverante", description: "Mantenha uma sequencia de 14 dias", icon: "flame", xpReward: 200, category: "streak", requirement: JSON.stringify({ streak: 14 }) },
          { code: "streak_30", name: "Imbativel", description: "Mantenha uma sequencia de 30 dias", icon: "flame", xpReward: 500, category: "streak", requirement: JSON.stringify({ streak: 30 }) },
          { code: "streak_60", name: "Lenda Viva", description: "Mantenha uma sequencia de 60 dias", icon: "crown", xpReward: 1000, category: "streak", requirement: JSON.stringify({ streak: 60 }) },
          { code: "xp_100", name: "Iniciante", description: "Alcance 100 XP", icon: "zap", xpReward: 25, category: "xp", requirement: JSON.stringify({ xp: 100 }) },
          { code: "xp_500", name: "Intermediario", description: "Alcance 500 XP", icon: "zap", xpReward: 50, category: "xp", requirement: JSON.stringify({ xp: 500 }) },
          { code: "xp_1000", name: "Avancado", description: "Alcance 1000 XP", icon: "trending-up", xpReward: 100, category: "xp", requirement: JSON.stringify({ xp: 1000 }) },
          { code: "xp_5000", name: "Expert", description: "Alcance 5000 XP", icon: "star", xpReward: 250, category: "xp", requirement: JSON.stringify({ xp: 5000 }) },
          { code: "level_5", name: "Aprendiz", description: "Alcance o nivel 5", icon: "award", xpReward: 100, category: "xp", requirement: JSON.stringify({ level: 5 }) },
          { code: "level_10", name: "Estudante", description: "Alcance o nivel 10", icon: "award", xpReward: 200, category: "xp", requirement: JSON.stringify({ level: 10 }) },
          { code: "level_25", name: "Mestre", description: "Alcance o nivel 25", icon: "crown", xpReward: 500, category: "xp", requirement: JSON.stringify({ level: 25 }) },
          { code: "perfect_lesson", name: "Perfeito!", description: "Complete uma licao sem erros", icon: "star", xpReward: 25, category: "special", isSecret: false },
          { code: "early_bird", name: "Madrugador", description: "Estude antes das 7h da manha", icon: "sunrise", xpReward: 30, category: "special", isSecret: false },
          { code: "night_owl", name: "Coruja Noturna", description: "Estude apos as 22h", icon: "moon", xpReward: 30, category: "special", isSecret: false },
          { code: "bookworm", name: "Leitor Voraz", description: "Leia 10 versiculos biblicos", icon: "book-heart", xpReward: 50, category: "special", isSecret: false },
          { code: "comeback_kid", name: "Nunca Desisto", description: "Recupere todas as vidas usando versiculos", icon: "heart", xpReward: 30, category: "special", isSecret: false },
          { code: "top_10", name: "Elite", description: "Fique entre os 10 primeiros do ranking semanal", icon: "medal", xpReward: 150, category: "special", isSecret: false }
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
              const unitType = units[i].type;
              await storage.createStudyUnit({
                lessonId: lesson.id,
                orderIndex: i,
                type: unitType,
                content: units[i].content,
                xpValue: units[i].xpValue,
                stage: getStageFromUnitType(unitType)
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
              const unitType = units[i].type;
              await storage.createStudyUnit({
                lessonId: lesson.id,
                orderIndex: i,
                type: unitType,
                content: units[i].content,
                xpValue: units[i].xpValue,
                stage: getStageFromUnitType(unitType)
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
              const unitType = units[i].type;
              await storage.createStudyUnit({
                lessonId: lesson.id,
                orderIndex: i,
                type: unitType,
                content: units[i].content,
                xpValue: units[i].xpValue,
                stage: getStageFromUnitType(unitType)
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
              const unitType = units[i].type;
              await storage.createStudyUnit({
                lessonId: lesson.id,
                orderIndex: i,
                type: unitType,
                content: units[i].content,
                xpValue: units[i].xpValue,
                stage: getStageFromUnitType(unitType)
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
              const unitType = units[i].type;
              await storage.createStudyUnit({
                lessonId: lesson.id,
                orderIndex: i,
                type: unitType,
                content: units[i].content,
                xpValue: units[i].xpValue,
                stage: getStageFromUnitType(unitType)
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
      const stats = await storage.getStudyDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  app.get("/api/study/admin/monthly-progress", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const data = await storage.getMonthlyProgressData();
      res.json(data);
    } catch (error) {
      console.error("Get monthly progress error:", error);
      res.status(500).json({ message: "Erro ao buscar progresso mensal" });
    }
  });

  app.get("/api/study/admin/weekly-activity", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const data = await storage.getWeeklyActivityData();
      res.json(data);
    } catch (error) {
      console.error("Get weekly activity error:", error);
      res.status(500).json({ message: "Erro ao buscar atividade semanal" });
    }
  });

  app.get("/api/study/admin/weekly-top-members", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const data = await storage.getTopWeeklyMembers(limit);
      res.json(data);
    } catch (error) {
      console.error("Get weekly top members error:", error);
      res.status(500).json({ message: "Erro ao buscar top membros da semana" });
    }
  });

  app.get("/api/study/admin/events-stats", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const allEvents = await storage.getAllStudyEvents();
      const now = new Date();
      
      const activeEvents = allEvents.filter(e => e.status === 'published' && new Date(e.startDate) <= now && new Date(e.endDate) >= now);
      const upcomingEvents = allEvents.filter(e => e.status === 'published' && new Date(e.startDate) > now);
      const completedEvents = allEvents.filter(e => e.status === 'completed');
      
      let totalParticipants = 0;
      let totalCardsAwarded = 0;
      
      for (const event of allEvents) {
        const lessons = await storage.getStudyEventLessons(event.id);
        for (const lesson of lessons) {
          const progress = await storage.getUserEventLessonProgress(0, lesson.id);
        }
      }
      
      const cards = await storage.getActiveCollectibleCards();
      
      res.json({
        totalEvents: allEvents.length,
        activeEvents: activeEvents.length,
        upcomingEvents: upcomingEvents.length,
        completedEvents: completedEvents.length,
        recentEvents: allEvents.slice(0, 5).map(e => ({
          id: e.id,
          title: e.title,
          theme: e.theme,
          status: e.status,
          startDate: e.startDate,
          endDate: e.endDate,
          imageUrl: e.imageUrl
        }))
      });
    } catch (error) {
      console.error("Get events stats error:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas de eventos" });
    }
  });

  // Admin: Get all users with study profiles - admin or espiritualidade
  app.get("/api/study/admin/users", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getStudyUsersWithProfiles();
      res.json(users);
    } catch (error) {
      console.error("Get study users error:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  // Admin: Recalculate all user levels based on XP - admin only
  app.post("/api/study/admin/recalculate-levels", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const result = await storage.recalculateAllLevels();
      res.json({ 
        message: `Níveis recalculados: ${result.updated} de ${result.total} perfis atualizados`,
        ...result 
      });
    } catch (error) {
      console.error("Recalculate levels error:", error);
      res.status(500).json({ message: "Erro ao recalcular níveis" });
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
        return res.status(404).json({ message: "Semana não encontrada" });
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
      const geminiKey = req.body.geminiKey || "1";
      const openaiKey = req.body.openaiKey || "1";
      const aiProvider: AIProvider = req.body.aiProvider === "openai" ? "openai" : "gemini";

      // Check AI configuration based on provider
      if (aiProvider === "gemini" && !isAIConfigured()) {
        return res.status(503).json({ message: "IA nao configurada. Adicione a chave GEMINI_API_KEY." });
      }
      if (aiProvider === "openai" && !process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "OpenAI nao configurada. Adicione a chave OPENAI_API_KEY." });
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

      // Generate content with AI using selected provider and key
      const generatedContent = await generateStudyContentFromPDF(pdfText, weekNumber, year, geminiKey, aiProvider, openaiKey);

      // Create the week in database
      const week = await storage.createStudyWeek({
        title: generatedContent.weekTitle,
        description: generatedContent.weekDescription,
        weekNumber: weekNumber,
        year: year,
        createdBy: req.user!.id,
        aiMetadata: JSON.stringify({
          generatedAt: new Date().toISOString(),
          model: "gemini-3-flash-preview",
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

        // Create units for this lesson - use unit's stage from AI, fallback to lesson type
        const stageMap: Record<string, string> = {
          'study': 'estude',
          'meditation': 'medite',
          'challenge': 'responda'
        };
        const defaultStage = stageMap[lessonData.type] || 'estude';

        for (let j = 0; j < lessonData.units.length; j++) {
          const unitData = lessonData.units[j];
          
          await storage.createStudyUnit({
            lessonId: lesson.id,
            orderIndex: j,
            type: unitData.type,
            content: unitData.content,
            xpValue: unitData.xpValue,
            stage: unitData.stage || defaultStage
          });
          totalUnits++;
        }
      }

      // Generate practice questions for the week immediately after creation
      try {
        console.log(`[Week Creation] Generating practice questions for week ${week.id}...`);
        await storage.generatePracticeQuestionsFromAI(week.id);
        console.log(`[Week Creation] Practice questions generated successfully for week ${week.id}`);
      } catch (practiceError) {
        console.error(`[Week Creation] Failed to generate practice questions for week ${week.id}:`, practiceError);
        // Don't fail the entire week creation if practice questions fail
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

      const { text, weekNumber, year, geminiKey, aiProvider, openaiKey } = req.body;
      
      if (!text || text.trim().length < 100) {
        return res.status(400).json({ message: "Texto muito curto. Forneca pelo menos 100 caracteres." });
      }

      const currentYear = year || new Date().getFullYear();
      const currentWeekNumber = weekNumber || 1;
      const selectedGeminiKey = geminiKey || "1";
      const selectedOpenaiKey = openaiKey || "1";
      const selectedProvider: AIProvider = aiProvider === "openai" ? "openai" : "gemini";

      // Check if week already exists
      const existingWeek = await storage.getStudyWeekByNumber(currentWeekNumber, currentYear);
      if (existingWeek) {
        return res.status(409).json({ 
          message: `Ja existe conteudo para a semana ${currentWeekNumber} de ${currentYear}. Delete a semana existente primeiro ou escolha outra semana/ano.`,
          existingWeek
        });
      }

      // Generate content with AI using selected key and provider
      const generatedContent = await generateStudyContentFromText(text, currentWeekNumber, currentYear, selectedGeminiKey, selectedProvider, selectedOpenaiKey);

      // Create the week in database
      const week = await storage.createStudyWeek({
        title: generatedContent.weekTitle,
        description: generatedContent.weekDescription,
        weekNumber: currentWeekNumber,
        year: currentYear,
        createdBy: req.user!.id,
        aiMetadata: JSON.stringify({
          generatedAt: new Date().toISOString(),
          model: "gemini-3-flash-preview",
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

        // Create units for this lesson - use unit's stage from AI, fallback to lesson type
        const stageMap: Record<string, string> = {
          'study': 'estude',
          'meditation': 'medite',
          'challenge': 'responda'
        };
        const defaultStage = stageMap[lessonData.type] || 'estude';

        for (let j = 0; j < lessonData.units.length; j++) {
          const unitData = lessonData.units[j];
          
          await storage.createStudyUnit({
            lessonId: lesson.id,
            orderIndex: j,
            type: unitData.type,
            content: unitData.content,
            xpValue: unitData.xpValue,
            stage: unitData.stage || defaultStage
          });
          totalUnits++;
        }
      }

      // Generate practice questions for the week immediately after creation
      try {
        console.log(`[Week Creation] Generating practice questions for week ${week.id}...`);
        await storage.generatePracticeQuestionsFromAI(week.id);
        console.log(`[Week Creation] Practice questions generated successfully for week ${week.id}`);
      } catch (practiceError) {
        console.error(`[Week Creation] Failed to generate practice questions for week ${week.id}:`, practiceError);
        // Don't fail the entire week creation if practice questions fail
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
        return res.status(404).json({ message: "Lição não encontrada" });
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
        return res.status(404).json({ message: "Lição não encontrada" });
      }

      res.json({ message: "Lição excluida com sucesso" });
    } catch (error) {
      console.error("Delete lesson error:", error);
      res.status(500).json({ message: "Erro ao excluir licao" });
    }
  });

  // Admin: Get a single lesson by ID - admin or espiritualidade
  app.get("/api/study/admin/lessons/:lessonId", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      if (isNaN(lessonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const lesson = await storage.getLessonById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lição não encontrada" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Get lesson by id error:", error);
      res.status(500).json({ message: "Erro ao buscar lição" });
    }
  });

  // Admin: PATCH a lesson (partial update including isLocked) - admin or espiritualidade
  app.patch("/api/study/admin/lessons/:lessonId", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      if (isNaN(lessonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      const { isLocked, title, description } = req.body;

      if (typeof isLocked === 'boolean') {
        const lesson = isLocked 
          ? await storage.lockLesson(lessonId)
          : await storage.unlockLesson(lessonId);
        
        if (!lesson) {
          return res.status(404).json({ message: "Lição não encontrada" });
        }
        return res.json(lesson);
      }

      const lesson = await storage.updateStudyLesson(lessonId, { title, description });
      if (!lesson) {
        return res.status(404).json({ message: "Lição não encontrada" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Patch lesson error:", error);
      res.status(500).json({ message: "Erro ao atualizar licao" });
    }
  });

  // Admin: Lock a lesson - admin or espiritualidade
  app.post("/api/study/admin/lessons/:lessonId/lock", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const lesson = await storage.lockLesson(lessonId);

      if (!lesson) {
        return res.status(404).json({ message: "Lição não encontrada" });
      }

      res.json({ message: "Lição bloqueada com sucesso", lesson });
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
        return res.status(404).json({ message: "Lição não encontrada" });
      }

      // Get week title for notification
      const week = await storage.getStudyWeekById(lesson.studyWeekId);
      if (week) {
        notifyNewLessonToAll(lesson.title, week.title).catch(err => 
          console.error("[Notifications] Error notifying new lesson:", err)
        );
      }

      res.json({ message: "Lição liberada com sucesso", lesson });
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
        return res.status(404).json({ message: "Lição não encontrada" });
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
        return res.status(404).json({ message: "Semana não encontrada" });
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
        return res.status(404).json({ message: "Semana não encontrada" });
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
      const { seedAllData } = await import("../scripts/seed-study-data");
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

  // Helper to get current daily verse date key (resets at 6 AM São Paulo time)
  function getDailyVerseDateKeyMission(): string {
    const now = new Date();
    const spTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    if (spTime.getHours() < 6) {
      spTime.setDate(spTime.getDate() - 1);
    }
    return spTime.toISOString().split('T')[0];
  }

  // Get user's daily missions for today
  app.get("/api/missions/daily", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const today = getTodayBrazilDate();
      
      // Assign missions for today if not already assigned
      let missions = await storage.assignDailyMissions(userId, today);
      const content = await storage.getDailyMissionContent(today);
      
      // Check user's profile for auto-completable missions
      const profile = await storage.getStudyProfile(userId);
      const verseDateKey = getDailyVerseDateKeyMission();
      const hasReadVerse = profile?.dailyVerseReadDate === verseDateKey;
      
      // Check if user completed a lesson today (using lastLessonCompletedAt)
      let hasCompletedLessonToday = false;
      if (profile?.lastLessonCompletedAt) {
        const lastLessonDate = new Date(profile.lastLessonCompletedAt);
        const spLastLesson = new Date(lastLessonDate.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const spNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        hasCompletedLessonToday = spLastLesson.toISOString().split('T')[0] === spNow.toISOString().split('T')[0];
      }
      
      let needsRefresh = false;
      
      // Auto-complete "read_daily_verse" mission if user already read the verse on Explore
      if (hasReadVerse) {
        for (const mission of missions) {
          if (mission.mission?.type === 'read_daily_verse' && !mission.completed) {
            await storage.completeMission(userId, mission.missionId, today);
            needsRefresh = true;
          }
        }
      }
      
      // Auto-complete "maintain_streak" and "complete_lesson" missions if user completed a lesson today
      if (hasCompletedLessonToday) {
        for (const mission of missions) {
          const missionType = mission.mission?.type;
          if ((missionType === 'maintain_streak' || missionType === 'complete_lesson') && !mission.completed) {
            await storage.completeMission(userId, mission.missionId, today);
            needsRefresh = true;
          }
        }
      }
      
      // Refresh missions list after auto-completions
      if (needsRefresh) {
        missions = await storage.getUserDailyMissions(userId, today);
      }
      
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
      const today = getTodayBrazilDate();
      
      const mission = await storage.getUserMissionById(userId, missionId, today);
      
      if (!mission) {
        return res.status(404).json({ message: "Missao não encontrada" });
      }
      
      const rawContent = await storage.getDailyMissionContent(today);
      
      // Parse JSON fields from stored strings
      const parsedContent: any = {};
      if (rawContent) {
        // Parse quiz questions from JSON string
        if (rawContent.quizQuestions) {
          try {
            parsedContent.quizQuestions = JSON.parse(rawContent.quizQuestions);
          } catch (e) {
            console.error('[Mission Content] Failed to parse quizQuestions:', e);
          }
        }
        // Parse bible fact from JSON string
        if (rawContent.bibleFact) {
          try {
            const parsed = JSON.parse(rawContent.bibleFact);
            parsedContent.bibleFact = parsed.fact || rawContent.bibleFact;
          } catch (e) {
            // If not JSON, use as plain string
            parsedContent.bibleFact = rawContent.bibleFact;
          }
        }
        // Copy other fields directly
        if (rawContent.dailyVerse) parsedContent.dailyVerse = rawContent.dailyVerse;
        if (rawContent.bibleCharacter) parsedContent.bibleCharacter = rawContent.bibleCharacter;
        if (rawContent.dailyTheme) parsedContent.dailyTheme = rawContent.dailyTheme;
      }
      
      res.json({
        ...mission,
        content: parsedContent,
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
      const today = getTodayBrazilDate();
      
      // Check how many missions were completed before this one
      const missionsBeforeCompletion = await storage.getUserDailyMissions(userId, today);
      const completedBeforeCount = missionsBeforeCompletion.filter(m => m.completed).length;
      
      const result = await storage.completeMission(userId, missionId, today);
      
      if (!result) {
        return res.status(404).json({ message: "Missao não encontrada ou ja concluida" });
      }
      
      // Check if ALL daily missions are now completed (this was the last one)
      const missionsAfterCompletion = await storage.getUserDailyMissions(userId, today);
      const completedAfterCount = missionsAfterCompletion.filter(m => m.completed).length;
      const allCompleted = missionsAfterCompletion.length > 0 && completedAfterCount === missionsAfterCompletion.length;
      
      // Only increment weekly mission count when ALL daily missions are completed for the first time
      if (allCompleted && completedBeforeCount < missionsAfterCompletion.length) {
        const weekKey = getCurrentWeekKey();
        await storage.incrementWeeklyMission(userId, weekKey);
      }
      
      res.json({
        message: "Missao concluida com sucesso!",
        ...result,
        allDailyMissionsCompleted: allCompleted,
      });
    } catch (error) {
      console.error("Complete mission error:", error);
      res.status(500).json({ message: "Erro ao concluir missao" });
    }
  });

  // Get daily mission content (verse, fact, character)
  app.get("/api/missions/content", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const today = getTodayBrazilDate();
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

  // Subscribe to push notifications (anonymous visitors)
  app.post("/api/notifications/subscribe-anonymous", async (req, res) => {
    try {
      const { endpoint, p256dh, auth } = req.body;
      
      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({ message: "Dados de inscricao invalidos" });
      }
      
      await storage.saveAnonymousPushSubscription(endpoint, p256dh, auth);
      
      res.json({ message: "Inscrito para notificacoes com sucesso" });
    } catch (error) {
      console.error("Subscribe anonymous push error:", error);
      res.status(500).json({ message: "Erro ao inscrever para notificacoes" });
    }
  });

  // Unsubscribe from push notifications (anonymous visitors)
  app.post("/api/notifications/unsubscribe-anonymous", async (req, res) => {
    try {
      const { endpoint } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ message: "Endpoint nao fornecido" });
      }
      
      await storage.removeAnonymousPushSubscription(endpoint);
      
      res.json({ message: "Desinscrito de notificacoes com sucesso" });
    } catch (error) {
      console.error("Unsubscribe anonymous push error:", error);
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
      const bannerHighlights = await storage.getBannerHighlights();
      res.json({ ...highlights, bannerHighlights });
    } catch (error) {
      console.error("Get site highlights error:", error);
      res.status(500).json({ message: "Erro ao buscar destaques do site" });
    }
  });

  // Banner highlights management (admin/marketing)
  app.get("/api/admin/banner-highlights", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const highlights = await storage.getBannerHighlights();
      const count = await storage.getBannerHighlightCount();
      res.json({ highlights, count, maxAllowed: 10 });
    } catch (error) {
      console.error("Get banner highlights error:", error);
      res.status(500).json({ message: "Erro ao buscar destaques do banner" });
    }
  });

  app.post("/api/admin/banner-highlights", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const { contentType, contentId } = req.body;
      if (!contentType || !contentId) {
        return res.status(400).json({ message: "Tipo e ID do conteúdo são obrigatórios" });
      }
      if (!['devotional', 'event', 'instagram'].includes(contentType)) {
        return res.status(400).json({ message: "Tipo de conteúdo inválido" });
      }
      const highlight = await storage.addBannerHighlight(contentType, contentId);
      await logAuditAction(req.user?.id, "create", "banner_highlight", highlight.id, `Destaque adicionado: ${contentType} #${contentId}`, req);
      res.json(highlight);
    } catch (error: any) {
      console.error("Add banner highlight error:", error);
      res.status(400).json({ message: error.message || "Erro ao adicionar destaque" });
    }
  });

  app.delete("/api/admin/banner-highlights/:id", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeBannerHighlight(id);
      await logAuditAction(req.user?.id, "delete", "banner_highlight", id, `Destaque removido`, req);
      res.json({ message: "Destaque removido com sucesso" });
    } catch (error) {
      console.error("Remove banner highlight error:", error);
      res.status(500).json({ message: "Erro ao remover destaque" });
    }
  });

  app.patch("/api/admin/banner-highlights/reorder", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ message: "Lista de IDs ordenados é obrigatória" });
      }
      await storage.reorderBannerHighlights(orderedIds);
      await logAuditAction(req.user?.id, "update", "banner_highlights", undefined, `Destaques reordenados`, req);
      res.json({ message: "Ordem atualizada com sucesso" });
    } catch (error) {
      console.error("Reorder banner highlights error:", error);
      res.status(500).json({ message: "Erro ao reordenar destaques" });
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

  // Get instagram post comments
  app.get("/api/site/instagram/:instagramId/comments", async (req, res) => {
    try {
      const { instagramId } = req.params;
      if (!instagramId) {
        return res.status(400).json({ message: "Instagram ID é obrigatório" });
      }
      const comments = await fetchInstagramComments(instagramId);
      res.json(comments);
    } catch (error) {
      console.error("Get instagram comments error:", error);
      res.status(500).json({ message: "Erro ao buscar comentários" });
    }
  });

  // Submit prayer request (public) - Rate limited to prevent spam
  app.post("/api/site/prayer-requests", prayerLimiter, async (req, res) => {
    try {
      const { name, whatsapp, category, request, isPrivate } = req.body;
      
      if (!name || !category || !request) {
        return res.status(400).json({ message: "Nome, categoria e pedido sao obrigatorios" });
      }
      
      if (name.trim().length < 2) {
        return res.status(400).json({ message: "Nome deve ter pelo menos 2 caracteres" });
      }
      
      const moderation = moderateContent(request);
      
      if (shouldAutoReject(moderation)) {
        return res.status(400).json({ 
          message: "Seu pedido contem conteudo inapropriado e nao pode ser enviado.",
          moderated: true 
        });
      }
      
      // Determinar status inicial - sempre "pending" exceto para privados
      let status: "pending" | "approved" | "rejected" | "archived" = isPrivate ? "archived" : "pending";
      const shouldAutoApprove = !isPrivate && !moderation.hasProfanity;
      
      // Apenas enviar dados de moderacao se houver problemas detectados
      const moderationData = moderation.hasProfanity ? {
        hasProfanity: moderation.hasProfanity,
        hasHateSpeech: moderation.hasHateSpeech,
        hasSexualContent: moderation.hasSexualContent,
        moderationDetails: moderation.details,
      } : undefined;
      
      const prayerRequest = await storage.createPrayerRequest({
        name: name.trim(),
        whatsapp,
        category,
        request: moderation.hasProfanity ? moderation.cleanedText : request,
        status,
      }, moderationData);
      
      // Se conteudo limpo e nao privado, aprovar automaticamente
      if (shouldAutoApprove) {
        await storage.autoApprovePrayerRequest(prayerRequest.id);
      } else if (!isPrivate) {
        notifyNewPrayerRequest(prayerRequest.id, name.trim(), category, request).catch(err => 
          console.error("[Notifications] Error notifying new prayer request:", err)
        );
      }
      
      const message = moderation.hasProfanity 
        ? "Pedido enviado e sera analisado antes de ser publicado."
        : "Pedido de oracao publicado com sucesso!";
      
      res.status(201).json({ message, id: prayerRequest.id, autoApproved: shouldAutoApprove });
    } catch (error) {
      console.error("Create prayer request error:", error);
      res.status(500).json({ message: "Erro ao enviar pedido de oracao" });
    }
  });

  // Get approved prayer requests for the public prayer wall (Mural da Oracao)
  app.get("/api/site/prayer-requests/approved", async (req, res) => {
    try {
      const requests = await storage.getApprovedPrayerRequests();
      const publicRequests = requests.map(r => ({
        id: r.id,
        name: r.name,
        request: r.request,
        category: r.category,
        inPrayerCount: r.inPrayerCount,
        createdAt: r.createdAt,
      }));
      res.json(publicRequests);
    } catch (error) {
      console.error("Get approved prayer requests error:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos aprovados" });
    }
  });

  // Check if session is praying for a specific request
  app.get("/api/site/prayer-requests/:id/is-praying", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sessionId = req.query.sessionId as string;
      
      if (isNaN(id) || !sessionId) {
        return res.status(400).json({ message: "ID e sessionId sao obrigatorios" });
      }
      
      const isPraying = await storage.checkIfPraying(id, sessionId);
      res.json({ isPraying });
    } catch (error) {
      console.error("Check praying error:", error);
      res.status(500).json({ message: "Erro ao verificar status" });
    }
  });

  // Get praying status for multiple prayer requests
  app.get("/api/site/prayer-requests/praying-status", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const ids = req.query.ids as string;
      
      if (!sessionId || !ids) {
        return res.status(400).json({ message: "sessionId e ids sao obrigatorios" });
      }
      
      const prayerRequestIds = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (prayerRequestIds.length === 0) {
        return res.json({ prayingIds: [] });
      }
      
      const prayingSet = await storage.getPrayingSessionsForRequests(prayerRequestIds, sessionId);
      res.json({ prayingIds: Array.from(prayingSet) });
    } catch (error) {
      console.error("Get praying status error:", error);
      res.status(500).json({ message: "Erro ao verificar status" });
    }
  });

  // Toggle prayer status (public) - Someone is praying for this request
  app.post("/api/site/prayer-requests/:id/pray", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { sessionId } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      
      if (!sessionId) {
        return res.status(400).json({ message: "sessionId e obrigatorio" });
      }
      
      const result = await storage.togglePraying(id, sessionId);
      
      if (!result) {
        return res.status(404).json({ message: "Pedido nao encontrado ou nao aprovado" });
      }
      
      res.json({ success: true, isPraying: result.isPraying, inPrayerCount: result.inPrayerCount });
    } catch (error) {
      console.error("Toggle prayer error:", error);
      res.status(500).json({ message: "Erro ao registrar oracao" });
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
  app.get("/api/admin/prayer-requests", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const status = req.query.status as string | undefined;
      const requests = await storage.getAllPrayerRequests(status);
      res.json(requests);
    } catch (error) {
      console.error("Get prayer requests error:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos de oracao" });
    }
  });

  // Update prayer request status (admin or marketing)
  app.patch("/api/admin/prayer-requests/:id", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id) || !status) {
        return res.status(400).json({ message: "ID e status sao obrigatorios" });
      }
      
      const updated = await storage.updatePrayerRequestStatus(id, status, req.user!.id);
      if (!updated) {
        return res.status(404).json({ message: "Pedido nao encontrado" });
      }
      
      // Audit log
      await logAuditAction(req.user?.id, "update", "prayer_request", id, `Status alterado para: ${status}`, req);
      
      res.json(updated);
    } catch (error) {
      console.error("Update prayer request error:", error);
      res.status(500).json({ message: "Erro ao atualizar pedido de oracao" });
    }
  });

  // Get all board members (admin or marketing)
  app.get("/api/admin/board-members", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const members = await storage.getAllBoardMembers(false);
      res.json(members);
    } catch (error) {
      console.error("Get board members admin error:", error);
      res.status(500).json({ message: "Erro ao buscar membros da diretoria" });
    }
  });

  // Create board member (admin or marketing)
  app.post("/api/admin/board-members", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const member = await storage.createBoardMember(req.body);
      
      // Audit log
      await logAuditAction(req.user?.id, "create", "board_member", member.id, `Criado: ${req.body.name} - ${req.body.position}`, req);
      
      res.status(201).json(member);
    } catch (error) {
      console.error("Create board member error:", error);
      res.status(500).json({ message: "Erro ao criar membro da diretoria" });
    }
  });

  // Update board member (admin or marketing)
  app.patch("/api/admin/board-members/:id", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const updated = await storage.updateBoardMember(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Membro nao encontrado" });
      }
      
      // Audit log
      await logAuditAction(req.user?.id, "update", "board_member", id, `Atualizado: ${updated.name}`, req);
      
      res.json(updated);
    } catch (error) {
      console.error("Update board member error:", error);
      res.status(500).json({ message: "Erro ao atualizar membro da diretoria" });
    }
  });

  // Delete board member (admin or marketing)
  app.delete("/api/admin/board-members/:id", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      
      // Audit log before deletion
      await logAuditAction(req.user?.id, "delete", "board_member", id, "Membro removido", req);
      
      await storage.deleteBoardMember(id);
      res.json({ message: "Membro removido com sucesso" });
    } catch (error) {
      console.error("Delete board member error:", error);
      res.status(500).json({ message: "Erro ao remover membro da diretoria" });
    }
  });

  // ==================== MARKETING ADMIN ROUTES ====================

  // Get marketing stats
  app.get("/api/marketing/stats", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getMarketingStats();
      res.json(stats);
    } catch (error) {
      console.error("Get marketing stats error:", error);
      res.status(500).json({ message: "Erro ao buscar estatisticas" });
    }
  });

  // Get users for board member selection (marketing can select from active members)
  app.get("/api/marketing/users", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      // Return only active members with basic info for selection
      const users = allUsers
        .filter(u => u.activeMember && u.isMember)
        .map(u => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          photoUrl: u.photoUrl,
        }));
      res.json(users);
    } catch (error) {
      console.error("Get users for marketing error:", error);
      res.status(500).json({ message: "Erro ao buscar usuarios" });
    }
  });

  // ==================== SITE CONTENT ROUTES ====================

  // Get all site content (admin/marketing)
  app.get("/api/marketing/site-content", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const content = await storage.getAllSiteContent();
      res.json(content);
    } catch (error) {
      console.error("Get site content error:", error);
      res.status(500).json({ message: "Erro ao buscar conteudo do site" });
    }
  });

  // Get site content by page and section (admin/marketing)
  app.get("/api/marketing/site-content/:page/:section", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const { page, section } = req.params;
      const content = await storage.getSiteContent(page, section);
      res.json(content);
    } catch (error) {
      console.error("Get site content error:", error);
      res.status(500).json({ message: "Erro ao buscar conteudo do site" });
    }
  });

  // Upsert site content (admin/marketing)
  app.put("/api/marketing/site-content", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const { page, section, title, content, imageUrl, metadata } = req.body;
      if (!page || !section) {
        return res.status(400).json({ message: "Pagina e secao sao obrigatorios" });
      }
      const saved = await storage.upsertSiteContent({
        page,
        section,
        title,
        content,
        imageUrl,
        metadata,
        updatedBy: req.user!.id,
      });
      
      await logAuditAction(req.user?.id, "update", "site_content", saved.id, `${page}/${section}`, req);
      
      res.json(saved);
    } catch (error) {
      console.error("Upsert site content error:", error);
      res.status(500).json({ message: "Erro ao salvar conteudo do site" });
    }
  });

  // Public: Get site content for a page
  app.get("/api/site-content/:page", async (req, res) => {
    try {
      const { page } = req.params;
      const allContent = await storage.getAllSiteContent();
      const pageContent = allContent.filter(c => c.page === page);
      
      // Convert to object keyed by section
      const contentMap: Record<string, any> = {};
      for (const item of pageContent) {
        contentMap[item.section] = {
          title: item.title,
          content: item.content,
          imageUrl: item.imageUrl,
          metadata: item.metadata ? JSON.parse(item.metadata) : null,
        };
      }
      
      res.json(contentMap);
    } catch (error) {
      console.error("Get public site content error:", error);
      res.status(500).json({ message: "Erro ao buscar conteudo" });
    }
  });

  // Get all events (admin or marketing)
  app.get("/api/admin/events", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const events = await storage.getAllSiteEvents();
      res.json(events);
    } catch (error) {
      console.error("Get events admin error:", error);
      res.status(500).json({ message: "Erro ao buscar eventos" });
    }
  });

  // Get single event (admin or marketing)
  app.get("/api/admin/events/:id", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const event = await storage.getSiteEventById(id);
      if (!event) {
        return res.status(404).json({ message: "Evento nao encontrado" });
      }
      res.json(event);
    } catch (error) {
      console.error("Get event error:", error);
      res.status(500).json({ message: "Erro ao buscar evento" });
    }
  });

  // Create event (admin or marketing)
  app.post("/api/admin/events", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const event = await storage.createSiteEvent({ ...req.body, createdBy: req.user!.id });
      
      // Audit log
      await logAuditAction(req.user?.id, "create", "event", event.id, `Criado: ${req.body.title}`, req);
      
      if (req.body.isPublished !== false) {
        notifyNewEvent(event.id, event.title, event.startDate, event.location, event.imageUrl).catch(err => 
          console.error("[Notifications] Error notifying new event:", err)
        );
      }
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ message: "Erro ao criar evento" });
    }
  });

  // Update event (admin or marketing)
  app.patch("/api/admin/events/:id", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      
      // Check if event is being published (was not published, now is)
      const existingEvent = await storage.getSiteEventById(id);
      const wasPublished = existingEvent?.isPublished;
      
      const updated = await storage.updateSiteEvent(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Evento nao encontrado" });
      }
      
      // Send notification if event is being published for the first time
      if (!wasPublished && updated.isPublished) {
        notifyNewEvent(updated.id, updated.title, updated.startDate, updated.location, updated.imageUrl).catch(err => 
          console.error("[Notifications] Error notifying new event:", err)
        );
      }
      
      // Audit log
      await logAuditAction(req.user?.id, "update", "event", id, `Atualizado: ${updated.title}`, req);
      
      res.json(updated);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ message: "Erro ao atualizar evento" });
    }
  });

  // Delete event (admin or marketing)
  app.delete("/api/admin/events/:id", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      
      // Audit log before deletion
      await logAuditAction(req.user?.id, "delete", "event", id, "Evento removido", req);
      
      await storage.deleteSiteEvent(id);
      res.json({ message: "Evento removido com sucesso" });
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({ message: "Erro ao remover evento" });
    }
  });

  // Export events to ICS calendar format (using ical-generator for better compatibility)
  app.get("/api/site/events/calendar.ics", async (req, res) => {
    try {
      const ical = await import("ical-generator");
      const events = await storage.getUpcomingEvents();
      
      const calendar = ical.default({
        name: "UMP Emaus - Eventos",
        prodId: { company: "UMP Emaus", product: "Calendario", language: "PT" },
        timezone: "America/Sao_Paulo",
      });
      
      events.forEach(event => {
        // Use T12:00:00 to avoid timezone issues (noon is safe from day boundaries)
        const startDate = new Date(event.startDate + 'T12:00:00');
        const endDate = event.endDate ? new Date(event.endDate + 'T12:00:00') : new Date(event.startDate + 'T12:00:00');
        
        if (event.time && !event.isAllDay) {
          const [hours, minutes] = event.time.split(":").map(Number);
          startDate.setHours(hours || 0, minutes || 0);
          endDate.setHours((hours || 0) + 2, minutes || 0);
        }
        
        calendar.createEvent({
          id: `event-${event.id}@umpemaus.com`,
          start: startDate,
          end: endDate,
          allDay: event.isAllDay || false,
          summary: event.title,
          description: event.description || undefined,
          location: event.location || undefined,
          url: event.registrationUrl || undefined,
          categories: [{ name: event.category }],
        });
      });
      
      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="ump-emaus-eventos.ics"');
      res.send(calendar.toString());
    } catch (error) {
      console.error("Export calendar error:", error);
      res.status(500).json({ message: "Erro ao exportar calendario" });
    }
  });

  // Export single event to ICS
  app.get("/api/site/events/:id/calendar.ics", async (req, res) => {
    try {
      const ical = await import("ical-generator");
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      
      const event = await storage.getSiteEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Evento nao encontrado" });
      }
      
      const calendar = ical.default({
        name: event.title,
        prodId: { company: "UMP Emaus", product: "Evento", language: "PT" },
        timezone: "America/Sao_Paulo",
      });
      
      // Use T12:00:00 to avoid timezone issues (noon is safe from day boundaries)
      const startDate = new Date(event.startDate + 'T12:00:00');
      const endDate = event.endDate ? new Date(event.endDate + 'T12:00:00') : new Date(event.startDate + 'T12:00:00');
      
      if (event.time && !event.isAllDay) {
        const [hours, minutes] = event.time.split(":").map(Number);
        startDate.setHours(hours || 0, minutes || 0);
        endDate.setHours((hours || 0) + 2, minutes || 0);
      }
      
      calendar.createEvent({
        id: `event-${event.id}@umpemaus.com`,
        start: startDate,
        end: endDate,
        allDay: event.isAllDay || false,
        summary: event.title,
        description: event.description || undefined,
        location: event.location || undefined,
        url: event.registrationUrl || undefined,
        categories: [{ name: event.category }],
      });
      
      const filename = event.title.toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 30);
      
      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}.ics"`);
      res.send(calendar.toString());
    } catch (error) {
      console.error("Export single event calendar error:", error);
      res.status(500).json({ message: "Erro ao exportar evento" });
    }
  });

  // Generate Google Calendar add URL for event
  app.get("/api/site/events/:id/google-calendar-url", async (req, res) => {
    try {
      const { generateGoogleCalendarAddUrl } = await import("./utils/google-calendar");
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      
      const event = await storage.getSiteEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Evento nao encontrado" });
      }
      
      const googleCalendarUrl = generateGoogleCalendarAddUrl(event);
      res.json({ url: googleCalendarUrl });
    } catch (error) {
      console.error("Generate Google Calendar URL error:", error);
      res.status(500).json({ message: "Erro ao gerar URL do Google Calendar" });
    }
  });

  // Get Google Calendar subscribe URL for all events
  app.get("/api/site/events/google-calendar-subscribe", async (req, res) => {
    try {
      const { generateGoogleCalendarSubscribeUrl } = await import("./utils/google-calendar");
      
      // Use Replit's public domain instead of localhost
      const replitDomain = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN;
      let baseUrl: string;
      
      if (replitDomain) {
        // Use the first domain if multiple are provided (comma-separated)
        const domain = replitDomain.split(',')[0].trim();
        baseUrl = `https://${domain}`;
      } else {
        // Fallback for local development
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['host'] || 'localhost:5000';
        baseUrl = `${protocol}://${host}`;
      }
      
      const subscribeUrl = generateGoogleCalendarSubscribeUrl(baseUrl);
      res.json({ url: subscribeUrl });
    } catch (error) {
      console.error("Generate Google Calendar subscribe URL error:", error);
      res.status(500).json({ message: "Erro ao gerar URL de inscricao do Google Calendar" });
    }
  });

  // Sync events to Google Calendar (admin only)
  app.post("/api/admin/events/sync-google-calendar", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const { syncAllEventsToGoogleCalendar } = await import("./utils/google-calendar");
      const events = await storage.getUpcomingEvents();
      
      const result = await syncAllEventsToGoogleCalendar(events);
      
      if (result.success) {
        res.json({ 
          message: `${result.synced} evento(s) sincronizado(s) com sucesso!`,
          synced: result.synced,
          failed: result.failed
        });
      } else {
        res.status(207).json({
          message: `Sincronizacao parcial: ${result.synced} sucesso, ${result.failed} falha(s)`,
          synced: result.synced,
          failed: result.failed,
          errors: result.errors
        });
      }
    } catch (error) {
      console.error("Sync Google Calendar error:", error);
      res.status(500).json({ message: "Erro ao sincronizar com Google Calendar" });
    }
  });

  // Get all banners (admin or marketing)
  app.get("/api/admin/banners", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const banners = await storage.getAllBanners();
      res.json(banners);
    } catch (error) {
      console.error("Get banners admin error:", error);
      res.status(500).json({ message: "Erro ao buscar banners" });
    }
  });

  // Create banner (admin or marketing)
  app.post("/api/admin/banners", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const banner = await storage.createBanner({ ...req.body, createdBy: req.user!.id });
      
      // Audit log
      await logAuditAction(req.user?.id, "create", "banner", banner.id, `Criado: ${req.body.title}`, req);
      
      res.status(201).json(banner);
    } catch (error) {
      console.error("Create banner error:", error);
      res.status(500).json({ message: "Erro ao criar banner" });
    }
  });

  // Update banner (admin or marketing)
  app.patch("/api/admin/banners/:id", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const updated = await storage.updateBanner(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Banner nao encontrado" });
      }
      
      // Audit log
      await logAuditAction(req.user?.id, "update", "banner", id, `Atualizado: ${updated.title}`, req);
      
      res.json(updated);
    } catch (error) {
      console.error("Update banner error:", error);
      res.status(500).json({ message: "Erro ao atualizar banner" });
    }
  });

  // Delete banner (admin or marketing)
  app.delete("/api/admin/banners/:id", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      
      // Audit log before deletion
      await logAuditAction(req.user?.id, "delete", "banner", id, "Banner removido", req);
      
      await storage.deleteBanner(id);
      res.json({ message: "Banner removido com sucesso" });
    } catch (error) {
      console.error("Delete banner error:", error);
      res.status(500).json({ message: "Erro ao remover banner" });
    }
  });

  // ==================== INSTAGRAM ADMIN API ====================

  // Get Instagram status and posts (admin or marketing)
  app.get("/api/admin/instagram", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const posts = await storage.getInstagramPostsForAdmin();
      const configured = isInstagramConfigured();
      res.json({ 
        configured, 
        posts,
        message: configured ? null : "Instagram API nao configurada. Configure INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID."
      });
    } catch (error) {
      console.error("Get Instagram admin error:", error);
      res.status(500).json({ message: "Erro ao buscar dados do Instagram" });
    }
  });

  // Sync Instagram posts (admin or marketing)
  app.post("/api/admin/instagram/sync", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      if (!isInstagramConfigured()) {
        return res.status(400).json({ 
          message: "Instagram API nao configurada. Configure INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID." 
        });
      }
      
      const result = await syncInstagramPosts();
      await logAuditAction(req.user?.id, "sync", "instagram", undefined, `Sincronizados ${result.synced} posts`, req);
      
      res.json({ 
        message: `Sincronizacao concluida: ${result.synced} posts sincronizados`,
        synced: result.synced,
        errors: result.errors
      });
    } catch (error) {
      console.error("Sync Instagram error:", error);
      res.status(500).json({ message: "Erro ao sincronizar Instagram" });
    }
  });

  // Set Instagram post as featured banner (admin or marketing)
  app.patch("/api/admin/instagram/:id/feature", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }

      const post = await storage.getInstagramPostById(id);
      if (!post) {
        return res.status(404).json({ message: "Post nao encontrado" });
      }

      const updated = await storage.setFeaturedInstagramPost(id);
      await logAuditAction(req.user?.id, "update", "instagram", id, `Post definido como destaque do banner`, req);

      res.json({ 
        message: "Post definido como destaque do banner com sucesso",
        post: updated
      });
    } catch (error) {
      console.error("Feature Instagram post error:", error);
      res.status(500).json({ message: "Erro ao definir post como destaque" });
    }
  });

  // Remove featured banner from Instagram post (admin or marketing)
  app.delete("/api/admin/instagram/:id/feature", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }

      await storage.removeFeaturedInstagramPost(id);

      await logAuditAction(req.user?.id, "update", "instagram", id, `Post removido do destaque do banner`, req);

      res.json({ message: "Post removido do destaque" });
    } catch (error) {
      console.error("Remove featured Instagram post error:", error);
      res.status(500).json({ message: "Erro ao remover destaque" });
    }
  });

  // ==================== AUDIT LOGS API ====================

  // Get audit logs (admin only)
  app.get("/api/admin/audit-logs", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const resource = req.query.resource as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      const logs = await storage.getAuditLogs({ userId, resource, limit });
      res.json(logs);
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ message: "Erro ao buscar logs de auditoria" });
    }
  });

  // Get site content (admin or marketing)
  app.get("/api/admin/site-content", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const content = await storage.getAllSiteContent();
      res.json(content);
    } catch (error) {
      console.error("Get site content error:", error);
      res.status(500).json({ message: "Erro ao buscar conteudo do site" });
    }
  });

  // Update site content (admin or marketing)
  app.post("/api/admin/site-content", authenticateToken, requireAdminOrMarketing, async (req: AuthRequest, res) => {
    try {
      const content = await storage.upsertSiteContent({ ...req.body, updatedBy: req.user!.id });
      res.json(content);
    } catch (error) {
      console.error("Update site content error:", error);
      res.status(500).json({ message: "Erro ao atualizar conteudo do site" });
    }
  });

  // ==================== TEMPORADAS (SEASONS) ====================

  // Função auxiliar para obter a chave da semana atual
  function getCurrentWeekKey(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  // Obter lição atual em progresso do usuário (para "Continue estudando")
  app.get("/api/study/current-lesson", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const seasons = await storage.getPublishedSeasons();
      
      for (const season of seasons) {
        const lessons = await storage.getLessonsWithProgressForSeason(req.user!.id, season.id);
        
        for (let i = 0; i < lessons.length; i++) {
          const lesson = lessons[i];
          const previousLesson = lessons[i - 1];
          const previousCompleted = i === 0 || previousLesson?.status === 'completed';
          
          if (lesson.status !== 'completed' && previousCompleted && !lesson.isLocked) {
            return res.json({
              lesson: {
                id: lesson.id,
                lessonNumber: lesson.lessonNumber || (lesson.orderIndex + 1),
                title: lesson.title,
                sectionsCompleted: lesson.sectionsCompleted || 0,
                totalSections: lesson.totalSections || 3,
                status: lesson.status
              },
              season: {
                id: season.id,
                title: season.title
              }
            });
          }
        }
      }
      
      res.json(null);
    } catch (error) {
      console.error("Get current lesson error:", error);
      res.status(500).json({ message: "Erro ao buscar lição atual" });
    }
  });

  // Listar temporadas publicadas (usuário autenticado) com progresso
  app.get("/api/study/seasons", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const seasons = await storage.getPublishedSeasons();
      
      const seasonsWithProgress = await Promise.all(seasons.map(async (season) => {
        const progress = await storage.getUserSeasonProgress(req.user!.id, season.id);
        const lessonsCompleted = progress?.lessonsCompleted || 0;
        const totalLessons = season.totalLessons || 0;
        const isCompleted = totalLessons > 0 && lessonsCompleted >= totalLessons;
        
        return {
          ...season,
          progress: progress ? {
            lessonsCompleted: progress.lessonsCompleted,
            totalLessons: progress.totalLessons,
            xpEarned: progress.xpEarned,
            isMastered: progress.isMastered || isCompleted,
            completedAt: progress.completedAt
          } : null
        };
      }));
      
      res.json(seasonsWithProgress);
    } catch (error) {
      console.error("Get seasons error:", error);
      res.status(500).json({ message: "Erro ao buscar temporadas" });
    }
  });

  // Obter temporada com lições
  app.get("/api/study/seasons/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const season = await storage.getSeasonById(seasonId);
      if (!season) {
        return res.status(404).json({ message: "Temporada não encontrada" });
      }

      const lessons = await storage.getLessonsWithProgressForSeason(req.user!.id, seasonId);
      const userProgress = await storage.getUserSeasonProgress(req.user!.id, seasonId);
      const finalChallenge = await storage.getSeasonFinalChallenge(seasonId);
      
      const lessonsCompleted = userProgress?.lessonsCompleted || 0;
      const totalLessons = season.totalLessons || 0;
      const isCompleted = totalLessons > 0 && lessonsCompleted >= totalLessons;

      res.json({
        ...season,
        lessons,
        userProgress,
        progress: userProgress ? {
          lessonsCompleted: userProgress.lessonsCompleted,
          totalLessons: userProgress.totalLessons,
          xpEarned: userProgress.xpEarned,
          isMastered: userProgress.isMastered || isCompleted,
          completedAt: userProgress.completedAt
        } : null,
        finalChallenge: finalChallenge ? { 
          id: finalChallenge.id,
          title: finalChallenge.title,
          description: finalChallenge.description,
          timeLimitSeconds: finalChallenge.timeLimitSeconds,
          questionCount: finalChallenge.questionCount,
          isActive: finalChallenge.isActive
        } : null
      });
    } catch (error) {
      console.error("Get season error:", error);
      res.status(500).json({ message: "Erro ao buscar temporada" });
    }
  });

  // Obter desafio final da temporada
  app.get("/api/study/seasons/:id/final-challenge", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const season = await storage.getSeasonById(seasonId);
      if (!season) {
        return res.status(404).json({ message: "Temporada não encontrada" });
      }

      const progress = await storage.getUserSeasonProgress(req.user!.id, seasonId);
      const lessonsCompleted = progress?.lessonsCompleted || 0;
      if (lessonsCompleted < season.totalLessons) {
        return res.status(403).json({ message: "Complete todas as lições antes de acessar o desafio final" });
      }

      const challenge = await storage.getSeasonFinalChallenge(seasonId);
      if (!challenge || !challenge.isActive) {
        return res.status(404).json({ message: "Desafio final não disponível" });
      }

      const questions = JSON.parse(challenge.questions);
      res.json({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        timeLimitSeconds: challenge.timeLimitSeconds,
        questionCount: challenge.questionCount,
        questions: questions.map((q: any, index: number) => ({
          id: index + 1,
          question: q.question,
          options: q.options
        }))
      });
    } catch (error) {
      console.error("Get final challenge error:", error);
      res.status(500).json({ message: "Erro ao buscar desafio final" });
    }
  });

  // Submeter respostas do desafio final
  app.post("/api/study/seasons/:id/final-challenge/submit", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const { answers, token } = req.body;
      if (!Array.isArray(answers)) {
        return res.status(400).json({ message: "Respostas inválidas" });
      }

      const challenge = await storage.getSeasonFinalChallenge(seasonId);
      if (!challenge) {
        return res.status(404).json({ message: "Desafio não encontrado" });
      }

      const result = await storage.submitFinalChallenge(req.user!.id, challenge.id, token || "", answers);
      res.json(result);
    } catch (error) {
      console.error("Submit final challenge error:", error);
      res.status(500).json({ message: "Erro ao submeter desafio" });
    }
  });

  // Iniciar desafio final (obter token)
  app.post("/api/study/seasons/:id/final-challenge/start", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const challenge = await storage.getSeasonFinalChallenge(seasonId);
      if (!challenge) {
        return res.status(404).json({ message: "Desafio não encontrado" });
      }

      const result = await storage.startFinalChallenge(req.user!.id, challenge.id);
      res.json(result);
    } catch (error) {
      console.error("Start final challenge error:", error);
      res.status(500).json({ message: "Erro ao iniciar desafio" });
    }
  });

  // Obter ranking da temporada
  app.get("/api/study/seasons/:id/ranking", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const ranking = await storage.getSeasonRankings(seasonId, limit);
      res.json(ranking);
    } catch (error) {
      console.error("Get season ranking error:", error);
      res.status(500).json({ message: "Erro ao buscar ranking" });
    }
  });

  // Obter progresso da meta semanal
  app.get("/api/study/weekly-goal", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const weekKey = getCurrentWeekKey();
      const weeklyGoal = await storage.getWeeklyGoalStatus(req.user!.id, weekKey);
      res.json(weeklyGoal);
    } catch (error) {
      console.error("Get weekly goal error:", error);
      res.status(500).json({ message: "Erro ao buscar meta semanal" });
    }
  });

  // Incrementar progresso da meta semanal
  app.post("/api/study/weekly-goal/increment", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { type } = req.body;
      const weekKey = getCurrentWeekKey();
      
      switch (type) {
        case "lessons":
          await storage.incrementWeeklyLesson(req.user!.id, weekKey);
          break;
        case "verses":
          await storage.incrementWeeklyVerse(req.user!.id, weekKey);
          break;
        case "missions":
          await storage.incrementWeeklyMission(req.user!.id, weekKey);
          break;
        case "devotionals":
          await storage.incrementWeeklyDevotional(req.user!.id, weekKey);
          break;
        default:
          return res.status(400).json({ message: "Tipo inválido" });
      }
      
      const weeklyGoal = await storage.getWeeklyGoalStatus(req.user!.id, weekKey);
      res.json(weeklyGoal);
    } catch (error) {
      console.error("Increment weekly goal error:", error);
      res.status(500).json({ message: "Erro ao atualizar meta" });
    }
  });

  // ==================== WEEKLY PRACTICE (PRATIQUE) ====================

  // Get practice status for a week
  app.get("/api/study/practice/:weekId/status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      if (isNaN(weekId)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const status = await storage.getWeeklyPracticeStatus(req.user!.id, weekId);
      res.json(status);
    } catch (error) {
      console.error("Get practice status error:", error);
      res.status(500).json({ message: "Erro ao buscar status do pratique" });
    }
  });

  // Start practice - get questions
  app.post("/api/study/practice/:weekId/start", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      if (isNaN(weekId)) {
        return res.status(400).json({ message: "ID invalido" });
      }

      const status = await storage.getWeeklyPracticeStatus(req.user!.id, weekId);
      if (!status.isUnlocked) {
        return res.status(403).json({ 
          message: "Complete todas as licoes da semana para desbloquear o Pratique",
          lessonsCompleted: status.lessonsCompleted,
          totalLessons: status.totalLessons
        });
      }

      // Block retry if already mastered (3 stars)
      if (status.isMastered) {
        return res.status(403).json({ 
          message: "Voce ja dominou esta semana! Parabens!"
        });
      }

      let questions = await storage.getPracticeQuestions(weekId);
      if (questions.length < 10) {
        questions = await storage.generatePracticeQuestionsFromAI(weekId);
      }

      // Shuffle questions array for retry attempts (randomize order)
      const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const shuffledQuestions = shuffleArray(questions);

      const parsedQuestions = shuffledQuestions.map((q, index) => ({
        id: q.id,
        type: q.type,
        content: typeof q.content === 'string' ? JSON.parse(q.content) : q.content,
        orderIndex: index,
      }));

      res.json({ 
        questions: parsedQuestions,
        timeLimit: 120,
        totalQuestions: 10
      });
    } catch (error) {
      console.error("Start practice error:", error);
      res.status(500).json({ message: "Erro ao iniciar pratique" });
    }
  });

  // Complete practice
  app.post("/api/study/practice/:weekId/complete", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      if (isNaN(weekId)) {
        return res.status(400).json({ message: "ID invalido" });
      }

      const { correctAnswers, timeSpentSeconds } = req.body;
      if (typeof correctAnswers !== 'number' || typeof timeSpentSeconds !== 'number') {
        return res.status(400).json({ message: "Dados invalidos" });
      }

      const practice = await storage.completePractice(req.user!.id, weekId, correctAnswers, timeSpentSeconds);
      
      // Check and unlock achievements after completing practice
      const unlockedAchievements = await storage.checkAndUnlockAchievements(req.user!.id, { 
        event: 'practice_complete', 
        value: practice.isMastered ? 1 : 0,
        starsEarned: practice.starsEarned
      });
      
      res.json({
        starsEarned: practice.starsEarned,
        correctAnswers: practice.correctAnswers,
        totalQuestions: practice.totalQuestions,
        timeSpentSeconds: practice.timeSpentSeconds,
        completedWithinTime: practice.completedWithinTime,
        isMastered: practice.isMastered,
        unlockedAchievements: unlockedAchievements.length > 0 ? unlockedAchievements : undefined,
      });
    } catch (error) {
      console.error("Complete practice error:", error);
      res.status(500).json({ message: "Erro ao completar pratique" });
    }
  });

  // Verificar status de leitura do devocional
  app.get("/api/study/devotional-status/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const devotionalId = parseInt(req.params.id);
      if (isNaN(devotionalId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const isRead = await storage.hasReadDevotional(req.user!.id, devotionalId);
      res.json({ isRead });
    } catch (error) {
      console.error("Check devotional status error:", error);
      res.status(500).json({ message: "Erro ao verificar status" });
    }
  });

  // Marcar devocional como lido (para meta semanal)
  app.post("/api/study/devotional-read/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const devotionalId = parseInt(req.params.id);
      if (isNaN(devotionalId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const alreadyRead = await storage.hasReadDevotional(req.user!.id, devotionalId);
      if (alreadyRead) {
        return res.json({ success: true, message: "Devocional ja foi lido", alreadyRead: true });
      }

      const weekKey = getCurrentWeekKey();
      // confirmDevotionalRead ja chama incrementWeeklyDevotional internamente quando weekKey e fornecido
      await storage.confirmDevotionalRead(req.user!.id, devotionalId, weekKey);
      res.json({ success: true, message: "Leitura registrada" });
    } catch (error) {
      console.error("Mark devotional read error:", error);
      res.status(500).json({ message: "Erro ao registrar leitura" });
    }
  });

  // Get daily verse (separate from recovery verses)
  app.get("/api/study/daily-verse", async (req, res) => {
    try {
      const dailyVerse = await fetchDailyVerseFromAPI();
      if (!dailyVerse) {
        return res.status(503).json({ 
          message: "Versículo do dia indisponível no momento",
          fallback: {
            verse: "O Senhor é o meu pastor; nada me faltará.",
            reference: "Salmos 23:1 (ARA)"
          }
        });
      }
      res.json(dailyVerse);
    } catch (error) {
      console.error("Get daily verse error:", error);
      res.json({
        verse: "O Senhor é o meu pastor; nada me faltará.",
        reference: "Salmos 23:1 (ARA)"
      });
    }
  });

  // Helper to get current daily verse date key (resets at 6 AM São Paulo time)
  function getDailyVerseDateKey(): string {
    const now = new Date();
    const spTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    // If before 6 AM, consider it as the previous day
    if (spTime.getHours() < 6) {
      spTime.setDate(spTime.getDate() - 1);
    }
    return spTime.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Check if daily verse was read today
  app.get("/api/study/daily-verse/status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const profile = await storage.getStudyProfile(req.user!.id);
      const todayKey = getDailyVerseDateKey();
      const isRead = profile?.dailyVerseReadDate === todayKey;
      res.json({ isRead, dateKey: todayKey });
    } catch (error) {
      console.error("Get daily verse status error:", error);
      res.status(500).json({ message: "Erro ao verificar status" });
    }
  });

  // Confirmar leitura do versículo do dia
  app.post("/api/study/daily-verse/confirm", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const todayKey = getDailyVerseDateKey();
      
      // First, check current status
      const profile = await storage.getStudyProfile(userId);
      
      // Check if already read today
      if (profile?.dailyVerseReadDate === todayKey) {
        return res.json({ 
          success: false, 
          alreadyRead: true, 
          message: "Versículo do dia já foi lido hoje" 
        });
      }
      
      // IMPORTANT: Update dailyVerseReadDate FIRST to prevent race conditions
      // This marks as read immediately so subsequent requests will be rejected
      await storage.updateStudyProfile(userId, { dailyVerseReadDate: todayKey });
      
      // Double-check after update to handle race conditions
      // Re-fetch the profile to ensure we have the latest state
      const updatedProfile = await storage.getStudyProfile(userId);
      if (updatedProfile?.dailyVerseReadDate !== todayKey) {
        // This shouldn't happen but handle gracefully
        return res.json({ 
          success: false, 
          alreadyRead: true, 
          message: "Erro de sincronização, tente novamente" 
        });
      }
      
      // Now safely increment the weekly goal (only happens once per day)
      const weekKey = getCurrentWeekKey();
      await storage.incrementWeeklyVerse(userId, weekKey);
      
      res.json({ success: true, message: "Leitura do versículo confirmada" });
    } catch (error) {
      console.error("Confirm daily verse error:", error);
      res.status(500).json({ message: "Erro ao confirmar leitura" });
    }
  });

  // ==================== ADMINISTRAÇÃO DE TEMPORADAS ====================

  // Listar todas as temporadas (admin)
  app.get("/api/study/admin/seasons", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const seasons = await storage.getAllSeasons();
      res.json(seasons);
    } catch (error) {
      console.error("Get all seasons error:", error);
      res.status(500).json({ message: "Erro ao buscar temporadas" });
    }
  });

  // Obter uma temporada específica por ID (admin)
  app.get("/api/study/admin/seasons/:id", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const season = await storage.getSeasonById(seasonId);
      if (!season) {
        return res.status(404).json({ message: "Temporada não encontrada" });
      }
      res.json(season);
    } catch (error) {
      console.error("Get season by id error:", error);
      res.status(500).json({ message: "Erro ao buscar temporada" });
    }
  });

  // Obter lições de uma temporada específica (admin)
  app.get("/api/study/admin/seasons/:id/lessons", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const season = await storage.getSeasonById(seasonId);
      if (!season) {
        return res.status(404).json({ message: "Temporada não encontrada" });
      }

      const lessons = await storage.getLessonsForSeason(seasonId);
      res.json(lessons);
    } catch (error) {
      console.error("Get lessons for season error:", error);
      res.status(500).json({ message: "Erro ao buscar lições" });
    }
  });

  // Criar temporada
  app.post("/api/study/admin/seasons", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const season = await storage.createSeason({
        ...req.body,
        createdBy: req.user!.id
      });
      res.status(201).json(season);
    } catch (error) {
      console.error("Create season error:", error);
      res.status(500).json({ message: "Erro ao criar temporada" });
    }
  });

  // Atualizar temporada
  app.put("/api/study/admin/seasons/:id", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const season = await storage.updateSeason(seasonId, req.body);
      if (!season) {
        return res.status(404).json({ message: "Temporada não encontrada" });
      }
      res.json(season);
    } catch (error) {
      console.error("Update season error:", error);
      res.status(500).json({ message: "Erro ao atualizar temporada" });
    }
  });

  // Deletar temporada
  app.delete("/api/study/admin/seasons/:id", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      await storage.deleteSeason(seasonId);
      res.json({ message: "Temporada removida com sucesso" });
    } catch (error) {
      console.error("Delete season error:", error);
      res.status(500).json({ message: "Erro ao remover temporada" });
    }
  });

  // Publicar temporada
  app.post("/api/study/admin/seasons/:id/publish", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const season = await storage.publishSeason(seasonId);
      if (!season) {
        return res.status(404).json({ message: "Temporada não encontrada" });
      }
      
      notifySeasonPublished(season.id, season.title, season.description, season.coverImageUrl).catch(err => 
        console.error("[Notifications] Error notifying season published:", err)
      );
      
      res.json(season);
    } catch (error) {
      console.error("Publish season error:", error);
      res.status(500).json({ message: "Erro ao publicar temporada" });
    }
  });

  // Bloquear/desbloquear temporada
  app.post("/api/study/admin/seasons/:id/toggle-lock", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const { isLocked } = req.body;
      if (typeof isLocked !== 'boolean') {
        return res.status(400).json({ message: "isLocked é obrigatório" });
      }

      const season = await storage.toggleSeasonLock(seasonId, isLocked);
      if (!season) {
        return res.status(404).json({ message: "Temporada não encontrada" });
      }
      
      res.json(season);
    } catch (error) {
      console.error("Toggle season lock error:", error);
      res.status(500).json({ message: "Erro ao bloquear/desbloquear temporada" });
    }
  });

  // Encerrar temporada e enviar email para top 3
  app.post("/api/study/admin/seasons/:id/end", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const result = await storage.endSeason(seasonId);
      if (!result) {
        return res.status(404).json({ message: "Temporada não encontrada" });
      }

      // Send congratulations emails to top 3
      for (let i = 0; i < result.topRankers.length && i < 3; i++) {
        const ranker = result.topRankers[i];
        try {
          const user = await storage.getUserById(ranker.userId);
          if (user?.email) {
            await sendSeasonRankingEmail(
              user.fullName,
              user.email,
              result.season.title,
              i + 1, // position (1, 2, or 3)
              ranker.xpEarned,
              result.topRankers.slice(0, 3).map((r, idx) => ({
                name: r.user.fullName,
                position: idx + 1,
                xp: r.xpEarned
              }))
            );
            console.log(`[Season End] Sent ranking email to ${user.email} (position ${i + 1})`);
          }
        } catch (emailError) {
          console.error(`[Season End] Error sending email to user ${ranker.userId}:`, emailError);
        }
      }
      
      res.json({ 
        season: result.season, 
        topRankers: result.topRankers,
        message: "Temporada encerrada com sucesso" 
      });
    } catch (error) {
      console.error("End season error:", error);
      res.status(500).json({ message: "Erro ao encerrar temporada" });
    }
  });

  // Importar PDF e gerar lições com IA
  app.post("/api/study/admin/seasons/:id/import-pdf", authenticateToken, requireAdminOrEspiritualidade, upload.single('pdf'), async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Arquivo PDF não enviado" });
      }

      const season = await storage.getSeasonById(seasonId);
      if (!season) {
        return res.status(404).json({ message: "Temporada não encontrada" });
      }

      // Salvar o status original para restaurar após o processamento
      const originalStatus = season.status;

      if (!isAIConfigured()) {
        return res.status(500).json({ message: "IA não configurada" });
      }

      await storage.updateSeason(seasonId, { status: "processing" });

      const pdfData = await parsePdfBuffer(req.file.buffer);
      const pdfText = pdfData.text;

      const generateFinalChallenge = req.body.generateFinalChallenge === "true";

      const now = new Date();
      const weekNumber = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 604800000);
      const lessonsData = await generateStudyContentFromText(pdfText, weekNumber, now.getFullYear());

      if (!lessonsData || !lessonsData.lessons || lessonsData.lessons.length === 0) {
        await storage.updateSeason(seasonId, { status: "draft" });
        return res.status(500).json({ message: "Erro ao processar PDF com IA" });
      }

      await storage.updateSeason(seasonId, {
        aiExtractedTitle: lessonsData.weekTitle || season.title,
        totalLessons: lessonsData.lessons.length
      });

      const createdLessons = [];
      for (let i = 0; i < lessonsData.lessons.length; i++) {
        const lessonData = lessonsData.lessons[i];
        const lesson = await storage.createSeasonLesson({
          seasonId,
          title: lessonData.title,
          description: lessonData.description || "",
          type: "study",
          orderIndex: i + 1,
          xpReward: 50,
          icon: "book-open"
        });

        if (lessonData.units && lessonData.units.length > 0) {
          for (let j = 0; j < lessonData.units.length; j++) {
            const unit = lessonData.units[j];
            await storage.createStudyUnit({
              lessonId: lesson.id,
              type: unit.type,
              content: unit.content,
              orderIndex: j,
              xpValue: 10,
              stage: unit.stage || "estude"
            });
          }
        }

        createdLessons.push(lesson);
      }

      // Restaurar o status original da revista (publicada ou rascunho)
      await storage.updateSeason(seasonId, { status: originalStatus });

      if (generateFinalChallenge && lessonsData.lessons.length > 0) {
        const lessonTitles = lessonsData.lessons.map((l: any) => l.title).join(", ");
        const challengeUnits = await generateExercisesFromTopic(
          `Gere 15 perguntas para desafio final sobre: ${lessonTitles}`,
          15
        );
        
        if (challengeUnits && challengeUnits.length > 0) {
          const questions = challengeUnits.map((u: any, idx: number) => ({
            id: idx + 1,
            question: u.content?.question || u.content,
            options: u.content?.options || [],
            correctAnswer: u.content?.correctAnswer || 0,
            explanation: u.content?.explanation || ""
          }));

          await storage.createFinalChallenge({
            seasonId,
            title: "Desafio Final",
            description: `Desafio final da temporada ${season.title}`,
            questions: JSON.stringify(questions),
            timeLimitSeconds: 150,
            questionCount: questions.length,
            xpReward: 200,
            perfectXpBonus: 100,
            isActive: true
          });
        }
      }

      res.json({
        message: "PDF processado com sucesso",
        lessonsCreated: createdLessons.length,
        lessons: createdLessons
      });
    } catch (error) {
      console.error("Import PDF error:", error);
      await storage.updateSeason(parseInt(req.params.id), { status: "draft" });
      res.status(500).json({ message: "Erro ao importar PDF" });
    }
  });

  // Importar PDF usando extração EXATA (nova função para DeoGlory)
  app.post("/api/study/admin/seasons/:id/import-pdf-exact", authenticateToken, requireAdminOrEspiritualidade, upload.single('pdf'), async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido", errorType: "validation" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Arquivo PDF não enviado", errorType: "validation" });
      }

      const geminiKey = req.body.geminiKey || "1";
      const openaiKey = req.body.openaiKey || "1";
      const aiProvider: AIProvider = req.body.aiProvider === "openai" ? "openai" : "gemini";

      const season = await storage.getSeasonById(seasonId);
      if (!season) {
        return res.status(404).json({ message: "Revista não encontrada", errorType: "not_found" });
      }

      // Salvar o status original para restaurar após o processamento
      const originalStatus = season.status;

      if (!isAIConfigured() && aiProvider === "gemini") {
        return res.status(500).json({ message: "IA não configurada. Configure a chave GEMINI_API_KEY nas variáveis de ambiente.", errorType: "config" });
      }

      if (aiProvider === "openai" && !process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI não configurada. Configure a chave OPENAI_API_KEY nas variáveis de ambiente.", errorType: "config" });
      }

      await storage.updateSeason(seasonId, { status: "processing" });

      const pdfData = await parsePdfBuffer(req.file.buffer);
      const pdfText = pdfData.text;

      if (!pdfText || pdfText.trim().length < 100) {
        await storage.updateSeason(seasonId, { status: originalStatus });
        return res.status(400).json({ message: "PDF não contém texto suficiente para processamento. Verifique se o PDF contém texto selecionável.", errorType: "pdf_content" });
      }

      const extractedLesson = await generateLessonFromPDFExact(pdfText, geminiKey, aiProvider, openaiKey);

      if (!extractedLesson || !extractedLesson.title) {
        await storage.updateSeason(seasonId, { status: originalStatus });
        return res.status(500).json({ message: "Erro ao processar PDF com IA" });
      }

      // Get existing lessons to calculate the next order index and total count
      const existingLessons = await storage.getLessonsForSeason(seasonId);
      const nextOrderIndex = existingLessons.length > 0 
        ? Math.max(...existingLessons.map(l => l.orderIndex)) + 1 
        : 1;
      const newTotalLessons = existingLessons.length + 1;
      
      // Use the lesson number selected by the user (from form) or fallback to auto-incrementing
      const selectedLessonNumber = parseInt(req.body.lessonNumber) || newTotalLessons;

      await storage.updateSeason(seasonId, {
        aiExtractedTitle: extractedLesson.title,
        totalLessons: newTotalLessons
      });

      const lesson = await storage.createSeasonLesson({
        seasonId,
        title: extractedLesson.title,
        description: extractedLesson.baseVerseReference ? `Versículo base: ${extractedLesson.baseVerseReference}` : "",
        type: "study",
        orderIndex: nextOrderIndex,
        lessonNumber: selectedLessonNumber,
        xpReward: 50,
        icon: "book-open"
      });

      let unitIndex = 0;

      if (extractedLesson.baseVerse && extractedLesson.baseVerseReference) {
        await storage.createStudyUnit({
          lessonId: lesson.id,
          type: "verse",
          content: JSON.stringify({
            text: extractedLesson.baseVerse,
            reference: extractedLesson.baseVerseReference
          }),
          orderIndex: unitIndex++,
          xpValue: 10,
          stage: "estude"
        });
      }

      if (extractedLesson.studyContent) {
        for (const content of extractedLesson.studyContent) {
          await storage.createStudyUnit({
            lessonId: lesson.id,
            type: content.type,
            content: JSON.stringify(content.content),
            orderIndex: unitIndex++,
            xpValue: 10,
            stage: "estude"
          });
        }
      }

      if (extractedLesson.meditationContent) {
        for (const content of extractedLesson.meditationContent) {
          await storage.createStudyUnit({
            lessonId: lesson.id,
            type: content.type,
            content: JSON.stringify(content.content),
            orderIndex: unitIndex++,
            xpValue: 10,
            stage: "medite"
          });
        }
      }

      if (extractedLesson.questions && extractedLesson.questions.length > 0) {
        for (const question of extractedLesson.questions) {
          await storage.createStudyUnit({
            lessonId: lesson.id,
            type: "multiple_choice",
            content: JSON.stringify(question),
            orderIndex: unitIndex++,
            xpValue: 15,
            stage: "responda"
          });
        }
      }

      // Restaurar o status original da revista (publicada ou rascunho)
      await storage.updateSeason(seasonId, { status: originalStatus });

      res.json({
        message: "PDF processado com sucesso",
        lessonTitle: extractedLesson.title,
        lessonId: lesson.id,
        topicsCount: extractedLesson.topics?.length || 0,
        questionsCount: extractedLesson.questions?.length || 0
      });
    } catch (error) {
      console.error("Import PDF exact error:", error);
      // Em caso de erro, restaurar para rascunho
      await storage.updateSeason(parseInt(req.params.id), { status: "draft" });
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      let userMessage = "Erro ao importar PDF";
      let errorType = "unknown";
      
      if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests") || errorMessage.includes("quota")) {
        userMessage = "Limite de requisições atingido. Aguarde alguns segundos e tente novamente, ou use outra chave Gemini.";
        errorType = "rate_limit";
      } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized") || errorMessage.includes("API key")) {
        userMessage = "Chave da API inválida ou expirada. Verifique a configuração da chave Gemini.";
        errorType = "auth";
      } else if (errorMessage.includes("503") || errorMessage.includes("Service Unavailable")) {
        userMessage = "Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.";
        errorType = "service_unavailable";
      } else if (errorMessage.includes("500") || errorMessage.includes("Internal Server Error")) {
        userMessage = "Erro interno no serviço de IA. Tente novamente mais tarde.";
        errorType = "server_error";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
        userMessage = "Tempo limite excedido. O PDF pode ser muito grande. Tente novamente.";
        errorType = "timeout";
      } else if (errorMessage.includes("JSON") || errorMessage.includes("parse")) {
        userMessage = "Erro ao processar resposta da IA. Tente novamente.";
        errorType = "parse_error";
      }
      
      res.status(500).json({ message: userMessage, errorType, details: errorMessage });
    }
  });

  // Criar/atualizar desafio final
  app.post("/api/study/admin/seasons/:id/final-challenge", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const { title, description, questions, timeLimitSeconds, xpReward, perfectXpBonus } = req.body;

      const existing = await storage.getSeasonFinalChallenge(seasonId);
      if (existing) {
        const updated = await storage.updateFinalChallenge(existing.id, {
          title,
          description,
          questions: JSON.stringify(questions),
          timeLimitSeconds: timeLimitSeconds || 150,
          questionCount: questions.length,
          xpReward: xpReward || 200,
          perfectXpBonus: perfectXpBonus || 100
        });
        return res.json(updated);
      }

      const challenge = await storage.createFinalChallenge({
        seasonId,
        title: title || "Desafio Final",
        description,
        questions: JSON.stringify(questions),
        timeLimitSeconds: timeLimitSeconds || 150,
        questionCount: questions.length,
        xpReward: xpReward || 200,
        perfectXpBonus: perfectXpBonus || 100,
        isActive: true
      });
      res.status(201).json(challenge);
    } catch (error) {
      console.error("Create final challenge error:", error);
      res.status(500).json({ message: "Erro ao criar desafio final" });
    }
  });

  // Gerar desafio final com IA
  app.post("/api/study/admin/seasons/:id/generate-final-challenge", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      if (isNaN(seasonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const season = await storage.getSeasonById(seasonId);
      if (!season) {
        return res.status(404).json({ message: "Temporada não encontrada" });
      }

      const lessons = await storage.getLessonsForSeason(seasonId);
      if (lessons.length === 0) {
        return res.status(400).json({ message: "Temporada não possui lições" });
      }

      if (!isAIConfigured()) {
        return res.status(500).json({ message: "IA não configurada" });
      }

      const lessonTitles = lessons.map((l: any) => l.title).join(", ");
      const challengeUnits = await generateExercisesFromTopic(
        `Gere 15 perguntas de múltipla escolha para um desafio final sobre os temas: ${lessonTitles}. 
        A temporada é "${season.title}". 
        Cada pergunta deve ter 4 opções e apenas 1 correta.`,
        15
      );

      if (!challengeUnits || challengeUnits.length === 0) {
        return res.status(500).json({ message: "Erro ao gerar perguntas com IA" });
      }

      const questions = challengeUnits.map((u: any, idx: number) => ({
        id: idx + 1,
        question: u.content?.question || u.content,
        options: u.content?.options || [],
        correctAnswer: u.content?.correctAnswer || 0,
        explanation: u.content?.explanation || ""
      }));

      const existing = await storage.getSeasonFinalChallenge(seasonId);
      if (existing) {
        const updated = await storage.updateFinalChallenge(existing.id, {
          questions: JSON.stringify(questions),
          questionCount: questions.length
        });
        return res.json({ message: "Desafio atualizado", challenge: updated });
      }

      const challenge = await storage.createFinalChallenge({
        seasonId,
        title: "Desafio Final",
        description: `Desafio final da temporada ${season.title}`,
        questions: JSON.stringify(questions),
        timeLimitSeconds: 150,
        questionCount: questions.length,
        xpReward: 200,
        perfectXpBonus: 100,
        isActive: true
      });

      res.status(201).json({ message: "Desafio criado", challenge });
    } catch (error) {
      console.error("Generate final challenge error:", error);
      res.status(500).json({ message: "Erro ao gerar desafio final" });
    }
  });

  // Liberar/bloquear lição de temporada
  app.post("/api/study/admin/seasons/:seasonId/lessons/:lessonId/toggle-lock", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const lessonId = parseInt(req.params.lessonId);
      
      if (isNaN(seasonId) || isNaN(lessonId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const lesson = await storage.getLessonById(lessonId);
      if (!lesson || lesson.seasonId !== seasonId) {
        return res.status(404).json({ message: "Lição não encontrada" });
      }

      const updated = await storage.updateStudyLesson(lessonId, {
        isLocked: !lesson.isLocked
      });

      res.json(updated);
    } catch (error) {
      console.error("Toggle lesson lock error:", error);
      res.status(500).json({ message: "Erro ao alterar estado da lição" });
    }
  });

  // ==================== PAINEL ESPIRITUALIDADE API ====================

  // Listar todos os devocionais (admin/espiritualidade)
  app.get("/api/espiritualidade/devotionals", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const devotionals = await storage.getAllDevotionalsAdmin();
      res.json(devotionals);
    } catch (error) {
      console.error("Get all devotionals admin error:", error);
      res.status(500).json({ message: "Erro ao buscar devocionais" });
    }
  });

  // Buscar devocional por ID (admin/espiritualidade)
  app.get("/api/espiritualidade/devotionals/:id", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const devotional = await storage.getDevotionalById(id);
      if (!devotional) {
        return res.status(404).json({ message: "Devocional nao encontrado" });
      }
      res.json(devotional);
    } catch (error) {
      console.error("Get devotional by id error:", error);
      res.status(500).json({ message: "Erro ao buscar devocional" });
    }
  });

  // Criar novo devocional (admin/espiritualidade)
  app.post("/api/espiritualidade/devotionals", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const { title, verse, verseReference, content, contentHtml, summary, prayer, imageUrl, mobileCropData, author, isPublished, isFeatured, scheduledAt } = req.body;
      
      if (!title || !verse || !verseReference || !content) {
        return res.status(400).json({ message: "Titulo, versiculo, referencia e conteudo sao obrigatorios" });
      }
      
      const devotional = await storage.createDevotional({
        title,
        verse,
        verseReference,
        content,
        contentHtml,
        summary,
        prayer,
        imageUrl,
        mobileCropData: mobileCropData ? JSON.stringify(mobileCropData) : null,
        author: author || req.user?.fullName || "Espiritualidade UMP",
        isPublished: isPublished || false,
        isFeatured: isFeatured || false,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        createdBy: req.user?.id
      });
      
      if (isPublished) {
        notifyNewDevotional(devotional.id, title, imageUrl).catch(err => 
          console.error("[Notifications] Error notifying new devotional:", err)
        );
      }
      
      res.status(201).json(devotional);
    } catch (error) {
      console.error("Create devotional error:", error);
      res.status(500).json({ message: "Erro ao criar devocional" });
    }
  });

  // Atualizar devocional (admin/espiritualidade)
  app.put("/api/espiritualidade/devotionals/:id", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, verse, verseReference, content, contentHtml, summary, prayer, imageUrl, mobileCropData, author, isPublished, isFeatured, scheduledAt } = req.body;
      
      const devotional = await storage.updateDevotional(id, {
        title,
        verse,
        verseReference,
        content,
        contentHtml,
        summary,
        prayer,
        imageUrl,
        mobileCropData: mobileCropData ? JSON.stringify(mobileCropData) : null,
        author,
        isPublished,
        isFeatured,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null
      });
      
      if (!devotional) {
        return res.status(404).json({ message: "Devocional nao encontrado" });
      }
      
      res.json(devotional);
    } catch (error) {
      console.error("Update devotional error:", error);
      res.status(500).json({ message: "Erro ao atualizar devocional" });
    }
  });

  // Excluir devocional (admin/espiritualidade)
  app.delete("/api/espiritualidade/devotionals/:id", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDevotional(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Devocional nao encontrado" });
      }
      
      res.json({ message: "Devocional excluido com sucesso" });
    } catch (error) {
      console.error("Delete devotional error:", error);
      res.status(500).json({ message: "Erro ao excluir devocional" });
    }
  });

  // Publicar devocional (admin/espiritualidade)
  app.post("/api/espiritualidade/devotionals/:id/publish", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const devotional = await storage.publishDevotional(id);
      
      if (!devotional) {
        return res.status(404).json({ message: "Devocional nao encontrado" });
      }
      
      // Send push notification when devotional is published
      notifyNewDevotional(devotional.id, devotional.title, devotional.imageUrl).catch(err => 
        console.error("[Notifications] Error notifying new devotional:", err)
      );
      
      res.json(devotional);
    } catch (error) {
      console.error("Publish devotional error:", error);
      res.status(500).json({ message: "Erro ao publicar devocional" });
    }
  });

  // Despublicar devocional (admin/espiritualidade)
  app.post("/api/espiritualidade/devotionals/:id/unpublish", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const devotional = await storage.unpublishDevotional(id);
      
      if (!devotional) {
        return res.status(404).json({ message: "Devocional nao encontrado" });
      }
      
      res.json(devotional);
    } catch (error) {
      console.error("Unpublish devotional error:", error);
      res.status(500).json({ message: "Erro ao despublicar devocional" });
    }
  });

  // Listar pedidos de oracao pendentes (admin/espiritualidade)
  app.get("/api/espiritualidade/prayers", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const status = req.query.status as string;
      let prayers;
      
      if (status === "pending") {
        prayers = await storage.getPendingPrayerRequests();
      } else if (status === "approved") {
        prayers = await storage.getApprovedPrayerRequests();
      } else {
        prayers = await storage.getAllPrayerRequests(status);
      }
      
      res.json(prayers);
    } catch (error) {
      console.error("Get prayers error:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos de oracao" });
    }
  });

  // Buscar pedido de oracao por ID (admin/espiritualidade)
  app.get("/api/espiritualidade/prayers/:id", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const prayer = await storage.getPrayerRequestById(id);
      
      if (!prayer) {
        return res.status(404).json({ message: "Pedido nao encontrado" });
      }
      
      res.json(prayer);
    } catch (error) {
      console.error("Get prayer by id error:", error);
      res.status(500).json({ message: "Erro ao buscar pedido de oracao" });
    }
  });

  // Aprovar pedido de oracao (admin/espiritualidade)
  app.patch("/api/espiritualidade/prayers/:id/approve", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const prayer = await storage.approvePrayerRequest(id, req.user!.id);
      
      if (!prayer) {
        return res.status(404).json({ message: "Pedido nao encontrado" });
      }
      
      if (prayer.userId) {
        notifyPrayerApproved(prayer.userId, prayer.id).catch(err => 
          console.error("[Notifications] Error notifying prayer approved:", err)
        );
      }
      
      res.json(prayer);
    } catch (error) {
      console.error("Approve prayer error:", error);
      res.status(500).json({ message: "Erro ao aprovar pedido de oracao" });
    }
  });

  // Rejeitar pedido de oracao (admin/espiritualidade)
  app.patch("/api/espiritualidade/prayers/:id/reject", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const prayer = await storage.rejectPrayerRequest(id, req.user!.id, reason);
      
      if (!prayer) {
        return res.status(404).json({ message: "Pedido nao encontrado" });
      }
      
      res.json(prayer);
    } catch (error) {
      console.error("Reject prayer error:", error);
      res.status(500).json({ message: "Erro ao rejeitar pedido de oracao" });
    }
  });

  app.delete("/api/espiritualidade/prayers/:id", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const prayer = await storage.getPrayerRequestById(id);
      if (!prayer) {
        return res.status(404).json({ message: "Pedido nao encontrado" });
      }
      
      await logAuditAction(req.user?.id, "delete", "prayer_request", id, `Pedido de oracao removido: ${prayer.name}`, req);
      
      await storage.deletePrayerRequest(id);
      
      res.json({ message: "Pedido de oracao removido com sucesso" });
    } catch (error) {
      console.error("Delete prayer error:", error);
      res.status(500).json({ message: "Erro ao remover pedido de oracao" });
    }
  });

  // Mural da oracao publico (pedidos aprovados)
  app.get("/api/site/prayer-wall", async (req, res) => {
    try {
      const prayers = await storage.getApprovedPrayerRequests();
      res.json(prayers);
    } catch (error) {
      console.error("Get prayer wall error:", error);
      res.status(500).json({ message: "Erro ao buscar mural de oracao" });
    }
  });

  // Incrementar contador "Estou orando" (publico)
  app.post("/api/site/prayer-wall/:id/pray", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const prayer = await storage.incrementPrayerCount(id);
      
      if (!prayer) {
        return res.status(404).json({ message: "Pedido nao encontrado" });
      }
      
      res.json({ inPrayerCount: prayer.inPrayerCount });
    } catch (error) {
      console.error("Increment prayer count error:", error);
      res.status(500).json({ message: "Erro ao registrar oracao" });
    }
  });

  // Dashboard estatisticas espiritualidade
  app.get("/api/espiritualidade/stats", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const [allDevotionals, pendingPrayers, approvedPrayers] = await Promise.all([
        storage.getAllDevotionalsAdmin(),
        storage.getPendingPrayerRequests(),
        storage.getApprovedPrayerRequests()
      ]);
      
      const publishedDevotionals = allDevotionals.filter(d => d.isPublished);
      const draftDevotionals = allDevotionals.filter(d => !d.isPublished);
      
      res.json({
        devotionals: {
          total: allDevotionals.length,
          published: publishedDevotionals.length,
          drafts: draftDevotionals.length
        },
        prayers: {
          pending: pendingPrayers.length,
          approved: approvedPrayers.length
        }
      });
    } catch (error) {
      console.error("Get espiritualidade stats error:", error);
      res.status(500).json({ message: "Erro ao buscar estatisticas" });
    }
  });

  // ==================== DEVOTIONAL COMMENTS ROUTES ====================

  // Get approved comments for a devotional (public)
  app.get("/api/site/devotionals/:id/comments", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const comments = await storage.getApprovedDevotionalComments(id);
      res.json(comments);
    } catch (error) {
      console.error("Get devotional comments error:", error);
      res.status(500).json({ message: "Erro ao buscar comentarios" });
    }
  });

  // Add comment to a devotional (public)
  app.post("/api/site/devotionals/:id/comments", async (req, res) => {
    try {
      const devotionalId = parseInt(req.params.id);
      if (isNaN(devotionalId)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      
      const { name, content, userId } = req.body;
      
      if (!name || !content) {
        return res.status(400).json({ message: "Nome e comentario sao obrigatorios" });
      }
      
      if (name.trim().length < 2) {
        return res.status(400).json({ message: "Nome deve ter pelo menos 2 caracteres" });
      }
      
      if (content.trim().length < 3) {
        return res.status(400).json({ message: "Comentario deve ter pelo menos 3 caracteres" });
      }
      
      if (content.trim().length > 500) {
        return res.status(400).json({ message: "Comentario deve ter no maximo 500 caracteres" });
      }
      
      const moderation = moderateContent(content);
      
      if (shouldAutoReject(moderation)) {
        return res.status(400).json({ 
          message: "Seu comentario contem conteudo inapropriado e nao pode ser enviado.",
          moderated: true 
        });
      }
      
      const comment = await storage.createDevotionalComment({
        devotionalId,
        name: name.trim(),
        content: moderation.hasProfanity ? moderation.cleanedText : content.trim(),
        userId: userId || null,
      });
      
      // Auto-approve if content is clean (no profanity)
      const shouldAutoApprove = !moderation.hasProfanity;
      if (shouldAutoApprove) {
        await storage.autoApproveDevotionalComment(comment.id);
      }
      
      const devotional = await storage.getDevotionalById(devotionalId);
      if (devotional) {
        notifyNewComment(devotionalId, devotional.title, name.trim(), content.trim()).catch(err => 
          console.error("[Notifications] Error notifying new comment:", err)
        );
      }
      
      const message = shouldAutoApprove 
        ? "Comentario publicado com sucesso!" 
        : "Comentario enviado! Aguardando aprovacao.";
      
      res.status(201).json({ message, id: comment.id, autoApproved: shouldAutoApprove });
    } catch (error) {
      console.error("Create devotional comment error:", error);
      res.status(500).json({ message: "Erro ao enviar comentario" });
    }
  });

  // Get all comments for moderation (admin/espiritualidade)
  app.get("/api/espiritualidade/comments", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const comments = await storage.getAllDevotionalComments();
      res.json(comments);
    } catch (error) {
      console.error("Get all comments error:", error);
      res.status(500).json({ message: "Erro ao buscar comentarios" });
    }
  });

  // Approve a comment (admin/espiritualidade)
  app.patch("/api/espiritualidade/comments/:id/approve", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      
      const comment = await storage.approveDevotionalComment(id, req.user!.id);
      if (!comment) {
        return res.status(404).json({ message: "Comentario nao encontrado" });
      }
      
      await logAuditAction(req.user?.id, "update", "devotional_comment", id, "Comentario aprovado", req);
      
      res.json(comment);
    } catch (error) {
      console.error("Approve comment error:", error);
      res.status(500).json({ message: "Erro ao aprovar comentario" });
    }
  });

  // Highlight/unhighlight a comment (admin/espiritualidade)
  app.patch("/api/espiritualidade/comments/:id/highlight", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      
      const { isHighlighted } = req.body;
      const comment = await storage.highlightDevotionalComment(id, isHighlighted === true);
      if (!comment) {
        return res.status(404).json({ message: "Comentario nao encontrado" });
      }
      
      res.json(comment);
    } catch (error) {
      console.error("Highlight comment error:", error);
      res.status(500).json({ message: "Erro ao destacar comentario" });
    }
  });

  // Delete a comment (admin/espiritualidade)
  app.delete("/api/espiritualidade/comments/:id", authenticateToken, requireAdminOrEspiritualidade, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      
      await logAuditAction(req.user?.id, "delete", "devotional_comment", id, "Comentario removido", req);
      
      await storage.deleteDevotionalComment(id);
      res.json({ message: "Comentario removido com sucesso" });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ message: "Erro ao remover comentario" });
    }
  });

  // ==================== EVENTOS ESPECIAIS + CARDS COLECIONÁVEIS ====================

  // === ROTAS ADMIN - EVENTOS ESPECIAIS DE ESTUDO ===

  // Listar todos os eventos de estudo (admin)
  app.get("/api/admin/study-events", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const events = await storage.getAllStudyEvents();
      res.json(events);
    } catch (error) {
      console.error("Get study events error:", error);
      res.status(500).json({ message: "Erro ao buscar eventos" });
    }
  });

  // Criar novo evento de estudo (admin)
  app.post("/api/admin/study-events", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertStudyEventSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      const event = await storage.createStudyEvent(validatedData);
      await logAuditAction(req.user?.id, "create", "study_event", event.id, `Evento criado: ${event.title}`, req);
      res.status(201).json(event);
    } catch (error) {
      console.error("Create study event error:", error);
      res.status(500).json({ message: "Erro ao criar evento" });
    }
  });

  // Obter evento de estudo por ID (admin)
  app.get("/api/admin/study-events/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const event = await storage.getStudyEventById(id);
      if (!event) {
        return res.status(404).json({ message: "Evento nao encontrado" });
      }
      res.json(event);
    } catch (error) {
      console.error("Get study event error:", error);
      res.status(500).json({ message: "Erro ao buscar evento" });
    }
  });

  // Atualizar evento de estudo (admin)
  app.patch("/api/admin/study-events/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const event = await storage.updateStudyEvent(id, req.body);
      if (!event) {
        return res.status(404).json({ message: "Evento nao encontrado" });
      }
      await logAuditAction(req.user?.id, "update", "study_event", id, `Evento atualizado: ${event.title}`, req);
      res.json(event);
    } catch (error) {
      console.error("Update study event error:", error);
      res.status(500).json({ message: "Erro ao atualizar evento" });
    }
  });

  // Deletar evento de estudo (admin)
  app.delete("/api/admin/study-events/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      await logAuditAction(req.user?.id, "delete", "study_event", id, "Evento removido", req);
      await storage.deleteStudyEvent(id);
      res.json({ message: "Evento removido com sucesso" });
    } catch (error) {
      console.error("Delete study event error:", error);
      res.status(500).json({ message: "Erro ao remover evento" });
    }
  });

  // === ROTAS ADMIN - LIÇÕES DE EVENTOS ===

  // Listar licoes de um evento (admin)
  app.get("/api/admin/study-events/:eventId/lessons", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const lessons = await storage.getStudyEventLessons(eventId);
      res.json(lessons);
    } catch (error) {
      console.error("Get event lessons error:", error);
      res.status(500).json({ message: "Erro ao buscar licoes" });
    }
  });

  // Criar licao de evento (admin)
  app.post("/api/admin/study-events/:eventId/lessons", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const validatedData = insertStudyEventLessonSchema.parse({
        ...req.body,
        eventId,
      });
      const lesson = await storage.createStudyEventLesson(validatedData);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Create event lesson error:", error);
      res.status(500).json({ message: "Erro ao criar licao" });
    }
  });

  // Atualizar licao de evento (admin)
  app.patch("/api/admin/study-events/:eventId/lessons/:lessonId", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      if (isNaN(lessonId)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const lesson = await storage.updateStudyEventLesson(lessonId, req.body);
      if (!lesson) {
        return res.status(404).json({ message: "Lição não encontrada" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Update event lesson error:", error);
      res.status(500).json({ message: "Erro ao atualizar licao" });
    }
  });

  // Deletar licao de evento (admin)
  app.delete("/api/admin/study-events/:eventId/lessons/:lessonId", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      if (isNaN(lessonId)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      await storage.deleteStudyEventLesson(lessonId);
      res.json({ message: "Lição removida com sucesso" });
    } catch (error) {
      console.error("Delete event lesson error:", error);
      res.status(500).json({ message: "Erro ao remover licao" });
    }
  });

  // Gerar evento com IA (admin)
  app.post("/api/admin/study-events/ai-generate", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { text, theme, imageUrl, year, month, startDay, endDay, keyNumber } = req.body;
      
      if (!text || !theme || !year || !month || !startDay || !endDay) {
        return res.status(400).json({ message: "Campos obrigatórios: text, theme, year, month, startDay, endDay" });
      }

      const startDate = new Date(year, month - 1, startDay, 0, 0, 0);
      const endDate = new Date(year, month - 1, endDay, 23, 59, 59);
      
      if (endDate <= startDate) {
        return res.status(400).json({ message: "Data de término deve ser após a data de início" });
      }

      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      const monthName = monthNames[month - 1];

      console.log(`[Admin] Gerando evento com IA - Tema: ${theme}, Mês: ${monthName}, Chave: ${keyNumber || 'auto'}`);
      
      const generatedContent = await generateEventContentFromText(text, theme, monthName, keyNumber);
      
      const event = await storage.createStudyEvent({
        title: generatedContent.title,
        description: generatedContent.description,
        theme: theme.toLowerCase().replace(/\s+/g, '-'),
        imageUrl: imageUrl || null,
        startDate: startDate,
        endDate: endDate,
        status: "draft",
        lessonsCount: 5,
        xpMultiplier: 1,
        createdBy: req.user!.id,
      });
      
      for (const lessonData of generatedContent.lessons) {
        await storage.createStudyEventLesson({
          eventId: event.id,
          dayNumber: lessonData.dayNumber,
          title: lessonData.title,
          content: lessonData.content,
          verseReference: lessonData.verseReference,
          verseText: lessonData.verseText,
          questions: lessonData.questions,
          xpReward: lessonData.xpReward,
          status: "draft",
        });
      }

      await logAuditAction(req.user?.id, "create", "study_event", event.id, `Evento gerado por IA: ${event.title}`, req);
      
      res.status(201).json({
        event,
        lessonsCreated: generatedContent.lessons.length,
        message: `Evento "${event.title}" criado com ${generatedContent.lessons.length} lições`
      });
    } catch (error: any) {
      console.error("AI event generation error:", error);
      res.status(500).json({ message: error.message || "Erro ao gerar evento com IA" });
    }
  });

  // === ROTAS ADMIN - CARDS COLECIONÁVEIS ===

  // Listar todos os cards (admin)
  app.get("/api/admin/cards", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const cards = await storage.getAllCollectibleCards();
      res.json(cards);
    } catch (error) {
      console.error("Get cards error:", error);
      res.status(500).json({ message: "Erro ao buscar cards" });
    }
  });

  // Criar novo card (admin)
  app.post("/api/admin/cards", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertCollectibleCardSchema.parse(req.body);
      const card = await storage.createCollectibleCard(validatedData);
      await logAuditAction(req.user?.id, "create", "collectible_card", card.id, `Card criado: ${card.name}`, req);
      res.status(201).json(card);
    } catch (error) {
      console.error("Create card error:", error);
      res.status(500).json({ message: "Erro ao criar card" });
    }
  });

  // Atualizar card (admin)
  app.patch("/api/admin/cards/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const card = await storage.updateCollectibleCard(id, req.body);
      if (!card) {
        return res.status(404).json({ message: "Card nao encontrado" });
      }
      await logAuditAction(req.user?.id, "update", "collectible_card", id, `Card atualizado: ${card.name}`, req);
      res.json(card);
    } catch (error) {
      console.error("Update card error:", error);
      res.status(500).json({ message: "Erro ao atualizar card" });
    }
  });

  // Deletar card (admin)
  app.delete("/api/admin/cards/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      await logAuditAction(req.user?.id, "delete", "collectible_card", id, "Card removido", req);
      await storage.deleteCollectibleCard(id);
      res.json({ message: "Card removido com sucesso" });
    } catch (error) {
      console.error("Delete card error:", error);
      res.status(500).json({ message: "Erro ao remover card" });
    }
  });

  // === ROTAS MEMBROS - EVENTOS ESPECIAIS ===

  // Listar eventos ativos para membros
  app.get("/api/study/events", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const events = await storage.getActiveStudyEvents();
      res.json(events);
    } catch (error) {
      console.error("Get active events error:", error);
      res.status(500).json({ message: "Erro ao buscar eventos" });
    }
  });

  // Obter evento por ID com progresso do usuario
  app.get("/api/study/events/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const event = await storage.getStudyEventById(id);
      // Accept active, published, or completed events
      const validStatuses = ["active", "published", "completed"];
      if (!event || !validStatuses.includes(event.status)) {
        return res.status(404).json({ message: "Evento nao encontrado" });
      }
      const progress = await storage.getUserEventProgress(req.user!.id, id);
      const lessons = await storage.getStudyEventLessons(id);
      res.json({ event, lessons, progress });
    } catch (error) {
      console.error("Get event details error:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes do evento" });
    }
  });

  // Obter licao de evento
  app.get("/api/study/events/:eventId/lessons/:dayNumber", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const dayNumber = parseInt(req.params.dayNumber);
      if (isNaN(eventId) || isNaN(dayNumber)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const lesson = await storage.getStudyEventLessonByDay(eventId, dayNumber);
      if (!lesson) {
        return res.status(404).json({ message: "Lição não encontrada" });
      }
      const progress = await storage.getUserEventLessonProgress(req.user!.id, lesson.id);
      res.json({ lesson, progress });
    } catch (error) {
      console.error("Get event lesson error:", error);
      res.status(500).json({ message: "Erro ao buscar licao" });
    }
  });

  // Completar licao de evento
  app.post("/api/study/events/:eventId/lessons/:lessonId/complete", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const lessonId = parseInt(req.params.lessonId);
      if (isNaN(eventId) || isNaN(lessonId)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      
      const { score, totalQuestions, correctAnswers, usedHints } = req.body;
      
      // Salvar progresso
      const progress = await storage.saveUserEventProgress({
        userId: req.user!.id,
        eventId,
        lessonId,
        completed: true,
        score: score || 0,
        totalQuestions: totalQuestions || 0,
        correctAnswers: correctAnswers || 0,
        usedHints: usedHints || false,
        xpEarned: 50, // XP base
        completedAt: new Date(),
      });

      // Verificar se completou todas as licoes do evento
      const event = await storage.getStudyEventById(eventId);
      if (event && event.cardId) {
        const allProgress = await storage.getUserEventProgress(req.user!.id, eventId);
        const completedLessons = allProgress.filter(p => p.completed).length;
        const eventLessons = await storage.getStudyEventLessons(eventId);
        
        if (completedLessons === eventLessons.length) {
          // Calcular performance media
          const totalCorrect = allProgress.reduce((sum, p) => sum + (p.correctAnswers || 0), 0);
          const totalQs = allProgress.reduce((sum, p) => sum + (p.totalQuestions || 0), 0);
          const avgPerformance = totalQs > 0 ? (totalCorrect / totalQs) * 100 : 0;
          const anyHints = allProgress.some(p => p.usedHints);
          
          // Calcular raridade e dar o card
          const rarity = calculateCardRarity(avgPerformance, anyHints);
          await storage.awardUserCard({
            userId: req.user!.id,
            cardId: event.cardId,
            rarity,
            sourceType: "event",
            sourceId: eventId,
            performance: avgPerformance,
          });
        }
      }

      res.json(progress);
    } catch (error) {
      console.error("Complete event lesson error:", error);
      res.status(500).json({ message: "Erro ao completar licao" });
    }
  });

  // === ROTAS MEMBROS - MEUS CARDS ===

  // Listar cards do usuario
  app.get("/api/study/cards", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const cards = await storage.getUserCards(req.user!.id);
      res.json(cards);
    } catch (error) {
      console.error("Get user cards error:", error);
      res.status(500).json({ message: "Erro ao buscar seus cards" });
    }
  });

  // Obter detalhes de um card do usuario
  app.get("/api/study/cards/:cardId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "ID invalido" });
      }
      const userCard = await storage.getUserCard(req.user!.id, cardId);
      if (!userCard) {
        return res.status(404).json({ message: "Card nao encontrado" });
      }
      const cardDetails = await storage.getCollectibleCardById(cardId);
      res.json({ ...userCard, card: cardDetails });
    } catch (error) {
      console.error("Get user card error:", error);
      res.status(500).json({ message: "Erro ao buscar card" });
    }
  });

  // Listar todos os cards disponiveis (catalogo)
  app.get("/api/study/cards/catalog", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const allCards = await storage.getActiveCollectibleCards();
      const userCards = await storage.getUserCards(req.user!.id);
      const userCardIds = userCards.map(c => c.cardId);
      
      const catalog = allCards.map(card => ({
        ...card,
        owned: userCardIds.includes(card.id),
        userRarity: userCards.find(uc => uc.cardId === card.id)?.rarity || null,
      }));
      
      res.json(catalog);
    } catch (error) {
      console.error("Get cards catalog error:", error);
      res.status(500).json({ message: "Erro ao buscar catalogo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
