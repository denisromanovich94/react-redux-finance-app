import { useEffect, useMemo, useState } from 'react';
import { Grid, Title, Text, Group, Button, useMantineColorScheme } from '@mantine/core';
import PageContainer from '../shared/ui/PageContainer';
import { useAppDispatch, useAppSelector } from '../hooks';
import { formatRub } from '../shared/utils/currency';
import StatCard from '../shared/ui/StatCard';
import { IconWallet, IconTrendingUp, IconTrendingDown, IconPigMoney, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useAnalyticsData } from '../features/analytics/useAnalyticsData';
import { loadTransactions } from '../features/transactions/transactionsSlice';
import dayjs from '../shared/dayjs';
import { makeSelectMonthlyHours, makeSelectMonthlyHourlyRate } from '../features/transactions/selectors';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import type { TrendDatum } from '../features/analytics/useAnalyticsData';

type TrendWithExtras = TrendDatum & {
  forecast?: number;
  balance?: number;
};

export default function Overview() {
  const dispatch = useAppDispatch();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const loading = useAppSelector((s) => s.transactions.loading);
  const error = useAppSelector((s) => s.transactions.error);
  const transactions = useAppSelector((s) => s.transactions.items);
  const itemsCount = transactions.length;

  const [selectedMonth, setSelectedMonth] = useState(() => dayjs().format('YYYY-MM'));

  useEffect(() => {
    if (!loading && itemsCount === 0) {
      dispatch(loadTransactions());
    }
  }, [dispatch, loading, itemsCount]);

  const { trendData, totals } = useAnalyticsData();

  const displayMonthTotals = useMemo(() => {
    let incomeM = 0;
    let expensesM = 0;

    for (const t of transactions) {
      const d = dayjs(t.date, 'DD.MM.YYYY');
      if (!d.isValid()) continue;

      if (d.format('YYYY-MM') !== selectedMonth) continue;

      if (t.amount > 0) {
        incomeM += t.amount;
      } else {
        expensesM += t.amount;
      }
    }

    return {
      incomeM,
      expensesM,
      balanceM: incomeM + expensesM,
    };
  }, [transactions, selectedMonth]);

  const selectMonthlyHours = useMemo(() => makeSelectMonthlyHours(selectedMonth), [selectedMonth]);
  const selectMonthlyHourlyRate = useMemo(() => makeSelectMonthlyHourlyRate(selectedMonth), [selectedMonth]);

  const monthlyHours = useAppSelector(selectMonthlyHours);
  const monthlyHourlyRate = useAppSelector(selectMonthlyHourlyRate);

  const selectedDate = dayjs(selectedMonth, 'YYYY-MM');
  const isCurrentMonth = selectedDate.format('YYYY-MM') === dayjs().format('YYYY-MM');

  const daysPassed = isCurrentMonth ? dayjs().date() : selectedDate.daysInMonth();
  const daysInMonth = selectedDate.daysInMonth();

  const selectedMonthIncome = transactions
    .filter(t => {
      const tDate = dayjs(t.date, 'DD.MM.YYYY');
      return tDate.isValid() &&
            tDate.year() === selectedDate.year() &&
            tDate.month() === selectedDate.month() &&
            t.amount > 0;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const projectedIncome = isCurrentMonth && daysPassed > 0
    ? (selectedMonthIncome / daysPassed) * daysInMonth
    : selectedMonthIncome;

  const currentMonthKey = dayjs().format('YYYY-MM');

  const trendWithForecast: TrendWithExtras[] = trendData.map(d => {
    // Прогноз показываем только для текущего месяца
    const monthKey = dayjs(d.month, 'MMM YYYY').format('YYYY-MM');
    const showForecast = monthKey === currentMonthKey;

    return {
      ...d,
      balance: d.income - d.expenses,
      forecast: showForecast ? projectedIncome : undefined,
    };
  });

  const avgHoursPerDay = daysPassed > 0 ? monthlyHours / daysPassed : 0;

  const handlePrevMonth = () => {
    setSelectedMonth(prev => dayjs(prev, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM'));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => dayjs(prev, 'YYYY-MM').add(1, 'month').format('YYYY-MM'));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(dayjs().format('YYYY-MM'));
  };

  return (
    <PageContainer maxWidth={1200}>
      <Group justify="space-between" mb="md">
        <Title order={2}>Обзор</Title>
        <Group gap="xs">
          <Button
            variant="default"
            size="xs"
            leftSection={<IconChevronLeft size={16} />}
            onClick={handlePrevMonth}
          >
            Пред.
          </Button>
          <Button
            variant={isCurrentMonth ? 'filled' : 'default'}
            size="xs"
            onClick={handleCurrentMonth}
          >
            {selectedDate.format('MMMM YYYY')}
          </Button>
          <Button
            variant="default"
            size="xs"
            rightSection={<IconChevronRight size={16} />}
            onClick={handleNextMonth}
          >
            След.
          </Button>
        </Group>
      </Group>
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

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Накопления (общие)"
            value={formatRub(Math.max(totals.balance, 0), false)}
            color="grape"
            icon={<IconPigMoney size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Часы работы (месяц)"
            value={monthlyHours.toFixed(1)}
            icon="🕒"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Стоимость работы в час"
            value={monthlyHourlyRate.toFixed(2)}
            icon="💰"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label={isCurrentMonth ? "Прогноз на месяц" : "Доход за месяц"}
            value={formatRub(projectedIncome, false)}
            color="cyan"
            icon="📈"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Часы работы в день"
            value={avgHoursPerDay.toFixed(2)}
            icon="⏱️"
          />
        </Grid.Col>

      </Grid>

      <Title order={3} mt="xl" mb="md">Доходы vs Расходы</Title>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={trendWithForecast}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#ccc'} />
          <XAxis dataKey="month" stroke={isDark ? '#aaa' : '#666'} />
          <YAxis stroke={isDark ? '#aaa' : '#666'} />
          <Tooltip
            formatter={(value: number) => formatRub(value, false)}
            contentStyle={{
              backgroundColor: isDark ? '#25262b' : '#fff',
              border: `1px solid ${isDark ? '#373A40' : '#e0e0e0'}`,
              borderRadius: '4px',
              color: isDark ? '#C1C2C5' : '#000',
            }}
            labelStyle={{
              color: isDark ? '#C1C2C5' : '#000',
            }}
          />
          <Legend
            wrapperStyle={{
              color: isDark ? '#C1C2C5' : '#000',
            }}
          />
          <Bar dataKey="forecast" barSize={20} fill="#0ea5e9" name="Прогноз" />
          <Bar dataKey="expenses" barSize={20} fill="#f72a2aff" name="Расходы" />
          <Bar dataKey="income" barSize={20} fill="#25e93fff" name="Доходы" />
          <Line type="monotone" dataKey="balance" stroke="#805ad5" name="Баланс" />
        </ComposedChart>
      </ResponsiveContainer>

    </PageContainer>
  );
}
