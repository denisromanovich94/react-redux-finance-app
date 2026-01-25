import { useState } from 'react';
import {
  Stack,
  Paper,
  Group,
  Text,
  Badge,
  Select,
  TextInput,
  Loader,
  Center,
  ActionIcon,
} from '@mantine/core';
import { IconSearch, IconChevronRight } from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';
import type { Ticket, TicketStatus, TicketPriority } from '../types';

dayjs.extend(relativeTime);
dayjs.locale('ru');

interface TicketsListProps {
  tickets: Ticket[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const statusColors: Record<TicketStatus, string> = {
  open: 'blue',
  in_progress: 'yellow',
  resolved: 'green',
  closed: 'gray',
};

const statusLabels: Record<TicketStatus, string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};

const priorityColors: Record<TicketPriority, string> = {
  low: 'gray',
  normal: 'blue',
  high: 'orange',
  urgent: 'red',
};

export default function TicketsList({ tickets, loading, selectedId, onSelect }: TicketsListProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      !search ||
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.user_email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !filterStatus || ticket.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group>
        <TextInput
          placeholder="Поиск по теме или email..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Статус"
          clearable
          data={[
            { value: 'open', label: 'Открыт' },
            { value: 'in_progress', label: 'В работе' },
            { value: 'resolved', label: 'Решён' },
            { value: 'closed', label: 'Закрыт' },
          ]}
          value={filterStatus}
          onChange={setFilterStatus}
          w={150}
        />
      </Group>

      <Stack gap="xs">
        {filteredTickets.map((ticket) => (
          <Paper
            key={ticket.id}
            withBorder
            p="sm"
            radius="md"
            style={{
              cursor: 'pointer',
              borderColor: selectedId === ticket.id ? 'var(--mantine-color-blue-5)' : undefined,
              backgroundColor: selectedId === ticket.id ? 'var(--mantine-color-blue-light)' : undefined,
            }}
            onClick={() => onSelect(ticket.id)}
          >
            <Group justify="space-between" wrap="nowrap">
              <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                <Group gap="xs">
                  <Badge size="xs" color={statusColors[ticket.status]} variant="light">
                    {statusLabels[ticket.status]}
                  </Badge>
                  <Badge size="xs" color={priorityColors[ticket.priority]} variant="outline">
                    {ticket.priority}
                  </Badge>
                </Group>
                <Text size="sm" fw={500} lineClamp={1}>
                  {ticket.subject}
                </Text>
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    {ticket.user_email}
                  </Text>
                  <Text size="xs" c="dimmed">
                    •
                  </Text>
                  <Text size="xs" c="dimmed">
                    {dayjs(ticket.updated_at).fromNow()}
                  </Text>
                </Group>
              </Stack>
              <ActionIcon variant="subtle" color="gray">
                <IconChevronRight size={16} />
              </ActionIcon>
            </Group>
          </Paper>
        ))}

        {filteredTickets.length === 0 && (
          <Center py="xl">
            <Text c="dimmed">Тикеты не найдены</Text>
          </Center>
        )}
      </Stack>
    </Stack>
  );
}
