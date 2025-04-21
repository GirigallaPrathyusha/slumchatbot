// frontend/src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { useState, useEffect } from 'react';
import ChatPage from './components/ChatPage';
import RegisterPage from './components/RegisterPage';
import AuthPage from './components/AuthPage';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.confirmation_sent_at && !session.user.email_confirmed_at) {
        alert('Please verify your email address. Check your inbox.');
      }
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="app-loading">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={session ? <ChatPage /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={!session ? <AuthPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;