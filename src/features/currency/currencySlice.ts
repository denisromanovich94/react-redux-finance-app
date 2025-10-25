import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { CurrencyState, CurrencyCode, CurrencyData } from './types';
import { fetchExchangeRates } from './currencyApi';

const initialState: CurrencyState = {
  displayCurrency: (localStorage.getItem('displayCurrency') as CurrencyCode) || 'RUB',
  rates: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

/**
 * Загрузить курсы валют
 */
export const loadExchangeRates = createAsyncThunk<
  CurrencyData,
  void,
  { rejectValue: string }
>(
  'currency/loadRates',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchExchangeRates();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setDisplayCurrency(state, action: PayloadAction<CurrencyCode>) {
      state.displayCurrency = action.payload;
      localStorage.setItem('displayCurrency', action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadExchangeRates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadExchangeRates.fulfilled, (state, action) => {
        state.loading = false;
        state.rates = action.payload;
        state.lastUpdated = action.payload.Timestamp;
        state.error = null;
      })
      .addCase(loadExchangeRates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load exchange rates';
      });
  },
});

export const { setDisplayCurrency } = currencySlice.actions;
export default currencySlice.reducer;
