import { useState } from 'react';
import { TextInput, PasswordInput, Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { signUp } from '../api/auth';
import { useAuthForm } from './useAuthForm';

export function Register() {
  const form = useAuthForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = form.onSubmit(async ({ email, password }) => {
    try {
      setLoading(true);
      await signUp(email, password);
      notifications.show({ color: 'teal', message: 'Регистрация успешна' });
      navigate('/', { replace: true });
    } catch {
      notifications.show({ color: 'red', message: 'Ошибка регистрации' });
    } finally {
      setLoading(false);
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Stack>
        <TextInput label="Email" placeholder="you@example.com" {...form.getInputProps('email')} />
        <PasswordInput
          label="Пароль"
          placeholder="Минимум 6 символов"
          {...form.getInputProps('password')}
        />
        <Button type="submit" loading={loading}>Зарегистрироваться</Button>
      </Stack>
    </form>
  );
}
