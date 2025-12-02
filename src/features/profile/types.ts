export type ThemeColor = 'blue' | 'green' | 'orange';

export type UserProfile = {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  telegram: string | null;
  position: string | null;
  theme_color: ThemeColor;
  created_at: string;
  updated_at: string;
};

export type UpdateProfileData = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  telegram?: string;
  position?: string;
  theme_color?: ThemeColor;
};
