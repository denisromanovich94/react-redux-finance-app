import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import {
  fetchTransactions,
  createTransaction,
  patchTransaction,
  removeTransaction,
} from './transactionsApi';

export type Transaction = {
  id: string;
  date: string;   
  category: string;  
  amount: number;   
};

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

export const loadTransactions = createAsyncThunk(
  'transactions/load',
  async () => {
    const data = await fetchTransactions();
    return data as Transaction[];
  }
);

export const addTransactionAsync = createAsyncThunk(
  'transactions/add',
  async (tx: Omit<Transaction, 'id'>) => {
    const data = await createTransaction(tx);
    return data as Transaction;
  }
);

export const updateTransactionAsync = createAsyncThunk(
  'transactions/update',
  async ({ id, changes }: { id: string; changes: Partial<Omit<Transaction, 'id'>> }) => {
    const data = await patchTransaction(id, changes);
    return data as Transaction;
  }
);

export const deleteTransactionAsync = createAsyncThunk(
  'transactions/delete',
  async (id: string) => {
    await removeTransaction(id);
    return id;
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {

  },
  extraReducers: (builder) => {
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
      state.error = action.error.message ?? 'Failed to load';
    });

    // add
    builder.addCase(addTransactionAsync.fulfilled, (state, action: PayloadAction<Transaction>) => {
      state.items.unshift(action.payload);
    });

    // update
    builder.addCase(updateTransactionAsync.fulfilled, (state, action: PayloadAction<Transaction>) => {
      const idx = state.items.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    });

    // delete
    builder.addCase(deleteTransactionAsync.fulfilled, (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
    });
  },
});

export default transactionsSlice.reducer;