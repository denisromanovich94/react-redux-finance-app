import { Grid, Title, Text } from '@mantine/core';
import PageContainer from '../shared/ui/PageContainer';
import { AreaChart } from '@mantine/charts';
import { useAppSelector } from '../hooks';
import { formatRub } from '../shared/utils/currency';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import StatCard from '../shared/ui/StatCard';
import { IconWallet, IconTrendingUp, IconTrendingDown, IconPigMoney } from '@tabler/icons-react';


export default function Overview() {
  const items = useAppSelector((s) => s.transactions.items);
const loading = useAppSelector((s) => s.transactions.loading);
const error = useAppSelector((s) => s.transactions.error);

const byMonth = new Map<string, { month: string; income: number; expenses: number }>();
for (const t of items) {
  const m = dayjs(t.date, 'DD.MM.YYYY').locale('ru');
  if (!m.isValid()) continue;
  const key = m.format('MMM YYYY');
  if (!byMonth.has(key)) {
    byMonth.set(key, { month: key, income: 0, expenses: 0 });
  }
  const bucket = byMonth.get(key)!;
  if (t.amount > 0) bucket.income += t.amount;
  else bucket.expenses += Math.abs(t.amount);
}

const chartData = Array.from(byMonth.values()).sort((a, b) =>
  dayjs(a.month, 'MMM YYYY', 'ru').valueOf() - dayjs(b.month, 'MMM YYYY', 'ru').valueOf()
);
const now = dayjs();
const monthItems = items.filter((i) => dayjs(i.date, 'DD.MM.YYYY').isSame(now, 'month'));

const incomeM = monthItems.filter(i => i.amount > 0).reduce((s, i) => s + i.amount, 0);
const expensesM = monthItems.filter(i => i.amount < 0).reduce((s, i) => s + i.amount, 0);
const balanceM = incomeM + expensesM;
  const income = items.filter((i) => i.amount > 0).reduce((sum, i) => sum + i.amount, 0);
  const expenses = items.filter((i) => i.amount < 0).reduce((sum, i) => sum + i.amount, 0);
  const balance = income + expenses;


  return (
    <PageContainer maxWidth={1200}>
      <Title order={2} mb="md">Обзор</Title>
{loading && <Text c="dimmed" mb="md">Загрузка данных…</Text>}
{error && <Text c="red" mb="md">Ошибка: {error}</Text>}
      <Grid>
  <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
    <StatCard
      label="Баланс (месяц)"
      value={formatRub(balanceM, false)}
      color="indigo"
      icon={<IconWallet size={18} />}
    />
  </Grid.Col>

  <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
    <StatCard
      label="Доходы (месяц)"
      value={formatRub(incomeM, false)}
      color="teal"
      icon={<IconTrendingUp size={18} />}
    />
  </Grid.Col>

  <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
    <StatCard
      label="Расходы (месяц)"
      value={formatRub(expensesM, false)}
      color="red"
      icon={<IconTrendingDown size={18} />}
    />
  </Grid.Col>

  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
    <StatCard
      label="Накопления (общие)"
      value={formatRub(Math.max(balance * 0.2, 0), false)}
      color="grape"
      icon={<IconPigMoney size={18} />}
    />
  </Grid.Col>
</Grid>

      <Title order={3} mt="xl" mb="md">Доходы vs Расходы</Title>
<AreaChart
  h={250}
  data={chartData}
  dataKey="month"
  series={[
    { name: 'income', color: 'teal' },
    { name: 'expenses', color: 'red' },
  ]}
/>
    </PageContainer>
  );
}
