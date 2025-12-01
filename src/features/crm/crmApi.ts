import { supabase } from '../../shared/api/supabase';
import type { Lead, Contact, Deal, CreateLeadInput, UpdateLeadInput, CreateContactInput, CreateDealInput, CRMStats } from './types';

export const crmApi = {
  // Leads CRUD
  async fetchLeads(userId: string): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createLead(userId: string, input: CreateLeadInput): Promise<Lead> {
    const now = new Date().toISOString();
    const newLead = {
      user_id: userId,
      name: input.name,
      company: input.company || null,
      email: input.email || null,
      phone: input.phone || null,
      status: input.status,
      source: input.source,
      value: input.value || null,
      value_min: input.value_min || null,
      value_max: input.value_max || null,
      probability: input.probability || 50,
      description: input.description || null,
      rejection_reason: input.rejection_reason || null,
      tags: input.tags || [],
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('crm_leads')
      .insert(newLead)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  },

  async updateLead(id: string, input: UpdateLeadInput): Promise<Lead> {
    const updateData = {
      ...input,
      updated_at: new Date().toISOString(),
      ...(input.status === 'won' || input.status === 'lost' ? { closed_at: new Date().toISOString() } : {}),
    };

    const { data, error } = await supabase
      .from('crm_leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  },

  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Contacts CRUD
  async fetchContacts(userId: string, leadId?: string): Promise<Contact[]> {
    let query = supabase
      .from('crm_contacts')
      .select('*')
      .eq('user_id', userId);

    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createContact(userId: string, input: CreateContactInput): Promise<Contact> {
    const newContact = {
      user_id: userId,
      ...input,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('crm_contacts')
      .insert(newContact)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Deals CRUD
  async fetchDeals(userId: string): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('crm_deals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createDeal(userId: string, input: CreateDealInput): Promise<Deal> {
    const now = new Date().toISOString();
    const newDeal = {
      user_id: userId,
      lead_id: input.lead_id || null,
      name: input.name,
      company: input.company || null,
      amount: input.amount,
      stage: input.stage,
      probability: input.probability,
      expected_close_date: input.expected_close_date || null,
      description: input.description || null,
      tags: input.tags || [],
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('crm_deals')
      .insert(newDeal)
      .select()
      .single();

    if (error) throw error;
    return data as Deal;
  },

  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
      ...(updates.stage === 'won' || updates.stage === 'lost' ? { actual_close_date: new Date().toISOString() } : {}),
    };

    const { data, error } = await supabase
      .from('crm_deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Deal;
  },

  async deleteDeal(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_deals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Stats
  async fetchStats(userId: string): Promise<CRMStats> {
    const leads = await this.fetchLeads(userId);
    const deals = await this.fetchDeals(userId);

    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === 'new').length;
    const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
    const wonDeals = deals.filter(d => d.stage === 'won').length;
    const lostDeals = deals.filter(d => d.stage === 'lost').length;

    const totalValue = deals
      .filter(d => d.stage === 'won')
      .reduce((sum, d) => sum + d.amount, 0);

    const expectedRevenue = deals
      .filter(d => d.stage !== 'won' && d.stage !== 'lost')
      .reduce((sum, d) => sum + (d.amount * d.probability / 100), 0);

    const conversionRate = totalLeads > 0
      ? (wonDeals / totalLeads) * 100
      : 0;

    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      wonDeals,
      lostDeals,
      totalValue,
      expectedRevenue,
      conversionRate,
    };
  },
};
