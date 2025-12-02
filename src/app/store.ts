import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counterSlice';
import transactionsReducer from '../features/transactions/transactionsSlice';
import { categoriesReducer } from '../features/categories/categoriesSlice';
import timeTrackerReducer from '../features/timetracker/timeTrackerSlice';
import clientsReducer from '../features/clients/clientsSlice';
import currencyReducer from '../features/currency/currencySlice';
import todosReducer from '../features/todos/todosSlice';
import crmReducer from '../features/crm/crmSlice';
import profileReducer from '../features/profile/profileSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    transactions: transactionsReducer,
    categories: categoriesReducer,
    timeTracker: timeTrackerReducer,
    clients: clientsReducer,
    currency: currencyReducer,
    todos: todosReducer,
    crm: crmReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;