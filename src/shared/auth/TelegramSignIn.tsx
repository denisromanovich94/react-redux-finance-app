import { useState } from 'react';
import { Button, Stack, Text, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBrandTelegram, IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../telegram/useTelegram';
import { signInWithTelegram } from '../api/telegram';

export function TelegramSignIn() {
  const { isTelegramApp, user: telegramUser } = useTelegram();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTelegramSignIn = async () => {
    if (!telegramUser) {
      notifications.show({
        color: 'red',
        message: 'Не удалось получить данные Telegram пользователя',
      });
      return;
    }

    try {
      setLoading(true);
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
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isTelegramApp) {
    return null;
  }

  return (
    <Stack gap="sm">
      {telegramUser && (
        <Alert color="blue" icon={<IconBrandTelegram size={16} />}>
          Вы открыли приложение в Telegram как{' '}
          <strong>
            {telegramUser.first_name} {telegramUser.last_name || ''}
          </strong>
        </Alert>
      )}

      <Button
        leftSection={<IconBrandTelegram size={20} />}
        onClick={handleTelegramSignIn}
        loading={loading}
        variant="gradient"
        gradient={{ from: 'blue', to: 'cyan' }}
        size="md"
      >
        Войти через Telegram
      </Button>

      <Text size="sm" c="dimmed" ta="center">
        или используйте email для входа
      </Text>
    </Stack>
  );
}
