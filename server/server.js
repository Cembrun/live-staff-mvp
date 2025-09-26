import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db, { initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: [process.env.ORIGIN || 'http://localhost:5174', 'http://localhost:5173'], credentials: true }
});

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'public')));
}

if (process.argv.includes('--init-db')){
  initDb(); console.log('DB initialized.'); process.exit(0);
}
initDb();

app.use(cors({ origin: [process.env.ORIGIN || 'http://localhost:5174', 'http://localhost:5173'], credentials: true }));
app.use(express.json());

function auth(req,res,next){
  const token = (req.headers.authorization||'').replace('Bearer ','').trim();
  if (!token) return res.status(401).json({error:'No token'});
  try{ req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch{ return res.status(401).json({error:'Invalid token'}); }
}
function pushState(){
  const employees = db.prepare('SELECT * FROM employees').all();
  const departments = db.prepare('SELECT * FROM departments').all();
  const assignments = db.prepare('SELECT * FROM assignments').all();
  const teams = db.prepare('SELECT * FROM teams').all();
  io.emit('state', { employees, departments, assignments, teams });
}

// Auth
app.post('/api/login', async (req,res)=>{
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!user) return res.status(401).json({error:'Invalid'});
  const bcrypt = (await import('bcryptjs')).default;
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({error:'Invalid'});
  const token = jwt.sign({ id:user.id, username:user.username, role:user.role }, JWT_SECRET, { expiresIn:'8h' });
  res.json({ token });
});

// Protected CRUD
app.get('/api/state', auth, (req,res)=>{
  const employees = db.prepare('SELECT * FROM employees').all();
  const departments = db.prepare('SELECT * FROM departments').all();
  const assignments = db.prepare('SELECT * FROM assignments').all();
  res.json({ employees, departments, assignments });
});

app.post('/api/employees', auth, (req,res)=>{
  const { name, radio='' } = req.body;
  const info = db.prepare('INSERT INTO employees (name,radio,status) VALUES (?,?,?)').run(name, radio, 'active');
  db.prepare('INSERT INTO assignments (employee_id, department_id) VALUES (?,NULL)').run(info.lastInsertRowid);
  pushState(); res.json({ id: info.lastInsertRowid });
});
app.put('/api/employees/:id', auth, (req,res)=>{
  const { name, radio, status } = req.body;
  db.prepare('UPDATE employees SET name=?, radio=?, status=? WHERE id=?').run(name, radio, status, req.params.id);
  pushState(); res.json({ ok:true });
});
app.delete('/api/employees/:id', auth, (req,res)=>{
  db.prepare('DELETE FROM employees WHERE id=?').run(req.params.id);
  db.prepare('DELETE FROM assignments WHERE employee_id=?').run(req.params.id);
  pushState(); res.json({ ok:true });
});

app.post('/api/departments', auth, (req,res)=>{
  const { name, capacity = 10 } = req.body;
  const info = db.prepare('INSERT INTO departments (name, capacity) VALUES (?,?)').run(name, capacity);
  pushState(); res.json({ id: info.lastInsertRowid });
});
app.put('/api/departments/:id', auth, (req,res)=>{
  const { name, capacity } = req.body;
  db.prepare('UPDATE departments SET name=?, capacity=? WHERE id=?').run(name, capacity, req.params.id);
  pushState(); res.json({ ok:true });
});
app.delete('/api/departments/:id', auth, (req,res)=>{
  db.prepare('DELETE FROM departments WHERE id=?').run(req.params.id);
  db.prepare('UPDATE assignments SET department_id=NULL WHERE department_id=?').run(req.params.id);
  pushState(); res.json({ ok:true });
});

app.post('/api/assign', auth, (req,res)=>{
  const { employee_id, department_id } = req.body;
  
  // Kapazitätsprüfung wenn zu einem Bereich zugewiesen wird
  if (department_id) {
    const dept = db.prepare('SELECT capacity FROM departments WHERE id=?').get(department_id);
    if (dept && dept.capacity) {
      const currentCount = db.prepare('SELECT COUNT(*) as count FROM assignments WHERE department_id=? AND employee_id != ?').get(department_id, employee_id).count;
      if (currentCount >= dept.capacity) {
        return res.status(400).json({error: `Bereich ist voll! Maximale Kapazität: ${dept.capacity}`});
      }
    }
  }
  
  const row = db.prepare('SELECT id FROM assignments WHERE employee_id=?').get(employee_id);
  if (row) db.prepare('UPDATE assignments SET department_id=?, assigned_at=CURRENT_TIMESTAMP WHERE id=?').run(department_id, row.id);
  else db.prepare('INSERT INTO assignments (employee_id, department_id) VALUES (?,?)').run(employee_id, department_id);
  pushState(); res.json({ ok:true });
});
app.post('/api/status', auth, (req,res)=>{
  const { employee_id, status } = req.body;
  db.prepare('UPDATE employees SET status=? WHERE id=?').run(status, employee_id);
  pushState(); res.json({ ok:true });
});

// Team Management Endpoints
app.get('/api/teams', auth, (req, res) => {
  const teams = db.prepare('SELECT * FROM teams ORDER BY name').all();
  res.json(teams);
});

app.post('/api/teams', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Team-Name erforderlich' });
  
  const result = db.prepare('INSERT INTO teams (name) VALUES (?)').run(name);
  pushState();
  res.json({ id: result.lastInsertRowid, name });
});

app.delete('/api/teams/:id', auth, (req, res) => {
  const { id } = req.params;
  // Mitarbeiter von Team entfernen
  db.prepare('UPDATE employees SET team_id = NULL WHERE team_id = ?').run(id);
  // Team löschen
  db.prepare('DELETE FROM teams WHERE id = ?').run(id);
  pushState();
  res.json({ ok: true });
});

// Mitarbeiter zu Team zuweisen
app.post('/api/assign-team', auth, (req, res) => {
  const { employee_id, team_id } = req.body;
  db.prepare('UPDATE employees SET team_id = ? WHERE id = ?').run(team_id, employee_id);
  pushState();
  res.json({ ok: true });
});

app.post('/api/autoAssign', auth, (req,res)=>{
  try {
    // Alle Zuweisungen zurücksetzen für komplett neue faire Verteilung
    db.prepare('DELETE FROM assignments').run();
    
    // Aktuelle Daten laden
    const employees = db.prepare('SELECT * FROM employees WHERE status = ?').all('active');
    const departments = db.prepare('SELECT * FROM departments WHERE name != ?').all('Mitarbeiter');
    
    if (employees.length === 0) {
      pushState();
      return res.json({ ok: true, message: 'Keine aktiven Mitarbeiter zum Verteilen' });
    }
    
    if (departments.length === 0) {
      pushState();
      return res.json({ ok: true, message: 'Keine Bereiche zum Zuweisen verfügbar' });
    }
    
    // Mische Mitarbeiter für verschiedene Verteilungen
    const shuffledEmployees = [...employees].sort(() => Math.random() - 0.5);
    
    // Mische auch die Bereiche für faire Verteilung
    const shuffledDepartments = [...departments].sort(() => Math.random() - 0.5);
    
    let employeeIndex = 0;
    let assigned = 0;
    
    // Round-Robin: Jeder Bereich bekommt einen Mitarbeiter, dann nächste Runde
    for (let round = 0; round < 10 && employeeIndex < shuffledEmployees.length; round++) {
      for (const dept of shuffledDepartments) {
        const capacity = dept.capacity || 1;
        const currentCount = db.prepare('SELECT COUNT(*) as count FROM assignments WHERE department_id = ?').get(dept.id).count;
        
        if (currentCount < capacity && employeeIndex < shuffledEmployees.length) {
          const employee = shuffledEmployees[employeeIndex];
          db.prepare('INSERT INTO assignments (employee_id, department_id) VALUES (?, ?)')
            .run(employee.id, dept.id);
          assigned++;
          employeeIndex++;
        }
      }
    }
    
    pushState(); 
    res.json({ 
      ok: true, 
      assigned: assigned,
      total: employees.length
    });
    
  } catch (error) {
    console.error('AutoAssign Error:', error);
    res.status(500).json({ error: 'Fehler beim automatischen Zuweisen' });
  }
});

app.post('/api/reset', auth, (req,res)=>{
  db.prepare('UPDATE assignments SET department_id=NULL').run();
  pushState(); res.json({ ok:true });
});

io.use((socket,next)=>{
  try{
    const token = socket.handshake.auth?.token;
    jwt.verify(token, JWT_SECRET); next();
  }catch{ next(new Error('unauthorized')); }
});
io.on('connection', (socket)=>{
  const employees = db.prepare('SELECT * FROM employees').all();
  const departments = db.prepare('SELECT * FROM departments').all();
  const assignments = db.prepare('SELECT * FROM assignments').all();
  const teams = db.prepare('SELECT * FROM teams').all();
  socket.emit('state', { employees, departments, assignments, teams });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
  });
}

httpServer.listen(PORT, ()=> console.log('Server http://localhost:'+PORT) );
