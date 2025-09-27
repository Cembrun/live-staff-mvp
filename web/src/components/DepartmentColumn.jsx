import React from 'react';
import EmployeeCard from './EmployeeCard';

export default function DepartmentColumn({ title, dept, employees, onDropEmployee, onDragStart, onSetStatus, onEditRadio, onDeleteEmployee, onDeleteDepartment, onUpdateCapacity, onToggleAutoAssign, isEmployeeList, isAdmin }){
  function onDragOver(e){ 
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  }
  function onDrop(e){
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    const payload = JSON.parse(data);
    
    onDropEmployee(payload.empId, dept?.id ?? null);
  }
  return (
    <div onDragOver={onDragOver} onDrop={onDrop}
         className={`bg-white/70 dark:bg-neutral-800/40 backdrop-blur border border-black/5 dark:border-white/10 rounded-2xl p-2 hover:border-black/10 dark:hover:border-white/20 transition flex flex-col ${
           isEmployeeList ? 'min-h-[180px]' : employees.length > 0 ? 'min-h-[100px] max-h-[75vh]' : 'min-h-[100px]'
         }`}>
      <div className="flex-shrink-0 mb-1.5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold dark:text-white truncate min-w-0 flex-1">{title}</h3>
          {!dept?.id && !isEmployeeList && <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 dark:text-white ml-2">{employees.length}</span>}
          {isAdmin && dept && dept.id && (
            <button 
              className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition ml-2"
              onClick={() => {
                if(confirm(`Bereich "${title}" wirklich löschen? Alle Mitarbeiter werden zu "Mitarbeiter" verschoben.`)) {
                  onDeleteDepartment && onDeleteDepartment(dept.id);
                }
              }}
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {dept && dept.id && (
            <div className="flex items-center gap-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                employees.length > dept.capacity 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                  : 'bg-black/5 dark:bg-white/10 dark:text-white'
              }`}>
                {employees.length}/{dept.capacity}
              </span>
              {isAdmin && (
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={dept.capacity || 10}
                  onChange={(e) => onUpdateCapacity && onUpdateCapacity(dept.id, parseInt(e.target.value) || 10)}
                  className="w-10 text-[10px] px-1 py-0.5 rounded border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 dark:text-white text-center"
                  title="Max. Kapazität"
                />
              )}
              {!isAdmin && (
                <span className="text-[10px] px-1 py-0.5 text-gray-600 dark:text-gray-400 w-10 text-center" title="Nur lesend">
                  {dept.capacity}
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={() => onToggleAutoAssign && onToggleAutoAssign(dept.id, !dept.auto_assign)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition font-bold w-6 h-6 flex items-center justify-center ${
                    dept.auto_assign === 1 || dept.auto_assign === true
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-400 dark:border-green-500' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-400 dark:border-red-500'
                  }`}
                  title={dept.auto_assign === 1 || dept.auto_assign === true ? 'Auto-Verteilung AKTIV - Klicken zum Sperren' : 'MANUELL GESPERRT - Mitarbeiter bleiben bei Fair-Verteilung'}
                >
                  {dept.auto_assign === 1 || dept.auto_assign === true ? 'A' : 'M'}
                </button>
              )}
              {!isAdmin && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold w-6 h-6 flex items-center justify-center ${
                  dept.auto_assign === 1 || dept.auto_assign === true
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-400 dark:border-green-500'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-400 dark:border-red-500'
                }`} title="Nur lesend">
                  {dept.auto_assign === 1 || dept.auto_assign === true ? 'A' : 'M'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className={employees.length > 0 ? "flex-1 overflow-y-auto min-h-0" : "flex-shrink-0"}>
        {employees.map(emp=> (
          <EmployeeCard key={emp.id} emp={emp}
            onDragStart={(e, emp)=>{ e.dataTransfer.setData('text/plain', JSON.stringify({ empId: emp.id })); onDragStart && onDragStart(e,emp); }}
            onSetStatus={onSetStatus} onEditRadio={onEditRadio} onDelete={onDeleteEmployee} 
            isAssigned={isEmployeeList && emp.isAssigned} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
}