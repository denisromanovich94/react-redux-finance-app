import { supabase } from '../../shared/api/supabase';
import { getUserId } from '../../shared/api/auth';

export type Transaction = {
  id: string;
  user_id: string;
  date: string;  
  category: string;
  amount: number;   
  created_at?: string;
};

const TABLE = 'transactions';


export async function getTransactions(): Promise<Transaction[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) }));
}


export async function createTransaction(
  tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>
): Promise<Transaction> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');

  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ ...tx, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return { ...data, amount: Number(data.amount) } as Transaction;
}


export async function updateTransaction(
  id: string,
  changes: Partial<Omit<Transaction, 'id' | 'user_id'>>
): Promise<Transaction> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(changes)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { ...data, amount: Number(data.amount) } as Transaction;
}


export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}