-- ============================================
-- SQL для создания таблиц регулярных расходов
-- Выполнить в Supabase SQL Editor
-- ============================================

-- 1. Таблица типов расходов (Кредит, Аренда, Ипотека и т.д.)
CREATE TABLE IF NOT EXISTS recurring_expense_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Системные типы (один раз вставить)
INSERT INTO recurring_expense_types (name, icon, is_system, user_id) VALUES
  ('Кредит', 'IconCreditCard', true, NULL),
  ('Аренда', 'IconHome', true, NULL),
  ('Ипотека', 'IconBuildingBank', true, NULL),
  ('Абонемент', 'IconReceipt', true, NULL),
  ('Коммуналка', 'IconBolt', true, NULL),
  ('Связь', 'IconPhone', true, NULL)
ON CONFLICT DO NOTHING;

-- 3. RLS политики для типов
ALTER TABLE recurring_expense_types ENABLE ROW LEVEL SECURITY;

-- Чтение: системные типы + свои
CREATE POLICY "Users can read system and own types"
  ON recurring_expense_types FOR SELECT
  USING (is_system = true OR user_id = auth.uid());

-- Вставка: только свои (не системные)
CREATE POLICY "Users can insert own types"
  ON recurring_expense_types FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_system = false);

-- Обновление: только свои (не системные)
CREATE POLICY "Users can update own types"
  ON recurring_expense_types FOR UPDATE
  USING (user_id = auth.uid() AND is_system = false);

-- Удаление: только свои (не системные)
CREATE POLICY "Users can delete own types"
  ON recurring_expense_types FOR DELETE
  USING (user_id = auth.uid() AND is_system = false);

-- ============================================

-- 4. Основная таблица повторяющихся расходов
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Основные поля
  name VARCHAR(255) NOT NULL,
  type_id UUID REFERENCES recurring_expense_types(id),
  amount NUMERIC(12, 2) NOT NULL,

  -- День списания (1-31)
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),

  -- Период действия
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,  -- NULL = бессрочно

  -- Связь с категорией транзакций (опционально)
  category_id UUID,

  -- Дополнительно
  comment TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Отслеживание создания транзакций (формат: 'YYYY-MM')
  last_processed_month VARCHAR(7),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user ON recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_active ON recurring_expenses(is_active, user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_day ON recurring_expenses(day_of_month);

-- 6. RLS политика для расходов
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own expenses"
  ON recurring_expenses FOR ALL
  USING (user_id = auth.uid());

-- 7. Триггер для автообновления updated_at
CREATE OR REPLACE FUNCTION update_recurring_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_recurring_expenses_updated_at ON recurring_expenses;
CREATE TRIGGER update_recurring_expenses_updated_at
  BEFORE UPDATE ON recurring_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_expenses_updated_at();

-- ============================================
-- Готово! Теперь таблицы созданы.
-- ============================================
