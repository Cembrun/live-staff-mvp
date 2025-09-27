import React, { useMemo, useState } from 'react';
import DepartmentColumn from './DepartmentColumn';

export default function Dashboard({ state, api, user }){
  const { employees, departments, assignments } = state;
  const [newEmp, setNewEmp] = useState('');
  const [newDep, setNewDep] = useState('');
  
  const isAdmin = user?.role === 'admin';

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
  async function onToggleAutoAssign(deptId, autoAssign){ 
    await api.toggleAutoAssign(deptId, autoAssign); 
  }
  async function addEmployee(){ if (!newEmp.trim()) return; await api.createEmployee(newEmp.trim(), ''); setNewEmp(''); }
  async function addDepartment(){ if (!newDep.trim()) return; await api.createDepartment(newDep.trim(), 10); setNewDep(''); }

  return (
    <div className="space-y-3 h-screen flex flex-col">
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 flex-shrink-0">
        {isAdmin && (
          <div className="bg-white/70 dark:bg-neutral-800/40 backdrop-blur border border-black/5 dark:border-white/10 rounded-2xl p-3">
            <h3 className="text-sm font-semibold mb-2 dark:text-white">Mitarbeiter anlegen</h3>
            <div className="flex gap-2">
              <input className="flex-1 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 dark:text-white" placeholder="Name" value={newEmp} onChange={e=>setNewEmp(e.target.value)} />
              <button className="px-3 rounded-xl border dark:border-white/20 dark:text-white" onClick={addEmployee}>Add</button>
            </div>
          </div>
        )}
        {isAdmin && (
          <div className="bg-white/70 dark:bg-neutral-800/40 backdrop-blur border border-black/5 dark:border-white/10 rounded-2xl p-3">
            <h3 className="text-sm font-semibold mb-2 dark:text-white">Bereich anlegen</h3>
            <div className="flex gap-2">
              <input className="flex-1 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 dark:text-white" placeholder="Bereich" value={newDep} onChange={e=>setNewDep(e.target.value)} />
              <button className="px-3 rounded-xl border dark:border-white/20 dark:text-white" onClick={addDepartment}>Add</button>
            </div>
          </div>
        )}
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
        {isAdmin && (
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
        )}
      </section>

      {/* SMARTPHONE ONLY: Alle Bereiche strikt untereinander - 100% Breite */}
      <section className="block lg:hidden">
        <div className="w-full space-y-4">
          <div className="w-full">
            <DepartmentColumn title="Mitarbeiter" dept={null}
              employees={empByDept.get('employees') || []}
              onDropEmployee={isAdmin ? onDropEmployee : null} onSetStatus={isAdmin ? onSetStatus : null} onEditRadio={isAdmin ? onEditRadio : null} 
              onDeleteEmployee={isAdmin ? onDeleteEmployee : null} onDeleteDepartment={isAdmin ? onDeleteDepartment : null} 
              onUpdateCapacity={isAdmin ? onUpdateCapacity : null} onToggleAutoAssign={isAdmin ? onToggleAutoAssign : null} isEmployeeList={true} isAdmin={isAdmin} />
          </div>
          
          <div className="w-full">
            <DepartmentColumn title="Pause" dept={{ id: null }}
              employees={empByDept.get('break') || []}
              onDropEmployee={isAdmin ? onDropEmployee : null} onSetStatus={isAdmin ? onSetStatus : null} onEditRadio={isAdmin ? onEditRadio : null} 
              onDeleteEmployee={isAdmin ? onDeleteEmployee : null} onDeleteDepartment={isAdmin ? onDeleteDepartment : null} 
              onUpdateCapacity={isAdmin ? onUpdateCapacity : null} onToggleAutoAssign={isAdmin ? onToggleAutoAssign : null} isAdmin={isAdmin} />
          </div>

          {departments.map(d=> (
            <div key={d.id} className="w-full">
              <DepartmentColumn title={d.name} dept={d}
                employees={empByDept.get(d.id) || []}
                onDropEmployee={isAdmin ? onDropEmployee : null} onSetStatus={isAdmin ? onSetStatus : null} onEditRadio={isAdmin ? onEditRadio : null} 
                onDeleteEmployee={isAdmin ? onDeleteEmployee : null} onDeleteDepartment={isAdmin ? onDeleteDepartment : null}
                onUpdateCapacity={isAdmin ? onUpdateCapacity : null} onToggleAutoAssign={isAdmin ? onToggleAutoAssign : null} isAdmin={isAdmin} />
            </div>
          ))}
        </div>
      </section>

      {/* DESKTOP/TABLET: Grid Layout */}
      <section className="hidden lg:grid lg:grid-cols-[320px_1fr] gap-2 flex-1 min-h-0">
        <div className="flex flex-col gap-2">
          <DepartmentColumn title="Mitarbeiter" dept={null}
            employees={empByDept.get('employees') || []}
            onDropEmployee={isAdmin ? onDropEmployee : null} onSetStatus={isAdmin ? onSetStatus : null} onEditRadio={isAdmin ? onEditRadio : null} 
            onDeleteEmployee={isAdmin ? onDeleteEmployee : null} onDeleteDepartment={isAdmin ? onDeleteDepartment : null} 
            onUpdateCapacity={isAdmin ? onUpdateCapacity : null} onToggleAutoAssign={isAdmin ? onToggleAutoAssign : null} isEmployeeList={true} isAdmin={isAdmin} />
          
          <DepartmentColumn title="Pause" dept={{ id: null }}
            employees={empByDept.get('break') || []}
            onDropEmployee={isAdmin ? onDropEmployee : null} onSetStatus={isAdmin ? onSetStatus : null} onEditRadio={isAdmin ? onEditRadio : null} 
            onDeleteEmployee={isAdmin ? onDeleteEmployee : null} onDeleteDepartment={isAdmin ? onDeleteDepartment : null} 
            onUpdateCapacity={isAdmin ? onUpdateCapacity : null} onToggleAutoAssign={isAdmin ? onToggleAutoAssign : null} isAdmin={isAdmin} />
        </div>
        
        <div className="grid gap-2 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {departments.map(d=> (
            <DepartmentColumn key={d.id} title={d.name} dept={d}
              employees={empByDept.get(d.id) || []}
              onDropEmployee={isAdmin ? onDropEmployee : null} onSetStatus={isAdmin ? onSetStatus : null} onEditRadio={isAdmin ? onEditRadio : null} 
              onDeleteEmployee={isAdmin ? onDeleteEmployee : null} onDeleteDepartment={isAdmin ? onDeleteDepartment : null}
              onUpdateCapacity={isAdmin ? onUpdateCapacity : null} onToggleAutoAssign={isAdmin ? onToggleAutoAssign : null} isAdmin={isAdmin} />
          ))}
        </div>
      </section>
    </div>
  );
}