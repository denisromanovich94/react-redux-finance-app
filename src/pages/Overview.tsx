import { useEffect, useMemo } from 'react';
import { Grid, Title, Text } from '@mantine/core';
import PageContainer from '../shared/ui/PageContainer';
import { AreaChart } from '@mantine/charts';
import { useAppDispatch, useAppSelector } from '../hooks';
import { formatRub } from '../shared/utils/currency';
import StatCard from '../shared/ui/StatCard';
import { IconWallet, IconTrendingUp, IconTrendingDown, IconPigMoney } from '@tabler/icons-react';
import { useAnalyticsData } from '../features/analytics/useAnalyticsData';
import { loadTransactions } from '../features/transactions/transactionsSlice';
import dayjs from '../shared/dayjs';

export default function Overview() {
  const dispatch = useAppDispatch();

  const loading = useAppSelector((s) => s.transactions.loading);
  const error = useAppSelector((s) => s.transactions.error);
  const transactions = useAppSelector((s) => s.transactions.items);
  const itemsCount = transactions.length;

  useEffect(() => {
    if (!loading && itemsCount === 0) {
      dispatch(loadTransactions());
    }
  }, [dispatch, loading, itemsCount]);

  const { trendData, monthTotals, totals } = useAnalyticsData();

  const displayMonthTotals = useMemo(() => {
    const hasDataNow =
      monthTotals.incomeM !== 0 || monthTotals.expensesM !== 0 || monthTotals.balanceM !== 0;

    if (hasDataNow || transactions.length === 0) {
      return monthTotals;
    }

    const byMonth = new Map<string, { incomeM: number; expensesM: number; balanceM: number }>();
    for (const t of transactions) {
      const d = dayjs(t.date, 'DD.MM.YYYY');
      if (!d.isValid()) continue;
      const key = d.format('YYYY-MM');
      if (!byMonth.has(key)) byMonth.set(key, { incomeM: 0, expensesM: 0, balanceM: 0 });
      const bucket = byMonth.get(key)!;
      if (t.amount > 0) {
        bucket.incomeM += t.amount;
      } else {
        bucket.expensesM += t.amount; 
      }
      bucket.balanceM = bucket.incomeM + bucket.expensesM;
    }

    if (byMonth.size === 0) return monthTotals;

    const keys = Array.from(byMonth.keys()).sort();
    const latestKey = keys[keys.length - 1];
    return byMonth.get(latestKey)!;
  }, [monthTotals, transactions]);

  return (
    <PageContainer maxWidth={1200}>
      <Title order={2} mb="md">Обзор</Title>
      {loading && <Text c="dimmed" mb="md">Загрузка данных…</Text>}
      {error && <Text c="red" mb="md">Ошибка: {error}</Text>}

      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Баланс (месяц)"
            value={formatRub(displayMonthTotals.balanceM, false)}
            color="indigo"
            icon={<IconWallet size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Доходы (месяц)"
            value={formatRub(displayMonthTotals.incomeM, false)}
            color="teal"
            icon={<IconTrendingUp size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Расходы (месяц)"
            value={formatRub(Math.abs(displayMonthTotals.expensesM), false)}
            color="red"
            icon={<IconTrendingDown size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <StatCard
            label="Накопления (общие)"
            value={formatRub(Math.max(totals.balance, 0), false)}
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
        withLegend
        withTooltip
      />
    </PageContainer>
  );
}
