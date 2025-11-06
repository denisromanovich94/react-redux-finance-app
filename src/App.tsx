import { AppShell, Burger, Group, NavLink, ScrollArea, Title, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Overview from './pages/Overview';
import Analytics from './pages/Analytics';
import Transactions from './pages/Transactions';
import Clients from './pages/Clients';
import { Auth } from './pages/Auth';
import { LinkTelegram } from './pages/LinkTelegram';
import RequireAuth from './shared/auth/RequireAuth';
import { supabase } from './shared/api/supabase';
import { signOut } from './shared/api/auth';
import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import Tracker from './pages/Tracker';
import CalendarPage from './pages/CalendarPage';
import FloatingTracker from './features/tracker/ui/FloatingTracker';
import { useAppDispatch } from './hooks';
import { loadExchangeRates } from './features/currency/currencySlice';

export default function App() {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
  // Загружаем курсы валют при монтировании и проверяем каждый час
  useEffect(() => {
    // Загружаем курсы при старте
    dispatch(loadExchangeRates());

    // Проверяем каждый час, не пора ли обновить курсы
    const interval = setInterval(() => {
      dispatch(loadExchangeRates());
    }, 60 * 60 * 1000); // каждый час

    return () => clearInterval(interval);
  }, [dispatch]);

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
            onClick={toggle}
          />

          <NavLink
            label="Транзакции"
            component={Link}
            to="/transactions"
            active={location.pathname.startsWith('/transactions')}
            onClick={toggle}
          />
          <NavLink
            label="Аналитика"
            component={Link}
            to="/analytics"
            active={location.pathname.startsWith('/analytics')}
            onClick={toggle}
          />
          <NavLink
            label="Клиенты"
            component={Link}
            to="/clients"
            active={location.pathname.startsWith('/clients')}
            onClick={toggle}
          />
<NavLink
            label="Тайм трекер Beta"
            component={Link}
            to="/tracker"
            active={location.pathname.startsWith('/tracker')}
            onClick={toggle}
          />
<NavLink
  label="Календарь Beta"
  component={Link}
  to="/calendar"
  active={location.pathname.startsWith('/calendar')}
  onClick={toggle}
/>
          {!authed ? (
            <NavLink
              label="Войти"
              component={Link}
              to="/auth"
              active={location.pathname.startsWith('/auth')}
            />
          ) : (
            <>
              <NavLink
                label="Telegram"
                component={Link}
                to="/link-telegram"
                active={location.pathname.startsWith('/link-telegram')}
                onClick={toggle}
              />
              <Group justify="flex-start" p="sm">
                <Button variant="outline" color="red" size="xs" onClick={handleLogout}>
                  Выйти
                </Button>
              </Group>
            </>
          )}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>

          <Route path="/auth" element={<Auth />} />


          <Route path="/" element={<RequireAuth><Overview /></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
          <Route path="/transactions" element={<RequireAuth><Transactions /></RequireAuth>} />
          <Route path="/clients" element={<RequireAuth><Clients /></RequireAuth>} />
<Route path="/tracker" element={<RequireAuth><Tracker /></RequireAuth>} />
<Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
<Route path="/link-telegram" element={<RequireAuth><LinkTelegram /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {authed && <FloatingTracker />}
      </AppShell.Main>
    </AppShell>
  );
}
