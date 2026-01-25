import { supabase } from '../../shared/api/supabase';
import type {
  AdminUser,
  AdminStats,
  Ticket,
  TicketMessage,
  VpnKey,
  AppModule,
  Subscription,
  CreateVpnKeyInput,
  GrantSubscriptionInput,
  TicketStatus,
} from './types';

export const adminApi = {
  // ==================== ПОЛЬЗОВАТЕЛИ ====================

  async fetchUsers(): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((u) => ({
      ...u,
      role: u.role || 'user',
      subscription_type: u.subscription_type || 'free',
    }));
  },

  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw error;
  },

  // ==================== ПОДПИСКИ ====================

  async grantSubscription(input: GrantSubscriptionInput): Promise<Subscription> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const now = new Date().toISOString();

    // Создаём запись в истории подписок
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: input.user_id,
        type: input.type,
        status: 'active',
        granted_by: user.id,
        reason: input.reason || 'manual_grant',
        starts_at: now,
        expires_at: input.expires_at || null,
      })
      .select()
      .single();

    if (subError) throw subError;

    // Обновляем профиль пользователя
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        subscription_type: input.type,
        subscription_expires_at: input.expires_at || null,
        updated_at: now,
      })
      .eq('user_id', input.user_id);

    if (profileError) throw profileError;

    return subscription;
  },

  async revokeSubscription(userId: string): Promise<void> {
    const now = new Date().toISOString();

    // Отменяем активные подписки
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Сбрасываем подписку в профиле
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_type: 'free',
        subscription_expires_at: null,
        updated_at: now,
      })
      .eq('user_id', userId);

    if (error) throw error;
  },

  // ==================== ТИКЕТЫ ====================

  async fetchTickets(): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        user_profiles!tickets_user_id_fkey (email, telegram)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((t) => ({
      ...t,
      user_email: t.user_profiles?.email,
      user_telegram: t.user_profiles?.telegram,
    }));
  },

  async fetchTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select(`
        *,
        user_profiles!ticket_messages_sender_id_fkey (email)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((m) => ({
      ...m,
      sender_email: m.user_profiles?.email,
    }));
  },

  async sendTicketMessage(ticketId: string, content: string, isAdmin: boolean): Promise<TicketMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        is_admin: isAdmin,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    // Обновляем updated_at тикета
    await supabase
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return data;
  },

  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'closed' || status === 'resolved') {
      updates.closed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticketId);

    if (error) throw error;
  },

  // ==================== VPN КЛЮЧИ ====================

  async fetchVpnKeys(): Promise<VpnKey[]> {
    const { data, error } = await supabase
      .from('vpn_keys')
      .select(`
        *,
        user_profiles!vpn_keys_user_id_fkey (email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((k) => ({
      ...k,
      user_email: k.user_profiles?.email,
    }));
  },

  async createVpnKey(input: CreateVpnKeyInput): Promise<VpnKey> {
    const { data, error } = await supabase
      .from('vpn_keys')
      .insert({
        key_value: input.key_value,
        server_name: input.server_name || null,
        protocol: input.protocol || 'wireguard',
        expires_at: input.expires_at || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async assignVpnKey(keyId: string, userId: string | null): Promise<void> {
    const { error } = await supabase
      .from('vpn_keys')
      .update({
        user_id: userId,
        assigned_at: userId ? new Date().toISOString() : null,
      })
      .eq('id', keyId);

    if (error) throw error;
  },

  async deleteVpnKey(keyId: string): Promise<void> {
    const { error } = await supabase
      .from('vpn_keys')
      .delete()
      .eq('id', keyId);

    if (error) throw error;
  },

  async toggleVpnKey(keyId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('vpn_keys')
      .update({ is_active: isActive })
      .eq('id', keyId);

    if (error) throw error;
  },

  // ==================== МОДУЛИ ====================

  async fetchModules(): Promise<AppModule[]> {
    const { data, error } = await supabase
      .from('app_modules')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async toggleModule(moduleId: string, isEnabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('app_modules')
      .update({ is_enabled: isEnabled })
      .eq('id', moduleId);

    if (error) throw error;
  },

  // ==================== СТАТИСТИКА ====================

  async fetchStats(): Promise<AdminStats> {
    // Получаем пользователей
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('subscription_type');

    if (usersError) throw usersError;

    // Получаем открытые тикеты
    const { count: openTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']);

    if (ticketsError) throw ticketsError;

    // Получаем VPN ключи
    const { data: vpnKeys, error: vpnError } = await supabase
      .from('vpn_keys')
      .select('user_id');

    if (vpnError) throw vpnError;

    const totalUsers = users?.length || 0;
    const premiumUsers = users?.filter((u) => u.subscription_type === 'premium').length || 0;
    const vipUsers = users?.filter((u) => u.subscription_type === 'vip').length || 0;
    const totalVpnKeys = vpnKeys?.length || 0;
    const assignedVpnKeys = vpnKeys?.filter((k) => k.user_id !== null).length || 0;

    return {
      totalUsers,
      premiumUsers,
      vipUsers,
      openTickets: openTickets || 0,
      totalVpnKeys,
      assignedVpnKeys,
    };
  },
};
