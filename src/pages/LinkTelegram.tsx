import { useState, useEffect } from 'react';
import { Card, Title, Text, Button, Stack, Alert, Group, Badge, Center, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBrandTelegram, IconCheck, IconAlertCircle, IconUnlink } from '@tabler/icons-react';
import PageContainer from '../shared/ui/PageContainer';
import { useTelegram } from '../shared/telegram/useTelegram';
import { TelegramLoginWidget } from '../shared/auth/TelegramLoginWidget';
import { linkTelegramAccount, unlinkTelegramAccount, getTelegramLink } from '../shared/api/telegram';

const TELEGRAM_BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || '';

interface TelegramLinkInfo {
  telegram_id: number;
  telegram_username?: string;
  telegram_first_name: string;
  telegram_last_name?: string;
  linked_at: string;
}

export function LinkTelegram() {
  const { isTelegramApp, user: telegramUser } = useTelegram();
  const [loading, setLoading] = useState(false);
  const [linkedInfo, setLinkedInfo] = useState<TelegramLinkInfo | null>(null);
  const [checkingLink, setCheckingLink] = useState(true);

  useEffect(() => {
    checkExistingLink();
  }, []);

  const checkExistingLink = async () => {
    try {
      setCheckingLink(true);
      const link = await getTelegramLink();
      setLinkedInfo(link);
    } catch (error) {
      console.error('Ошибка при проверке связи:', error);
    } finally {
      setCheckingLink(false);
    }
  };

  const handleLink = async () => {
    if (!telegramUser) {
      notifications.show({
        color: 'red',
        message: 'Не удалось получить данные Telegram пользователя',
      });
      return;
    }

    try {
      setLoading(true);
      await linkTelegramAccount({
        telegram_id: telegramUser.id,
        telegram_username: telegramUser.username,
        telegram_first_name: telegramUser.first_name,
        telegram_last_name: telegramUser.last_name,
      });

      notifications.show({
        color: 'teal',
        message: 'Telegram аккаунт успешно привязан!',
        icon: <IconCheck size={16} />,
      });

      await checkExistingLink();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Ошибка при привязке аккаунта',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramWidgetAuth = async (user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  }) => {
    try {
      setLoading(true);
      await linkTelegramAccount({
        telegram_id: user.id,
        telegram_username: user.username,
        telegram_first_name: user.first_name,
        telegram_last_name: user.last_name,
      });

      notifications.show({
        color: 'teal',
        message: 'Telegram аккаунт успешно привязан!',
        icon: <IconCheck size={16} />,
      });

      await checkExistingLink();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Ошибка при привязке аккаунта',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    try {
      setLoading(true);
      await unlinkTelegramAccount();

      notifications.show({
        color: 'blue',
        message: 'Telegram аккаунт отвязан',
      });

      setLinkedInfo(null);
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Ошибка при отвязке аккаунта',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingLink) {
    return (
      <PageContainer maxWidth={600}>
        <Card radius="lg" p="lg" withBorder mt="xl">
          <Text>Загрузка...</Text>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth={600}>
      <Card radius="lg" p="lg" withBorder mt="xl">
        <Group mb="md">
          <IconBrandTelegram size={32} color="#0088cc" />
          <Title order={3}>Связь с Telegram</Title>
        </Group>

        {!isTelegramApp && (
          <Alert color="yellow" mb="md" icon={<IconAlertCircle size={16} />}>
            Вы открыли приложение не через Telegram. Для привязки аккаунта откройте приложение в
            Telegram Mini App.
          </Alert>
        )}

        {linkedInfo ? (
          <Stack>
            <Alert color="teal" icon={<IconCheck size={16} />}>
              Ваш аккаунт привязан к Telegram
            </Alert>

            <Card withBorder>
              <Stack gap="xs">
                <Group>
                  <Text fw={500}>Telegram ID:</Text>
                  <Badge>{linkedInfo.telegram_id}</Badge>
                </Group>

                {linkedInfo.telegram_username && (
                  <Group>
                    <Text fw={500}>Username:</Text>
                    <Text>@{linkedInfo.telegram_username}</Text>
                  </Group>
                )}

                <Group>
                  <Text fw={500}>Имя:</Text>
                  <Text>
                    {linkedInfo.telegram_first_name}{' '}
                    {linkedInfo.telegram_last_name || ''}
                  </Text>
                </Group>

                <Group>
                  <Text fw={500}>Связан:</Text>
                  <Text size="sm" c="dimmed">
                    {new Date(linkedInfo.linked_at).toLocaleString('ru-RU')}
                  </Text>
                </Group>
              </Stack>
            </Card>

            <Text size="sm" c="dimmed">
              Теперь вы можете входить в приложение через Telegram, и все ваши данные будут
              синхронизированы.
            </Text>

            <Button
              color="red"
              variant="light"
              leftSection={<IconUnlink size={16} />}
              onClick={handleUnlink}
              loading={loading}
            >
              Отвязать Telegram
            </Button>
          </Stack>
        ) : (
          <Stack>
            {isTelegramApp && telegramUser ? (
              <>
                <Alert color="blue" icon={<IconAlertCircle size={16} />}>
                  Привяжите ваш Telegram аккаунт к текущему email аккаунту для удобного входа
                </Alert>

                <Card withBorder>
                  <Stack gap="xs">
                    <Text fw={500}>Будет привязан Telegram аккаунт:</Text>
                    <Group>
                      <Text size="sm" c="dimmed">
                        ID:
                      </Text>
                      <Badge>{telegramUser.id}</Badge>
                    </Group>
                    {telegramUser.username && (
                      <Group>
                        <Text size="sm" c="dimmed">
                          Username:
                        </Text>
                        <Text size="sm">@{telegramUser.username}</Text>
                      </Group>
                    )}
                    <Group>
                      <Text size="sm" c="dimmed">
                        Имя:
                      </Text>
                      <Text size="sm">
                        {telegramUser.first_name} {telegramUser.last_name || ''}
                      </Text>
                    </Group>
                  </Stack>
                </Card>

                <Button
                  leftSection={<IconBrandTelegram size={16} />}
                  onClick={handleLink}
                  loading={loading}
                >
                  Привязать Telegram аккаунт
                </Button>
              </>
            ) : TELEGRAM_BOT_NAME ? (
              <>
                <Alert color="blue" icon={<IconAlertCircle size={16} />}>
                  Привяжите ваш Telegram аккаунт к текущему email аккаунту для удобного входа
                </Alert>

                <Text size="sm" ta="center" c="dimmed" mb="sm">
                  Нажмите кнопку ниже для привязки через Telegram
                </Text>

                <Center>
                  <TelegramLoginWidget
                    botName={TELEGRAM_BOT_NAME}
                    onAuth={handleTelegramWidgetAuth}
                    buttonSize="large"
                  />
                </Center>

                <Divider my="md" />

                <Text size="sm" c="dimmed">
                  После привязки вы сможете входить в приложение через Telegram как в браузере, так и в Telegram Mini App
                </Text>
              </>
            ) : (
              <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
                <Text size="sm">
                  Для привязки Telegram аккаунта необходимо:
                </Text>
                <Text size="sm" mt="xs">
                  1. Открыть приложение в Telegram Mini App
                </Text>
                <Text size="sm">
                  2. Или настроить VITE_TELEGRAM_BOT_NAME в переменных окружения для использования Telegram Login Widget
                </Text>
              </Alert>
            )}
          </Stack>
        )}
      </Card>
    </PageContainer>
  );
}
