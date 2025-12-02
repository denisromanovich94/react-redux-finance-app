import { supabase } from '../../shared/api/supabase';
import type { UserProfile, UpdateProfileData } from './types';

export const profileApi = {
  // Получить профиль текущего пользователя
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data;
  },

  // Обновить профиль пользователя
  async updateProfile(userId: string, updates: UpdateProfileData): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data;
  },

  // Создать профиль (если не был создан автоматически)
  async createProfile(userId: string, email: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        email,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      throw error;
    }

    return data;
  },
};