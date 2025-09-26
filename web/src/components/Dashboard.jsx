import React, { useMemo, useState } from 'react';
import DepartmentColumn from './DepartmentColumn';

export default function Dashboard({ state, api }){
  const { employees, departments, assignments } = state;
  const [newEmp, setNewEmp] = useState('');
  const [newDep, setNewDep] = useState('');

  const byEmp = useMemo(()=>{
    const m = new Map();
    assignments.forEach(a=> m.set(a.employee_id, a.department_id));
    return m;
  }, [assignments]);

  const empByDept = useMemo(()=>{
    const map = new Map();
    departments.forEach(d=> map.set(d.id, []));
    map.set('employees', []); // Alle Mitarbeiter für die Mitarbeiter-Spalte
    map.set('break', []);
    
    // Alle Mitarbeiter zu "employees" hinzufügen
    employees.forEach(e=> {
      if (e.status === 'break') { 
        map.get('break').push(e); 
        return; 
      }
      
      const depId = byEmp.get(e.id);
      const isAssigned = depId !== null && depId !== undefined;
      
      // Zu Mitarbeiter-Liste hinzufügen (mit Zuweisungs-Status)
      map.get('employees').push({...e, isAssigned});
      
      // Zu spezifischem Bereich hinzufügen, falls zugewiesen
      if (isAssigned && map.has(depId)) {
        map.get(depId).push(e);
      }
    });
    return map;
  }, [employees, departments, byEmp]);

  async function onDropEmployee(empId, deptId){ 
    try {
      await api.assign(empId, deptId);
    } catch (error) {
      alert(error.error || 'Fehler beim Zuweisen');
    }
  }
  
  async function handleAutoAssign() {
    try {
      await api.autoAssign();
      // Keine Bestätigung - Mitarbeiter werden direkt verteilt
    } catch (error) {
      console.error('Fehler bei der automatischen Verteilung:', error);
    }
  }
  
  async function onSetStatus(emp, status){ await api.setStatus(emp.id, status); }
  async function onEditRadio(emp, radio){ await api.updateEmployee(emp.id, { ...emp, radio }); }
  async function onDeleteEmployee(empId){ await api.deleteEmployee(empId); }
  async function onDeleteDepartment(deptId){ await api.deleteDepartment(deptId); }
  async function onUpdateCapacity(deptId, capacity){ 
    const dept = departments.find(d => d.id === deptId);
    if (dept) await api.updateDepartment(deptId, { name: dept.name, capacity }); 
  }
  async function addEmployee(){ if (!newEmp.trim()) return; await api.createEmployee(newEmp.trim(), ''); setNewEmp(''); }
  async function addDepartment(){ if (!newDep.trim()) return; await api.createDepartment(newDep.trim(), 10); setNewDep(''); }

  return (
    <div className="space-y-3 h-screen flex flex-col">
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 flex-shrink-0">
        <div className="bg-white/70 dark:bg-neutral-800/40 backdrop-blur border border-black/5 dark:border-white/10 rounded-2xl p-3">
          <h3 className="text-sm font-semibold mb-2 dark:text-white">Mitarbeiter anlegen</h3>
          <div className="flex gap-2">
            <input className="flex-1 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 dark:text-white" placeholder="Name" value={newEmp} onChange={e=>setNewEmp(e.target.value)} />
            <button className="px-3 rounded-xl border dark:border-white/20 dark:text-white" onClick={addEmployee}>Add</button>
          </div>
        </div>
        <div className="bg-white/70 dark:bg-neutral-800/40 backdrop-blur border border-black/5 dark:border-white/10 rounded-2xl p-3">
          <h3 className="text-sm font-semibold mb-2 dark:text-white">Bereich anlegen</h3>
          <div className="flex gap-2">
            <input className="flex-1 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 dark:text-white" placeholder="Bereich" value={newDep} onChange={e=>setNewDep(e.target.value)} />
            <button className="px-3 rounded-xl border dark:border-white/20 dark:text-white" onClick={addDepartment}>Add</button>
          </div>
        </div>
        <div className="bg-white/70 dark:bg-neutral-800/40 backdrop-blur border border-black/5 dark:border-white/10 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-600 dark:text-white/70">Aktive</div>
            <div className="text-xl font-semibold dark:text-white">{employees.filter(e=>e.status==='active').length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-white/70">Pause</div>
            <div className="text-xl font-semibold dark:text-white">{employees.filter(e=>e.status==='break').length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-white/70">Bereiche</div>
            <div className="text-xl font-semibold dark:text-white">{departments.length}</div>
          </div>
        </div>
        <div className="bg-white/70 dark:bg-neutral-800/40 backdrop-blur border border-black/5 dark:border-white/10 rounded-2xl p-3">
          <h3 className="text-sm font-semibold mb-3 dark:text-white">Aktionen</h3>
          <div className="flex flex-col gap-2">
            <button className="w-full px-4 py-3 text-sm rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium shadow-sm transition-colors" onClick={handleAutoAssign}>
              🎯 Fair verteilen
            </button>
            <button className="w-full px-4 py-3 text-sm rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium shadow-sm transition-colors" onClick={()=> api.reset()}>
              🔄 Alle zurücksetzen
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr] gap-2 flex-1 min-h-0">
        <div className="flex flex-col gap-2 h-full min-h-0">
          <DepartmentColumn title="Mitarbeiter" dept={null}
            employees={empByDept.get('employees') || []}
            onDropEmployee={onDropEmployee} onSetStatus={onSetStatus} onEditRadio={onEditRadio} 
            onDeleteEmployee={onDeleteEmployee} onDeleteDepartment={onDeleteDepartment} 
            onUpdateCapacity={onUpdateCapacity} isEmployeeList={true} />
          
          <DepartmentColumn title="Pause" dept={{ id: null }}
            employees={empByDept.get('break') || []}
            onDropEmployee={onDropEmployee} onSetStatus={onSetStatus} onEditRadio={onEditRadio} 
            onDeleteEmployee={onDeleteEmployee} onDeleteDepartment={onDeleteDepartment} 
            onUpdateCapacity={onUpdateCapacity} />
        </div>
        
        <div className={`grid gap-2 h-full min-h-0 ${
          departments.length <= 3 ? `grid-cols-${departments.length}` : 
          departments.length <= 4 ? 'grid-cols-4' :
          'grid-cols-5'
        }`}>
          {departments.map(d=> (
            <DepartmentColumn key={d.id} title={d.name} dept={d}
              employees={empByDept.get(d.id) || []}
              onDropEmployee={onDropEmployee} onSetStatus={onSetStatus} onEditRadio={onEditRadio} 
              onDeleteEmployee={onDeleteEmployee} onDeleteDepartment={onDeleteDepartment}
              onUpdateCapacity={onUpdateCapacity} />
          ))}
        </div>
      </section>
    </div>
  );
}