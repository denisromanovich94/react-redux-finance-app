import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CRMState, Deal, CreateLeadInput, UpdateLeadInput, CreateContactInput, CreateDealInput, LeadStatus, LeadSource } from './types';
import { crmApi } from './crmApi';
import { supabase } from '../../shared/api/supabase';

const initialState: CRMState = {
  leads: [],
  contacts: [],
  deals: [],
  stats: null,
  loading: false,
  error: null,
  filters: {
    status: [],
    source: [],
    search: '',
  },
};

export const loadLeads = createAsyncThunk('crm/loadLeads', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return crmApi.fetchLeads(user.id);
});

export const loadContacts = createAsyncThunk('crm/loadContacts', async (leadId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return crmApi.fetchContacts(user.id, leadId);
});

export const loadDeals = createAsyncThunk('crm/loadDeals', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return crmApi.fetchDeals(user.id);
});

export const loadStats = createAsyncThunk('crm/loadStats', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return crmApi.fetchStats(user.id);
});

export const createLeadAsync = createAsyncThunk(
  'crm/createLead',
  async (input: CreateLeadInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return crmApi.createLead(user.id, input);
  }
);

export const updateLeadAsync = createAsyncThunk(
  'crm/updateLead',
  async ({ id, updates }: { id: string; updates: UpdateLeadInput }) => {
    return crmApi.updateLead(id, updates);
  }
);

export const deleteLeadAsync = createAsyncThunk(
  'crm/deleteLead',
  async (id: string) => {
    await crmApi.deleteLead(id);
    return id;
  }
);

export const createContactAsync = createAsyncThunk(
  'crm/createContact',
  async (input: CreateContactInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return crmApi.createContact(user.id, input);
  }
);

export const deleteContactAsync = createAsyncThunk(
  'crm/deleteContact',
  async (id: string) => {
    await crmApi.deleteContact(id);
    return id;
  }
);

export const createDealAsync = createAsyncThunk(
  'crm/createDeal',
  async (input: CreateDealInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return crmApi.createDeal(user.id, input);
  }
);

export const updateDealAsync = createAsyncThunk(
  'crm/updateDeal',
  async ({ id, updates }: { id: string; updates: Partial<Deal> }) => {
    return crmApi.updateDeal(id, updates);
  }
);

export const deleteDealAsync = createAsyncThunk(
  'crm/deleteDeal',
  async (id: string) => {
    await crmApi.deleteDeal(id);
    return id;
  }
);

const crmSlice = createSlice({
  name: 'crm',
  initialState,
  reducers: {
    setStatusFilter: (state, action: PayloadAction<LeadStatus[]>) => {
      state.filters.status = action.payload;
    },
    setSourceFilter: (state, action: PayloadAction<LeadSource[]>) => {
      state.filters.source = action.payload;
    },
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {
        status: [],
        source: [],
        search: '',
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Load leads
      .addCase(loadLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = action.payload;
      })
      .addCase(loadLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load leads';
      })
      // Load contacts
      .addCase(loadContacts.fulfilled, (state, action) => {
        state.contacts = action.payload;
      })
      // Load deals
      .addCase(loadDeals.fulfilled, (state, action) => {
        state.deals = action.payload;
      })
      // Load stats
      .addCase(loadStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Create lead
      .addCase(createLeadAsync.fulfilled, (state, action) => {
        state.leads.unshift(action.payload);
      })
      // Update lead
      .addCase(updateLeadAsync.fulfilled, (state, action) => {
        const index = state.leads.findIndex(l => l.id === action.payload.id);
        if (index !== -1) {
          state.leads[index] = action.payload;
        }
      })
      // Delete lead
      .addCase(deleteLeadAsync.fulfilled, (state, action) => {
        state.leads = state.leads.filter(l => l.id !== action.payload);
      })
      // Create contact
      .addCase(createContactAsync.fulfilled, (state, action) => {
        state.contacts.unshift(action.payload);
      })
      // Delete contact
      .addCase(deleteContactAsync.fulfilled, (state, action) => {
        state.contacts = state.contacts.filter(c => c.id !== action.payload);
      })
      // Create deal
      .addCase(createDealAsync.fulfilled, (state, action) => {
        state.deals.unshift(action.payload);
      })
      // Update deal
      .addCase(updateDealAsync.fulfilled, (state, action) => {
        const index = state.deals.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.deals[index] = action.payload;
        }
      })
      // Delete deal
      .addCase(deleteDealAsync.fulfilled, (state, action) => {
        state.deals = state.deals.filter(d => d.id !== action.payload);
      });
  },
});

export const {
  setStatusFilter,
  setSourceFilter,
  setSearchFilter,
  clearFilters,
} = crmSlice.actions;

export default crmSlice.reducer;
