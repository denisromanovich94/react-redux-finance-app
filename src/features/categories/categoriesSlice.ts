import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { getCategories, createCategory, type Category as ApiCategory } from './categoriesApi';

export type Category = ApiCategory;

export type CategoriesState = {
  items: Category[];
  loading: boolean;
  error: string | null;
};

const initialState: CategoriesState = {
  items: [],
  loading: false,
  error: null,
};

// Загрузка всех категорий текущего пользователя
export const loadCategories = createAsyncThunk<Category[]>(
  'categories/load',
  async () => {
    return await getCategories();
  }
);

// Добавление категории
export const addCategoryAsync = createAsyncThunk<
  Category,
  Omit<Category, 'id' | 'user_id' | 'created_at'>
>('categories/add', async (cat) => {
  return await createCategory(cat);
});

const slice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    // сюда можно добавить sync-редьюсеры при необходимости
    resetCategories(state) {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // load
    builder.addCase(loadCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(loadCategories.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message ?? 'Не удалось загрузить категории';
    });

    // add
    builder.addCase(addCategoryAsync.fulfilled, (state, action: PayloadAction<Category>) => {
      state.items.unshift(action.payload);
    });
  },
});

export const { resetCategories } = slice.actions;
export const categoriesReducer = slice.reducer;
