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
    const q = dateQuery.trim().toLowerCase();
    const result: typeof items = [];

    for (const i of items) {
      if (filterCategory && i.category !== filterCategory) continue;
      if (typeFilter === 'income' && i.amount <= 0) continue;
      if (typeFilter === 'expense' && i.amount >= 0) continue;
      if (q && !i.date.toLowerCase().includes(q)) continue;
      result.push(i);
    }

    return result;
  });
