import type { UserRole, SubscriptionType } from '../profile/types';

// Пользователь для админки (расширенный)
export interface AdminUser {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  telegram: string | null;
  telegram_id: number | null;
  role: UserRole;
  subscription_type: SubscriptionType;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Статусы тикетов
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

// Тикет
export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  // Для отображения в списке
  user_email?: string;
  user_telegram?: string | null;
  messages_count?: number;
  last_message_at?: string | null;
}

// Сообщение в тикете
export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_admin: boolean;
  content: string;
  created_at: string;
  // Для отображения
  sender_email?: string;
}

// VPN ключ
export interface VpnKey {
  id: string;
  user_id: string | null;
  key_value: string;
  server_name: string | null;
  protocol: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  assigned_at: string | null;
  // Для отображения
  user_email?: string;
}

// Модуль приложения
export interface AppModule {
  id: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  requires_subscription: SubscriptionType[];
  created_at: string;
}

// Подписка (история)
export interface Subscription {
  id: string;
  user_id: string;
  type: SubscriptionType;
  status: 'active' | 'expired' | 'cancelled';
  granted_by: string | null;
  reason: string | null;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

// Статистика для дашборда
export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  vipUsers: number;
  openTickets: number;
  totalVpnKeys: number;
  assignedVpnKeys: number;
}

// Input типы для создания
export interface CreateTicketInput {
  subject: string;
  content: string;
  priority?: TicketPriority;
}

export interface CreateVpnKeyInput {
  key_value: string;
  server_name?: string;
  protocol?: string;
  expires_at?: string;
}

export interface GrantSubscriptionInput {
  user_id: string;
  type: SubscriptionType;
  expires_at?: string;
  reason?: string;
}
