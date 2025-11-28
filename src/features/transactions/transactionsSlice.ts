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


export const loadTransactions = createAsyncThunk<Transaction[]>(
  'transactions/load',
  async () => {
    // Всегда грузим свежие данные из БД для синхронизации между устройствами
    const txs = await getTransactions();
    return txs;
  }
);


export const addTransactionAsync = createAsyncThunk<
  Transaction,
  Omit<Transaction, 'id' | 'user_id' | 'created_at'>
>('transactions/add', async (payload) => {
  return await apiCreateTransaction(payload);
});


export const updateTransactionAsync = createAsyncThunk<
  Transaction,
  { id: string; changes: Partial<Omit<Transaction, 'id' | 'user_id'>> }
>('transactions/update', async ({ id, changes }) => {
  return await apiUpdateTransaction(id, changes);
});


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
    builder

      .addCase(loadTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTransactions.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Не удалось загрузить транзакции';
      })

      .addCase(addTransactionAsync.fulfilled, (state, action: PayloadAction<Transaction>) => {
  state.items.unshift(action.payload);
})
.addCase(updateTransactionAsync.fulfilled, (state, action: PayloadAction<Transaction>) => {
  state.items = state.items.map((t) =>
    t.id === action.payload.id ? action.payload : t
  );
})
.addCase(deleteTransactionAsync.fulfilled, (state, action: PayloadAction<string>) => {
  state.items = state.items.filter((t) => t.id !== action.payload);
});
  },
});

export default slice.reducer;

