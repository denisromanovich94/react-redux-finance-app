import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
  getTransactions,
  createTransaction as apiCreateTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
  type Transaction,
} from './transactionsApi';

type TransactionsState = {
  items: Transaction[];
  loading: boolean;
  error: string | null;
};

const initialState: TransactionsState = {
  items: [],
  loading: false,
  error: null,
};

// Загрузка всех транзакций текущего пользователя
export const loadTransactions = createAsyncThunk<Transaction[]>(
  'transactions/load',
  async () => {
    return await getTransactions();
  }
);

// Создание транзакции
export const addTransactionAsync = createAsyncThunk<
  Transaction,
  Omit<Transaction, 'id' | 'user_id' | 'created_at'>
>('transactions/add', async (payload) => {
  return await apiCreateTransaction(payload);
});

// Обновление транзакции
export const updateTransactionAsync = createAsyncThunk<
  Transaction,
  { id: string; changes: Partial<Omit<Transaction, 'id' | 'user_id'>> }
>('transactions/update', async ({ id, changes }) => {
  return await apiUpdateTransaction(id, changes);
});

// Удаление транзакции
export const deleteTransactionAsync = createAsyncThunk<string, string>(
  'transactions/delete',
  async (id) => {
    await apiDeleteTransaction(id);
    return id;
  }
);

const slice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // LOAD
    builder.addCase(loadTransactions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadTransactions.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(loadTransactions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message ?? 'Не удалось загрузить транзакции';
    });

    // ADD
    builder.addCase(addTransactionAsync.fulfilled, (state, action: PayloadAction<Transaction>) => {
      state.items.unshift(action.payload);
    });

    // UPDATE
    builder.addCase(updateTransactionAsync.fulfilled, (state, action: PayloadAction<Transaction>) => {
      const idx = state.items.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    });

    // DELETE
    builder.addCase(deleteTransactionAsync.fulfilled, (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
    });
  },
});

export default slice.reducer;
