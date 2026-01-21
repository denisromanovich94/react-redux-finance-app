import { TextInput, Button, Stack, Group, LoadingOverlay } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { fetchProfile, updateProfile, createProfile } from '../../profile/profileSlice';
import { useAuth } from '../../../shared/auth/AuthContext';

export function ProfileSection() {
  const dispatch = useAppDispatch();
  const { profile, loading } = useAppSelector((state) => state.profile);
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      telegram: '',
      position: '',
    },
  });

  // Загрузка профиля при монтировании (только если еще не загружен)
  useEffect(() => {
    if (user?.id && !profile) {
      const loadProfile = async () => {
        try {
          await dispatch(fetchProfile(user.id)).unwrap();
        } catch {
          if (user.email) {
            try {
              await dispatch(createProfile({ userId: user.id, email: user.email })).unwrap();
            } catch (err) {
              console.error('Error creating profile:', err);
            }
          }
        }
      };
      loadProfile();
    }
  }, [user?.id, profile, dispatch, user?.email]);

  // Заполнение формы
  const updateFormValues = useCallback(() => {
    if (profile) {
      form.setValues({
        email: user?.email || profile.email || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        telegram: profile.telegram || '',
        position: profile.position || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user?.email]);

  useEffect(() => {
    updateFormValues();
  }, [updateFormValues]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (!user?.id) {
        notifications.show({
          color: 'red',
          message: 'Ошибка: пользователь не авторизован',
        });
        return;
      }

      await dispatch(
        updateProfile({
          userId: user.id,
          updates: {
            first_name: values.first_name,
            last_name: values.last_name,
            phone: values.phone,
            telegram: values.telegram,
            position: values.position,
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

  return (
    <div style={{ position: 'relative', maxWidth: 600 }}>
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

          <Group justify="flex-start" mt="md">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Редактировать
              </Button>
            ) : (
              <>
                <Button type="submit" loading={loading}>
                  Сохранить
                </Button>
                <Button
                  variant="subtle"
                  onClick={() => {
                    setIsEditing(false);
                    updateFormValues();
                  }}
                >
                  Отмена
                </Button>
              </>
            )}
          </Group>
        </Stack>
      </form>
    </div>
  );
}
