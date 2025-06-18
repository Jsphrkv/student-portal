import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {supabase} from '../lib/supabase'

// Example: call a simple Supabase function on launch
async function checkSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  console.log('Current session:', session);
  if (error) console.error('Supabase session error:', error.message);
}

checkSession();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
