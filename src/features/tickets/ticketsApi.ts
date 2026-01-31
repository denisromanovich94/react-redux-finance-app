import { supabase } from '../../shared/api/supabase';
import type { Ticket, TicketMessage, CreateTicketInput } from '../admin/types';

const SUPPORT_LAST_READ_KEY = 'support_last_read_at';

export const ticketsApi = {
  // Сохранить время последнего посещения страницы поддержки
  markSupportAsRead(): void {
    localStorage.setItem(SUPPORT_LAST_READ_KEY, new Date().toISOString());
  },

  // Получить время последнего посещения
  getLastReadAt(): string | null {
    return localStorage.getItem(SUPPORT_LAST_READ_KEY);
  },

  // Проверить количество непрочитанных ответов от поддержки
  async fetchUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const lastReadAt = this.getLastReadAt();

    // Получаем все открытые/в работе тикеты пользователя
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, updated_at')
      .eq('user_id', user.id)
      .in('status', ['open', 'in_progress', 'resolved']);

    if (ticketsError || !tickets || tickets.length === 0) return 0;

    // Получаем сообщения от админа
    const ticketIds = tickets.map(t => t.id);
    let query = supabase
      .from('ticket_messages')
      .select('ticket_id, is_admin, created_at')
      .in('ticket_id', ticketIds)
      .eq('is_admin', true);

    // Если есть время последнего посещения, считаем только новые сообщения
    if (lastReadAt) {
      query = query.gt('created_at', lastReadAt);
    }

    const { data: adminMessages, error: messagesError } = await query;

    if (messagesError || !adminMessages) return 0;

    // Считаем уникальные тикеты с непрочитанными ответами админа
    const ticketsWithUnread = new Set(adminMessages.map(m => m.ticket_id));

    return ticketsWithUnread.size;
  },

  // Получить тикеты текущего пользователя
  async fetchMyTickets(): Promise<Ticket[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Создать новый тикет
  async createTicket(input: CreateTicketInput): Promise<Ticket> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const now = new Date().toISOString();

    // Создаём тикет
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        user_id: user.id,
        subject: input.subject,
        priority: input.priority || 'normal',
        status: 'open',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Добавляем первое сообщение
    const { error: messageError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        is_admin: false,
        content: input.content,
      });

    if (messageError) throw messageError;

    return ticket;
  },

  // Получить сообщения тикета
  async fetchMessages(ticketId: string): Promise<TicketMessage[]> {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Отправить сообщение в тикет
  async sendMessage(ticketId: string, content: string): Promise<TicketMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        is_admin: false,
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
};
