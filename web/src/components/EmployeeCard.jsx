import React from 'react';

function initials(name){
  return name.split(' ').map(s=>s[0]?.toUpperCase()).slice(0,2).join('');
}

export default function EmployeeCard({ emp, onDragStart, onSetStatus, onEditRadio, onDelete, isAssigned, isAdmin }){
  return (
    <div
      draggable
      onDragStart={(e)=> onDragStart(e, emp)}
      className={`group bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/10 rounded-lg mb-4 cursor-grab active:cursor-grabbing shadow-soft transition ${
        isAssigned ? 'opacity-50 bg-gray-100 dark:bg-neutral-700' : ''
      } touch-manipulation p-4 md:p-1.5 md:mb-1`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1 md:gap-1">
          {/* Mobile: Noch größere Avatar für bessere Sichtbarkeit */}
          <div className={`w-12 h-12 rounded-md grid place-items-center text-lg font-bold flex-shrink-0 md:w-5 md:h-5 md:sm:w-6 md:sm:h-6 md:text-[9px] md:sm:text-[10px] ${
            isAssigned ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400' : 'bg-black/10 dark:bg-white/10 dark:text-white'
          }`}>{initials(emp.name)}</div>
          {/* Mobile: Sehr große, gut lesbare Schrift für Namen */}
          <div className={`text-lg font-bold truncate md:text-xs md:sm:text-sm md:font-medium ${isAssigned ? 'text-gray-500 dark:text-gray-400' : 'dark:text-white'}`}>{emp.name}</div>
        </div>
        {/* Mobile: Größerer Status Badge */}
        <span className={"text-sm px-3 py-2 rounded-full flex-shrink-0 ml-3 md:text-[8px] md:sm:text-[9px] md:px-1 md:py-0.5 md:ml-1 "+(emp.status==='break'?'bg-yellow-100 text-yellow-900':'bg-emerald-100 text-emerald-900')}>{emp.status}</span>
      </div>
      {/* Mobile: Größere Radio-Eingabe mit mehr Platz */}
      <div className="text-lg text-gray-600 dark:text-white/70 mt-3 flex items-center gap-3 md:text-[9px] md:sm:text-[10px] md:mt-1 md:gap-1">
        <span className="font-medium">Funk:</span>
        {isAdmin ? (
          <input
            className="border border-black/10 dark:border-white/10 rounded px-3 py-2 text-lg bg-white dark:bg-neutral-900 dark:text-white w-24 md:px-1 md:py-0.5 md:text-[9px] md:w-16"
            value={emp.radio || ''}
            onChange={(e)=> onEditRadio(emp, e.target.value)}
            onClick={(e)=> e.stopPropagation()}
          />
        ) : (
          <span className="text-lg px-3 py-2 bg-gray-100 dark:bg-neutral-700 dark:text-white rounded border border-black/5 dark:border-white/10 w-24 md:text-[9px] md:px-1 md:py-0.5 md:w-16">
            {emp.radio || 'N/A'}
          </span>
        )}
      </div>
      {/* Mobile: Große, gut sichtbare Buttons */}
      {isAdmin && (
        <div className="flex gap-3 mt-4 transition md:gap-1 md:mt-1 md:opacity-0 md:group-hover:opacity-100">
          <button className="text-base border rounded px-4 py-2 dark:text-white dark:border-white/20 bg-green-50 hover:bg-green-100 md:text-[8px] md:px-1 md:py-0.5" onClick={(e)=>{e.stopPropagation(); onSetStatus(emp,'active');}}>Aktiv</button>
          <button className="text-base border rounded px-4 py-2 dark:text-white dark:border-white/20 bg-yellow-50 hover:bg-yellow-100 md:text-[8px] md:px-1 md:py-0.5" onClick={(e)=>{e.stopPropagation(); onSetStatus(emp,'break');}}>Pause</button>
          <button className="text-base border rounded px-4 py-2 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800 bg-red-50 hover:bg-red-100 dark:hover:bg-red-900/20 md:text-[8px] md:px-1 md:py-0.5" onClick={(e)=>{e.stopPropagation(); if(confirm(`Mitarbeiter "${emp.name}" wirklich löschen?`)) onDelete(emp.id);}}>×</button>
        </div>
      )}
    </div>
  );
}