import { Card, Title } from '@mantine/core';
import { PieChart } from '@mantine/charts';
import PageContainer from '../shared/ui/PageContainer';
import { useAppSelector } from '../hooks';
import type { DefaultMantineColor } from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

export default function Analytics() {
  const items = useAppSelector((s) => s.transactions.items);
  const categories = useAppSelector((s) => s.categories.items);

  const expenseData: Array<{ name: string; value: number; color: DefaultMantineColor }> =
    categories
      .map((cat) => {
        const sum = items
          .filter((t) => t.category === cat.name && t.amount < 0)
          .reduce((acc, t) => acc + Math.abs(t.amount), 0);

        return {
          name: cat.name,
          value: sum,
          color: cat.color as DefaultMantineColor,
        };
      })
      .filter((c) => c.value > 0);

      const incomeData: Array<{ name: string; value: number; color: DefaultMantineColor }> =
  categories
    .map((cat) => {
      const sum = items
        .filter((t) => t.category === cat.name && t.amount > 0)
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        name: cat.name,
        value: sum,
        color: cat.color as DefaultMantineColor,
      };
    })
    .filter((c) => c.value > 0);
const byMonth = new Map<string, { month: string; income: number; expenses: number }>();

for (const t of items) {
  const m = dayjs(t.date, 'DD.MM.YYYY').locale('ru');
  if (!m.isValid()) continue;
  const key = m.format('MMM YYYY'); // напр. "авг. 2025"
  if (!byMonth.has(key)) byMonth.set(key, { month: key, income: 0, expenses: 0 });
  const bucket = byMonth.get(key)!;
  if (t.amount > 0) bucket.income += t.amount;
  else bucket.expenses += Math.abs(t.amount);
}

const trendData = Array.from(byMonth.values()).sort(
  (a, b) => dayjs(a.month, 'MMM YYYY', 'ru').valueOf() - dayjs(b.month, 'MMM YYYY', 'ru').valueOf()
);

  return (
    <PageContainer maxWidth={1200}>
      <Card radius="lg" p="lg" withBorder>
        <Title order={2} mb="md">Расходы по категориям</Title>
        <PieChart data={expenseData} withLabels withTooltip size={300} />
      </Card>
      <Card radius="lg" p="lg" withBorder mt="lg">
  <Title order={2} mb="md">Доходы по категориям</Title>
  <PieChart data={incomeData} withLabels withTooltip size={300} />
</Card>
<Card radius="lg" p="lg" withBorder mt="lg">
  <Title order={2} mb="md">Доходы vs Расходы по месяцам</Title>
  <AreaChart
    h={280}
    data={trendData}
    dataKey="month"
    series={[
      { name: 'income', label: 'Доход', color: 'teal' },
    { name: 'expenses', label: 'Расход', color: 'red' },
    ]}
    withLegend
    withTooltip
  />
</Card>
    </PageContainer>
  );
}
