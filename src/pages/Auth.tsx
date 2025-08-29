import { useState } from 'react';
import { Card, Title, Anchor } from '@mantine/core';
import PageContainer from '../shared/ui/PageContainer';
import { SignIn } from '../shared/auth/SignIn';
import { Register } from '../shared/auth/Register';

export function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

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
      </Card>
    </PageContainer>
  );
}
