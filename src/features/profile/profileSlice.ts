import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { profileApi } from './profileApi';
import type { UserProfile, UpdateProfileData } from './types';

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
};

// Загрузить профиль пользователя
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (userId: string) => {
    return await profileApi.getProfile(userId);
  }
);

// Обновить профиль пользователя
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async ({ userId, updates }: { userId: string; updates: UpdateProfileData }) => {
    return await profileApi.updateProfile(userId, updates);
  }
);

// Создать профиль (если не был создан автоматически)
export const createProfile = createAsyncThunk(
  'profile/createProfile',
  async ({ userId, email }: { userId: string; email: string }) => {
    return await profileApi.createProfile(userId, email);
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profile';
      })
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update profile';
      })
      // Create profile
      .addCase(createProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(createProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create profile';
      });
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
