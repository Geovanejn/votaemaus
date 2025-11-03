const Database = require("better-sqlite3");
const db = new Database("data/emaus-vota.db");
const columns = db.prepare("PRAGMA table_info(users)").all();
console.log(JSON.stringify(columns, null, 2));
db.close();
