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
  
  // Ensure admin user exists
  const adminExists = db.prepare('SELECT COUNT(*) c FROM users WHERE username = ?').get('admin').c;
  if (adminExists === 0){
    const adminHash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username,password_hash,role) VALUES (?,?,?)').run('admin',adminHash,'admin');
  }
  
  // Ensure Bell viewer user exists
  const bellExists = db.prepare('SELECT COUNT(*) c FROM users WHERE username = ?').get('Bell').c;
  if (bellExists === 0){
    const bellHash = bcrypt.hashSync('Bell', 10);
    db.prepare('INSERT INTO users (username,password_hash,role) VALUES (?,?,?)').run('Bell',bellHash,'viewer');
  }
  
  // Migration: Add department_id column to employees if it doesn't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(employees)").all();
    const hasDepartmentId = tableInfo.some(column => column.name === 'department_id');
    
    if (!hasDepartmentId) {
      console.log('🔄 Migrating database: Adding department_id column to employees table...');
      db.prepare('ALTER TABLE employees ADD COLUMN department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL').run();
      console.log('✅ Migration completed: department_id column added to employees table');
    }
  } catch (error) {
    console.log('📊 Database migration info:', error.message);
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