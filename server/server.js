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

// Keep-Alive für Render.com - verhindert Sleep Mode
if (process.env.NODE_ENV === 'production') {
  const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log('🔄 Keep-Alive aktiviert für:', keepAliveUrl);
  
  setInterval(async () => {
    try {
      const response = await fetch(`${keepAliveUrl}/api/test`);
      console.log('💓 Keep-Alive Ping:', response.status, new Date().toLocaleTimeString());
    } catch (error) {
      console.log('💓 Keep-Alive Ping fehlgeschlagen:', error.message);
    }
  }, 10 * 60 * 1000); // Alle 10 Minuten
}

// Initialize database on first run
try {
  initDb();
  console.log('🎯 Database initialized successfully - Live Staff MVP v2.1.0');
} catch (error) {
  console.log('Database already exists or initialization skipped');
}

// Middleware
app.use(cors({
  origin: [process.env.ORIGIN || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Static files - serve HTML files from public directory (always active)
app.use(express.static(join(__dirname, 'public')));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'public')));
}

if (process.argv.includes('--init-db')){
  initDb(); console.log('DB initialized.'); process.exit(0);
}
initDb();

function auth(req,res,next){
  const token = (req.headers.authorization||'').replace('Bearer ','').trim();
  if (!token) return res.status(401).json({error:'No token'});
  try{ req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch{ return res.status(401).json({error:'Invalid token'}); }
}

// Admin-only authentication (für Änderungen)
function authAdmin(req,res,next){
  const token = (req.headers.authorization||'').replace('Bearer ','').trim();
  if (!token) return res.status(401).json({error:'No token'});
  try{ 
    req.user = jwt.verify(token, JWT_SECRET); 
    if (req.user.role !== 'admin') return res.status(403).json({error:'Admin-Rechte erforderlich'});
    next(); 
  }
  catch{ return res.status(401).json({error:'Invalid token'}); }
}
function pushState(){
  const employees = db.prepare('SELECT * FROM employees').all();
  const departments = db.prepare('SELECT * FROM departments').all();
  const assignments = db.prepare('SELECT * FROM assignments').all();
  console.log('📡 Broadcasting state update via WebSocket - Employees:', employees.length, 'Departments:', departments.length);
  io.emit('state', { employees, departments, assignments });
}

// Keep-Alive Test Endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'Server is alive', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Employee endpoints (no auth required for employee login)
app.get('/api/employees-list', (req, res) => {
  const employees = db.prepare('SELECT id, name FROM employees').all();
  res.json(employees);
});

app.post('/api/employee-login', (req, res) => {
  const { employeeId } = req.body;
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  res.json({ employee });
});

app.put('/api/employee-status', (req, res) => {
  const { employeeId, status } = req.body;
  db.prepare('UPDATE employees SET status = ? WHERE id = ?').run(status, employeeId);
  pushState(); // Broadcast update to all clients
  res.json({ ok: true });
});

app.get('/api/departments-list', (req, res) => {
  const departments = db.prepare('SELECT id, name FROM departments').all();
  res.json(departments);
});

app.put('/api/employee-department', (req, res) => {
  try {
    const { employeeId, departmentId } = req.body;
    console.log('Employee department update:', { employeeId, departmentId });
    
    // Validate input
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }
    
    // Check if employee exists
    const employee = db.prepare('SELECT id FROM employees WHERE id = ?').get(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Check if department exists (if departmentId is provided)
    if (departmentId) {
      const department = db.prepare('SELECT id FROM departments WHERE id = ?').get(departmentId);
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }
    }
    
    // Update employee table directly (for mobile app)
    db.prepare('UPDATE employees SET department_id = ? WHERE id = ?').run(departmentId, employeeId);
    
    // Also update assignments table (for desktop app sync)
    const row = db.prepare('SELECT id FROM assignments WHERE employee_id=?').get(employeeId);
    if (row) {
      db.prepare('UPDATE assignments SET department_id=?, assigned_at=CURRENT_TIMESTAMP WHERE id=?').run(departmentId, row.id);
    } else {
      db.prepare('INSERT INTO assignments (employee_id, department_id) VALUES (?,?)').run(employeeId, departmentId);
    }
    
    pushState(); // Broadcast update to all clients including admin dashboard
    res.json({ ok: true });
  } catch (error) {
    console.error('Employee department update error:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// Auth
app.post('/api/login', async (req,res)=>{
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!user) return res.status(401).json({error:'Invalid'});
  const bcrypt = (await import('bcryptjs')).default;
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({error:'Invalid'});
  const token = jwt.sign({ id:user.id, username:user.username, role:user.role }, JWT_SECRET, { expiresIn:'8h' });
  res.json({ token, user: { username: user.username, role: user.role } });
});

// User info endpoint
app.get('/api/me', auth, (req,res)=>{
  const user = db.prepare('SELECT username, role FROM users WHERE id=?').get(req.user.id);
  res.json(user);
});

// Token verification endpoint
app.get('/api/verify-token', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT username, role FROM users WHERE id=?').get(decoded.id);
    
    if (!user) {
      return res.status(401).json({ valid: false, error: 'User not found' });
    }
    
    res.json({ 
      valid: true, 
      user: { 
        username: user.username, 
        role: user.role 
      } 
    });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

// Protected CRUD
app.get('/api/state', auth, (req,res)=>{
  const employees = db.prepare('SELECT * FROM employees').all();
  const departments = db.prepare('SELECT * FROM departments').all();
  const assignments = db.prepare('SELECT * FROM assignments').all();
  res.json({ employees, departments, assignments });
});

app.post('/api/employees', authAdmin, (req,res)=>{
  const { name, radio='' } = req.body;
  const info = db.prepare('INSERT INTO employees (name,radio,status) VALUES (?,?,?)').run(name, radio, 'active');
  db.prepare('INSERT INTO assignments (employee_id, department_id) VALUES (?,NULL)').run(info.lastInsertRowid);
  pushState(); res.json({ id: info.lastInsertRowid });
});
app.put('/api/employees/:id', authAdmin, (req,res)=>{
  const { name, radio, status } = req.body;
  db.prepare('UPDATE employees SET name=?, radio=?, status=? WHERE id=?').run(name, radio, status, req.params.id);
  pushState(); res.json({ ok:true });
});
app.delete('/api/employees/:id', authAdmin, (req,res)=>{
  db.prepare('DELETE FROM employees WHERE id=?').run(req.params.id);
  db.prepare('DELETE FROM assignments WHERE employee_id=?').run(req.params.id);
  pushState(); res.json({ ok:true });
});

app.post('/api/departments', authAdmin, (req,res)=>{
  const { name, capacity = 10 } = req.body;
  const info = db.prepare('INSERT INTO departments (name, capacity) VALUES (?,?)').run(name, capacity);
  pushState(); res.json({ id: info.lastInsertRowid });
});
app.put('/api/departments/:id', authAdmin, (req,res)=>{
  const { name, capacity } = req.body;
  db.prepare('UPDATE departments SET name=?, capacity=? WHERE id=?').run(name, capacity, req.params.id);
  pushState(); res.json({ ok:true });
});

// Toggle auto-assignment für Bereiche
app.put('/api/departments/:id/auto-assign', authAdmin, (req,res)=>{
  const { auto_assign } = req.body;
  db.prepare('UPDATE departments SET auto_assign=? WHERE id=?').run(auto_assign ? 1 : 0, req.params.id);
  pushState(); res.json({ ok:true });
});

app.delete('/api/departments/:id', authAdmin, (req,res)=>{
  db.prepare('DELETE FROM departments WHERE id=?').run(req.params.id);
  db.prepare('UPDATE assignments SET department_id=NULL WHERE department_id=?').run(req.params.id);
  pushState(); res.json({ ok:true });
});

app.post('/api/assign', authAdmin, (req,res)=>{
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
  
  // Update assignments table (for desktop app)
  const row = db.prepare('SELECT id FROM assignments WHERE employee_id=?').get(employee_id);
  if (row) db.prepare('UPDATE assignments SET department_id=?, assigned_at=CURRENT_TIMESTAMP WHERE id=?').run(department_id, row.id);
  else db.prepare('INSERT INTO assignments (employee_id, department_id) VALUES (?,?)').run(employee_id, department_id);
  
  // Also update employee table directly (for mobile app sync)
  db.prepare('UPDATE employees SET department_id = ? WHERE id = ?').run(department_id, employee_id);
  
  pushState(); res.json({ ok:true });
});
app.post('/api/status', authAdmin, (req,res)=>{
  const { employee_id, status } = req.body;
  db.prepare('UPDATE employees SET status=? WHERE id=?').run(status, employee_id);
  pushState(); res.json({ ok:true });
});

// Mitarbeiter zu Team zuweisen
app.post('/api/assign-team', authAdmin, (req, res) => {
  const { employee_id, team_id } = req.body;
  db.prepare('UPDATE employees SET team_id = ? WHERE id = ?').run(team_id, employee_id);
  pushState();
  res.json({ ok: true });
});

app.post('/api/autoAssign', authAdmin, (req,res)=>{
  try {
    // Zuerst: Mitarbeiter aus MANUELLEN Bereichen identifizieren und schützen
    const manualDepartments = db.prepare('SELECT id FROM departments WHERE auto_assign = 0').all();
    const protectedAssignments = [];
    
    for (const dept of manualDepartments) {
      const assignments = db.prepare('SELECT * FROM assignments WHERE department_id = ?').all(dept.id);
      protectedAssignments.push(...assignments);
    }
    
    // Nur Zuweisungen aus AUTO-Bereichen löschen, manuelle bleiben bestehen
    db.prepare('DELETE FROM assignments WHERE department_id IN (SELECT id FROM departments WHERE auto_assign = 1) OR department_id IS NULL').run();
    
    // Aktuelle Daten laden - nur Bereiche mit auto_assign = 1 für automatische Verteilung
    const allEmployees = db.prepare('SELECT * FROM employees WHERE status = ?').all('active');
    const departments = db.prepare('SELECT * FROM departments WHERE name != ? AND auto_assign = 1').all('Mitarbeiter');
    
    // Nur freie Mitarbeiter verwenden (nicht in manuellen Bereichen zugewiesen)
    const protectedEmployeeIds = db.prepare(`
      SELECT DISTINCT employee_id FROM assignments 
      WHERE department_id IN (SELECT id FROM departments WHERE auto_assign = 0)
    `).all().map(row => row.employee_id);
    
    const employees = allEmployees.filter(emp => !protectedEmployeeIds.includes(emp.id));
    
    if (employees.length === 0) {
      pushState();
      return res.json({ ok: true, message: 'Keine freien Mitarbeiter zum Verteilen (alle in manuellen Bereichen geschützt)' });
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

app.post('/api/reset', authAdmin, (req,res)=>{
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
  console.log('🔌 New WebSocket connection established');
  const employees = db.prepare('SELECT * FROM employees').all();
  const departments = db.prepare('SELECT * FROM departments').all();
  const assignments = db.prepare('SELECT * FROM assignments').all();
  console.log('📡 Sending initial state to new client - Employees:', employees.length, 'Departments:', departments.length);
  socket.emit('state', { employees, departments, assignments });
  
  socket.on('disconnect', () => {
    console.log('❌ WebSocket connection closed');
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
  });
}

httpServer.listen(PORT, '0.0.0.0', ()=> console.log('Server running on port '+PORT) );
