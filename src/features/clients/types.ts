export interface Client {
  id: string;
  name: string;
  telegram?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  description?: string;
  income_category_id?: string;
  created_at: string;
  user_id: string;
}

export interface ClientsState {
  items: Client[];
  loading: boolean;
  error: string | null;
}
