import { useEffect, useMemo, useState } from 'react';
import { Grid, Title, Text, Group, Button, ActionIcon, Modal, NumberInput, Stack, Radio } from '@mantine/core';
import PageContainer from '../shared/ui/PageContainer';
import { useAppDispatch, useAppSelector } from '../hooks';
import StatCard from '../shared/ui/StatCard';
import { IconWallet, IconTrendingUp, IconTrendingDown, IconPigMoney, IconChevronLeft, IconChevronRight, IconClock, IconCurrencyDollar, IconChartLine, IconClockHour4, IconPlus } from '@tabler/icons-react';
import { useMediaQuery, useDisclosure } from '@mantine/hooks';
import { loadTransactions, addTransactionAsync } from '../features/transactions/transactionsSlice';
import { convertCurrency, formatCurrencyAmount } from '../features/currency/utils';
import CurrencySwitcher from '../features/currency/ui/CurrencySwitcher';
import ExchangeRatesCard from '../features/currency/ui/ExchangeRatesCard';
import dayjs from '../shared/dayjs';
import { makeSelectMonthlyHours } from '../features/transactions/selectors';

export default function Overview() {
  const dispatch = useAppDispatch();
  const isSmall = useMediaQuery('(max-width: 48em)');

  const loading = useAppSelector((s) => s.transactions.loading);
  const error = useAppSelector((s) => s.transactions.error);
  const transactions = useAppSelector((s) => s.transactions.items);
  const itemsCount = transactions.length;

  // Currency state
  const displayCurrency = useAppSelector((s) => s.currency.displayCurrency);
  const exchangeRates = useAppSelector((s) => s.currency.rates);

  const [selectedMonth, setSelectedMonth] = useState(() => dayjs().format('YYYY-MM'));

  // Модалка корректировки баланса
  const [balanceModalOpened, { open: openBalanceModal, close: closeBalanceModal }] = useDisclosure(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');

  useEffect(() => {
    if (!loading && itemsCount === 0) {
      dispatch(loadTransactions());
    }
  }, [dispatch, loading, itemsCount]);

  // Конвертируем общий баланс в выбранную валюту (все транзакции в рублях)
  const convertedTotalBalance = useMemo(() => {
    let total = 0;
    for (const t of transactions) {
      const converted = convertCurrency(
        t.amount,
        'RUB',  // Все транзакции хранятся в рублях
        displayCurrency,
        exchangeRates
      );
      total += converted;
    }
    return total;
  }, [transactions, displayCurrency, exchangeRates]);

  const displayMonthTotals = useMemo(() => {
    let incomeM = 0;
    let expensesM = 0;

    for (const t of transactions) {
      const d = dayjs(t.date, 'DD.MM.YYYY');
      if (!d.isValid()) continue;

      if (d.format('YYYY-MM') !== selectedMonth) continue;

      // Конвертируем в выбранную валюту (из рублей)
      const convertedAmount = convertCurrency(
        t.amount,
        'RUB',
        displayCurrency,
        exchangeRates
      );

      if (convertedAmount > 0) {
        incomeM += convertedAmount;
      } else {
        expensesM += convertedAmount;
      }
    }

    return {
      incomeM,
      expensesM,
      balanceM: incomeM + expensesM,
    };
  }, [transactions, selectedMonth, displayCurrency, exchangeRates]);

  const selectMonthlyHours = useMemo(() => makeSelectMonthlyHours(selectedMonth), [selectedMonth]);
  const monthlyHours = useAppSelector(selectMonthlyHours);

  const selectedDate = dayjs(selectedMonth, 'YYYY-MM');
  const isCurrentMonth = selectedDate.format('YYYY-MM') === dayjs().format('YYYY-MM');

  const daysPassed = isCurrentMonth ? dayjs().date() : selectedDate.daysInMonth();
  const daysInMonth = selectedDate.daysInMonth();

  // Стоимость работы в час с учетом конвертации валют (из рублей)
  const monthlyHourlyRate = useMemo(() => {
    let totalIncome = 0;
    let totalHours = 0;

    for (const tx of transactions) {
      const date = tx.date; // format: DD.MM.YYYY
      const [, month, year] = date.split('.');
      if (`${year}-${month}` !== selectedMonth) continue;

      if (tx.amount > 0 && tx.hours && tx.hours > 0) {
        const convertedAmount = convertCurrency(
          tx.amount,
          'RUB',
          displayCurrency,
          exchangeRates
        );
        totalIncome += convertedAmount;
        totalHours += tx.hours;
      }
    }

    if (totalHours === 0) return 0;
    return totalIncome / totalHours;
  }, [transactions, selectedMonth, displayCurrency, exchangeRates]);

  // Прогноз дохода с учетом конвертации валют (из рублей)
  const selectedMonthIncome = useMemo(() => {
    let income = 0;
    for (const t of transactions) {
      const tDate = dayjs(t.date, 'DD.MM.YYYY');
      if (tDate.isValid() &&
          tDate.year() === selectedDate.year() &&
          tDate.month() === selectedDate.month() &&
          t.amount > 0) {
        const convertedAmount = convertCurrency(
          t.amount,
          'RUB',
          displayCurrency,
          exchangeRates
        );
        income += convertedAmount;
      }
    }
    return income;
  }, [transactions, selectedDate, displayCurrency, exchangeRates]);

  const projectedIncome = isCurrentMonth && daysPassed > 0
    ? (selectedMonthIncome / daysPassed) * daysInMonth
    : selectedMonthIncome;

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

  const handleBalanceAdjustment = () => {
    if (!adjustmentAmount || adjustmentAmount === 0) {
      closeBalanceModal();
      return;
    }

    const amount = adjustmentType === 'add' ? adjustmentAmount : -adjustmentAmount;

    dispatch(addTransactionAsync({
      date: dayjs().format('DD.MM.YYYY'),
      category: 'Корректировка баланса',
      amount: amount,
      comment: `Корректировка баланса: ${adjustmentType === 'add' ? '+' : '-'}${adjustmentAmount}`,
      hours: 0,
    }));

    setAdjustmentAmount(0);
    setAdjustmentType('add');
    closeBalanceModal();
  };

  return (
    <PageContainer maxWidth={1200}>
      <Group justify="space-between" mb="md">
        <Title order={2}>Обзор</Title>
        <Group gap="md">
          <CurrencySwitcher />
          <Group gap="xs">
            <ActionIcon
              variant="default"
              size={isSmall ? 'lg' : 'md'}
              onClick={handlePrevMonth}
            >
              <IconChevronLeft size={isSmall ? 20 : 16} />
            </ActionIcon>
            <Button
              variant={isCurrentMonth ? 'filled' : 'default'}
              size="xs"
              onClick={handleCurrentMonth}
            >
              {selectedDate.format('MMMM YYYY')}
            </Button>
            <ActionIcon
              variant="default"
              size={isSmall ? 'lg' : 'md'}
              onClick={handleNextMonth}
            >
              <IconChevronRight size={isSmall ? 20 : 16} />
            </ActionIcon>
          </Group>
        </Group>
      </Group>
      {loading && <Text c="dimmed" mb="md">Загрузка данных…</Text>}
      {error && <Text c="red" mb="md">Ошибка: {error}</Text>}

      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} style={{ display: 'flex' }}>
          <StatCard
            label="Баланс (месяц)"
            value={formatCurrencyAmount(displayMonthTotals.balanceM, displayCurrency)}
            color="indigo"
            icon={<IconWallet size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} style={{ display: 'flex' }}>
          <StatCard
            label="Доходы (месяц)"
            value={formatCurrencyAmount(displayMonthTotals.incomeM, displayCurrency)}
            color="teal"
            icon={<IconTrendingUp size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} style={{ display: 'flex' }}>
          <StatCard
            label="Расходы (месяц)"
            value={formatCurrencyAmount(Math.abs(displayMonthTotals.expensesM), displayCurrency)}
            color="red"
            icon={<IconTrendingDown size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} style={{ display: 'flex' }}>
          <StatCard
            label="Накопления (общие)"
            value={formatCurrencyAmount(convertedTotalBalance, displayCurrency)}
            color="grape"
            icon={<IconPigMoney size={18} />}
            action={
              <ActionIcon
                variant="light"
                color="grape"
                size="sm"
                onClick={openBalanceModal}
                title="Корректировка баланса"
              >
                <IconPlus size={14} />
              </ActionIcon>
            }
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} style={{ display: 'flex' }}>
          <StatCard
            label="Часы работы (месяц)"
            value={monthlyHours.toFixed(1)}
            color="blue"
            icon={<IconClock size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} style={{ display: 'flex' }}>
          <StatCard
            label="Стоимость работы в час"
            value={formatCurrencyAmount(monthlyHourlyRate, displayCurrency)}
            color="yellow"
            icon={<IconCurrencyDollar size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} style={{ display: 'flex' }}>
          <StatCard
            label={isCurrentMonth ? "Прогноз на месяц" : "Доход за месяц"}
            value={formatCurrencyAmount(projectedIncome, displayCurrency)}
            color="cyan"
            icon={<IconChartLine size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} style={{ display: 'flex' }}>
          <StatCard
            label="Часы работы в день"
            value={avgHoursPerDay.toFixed(2)}
            color="violet"
            icon={<IconClockHour4 size={18} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} style={{ display: 'flex' }}>
          <ExchangeRatesCard />
        </Grid.Col>

      </Grid>

      <Modal
        opened={balanceModalOpened}
        onClose={closeBalanceModal}
        title="Корректировка баланса"
        styles={{ inner: { right: 0, left: 0 } }}
        centered
      >
        <Stack>
          <Radio.Group
            value={adjustmentType}
            onChange={(value) => setAdjustmentType(value as 'add' | 'subtract')}
            label="Тип операции"
          >
            <Group mt="xs">
              <Radio value="add" label="Добавить" />
              <Radio value="subtract" label="Вычесть" />
            </Group>
          </Radio.Group>

          <NumberInput
            label="Сумма"
            placeholder="Введите сумму"
            value={adjustmentAmount}
            onChange={(value) => setAdjustmentAmount(Number(value) || 0)}
            min={0}
            decimalScale={2}
            fixedDecimalScale
            thousandSeparator=" "
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeBalanceModal}>
              Отмена
            </Button>
            <Button onClick={handleBalanceAdjustment}>
              Применить
            </Button>
          </Group>
        </Stack>
      </Modal>

    </PageContainer>
  );
}
