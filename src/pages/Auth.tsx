import { useState } from 'react';
import { Card, Title, Anchor, Divider, Center, Text, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../shared/ui/PageContainer';
import { SignIn } from '../shared/auth/SignIn';
import { Register } from '../shared/auth/Register';
import { TelegramLoginButton } from '../shared/auth/TelegramLoginButton';
import { loginWithTelegram } from '../shared/api/telegramAuth';
import type { TelegramAuthData } from '../features/profile/types';

export function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [telegramLoading, setTelegramLoading] = useState(false);
  const navigate = useNavigate();

  const handleTelegramAuth = async (data: TelegramAuthData) => {
    try {
      setTelegramLoading(true);
      const result = await loginWithTelegram(data);

      if (result.success) {
        notifications.show({
          color: 'teal',
          message: result.isNewUser
            ? 'Аккаунт создан! Добро пожаловать!'
            : 'Вход выполнен',
        });
        navigate('/', { replace: true });
      } else {
        notifications.show({
          color: 'red',
          message: result.error || 'Ошибка входа через Telegram',
        });
      }
    } catch (err) {
      console.error('Telegram auth error:', err);
      notifications.show({
        color: 'red',
        message: 'Ошибка входа через Telegram',
      });
    } finally {
      setTelegramLoading(false);
    }
  };

  return (
    <PageContainer maxWidth={420}>
      <Card radius="lg" p="lg" withBorder mt="xl">
        <Title order={3} mb="md">{mode === 'signin' ? 'Вход' : 'Регистрация'}</Title>

        {mode === 'signin' ? <SignIn /> : <Register />}

        <Anchor
          component="button"
          type="button"
          mt="md"
          onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
        >
          {mode === 'signin' ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
        </Anchor>

        <Divider my="lg" label="или" labelPosition="center" />

        <Center>
          {telegramLoading ? (
            <div>
              <Loader size="sm" />
              <Text size="sm" c="dimmed" mt="xs">Вход через Telegram...</Text>
            </div>
          ) : (
            <TelegramLoginButton onAuth={handleTelegramAuth} buttonSize="large" />
          )}
        </Center>
      </Card>
    </PageContainer>
  );
}
