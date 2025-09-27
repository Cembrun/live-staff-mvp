import React from 'react';

function initials(name){
  return name.split(' ').map(s=>s[0]?.toUpperCase()).slice(0,2).join('');
}

export default function EmployeeCard({ emp, onDragStart, onSetStatus, onEditRadio, onDelete, isAssigned, isAdmin }){
  return (
    <div
      draggable
      onDragStart={(e)=> onDragStart(e, emp)}
      className={`group bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/10 rounded-lg p-1.5 mb-1 cursor-grab active:cursor-grabbing shadow-soft transition ${
        isAssigned ? 'opacity-50 bg-gray-100 dark:bg-neutral-700' : ''
      } touch-manipulation`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md grid place-items-center text-[9px] sm:text-[10px] flex-shrink-0 ${
            isAssigned ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400' : 'bg-black/10 dark:bg-white/10 dark:text-white'
          }`}>{initials(emp.name)}</div>
          <div className={`text-xs sm:text-sm font-medium truncate ${isAssigned ? 'text-gray-500 dark:text-gray-400' : 'dark:text-white'}`}>{emp.name}</div>
        </div>
        <span className={"text-[8px] sm:text-[9px] px-1 py-0.5 rounded-full flex-shrink-0 ml-1 "+(emp.status==='break'?'bg-yellow-100 text-yellow-900':'bg-emerald-100 text-emerald-900')}>{emp.status}</span>
      </div>
      <div className="text-[9px] sm:text-[10px] text-gray-600 dark:text-white/70 mt-1 flex items-center gap-1">
        <span>Funk:</span>
        {isAdmin ? (
          <input
            className="border border-black/10 dark:border-white/10 rounded px-1 py-0.5 text-[9px] bg-white dark:bg-neutral-900 dark:text-white w-16"
            value={emp.radio || ''}
            onChange={(e)=> onEditRadio(emp, e.target.value)}
            onClick={(e)=> e.stopPropagation()}
          />
        ) : (
          <span className="text-[9px] px-1 py-0.5 bg-gray-100 dark:bg-neutral-700 dark:text-white rounded border border-black/5 dark:border-white/10 w-16">
            {emp.radio || 'N/A'}
          </span>
        )}
      </div>
      {isAdmin && (
        <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition">
          <button className="text-[8px] border rounded px-1 py-0.5 dark:text-white dark:border-white/20" onClick={(e)=>{e.stopPropagation(); onSetStatus(emp,'active');}}>Aktiv</button>
          <button className="text-[8px] border rounded px-1 py-0.5 dark:text-white dark:border-white/20" onClick={(e)=>{e.stopPropagation(); onSetStatus(emp,'break');}}>Pause</button>
          <button className="text-[8px] border rounded px-1 py-0.5 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={(e)=>{e.stopPropagation(); if(confirm(`Mitarbeiter "${emp.name}" wirklich löschen?`)) onDelete(emp.id);}}>×</button>
        </div>
      )}
    </div>
  );
}