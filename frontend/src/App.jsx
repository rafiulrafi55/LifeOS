import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <main className="loading-screen"><span className="loader" />Restoring your workspace...</main>;
  }

  return session ? <Dashboard session={session} /> : <AuthScreen />;
}

export default App;

