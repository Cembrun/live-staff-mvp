import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'data.sqlite');
const db = new Database(DB_FILE);

export function initDb(){
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  if (userCount === 0){
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username,password_hash,role) VALUES (?,?,?)').run('admin',hash,'admin');
  }
  // Don't auto-create departments - let user create their own
  // Don't auto-create employees - let user create their own
  
  // Ensure every employee has an assignment row
  const emps = db.prepare('SELECT id FROM employees').all();
  for (const e of emps){
    const a = db.prepare('SELECT 1 FROM assignments WHERE employee_id=?').get(e.id);
    if (!a) db.prepare('INSERT INTO assignments (employee_id, department_id) VALUES (?,NULL)').run(e.id);
  }
}
export default db;