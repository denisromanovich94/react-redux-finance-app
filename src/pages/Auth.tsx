import { useState } from 'react';
import { Card, Title, TextInput, PasswordInput, Button, Stack, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { signIn, signUp } from '../shared/api/auth';
import PageContainer from '../shared/ui/PageContainer';
import { useNavigate } from 'react-router-dom';


export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
const navigate = useNavigate();
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Введите корректный email'),
      password: (v) => (v.length >= 6 ? null : 'Минимум 6 символов'),
    },
  });

  const onSubmit = form.onSubmit(async ({ email, password }) => {
    try {
      setLoading(true);
      if (mode === 'signin') {
  await signIn(email, password);
  notifications.show({ color: 'teal', message: 'Вход выполнен' });
  navigate('/', { replace: true }); 
} else {
  await signUp(email, password);
  notifications.show({ color: 'teal', message: 'Регистрация успешна' });
  navigate('/', { replace: true }); 
}


    } catch (e) {
  let message = 'Ошибка';
  if (e instanceof Error) {
    message = e.message;
  } else if (typeof e === 'object' && e && 'message' in e && typeof (e as Record<string, unknown>).message === 'string') {
    message = (e as Record<string, unknown>).message as string;
  }
  notifications.show({ color: 'red', message });
} finally {
      setLoading(false);
    }
  });

  return (
    <PageContainer maxWidth={420}>
      <Card radius="lg" p="lg" withBorder mt="xl">
        <Title order={3} mb="md">
          {mode === 'signin' ? 'Вход' : 'Регистрация'}
        </Title>

        <form onSubmit={onSubmit}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="you@example.com"
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Пароль"
              placeholder="Минимум 6 символов"
              {...form.getInputProps('password')}
            />
            <Button type="submit" loading={loading}>
              {mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </Stack>
        </form>

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
