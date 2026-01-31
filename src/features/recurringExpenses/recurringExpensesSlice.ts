import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
  getRecurringExpenses,
  getRecurringExpenseTypes,
  createRecurringExpense as apiCreate,
  updateRecurringExpense as apiUpdate,
  deleteRecurringExpense as apiDelete,
  createRecurringExpenseType as apiCreateType,
  deleteRecurringExpenseType as apiDeleteType,
  processRecurringExpenses as apiProcess,
} from './recurringExpensesApi';
import type {
  RecurringExpense,
  RecurringExpenseType,
  RecurringExpensesState,
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput
} from './types';
import type { RootState } from '../../app/store';
import dayjs from '../../shared/dayjs';

const initialState: RecurringExpensesState = {
  items: [],
  types: [],
  loading: false,
  typesLoading: false,
  error: null,
  processingStatus: 'idle',
  lastProcessedAt: null,
};

// ====== Thunks ======

export const loadRecurringExpenses = createAsyncThunk<RecurringExpense[]>(
  'recurringExpenses/load',
  async () => await getRecurringExpenses()
);

export const loadRecurringExpenseTypes = createAsyncThunk<RecurringExpenseType[]>(
  'recurringExpenses/loadTypes',
  async () => await getRecurringExpenseTypes()
);

export const addRecurringExpense = createAsyncThunk<
  RecurringExpense,
  CreateRecurringExpenseInput
>('recurringExpenses/add', async (input) => await apiCreate(input));

export const updateRecurringExpenseAsync = createAsyncThunk<
  RecurringExpense,
  { id: string; changes: UpdateRecurringExpenseInput }
>('recurringExpenses/update', async ({ id, changes }) => await apiUpdate(id, changes));

export const deleteRecurringExpenseAsync = createAsyncThunk<string, string>(
  'recurringExpenses/delete',
  async (id) => {
    await apiDelete(id);
    return id;
  }
);

export const addRecurringExpenseType = createAsyncThunk<
  RecurringExpenseType,
  { name: string; icon?: string | null }
>('recurringExpenses/addType', async (input) => await apiCreateType(input));

export const deleteRecurringExpenseTypeAsync = createAsyncThunk<string, string>(
  'recurringExpenses/deleteType',
  async (id) => {
    await apiDeleteType(id);
    return id;
  }
);

export const processRecurringExpensesAsync = createAsyncThunk<
  { created: number; processedIds: string[] }
>('recurringExpenses/process', async () => await apiProcess());

// ====== Slice ======

const slice = createSlice({
  name: 'recurringExpenses',
  initialState,
  reducers: {
    resetProcessingStatus(state) {
      state.processingStatus = 'idle';
    },
    updateLocalProcessedMonth(state, action: PayloadAction<{ id: string; month: string }>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        item.last_processed_month = action.payload.month;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Load expenses
      .addCase(loadRecurringExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRecurringExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadRecurringExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Ошибка загрузки';
      })

      // Load types
      .addCase(loadRecurringExpenseTypes.pending, (state) => {
        state.typesLoading = true;
      })
      .addCase(loadRecurringExpenseTypes.fulfilled, (state, action) => {
        state.typesLoading = false;
        state.types = action.payload;
      })
      .addCase(loadRecurringExpenseTypes.rejected, (state) => {
        state.typesLoading = false;
      })

      // Add expense
      .addCase(addRecurringExpense.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.items.sort((a, b) => a.day_of_month - b.day_of_month);
      })

      // Update expense
      .addCase(updateRecurringExpenseAsync.fulfilled, (state, action) => {
        state.items = state.items.map((e) =>
          e.id === action.payload.id ? action.payload : e
        );
      })

      // Delete expense
      .addCase(deleteRecurringExpenseAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => e.id !== action.payload);
      })

      // Add type
      .addCase(addRecurringExpenseType.fulfilled, (state, action) => {
        state.types.push(action.payload);
      })

      // Delete type
      .addCase(deleteRecurringExpenseTypeAsync.fulfilled, (state, action) => {
        state.types = state.types.filter((t) => t.id !== action.payload);
      })

      // Process recurring expenses
      .addCase(processRecurringExpensesAsync.pending, (state) => {
        state.processingStatus = 'processing';
      })
      .addCase(processRecurringExpensesAsync.fulfilled, (state, action) => {
        state.processingStatus = 'success';
        state.lastProcessedAt = new Date().toISOString();
        // Обновляем last_processed_month у обработанных расходов
        const currentMonth = dayjs().format('YYYY-MM');
        for (const id of action.payload.processedIds) {
          const item = state.items.find((i) => i.id === id);
          if (item) {
            item.last_processed_month = currentMonth;
          }
        }
      })
      .addCase(processRecurringExpensesAsync.rejected, (state) => {
        state.processingStatus = 'error';
      });
  },
});

export const { resetProcessingStatus, updateLocalProcessedMonth } = slice.actions;
export default slice.reducer;

// ====== Selectors ======

export const selectRecurringExpenses = (state: RootState) =>
  state.recurringExpenses.items;

export const selectRecurringExpensesLoading = (state: RootState) =>
  state.recurringExpenses.loading;

export const selectActiveRecurringExpenses = (state: RootState) =>
  state.recurringExpenses.items.filter((e) => e.is_active);

export const selectMonthlyTotal = (state: RootState) =>
  state.recurringExpenses.items
    .filter((e) => e.is_active)
    .reduce((sum, e) => sum + e.amount, 0);

export const selectRecurringExpenseTypes = (state: RootState) =>
  state.recurringExpenses.types;

export const selectProcessingStatus = (state: RootState) =>
  state.recurringExpenses.processingStatus;

export const selectPendingExpenses = (state: RootState) => {
  const currentMonth = dayjs().format('YYYY-MM');
  const currentDay = dayjs().date();
  const currentDate = dayjs();

  return state.recurringExpenses.items.filter((e) => {
    if (!e.is_active) return false;
    if (e.last_processed_month === currentMonth) return false;
    if (e.day_of_month > currentDay) return false;

    const startDate = dayjs(e.start_date);
    if (currentDate.isBefore(startDate, 'day')) return false;

    if (e.end_date) {
      const endDate = dayjs(e.end_date);
      if (currentDate.isAfter(endDate, 'day')) return false;
    }

    return true;
  });
};
