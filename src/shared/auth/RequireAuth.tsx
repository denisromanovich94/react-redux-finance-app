import { useEffect, useState } from 'react';
import { Center, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';
import type { ReactNode } from 'react';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Проверяем текущую сессию (Supabase сама читает из localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth', { replace: true });
      } else {
        setChecking(false);
      }
    });

    // Подписываемся на изменения авторизации
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth', { replace: true });
      } else {
        setChecking(false);
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
