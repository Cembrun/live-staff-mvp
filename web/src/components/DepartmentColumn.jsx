import React from 'react';
import EmployeeCard from './EmployeeCard';

export default function DepartmentColumn({ title, dept, employees, onDropEmployee, onDragStart, onSetStatus, onEditRadio, onDeleteEmployee, onDeleteDepartment, onUpdateCapacity, onToggleAutoAssign, isEmployeeList }){
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
           isEmployeeList ? 'min-h-[180px]' : 'min-h-[100px] max-h-[75vh] overflow-y-auto'
         }`}>
      <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
        <h3 className="text-sm font-semibold dark:text-white">{title}</h3>
        <div className="flex items-center gap-2">
          {dept && dept.id && (
            <div className="flex items-center gap-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                employees.length > dept.capacity 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                  : 'bg-black/5 dark:bg-white/10 dark:text-white'
              }`}>
                {employees.length}/{dept.capacity}
              </span>
              <input
                type="number"
                min="1"
                max="50"
                value={dept.capacity || 10}
                onChange={(e) => onUpdateCapacity && onUpdateCapacity(dept.id, parseInt(e.target.value) || 10)}
                className="w-12 text-[10px] px-1 py-0.5 rounded border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 dark:text-white"
                title="Max. Kapazität"
              />
              <button
                onClick={() => onToggleAutoAssign && onToggleAutoAssign(dept.id, !dept.auto_assign)}
                className={`text-[10px] px-2 py-0.5 rounded-full transition ${
                  dept.auto_assign !== false 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500'
                }`}
                title={dept.auto_assign !== false ? 'Auto-Verteilung EIN' : 'Auto-Verteilung AUS'}
              >
                {dept.auto_assign !== false ? 'AUTO' : 'MANUELL'}
              </button>
            </div>
          )}
          {!dept?.id && !isEmployeeList && <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 dark:text-white">{employees.length}</span>}
          {dept && dept.id && (
            <button 
              className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
              onClick={() => {
                if(confirm(`Bereich "${title}" wirklich löschen? Alle Mitarbeiter werden zu "Mitarbeiter" verschoben.`)) {
                  onDeleteDepartment(dept.id);
                }
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {employees.map(emp=> (
          <EmployeeCard key={emp.id} emp={emp}
            onDragStart={(e, emp)=>{ e.dataTransfer.setData('text/plain', JSON.stringify({ empId: emp.id })); onDragStart && onDragStart(e,emp); }}
            onSetStatus={onSetStatus} onEditRadio={onEditRadio} onDelete={onDeleteEmployee} 
            isAssigned={isEmployeeList && emp.isAssigned} />
        ))}
      </div>
    </div>
  );
}