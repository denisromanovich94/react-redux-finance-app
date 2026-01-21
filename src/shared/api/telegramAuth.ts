import { supabase } from './supabase';
import type { TelegramAuthData } from '../../features/profile/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

interface TelegramAuthResponse {
  success: boolean;
  error?: string;
  session?: {
    access_token: string;
    refresh_token: string;
  };
  user?: {
    id: string;
    email: string;
  };
  isNewUser?: boolean;
}

/**
 * Привязать Telegram аккаунт к текущему пользователю
 */
export async function linkTelegram(telegramData: TelegramAuthData): Promise<TelegramAuthResponse> {
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return { success: false, error: 'Необходимо войти в аккаунт' };
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/hyper-task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionData.session.access_token}`,
    },
    body: JSON.stringify({
      mode: 'link',
      telegramData,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    return { success: false, error: result.error || 'Ошибка привязки Telegram' };
  }

  return { success: true };
}

/**
 * Войти через Telegram (или зарегистрироваться если аккаунта нет)
 */
export async function loginWithTelegram(telegramData: TelegramAuthData): Promise<TelegramAuthResponse> {
  console.log('loginWithTelegram called with:', { id: telegramData.id, auth_date: telegramData.auth_date });

  const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/hyper-task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({
      mode: 'login',
      telegramData,
    }),
  });

  const result = await response.json();
  console.log('loginWithTelegram response:', { status: response.status, result });

  if (!response.ok) {
    return { success: false, error: `[${response.status}] ${result.error || 'Ошибка входа через Telegram'}` };
  }

  // Если получили сессию - устанавливаем её
  if (result.session) {
    const { error } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  return {
    success: true,
    user: result.user,
    isNewUser: result.isNewUser,
  };
}

/**
 * Отвязать Telegram от аккаунта
 */
export async function unlinkTelegram(): Promise<TelegramAuthResponse> {
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return { success: false, error: 'Необходимо войти в аккаунт' };
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/hyper-task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionData.session.access_token}`,
    },
    body: JSON.stringify({
      mode: 'unlink',
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    return { success: false, error: result.error || 'Ошибка отвязки Telegram' };
  }

  return { success: true };
}
