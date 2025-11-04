import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "data", "emaus-vota.db");
const db = new Database(dbPath);

console.log("=== VERIFICANDO TODOS OS DADOS ===\n");

// Todas eleições (ativas ou não)
console.log("1. TODAS eleições:");
const elections = db.prepare("SELECT * FROM elections ORDER BY created_at DESC LIMIT 10").all();
console.log(elections);
console.log();

// Todos usuários
console.log("2. TODOS usuários:");
const users = db.prepare("SELECT id, full_name, email, is_admin, is_member FROM users ORDER BY id").all();
console.log(users);
console.log();

// Todos winners
console.log("3. TODOS winners:");
const allWinners = db.prepare(`
  SELECT 
    ew.*,
    c.name as candidate_name,
    c.user_id,
    p.name as position_name
  FROM election_winners ew
  INNER JOIN candidates c ON c.id = ew.candidate_id
  INNER JOIN positions p ON p.id = ew.position_id
  ORDER BY ew.created_at DESC
`).all();
console.log(allWinners);
console.log();

// Todos candidates
console.log("4. TODOS candidates:");
const candidates = db.prepare("SELECT * FROM candidates ORDER BY id DESC LIMIT 20").all();
console.log(candidates);
console.log();

// Posições da eleição mais recente
if (elections.length > 0) {
  const latestElection = elections[0];
  console.log(`5. Posições da eleição "${latestElection.name}" (ID: ${latestElection.id}):`);
  const positions = db.prepare(`
    SELECT ep.*, p.name as position_name
    FROM election_positions ep
    INNER JOIN positions p ON p.id = ep.position_id
    WHERE ep.election_id = ?
    ORDER BY ep.order_index
  `).all(latestElection.id);
  console.log(positions);
}

db.close();
