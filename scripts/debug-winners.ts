import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "data", "emaus-vota.db");
const db = new Database(dbPath);

console.log("=== VERIFICANDO DADOS NO BANCO ===\n");

// 1. Eleições ativas
console.log("1. Eleições ativas:");
const elections = db.prepare("SELECT id, name, is_active FROM elections WHERE is_active = 1").all();
console.log(elections);
console.log();

// 2. Usuário Geovane
console.log("2. Usuário Geovane:");
const geovane = db.prepare("SELECT id, full_name, email FROM users WHERE full_name LIKE '%Geovane%'").all();
console.log(geovane);
console.log();

// 3. Winners na eleição ativa
if (elections.length > 0) {
  const electionId = elections[0].id;
  console.log(`3. Winners na eleição ${electionId}:`);
  const winners = db.prepare(`
    SELECT 
      ew.id,
      ew.election_id,
      ew.position_id,
      ew.candidate_id,
      ew.won_at_scrutiny,
      c.name as candidate_name,
      c.user_id,
      p.name as position_name
    FROM election_winners ew
    INNER JOIN candidates c ON c.id = ew.candidate_id
    INNER JOIN positions p ON p.id = ew.position_id
    WHERE ew.election_id = ?
  `).all(electionId);
  console.log(winners);
  console.log();
  
  // 4. Testar a query que deveria filtrar
  console.log("4. Testando query getElectionWinners:");
  const winnersQuery = db.prepare(`
    SELECT 
      c.user_id as userId,
      ew.position_id as positionId,
      ew.candidate_id as candidateId,
      ew.won_at_scrutiny as wonAtScrutiny
    FROM election_winners ew
    INNER JOIN candidates c ON c.id = ew.candidate_id
    WHERE ew.election_id = ?
  `).all(electionId);
  console.log(winnersQuery);
  console.log();
  
  // 5. User IDs dos winners
  const winnerUserIds = winnersQuery.map((w: any) => w.userId);
  console.log("5. User IDs dos winners:", winnerUserIds);
  console.log();
  
  // 6. Membros não-admin
  console.log("6. Todos membros não-admin:");
  const allMembers = db.prepare("SELECT id, full_name, is_admin FROM users WHERE is_admin = 0 AND is_member = 1").all();
  console.log(allMembers);
  console.log();
  
  // 7. Membros que deveriam ser filtrados
  console.log("7. Membros que DEVERIAM aparecer (não são winners):");
  const filteredMembers = allMembers.filter((m: any) => !winnerUserIds.includes(m.id));
  console.log(filteredMembers);
}

db.close();
