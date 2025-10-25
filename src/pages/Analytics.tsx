import { useState, useMemo, useEffect } from 'react';
import { Card, Title, Modal, Table, Group, Text, Grid, Button, useMantineColorScheme, Badge, Stack } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { PieChart } from '@mantine/charts';
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
import PageContainer from '../shared/ui/PageContainer';
import { useAnalyticsData } from '../features/analytics/useAnalyticsData';
import { useAppDispatch, useAppSelector } from '../hooks';
import { loadTransactions } from '../features/transactions/transactionsSlice';
import { loadExchangeRates } from '../features/currency/currencySlice';
import { convertCurrency, formatCurrencyAmount } from '../features/currency/utils';
import CurrencySwitcher from '../features/currency/ui/CurrencySwitcher';
import dayjs from '../shared/dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import type { TrendDatum } from '../features/analytics/useAnalyticsData';

dayjs.extend(isBetween);

type TrendWithExtras = TrendDatum & {
  forecast?: number;
  balance?: number;
};

export default function Analytics() {
  const dispatch = useAppDispatch();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const loading = useAppSelector((s) => s.transactions.loading);
  const itemsCount = useAppSelector((s) => s.transactions.items.length);

  // Валюта и курсы
  const displayCurrency = useAppSelector((s) => s.currency.displayCurrency);
  const exchangeRates = useAppSelector((s) => s.currency.rates);

  useEffect(() => {
    if (!loading && itemsCount === 0) {
      dispatch(loadTransactions());
    }
  }, [dispatch, loading, itemsCount]);

  useEffect(() => {
    dispatch(loadExchangeRates());
  }, [dispatch]);

  const [selectedMonth, setSelectedMonth] = useState(() => dayjs().format('YYYY-MM'));
  const [selectedYear, setSelectedYear] = useState(() => dayjs().year());

  const selectedDate = dayjs(selectedMonth, 'YYYY-MM');
  const isCurrentMonth = selectedDate.format('YYYY-MM') === dayjs().format('YYYY-MM');

  const monthStart = selectedDate.startOf('month').toDate();
  const monthEnd = selectedDate.endOf('month').toDate();

  // Данные для месяца (круговые диаграммы)
  const { expenseData, incomeData } = useAnalyticsData({
    from: monthStart,
    to: monthEnd,
  });

  // Данные за весь год для графика
  const yearStart = dayjs().year(selectedYear).startOf('year').toDate();
  const yearEnd = dayjs().year(selectedYear).endOf('year').toDate();
  const { trendData: yearTrendData } = useAnalyticsData({
    from: yearStart,
    to: yearEnd,
  });

  const transactions = useAppSelector((s) => s.transactions.items);

  const [catModal, setCatModal] = useState<{
    open: boolean;
    category: string | null;
    type: 'income' | 'expense' | null;
  }>({
    open: false,
    category: null,
    type: null,
  });

const filteredTx = useMemo(() => {
  if (!catModal.category) return [];

  const inRangeFn = (dateStr: string) => {
    const ts = dayjs(dateStr, 'DD.MM.YYYY').valueOf();
    const fromTs = dayjs(monthStart).startOf('day').valueOf();
    const toTs = dayjs(monthEnd).endOf('day').valueOf();
    return ts >= fromTs && ts <= toTs;
  };
  return transactions.filter((t) => t.category === catModal.category && inRangeFn(t.date));
}, [transactions, catModal.category, monthStart, monthEnd]);

  const openCatModal = (category: string, type: 'income' | 'expense') =>
    setCatModal({ open: true, category, type });

  const closeCatModal = () =>
    setCatModal({ open: false, category: null, type: null });

  const handlePrevMonth = () => {
    setSelectedMonth(prev => dayjs(prev, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM'));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => dayjs(prev, 'YYYY-MM').add(1, 'month').format('YYYY-MM'));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(dayjs().format('YYYY-MM'));
  };

const hourlyRateForCategory = useMemo(() => {
  if (!filteredTx.length) return 0;

  let totalIncome = 0;
  let totalHours = 0;

  for (const tx of filteredTx) {
    if (tx.amount > 0 && tx.hours && tx.hours > 0) {
      totalIncome += tx.amount;
      totalHours += tx.hours;
    }
  }

  if (totalHours === 0) return 0;

  return totalIncome / totalHours;
}, [filteredTx]);

  // Конвертируем данные графика в выбранную валюту
  const trendWithBalance: TrendWithExtras[] = useMemo(() => {
    return yearTrendData.map(d => {
      const convertedIncome = convertCurrency(d.income, 'RUB', displayCurrency, exchangeRates);
      const convertedExpenses = convertCurrency(d.expenses, 'RUB', displayCurrency, exchangeRates);
      return {
        month: d.month,
        income: convertedIncome,
        expenses: convertedExpenses,
        balance: convertedIncome - convertedExpenses,
      };
    });
  }, [yearTrendData, displayCurrency, exchangeRates]);

  // Конвертируем данные круговых диаграмм
  const convertedExpenseData = useMemo(() => {
    return expenseData.map(d => ({
      ...d,
      value: convertCurrency(d.value, 'RUB', displayCurrency, exchangeRates),
    }));
  }, [expenseData, displayCurrency, exchangeRates]);

  const convertedIncomeData = useMemo(() => {
    return incomeData.map(d => ({
      ...d,
      value: convertCurrency(d.value, 'RUB', displayCurrency, exchangeRates),
    }));
  }, [incomeData, displayCurrency, exchangeRates]);

  // Сравнение категорий: текущий месяц vs предыдущий месяц
  const categoryComparison = useMemo(() => {
    const prevMonthStart = selectedDate.subtract(1, 'month').startOf('month');
    const prevMonthEnd = selectedDate.subtract(1, 'month').endOf('month');

    const currentIncomeByCat = new Map<string, number>();
    const currentExpenseByCat = new Map<string, number>();
    const prevIncomeByCat = new Map<string, number>();
    const prevExpenseByCat = new Map<string, number>();

    for (const t of transactions) {
      const tDate = dayjs(t.date, 'DD.MM.YYYY');
      if (!tDate.isValid()) continue;

      const convertedAmount = convertCurrency(Math.abs(t.amount), 'RUB', displayCurrency, exchangeRates);

      // Текущий месяц
      if (tDate.isSame(selectedDate, 'month')) {
        if (t.amount > 0) {
          currentIncomeByCat.set(t.category, (currentIncomeByCat.get(t.category) ?? 0) + convertedAmount);
        } else {
          currentExpenseByCat.set(t.category, (currentExpenseByCat.get(t.category) ?? 0) + convertedAmount);
        }
      }


      if (tDate.isBetween(prevMonthStart, prevMonthEnd, null, '[]')) {
        if (t.amount > 0) {
          prevIncomeByCat.set(t.category, (prevIncomeByCat.get(t.category) ?? 0) + convertedAmount);
        } else {
          prevExpenseByCat.set(t.category, (prevExpenseByCat.get(t.category) ?? 0) + convertedAmount);
        }
      }
    }

    const comparisons: Array<{
      category: string;
      type: 'income' | 'expense';
      current: number;
      previous: number;
      change: number;
      changePercent: number;
      isGood: boolean;
    }> = [];

    // Доходы
    const allIncomeCategories = new Set([...currentIncomeByCat.keys(), ...prevIncomeByCat.keys()]);
    for (const cat of allIncomeCategories) {
      const current = currentIncomeByCat.get(cat) ?? 0;
      const previous = prevIncomeByCat.get(cat) ?? 0;
      const change = current - previous;
      const changePercent = previous > 0 ? (change / previous) * 100 : (current > 0 ? 100 : 0);

      if (current > 0 || previous > 0) {
        comparisons.push({
          category: cat,
          type: 'income',
          current,
          previous,
          change,
          changePercent,
          isGood: change >= 0, // Рост доходов - хорошо
        });
      }
    }

    // Расходы
    const allExpenseCategories = new Set([...currentExpenseByCat.keys(), ...prevExpenseByCat.keys()]);
    for (const cat of allExpenseCategories) {
      const current = currentExpenseByCat.get(cat) ?? 0;
      const previous = prevExpenseByCat.get(cat) ?? 0;
      const change = current - previous;
      const changePercent = previous > 0 ? (change / previous) * 100 : (current > 0 ? 100 : 0);

      if (current > 0 || previous > 0) {
        comparisons.push({
          category: cat,
          type: 'expense',
          current,
          previous,
          change,
          changePercent,
          isGood: change <= 0, // Снижение расходов - хорошо
        });
      }
    }

    return comparisons.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  }, [transactions, selectedDate, displayCurrency, exchangeRates]);

  const handlePrevYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const handleCurrentYear = () => {
    setSelectedYear(dayjs().year());
  };

  return (
    <PageContainer>
      <Card radius="lg" p="lg" withBorder mb="lg">
        <Group justify="space-between" align="center" wrap="wrap">
          <Title order={2}>Аналитика</Title>
          <Group gap="md">
            <CurrencySwitcher />
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
        </Group>
      </Card>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 6, lg: 6 }}>
          <Card radius="lg" p="lg" withBorder style={{ minHeight: '450px' }}>
            <Title order={3} mb="md">
              Расходы по категориям
            </Title>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
              <PieChart
                data={convertedExpenseData}
                withLabels
                withTooltip
                size={320}
                labelsType="percent"
                pieProps={{
                  onClick: (data: { name?: string }) => {
                    if (data?.name) openCatModal(data.name, 'expense');
                  },
                }}
              />
            </div>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 6 }}>
          <Card radius="lg" p="lg" withBorder style={{ minHeight: '450px' }}>
            <Title order={3} mb="md">
              Доходы по категориям
            </Title>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
              <PieChart
                data={convertedIncomeData}
                withLabels
                withTooltip
                size={320}
                labelsType="percent"
                pieProps={{
                  onClick: (data: { name?: string }) => {
                    if (data?.name) openCatModal(data.name, 'income');
                  },
                }}
              />
            </div>
          </Card>
        </Grid.Col>

        <Grid.Col span={12}>
          <Card radius="lg" p="lg" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3}>Доходы vs Расходы за {selectedYear} год</Title>
              <Group gap="xs">
                <Button
                  variant="default"
                  size="xs"
                  leftSection={<IconChevronLeft size={16} />}
                  onClick={handlePrevYear}
                >
                  {selectedYear - 1}
                </Button>
                <Button
                  variant={selectedYear === dayjs().year() ? 'filled' : 'default'}
                  size="xs"
                  onClick={handleCurrentYear}
                >
                  {selectedYear}
                </Button>
                <Button
                  variant="default"
                  size="xs"
                  rightSection={<IconChevronRight size={16} />}
                  onClick={handleNextYear}
                >
                  {selectedYear + 1}
                </Button>
              </Group>
            </Group>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={trendWithBalance}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#ccc'} />
                <XAxis dataKey="month" stroke={isDark ? '#aaa' : '#666'} />
                <YAxis stroke={isDark ? '#aaa' : '#666'} />
                <Tooltip
                  formatter={(value: number) => formatCurrencyAmount(value, displayCurrency)}
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
                <Bar dataKey="expenses" barSize={20} fill="#f72a2aff" name="Расходы" />
                <Bar dataKey="income" barSize={20} fill="#25e93fff" name="Доходы" />
                <Line type="monotone" dataKey="balance" stroke="#805ad5" name="Баланс" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>

        <Grid.Col span={12}>
          <Card radius="lg" p="lg" withBorder>
            <Title order={3} mb="md">
              Сравнение категорий: {selectedDate.format('MMMM')} vs {selectedDate.subtract(1, 'month').format('MMMM')}
            </Title>
            {categoryComparison.length === 0 ? (
              <Text c="dimmed">Нет данных для сравнения</Text>
            ) : (
              <Stack gap="sm">
                {categoryComparison.map((comp, idx) => (
                  <Group key={idx} justify="space-between" wrap="nowrap">
                    <Group gap="xs" style={{ flex: 1 }}>
                      <Badge color={comp.type === 'income' ? 'teal' : 'red'} variant="dot">
                        {comp.category}
                      </Badge>
                      <Text size="sm" c="dimmed">
                        {formatCurrencyAmount(comp.previous, displayCurrency)} → {formatCurrencyAmount(comp.current, displayCurrency)}
                      </Text>
                    </Group>
                    <Badge
                      size="lg"
                      color={comp.isGood ? 'green' : 'red'}
                      variant="light"
                      leftSection={
                        comp.change > 0 ? (
                          <IconTrendingUp size={14} />
                        ) : comp.change < 0 ? (
                          <IconTrendingDown size={14} />
                        ) : null
                      }
                    >
                      {comp.change > 0 ? '+' : ''}{comp.changePercent.toFixed(1)}%
                    </Badge>
                  </Group>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>

      </Grid>

      <Modal
        opened={catModal.open}
        onClose={closeCatModal}
        size="lg"
        title={
          catModal.category ? `Транзакции: ${catModal.category}` : 'Транзакции'
        }
        styles={{ inner: { right: 0, left: 0 } }}
      >
        {filteredTx.length === 0 ? (
  <Text c="dimmed">За выбранный период нет записей.</Text>
) : (
  <>
    {catModal.type === 'income' && (
      <Text mb="sm" fw={500}>
        Стоимость работы в час: {hourlyRateForCategory.toFixed(2)}
      </Text>
    )}
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Дата</Table.Th>
          <Table.Th ta="right">Сумма</Table.Th>
          <Table.Th>Комментарий</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {filteredTx.map((t) => (
          <Table.Tr key={t.id}>
            <Table.Td>{t.date}</Table.Td>
            <Table.Td ta="right">
              <Text c={t.amount < 0 ? 'red' : 'green'}>
                {t.amount.toLocaleString('ru-RU')}
              </Text>
            </Table.Td>
            <Table.Td
              style={{
                maxWidth: 420,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {t.comment ?? '—'}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  </>
)}

      </Modal>
    </PageContainer>
  );
}
