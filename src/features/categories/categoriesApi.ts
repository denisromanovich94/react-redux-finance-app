import { supabase } from '../../shared/api/supabase';
import { getUserId } from '../../shared/api/auth';

export type DbCategory = {
  id: string;
  user_id?: string;
  name: string;              
  type: 'income' | 'expense';   
  color: string;                 
  icon?: string | null;          
  created_at?: string;
};

const TABLE = 'categories';

export async function fetchCategories(): Promise<DbCategory[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbCategory[];
}

export async function createCategory(
  cat: Omit<DbCategory, 'id' | 'user_id' | 'created_at'>
): Promise<DbCategory> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ ...cat, user_id: userId }])
    .select()
    .single();
  if (error) throw error;
  return data as DbCategory;
}
