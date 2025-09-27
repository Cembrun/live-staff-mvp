import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api, setToken, getToken, clearToken } from './api';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App(){
  const [authed, setAuthed] = useState(!!getToken());
  const [socket, setSocket] = useState(null);
  const [state, setState] = useState({ employees:[], departments:[], assignments:[] });
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(true);

  useEffect(()=>{
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(()=>{
    if (!authed) return;
    const s = io(api.API_URL, { auth: { token: getToken() } });
    s.on('state', (snap)=> setState(snap));
    setSocket(s);
    
    // Lade User-Info und State
    Promise.all([api.me(), api.state()])
      .then(([userData, stateData]) => {
        setUser(userData);
        setState(stateData);
      })
      .catch(()=>{
        setAuthed(false); clearToken();
      });
    
    return ()=> s.close();
  }, [authed]);

  if (!authed) return <Login onLogin={(tok)=>{ setToken(tok); setAuthed(true); }} />;

  return (
    <div className="min-h-screen dark:bg-neutral-900">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 dark:bg-neutral-900/70 border-b border-black/5 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-black dark:bg-white"></div>
            <h1 className="text-lg font-semibold dark:text-white">Live Einsatzübersicht</h1>
            <span className="text-xs px-2 py-1 rounded-full bg-black/5 dark:bg-white/10 dark:text-white">Realtime</span>
            {user && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                user.role === 'admin' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {user.username} ({user.role === 'admin' ? 'Admin' : 'Viewer'})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="text-sm px-3 py-1.5 rounded-xl border dark:border-white/20 dark:text-white" onClick={()=> setDark(d=>!d)}>
              {dark ? 'Light' : 'Dark'}
            </button>
            <button className="text-sm px-3 py-1.5 rounded-xl border dark:border-white/20 dark:text-white" onClick={()=>{ clearToken(); setAuthed(false); }}>Logout</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Dashboard state={state} api={api} user={user} />
      </main>
    </div>
  );
}