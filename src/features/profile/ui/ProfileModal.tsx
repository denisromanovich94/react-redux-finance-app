import { Modal, TextInput, Button, Stack, Group, LoadingOverlay, Select, Divider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { fetchProfile, updateProfile, createProfile } from '../profileSlice';
import { getUserId, getUserEmail } from '../../../shared/api/auth';
import type { ThemeColor } from '../types';

interface ProfileModalProps {
  opened: boolean;
  onClose: () => void;
}

export function ProfileModal({ opened, onClose }: ProfileModalProps) {
  const dispatch = useAppDispatch();
  const { profile, loading } = useAppSelector((state) => state.profile);
  const [isEditing, setIsEditing] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const form = useForm({
    initialValues: {
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      telegram: '',
      position: '',
      theme_color: 'blue' as ThemeColor,
    },
  });

  // Загрузить профиль и email при открытии модалки
  useEffect(() => {
    if (opened) {
      const loadProfileAndEmail = async () => {
        const userId = await getUserId();
        const email = await getUserEmail();

        if (email) {
          setUserEmail(email);
          form.setFieldValue('email', email);
        }

        if (userId && email) {
          try {
            await dispatch(fetchProfile(userId)).unwrap();
          } catch {
            // Если профиль не найден, пытаемся создать его
            console.log('Profile not found, attempting to create new one');
            try {
              await dispatch(createProfile({ userId, email })).unwrap();
            } catch (createError) {
              // Игнорируем ошибки создания профиля (может уже существовать)
              console.error('Error creating profile:', createError);
            }
          }
        }
      };
      loadProfileAndEmail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, dispatch]);

  // Заполнить форму данными профиля
  const updateFormValues = useCallback(() => {
    if (profile) {
      form.setValues({
        email: userEmail || profile.email || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        telegram: profile.telegram || '',
        position: profile.position || '',
        theme_color: profile.theme_color || 'blue',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, userEmail]);

  useEffect(() => {
    updateFormValues();
  }, [updateFormValues]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        notifications.show({
          color: 'red',
          message: 'Ошибка: пользователь не авторизован',
        });
        return;
      }

      await dispatch(
        updateProfile({
          userId,
          updates: {
            first_name: values.first_name,
            last_name: values.last_name,
            phone: values.phone,
            telegram: values.telegram,
            position: values.position,
            theme_color: values.theme_color,
          },
        })
      ).unwrap();

      notifications.show({
        color: 'teal',
        message: 'Профиль успешно обновлен',
      });

      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      notifications.show({
        color: 'red',
        message: 'Ошибка при обновлении профиля',
      });
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleThemeColorChange = async (value: string | null) => {
    if (!value) return;

    try {
      const userId = await getUserId();
      if (!userId) {
        notifications.show({
          color: 'red',
          message: 'Ошибка: пользователь не авторизован',
        });
        return;
      }

      // Сразу обновляем форму
      form.setFieldValue('theme_color', value as ThemeColor);

      // Сохраняем в базу данных
      await dispatch(
        updateProfile({
          userId,
          updates: {
            theme_color: value as ThemeColor,
          },
        })
      ).unwrap();

      notifications.show({
        color: 'teal',
        message: 'Цветовая тема обновлена',
      });
    } catch (err) {
      console.error('Error updating theme color:', err);
      notifications.show({
        color: 'red',
        message: 'Ошибка при обновлении темы',
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Профиль пользователя"
      size="md"
      styles={{ inner: { right: 0, left: 0 } }}
      centered
    >
      <LoadingOverlay visible={loading} />

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Email"
            placeholder="email@example.com"
            disabled
            {...form.getInputProps('email')}
          />

          <TextInput
            label="Имя"
            placeholder="Введите имя"
            disabled={!isEditing}
            {...form.getInputProps('first_name')}
          />

          <TextInput
            label="Фамилия"
            placeholder="Введите фамилию"
            disabled={!isEditing}
            {...form.getInputProps('last_name')}
          />

          <TextInput
            label="Телефон"
            placeholder="+7 (XXX) XXX-XX-XX"
            disabled={!isEditing}
            {...form.getInputProps('phone')}
          />

          <TextInput
            label="Telegram"
            placeholder="@username"
            disabled={!isEditing}
            {...form.getInputProps('telegram')}
          />

          <TextInput
            label="Должность"
            placeholder="Введите должность"
            disabled={!isEditing}
            {...form.getInputProps('position')}
          />

          <Group justify="flex-end" mt="md">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Настроить
              </Button>
            ) : (
              <>
                <Button
                  variant="subtle"
                  onClick={() => {
                    setIsEditing(false);
                    if (profile) {
                      form.setValues({
                        email: profile.email || '',
                        first_name: profile.first_name || '',
                        last_name: profile.last_name || '',
                        phone: profile.phone || '',
                        telegram: profile.telegram || '',
                        position: profile.position || '',
                      });
                    }
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" loading={loading}>
                  Сохранить
                </Button>
              </>
            )}
          </Group>

          <Divider my="sm" />

          <Select
            label="Цветовая тема"
            placeholder="Выберите цветовую тему"
            data={[
              { value: 'blue', label: '🔵 Синяя' },
              { value: 'green', label: '🟢 Зеленая' },
              { value: 'orange', label: '🟠 Оранжевая' },
            ]}
            value={form.values.theme_color}
            onChange={handleThemeColorChange}
          />
        </Stack>
      </form>
    </Modal>
  );
}
