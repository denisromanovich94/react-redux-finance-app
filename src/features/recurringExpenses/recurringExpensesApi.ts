import { supabase } from '../../shared/api/supabase';
import { getUserId } from '../../shared/api/auth';
import type {
  RecurringExpense,
  RecurringExpenseType,
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput
} from './types';
import dayjs from '../../shared/dayjs';

const EXPENSES_TABLE = 'recurring_expenses';
const TYPES_TABLE = 'recurring_expense_types';

// ====== Типы расходов ======

export async function getRecurringExpenseTypes(): Promise<RecurringExpenseType[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from(TYPES_TABLE)
    .select('*')
    .or(`is_system.eq.true,user_id.eq.${userId}`)
    .order('is_system', { ascending: false })
    .order('name');

  if (error) throw error;
  return (data ?? []) as RecurringExpenseType[];
}

export async function createRecurringExpenseType(
  input: { name: string; icon?: string | null }
): Promise<RecurringExpenseType> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');

  const { data, error } = await supabase
    .from(TYPES_TABLE)
    .insert([{ ...input, user_id: userId, is_system: false }])
    .select()
    .single();

  if (error) throw error;
  return data as RecurringExpenseType;
}

export async function deleteRecurringExpenseType(id: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');

  const { error } = await supabase
    .from(TYPES_TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('is_system', false);

  if (error) throw error;
}

// ====== Повторяющиеся расходы ======

export async function getRecurringExpenses(): Promise<RecurringExpense[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from(EXPENSES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('day_of_month', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((item) => ({
    ...item,
    amount: Number(item.amount),
  })) as RecurringExpense[];
}

export async function createRecurringExpense(
  input: CreateRecurringExpenseInput
): Promise<RecurringExpense> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');

  const { data, error } = await supabase
    .from(EXPENSES_TABLE)
    .insert([{
      ...input,
      user_id: userId,
      start_date: input.start_date || dayjs().format('YYYY-MM-DD'),
      is_active: true,
    }])
    .select()
    .single();

  if (error) throw error;
  return { ...data, amount: Number(data.amount) } as RecurringExpense;
}

export async function updateRecurringExpense(
  id: string,
  input: UpdateRecurringExpenseInput
): Promise<RecurringExpense> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');

  const { data, error } = await supabase
    .from(EXPENSES_TABLE)
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return { ...data, amount: Number(data.amount) } as RecurringExpense;
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');

  const { error } = await supabase
    .from(EXPENSES_TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

// ====== Обработка и создание транзакций ======

export async function processRecurringExpenses(): Promise<{
  created: number;
  processedIds: string[];
}> {
  const userId = await getUserId();
  if (!userId) throw new Error('Нет авторизации');

  const currentMonth = dayjs().format('YYYY-MM');
  const currentDay = dayjs().date();
  const currentDate = dayjs();

  // Получаем активные расходы
  const { data: expenses, error: fetchError } = await supabase
    .from(EXPENSES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (fetchError) throw fetchError;

  // Фильтруем расходы, которые нужно обработать
  const toProcess = (expenses ?? []).filter((exp) => {
    // Проверяем, не обработан ли уже в этом месяце
    if (exp.last_processed_month === currentMonth) return false;

    // Проверяем, наступил ли день платежа
    if (exp.day_of_month > currentDay) return false;

    // Проверяем период действия
    const startDate = dayjs(exp.start_date);
    if (currentDate.isBefore(startDate, 'day')) return false;

    if (exp.end_date) {
      const endDate = dayjs(exp.end_date);
      if (currentDate.isAfter(endDate, 'day')) return false;
    }

    return true;
  });

  const processedIds: string[] = [];

  for (const expense of toProcess) {
    // Формируем дату транзакции (учитываем короткие месяцы)
    const daysInMonth = dayjs().daysInMonth();
    const actualDay = Math.min(expense.day_of_month, daysInMonth);
    const transactionDate = dayjs().date(actualDay).format('DD.MM.YYYY');

    // Создаем транзакцию
    const { error: txError } = await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        date: transactionDate,
        category: 'Регулярные расходы',
        amount: -Math.abs(Number(expense.amount)),  // расход всегда отрицательный
        comment: expense.name,
        client_id: null,
      }]);

    if (txError) {
      console.error('Ошибка создания транзакции:', txError);
      continue;
    }

    // Обновляем last_processed_month
    const { error: updateError } = await supabase
      .from(EXPENSES_TABLE)
      .update({ last_processed_month: currentMonth })
      .eq('id', expense.id);

    if (!updateError) {
      processedIds.push(expense.id);
    }
  }

  return { created: processedIds.length, processedIds };
}

// Получить количество расходов, ожидающих обработки
export async function getPendingExpensesCount(): Promise<number> {
  const userId = await getUserId();
  if (!userId) return 0;

  const currentMonth = dayjs().format('YYYY-MM');
  const currentDay = dayjs().date();

  const { data, error } = await supabase
    .from(EXPENSES_TABLE)
    .select('id, day_of_month, last_processed_month, start_date, end_date')
    .eq('user_id', userId)
    .eq('is_active', true)
    .lte('day_of_month', currentDay);

  if (error) return 0;

  const currentDate = dayjs();

  return (data ?? []).filter((exp) => {
    if (exp.last_processed_month === currentMonth) return false;

    const startDate = dayjs(exp.start_date);
    if (currentDate.isBefore(startDate, 'day')) return false;

    if (exp.end_date) {
      const endDate = dayjs(exp.end_date);
      if (currentDate.isAfter(endDate, 'day')) return false;
    }

    return true;
  }).length;
}
