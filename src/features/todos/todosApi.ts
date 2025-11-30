import { supabase } from '../../shared/api/supabase';
import type { Todo, TodoProject, CreateTodoInput, UpdateTodoInput } from './types';

export const todosApi = {
  // Todos CRUD
  async fetchTodos(userId: string): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      ...item,
      tags: Array.isArray(item.tags) ? item.tags : [],
      subtasks: Array.isArray(item.subtasks) ? item.subtasks : [],
    } as Todo));
  },

  async createTodo(userId: string, input: CreateTodoInput): Promise<Todo> {
    const now = new Date().toISOString();
    const newTodo = {
      user_id: userId,
      title: input.title,
      description: input.description || '',
      status: 'todo' as const,
      priority: input.priority,
      due_date: input.due_date || null,
      tags: input.tags || [],
      subtasks: [],
      project_id: input.project_id || null,
      time_estimate: input.time_estimate || 0,
      time_spent: 0,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('todos')
      .insert(newTodo)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      tags: Array.isArray(data.tags) ? data.tags : [],
      subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
    } as Todo;
  },

  async updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.due_date !== undefined) updateData.due_date = input.due_date;
    if (input.project_id !== undefined) updateData.project_id = input.project_id;
    if (input.time_estimate !== undefined) updateData.time_estimate = input.time_estimate;
    if (input.time_spent !== undefined) updateData.time_spent = input.time_spent;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.subtasks !== undefined) updateData.subtasks = input.subtasks;

    if (input.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      tags: Array.isArray(data.tags) ? data.tags : [],
      subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
    } as Todo;
  },

  async deleteTodo(id: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Projects CRUD
  async fetchProjects(userId: string): Promise<TodoProject[]> {
    const { data, error } = await supabase
      .from('todo_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as TodoProject[];
  },

  async createProject(userId: string, name: string, color: string, description?: string): Promise<TodoProject> {
    const now = new Date().toISOString();
    const newProject = {
      user_id: userId,
      name,
      description: description || '',
      color,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('todo_projects')
      .insert(newProject)
      .select()
      .single();

    if (error) throw error;
    return data as TodoProject;
  },

  async updateProject(id: string, updates: Partial<TodoProject>): Promise<TodoProject> {
    const { data, error } = await supabase
      .from('todo_projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TodoProject;
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('todo_projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
