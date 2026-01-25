import { supabase } from '../../shared/api/supabase';
import type { Ticket, TicketMessage, CreateTicketInput } from '../admin/types';

export const ticketsApi = {
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
