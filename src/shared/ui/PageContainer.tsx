import { Container, Group} from '@mantine/core';
import { supabase } from '../api/supabase';
import { useEffect, useState } from 'react';

type Props = {
  children: React.ReactNode;
  maxWidth?: number;
};

export default function PageContainer({ children, maxWidth = 1200 }: Props) {
  const [email, setEmail] = useState<string | null>(null);

useEffect(() => {
  let mounted = true;

  supabase.auth.getUser().then(({ data }) => {
    if (!mounted) return;
    setEmail(data.user?.email ?? null);
  });

  const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
    setEmail(session?.user?.email ?? null);
  });

  return () => {
    mounted = false;
    sub.subscription.unsubscribe();
  };
}, []);




  return (
    <Container size={maxWidth} py="md">
      <Group justify="space-between" mb="lg">
  <div>Finance App</div>
  <Group gap="sm">
    {email && <div style={{ opacity: 0.7 }}>{email}</div>}
  </Group>
</Group>

      {children}
    </Container>
  );
}
