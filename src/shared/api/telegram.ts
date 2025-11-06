import { supabase } from './supabase';
import type { TelegramUser } from '../telegram/useTelegram';

interface TelegramLinkData {
  telegram_id: number;
  telegram_username?: string;
  telegram_first_name: string;
  telegram_last_name?: string;
}

/**
 * Проверить, связан ли Telegram аккаунт с каким-либо пользователем
 */
export async function checkTelegramLink(telegramId: number) {
  const { data, error } = await supabase
    .from('user_telegram_links')
    .select('user_id')
    .eq('telegram_id', telegramId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    throw error;
  }

  return data;
}

/**
 * Связать текущий аккаунт пользователя с Telegram
 */
export async function linkTelegramAccount(telegramData: TelegramLinkData) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error('Пользователь не авторизован');
  }

  // Проверяем, не связан ли уже этот Telegram с другим аккаунтом
  const existingLink = await checkTelegramLink(telegramData.telegram_id);

  if (existingLink && existingLink.user_id !== userData.user.id) {
    throw new Error('Этот Telegram аккаунт уже связан с другим пользователем');
  }

  // Создаем или обновляем связь
  const { data, error } = await supabase
    .from('user_telegram_links')
    .upsert({
      user_id: userData.user.id,
      telegram_id: telegramData.telegram_id,
      telegram_username: telegramData.telegram_username,
      telegram_first_name: telegramData.telegram_first_name,
      telegram_last_name: telegramData.telegram_last_name,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Отвязать Telegram аккаунт от текущего пользователя
 */
export async function unlinkTelegramAccount() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error('Пользователь не авторизован');
  }

  const { error } = await supabase
    .from('user_telegram_links')
    .delete()
    .eq('user_id', userData.user.id);

  if (error) throw error;
}

/**
 * Получить информацию о связи Telegram для текущего пользователя
 */
export async function getTelegramLink() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_telegram_links')
    .select('*')
    .eq('user_id', userData.user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Авторизация через Telegram (создание или вход в аккаунт)
 * Если Telegram связан с существующим аккаунтом - выполняется вход
 * Если нет - создается новый аккаунт с временным email
 */
export async function signInWithTelegram(
  telegramUser: TelegramUser,
  initData: string
) {
  // ВАЖНО: В production нужно валидировать initData на сервере!
  // Это защитит от подделки данных пользователя

  // Проверяем, есть ли уже связь с этим Telegram ID
  const existingLink = await checkTelegramLink(telegramUser.id);

  if (existingLink) {
    // Пользователь уже существует, получаем его данные
    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(
      existingLink.user_id
    );

    if (getUserError) {
      throw new Error('Ошибка получения данных пользователя');
    }

    // Создаем сессию для существующего пользователя
    // В production это должно делаться через Edge Function с валидацией initData
    return { user, isNewUser: false };
  }

  // Создаем нового пользователя
  // Генерируем временный email на основе Telegram ID
  const tempEmail = `telegram_${telegramUser.id}@temp.local`;
  const tempPassword = `tg_${telegramUser.id}_${Date.now()}`; // Временный пароль

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: tempEmail,
    password: tempPassword,
    options: {
      data: {
        telegram_id: telegramUser.id,
        telegram_username: telegramUser.username,
        telegram_first_name: telegramUser.first_name,
        telegram_last_name: telegramUser.last_name,
      },
    },
  });

  if (signUpError) throw signUpError;

  if (!signUpData.user) {
    throw new Error('Не удалось создать пользователя');
  }

  // Создаем связь с Telegram
  await linkTelegramAccount({
    telegram_id: telegramUser.id,
    telegram_username: telegramUser.username,
    telegram_first_name: telegramUser.first_name,
    telegram_last_name: telegramUser.last_name,
  });

  return { user: signUpData.user, isNewUser: true };
}
