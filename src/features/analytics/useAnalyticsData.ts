import { useMemo } from 'react';
import { useAppSelector } from '../../hooks';
import type { DefaultMantineColor } from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

type PieDatum = { name: string; value: number; color: DefaultMantineColor };
type TrendDatum = { month: string; income: number; expenses: number };
type Totals = { income: number; expenses: number; balance: number };
type MonthTotals = { incomeM: number; expensesM: number; balanceM: number };

type Range = { from?: Date | null; to?: Date | null };

export function useAnalyticsData(range?: Range) {
  const transactions = useAppSelector((s) => s.transactions.items);
  const categories = useAppSelector((s) => s.categories.items);

  const filtered = useMemo(() => {
    if (!range || (!range.from && !range.to)) {
      return transactions;
    }
    const fromTs = range.from ? dayjs(range.from).startOf('day').valueOf() : -Infinity;
    const toTs = range.to ? dayjs(range.to).endOf('day').valueOf() : Infinity;

    return transactions.filter((t) => {
      const ts = dayjs(t.date, 'DD.MM.YYYY').valueOf();
      return Number.isFinite(ts) && ts >= fromTs && ts <= toTs;
    });
  }, [transactions, range?.from, range?.to]);

  const sumsByCat = useMemo(() => {
    const incomeByCat = new Map<string, number>();
    const expenseByCat = new Map<string, number>();

    for (const t of filtered) {
      if (t.amount > 0) {
        incomeByCat.set(t.category, (incomeByCat.get(t.category) ?? 0) + t.amount);
      } else if (t.amount < 0) {
        expenseByCat.set(t.category, (expenseByCat.get(t.category) ?? 0) + Math.abs(t.amount));
      }
    }

    return { incomeByCat, expenseByCat };
  }, [filtered]);

  const { expenseData, incomeData } = useMemo(() => {
    const expenseData: PieDatum[] = [];
    const incomeData: PieDatum[] = [];

    for (const cat of categories) {
      const exp = sumsByCat.expenseByCat.get(cat.name) ?? 0;
      if (exp > 0) {
        expenseData.push({ name: cat.name, value: exp, color: cat.color as DefaultMantineColor });
      }

      const inc = sumsByCat.incomeByCat.get(cat.name) ?? 0;
      if (inc > 0) {
        incomeData.push({ name: cat.name, value: inc, color: cat.color as DefaultMantineColor });
      }
    }

    return { expenseData, incomeData };
  }, [categories, sumsByCat]);

  const trendData: TrendDatum[] = useMemo(() => {
    const byMonth = new Map<string, TrendDatum>();

    for (const t of filtered) {
      const m = dayjs(t.date, 'DD.MM.YYYY').locale('ru');
      if (!m.isValid()) {
        continue;
      }

      const key = m.format('MMM YYYY');

      if (!byMonth.has(key)) {
        byMonth.set(key, { month: key, income: 0, expenses: 0 });
      }

      const bucket = byMonth.get(key)!;

      if (t.amount > 0) {
        bucket.income += t.amount;
      } else {
        bucket.expenses += Math.abs(t.amount);
      }
    }

    return Array.from(byMonth.values()).sort(
      (a, b) =>
        dayjs(a.month, 'MMM YYYY', 'ru').valueOf() -
        dayjs(b.month, 'MMM YYYY', 'ru').valueOf()
    );
  }, [filtered]);

  const totals: Totals = useMemo(() => {
    let income = 0;
    let expenses = 0;

    for (const t of filtered) {
      if (t.amount > 0) {
        income += t.amount;
      } else if (t.amount < 0) {
        expenses += t.amount;
      }
    }

    return { income, expenses, balance: income + expenses };
  }, [filtered]);

  const monthTotals: MonthTotals = useMemo(() => {
    const now = dayjs();
    let incomeM = 0;
    let expensesM = 0;

    for (const t of transactions) {
      const d = dayjs(t.date, 'DD.MM.YYYY');
      if (!d.isValid() || !d.isSame(now, 'month')) {
        continue;
      }
      if (t.amount > 0) {
        incomeM += t.amount;
      } else if (t.amount < 0) {
        expensesM += t.amount;
      }
    }

    return { incomeM, expensesM, balanceM: incomeM + expensesM };
  }, [transactions]);

  return {
    expenseData,
    incomeData,
    trendData,
    totals,
    monthTotals,
  };
}
