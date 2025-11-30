import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TodosState, TodoProject, CreateTodoInput, UpdateTodoInput, TodoStatus, TodoPriority } from './types';
import { todosApi } from './todosApi';
import { supabase } from '../../shared/api/supabase';

const initialState: TodosState = {
  items: [],
  projects: [],
  tags: [],
  loading: false,
  error: null,
  filters: {
    status: [],
    priority: [],
    tags: [],
    search: '',
  },
};

export const loadTodos = createAsyncThunk('todos/loadTodos', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return todosApi.fetchTodos(user.id);
});

export const loadProjects = createAsyncThunk('todos/loadProjects', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return todosApi.fetchProjects(user.id);
});

export const createTodoAsync = createAsyncThunk(
  'todos/createTodo',
  async (input: CreateTodoInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return todosApi.createTodo(user.id, input);
  }
);

export const updateTodoAsync = createAsyncThunk(
  'todos/updateTodo',
  async ({ id, updates }: { id: string; updates: UpdateTodoInput }) => {
    return todosApi.updateTodo(id, updates);
  }
);

export const deleteTodoAsync = createAsyncThunk(
  'todos/deleteTodo',
  async (id: string) => {
    await todosApi.deleteTodo(id);
    return id;
  }
);

export const createProjectAsync = createAsyncThunk(
  'todos/createProject',
  async ({ name, color, description }: { name: string; color: string; description?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return todosApi.createProject(user.id, name, color, description);
  }
);

export const updateProjectAsync = createAsyncThunk(
  'todos/updateProject',
  async ({ id, updates }: { id: string; updates: Partial<TodoProject> }) => {
    return todosApi.updateProject(id, updates);
  }
);

export const deleteProjectAsync = createAsyncThunk(
  'todos/deleteProject',
  async (id: string) => {
    await todosApi.deleteProject(id);
    return id;
  }
);

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    setStatusFilter: (state, action: PayloadAction<TodoStatus[]>) => {
      state.filters.status = action.payload;
    },
    setPriorityFilter: (state, action: PayloadAction<TodoPriority[]>) => {
      state.filters.priority = action.payload;
    },
    setProjectFilter: (state, action: PayloadAction<string | undefined>) => {
      state.filters.project_id = action.payload;
    },
    setTagsFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.tags = action.payload;
    },
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {
        status: [],
        priority: [],
        tags: [],
        search: '',
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Load todos
      .addCase(loadTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load todos';
      })
      // Load projects
      .addCase(loadProjects.fulfilled, (state, action) => {
        state.projects = action.payload;
      })
      // Create todo
      .addCase(createTodoAsync.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // Update todo
      .addCase(updateTodoAsync.fulfilled, (state, action) => {
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete todo
      .addCase(deleteTodoAsync.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t.id !== action.payload);
      })
      // Create project
      .addCase(createProjectAsync.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
      })
      // Update project
      .addCase(updateProjectAsync.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
      })
      // Delete project
      .addCase(deleteProjectAsync.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload);
      });
  },
});

export const {
  setStatusFilter,
  setPriorityFilter,
  setProjectFilter,
  setTagsFilter,
  setSearchFilter,
  clearFilters,
} = todosSlice.actions;

export default todosSlice.reducer;
