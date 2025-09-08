import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counterSlice';
import transactionsReducer from '../features/transactions/transactionsSlice';
import { categoriesReducer } from '../features/categories/categoriesSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    transactions: transactionsReducer,
    categories: categoriesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
