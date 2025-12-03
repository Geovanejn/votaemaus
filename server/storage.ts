import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { sendCongratulationsEmail } from "./email";
import type {
  User,
  InsertUser,
  Position,
  Election,
  InsertElection,
  Candidate,
  InsertCandidate,
  Vote,
  InsertVote,
  VerificationCode,
  InsertVerificationCode,
  CandidateWithDetails,
  ElectionResults,
  ElectionPosition,
  InsertElectionPosition,
  ElectionAttendance,
  InsertElectionAttendance,
} from "@shared/schema";

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "emaus-vota.db");
const db = new Database(dbPath);

export interface IStorage {
  getUserByEmail(email: string): User | undefined;
  getUserById(id: number): User | undefined;
  createUser(user: InsertUser): User;
  updateUser(id: number, updates: Partial<Omit<User, 'id'>>): User | undefined;
  getAllMembers(excludeAdmins?: boolean): User[];
  deleteMember(id: number): void;
  
  getAllPositions(): Position[];
  
  getActiveElection(): Election | null;
  getElectionById(id: number): Election | undefined;
  createElection(name: string): Election;
  closeElection(id: number): void;
  finalizeElection(id: number): void;
  getElectionHistory(): Election[];
  setWinner(electionId: number, candidateId: number, positionId: number, scrutiny: number): void;
  
  // Election Positions management
  getElectionPositions(electionId: number): ElectionPosition[];
  getActiveElectionPosition(electionId: number): ElectionPosition | null;
  getElectionPositionById(id: number): ElectionPosition | null;
  advancePositionScrutiny(electionPositionId: number): void;
  openNextPosition(electionId: number): ElectionPosition | null;
  openPosition(electionPositionId: number): ElectionPosition;
  completePosition(electionPositionId: number): void;
  forceCompletePosition(electionPositionId: number, reason: string, shouldReopen?: boolean): void;
  
  // Election Attendance management
  getElectionAttendance(electionId: number): ElectionAttendance[];
  getPresentCount(electionId: number): number;
  getPresentCountForPosition(electionPositionId: number): number;
  isMemberPresent(electionId: number, memberId: number): boolean;
  setMemberAttendance(electionId: number, memberId: number, isPresent: boolean): void;
  initializeAttendance(electionId: number): void;
  createAttendanceSnapshot(electionPositionId: number): void;
  
  getAllCandidates(): Candidate[];
  getCandidatesByElection(electionId: number): CandidateWithDetails[];
  getCandidatesByPosition(positionId: number, electionId: number): Candidate[];
  createCandidate(candidate: InsertCandidate): Candidate;
  clearCandidatesForPosition(positionId: number, electionId: number): void;
  
  createVote(vote: InsertVote): Vote;
  hasUserVoted(voterId: number, positionId: number, electionId: number, scrutinyRound: number): boolean;
  
  getElectionResults(electionId: number): ElectionResults | null;
  getLatestElectionResults(): ElectionResults | null;
  getElectionWinners(electionId: number): Array<{ userId: number; positionId: number; candidateId: number; wonAtScrutiny: number }>;
  
  getVoterAttendance(electionId: number): Array<any>;
  getVoteTimeline(electionId: number): Array<any>;
  getElectionAuditData(electionId: number): any | null;
  
  createVerificationCode(data: InsertVerificationCode): VerificationCode;
  getValidVerificationCode(email: string, code: string): VerificationCode | null;
  deleteVerificationCodesByEmail(email: string): void;
  
  createPdfVerification(electionId: number, verificationHash: string, presidentName?: string): any;
  getPdfVerification(verificationHash: string): any | null;

  // Study System
  getStudyWeekById(weekId: number): any | null;
  getStudyWeekByNumber(weekNumber: number, year: number): any | null;
  getAllStudyWeeks(): any[];
  getLessonsForWeek(weekId: number): any[];
  getLessonById(lessonId: number): any | null;
  getUnitsByLessonId(lessonId: number): any[];
  getStudyUnitById(unitId: number): any | null;
  createStudyWeek(data: { title: string; description?: string; weekNumber: number; year: number; createdBy?: number; aiMetadata?: string }): any;
  createStudyLesson(data: { studyWeekId: number; orderIndex: number; title: string; type?: string; description?: string; xpReward?: number; estimatedMinutes?: number; icon?: string; isBonus?: boolean }): any;
  createStudyUnit(data: { lessonId: number; orderIndex: number; type: string; content: any; xpValue?: number }): any;
  updateStudyLesson(lessonId: number, data: { title?: string; type?: string; description?: string; xpReward?: number; estimatedMinutes?: number; icon?: string; isBonus?: boolean; orderIndex?: number }): any | null;
  deleteStudyLesson(lessonId: number): boolean;
  updateStudyUnit(unitId: number, data: { type?: string; content?: any; xpValue?: number; orderIndex?: number }): any | null;
  deleteStudyUnit(unitId: number): boolean;
  updateStudyWeek(weekId: number, data: { title?: string; description?: string; weekNumber?: number; year?: number; status?: string }): any | null;
  deleteStudyWeek(weekId: number): boolean;
  getUnitsForLesson(lessonId: number): any[];
  publishStudyWeek(weekId: number): any | null;
}

export class SQLiteStorage implements IStorage {
  getUserByEmail(email: string): User | undefined {
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    const row = stmt.get(email) as any;
    if (!row) return undefined;
    
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      password: row.password,
      hasPassword: Boolean(row.has_password),
      photoUrl: row.photo_url,
      birthdate: row.birthdate,
      isAdmin: Boolean(row.is_admin),
      isMember: Boolean(row.is_member),
      activeMember: Boolean(row.active_member),
    };
  }

  getUserById(id: number): User | undefined {
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      password: row.password,
      hasPassword: Boolean(row.has_password),
      photoUrl: row.photo_url,
      birthdate: row.birthdate,
      isAdmin: Boolean(row.is_admin),
      isMember: Boolean(row.is_member),
      activeMember: Boolean(row.active_member),
    };
  }

  createUser(user: InsertUser): User {
    const stmt = db.prepare(
      "INSERT INTO users (full_name, email, password, has_password, photo_url, birthdate, is_admin, is_member, active_member) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
    );
    const row = stmt.get(
      user.fullName,
      user.email,
      user.password,
      user.hasPassword ? 1 : 0,
      user.photoUrl || null,
      user.birthdate || null,
      user.isAdmin ? 1 : 0,
      user.isMember ? 1 : 0,
      user.activeMember ? 1 : 0
    ) as any;
    
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      password: row.password,
      hasPassword: Boolean(row.has_password),
      photoUrl: row.photo_url,
      birthdate: row.birthdate,
      isAdmin: Boolean(row.is_admin),
      isMember: Boolean(row.is_member),
      activeMember: Boolean(row.active_member),
    };
  }

  getAllMembers(excludeAdmins: boolean = false): User[] {
    const query = excludeAdmins 
      ? "SELECT * FROM users WHERE is_member = 1 AND is_admin = 0 ORDER BY full_name"
      : "SELECT * FROM users WHERE is_member = 1 ORDER BY full_name";
    const stmt = db.prepare(query);
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      password: row.password,
      hasPassword: Boolean(row.has_password),
      photoUrl: row.photo_url,
      birthdate: row.birthdate,
      isAdmin: Boolean(row.is_admin),
      isMember: Boolean(row.is_member),
      activeMember: Boolean(row.active_member),
    }));
  }

  updateUser(id: number, updates: Partial<Omit<User, 'id'>>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.fullName !== undefined) {
      fields.push("full_name = ?");
      values.push(updates.fullName);
    }
    if (updates.email !== undefined) {
      fields.push("email = ?");
      values.push(updates.email);
    }
    if (updates.password !== undefined) {
      fields.push("password = ?");
      values.push(updates.password);
    }
    if (updates.hasPassword !== undefined) {
      fields.push("has_password = ?");
      values.push(updates.hasPassword ? 1 : 0);
    }
    if (updates.photoUrl !== undefined) {
      fields.push("photo_url = ?");
      values.push(updates.photoUrl);
    }
    if (updates.birthdate !== undefined) {
      fields.push("birthdate = ?");
      values.push(updates.birthdate);
    }
    if (updates.isAdmin !== undefined) {
      fields.push("is_admin = ?");
      values.push(updates.isAdmin ? 1 : 0);
    }
    if (updates.isMember !== undefined) {
      fields.push("is_member = ?");
      values.push(updates.isMember ? 1 : 0);
    }
    if (updates.activeMember !== undefined) {
      fields.push("active_member = ?");
      values.push(updates.activeMember ? 1 : 0);
    }

    if (fields.length === 0) return user;

    values.push(id);
    const stmt = db.prepare(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ? RETURNING *`
    );
    const row = stmt.get(...values) as any;

    if (!row) return undefined;

    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      password: row.password,
      hasPassword: Boolean(row.has_password),
      photoUrl: row.photo_url,
      birthdate: row.birthdate,
      isAdmin: Boolean(row.is_admin),
      isMember: Boolean(row.is_member),
      activeMember: Boolean(row.active_member),
    };
  }
  
  deleteMember(id: number): void {
  // Apaga votos onde o usuário foi votante
  db.prepare("DELETE FROM votes WHERE voter_id = ?").run(id);

  // Apaga votos onde o usuário foi candidato
  db.prepare(`
    DELETE FROM votes 
    WHERE candidate_id IN (SELECT id FROM candidates WHERE user_id = ?)
  `).run(id);

  // Apaga vencedores ligados às candidaturas do usuário
  db.prepare(`
    DELETE FROM election_winners 
    WHERE candidate_id IN (SELECT id FROM candidates WHERE user_id = ?)
  `).run(id);

  // Apaga candidaturas do usuário
  db.prepare("DELETE FROM candidates WHERE user_id = ?").run(id);

  // Apaga registros de presença
  db.prepare("DELETE FROM election_attendance WHERE member_id = ?").run(id);

  // Finalmente, remove o usuário (se não for admin)
  db.prepare("DELETE FROM users WHERE id = ? AND is_admin = 0").run(id);
  }

  getAllPositions(): Position[] {
    const stmt = db.prepare("SELECT * FROM positions ORDER BY id");
    return stmt.all() as Position[];
  }

  getActiveElection(): Election | null {
    const stmt = db.prepare("SELECT * FROM elections WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1");
    const row = stmt.get() as any;
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      closedAt: row.closed_at,
    };
  }

  getElectionById(id: number): Election | undefined {
    const stmt = db.prepare("SELECT * FROM elections WHERE id = ?");
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    
    return {
      id: row.id,
      name: row.name,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      closedAt: row.closed_at,
    };
  }

  createElection(name: string): Election {
    db.prepare("UPDATE elections SET is_active = 0 WHERE is_active = 1").run();
    
    const createdAt = new Date().toISOString();
    
    const stmt = db.prepare(
      "INSERT INTO elections (name, is_active, created_at) VALUES (?, 1, ?) RETURNING *"
    );
    const row = stmt.get(name, createdAt) as any;
    
    // Create election_positions for all positions, all starting as pending
    const positions = this.getAllPositions();
    for (let i = 0; i < positions.length; i++) {
      db.prepare(`
        INSERT INTO election_positions (election_id, position_id, order_index, status, current_scrutiny)
        VALUES (?, ?, ?, 'pending', 1)
      `).run(row.id, positions[i].id, i);
    }
    
    return {
      id: row.id,
      name: row.name,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      closedAt: row.closed_at,
    };
  }

  closeElection(id: number): void {
    const stmt = db.prepare("UPDATE elections SET is_active = 0 WHERE id = ?");
    stmt.run(id);
    
    // Close all election_positions
    db.prepare("UPDATE election_positions SET status = 'completed', closed_at = datetime('now') WHERE election_id = ?").run(id);
  }

  finalizeElection(id: number): void {
    const closedAt = new Date().toISOString();
    
    const stmt = db.prepare("UPDATE elections SET is_active = 0, closed_at = ? WHERE id = ?");
    stmt.run(closedAt, id);
    
    // Close all election_positions if not already closed
    db.prepare("UPDATE election_positions SET status = 'completed', closed_at = ? WHERE election_id = ? AND status != 'completed'").run(closedAt, id);
  }

  getElectionHistory(): Election[] {
    const stmt = db.prepare("SELECT * FROM elections WHERE is_active = 0 AND closed_at IS NOT NULL ORDER BY closed_at DESC");
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      closedAt: row.closed_at,
    }));
  }

  setWinner(electionId: number, candidateId: number, positionId: number, scrutiny: number): void {
    // Get candidate info for logging
    const candidateStmt = db.prepare("SELECT user_id, name FROM candidates WHERE id = ?");
    const candidate = candidateStmt.get(candidateId) as any;
    
    console.log(`[setWinner] Setting winner for election ${electionId}, position ${positionId}, candidate ${candidateId} (userId: ${candidate?.user_id}), scrutiny ${scrutiny}`);
    
    // Insert or update winner for this position
    const checkStmt = db.prepare("SELECT id FROM election_winners WHERE election_id = ? AND position_id = ?");
    const existing = checkStmt.get(electionId, positionId) as any;
    
    if (existing) {
      const updateStmt = db.prepare("UPDATE election_winners SET candidate_id = ?, won_at_scrutiny = ? WHERE election_id = ? AND position_id = ?");
      updateStmt.run(candidateId, scrutiny, electionId, positionId);
      console.log(`[setWinner] Updated existing winner record`);
    } else {
      const insertStmt = db.prepare("INSERT INTO election_winners (election_id, position_id, candidate_id, won_at_scrutiny) VALUES (?, ?, ?, ?)");
      insertStmt.run(electionId, positionId, candidateId, scrutiny);
      console.log(`[setWinner] Inserted new winner record`);
    }
    
    // Mark the election_position as completed
    db.prepare("UPDATE election_positions SET status = 'completed', closed_at = datetime('now') WHERE election_id = ? AND position_id = ?")
      .run(electionId, positionId);
    
    // Send congratulations email to the elected candidate
    try {
      const candidateStmt = db.prepare(`
        SELECT c.name, c.email, p.name as position_name
        FROM candidates c
        JOIN positions p ON c.position_id = p.id
        WHERE c.id = ?
      `);
      const candidateData = candidateStmt.get(candidateId) as { name: string; email: string; position_name: string } | undefined;
      
      if (candidateData) {
        // Send email asynchronously (don't wait for it)
        sendCongratulationsEmail(
          candidateData.name,
          candidateData.email,
          candidateData.position_name,
          scrutiny
        ).catch(error => {
          console.error("Failed to send congratulations email:", error);
        });
      }
    } catch (error) {
      console.error("Error preparing congratulations email:", error);
    }
  }

  // Election Positions management
  getElectionPositions(electionId: number): ElectionPosition[] {
    const stmt = db.prepare(`
      SELECT * FROM election_positions 
      WHERE election_id = ? 
      ORDER BY order_index
    `);
    const rows = stmt.all(electionId) as any[];
    return rows.map(row => ({
      id: row.id,
      electionId: row.election_id,
      positionId: row.position_id,
      orderIndex: row.order_index,
      status: row.status,
      currentScrutiny: row.current_scrutiny,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      createdAt: row.created_at,
    }));
  }

  getActiveElectionPosition(electionId: number): ElectionPosition | null {
    const stmt = db.prepare(`
      SELECT * FROM election_positions 
      WHERE election_id = ? AND status = 'active'
      ORDER BY order_index
      LIMIT 1
    `);
    const row = stmt.get(electionId) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      electionId: row.election_id,
      positionId: row.position_id,
      orderIndex: row.order_index,
      status: row.status,
      currentScrutiny: row.current_scrutiny,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      createdAt: row.created_at,
    };
  }

  advancePositionScrutiny(electionPositionId: number): void {
    // Get the position details before updating
    const positionStmt = db.prepare("SELECT * FROM election_positions WHERE id = ?");
    const position = positionStmt.get(electionPositionId) as any;
    
    if (!position) return;
    
    const newScrutiny = position.current_scrutiny + 1;
    
    // Note: We do NOT clear candidates when advancing to 2nd scrutiny
    // Candidates remain the same across scrutiny rounds
    // The UNIQUE constraint on (user_id, position_id, election_id) prevents duplicates
    
    // If advancing to 3rd scrutiny, keep only top 2 candidates from 2nd scrutiny
    // If there's a tie, use birthdate (oldest candidates advance)
    if (newScrutiny === 3) {
      // Get vote counts for all candidates in 2nd scrutiny with birthdate for tie-breaking
      // NULLs are placed last so candidates without birthdate don't get unfair advantage
      const candidatesStmt = db.prepare(`
        SELECT c.id, c.user_id, u.birthdate, COUNT(v.id) as vote_count
        FROM candidates c
        LEFT JOIN votes v ON v.candidate_id = c.id AND v.scrutiny_round = 2
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.position_id = ? AND c.election_id = ?
        GROUP BY c.id
        ORDER BY vote_count DESC, 
                 CASE WHEN u.birthdate IS NULL OR u.birthdate = '' THEN 1 ELSE 0 END,
                 u.birthdate ASC
        LIMIT 2
      `);
      const topCandidates = candidatesStmt.all(position.position_id, position.election_id) as any[];
      
      if (topCandidates.length === 2) {
        // Keep only these top 2 candidates, remove all others
        const candidateIds = topCandidates.map((c: any) => c.id);
        
        // FIRST: Delete votes from candidates that will be removed (to avoid foreign key constraint)
        db.prepare(`
          DELETE FROM votes 
          WHERE position_id = ? AND election_id = ? AND candidate_id NOT IN (?, ?)
        `).run(position.position_id, position.election_id, candidateIds[0], candidateIds[1]);
        
        // THEN: Delete the candidates themselves
        db.prepare(`
          DELETE FROM candidates 
          WHERE position_id = ? AND election_id = ? AND id NOT IN (?, ?)
        `).run(position.position_id, position.election_id, candidateIds[0], candidateIds[1]);
      }
    }
    
    // Update scrutiny
    db.prepare(`
      UPDATE election_positions 
      SET current_scrutiny = ? 
      WHERE id = ? AND current_scrutiny < 3
    `).run(newScrutiny, electionPositionId);
  }

  openNextPosition(electionId: number): ElectionPosition | null {
    // Get the current active position
    const currentActive = this.getActiveElectionPosition(electionId);
    
    if (!currentActive) {
      // If no active position, open the first pending one
      const nextStmt = db.prepare(`
        SELECT * FROM election_positions 
        WHERE election_id = ? AND status = 'pending'
        ORDER BY order_index
        LIMIT 1
      `);
      const nextRow = nextStmt.get(electionId) as any;
      
      if (nextRow) {
        // Clear any existing candidates for this new position before opening
        this.clearCandidatesForPosition(nextRow.position_id, electionId);
        
        db.prepare(`
          UPDATE election_positions 
          SET status = 'active', opened_at = datetime('now')
          WHERE id = ?
        `).run(nextRow.id);
        
        return this.getActiveElectionPosition(electionId);
      }
      
      return null;
    }
    
    // Complete current position and clear its data
    this.clearCandidatesForPosition(currentActive.positionId, electionId);
    
    db.prepare(`
      UPDATE election_positions 
      SET status = 'completed', closed_at = datetime('now')
      WHERE id = ?
    `).run(currentActive.id);
    
    // Find and open next position
    const nextStmt = db.prepare(`
      SELECT * FROM election_positions 
      WHERE election_id = ? AND order_index > ? AND status = 'pending'
      ORDER BY order_index
      LIMIT 1
    `);
    const nextRow = nextStmt.get(electionId, currentActive.orderIndex) as any;
    
    if (nextRow) {
      // Clear any existing candidates for this new position before opening
      this.clearCandidatesForPosition(nextRow.position_id, electionId);
      
      db.prepare(`
        UPDATE election_positions 
        SET status = 'active', opened_at = datetime('now')
        WHERE id = ?
      `).run(nextRow.id);
      
      return this.getActiveElectionPosition(electionId);
    }
    
    return null;
  }

  completePosition(electionPositionId: number): void {
    db.prepare(`
      UPDATE election_positions 
      SET status = 'completed', closed_at = datetime('now')
      WHERE id = ?
    `).run(electionPositionId);
  }

  forceCompletePosition(electionPositionId: number, reason: string, shouldReopen: boolean = false): void {
    // Admin override to manually complete a position when stuck due to abstentions
    console.log(`[ADMIN OVERRIDE] Forcing completion of position ${electionPositionId}. Reason: ${reason}. Reopen: ${shouldReopen}`);
    
    const position = this.getElectionPositionById(electionPositionId);
    if (!position) {
      throw new Error("Cargo não encontrado");
    }
    
    if (shouldReopen) {
      // Close current voting, clear ALL votes and candidates, reset to pending for revote
      console.log(`[ADMIN OVERRIDE] Clearing ALL votes, winners, and candidates for position ${electionPositionId} to reopen`);
      
      // Delete ALL votes for this position across all scrutiny rounds (not just current)
      db.prepare(`
        DELETE FROM votes 
        WHERE election_id = ? AND position_id = ?
      `).run(position.electionId, position.positionId);
      
      // Delete any winner records for this position
      db.prepare(`
        DELETE FROM election_winners 
        WHERE election_id = ? AND position_id = ?
      `).run(position.electionId, position.positionId);
      
      // Clear candidates for this position
      this.clearCandidatesForPosition(position.positionId, position.electionId);
      
      // Reset position to pending status and reset scrutiny
      db.prepare(`
        UPDATE election_positions 
        SET status = 'pending', current_scrutiny = 1, opened_at = NULL, closed_at = NULL
        WHERE id = ?
      `).run(electionPositionId);
      
      console.log(`[ADMIN OVERRIDE] Position ${electionPositionId} fully reset to pending for revote (all votes, winners, and candidates cleared)`);
    } else {
      // Permanently close the position
      db.prepare(`
        UPDATE election_positions 
        SET status = 'completed', closed_at = datetime('now')
        WHERE id = ?
      `).run(electionPositionId);
    }
  }

  getElectionPositionById(id: number): ElectionPosition | null {
    const stmt = db.prepare("SELECT * FROM election_positions WHERE id = ?");
    const row = stmt.get(id) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      electionId: row.election_id,
      positionId: row.position_id,
      orderIndex: row.order_index,
      status: row.status,
      currentScrutiny: row.current_scrutiny,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      createdAt: row.created_at,
    };
  }

  openPosition(electionPositionId: number): ElectionPosition {
    const position = this.getElectionPositionById(electionPositionId);
    if (!position) {
      throw new Error("Cargo não encontrado");
    }

    // Can only open pending positions
    if (position.status !== 'pending') {
      throw new Error("Este cargo já foi aberto ou concluído.");
    }

    // Check if there's an active position in this election
    const activePosition = this.getActiveElectionPosition(position.electionId);
    if (activePosition) {
      throw new Error("Não é possível abrir um novo cargo enquanto outro ainda está ativo. Aguarde até que o cargo atual seja decidido pela votação ou complete o processo de votação.");
    }

    // SEQUENTIAL VOTING: Check if all previous positions are completed
    const previousPendingStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM election_positions 
      WHERE election_id = ? AND order_index < ? AND status != 'completed'
    `);
    const previousPending = previousPendingStmt.get(position.electionId, position.orderIndex) as { count: number };
    
    if (previousPending.count > 0) {
      throw new Error("A votação deve seguir a ordem sequencial. Complete os cargos anteriores antes de abrir este cargo.");
    }

    // Clear old votes for this position (but keep candidates)
    db.prepare(`
      DELETE FROM votes 
      WHERE position_id = ? AND election_id = ?
    `).run(position.positionId, position.electionId);
    
    // Clear any existing attendance snapshots for this position
    db.prepare(`
      DELETE FROM election_attendance 
      WHERE election_position_id = ?
    `).run(electionPositionId);

    // Open this position
    db.prepare(`
      UPDATE election_positions 
      SET status = 'active', opened_at = datetime('now'), current_scrutiny = 1
      WHERE id = ?
    `).run(electionPositionId);

    // Create attendance snapshot for this position
    this.createAttendanceSnapshot(electionPositionId);

    return this.getElectionPositionById(electionPositionId)!;
  }

  // Election Attendance management
  getElectionAttendance(electionId: number): ElectionAttendance[] {
    const stmt = db.prepare(`
      SELECT * FROM election_attendance 
      WHERE election_id = ? AND election_position_id IS NULL
      ORDER BY member_id
    `);
    const rows = stmt.all(electionId) as any[];
    return rows.map(row => ({
      id: row.id,
      electionId: row.election_id,
      electionPositionId: row.election_position_id || null,
      memberId: row.member_id,
      isPresent: Boolean(row.is_present),
      markedAt: row.marked_at,
      createdAt: row.created_at,
    }));
  }

  getPresentCount(electionId: number): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM election_attendance 
      WHERE election_id = ? AND is_present = 1 AND election_position_id IS NULL
    `);
    const result = stmt.get(electionId) as { count: number };
    return result.count;
  }

  isMemberPresent(electionId: number, memberId: number): boolean {
    const stmt = db.prepare(`
      SELECT is_present 
      FROM election_attendance 
      WHERE election_id = ? AND member_id = ?
    `);
    const result = stmt.get(electionId, memberId) as any;
    return result ? Boolean(result.is_present) : false;
  }

  setMemberAttendance(electionId: number, memberId: number, isPresent: boolean): void {
    const checkStmt = db.prepare(`
      SELECT id FROM election_attendance 
      WHERE election_id = ? AND member_id = ?
    `);
    const existing = checkStmt.get(electionId, memberId) as any;
    
    if (existing) {
      db.prepare(`
        UPDATE election_attendance 
        SET is_present = ?, marked_at = datetime('now')
        WHERE id = ?
      `).run(isPresent ? 1 : 0, existing.id);
    } else {
      db.prepare(`
        INSERT INTO election_attendance (election_id, member_id, is_present, marked_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(electionId, memberId, isPresent ? 1 : 0);
    }
  }

  initializeAttendance(electionId: number): void {
    // Create attendance records for all active members only
    const members = this.getAllMembers().filter(m => m.activeMember);
    
    for (const member of members) {
      // Check if attendance already exists
      const checkStmt = db.prepare(`
        SELECT id FROM election_attendance 
        WHERE election_id = ? AND member_id = ?
      `);
      const existing = checkStmt.get(electionId, member.id) as any;
      
      if (!existing) {
        db.prepare(`
          INSERT INTO election_attendance (election_id, member_id, is_present)
          VALUES (?, ?, 0)
        `).run(electionId, member.id);
      }
    }
  }

  getPresentCountForPosition(electionPositionId: number): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM election_attendance 
      WHERE election_position_id = ? AND is_present = 1
    `);
    const result = stmt.get(electionPositionId) as { count: number };
    return result.count;
  }

  createAttendanceSnapshot(electionPositionId: number): void {
    const position = this.getElectionPositionById(electionPositionId);
    if (!position) return;

    // Get the current attendance state for this election
    // We use a GROUP BY to get the latest attendance record for each member
    const presentMembers = db.prepare(`
      SELECT member_id
      FROM election_attendance
      WHERE election_id = ? 
        AND election_position_id IS NULL
        AND is_present = 1
      GROUP BY member_id
    `).all(position.electionId) as Array<{ member_id: number }>;

    // Create attendance snapshot for this position
    for (const { member_id } of presentMembers) {
      db.prepare(`
        INSERT INTO election_attendance (election_id, election_position_id, member_id, is_present, marked_at)
        VALUES (?, ?, ?, 1, datetime('now'))
      `).run(position.electionId, electionPositionId, member_id);
    }
  }

  getAllCandidates(): Candidate[] {
    const stmt = db.prepare("SELECT * FROM candidates");
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      userId: row.user_id,
      positionId: row.position_id,
      electionId: row.election_id,
    }));
  }

  getCandidatesByElection(electionId: number): CandidateWithDetails[] {
    const stmt = db.prepare(`
      SELECT 
        c.*,
        p.name as positionName,
        e.name as electionName
      FROM candidates c
      JOIN positions p ON c.position_id = p.id
      JOIN elections e ON c.election_id = e.id
      WHERE c.election_id = ?
      ORDER BY p.id, c.name
    `);
    const rows = stmt.all(electionId) as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      userId: row.user_id,
      positionId: row.position_id,
      electionId: row.election_id,
      positionName: row.positionName,
      electionName: row.electionName,
    }));
  }

  getCandidatesByPosition(positionId: number, electionId: number): Candidate[] {
    const stmt = db.prepare(
      "SELECT * FROM candidates WHERE position_id = ? AND election_id = ?"
    );
    const rows = stmt.all(positionId, electionId) as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      userId: row.user_id,
      positionId: row.position_id,
      electionId: row.election_id,
    }));
  }

  createCandidate(candidate: InsertCandidate): Candidate {
    const stmt = db.prepare(
      "INSERT INTO candidates (name, email, user_id, position_id, election_id) VALUES (?, ?, ?, ?, ?) RETURNING *"
    );
    const row = stmt.get(
      candidate.name,
      candidate.email,
      candidate.userId,
      candidate.positionId,
      candidate.electionId
    ) as any;
    
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      userId: row.user_id,
      positionId: row.position_id,
      electionId: row.election_id,
    };
  }

  clearCandidatesForPosition(positionId: number, electionId: number): void {
    // Delete votes for candidates of this position first
    db.prepare(`
      DELETE FROM votes 
      WHERE candidate_id IN (
        SELECT id FROM candidates WHERE position_id = ? AND election_id = ?
      )
    `).run(positionId, electionId);
    
    // Then delete the candidates
    db.prepare(
      "DELETE FROM candidates WHERE position_id = ? AND election_id = ?"
    ).run(positionId, electionId);
  }

  createVote(vote: InsertVote): Vote {
    const stmt = db.prepare(
      "INSERT INTO votes (voter_id, candidate_id, position_id, election_id, scrutiny_round) VALUES (?, ?, ?, ?, ?) RETURNING *"
    );
    const row = stmt.get(
      vote.voterId,
      vote.candidateId,
      vote.positionId,
      vote.electionId,
      vote.scrutinyRound || 1
    ) as any;
    
    const createdVote = {
      id: row.id,
      voterId: row.voter_id,
      candidateId: row.candidate_id,
      positionId: row.position_id,
      electionId: row.election_id,
      scrutinyRound: row.scrutiny_round,
      createdAt: row.created_at,
    };

    // Check for automatic winner after vote
    this.checkAndSetAutomaticWinner(vote.electionId, vote.positionId, vote.scrutinyRound || 1);
    
    return createdVote;
  }

  private checkAndSetAutomaticWinner(electionId: number, positionId: number, scrutinyRound: number): void {
    // Get the active election position
    const activePosition = this.getActiveElectionPosition(electionId);
    if (!activePosition || activePosition.positionId !== positionId) return;

    // Get present count for this position from attendance snapshot
    const presentCount = this.getPresentCountForPosition(activePosition.id);
    if (presentCount === 0) return;

    // First, check if ALL present members have voted
    const totalVotesStmt = db.prepare(
      "SELECT COUNT(DISTINCT voter_id) as count FROM votes WHERE position_id = ? AND election_id = ? AND scrutiny_round = ?"
    );
    const totalVotesResult = totalVotesStmt.get(positionId, electionId, scrutinyRound) as { count: number };
    
    // Only check for winner if all present members have voted
    if (totalVotesResult.count < presentCount) {
      return; // Wait for all votes
    }

    const majorityThreshold = Math.floor(presentCount / 2) + 1;

    // Use a single optimized query with GROUP BY to find candidate with majority
    const winnerStmt = db.prepare(`
      SELECT candidate_id, COUNT(*) as vote_count
      FROM votes 
      WHERE position_id = ? AND election_id = ? AND scrutiny_round = ?
      GROUP BY candidate_id
      HAVING vote_count >= ?
      ORDER BY vote_count DESC
      LIMIT 1
    `);
    const winner = winnerStmt.get(positionId, electionId, scrutinyRound, majorityThreshold) as { candidate_id: number; vote_count: number } | undefined;

    if (winner) {
      // This candidate has reached majority - set as winner
      this.setWinner(electionId, winner.candidate_id, positionId, scrutinyRound);
      // Complete this position
      this.completePosition(activePosition.id);
      return;
    }

    // If 3rd scrutiny and no majority winner, use age-based tie-breaking
    if (scrutinyRound === 3) {
      // Get all candidates with their vote counts and birthdates for tie-breaking
      // NULLs are placed last so candidates without birthdate don't get unfair advantage
      const tiedCandidatesStmt = db.prepare(`
        SELECT c.id as candidate_id, COUNT(v.id) as vote_count, u.birthdate
        FROM candidates c
        LEFT JOIN votes v ON v.candidate_id = c.id AND v.scrutiny_round = 3
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.position_id = ? AND c.election_id = ?
        GROUP BY c.id
        ORDER BY vote_count DESC,
                 CASE WHEN u.birthdate IS NULL OR u.birthdate = '' THEN 1 ELSE 0 END,
                 u.birthdate ASC
        LIMIT 1
      `);
      const oldestWinner = tiedCandidatesStmt.get(positionId, electionId) as { candidate_id: number; vote_count: number; birthdate: string | null } | undefined;

      if (oldestWinner) {
        // Automatically set the oldest candidate as winner
        this.setWinner(electionId, oldestWinner.candidate_id, positionId, scrutinyRound);
        this.completePosition(activePosition.id);
      }
    }
  }

  checkThirdScrutinyTie(electionPositionId: number): { hasTie: boolean; candidates: Array<{ candidateId: number; voteCount: number }> } {
    const position = this.getElectionPositionById(electionPositionId);
    if (!position || position.currentScrutiny !== 3) {
      return { hasTie: false, candidates: [] };
    }

    // Get present count for this position
    const presentCount = this.getPresentCountForPosition(electionPositionId);
    if (presentCount === 0) {
      return { hasTie: false, candidates: [] };
    }

    // Check if all present members have voted
    const totalVotesStmt = db.prepare(
      "SELECT COUNT(DISTINCT voter_id) as count FROM votes WHERE position_id = ? AND election_id = ? AND scrutiny_round = 3"
    );
    const totalVotesResult = totalVotesStmt.get(position.positionId, position.electionId) as { count: number };
    
    if (totalVotesResult.count < presentCount) {
      return { hasTie: false, candidates: [] }; // Not all votes are in yet
    }

    // Get vote counts for all candidates in 3rd scrutiny
    const votesStmt = db.prepare(`
      SELECT candidate_id, COUNT(*) as vote_count
      FROM votes 
      WHERE position_id = ? AND election_id = ? AND scrutiny_round = 3
      GROUP BY candidate_id
      ORDER BY vote_count DESC
    `);
    const results = votesStmt.all(position.positionId, position.electionId) as Array<{ candidate_id: number; vote_count: number }>;

    if (results.length >= 2) {
      const topVotes = results[0].vote_count;
      
      // Get ALL candidates with the top vote count (could be 2, 3, or more)
      const tiedCandidates = results.filter(r => r.vote_count === topVotes);
      
      // If more than 1 candidate has the top votes, it's a tie
      if (tiedCandidates.length > 1) {
        return {
          hasTie: true,
          candidates: tiedCandidates.map(c => ({
            candidateId: c.candidate_id,
            voteCount: c.vote_count
          }))
        };
      }
    }

    return { hasTie: false, candidates: [] };
  }

  resolveThirdScrutinyTie(electionPositionId: number, winnerId: number): void {
    const position = this.getElectionPositionById(electionPositionId);
    if (!position) {
      throw new Error("Cargo não encontrado");
    }

    // Verify it's actually a tie scenario
    const tieCheck = this.checkThirdScrutinyTie(electionPositionId);
    if (!tieCheck.hasTie) {
      throw new Error("Não há empate para resolver neste cargo");
    }

    // Verify the winner is one of the tied candidates
    const isValidWinner = tieCheck.candidates.some(c => c.candidateId === winnerId);
    if (!isValidWinner) {
      throw new Error("O candidato escolhido não está entre os empatados");
    }

    // Set the winner
    this.setWinner(position.electionId, winnerId, position.positionId, 3);
    this.completePosition(electionPositionId);
  }

  hasUserVoted(voterId: number, positionId: number, electionId: number, scrutinyRound: number): boolean {
    const stmt = db.prepare(
      "SELECT COUNT(*) as count FROM votes WHERE voter_id = ? AND position_id = ? AND election_id = ? AND scrutiny_round = ?"
    );
    const result = stmt.get(voterId, positionId, electionId, scrutinyRound) as { count: number };
    return result.count > 0;
  }

  getElectionResults(electionId: number): ElectionResults | null {
    const election = this.getElectionById(electionId);
    if (!election) return null;

    // Get all election positions with position names in one query
    const electionPositions = db.prepare(`
      SELECT ep.*, p.name as positionName
      FROM election_positions ep
      JOIN positions p ON ep.position_id = p.id
      WHERE ep.election_id = ?
      ORDER BY ep.order_index
    `).all(electionId) as any[];
    
    // Get present count
    const presentCount = this.getPresentCount(electionId);
    
    const results: ElectionResults = {
      electionId: election.id,
      electionName: election.name,
      isActive: election.isActive,
      currentScrutiny: electionPositions.find(ep => ep.status === 'active')?.current_scrutiny || 1,
      presentCount,
      createdAt: election.createdAt,
      closedAt: election.closedAt,
      positions: [],
    };

    // Get all candidates with vote counts for current scrutiny
    const candidatesWithVotes = db.prepare(`
      SELECT 
        c.id as candidateId,
        c.name as candidateName,
        c.email as candidateEmail,
        c.position_id as positionId,
        ep.current_scrutiny as currentScrutiny,
        COALESCE(v.vote_count, 0) as voteCount
      FROM candidates c
      INNER JOIN election_positions ep ON c.position_id = ep.position_id AND c.election_id = ep.election_id
      LEFT JOIN (
        SELECT v.candidate_id, v.scrutiny_round, COUNT(*) as vote_count
        FROM votes v
        INNER JOIN election_positions ep2 ON v.position_id = ep2.position_id AND v.election_id = ep2.election_id
        WHERE v.election_id = ? AND v.scrutiny_round = ep2.current_scrutiny
        GROUP BY v.candidate_id, v.scrutiny_round
      ) v ON c.id = v.candidate_id AND v.scrutiny_round = ep.current_scrutiny
      WHERE c.election_id = ?
      ORDER BY c.position_id, voteCount DESC
    `).all(electionId, electionId) as any[];

    // Get all winners in one query
    const winners = db.prepare(`
      SELECT position_id as positionId, candidate_id as candidateId, won_at_scrutiny as wonAtScrutiny
      FROM election_winners
      WHERE election_id = ?
    `).all(electionId) as any[];
    
    const winnersMap = new Map(winners.map(w => [w.positionId, { candidateId: w.candidateId, wonAtScrutiny: w.wonAtScrutiny }]));

    // Get total voters per position in one query
    const votersPerPosition = db.prepare(`
      SELECT position_id, scrutiny_round, COUNT(DISTINCT voter_id) as count
      FROM votes
      WHERE election_id = ?
      GROUP BY position_id, scrutiny_round
    `).all(electionId) as any[];
    
    const votersMap = new Map(votersPerPosition.map(v => [`${v.position_id}_${v.scrutiny_round}`, v.count]));

    for (const electionPosition of electionPositions) {
      const currentScrutiny = electionPosition.current_scrutiny;
      const positionId = electionPosition.position_id;
      
      // Calculate majority threshold
      let majorityThreshold: number;
      if (currentScrutiny === 3) {
        majorityThreshold = 1;
      } else {
        majorityThreshold = Math.floor(presentCount / 2) + 1;
      }
      
      // Get candidates for this position from pre-fetched data
      const positionCandidates = candidatesWithVotes
        .filter(c => c.positionId === positionId && c.currentScrutiny === currentScrutiny)
        .map(c => ({
          candidateId: c.candidateId,
          candidateName: c.candidateName,
          candidateEmail: c.candidateEmail,
          photoUrl: "",
          voteCount: c.voteCount,
          isElected: false,
          electedInScrutiny: undefined as number | undefined,
        }));

      const totalVoters = votersMap.get(`${positionId}_${currentScrutiny}`) || 0;

      // Determine if someone won
      let winnerId: number | undefined;
      let winnerScrutiny: number | undefined;
      let needsNextScrutiny = false;

      const winner = winnersMap.get(positionId);
      if (winner) {
        winnerId = winner.candidateId;
        winnerScrutiny = winner.wonAtScrutiny;
      } else if (currentScrutiny < 3 && positionCandidates.length > 0 && positionCandidates[0].voteCount >= majorityThreshold) {
        winnerId = positionCandidates[0].candidateId;
        winnerScrutiny = currentScrutiny;
      } else if (currentScrutiny === 3) {
        if (positionCandidates.length > 1 && positionCandidates[0].voteCount === positionCandidates[1].voteCount) {
          needsNextScrutiny = false;
        } else if (positionCandidates.length > 0 && positionCandidates[0].voteCount > 0) {
          winnerId = positionCandidates[0].candidateId;
          winnerScrutiny = 3;
        }
      } else if (currentScrutiny < 3 && electionPosition.status === 'active') {
        needsNextScrutiny = true;
      }

      // Mark elected candidate
      if (winnerId) {
        const electedCandidate = positionCandidates.find(c => c.candidateId === winnerId);
        if (electedCandidate) {
          electedCandidate.isElected = true;
          electedCandidate.electedInScrutiny = winnerScrutiny;
        }
      }

      results.positions.push({
        positionId: electionPosition.position_id,
        positionName: electionPosition.positionName,
        status: electionPosition.status,
        currentScrutiny,
        orderIndex: electionPosition.order_index,
        totalVoters,
        majorityThreshold,
        needsNextScrutiny,
        winnerId,
        winnerScrutiny,
        candidates: positionCandidates,
      });
    }

    return results;
  }

  getLatestElectionResults(): ElectionResults | null {
    const stmt = db.prepare("SELECT * FROM elections ORDER BY created_at DESC LIMIT 1");
    const row = stmt.get() as any;
    
    if (!row) return null;
    
    return this.getElectionResults(row.id);
  }

  getElectionWinners(electionId: number): Array<{ userId: number; positionId: number; candidateId: number; wonAtScrutiny: number }> {
    const stmt = db.prepare(`
      SELECT 
        c.user_id as userId,
        ew.position_id as positionId,
        ew.candidate_id as candidateId,
        ew.won_at_scrutiny as wonAtScrutiny
      FROM election_winners ew
      INNER JOIN candidates c ON c.id = ew.candidate_id
      WHERE ew.election_id = ?
    `);
    
    const results = stmt.all(electionId) as any[];
    console.log(`[DB] getElectionWinners for election ${electionId}:`, results);
    return results;
  }

  createVerificationCode(data: InsertVerificationCode): VerificationCode {
    const stmt = db.prepare(
      "INSERT INTO verification_codes (email, code, expires_at, is_password_reset) VALUES (?, ?, ?, ?) RETURNING *"
    );
    const row = stmt.get(data.email, data.code, data.expiresAt, data.isPasswordReset ? 1 : 0) as any;
    
    return {
      id: row.id,
      email: row.email,
      code: row.code,
      expiresAt: row.expires_at,
      isPasswordReset: Boolean(row.is_password_reset),
      createdAt: row.created_at,
    };
  }

  getValidVerificationCode(email: string, code: string): VerificationCode | null {
    const stmt = db.prepare(
      "SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1"
    );
    const row = stmt.get(email, code) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      email: row.email,
      code: row.code,
      expiresAt: row.expires_at,
      isPasswordReset: Boolean(row.is_password_reset),
      createdAt: row.created_at,
    };
  }

  deleteVerificationCodesByEmail(email: string): void {
    const stmt = db.prepare("DELETE FROM verification_codes WHERE email = ?");
    stmt.run(email);
  }

  getVoterAttendance(electionId: number): Array<any> {
    const stmt = db.prepare(`
      SELECT 
        u.id as voterId,
        u.full_name as voterName,
        u.email as voterEmail,
        MIN(v.created_at) as firstVoteAt,
        COUNT(DISTINCT v.position_id) as totalVotes
      FROM votes v
      JOIN users u ON v.voter_id = u.id
      WHERE v.election_id = ?
      GROUP BY u.id, u.full_name, u.email
      ORDER BY u.full_name
    `);
    return stmt.all(electionId) as any[];
  }

  getVoteTimeline(electionId: number): Array<any> {
    const stmt = db.prepare(`
      SELECT 
        v.voter_id as voterId,
        u.full_name as voterName,
        u.email as voterEmail,
        p.name as positionName,
        c.name as candidateName,
        v.scrutiny_round as scrutinyRound,
        v.created_at as votedAt
      FROM votes v
      JOIN users u ON v.voter_id = u.id
      JOIN positions p ON v.position_id = p.id
      JOIN candidates c ON v.candidate_id = c.id
      WHERE v.election_id = ?
      ORDER BY v.created_at ASC
    `);
    return stmt.all(electionId) as any[];
  }

  getScrutinyHistory(electionId: number): Array<any> {
    const electionPositions = this.getElectionPositions(electionId);
    const allPositions = this.getAllPositions();
    const winners = this.getElectionWinners(electionId);
    const history: any[] = [];

    // Create a map of position ID to position name
    const positionMap = new Map(allPositions.map(p => [p.id, p.name]));

    // Create a map of candidate ID to winner info
    const winnerMap = new Map(winners.map(w => [w.candidateId, { wonAtScrutiny: w.wonAtScrutiny, positionId: w.positionId }]));

    for (const position of electionPositions) {
      const posName = positionMap.get(position.positionId);
      if (!posName) continue;

      const positionHistory: any = {
        positionId: position.positionId,
        positionName: posName,
        scrutinies: []
      };

      // Get candidates for this position
      const candidates = this.getCandidatesByPosition(position.positionId, electionId);

      // For each scrutiny round (1 to current_scrutiny or max 3)
      const maxScrutiny = Math.min(position.currentScrutiny, 3);
      for (let scrutiny = 1; scrutiny <= maxScrutiny; scrutiny++) {
        const scrutinyData: any = {
          round: scrutiny,
          candidates: []
        };

        // Get vote counts for each candidate in this scrutiny
        const voteStmt = db.prepare(`
          SELECT candidate_id, COUNT(*) as voteCount
          FROM votes
          WHERE election_id = ? AND position_id = ? AND scrutiny_round = ?
          GROUP BY candidate_id
        `);
        const voteCounts = voteStmt.all(electionId, position.positionId, scrutiny) as Array<{ candidate_id: number; voteCount: number }>;

        // Map vote counts to candidates
        const voteCountMap = new Map(voteCounts.map(v => [v.candidate_id, v.voteCount]));

        for (const candidate of candidates) {
          const votes = voteCountMap.get(candidate.id) || 0;
          const user = this.getUserById(candidate.userId);
          const winnerInfo = winnerMap.get(candidate.id);

          scrutinyData.candidates.push({
            candidateId: candidate.id,
            candidateName: candidate.name,
            candidateEmail: user?.email || '',
            voteCount: votes,
            advancedToNext: scrutiny < maxScrutiny ? votes > 0 : false, // Simple logic - can be refined
            isElected: winnerInfo ? winnerInfo.wonAtScrutiny === scrutiny : false
          });
        }

        // Sort by vote count descending
        scrutinyData.candidates.sort((a: any, b: any) => b.voteCount - a.voteCount);

        positionHistory.scrutinies.push(scrutinyData);
      }

      history.push(positionHistory);
    }

    return history;
  }

  getElectionAuditData(electionId: number): any | null {
    const results = this.getElectionResults(electionId);
    if (!results) return null;

    const election = this.getElectionById(electionId);
    if (!election) return null;

    const positions = this.getElectionPositions(electionId);
    const completedPositions = positions.filter((p: any) => p.status === 'completed');
    
    const totalMembers = this.getAllMembers(true).filter(m => m.activeMember).length;

    return {
      results,
      electionMetadata: {
        createdAt: election.createdAt,
        closedAt: election.closedAt || null,
        totalPositions: positions.length,
        completedPositions: completedPositions.length,
        totalMembers,
      },
      voterAttendance: this.getVoterAttendance(electionId),
      voteTimeline: this.getVoteTimeline(electionId),
      scrutinyHistory: this.getScrutinyHistory(electionId),
    };
  }

  createPdfVerification(electionId: number, verificationHash: string, presidentName?: string): any {
    const now = new Date();
    const brasiliaTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);
    
    const [date, time] = brasiliaTime.split(', ');
    const [month, day, year] = date.split('/');
    const formattedDateTime = `${year}-${month}-${day} ${time}`;
    
    const stmt = db.prepare(`
      INSERT INTO pdf_verifications (election_id, verification_hash, president_name, created_at)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `);
    const row = stmt.get(electionId, verificationHash, presidentName || null, formattedDateTime) as any;
    return {
      id: row.id,
      electionId: row.election_id,
      verificationHash: row.verification_hash,
      presidentName: row.president_name,
      createdAt: row.created_at,
    };
  }

  getPdfVerification(verificationHash: string): any | null {
    const stmt = db.prepare(`
      SELECT pv.*, e.name as election_name, e.created_at as election_created_at, e.closed_at as election_closed_at
      FROM pdf_verifications pv
      JOIN elections e ON pv.election_id = e.id
      WHERE pv.verification_hash = ?
    `);
    const row = stmt.get(verificationHash) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      electionId: row.election_id,
      electionName: row.election_name,
      electionCreatedAt: row.election_created_at,
      electionClosedAt: row.election_closed_at,
      verificationHash: row.verification_hash,
      presidentName: row.president_name,
      createdAt: row.created_at,
    };
  }

  // ==================== STUDY SYSTEM STORAGE FUNCTIONS ====================

  // Study Profile
  getStudyProfile(userId: number): any | null {
    const stmt = db.prepare("SELECT * FROM study_profiles WHERE user_id = ?");
    const row = stmt.get(userId) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      userId: row.user_id,
      totalXp: row.total_xp,
      currentLevel: row.current_level,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      hearts: row.hearts,
      heartsMax: row.hearts_max,
      heartsRefillAt: row.hearts_refill_at,
      lastActivityDate: row.last_activity_date,
      dailyGoalMinutes: row.daily_goal_minutes,
      timezone: row.timezone,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  createStudyProfile(userId: number): any {
    const stmt = db.prepare(`
      INSERT INTO study_profiles (user_id, total_xp, current_level, current_streak, hearts, hearts_max)
      VALUES (?, 0, 1, 0, 5, 5)
      RETURNING *
    `);
    const row = stmt.get(userId) as any;
    return {
      id: row.id,
      userId: row.user_id,
      totalXp: row.total_xp,
      currentLevel: row.current_level,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      hearts: row.hearts,
      heartsMax: row.hearts_max,
      heartsRefillAt: row.hearts_refill_at,
      lastActivityDate: row.last_activity_date,
      dailyGoalMinutes: row.daily_goal_minutes,
      timezone: row.timezone,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  getOrCreateStudyProfile(userId: number): any {
    let profile = this.getStudyProfile(userId);
    if (!profile) {
      profile = this.createStudyProfile(userId);
    }
    return profile;
  }

  updateStudyProfile(userId: number, updates: any): any {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.totalXp !== undefined) { fields.push("total_xp = ?"); values.push(updates.totalXp); }
    if (updates.currentLevel !== undefined) { fields.push("current_level = ?"); values.push(updates.currentLevel); }
    if (updates.currentStreak !== undefined) { fields.push("current_streak = ?"); values.push(updates.currentStreak); }
    if (updates.longestStreak !== undefined) { fields.push("longest_streak = ?"); values.push(updates.longestStreak); }
    if (updates.hearts !== undefined) { fields.push("hearts = ?"); values.push(updates.hearts); }
    if (updates.heartsRefillAt !== undefined) { fields.push("hearts_refill_at = ?"); values.push(updates.heartsRefillAt); }
    if (updates.lastActivityDate !== undefined) { fields.push("last_activity_date = ?"); values.push(updates.lastActivityDate); }

    if (fields.length === 0) return this.getStudyProfile(userId);

    fields.push("updated_at = datetime('now')");
    values.push(userId);

    const stmt = db.prepare(`UPDATE study_profiles SET ${fields.join(", ")} WHERE user_id = ? RETURNING *`);
    const row = stmt.get(...values) as any;
    
    return row ? {
      id: row.id,
      userId: row.user_id,
      totalXp: row.total_xp,
      currentLevel: row.current_level,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      hearts: row.hearts,
      heartsMax: row.hearts_max,
      heartsRefillAt: row.hearts_refill_at,
      lastActivityDate: row.last_activity_date,
      dailyGoalMinutes: row.daily_goal_minutes,
      timezone: row.timezone,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } : null;
  }

  addXp(userId: number, amount: number, source: string, sourceId?: number, description?: string): any {
    const profile = this.getOrCreateStudyProfile(userId);
    const newTotal = profile.totalXp + amount;
    const newLevel = this.calculateLevel(newTotal);

    db.prepare(`
      INSERT INTO xp_transactions (user_id, amount, source, source_id, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, amount, source, sourceId || null, description || null);

    return this.updateStudyProfile(userId, { totalXp: newTotal, currentLevel: newLevel });
  }

  calculateLevel(xp: number): number {
    if (xp <= 0) return 1;
    return Math.floor(1 + Math.sqrt(xp / 100)) + 1;
  }

  loseHeart(userId: number): any {
    const profile = this.getOrCreateStudyProfile(userId);
    if (profile.hearts <= 0) return profile;

    const newHearts = profile.hearts - 1;
    let refillAt = profile.heartsRefillAt;

    if (!refillAt || newHearts < profile.heartsMax - 1) {
      const now = new Date();
      now.setHours(now.getHours() + 6);
      refillAt = now.toISOString();
    }

    return this.updateStudyProfile(userId, { hearts: newHearts, heartsRefillAt: refillAt });
  }

  recoverHeart(userId: number): any {
    const profile = this.getOrCreateStudyProfile(userId);
    if (profile.hearts >= profile.heartsMax) return profile;

    const newHearts = Math.min(profile.hearts + 1, profile.heartsMax);
    let refillAt = profile.heartsRefillAt;

    if (newHearts >= profile.heartsMax) {
      refillAt = null;
    }

    return this.updateStudyProfile(userId, { hearts: newHearts, heartsRefillAt: refillAt });
  }

  // Bible Verses
  getAllBibleVerses(): any[] {
    const stmt = db.prepare("SELECT * FROM bible_verses ORDER BY id");
    return (stmt.all() as any[]).map(row => ({
      id: row.id,
      reference: row.reference,
      text: row.text,
      reflection: row.reflection,
      category: row.category,
      createdAt: row.created_at,
    }));
  }

  getBibleVerseById(id: number): any | null {
    const stmt = db.prepare("SELECT * FROM bible_verses WHERE id = ?");
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      reference: row.reference,
      text: row.text,
      reflection: row.reflection,
      category: row.category,
      createdAt: row.created_at,
    };
  }

  createBibleVerse(reference: string, text: string, reflection?: string, category?: string): any {
    const stmt = db.prepare(`
      INSERT INTO bible_verses (reference, text, reflection, category)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `);
    const row = stmt.get(reference, text, reflection || null, category || null) as any;
    return {
      id: row.id,
      reference: row.reference,
      text: row.text,
      reflection: row.reflection,
      category: row.category,
      createdAt: row.created_at,
    };
  }

  readVerseAndRecoverHeart(userId: number, verseId: number): any {
    db.prepare(`
      INSERT INTO verse_readings (user_id, verse_id, hearts_recovered)
      VALUES (?, ?, 1)
    `).run(userId, verseId);

    return this.recoverHeart(userId);
  }

  // Study Weeks
  getPublishedStudyWeeks(): any[] {
    const stmt = db.prepare("SELECT * FROM study_weeks WHERE status = 'published' ORDER BY year DESC, week_number DESC");
    return (stmt.all() as any[]).map(row => ({
      id: row.id,
      weekNumber: row.week_number,
      year: row.year,
      title: row.title,
      description: row.description,
      pdfUrl: row.pdf_url,
      status: row.status,
      publishedAt: row.published_at,
      createdBy: row.created_by,
      aiMetadata: row.ai_metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  getAllStudyWeeks(): any[] {
    const stmt = db.prepare("SELECT * FROM study_weeks ORDER BY year DESC, week_number DESC");
    return (stmt.all() as any[]).map(row => ({
      id: row.id,
      weekNumber: row.week_number,
      year: row.year,
      title: row.title,
      description: row.description,
      pdfUrl: row.pdf_url,
      status: row.status,
      publishedAt: row.published_at,
      createdBy: row.created_by,
      aiMetadata: row.ai_metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  getStudyStats(): any {
    const totalUsers = (db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM user_lesson_progress").get() as any)?.count || 0;
    const totalLessons = (db.prepare("SELECT COUNT(*) as count FROM study_lessons").get() as any)?.count || 0;
    const completedLessons = (db.prepare("SELECT COUNT(*) as count FROM user_lesson_progress WHERE status = 'completed'").get() as any)?.count || 0;
    const totalWeeks = (db.prepare("SELECT COUNT(*) as count FROM study_weeks").get() as any)?.count || 0;
    const publishedWeeks = (db.prepare("SELECT COUNT(*) as count FROM study_weeks WHERE status = 'published'").get() as any)?.count || 0;
    
    return {
      totalUsers,
      totalLessons,
      completedLessons,
      totalWeeks,
      publishedWeeks,
    };
  }

  getLessonsForWeek(weekId: number): any[] {
    return this.getLessonsByWeekId(weekId);
  }

  getStudyWeekById(id: number): any | null {
    const stmt = db.prepare("SELECT * FROM study_weeks WHERE id = ?");
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      weekNumber: row.week_number,
      year: row.year,
      title: row.title,
      description: row.description,
      pdfUrl: row.pdf_url,
      status: row.status,
      publishedAt: row.published_at,
      createdBy: row.created_by,
      aiMetadata: row.ai_metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  getStudyWeekByNumber(weekNumber: number, year: number): any | null {
    const stmt = db.prepare("SELECT * FROM study_weeks WHERE week_number = ? AND year = ?");
    const row = stmt.get(weekNumber, year) as any;
    if (!row) return null;
    return {
      id: row.id,
      weekNumber: row.week_number,
      year: row.year,
      title: row.title,
      description: row.description,
      pdfUrl: row.pdf_url,
      status: row.status,
      publishedAt: row.published_at,
      createdBy: row.created_by,
      aiMetadata: row.ai_metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  createStudyWeek(data: { weekNumber: number; year: number; title: string; description?: string; createdBy?: number; aiMetadata?: string }): any {
    const stmt = db.prepare(`
      INSERT INTO study_weeks (week_number, year, title, description, created_by, ai_metadata, status)
      VALUES (?, ?, ?, ?, ?, ?, 'published')
      RETURNING *
    `);
    const row = stmt.get(data.weekNumber, data.year, data.title, data.description || null, data.createdBy || null, data.aiMetadata || null) as any;
    return {
      id: row.id,
      weekNumber: row.week_number,
      year: row.year,
      title: row.title,
      description: row.description,
      pdfUrl: row.pdf_url,
      status: row.status,
      publishedAt: row.published_at,
      createdBy: row.created_by,
      aiMetadata: row.ai_metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Study Lessons
  getLessonsByWeekId(weekId: number): any[] {
    const stmt = db.prepare("SELECT * FROM study_lessons WHERE study_week_id = ? ORDER BY order_index");
    return (stmt.all(weekId) as any[]).map(row => ({
      id: row.id,
      studyWeekId: row.study_week_id,
      orderIndex: row.order_index,
      title: row.title,
      type: row.type,
      description: row.description,
      xpReward: row.xp_reward,
      estimatedMinutes: row.estimated_minutes,
      icon: row.icon,
      isBonus: Boolean(row.is_bonus),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  getLessonById(id: number): any | null {
    const stmt = db.prepare("SELECT * FROM study_lessons WHERE id = ?");
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      studyWeekId: row.study_week_id,
      orderIndex: row.order_index,
      title: row.title,
      type: row.type,
      description: row.description,
      xpReward: row.xp_reward,
      estimatedMinutes: row.estimated_minutes,
      icon: row.icon,
      isBonus: Boolean(row.is_bonus),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  createStudyLesson(data: { studyWeekId: number; orderIndex: number; title: string; type?: string; description?: string; xpReward?: number; estimatedMinutes?: number; icon?: string; isBonus?: boolean }): any {
    const stmt = db.prepare(`
      INSERT INTO study_lessons (study_week_id, order_index, title, type, description, xp_reward, estimated_minutes, icon, is_bonus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    const row = stmt.get(
      data.studyWeekId,
      data.orderIndex,
      data.title,
      data.type || 'study',
      data.description || null,
      data.xpReward || 10,
      data.estimatedMinutes || 5,
      data.icon || null,
      data.isBonus ? 1 : 0
    ) as any;
    return {
      id: row.id,
      studyWeekId: row.study_week_id,
      orderIndex: row.order_index,
      title: row.title,
      type: row.type,
      description: row.description,
      xpReward: row.xp_reward,
      estimatedMinutes: row.estimated_minutes,
      icon: row.icon,
      isBonus: Boolean(row.is_bonus),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Study Units (Exercises)
  getUnitsByLessonId(lessonId: number): any[] {
    const stmt = db.prepare("SELECT * FROM study_units WHERE lesson_id = ? ORDER BY order_index");
    return (stmt.all(lessonId) as any[]).map(row => ({
      id: row.id,
      lessonId: row.lesson_id,
      orderIndex: row.order_index,
      type: row.type,
      content: JSON.parse(row.content),
      xpValue: row.xp_value,
      createdAt: row.created_at,
    }));
  }

  createStudyUnit(data: { lessonId: number; orderIndex: number; type: string; content: any; xpValue?: number }): any {
    const stmt = db.prepare(`
      INSERT INTO study_units (lesson_id, order_index, type, content, xp_value)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `);
    const row = stmt.get(
      data.lessonId,
      data.orderIndex,
      data.type,
      JSON.stringify(data.content),
      data.xpValue || 2
    ) as any;
    return {
      id: row.id,
      lessonId: row.lesson_id,
      orderIndex: row.order_index,
      type: row.type,
      content: JSON.parse(row.content),
      xpValue: row.xp_value,
      createdAt: row.created_at,
    };
  }

  updateStudyLesson(lessonId: number, data: { title?: string; type?: string; description?: string; xpReward?: number; estimatedMinutes?: number; icon?: string; isBonus?: boolean; orderIndex?: number }): any | null {
    const lesson = this.getLessonById(lessonId);
    if (!lesson) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) { updates.push("title = ?"); values.push(data.title); }
    if (data.type !== undefined) { updates.push("type = ?"); values.push(data.type); }
    if (data.description !== undefined) { updates.push("description = ?"); values.push(data.description); }
    if (data.xpReward !== undefined) { updates.push("xp_reward = ?"); values.push(data.xpReward); }
    if (data.estimatedMinutes !== undefined) { updates.push("estimated_minutes = ?"); values.push(data.estimatedMinutes); }
    if (data.icon !== undefined) { updates.push("icon = ?"); values.push(data.icon); }
    if (data.isBonus !== undefined) { updates.push("is_bonus = ?"); values.push(data.isBonus ? 1 : 0); }
    if (data.orderIndex !== undefined) { updates.push("order_index = ?"); values.push(data.orderIndex); }

    if (updates.length === 0) return lesson;

    values.push(lessonId);
    db.prepare(`UPDATE study_lessons SET ${updates.join(", ")} WHERE id = ?`).run(...values);

    return this.getLessonById(lessonId);
  }

  deleteStudyLesson(lessonId: number): boolean {
    const lesson = this.getLessonById(lessonId);
    if (!lesson) return false;

    db.prepare("DELETE FROM user_unit_progress WHERE unit_id IN (SELECT id FROM study_units WHERE lesson_id = ?)").run(lessonId);
    db.prepare("DELETE FROM study_units WHERE lesson_id = ?").run(lessonId);
    db.prepare("DELETE FROM user_lesson_progress WHERE lesson_id = ?").run(lessonId);
    db.prepare("DELETE FROM study_lessons WHERE id = ?").run(lessonId);
    return true;
  }

  updateStudyUnit(unitId: number, data: { type?: string; content?: any; xpValue?: number; orderIndex?: number }): any | null {
    const unit = this.getStudyUnitById(unitId);
    if (!unit) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.type !== undefined) { updates.push("type = ?"); values.push(data.type); }
    if (data.content !== undefined) { updates.push("content = ?"); values.push(JSON.stringify(data.content)); }
    if (data.xpValue !== undefined) { updates.push("xp_value = ?"); values.push(data.xpValue); }
    if (data.orderIndex !== undefined) { updates.push("order_index = ?"); values.push(data.orderIndex); }

    if (updates.length === 0) return unit;

    values.push(unitId);
    db.prepare(`UPDATE study_units SET ${updates.join(", ")} WHERE id = ?`).run(...values);

    return this.getStudyUnitById(unitId);
  }

  deleteStudyUnit(unitId: number): boolean {
    const unit = this.getStudyUnitById(unitId);
    if (!unit) return false;

    db.prepare("DELETE FROM user_unit_progress WHERE unit_id = ?").run(unitId);
    db.prepare("DELETE FROM study_units WHERE id = ?").run(unitId);
    return true;
  }

  updateStudyWeek(weekId: number, data: { title?: string; description?: string; weekNumber?: number; year?: number; status?: string }): any | null {
    const week = this.getStudyWeekById(weekId);
    if (!week) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) { updates.push("title = ?"); values.push(data.title); }
    if (data.description !== undefined) { updates.push("description = ?"); values.push(data.description); }
    if (data.weekNumber !== undefined) { updates.push("week_number = ?"); values.push(data.weekNumber); }
    if (data.year !== undefined) { updates.push("year = ?"); values.push(data.year); }
    if (data.status !== undefined) { updates.push("status = ?"); values.push(data.status); }

    if (updates.length === 0) return week;

    updates.push("updated_at = datetime('now')");
    values.push(weekId);
    db.prepare(`UPDATE study_weeks SET ${updates.join(", ")} WHERE id = ?`).run(...values);

    return this.getStudyWeekById(weekId);
  }

  deleteStudyWeek(weekId: number): boolean {
    const week = this.getStudyWeekById(weekId);
    if (!week) return false;

    const lessons = this.getLessonsForWeek(weekId);
    for (const lesson of lessons) {
      this.deleteStudyLesson(lesson.id);
    }

    db.prepare("DELETE FROM study_weeks WHERE id = ?").run(weekId);
    return true;
  }

  getUnitsForLesson(lessonId: number): any[] {
    return this.getUnitsByLessonId(lessonId);
  }

  publishStudyWeek(weekId: number): any | null {
    const week = this.getStudyWeekById(weekId);
    if (!week) return null;

    db.prepare(`
      UPDATE study_weeks 
      SET status = 'published', published_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(weekId);

    return this.getStudyWeekById(weekId);
  }

  // User Lesson Progress
  getUserLessonProgress(userId: number, lessonId: number): any | null {
    const stmt = db.prepare("SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?");
    const row = stmt.get(userId, lessonId) as any;
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      lessonId: row.lesson_id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      xpEarned: row.xp_earned,
      mistakesCount: row.mistakes_count,
      perfectScore: Boolean(row.perfect_score),
      timeSpentSeconds: row.time_spent_seconds,
    };
  }

  getAllUserLessonProgress(userId: number): any[] {
    const stmt = db.prepare("SELECT * FROM user_lesson_progress WHERE user_id = ?");
    return (stmt.all(userId) as any[]).map(row => ({
      id: row.id,
      userId: row.user_id,
      lessonId: row.lesson_id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      xpEarned: row.xp_earned,
      mistakesCount: row.mistakes_count,
      perfectScore: Boolean(row.perfect_score),
      timeSpentSeconds: row.time_spent_seconds,
    }));
  }

  startLesson(userId: number, lessonId: number): any {
    const existing = this.getUserLessonProgress(userId, lessonId);
    if (existing) {
      if (existing.status === 'locked') {
        db.prepare(`
          UPDATE user_lesson_progress 
          SET status = 'in_progress', started_at = datetime('now')
          WHERE user_id = ? AND lesson_id = ?
        `).run(userId, lessonId);
      }
      return this.getUserLessonProgress(userId, lessonId);
    }

    db.prepare(`
      INSERT INTO user_lesson_progress (user_id, lesson_id, status, started_at)
      VALUES (?, ?, 'in_progress', datetime('now'))
    `).run(userId, lessonId);

    return this.getUserLessonProgress(userId, lessonId);
  }

  completeLesson(userId: number, lessonId: number, xpEarned: number, mistakesCount: number, timeSpentSeconds: number): any {
    const perfectScore = mistakesCount === 0;
    
    db.prepare(`
      INSERT INTO user_lesson_progress (user_id, lesson_id, status, completed_at, xp_earned, mistakes_count, perfect_score, time_spent_seconds)
      VALUES (?, ?, 'completed', datetime('now'), ?, ?, ?, ?)
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET
        status = 'completed',
        completed_at = datetime('now'),
        xp_earned = ?,
        mistakes_count = ?,
        perfect_score = ?,
        time_spent_seconds = ?
    `).run(userId, lessonId, xpEarned, mistakesCount, perfectScore ? 1 : 0, timeSpentSeconds, xpEarned, mistakesCount, perfectScore ? 1 : 0, timeSpentSeconds);

    const lesson = this.getLessonById(lessonId);
    let totalXp = xpEarned;
    if (perfectScore && lesson) {
      totalXp += 10;
    }

    this.addXp(userId, totalXp, 'lesson', lessonId, `Completou licao: ${lesson?.title || 'Licao'}`);
    this.updateStreak(userId);

    return this.getUserLessonProgress(userId, lessonId);
  }

  // User Unit Progress
  getUserUnitProgress(userId: number, unitId: number): any | null {
    const stmt = db.prepare("SELECT * FROM user_unit_progress WHERE user_id = ? AND unit_id = ?");
    const row = stmt.get(userId, unitId) as any;
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      unitId: row.unit_id,
      isCompleted: Boolean(row.is_completed),
      answerGiven: row.answer_given ? JSON.parse(row.answer_given) : null,
      isCorrect: row.is_correct !== null ? Boolean(row.is_correct) : null,
      attempts: row.attempts,
      completedAt: row.completed_at,
    };
  }

  getStudyUnitById(unitId: number): any | null {
    const stmt = db.prepare("SELECT * FROM study_units WHERE id = ?");
    const row = stmt.get(unitId) as any;
    if (!row) return null;
    
    const content = JSON.parse(row.content);
    const normalizedContent = this.normalizeUnitContentForRead(row.type, content);
    
    return {
      id: row.id,
      lessonId: row.lesson_id,
      orderIndex: row.order_index,
      type: row.type,
      content: normalizedContent,
      xpValue: row.xp_value,
      createdAt: row.created_at,
    };
  }
  
  private normalizeUnitContentForRead(type: string, content: any): any {
    switch (type) {
      case 'text':
        return {
          ...content,
          body: content.body || content.text || "",
          title: content.title || ""
        };
      case 'verse':
        return {
          ...content,
          body: content.body || content.verseText || content.text || "",
          title: content.title || "Versiculo",
          highlight: content.highlight || content.verseReference || ""
        };
      case 'meditation':
        return {
          ...content,
          body: content.body || content.meditationGuide || content.text || "",
          title: content.title || "Meditacao",
          meditationDuration: content.meditationDuration || 60
        };
      case 'reflection':
        return {
          ...content,
          body: content.body || content.reflectionPrompt || content.text || "",
          title: content.title || "Reflexao"
        };
      case 'multiple_choice':
        return {
          ...content,
          question: content.question || "",
          options: content.options || [],
          correctIndex: content.correctIndex ?? 0,
          explanationCorrect: content.explanationCorrect || content.explanation || "Correto!",
          explanationIncorrect: content.explanationIncorrect || content.explanation || "Incorreto."
        };
      case 'true_false':
        return {
          ...content,
          statement: content.statement || content.question || "",
          isTrue: content.isTrue ?? true,
          explanationCorrect: content.explanationCorrect || content.explanation || "Correto!",
          explanationIncorrect: content.explanationIncorrect || content.explanation || "Incorreto."
        };
      case 'fill_blank':
        return {
          ...content,
          question: content.question || "",
          correctAnswer: content.correctAnswer || "",
          explanationCorrect: content.explanationCorrect || content.explanation || "Correto!",
          explanationIncorrect: content.explanationIncorrect || content.explanation || "Incorreto."
        };
      default:
        return content;
    }
  }

  validateAnswer(unit: any, answer: any): boolean {
    const content = unit.content;
    
    switch (unit.type) {
      case 'multiple_choice':
        return answer === content.correctIndex;
      
      case 'true_false':
        return answer === content.isTrue;
      
      case 'fill_blank':
        if (typeof answer !== 'string') return false;
        const normalizedAnswer = answer.trim().toLowerCase();
        const normalizedCorrect = content.correctAnswer.trim().toLowerCase();
        return normalizedAnswer === normalizedCorrect;
      
      default:
        return false;
    }
  }

  submitUnitAnswer(userId: number, unitId: number, answer: any): { unitProgress: any; isCorrect: boolean; explanation?: string } {
    const unit = this.getStudyUnitById(unitId);
    if (!unit) {
      throw new Error("Unidade nao encontrada");
    }

    const isCorrect = this.validateAnswer(unit, answer);
    const existing = this.getUserUnitProgress(userId, unitId);
    const attempts = existing ? existing.attempts + 1 : 1;

    db.prepare(`
      INSERT INTO user_unit_progress (user_id, unit_id, is_completed, answer_given, is_correct, attempts, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, unit_id) DO UPDATE SET
        is_completed = ?,
        answer_given = ?,
        is_correct = ?,
        attempts = ?,
        completed_at = datetime('now')
    `).run(userId, unitId, 1, JSON.stringify(answer), isCorrect ? 1 : 0, attempts, 1, JSON.stringify(answer), isCorrect ? 1 : 0, attempts);

    if (!isCorrect) {
      this.loseHeart(userId);
    }

    const unitProgress = this.getUserUnitProgress(userId, unitId);
    const explanation = unit.content.explanation || null;

    return { unitProgress, isCorrect, explanation };
  }

  // Streak Management
  updateStreak(userId: number): any {
    const profile = this.getOrCreateStudyProfile(userId);
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = profile.lastActivityDate;

    let newStreak = profile.currentStreak;

    if (!lastActivity) {
      newStreak = 1;
    } else {
      const lastDate = new Date(lastActivity);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day, streak stays
      } else if (diffDays === 1) {
        newStreak = profile.currentStreak + 1;
      } else {
        newStreak = 1;
      }
    }

    const longestStreak = Math.max(newStreak, profile.longestStreak);

    return this.updateStudyProfile(userId, {
      currentStreak: newStreak,
      longestStreak: longestStreak,
      lastActivityDate: today,
    });
  }

  // Achievements
  getAllAchievements(): any[] {
    const stmt = db.prepare("SELECT * FROM achievements ORDER BY id");
    return (stmt.all() as any[]).map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      icon: row.icon,
      xpReward: row.xp_reward,
      category: row.category,
      requirement: row.requirement ? JSON.parse(row.requirement) : null,
      isSecret: Boolean(row.is_secret),
    }));
  }

  createAchievement(data: { code: string; name: string; description?: string; icon?: string; xpReward?: number; category?: string; requirement?: any; isSecret?: boolean }): any {
    const stmt = db.prepare(`
      INSERT INTO achievements (code, name, description, icon, xp_reward, category, requirement, is_secret)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    const row = stmt.get(
      data.code,
      data.name,
      data.description || null,
      data.icon || null,
      data.xpReward || 0,
      data.category || null,
      data.requirement ? JSON.stringify(data.requirement) : null,
      data.isSecret ? 1 : 0
    ) as any;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      icon: row.icon,
      xpReward: row.xp_reward,
      category: row.category,
      requirement: row.requirement ? JSON.parse(row.requirement) : null,
      isSecret: Boolean(row.is_secret),
    };
  }

  getUserAchievements(userId: number): any[] {
    const stmt = db.prepare(`
      SELECT a.*, ua.unlocked_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.unlocked_at DESC
    `);
    return (stmt.all(userId) as any[]).map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      icon: row.icon,
      xpReward: row.xp_reward,
      category: row.category,
      requirement: row.requirement ? JSON.parse(row.requirement) : null,
      isSecret: Boolean(row.is_secret),
      unlockedAt: row.unlocked_at,
    }));
  }

  unlockAchievement(userId: number, achievementCode: string): any | null {
    const achievement = db.prepare("SELECT * FROM achievements WHERE code = ?").get(achievementCode) as any;
    if (!achievement) return null;

    try {
      db.prepare(`
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (?, ?)
      `).run(userId, achievement.id);

      if (achievement.xp_reward > 0) {
        this.addXp(userId, achievement.xp_reward, 'achievement', achievement.id, `Conquista desbloqueada: ${achievement.name}`);
      }

      return {
        id: achievement.id,
        code: achievement.code,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        xpReward: achievement.xp_reward,
      };
    } catch (e) {
      // Already unlocked
      return null;
    }
  }

  // Leaderboard
  getLeaderboard(periodType: string, periodKey: string, limit: number = 10): any[] {
    const stmt = db.prepare(`
      SELECT le.*, u.full_name, u.photo_url
      FROM leaderboard_entries le
      JOIN users u ON le.user_id = u.id
      WHERE le.period_type = ? AND le.period_key = ?
      ORDER BY le.xp_earned DESC
      LIMIT ?
    `);
    return (stmt.all(periodType, periodKey, limit) as any[]).map((row, index) => ({
      userId: row.user_id,
      fullName: row.full_name,
      photoUrl: row.photo_url,
      xpEarned: row.xp_earned,
      rankPosition: index + 1,
    }));
  }

  updateLeaderboard(userId: number, periodType: string, periodKey: string, xpEarned: number): void {
    db.prepare(`
      INSERT INTO leaderboard_entries (user_id, period_type, period_key, xp_earned)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, period_type, period_key) DO UPDATE SET
        xp_earned = xp_earned + ?,
        updated_at = datetime('now')
    `).run(userId, periodType, periodKey, xpEarned, xpEarned);
  }

  // Get lessons with user progress for a week
  getLessonsWithProgress(userId: number, weekId: number): any[] {
    const lessons = this.getLessonsByWeekId(weekId);
    const progressList = this.getAllUserLessonProgress(userId);
    const progressMap = new Map(progressList.map(p => [p.lessonId, p]));

    return lessons.map((lesson, index) => {
      const progress = progressMap.get(lesson.id);
      let status = 'locked';
      
      if (progress) {
        status = progress.status;
      } else if (index === 0) {
        status = 'available';
      } else {
        const prevLesson = lessons[index - 1];
        const prevProgress = progressMap.get(prevLesson.id);
        if (prevProgress && prevProgress.status === 'completed') {
          status = 'available';
        }
      }

      return {
        ...lesson,
        progress: progress || null,
        status,
      };
    });
  }
}

export const storage = new SQLiteStorage();
