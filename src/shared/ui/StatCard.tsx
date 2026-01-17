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
    <Card radius="lg" p="lg" withBorder style={{ height: '100%', width: '100%', position: 'relative' }}>
      {(icon || action) && (
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <Group gap="xs">
            {action}
            {icon && (
              <ThemeIcon color={color} variant="light" radius="xl">
                {icon}
              </ThemeIcon>
            )}
          </Group>
        </div>
      )}
      <Text size="sm" c="dimmed" mb="xs">{label}</Text>
      <Title order={3}>{value}</Title>
    </Card>
  );
}
