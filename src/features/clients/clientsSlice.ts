import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../shared/api/supabase';
import type { Client, ClientsState } from './types';

const initialState: ClientsState = {
  items: [],
  loading: false,
  error: null,
};

export const loadClients = createAsyncThunk<Client[], void, { rejectValue: string }>(
  'clients/load',
  async (_, { rejectWithValue }) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Не авторизован');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      return rejectWithValue(err.message || 'Ошибка загрузки клиентов');
    }
  }
);

export const addClient = createAsyncThunk<Client, Omit<Client, 'id' | 'created_at' | 'user_id'>, { rejectValue: string }>(
  'clients/add',
  async (clientData, { rejectWithValue }) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Не авторизован');

      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...clientData, user_id: user.user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Ошибка добавления клиента');
    }
  }
);

export const updateClient = createAsyncThunk<Client, { id: string; data: Partial<Client> }, { rejectValue: string }>(
  'clients/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const { data: updated, error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Ошибка обновления клиента');
    }
  }
);

export const deleteClient = createAsyncThunk<string, string, { rejectValue: string }>(
  'clients/delete',
  async (id, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Ошибка удаления клиента');
    }
  }
);

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Load
      .addCase(loadClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadClients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Ошибка';
      })
      // Add
      .addCase(addClient.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // Update
      .addCase(updateClient.fulfilled, (state, action) => {
        const index = state.items.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.items = state.items.filter(c => c.id !== action.payload);
      });
  },
});

export default clientsSlice.reducer;
