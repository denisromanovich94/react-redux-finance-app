import { AppShell, Burger, Group, NavLink, ScrollArea, Title, Button, Text, Badge, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import Overview from './pages/Overview';
import Analytics from './pages/Analytics';
import Transactions from './pages/Transactions';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import { Auth } from './pages/Auth';
import RequireAuth from './shared/auth/RequireAuth';
import { signOut } from './shared/api/auth';
import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconHeart,
  IconBrandTelegram,
  IconCheck,
  IconMessage,
  IconHome,
  IconCreditCard,
  IconChartBar,
  IconUsers,
  IconBriefcase,
  IconClock,
  IconCalendar,
  IconChecklist,
  IconSettings,
  IconLogin,
} from '@tabler/icons-react';
import Tracker from './pages/Tracker';
import CalendarPage from './pages/CalendarPage';
import TodosPage from './pages/TodosPage';
import CRMPage from './pages/CRMPage';
import Settings from './pages/Settings';
import DonatePage from './pages/DonatePage';
import Admin from './pages/Admin';
import Support from './pages/Support';
import RequireAdmin from './shared/auth/RequireAdmin';
import FloatingTracker from './features/tracker/ui/FloatingTracker';
import { useAppDispatch, useAppSelector } from './hooks';
import { loadExchangeRates } from './features/currency/currencySlice';
import { fetchProfile } from './features/profile/profileSlice';
import { loadUnreadCount } from './features/tickets/ticketsSlice';
import { useAuth } from './shared/auth/AuthContext';
import { TelegramLoginButton } from './shared/auth/TelegramLoginButton';
import { linkTelegram } from './shared/api/telegramAuth';
import type { TelegramAuthData } from './features/profile/types';

export default function App() {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { profile } = useAppSelector((state) => state.profile);
  const { unreadCount } = useAppSelector((state) => state.tickets);
  const [telegramLoading, setTelegramLoading] = useState(false);

  const handleTelegramLink = async (data: TelegramAuthData) => {
    try {
      setTelegramLoading(true);
      const result = await linkTelegram(data);
      if (result.success) {
        notifications.show({ color: 'teal', message: 'Telegram привязан' });
        if (user?.id) dispatch(fetchProfile(user.id));
      } else {
        notifications.show({ color: 'red', message: result.error || 'Ошибка привязки' });
      }
    } catch {
      notifications.show({ color: 'red', message: 'Ошибка привязки Telegram' });
    } finally {
      setTelegramLoading(false);
    }
  };

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

  // Загружаем профиль пользователя при авторизации
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchProfile(user.id));
    }
  }, [user?.id, dispatch]);

  // Загружаем количество непрочитанных ответов поддержки
  useEffect(() => {
    if (user?.id) {
      dispatch(loadUnreadCount());
      // Проверяем каждые 2 минуты
      const interval = setInterval(() => {
        dispatch(loadUnreadCount());
      }, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user?.id, dispatch]);

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
  <Group h="100%" px="md" justify="space-between">
    <Group>
      <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
      <Title order={3}>Finance App</Title>
    </Group>
    <Group>
      <ThemeToggle />
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
            leftSection={<IconHome size={16} />}
          />

          <NavLink
            label="Транзакции"
            component={Link}
            to="/transactions"
            active={location.pathname.startsWith('/transactions')}
            onClick={toggle}
            leftSection={<IconCreditCard size={16} />}
          />
          <NavLink
            label="Аналитика"
            component={Link}
            to="/analytics"
            active={location.pathname.startsWith('/analytics')}
            onClick={toggle}
            leftSection={<IconChartBar size={16} />}
          />
          <NavLink
            label="Клиенты"
            component={Link}
            to="/clients"
            active={location.pathname.startsWith('/clients')}
            onClick={toggle}
            leftSection={<IconUsers size={16} />}
          />
          <NavLink
            label="Проекты (beta)"
            component={Link}
            to="/projects"
            active={location.pathname.startsWith('/projects')}
            onClick={toggle}
            leftSection={<IconBriefcase size={16} />}
          />
          <NavLink
            label="Тайм трекер"
            component={Link}
            to="/tracker"
            active={location.pathname.startsWith('/tracker')}
            onClick={toggle}
            leftSection={<IconClock size={16} />}
          />
          <NavLink
            label="Календарь"
            component={Link}
            to="/calendar"
            active={location.pathname.startsWith('/calendar')}
            onClick={toggle}
            leftSection={<IconCalendar size={16} />}
          />
          <NavLink
            label="Задачи (beta)"
            component={Link}
            to="/todos"
            active={location.pathname.startsWith('/todos')}
            onClick={toggle}
            leftSection={<IconChecklist size={16} />}
          />
          {!user ? (
            <NavLink
              label="Войти"
              component={Link}
              to="/auth"
              active={location.pathname.startsWith('/auth')}
              leftSection={<IconLogin size={16} />}
            />
          ) : (
            <>
              <NavLink
                label="Настройки"
                component={Link}
                to="/settings"
                active={location.pathname.startsWith('/settings')}
                onClick={toggle}
                leftSection={<IconSettings size={16} />}
              />
              <NavLink
                label={
                  <Group gap={6}>
                    <span>Поддержка</span>
                    {unreadCount > 0 && (
                      <Badge size="xs" color="red" variant="filled" circle>
                        {unreadCount}
                      </Badge>
                    )}
                  </Group>
                }
                component={Link}
                to="/support"
                active={location.pathname.startsWith('/support')}
                onClick={toggle}
                leftSection={<IconMessage size={16} />}
              />
              <NavLink
                label="Поддержать"
                component={Link}
                to="/donate"
                active={location.pathname.startsWith('/donate')}
                onClick={toggle}
                leftSection={<IconHeart size={16} />}
                c="pink"
              />

              {/* Telegram секция */}
              <Box p="sm" mt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)', minHeight: 60 }}>
                {profile?.telegram_id ? (
                  <Group gap="xs">
                    <IconBrandTelegram size={18} color="#0088cc" />
                    <Badge color="teal" variant="light" size="sm" leftSection={<IconCheck size={10} />}>
                      TG привязан
                    </Badge>
                  </Group>
                ) : (
                  <Box>
                    <Text size="xs" c="dimmed" mb="xs">Привязать Telegram:</Text>
                    {telegramLoading ? (
                      <Text size="xs">Загрузка...</Text>
                    ) : (
                      <TelegramLoginButton onAuth={handleTelegramLink} buttonSize="small" />
                    )}
                  </Box>
                )}
              </Box>

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
          <Route path="/projects" element={<RequireAuth><Projects /></RequireAuth>} />
<Route path="/todos" element={<RequireAuth><TodosPage /></RequireAuth>} />
<Route path="/crm" element={<RequireAuth><CRMPage /></RequireAuth>} />
<Route path="/tracker" element={<RequireAuth><Tracker /></RequireAuth>} />
<Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
<Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
<Route path="/donate" element={<RequireAuth><DonatePage /></RequireAuth>} />
<Route path="/support" element={<RequireAuth><Support /></RequireAuth>} />
<Route path="/admin-denis" element={<RequireAdmin><Admin /></RequireAdmin>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {user && <FloatingTracker />}
      </AppShell.Main>
    </AppShell>
  );
}
