import { useEffect } from 'react';
import { Center, Loader, Text, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useAppSelector } from '../../hooks';

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const profile = useAppSelector((s) => s.profile.profile);
  const profileLoading = useAppSelector((s) => s.profile.loading);

  const isLoading = authLoading || profileLoading;
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    // Если нет пользователя - редирект на авторизацию
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
      return;
    }

    // Если профиль загружен и пользователь не админ - редирект на главную
    if (!profileLoading && profile && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [authLoading, profileLoading, user, profile, isAdmin, navigate]);

  if (isLoading) {
    return (
      <Center mih={200}>
        <Loader />
      </Center>
    );
  }

  if (!user) {
    return (
      <Center mih={200}>
        <Loader />
      </Center>
    );
  }

  if (!isAdmin) {
    return (
      <Center mih={200}>
        <Stack align="center">
          <Text c="dimmed">Доступ запрещён</Text>
        </Stack>
      </Center>
    );
  }

  return children;
}
