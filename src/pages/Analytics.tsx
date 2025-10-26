import { useState, useMemo, useEffect } from 'react';
import { Card, Title, Modal, Table, Group, Text, Grid, Button, useMantineColorScheme, Badge, Stack, Progress, Divider, RingProgress, Center } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconArrowUp, IconArrowDown } from '@tabler/icons-react';
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
              <Grid gutter="lg">
                {/* ТОП-5 по изменениям */}
                <Grid.Col span={{ base: 12, lg: 6 }}>
                  <Title order={4} mb="md" c="dimmed" size="h5">
                    ТОП-5 по изменениям
                  </Title>
                  <Stack gap="lg">
                    {categoryComparison.slice(0, 5).map((comp, idx) => {
                      const maxValue = Math.max(comp.current, comp.previous);
                      const currentPercent = maxValue > 0 ? (comp.current / maxValue) * 100 : 0;
                      const previousPercent = maxValue > 0 ? (comp.previous / maxValue) * 100 : 0;

                      return (
                        <div key={idx}>
                          <Group justify="space-between" mb={4}>
                            <Group gap="xs">
                              <Badge color={comp.type === 'income' ? 'teal' : 'red'} variant="dot" size="sm">
                                {comp.category}
                              </Badge>
                            </Group>
                            <Badge
                              color={comp.isGood ? 'green' : 'red'}
                              variant="light"
                              leftSection={
                                comp.change > 0 ? (
                                  <IconArrowUp size={12} />
                                ) : comp.change < 0 ? (
                                  <IconArrowDown size={12} />
                                ) : null
                              }
                            >
                              {comp.change > 0 ? '+' : ''}{comp.changePercent.toFixed(1)}%
                            </Badge>
                          </Group>

                          <Stack gap={4}>
                            <Group justify="space-between">
                              <Text size="xs" c="dimmed">Предыдущий месяц:</Text>
                              <Text size="xs" fw={500}>{formatCurrencyAmount(comp.previous, displayCurrency)}</Text>
                            </Group>
                            <Progress
                              value={previousPercent}
                              color="gray"
                              size="sm"
                              radius="xl"
                            />

                            <Group justify="space-between" mt={4}>
                              <Text size="xs" c="dimmed">Текущий месяц:</Text>
                              <Text size="xs" fw={500}>{formatCurrencyAmount(comp.current, displayCurrency)}</Text>
                            </Group>
                            <Progress
                              value={currentPercent}
                              color={comp.isGood ? 'green' : 'red'}
                              size="sm"
                              radius="xl"
                            />
                          </Stack>
                          {idx < 4 && <Divider my="xs" />}
                        </div>
                      );
                    })}
                  </Stack>
                </Grid.Col>

                {/* Общая статистика по типам */}
                <Grid.Col span={{ base: 12, lg: 6 }}>
                  <Title order={4} mb="md" c="dimmed" size="h5">
                    Общая статистика
                  </Title>
                  <Stack gap="xl">
                    {/* Доходы */}
                    {(() => {
                      const incomeComps = categoryComparison.filter(c => c.type === 'income');
                      const totalIncomeCurrent = incomeComps.reduce((sum, c) => sum + c.current, 0);
                      const totalIncomePrevious = incomeComps.reduce((sum, c) => sum + c.previous, 0);
                      const incomeChange = totalIncomeCurrent - totalIncomePrevious;
                      const incomeChangePercent = totalIncomePrevious > 0
                        ? (incomeChange / totalIncomePrevious) * 100
                        : (totalIncomeCurrent > 0 ? 100 : 0);

                      return (
                        <Card withBorder p="md" radius="md" style={{ backgroundColor: isDark ? '#1a1b1e' : '#f8f9fa' }}>
                          <Group justify="space-between" mb="md">
                            <Group gap="xs">
                              <Text fw={600} size="lg">Доходы</Text>
                              <Badge color="teal" variant="light">
                                {incomeComps.length} {incomeComps.length === 1 ? 'категория' : 'категорий'}
                              </Badge>
                            </Group>
                            <Badge
                              size="lg"
                              color={incomeChange >= 0 ? 'green' : 'red'}
                              variant="filled"
                            >
                              {incomeChange > 0 ? '+' : ''}{incomeChangePercent.toFixed(1)}%
                            </Badge>
                          </Group>
                          <Center>
                            <RingProgress
                              size={180}
                              thickness={16}
                              sections={[
                                {
                                  value: Math.min(100, Math.abs(incomeChangePercent)),
                                  color: incomeChange >= 0 ? 'green' : 'red'
                                },
                              ]}
                              label={
                                <Center>
                                  <Stack gap={0} align="center">
                                    <Text size="xs" c="dimmed">Изменение</Text>
                                    <Text fw={700} size="xl">
                                      {incomeChange > 0 ? '+' : ''}{incomeChangePercent.toFixed(0)}%
                                    </Text>
                                  </Stack>
                                </Center>
                              }
                            />
                          </Center>
                          <Stack gap="xs" mt="md">
                            <Group justify="space-between">
                              <Text size="sm" c="dimmed">Предыдущий:</Text>
                              <Text size="sm" fw={500}>{formatCurrencyAmount(totalIncomePrevious, displayCurrency)}</Text>
                            </Group>
                            <Group justify="space-between">
                              <Text size="sm" c="dimmed">Текущий:</Text>
                              <Text size="sm" fw={600} c="teal">{formatCurrencyAmount(totalIncomeCurrent, displayCurrency)}</Text>
                            </Group>
                          </Stack>
                        </Card>
                      );
                    })()}

                    {/* Расходы */}
                    {(() => {
                      const expenseComps = categoryComparison.filter(c => c.type === 'expense');
                      const totalExpenseCurrent = expenseComps.reduce((sum, c) => sum + c.current, 0);
                      const totalExpensePrevious = expenseComps.reduce((sum, c) => sum + c.previous, 0);
                      const expenseChange = totalExpenseCurrent - totalExpensePrevious;
                      const expenseChangePercent = totalExpensePrevious > 0
                        ? (expenseChange / totalExpensePrevious) * 100
                        : (totalExpenseCurrent > 0 ? 100 : 0);

                      return (
                        <Card withBorder p="md" radius="md" style={{ backgroundColor: isDark ? '#1a1b1e' : '#f8f9fa' }}>
                          <Group justify="space-between" mb="md">
                            <Group gap="xs">
                              <Text fw={600} size="lg">Расходы</Text>
                              <Badge color="red" variant="light">
                                {expenseComps.length} {expenseComps.length === 1 ? 'категория' : 'категорий'}
                              </Badge>
                            </Group>
                            <Badge
                              size="lg"
                              color={expenseChange <= 0 ? 'green' : 'red'}
                              variant="filled"
                            >
                              {expenseChange > 0 ? '+' : ''}{expenseChangePercent.toFixed(1)}%
                            </Badge>
                          </Group>
                          <Center>
                            <RingProgress
                              size={180}
                              thickness={16}
                              sections={[
                                {
                                  value: Math.min(100, Math.abs(expenseChangePercent)),
                                  color: expenseChange <= 0 ? 'green' : 'red'
                                },
                              ]}
                              label={
                                <Center>
                                  <Stack gap={0} align="center">
                                    <Text size="xs" c="dimmed">Изменение</Text>
                                    <Text fw={700} size="xl">
                                      {expenseChange > 0 ? '+' : ''}{expenseChangePercent.toFixed(0)}%
                                    </Text>
                                  </Stack>
                                </Center>
                              }
                            />
                          </Center>
                          <Stack gap="xs" mt="md">
                            <Group justify="space-between">
                              <Text size="sm" c="dimmed">Предыдущий:</Text>
                              <Text size="sm" fw={500}>{formatCurrencyAmount(totalExpensePrevious, displayCurrency)}</Text>
                            </Group>
                            <Group justify="space-between">
                              <Text size="sm" c="dimmed">Текущий:</Text>
                              <Text size="sm" fw={600} c="red">{formatCurrencyAmount(totalExpenseCurrent, displayCurrency)}</Text>
                            </Group>
                          </Stack>
                        </Card>
                      );
                    })()}
                  </Stack>
                </Grid.Col>
              </Grid>
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
