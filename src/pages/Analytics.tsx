import { Card, Title } from '@mantine/core';
import { PieChart } from '@mantine/charts';
import type { DefaultMantineColor } from '@mantine/core';

type DataItem = {
  name: string;
  value: number;
  color: DefaultMantineColor;
};

export default function Analytics() {
  const data: DataItem[] = [
    { name: 'Rent', value: 1200, color: 'red' },
    { name: 'Food', value: 450, color: 'blue' },
    { name: 'Transport', value: 160, color: 'teal' },
    { name: 'Entertainment', value: 220, color: 'grape' },
    { name: 'Other', value: 170, color: 'yellow' },
  ];

  return (
    <Card radius="lg" p="lg" withBorder>
      <Title order={2} mb="md">
        Spending breakdown
      </Title>
      <PieChart data={data} withTooltip size={280} />
    </Card>
  );
}
