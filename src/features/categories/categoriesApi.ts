import { supabase } from '../../shared/api/supabase';
import { getUserId } from '../../shared/api/auth';

export type Category = {
  id: string;
  user_id?: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string | null;
  client_ids?: string[];
  created_at?: string;
};

const TABLE = 'categories';

export async function getCategories(): Promise<Category[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createCategory(
  cat: Omit<Category, 'id' | 'user_id' | 'created_at'>
): Promise<Category> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');

  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ ...cat, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  id: string,
  changes: Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>
): Promise<Category> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');

  const { data, error } = await supabase
    .from(TABLE)
    .update(changes)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}


