import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { getCategories, createCategory, updateCategory, deleteCategory, type Category as ApiCategory } from './categoriesApi';


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

export const loadCategories = createAsyncThunk<Category[]>(
  'categories/load',
  async () => await getCategories()
);

export const addCategoryAsync = createAsyncThunk<
  Category,
  Omit<Category, 'id' | 'user_id' | 'created_at'>
>('categories/add', async (cat) => await createCategory(cat));

export const updateCategoryAsync = createAsyncThunk<
  Category,
  { id: string; changes: Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>> }
>('categories/update', async ({ id, changes }) => await updateCategory(id, changes));

export const deleteCategoryAsync = createAsyncThunk<string, string>(
  'categories/delete',
  async (id) => {
    await deleteCategory(id);
    return id;
  }
);

const slice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    resetCategories(state) {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // load
      .addCase(loadCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Не удалось загрузить категории';
      })

      // add
      .addCase(addCategoryAsync.fulfilled, (state, action: PayloadAction<Category>) => {
        state.items.unshift(action.payload);
      })

      // update
      .addCase(updateCategoryAsync.fulfilled, (state, action: PayloadAction<Category>) => {
        state.items = state.items.map((c) => (c.id === action.payload.id ? action.payload : c));
      })

      // delete
      .addCase(deleteCategoryAsync.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((c) => c.id !== action.payload);
      });
  },
});

export const { resetCategories } = slice.actions;
export const categoriesReducer = slice.reducer;
