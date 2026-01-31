import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ticketsApi } from './ticketsApi';
import type { Ticket, TicketMessage, CreateTicketInput } from '../admin/types';

interface TicketsState {
  tickets: Ticket[];
  currentMessages: TicketMessage[];
  loading: boolean;
  messagesLoading: boolean;
  error: string | null;
  selectedTicketId: string | null;
  unreadCount: number;
}

const initialState: TicketsState = {
  tickets: [],
  currentMessages: [],
  loading: false,
  messagesLoading: false,
  error: null,
  selectedTicketId: null,
  unreadCount: 0,
};

// Async thunks
export const loadUnreadCount = createAsyncThunk('tickets/loadUnreadCount', async () => {
  return ticketsApi.fetchUnreadCount();
});

export const loadMyTickets = createAsyncThunk('tickets/loadMyTickets', async () => {
  return ticketsApi.fetchMyTickets();
});

export const createTicket = createAsyncThunk(
  'tickets/createTicket',
  async (input: CreateTicketInput) => {
    return ticketsApi.createTicket(input);
  }
);

export const loadMessages = createAsyncThunk(
  'tickets/loadMessages',
  async (ticketId: string) => {
    return ticketsApi.fetchMessages(ticketId);
  }
);

export const sendMessage = createAsyncThunk(
  'tickets/sendMessage',
  async ({ ticketId, content }: { ticketId: string; content: string }) => {
    return ticketsApi.sendMessage(ticketId, content);
  }
);

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    selectTicket: (state, action) => {
      state.selectedTicketId = action.payload;
    },
    clearTicketSelection: (state) => {
      state.selectedTicketId = null;
      state.currentMessages = [];
    },
    clearUnreadCount: (state) => {
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load tickets
      .addCase(loadMyTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadMyTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(loadMyTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load tickets';
      })

      // Create ticket
      .addCase(createTicket.fulfilled, (state, action) => {
        state.tickets.unshift(action.payload);
      })

      // Load messages
      .addCase(loadMessages.pending, (state) => {
        state.messagesLoading = true;
      })
      .addCase(loadMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.currentMessages = action.payload;
      })
      .addCase(loadMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.error.message || 'Failed to load messages';
      })

      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.currentMessages.push(action.payload);
      })

      // Unread count
      .addCase(loadUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  },
});

export const { selectTicket, clearTicketSelection, clearUnreadCount } = ticketsSlice.actions;
export default ticketsSlice.reducer;
