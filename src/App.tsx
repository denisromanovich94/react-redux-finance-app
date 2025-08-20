import { AppShell, Burger, Group, NavLink, ScrollArea, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import Overview from './pages/Overview';
import Analytics from './pages/Analytics';
import Transactions from './pages/Transactions';

export default function App() {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3}>Finance App</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <ScrollArea type="hover" style={{ height: '100%' }}>
          <NavLink
            label="Overview"
            component={Link}
            to="/"
            active={location.pathname === '/'}
          />
          <NavLink
            label="Analytics"
            component={Link}
            to="/analytics"
            active={location.pathname.startsWith('/analytics')}
          />
          <NavLink
            label="Transactions"
            component={Link}
            to="/transactions"
            active={location.pathname.startsWith('/transactions')}
          />
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/transactions" element={<Transactions />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}