import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminApi } from './adminApi';
import type {
  AdminUser,
  AdminStats,
  Ticket,
  TicketMessage,
  VpnKey,
  AppModule,
  CreateVpnKeyInput,
  GrantSubscriptionInput,
  TicketStatus,
} from './types';

interface AdminState {
  // Данные
  users: AdminUser[];
  tickets: Ticket[];
  currentTicketMessages: TicketMessage[];
  vpnKeys: VpnKey[];
  modules: AppModule[];
  stats: AdminStats | null;

  // Загрузка
  usersLoading: boolean;
  ticketsLoading: boolean;
  messagesLoading: boolean;
  vpnLoading: boolean;
  modulesLoading: boolean;
  statsLoading: boolean;

  // Ошибки
  error: string | null;

  // Текущий выбранный тикет
  selectedTicketId: string | null;
}

const initialState: AdminState = {
  users: [],
  tickets: [],
  currentTicketMessages: [],
  vpnKeys: [],
  modules: [],
  stats: null,

  usersLoading: false,
  ticketsLoading: false,
  messagesLoading: false,
  vpnLoading: false,
  modulesLoading: false,
  statsLoading: false,

  error: null,
  selectedTicketId: null,
};

// ==================== ASYNC THUNKS ====================

// Пользователи
export const loadUsers = createAsyncThunk('admin/loadUsers', async () => {
  return adminApi.fetchUsers();
});

export const updateUserRole = createAsyncThunk(
  'admin/updateUserRole',
  async ({ userId, role }: { userId: string; role: 'user' | 'admin' }) => {
    await adminApi.updateUserRole(userId, role);
    return { userId, role };
  }
);

// Подписки
export const grantSubscription = createAsyncThunk(
  'admin/grantSubscription',
  async (input: GrantSubscriptionInput) => {
    await adminApi.grantSubscription(input);
    return input;
  }
);

export const revokeSubscription = createAsyncThunk(
  'admin/revokeSubscription',
  async (userId: string) => {
    await adminApi.revokeSubscription(userId);
    return userId;
  }
);

// Тикеты
export const loadTickets = createAsyncThunk('admin/loadTickets', async () => {
  return adminApi.fetchTickets();
});

export const loadTicketMessages = createAsyncThunk(
  'admin/loadTicketMessages',
  async (ticketId: string) => {
    return adminApi.fetchTicketMessages(ticketId);
  }
);

export const sendTicketMessage = createAsyncThunk(
  'admin/sendTicketMessage',
  async ({ ticketId, content }: { ticketId: string; content: string }) => {
    return adminApi.sendTicketMessage(ticketId, content, true);
  }
);

export const updateTicketStatus = createAsyncThunk(
  'admin/updateTicketStatus',
  async ({ ticketId, status }: { ticketId: string; status: TicketStatus }) => {
    await adminApi.updateTicketStatus(ticketId, status);
    return { ticketId, status };
  }
);

// VPN ключи
export const loadVpnKeys = createAsyncThunk('admin/loadVpnKeys', async () => {
  return adminApi.fetchVpnKeys();
});

export const createVpnKey = createAsyncThunk(
  'admin/createVpnKey',
  async (input: CreateVpnKeyInput) => {
    return adminApi.createVpnKey(input);
  }
);

export const assignVpnKey = createAsyncThunk(
  'admin/assignVpnKey',
  async ({ keyId, userId }: { keyId: string; userId: string | null }) => {
    await adminApi.assignVpnKey(keyId, userId);
    return { keyId, userId };
  }
);

export const deleteVpnKey = createAsyncThunk('admin/deleteVpnKey', async (keyId: string) => {
  await adminApi.deleteVpnKey(keyId);
  return keyId;
});

export const toggleVpnKey = createAsyncThunk(
  'admin/toggleVpnKey',
  async ({ keyId, isActive }: { keyId: string; isActive: boolean }) => {
    await adminApi.toggleVpnKey(keyId, isActive);
    return { keyId, isActive };
  }
);

// Модули
export const loadModules = createAsyncThunk('admin/loadModules', async () => {
  return adminApi.fetchModules();
});

export const toggleModule = createAsyncThunk(
  'admin/toggleModule',
  async ({ moduleId, isEnabled }: { moduleId: string; isEnabled: boolean }) => {
    await adminApi.toggleModule(moduleId, isEnabled);
    return { moduleId, isEnabled };
  }
);

// Статистика
export const loadStats = createAsyncThunk('admin/loadStats', async () => {
  return adminApi.fetchStats();
});

// ==================== SLICE ====================

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    selectTicket: (state, action) => {
      state.selectedTicketId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Пользователи
      .addCase(loadUsers.pending, (state) => {
        state.usersLoading = true;
        state.error = null;
      })
      .addCase(loadUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload;
      })
      .addCase(loadUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.error = action.error.message || 'Failed to load users';
      })

      .addCase(updateUserRole.fulfilled, (state, action) => {
        const user = state.users.find((u) => u.user_id === action.payload.userId);
        if (user) {
          user.role = action.payload.role;
        }
      })

      // Подписки
      .addCase(grantSubscription.fulfilled, (state, action) => {
        const user = state.users.find((u) => u.user_id === action.payload.user_id);
        if (user) {
          user.subscription_type = action.payload.type;
          user.subscription_expires_at = action.payload.expires_at || null;
        }
      })

      .addCase(revokeSubscription.fulfilled, (state, action) => {
        const user = state.users.find((u) => u.user_id === action.payload);
        if (user) {
          user.subscription_type = 'free';
          user.subscription_expires_at = null;
        }
      })

      // Тикеты
      .addCase(loadTickets.pending, (state) => {
        state.ticketsLoading = true;
      })
      .addCase(loadTickets.fulfilled, (state, action) => {
        state.ticketsLoading = false;
        state.tickets = action.payload;
      })
      .addCase(loadTickets.rejected, (state, action) => {
        state.ticketsLoading = false;
        state.error = action.error.message || 'Failed to load tickets';
      })

      .addCase(loadTicketMessages.pending, (state) => {
        state.messagesLoading = true;
      })
      .addCase(loadTicketMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.currentTicketMessages = action.payload;
      })
      .addCase(loadTicketMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.error.message || 'Failed to load messages';
      })

      .addCase(sendTicketMessage.fulfilled, (state, action) => {
        state.currentTicketMessages.push(action.payload);
      })

      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        const ticket = state.tickets.find((t) => t.id === action.payload.ticketId);
        if (ticket) {
          ticket.status = action.payload.status;
          if (action.payload.status === 'closed' || action.payload.status === 'resolved') {
            ticket.closed_at = new Date().toISOString();
          }
        }
      })

      // VPN ключи
      .addCase(loadVpnKeys.pending, (state) => {
        state.vpnLoading = true;
      })
      .addCase(loadVpnKeys.fulfilled, (state, action) => {
        state.vpnLoading = false;
        state.vpnKeys = action.payload;
      })
      .addCase(loadVpnKeys.rejected, (state, action) => {
        state.vpnLoading = false;
        state.error = action.error.message || 'Failed to load VPN keys';
      })

      .addCase(createVpnKey.fulfilled, (state, action) => {
        state.vpnKeys.unshift(action.payload);
      })

      .addCase(assignVpnKey.fulfilled, (state, action) => {
        const key = state.vpnKeys.find((k) => k.id === action.payload.keyId);
        if (key) {
          key.user_id = action.payload.userId;
          key.assigned_at = action.payload.userId ? new Date().toISOString() : null;
        }
      })

      .addCase(deleteVpnKey.fulfilled, (state, action) => {
        state.vpnKeys = state.vpnKeys.filter((k) => k.id !== action.payload);
      })

      .addCase(toggleVpnKey.fulfilled, (state, action) => {
        const key = state.vpnKeys.find((k) => k.id === action.payload.keyId);
        if (key) {
          key.is_active = action.payload.isActive;
        }
      })

      // Модули
      .addCase(loadModules.pending, (state) => {
        state.modulesLoading = true;
      })
      .addCase(loadModules.fulfilled, (state, action) => {
        state.modulesLoading = false;
        state.modules = action.payload;
      })
      .addCase(loadModules.rejected, (state, action) => {
        state.modulesLoading = false;
        state.error = action.error.message || 'Failed to load modules';
      })

      .addCase(toggleModule.fulfilled, (state, action) => {
        const module = state.modules.find((m) => m.id === action.payload.moduleId);
        if (module) {
          module.is_enabled = action.payload.isEnabled;
        }
      })

      // Статистика
      .addCase(loadStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(loadStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(loadStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.error.message || 'Failed to load stats';
      });
  },
});

export const { selectTicket, clearError } = adminSlice.actions;
export default adminSlice.reducer;
