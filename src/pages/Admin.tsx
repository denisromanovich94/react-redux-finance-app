import { useEffect, useState } from 'react';
import { Stack, Tabs, Title, Grid, Paper, Box } from '@mantine/core';
import {
  IconUsers,
  IconMessage,
  IconKey,
  IconSettings2,
} from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../hooks';
import PageContainer from '../shared/ui/PageContainer';
import StatsCards from '../features/admin/components/StatsCards';
import UsersTable from '../features/admin/components/UsersTable';
import TicketsList from '../features/admin/components/TicketsList';
import TicketChat from '../features/admin/components/TicketChat';
import VpnKeysTable from '../features/admin/components/VpnKeysTable';
import ModulesPanel from '../features/admin/components/ModulesPanel';
import {
  loadUsers,
  loadTickets,
  loadTicketMessages,
  loadVpnKeys,
  loadModules,
  loadStats,
  selectTicket,
} from '../features/admin/adminSlice';

export default function Admin() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<string | null>('users');

  // Селекторы
  const {
    users,
    usersLoading,
    tickets,
    ticketsLoading,
    currentTicketMessages,
    messagesLoading,
    vpnKeys,
    vpnLoading,
    modules,
    modulesLoading,
    stats,
    statsLoading,
    selectedTicketId,
  } = useAppSelector((s) => s.admin);

  // Загрузка данных при монтировании
  useEffect(() => {
    dispatch(loadStats());
    dispatch(loadUsers());
    dispatch(loadVpnKeys());
    dispatch(loadModules());
  }, [dispatch]);

  // Загрузка тикетов при переключении на вкладку
  useEffect(() => {
    if (activeTab === 'tickets') {
      dispatch(loadTickets());
    }
  }, [activeTab, dispatch]);

  // Загрузка сообщений при выборе тикета
  useEffect(() => {
    if (selectedTicketId) {
      dispatch(loadTicketMessages(selectedTicketId));
    }
  }, [selectedTicketId, dispatch]);

  const handleSelectTicket = (ticketId: string) => {
    dispatch(selectTicket(ticketId));
  };

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  return (
    <PageContainer maxWidth={1400}>
      <Stack gap="lg">
        <Title order={2}>Админ-панель</Title>

        {/* Статистика */}
        <StatsCards stats={stats} loading={statsLoading} />

        {/* Табы */}
        <Paper withBorder radius="md" p={0}>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
                Пользователи
              </Tabs.Tab>
              <Tabs.Tab value="tickets" leftSection={<IconMessage size={16} />}>
                Тикеты
              </Tabs.Tab>
              <Tabs.Tab value="vpn" leftSection={<IconKey size={16} />}>
                VPN ключи
              </Tabs.Tab>
              <Tabs.Tab value="modules" leftSection={<IconSettings2 size={16} />}>
                Модули
              </Tabs.Tab>
            </Tabs.List>

            <Box p="md">
              <Tabs.Panel value="users">
                <UsersTable users={users} loading={usersLoading} />
              </Tabs.Panel>

              <Tabs.Panel value="tickets">
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, md: 5 }}>
                    <TicketsList
                      tickets={tickets}
                      loading={ticketsLoading}
                      selectedId={selectedTicketId}
                      onSelect={handleSelectTicket}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 7 }}>
                    <Paper withBorder radius="md" h={500} style={{ overflow: 'hidden' }}>
                      <TicketChat
                        ticket={selectedTicket}
                        messages={currentTicketMessages}
                        loading={messagesLoading}
                      />
                    </Paper>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="vpn">
                <VpnKeysTable vpnKeys={vpnKeys} loading={vpnLoading} />
              </Tabs.Panel>

              <Tabs.Panel value="modules">
                <ModulesPanel modules={modules} loading={modulesLoading} />
              </Tabs.Panel>
            </Box>
          </Tabs>
        </Paper>
      </Stack>
    </PageContainer>
  );
}
