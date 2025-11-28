import { Card, Group, Text, Title, ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';
import type { MantineColor } from '@mantine/core';

type Props = {
  label: string;
  value: ReactNode;
  color?: MantineColor;
  icon?: ReactNode;
  action?: ReactNode;
};

export default function StatCard({ label, value, color = 'gray', icon, action }: Props) {
  return (
    <Card radius="lg" p="lg" withBorder>
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed">{label}</Text>
        <Group gap="xs">
          {action}
          {icon && (
            <ThemeIcon color={color} variant="light" radius="xl">
              {icon}
            </ThemeIcon>
          )}
        </Group>
      </Group>
      <Title order={3}>{value}</Title>
    </Card>
  );
}
