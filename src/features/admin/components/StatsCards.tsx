import { SimpleGrid, Paper, Text, Box, ThemeIcon, Skeleton } from '@mantine/core';
import {
  IconUsers,
  IconCrown,
  IconDiamond,
  IconMessage,
  IconKey,
  IconKeyOff,
} from '@tabler/icons-react';
import type { AdminStats } from '../types';

interface StatsCardsProps {
  stats: AdminStats | null;
  loading: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}

function StatCard({ title, value, icon, color, loading }: StatCardProps) {
  return (
    <Paper withBorder p="md" radius="md" style={{ position: 'relative' }}>
      <ThemeIcon
        color={color}
        variant="light"
        size={28}
        radius="md"
        style={{ position: 'absolute', top: 8, right: 8 }}
      >
        {icon}
      </ThemeIcon>
      <Box pr={36}>
        <Text c="dimmed" tt="uppercase" fw={700} fz="xs">
          {title}
        </Text>
        {loading ? (
          <Skeleton height={32} width={60} mt={4} />
        ) : (
          <Text fw={700} fz="xl">
            {value}
          </Text>
        )}
      </Box>
    </Paper>
  );
}

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      title: 'Всего пользователей',
      value: stats?.totalUsers || 0,
      icon: <IconUsers size={16} />,
      color: 'blue',
    },
    {
      title: 'Premium подписок',
      value: stats?.premiumUsers || 0,
      icon: <IconCrown size={16} />,
      color: 'yellow',
    },
    {
      title: 'VIP подписок',
      value: stats?.vipUsers || 0,
      icon: <IconDiamond size={16} />,
      color: 'grape',
    },
    {
      title: 'Открытых тикетов',
      value: stats?.openTickets || 0,
      icon: <IconMessage size={16} />,
      color: 'orange',
    },
    {
      title: 'Всего VPN ключей',
      value: stats?.totalVpnKeys || 0,
      icon: <IconKey size={16} />,
      color: 'teal',
    },
    {
      title: 'Свободных ключей',
      value: (stats?.totalVpnKeys || 0) - (stats?.assignedVpnKeys || 0),
      icon: <IconKeyOff size={16} />,
      color: 'gray',
    },
  ];

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} loading={loading} />
      ))}
    </SimpleGrid>
  );
}
