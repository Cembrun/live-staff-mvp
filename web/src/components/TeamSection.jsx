import React, { useState } from 'react';

export default function TeamSection({ teams = [], employees = [], api }) {
  const [newTeamName, setNewTeamName] = useState('');

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      await api.createTeam(newTeamName.trim());
      setNewTeamName('');
    } catch (error) {
      console.error('Fehler beim Erstellen des Teams:', error);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold dark:text-white">👥 Teams</h2>
        <div className="flex gap-2">
          <input 
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            placeholder="Neues Team..."
            className="text-xs px-2 py-1 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
            onKeyPress={e => e.key === 'Enter' && handleCreateTeam()}
          />
          <button 
            onClick={handleCreateTeam}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            ✚
          </button>
        </div>
      </div>

      <div className="text-sm dark:text-white">
        {teams.length > 0 ? (
          teams.map(team => (
            <div key={team.id} className="p-2 bg-white dark:bg-gray-700 rounded-lg mb-2">
              🏷️ {team.name}
            </div>
          ))
        ) : (
          <p>Noch keine Teams erstellt</p>
        )}
      </div>
    </div>
  );
}
