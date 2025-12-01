export type LeadStatus = 'new' | 'contacted' | 'negotiation' | 'won' | 'lost';
export type LeadSource = 'referral' | 'kwork' | 'website' | 'social' | 'phone' | 'other';
export type ContactType = 'email' | 'phone' | 'meeting' | 'note';

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  value?: number; // потенциальная ценность в рублях (для совместимости со старыми данными)
  value_min?: number; // минимальная потенциальная ценность в рублях
  value_max?: number; // максимальная потенциальная ценность в рублях
  probability?: number; // вероятность закрытия (0-100)
  description?: string;
  rejection_reason?: string; // причина отказа (для статуса lost)
  tags: string[];
  assigned_to?: string;
  next_action?: string;
  next_action_date?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface Contact {
  id: string;
  lead_id: string;
  user_id: string;
  type: ContactType;
  subject?: string;
  content: string;
  date: string;
  created_at: string;
}

export interface Deal {
  id: string;
  user_id: string;
  lead_id?: string;
  name: string;
  company?: string;
  amount: number; // сумма сделки в рублях
  stage: LeadStatus;
  probability: number; // 0-100
  expected_close_date?: string;
  actual_close_date?: string;
  description?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CRMStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  wonDeals: number;
  lostDeals: number;
  totalValue: number;
  expectedRevenue: number;
  conversionRate: number;
}

export interface CRMState {
  leads: Lead[];
  contacts: Contact[];
  deals: Deal[];
  stats: CRMStats | null;
  loading: boolean;
  error: string | null;
  filters: {
    status: LeadStatus[];
    source: LeadSource[];
    search: string;
  };
}

export interface CreateLeadInput {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  value?: number;
  value_min?: number;
  value_max?: number;
  probability?: number;
  description?: string;
  rejection_reason?: string;
  tags?: string[];
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  next_action?: string;
  next_action_date?: string;
}

export interface CreateContactInput {
  lead_id: string;
  type: ContactType;
  subject?: string;
  content: string;
  date: string;
}

export interface CreateDealInput {
  lead_id?: string;
  name: string;
  company?: string;
  amount: number;
  stage: LeadStatus;
  probability: number;
  expected_close_date?: string;
  description?: string;
  tags?: string[];
}
