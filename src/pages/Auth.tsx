import { useState } from 'react';
import { Card, Title, Anchor, Divider, Stack, Text, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../shared/ui/PageContainer';
import { SignIn } from '../shared/auth/SignIn';
import { Register } from '../shared/auth/Register';
import { TelegramSignIn } from '../shared/auth/TelegramSignIn';
import { TelegramLoginWidget } from '../shared/auth/TelegramLoginWidget';
import { useTelegram } from '../shared/telegram/useTelegram';
import { signInWithTelegram } from '../shared/api/telegram';

const TELEGRAM_BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || '';

export function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { isTelegramApp } = useTelegram();
  const navigate = useNavigate();

  const handleTelegramAuth = async (user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
  }) => {
    try {
      const telegramUser = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo_url: user.photo_url,
      };


      const { isNewUser } = await signInWithTelegram(telegramUser);

      if (isNewUser) {
        notifications.show({
          color: 'teal',
          message: 'Добро пожаловать! Ваш аккаунт создан через Telegram',
        });
      } else {
        notifications.show({
          color: 'teal',
          message: 'Вход выполнен через Telegram',
        });
      }

      navigate('/', { replace: true });
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Ошибка при входе через Telegram',
      });
    }
  };

  return (
    <PageContainer maxWidth={420}>
      <Card radius="lg" p="lg" withBorder mt="xl">
        <Title order={3} mb="md">{mode === 'signin' ? 'Вход' : 'Регистрация'}</Title>

        {mode === 'signin' && (
          <>
            {isTelegramApp ? (
              <>
                <TelegramSignIn />
                <Divider my="md" />
              </>
            ) : TELEGRAM_BOT_NAME ? (
              <>
                <Stack gap="sm" mb="md">
                  <Text size="sm" ta="center" c="dimmed">
                    Войдите через Telegram
                  </Text>
                  <Center>
                    <TelegramLoginWidget
                      botName={TELEGRAM_BOT_NAME}
                      onAuth={handleTelegramAuth}
                      buttonSize="large"
                    />
                  </Center>
                </Stack>
                <Divider label="или" labelPosition="center" my="md" />
              </>
            ) : null}
          </>
        )}

        {mode === 'signin' ? <SignIn /> : <Register />}

        <Anchor
          component="button"
          type="button"
          mt="md"
          onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
        >
          {mode === 'signin' ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
        </Anchor>
      </Card>
    </PageContainer>
  );
}
