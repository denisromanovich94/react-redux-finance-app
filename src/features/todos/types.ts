export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TodoStatus = 'todo' | 'in_progress' | 'completed' | 'archived';

export interface TodoTag {
  id: string;
  name: string;
  color: string;
}

export interface TodoSubtask {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  due_date?: string; // ISO format
  tags: TodoTag[];
  subtasks: TodoSubtask[];
  project_id?: string; // используется как category_id
  assigned_to?: string; // для CRM интеграции
  time_estimate?: number; // в минутах
  time_spent?: number; // в минутах (для трекинга)
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TodoCategory {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface TodosState {
  items: Todo[];
  categories: TodoCategory[];
  tags: TodoTag[];
  loading: boolean;
  error: string | null;
  filters: {
    status: TodoStatus[];
    priority: TodoPriority[];
    project_id?: string; // используется как category_id в UI
    tags: string[];
    search: string;
  };
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority: TodoPriority;
  due_date?: string;
  project_id?: string; // используется как category_id
  tags?: TodoTag[];
  time_estimate?: number;
}

export interface UpdateTodoInput extends Partial<CreateTodoInput> {
  status?: TodoStatus;
  subtasks?: TodoSubtask[];
  time_spent?: number;
}