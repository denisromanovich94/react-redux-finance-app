import { Card, Group, Text, Title, ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';
import type { MantineColor } from '@mantine/core';

type Props = {
  label: string;
  value: ReactNode;
  color?: MantineColor;    
  icon?: ReactNode;
};

export default function StatCard({ label, value, color = 'gray', icon }: Props) {
  return (
    <Card radius="lg" p="lg" withBorder>
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed">{label}</Text>
        {icon && (
          <ThemeIcon color={color} variant="light" radius="xl">
  {icon}
</ThemeIcon>
        )}
      </Group>
      <Title order={3}>{value}</Title>
    </Card>
  );
}
