import { Grid, Title, Text } from '@mantine/core';
import PageContainer from '../shared/ui/PageContainer';
import { AreaChart } from '@mantine/charts';
import { useAppSelector } from '../hooks';
import { formatRub } from '../shared/utils/currency';
import StatCard from '../shared/ui/StatCard';
import { IconWallet, IconTrendingUp, IconTrendingDown, IconPigMoney } from '@tabler/icons-react';
import { useAnalyticsData } from '../features/analytics/useAnalyticsData';

export default function Overview() {
  const { trendData, monthTotals, totals } = useAnalyticsData();
  const loading = useAppSelector((s) => s.transactions.loading);
  const error = useAppSelector((s) => s.transactions.error);

  return (
    <PageContainer maxWidth={1200}>
      <Title order={2} mb="md">Обзор</Title>
      {loading && <Text c="dimmed" mb="md">Загрузка данных…</Text>}
      {error && <Text c="red" mb="md">Ошибка: {error}</Text>}

      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Баланс (месяц)"
            value={formatRub(monthTotals.balanceM, false)}
            color="indigo"
            icon={<IconWallet size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Доходы (месяц)"
            value={formatRub(monthTotals.incomeM, false)}
            color="teal"
            icon={<IconTrendingUp size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Расходы (месяц)"
            value={formatRub(monthTotals.expensesM, false)}
            color="red"
            icon={<IconTrendingDown size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <StatCard
            label="Накопления (общие)"
            value={formatRub(Math.max(totals.balance * 0.2, 0), false)}
            color="grape"
            icon={<IconPigMoney size={18} />}
          />
        </Grid.Col>
      </Grid>

      <Title order={3} mt="xl" mb="md">Доходы vs Расходы</Title>
      <AreaChart
        h={250}
        data={trendData}
        dataKey="month"
        series={[
          { name: 'income', color: 'teal' },
          { name: 'expenses', color: 'red' },
        ]}
      />
    </PageContainer>
  );
}