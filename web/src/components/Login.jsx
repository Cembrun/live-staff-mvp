import React, { useState } from 'react';
import { api } from '../api';

export default function Login({ onLogin }){
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');

  async function submit(e){
    e.preventDefault();
    setErr('');
    try {
      const r = await api.login(username, password);
      if (r.token) onLogin(r.token);
      else setErr('Login fehlgeschlagen');
    } catch(e){ setErr(e.error || 'Fehler'); }
  }

  return (
    <div className="min-h-screen grid place-items-center dark:bg-neutral-900">
      <form onSubmit={submit} className="w-full max-w-sm bg-white/70 dark:bg-neutral-800/60 backdrop-blur p-6 rounded-2xl shadow-soft space-y-4 border border-black/5 dark:border-white/10">
        <h1 className="text-2xl font-semibold text-center dark:text-white">Anmelden</h1>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <div>
          <label className="text-sm block mb-1 dark:text-white/80">Benutzername</label>
          <input className="w-full border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 dark:text-white" value={username} onChange={e=>setU(e.target.value)} />
        </div>
        <div>
          <label className="text-sm block mb-1 dark:text-white/80">Passwort</label>
          <input type="password" className="w-full border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 dark:text-white" value={password} onChange={e=>setP(e.target.value)} />
        </div>
        <button className="w-full bg-black text-white py-2 rounded-xl hover:opacity-90">Login</button>
      </form>
    </div>
  );
}