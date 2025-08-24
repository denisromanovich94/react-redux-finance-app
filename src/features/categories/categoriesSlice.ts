import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchCategories, createCategory, type DbCategory } from './categoriesApi';

export type Category = DbCategory;

type CategoriesState = {
  items: Category[];
  loading: boolean;
  error: string | null;
};

const initialState: CategoriesState = {
  items: [],
  loading: false,
  error: null,
};

export const loadCategories = createAsyncThunk('categories/load', async () => {
  const data = await fetchCategories();
  return data as Category[];
});

export const addCategoryAsync = createAsyncThunk(
  'categories/add',
  async (cat: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
    const data = await createCategory(cat);
    return data as Category;
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
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

export default categoriesSlice.reducer;
