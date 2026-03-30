import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PrivateRoute({ children }) {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sesh) => {
      setSession(sesh);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading while checking connection
  if (session === undefined) {
    return <div className="container" style={{textAlign: 'center', marginTop: '4rem'}}>Autenticando na LuvitCorp...</div>;
  }

  // Se não tem sessão, expulsa pra /login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
