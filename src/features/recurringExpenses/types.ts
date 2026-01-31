// Тип повторяющегося расхода (кредит, аренда, ипотека и т.д.)
export type RecurringExpenseType = {
  id: string;
  user_id: string | null;  // null для системных типов
  name: string;
  icon: string | null;
  is_system: boolean;
  created_at: string;
};

// Повторяющийся расход
export type RecurringExpense = {
  id: string;
  user_id: string;
  name: string;
  type_id: string | null;
  amount: number;  // в рублях
  day_of_month: number;  // 1-31
  start_date: string;  // ISO date (YYYY-MM-DD)
  end_date: string | null;  // ISO date или null (бессрочно)
  category_id: string | null;
  comment: string | null;
  is_active: boolean;
  last_processed_month: string | null;  // 'YYYY-MM'
  created_at: string;
  updated_at: string;
};

// Для создания
export type CreateRecurringExpenseInput = {
  name: string;
  type_id?: string | null;
  amount: number;
  day_of_month: number;
  start_date?: string;
  end_date?: string | null;
  category_id?: string | null;
  comment?: string | null;
};

// Для обновления
export type UpdateRecurringExpenseInput = Partial<CreateRecurringExpenseInput> & {
  is_active?: boolean;
};

// Состояние Redux
export type RecurringExpensesState = {
  items: RecurringExpense[];
  types: RecurringExpenseType[];
  loading: boolean;
  typesLoading: boolean;
  error: string | null;
  processingStatus: 'idle' | 'processing' | 'success' | 'error';
  lastProcessedAt: string | null;
};
