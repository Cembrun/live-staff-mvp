import React from 'react';

function initials(name){
  return name.split(' ').map(s=>s[0]?.toUpperCase()).slice(0,2).join('');
}

export default function EmployeeCard({ emp, onDragStart, onSetStatus, onEditRadio, onDelete, isAssigned, isAdmin }){
  return (
    <div
      draggable
      onDragStart={(e)=> onDragStart(e, emp)}
      className={`group bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/10 rounded-lg mb-2 cursor-grab active:cursor-grabbing shadow-soft transition ${
        isAssigned ? 'opacity-50 bg-gray-100 dark:bg-neutral-700' : ''
      } touch-manipulation p-3 lg:p-1.5 lg:mb-1`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1 lg:gap-1">
          {/* Mobile: Größere Avatar */}
          <div className={`w-8 h-8 rounded-md grid place-items-center text-sm flex-shrink-0 lg:w-5 lg:h-5 lg:sm:w-6 lg:sm:h-6 lg:text-[9px] lg:sm:text-[10px] ${
            isAssigned ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400' : 'bg-black/10 dark:bg-white/10 dark:text-white'
          }`}>{initials(emp.name)}</div>
          {/* Mobile: Größere Schrift für Namen */}
          <div className={`text-base font-medium truncate lg:text-xs lg:sm:text-sm ${isAssigned ? 'text-gray-500 dark:text-gray-400' : 'dark:text-white'}`}>{emp.name}</div>
        </div>
        {/* Mobile: Größerer Status Badge */}
        <span className={"text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 lg:text-[8px] lg:sm:text-[9px] lg:px-1 lg:py-0.5 lg:ml-1 "+(emp.status==='break'?'bg-yellow-100 text-yellow-900':'bg-emerald-100 text-emerald-900')}>{emp.status}</span>
      </div>
      {/* Mobile: Größere Radio-Eingabe */}
      <div className="text-sm text-gray-600 dark:text-white/70 mt-2 flex items-center gap-2 lg:text-[9px] lg:sm:text-[10px] lg:mt-1 lg:gap-1">
        <span>Funk:</span>
        {isAdmin ? (
          <input
            className="border border-black/10 dark:border-white/10 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-900 dark:text-white w-20 lg:px-1 lg:py-0.5 lg:text-[9px] lg:w-16"
            value={emp.radio || ''}
            onChange={(e)=> onEditRadio(emp, e.target.value)}
            onClick={(e)=> e.stopPropagation()}
          />
        ) : (
          <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-neutral-700 dark:text-white rounded border border-black/5 dark:border-white/10 w-20 lg:text-[9px] lg:px-1 lg:py-0.5 lg:w-16">
            {emp.radio || 'N/A'}
          </span>
        )}
      </div>
      {/* Mobile: Größere Buttons */}
      {isAdmin && (
        <div className="flex gap-2 mt-3 opacity-100 transition lg:gap-1 lg:mt-1 lg:opacity-0 lg:group-hover:opacity-100">
          <button className="text-sm border rounded px-3 py-1 dark:text-white dark:border-white/20 lg:text-[8px] lg:px-1 lg:py-0.5" onClick={(e)=>{e.stopPropagation(); onSetStatus(emp,'active');}}>Aktiv</button>
          <button className="text-sm border rounded px-3 py-1 dark:text-white dark:border-white/20 lg:text-[8px] lg:px-1 lg:py-0.5" onClick={(e)=>{e.stopPropagation(); onSetStatus(emp,'break');}}>Pause</button>
          <button className="text-sm border rounded px-3 py-1 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 lg:text-[8px] lg:px-1 lg:py-0.5" onClick={(e)=>{e.stopPropagation(); if(confirm(`Mitarbeiter "${emp.name}" wirklich löschen?`)) onDelete(emp.id);}}>×</button>
        </div>
      )}
    </div>
  );
}