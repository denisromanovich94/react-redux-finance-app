// Расширяем список цветов
export type ThemeColor =
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'pink'
  | 'grape'
  | 'violet'
  | 'indigo'
  | 'cyan'
  | 'teal'
  | 'lime'
  | 'yellow';

// Пресеты тем
export type ThemePreset = 'classic' | 'minimal' | 'vibrant' | 'corporate';

// Параметры скругления
export type BorderRadius = 'sharp' | 'soft' | 'round';

// Размеры шрифта
export type FontSize = 'compact' | 'normal' | 'comfortable';

// Плотность интерфейса (spacing)
export type Spacing = 'compact' | 'normal' | 'comfortable';

// Уровень теней
export type ShadowLevel = 'none' | 'subtle' | 'normal' | 'elevated';

// Настройки внешнего вида
export interface AppearanceSettings {
  preset: ThemePreset;
  primaryColor: ThemeColor;
  radius: BorderRadius;
  fontSize: FontSize;
  spacing: Spacing;
  shadows: ShadowLevel;
}

// Дефолтные настройки
export const DEFAULT_APPEARANCE: AppearanceSettings = {
  preset: 'classic',
  primaryColor: 'blue',
  radius: 'soft',
  fontSize: 'normal',
  spacing: 'normal',
  shadows: 'normal',
};

export type UserProfile = {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  telegram: string | null;
  telegram_id: number | null;
  position: string | null;
  theme_color: ThemeColor; // DEPRECATED: сохраняем для обратной совместимости
  appearance_settings: AppearanceSettings | null;
  created_at: string;
  updated_at: string;
};

export type UpdateProfileData = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  telegram?: string;
  telegram_id?: number;
  position?: string;
  theme_color?: ThemeColor; // DEPRECATED
  appearance_settings?: AppearanceSettings;
};

// Данные от Telegram Login Widget
export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}
