import { useEffect } from 'react';
import { Center, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Если завершили проверку авторизации и пользователя нет - редирект на страницу входа
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <Center mih={200}>
        <Loader />
      </Center>
    );
  }

  // Если нет пользователя, показываем загрузчик (редирект произойдет в useEffect)
  if (!user) {
    return (
      <Center mih={200}>
        <Loader />
      </Center>
    );
  }

  return children;
}
