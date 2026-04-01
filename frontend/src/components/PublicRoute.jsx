import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PublicRoute({ children }) {
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
    return null; // Silent loading for public routes
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return children;
}
