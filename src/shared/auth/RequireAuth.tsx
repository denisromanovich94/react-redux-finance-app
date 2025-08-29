import { useEffect, useState } from 'react';
import { Center, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';
import type { ReactNode } from 'react';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      if (!data.user) {
        navigate('/auth', { replace: true });
      } else {
        setChecking(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate('/auth', { replace: true });
      } else {
        setChecking(false);
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
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
