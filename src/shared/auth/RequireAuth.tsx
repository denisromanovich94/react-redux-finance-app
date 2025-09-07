import { useEffect, useState } from 'react';
import { Center, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';
import type { ReactNode } from 'react';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
  const sessionStr = localStorage.getItem('finance-session');
  if (sessionStr) {
    const session = JSON.parse(sessionStr);
    if (session?.user) {
      setChecking(false);
      return;
    }
  }

    supabase.auth.getUser().then(({ data }) => {
    if (!data.user) {
      navigate('/auth', { replace: true });
    } else {
      setChecking(false);
      localStorage.setItem('finance-session', JSON.stringify(data));
    }
  });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      navigate('/auth', { replace: true });
      localStorage.removeItem('finance-session');
    } else {
      setChecking(false);
      localStorage.setItem('finance-session', JSON.stringify(session));
    }
  });

    return () => sub.subscription.unsubscribe();
}, [navigate]);

  if (checking) {
    return (
      <Center mih={200}>
        <Loader />
      </Center>
    );
  }

  return children;
}
