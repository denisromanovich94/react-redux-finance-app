import { AppShell, Burger, Group, NavLink, ScrollArea, Title, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Overview from './pages/Overview';
import Analytics from './pages/Analytics';
import Transactions from './pages/Transactions';
import { Auth } from './pages/Auth';
import RequireAuth from './shared/auth/RequireAuth';
import { supabase } from './shared/api/supabase';
import { signOut } from './shared/api/auth';
import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';



export default function App() {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);

  function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('light', { getInitialValueInEffect: true });

  return (
    <ActionIcon
      variant="default"
      size="lg"
      radius="xl"
      aria-label="Переключить тему"
      onClick={() => setColorScheme(computed === 'light' ? 'dark' : 'light')}
      title={computed === 'light' ? 'Ночная тема' : 'Дневная тема'}
    >
      {computed === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
    </ActionIcon>
  );
}
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session?.user);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
  <Group h="100%" px="md" style={{ width: '100%' }}>
    <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
    <Title order={3}>Finance App</Title>
      <ThemeToggle />
    <Group ml="auto">
    </Group>
  </Group>
</AppShell.Header>

      <AppShell.Navbar p="sm">
        <ScrollArea type="hover" style={{ height: '100%' }}>
          <NavLink
            label="Обзор"
            component={Link}
            to="/"
            active={location.pathname === '/'}
          />
          <NavLink
            label="Аналитика"
            component={Link}
            to="/analytics"
            active={location.pathname.startsWith('/analytics')}
          />
          <NavLink
            label="Транзакции"
            component={Link}
            to="/transactions"
            active={location.pathname.startsWith('/transactions')}
          />


          {!authed ? (
            <NavLink
              label="Войти"
              component={Link}
              to="/auth"
              active={location.pathname.startsWith('/auth')}
            />
          ) : (
            <Group justify="flex-start" p="sm">
              <Button variant="outline" color="red" size="xs" onClick={handleLogout}>
                Выйти
              </Button>
            </Group>
          )}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>

          <Route path="/auth" element={<Auth />} />


          <Route path="/" element={<RequireAuth><Overview /></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
          <Route path="/transactions" element={<RequireAuth><Transactions /></RequireAuth>} />


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
