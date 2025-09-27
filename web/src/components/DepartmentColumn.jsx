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
         className={`bg-white/70 dark:bg-neutral-800/40 backdrop-blur border border-black/5 dark:border-white/10 rounded-2xl hover:border-black/10 dark:hover:border-white/20 transition flex flex-col ${
           // Mobile: Viel größere Container für bessere Lesbarkeit
           isEmployeeList ? 'p-4 min-h-[300px] lg:p-2 lg:min-h-[180px]' : 
           employees.length > 3 ? 'p-4 min-h-[280px] lg:p-2 lg:min-h-[120px] lg:md:min-h-[200px] lg:md:max-h-[75vh]' : 
           'p-4 min-h-[250px] lg:p-2 lg:min-h-[120px] lg:md:min-h-[200px]'
         }`}>
      <div className="flex-shrink-0 mb-3 lg:mb-1.5">
        <div className="flex items-center justify-between mb-2 lg:mb-1">
          {/* Mobile: Größere Überschriften */}
          <h3 className="text-lg font-bold dark:text-white truncate min-w-0 flex-1 lg:text-sm lg:sm:text-base">{title}</h3>
          {!dept?.id && !isEmployeeList && <span className="text-sm px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 dark:text-white ml-2 lg:text-[10px] lg:px-2 lg:py-0.5">{employees.length}</span>}
          {isAdmin && dept && dept.id && (
            <button 
              className="text-sm px-3 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition ml-2 lg:text-[10px] lg:px-1.5 lg:py-0.5"
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
        <div className="flex items-center gap-2 flex-wrap lg:gap-1">
          {dept && dept.id && (
            <div className="flex items-center gap-2 lg:gap-1">
              {/* Mobile: Größere Statusanzeigen */}
              <span className={`text-sm px-3 py-1 rounded-full lg:text-[10px] lg:px-2 lg:py-0.5 ${
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
                  className="w-16 text-sm px-2 py-1 rounded border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 dark:text-white text-center lg:w-10 lg:text-[10px] lg:px-1 lg:py-0.5"
                  title="Max. Kapazität"
                />
              )}
              {!isAdmin && (
                <span className="text-sm px-2 py-1 text-gray-600 dark:text-gray-400 w-16 text-center lg:text-[10px] lg:px-1 lg:py-0.5 lg:w-10" title="Nur lesend">
                  {dept.capacity}
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={() => onToggleAutoAssign && onToggleAutoAssign(dept.id, !dept.auto_assign)}
                  className={`text-sm px-3 py-1 rounded transition font-bold w-8 h-8 flex items-center justify-center lg:text-[10px] lg:px-1.5 lg:py-0.5 lg:w-6 lg:h-6 ${
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
                <span className={`text-sm px-3 py-1 rounded font-bold w-8 h-8 flex items-center justify-center lg:text-[10px] lg:px-1.5 lg:py-0.5 lg:w-6 lg:h-6 ${
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
      
      <div className={employees.length > 3 ? "flex-1 lg:md:overflow-y-auto lg:md:min-h-0" : "flex-1"}>
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