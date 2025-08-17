// src/components/BackendStatusCard.tsx
import { useEffect, useState } from 'react';
import classes from './BackendStatusCard.module.css';

const API_BASE = process.env.REACT_APP_API_BASE;

export default function BackendStatusCard() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>(
    'checking'
  );

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(`${API_BASE?.replace(/\/$/, '')}/health`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.status === 'ok') {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      } catch {
        setStatus('offline');
      }
    }
    checkHealth();
  }, []);

  return (
    <div
      className={`${classes.card} ${
        status === 'online' ? classes.online : ''
      } ${status === 'offline' ? classes.offline : ''}`}
    >
      {status === 'checking' && <span>Checking backend...</span>}
      {status === 'online' && <span>Server Status: Online ✅</span>}
      {status === 'offline' && <span>Server Status: Offline ❌</span>}
    </div>
  );
}
