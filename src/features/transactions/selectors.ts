import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

export type TypeFilter = 'all' | 'income' | 'expense';

export const selectTransactionCategoryNames = createSelector(
  [(state: RootState) => state.transactions.items],
  (items) => Array.from(new Set(items.map((i) => i.category)))
);


export const makeSelectVisibleTransactions = (
  filterCategory: string | null,
  typeFilter: TypeFilter,
  dateQuery: string
) =>
  createSelector([(state: RootState) => state.transactions.items], (items) => {
    const q = dateQuery.trim();
    const result: typeof items = [];

    for (const i of items) {
      if (filterCategory && i.category !== filterCategory) continue;
      if (typeFilter === 'income' && i.amount <= 0) continue;
      if (typeFilter === 'expense' && i.amount >= 0) continue;

      // Фильтрация по месяцу в формате YYYY-MM
      if (q) {
        // Дата в формате DD.MM.YYYY, извлекаем MM.YYYY
        const [, month, year] = i.date.split('.');
        const transactionYearMonth = `${year}-${month}`;
        if (transactionYearMonth !== q) continue;
      }

      result.push(i);
    }

    return result;
  });


export const selectTotalHours = createSelector(
  (state: RootState) => state.transactions.items,
  (items) =>
    items.reduce((sum, t) => sum + (t.hours ?? 0), 0)
);

export const makeSelectMonthlyHours = (yearMonth: string) =>
  createSelector(
    [(state: RootState) => state.transactions.items],
    (items) => {
      return items
        .filter(t => {
          const date = t.date; // format: DD.MM.YYYY
          const [, month, year] = date.split('.');
          return `${year}-${month}` === yearMonth;
        })
        .reduce((sum, t) => sum + (t.hours ?? 0), 0);
    }
  );

export const selectHourlyRate = createSelector(
  [(state: RootState) => state.transactions.items],
  (items) => {
    let totalIncome = 0;
    let totalHours = 0;

    for (const tx of items) {
      if (tx.amount > 0 && tx.hours && tx.hours > 0) {
        totalIncome += tx.amount;
        totalHours += tx.hours;
      }
    }

    if (totalHours === 0) return 0;

    return totalIncome / totalHours;
  }
);

export const makeSelectMonthlyHourlyRate = (yearMonth: string) =>
  createSelector(
    [(state: RootState) => state.transactions.items],
    (items) => {
      let totalIncome = 0;
      let totalHours = 0;

      for (const tx of items) {
        const date = tx.date; // format: DD.MM.YYYY
        const [, month, year] = date.split('.');
        if (`${year}-${month}` !== yearMonth) continue;

        if (tx.amount > 0 && tx.hours && tx.hours > 0) {
          totalIncome += tx.amount;
          totalHours += tx.hours;
        }
      }

      if (totalHours === 0) return 0;

      return totalIncome / totalHours;
    }
  );


export const selectCategoryUsageCount = createSelector(
  [(state: RootState) => state.transactions.items],
  (transactions) => {
    const countMap: Record<string, number> = {};
    for (const tx of transactions) {
      countMap[tx.category] = (countMap[tx.category] || 0) + 1;
    }
    return countMap;
  }
);


