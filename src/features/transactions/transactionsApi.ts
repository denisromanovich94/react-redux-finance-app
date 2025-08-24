import { supabase } from '../../shared/api/supabase';
import { getUserId } from '../../shared/api/auth';

export type DbTransaction = {
  id: string;
  date: string;
  category: string;
  amount: number;
  user_id?: string; 
};

const TABLE = 'transactions';

export async function fetchTransactions(): Promise<DbTransaction[]> {
  const userId = await getUserId();
  if (!userId) {

    return [];
  }
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) }));
}

export async function createTransaction(
  tx: Omit<DbTransaction, 'id' | 'user_id'>
): Promise<DbTransaction> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');

  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ ...tx, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return { ...data, amount: Number(data.amount) } as DbTransaction;
}

export async function patchTransaction(
  id: string,
  changes: Partial<Omit<DbTransaction, 'id' | 'user_id'>>
): Promise<DbTransaction> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');

  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...changes })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return { ...data, amount: Number(data.amount) } as DbTransaction;
}

export async function removeTransaction(id: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}
