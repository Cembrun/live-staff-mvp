const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000');
export function setToken(t){ localStorage.setItem('token', t); }
export function getToken(){ return localStorage.getItem('token'); }
export function clearToken(){ localStorage.removeItem('token'); }

async function req(path, method='GET', body){
  const res = await fetch(API_URL+path, {
    method,
    headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + getToken() },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export const api = {
  login: (u,p)=> fetch(API_URL+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})}).then(r=>r.json()),
  me: ()=> req('/api/me'),
  state: ()=> req('/api/state'),
  createEmployee: (name, radio)=> req('/api/employees','POST',{name,radio}),
  updateEmployee: (id, data)=> req('/api/employees/'+id,'PUT',data),
  deleteEmployee: (id)=> req('/api/employees/'+id,'DELETE'),
  createDepartment: (name, capacity)=> req('/api/departments','POST',{name, capacity}),
  updateDepartment: (id, data)=> req('/api/departments/'+id,'PUT',data),
  deleteDepartment: (id)=> req('/api/departments/'+id,'DELETE'),
  toggleAutoAssign: (id, auto_assign)=> req('/api/departments/'+id+'/auto-assign','PUT',{auto_assign}),
  assign: (employee_id, department_id)=> req('/api/assign','POST',{employee_id,department_id}),
  setStatus: (employee_id, status)=> req('/api/status','POST',{employee_id,status}),
  autoAssign: ()=> req('/api/autoAssign','POST',{}),
  reset: ()=> req('/api/reset','POST',{}),
  // Team Management
  getTeams: ()=> req('/api/teams'),
  createTeam: (name)=> req('/api/teams','POST',{name}),
  deleteTeam: (id)=> req('/api/teams/'+id,'DELETE'),
  assignTeam: (employee_id, team_id)=> req('/api/assign-team','POST',{employee_id, team_id}),
  API_URL
};