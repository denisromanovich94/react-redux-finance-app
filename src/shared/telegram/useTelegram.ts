import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTelegramApp, setIsTelegramApp] = useState(false);

  useEffect(() => {
    // Проверяем, запущено ли приложение в Telegram
    const isTg = typeof window !== 'undefined' && window.Telegram?.WebApp?.initData !== '';
    setIsTelegramApp(isTg);

    if (isTg) {
      // Инициализируем Telegram WebApp
      WebApp.ready();
      setIsReady(true);

      // Получаем данные пользователя
      if (WebApp.initDataUnsafe?.user) {
        setUser(WebApp.initDataUnsafe.user as TelegramUser);
      }

      // Разворачиваем приложение на весь экран
      WebApp.expand();

      // Включаем вертикальное пролистывание
      WebApp.enableClosingConfirmation();
    } else {
      // Если не в Telegram, приложение все равно готово к работе
      setIsReady(true);
    }
  }, []);

  return {
    isReady,
    isTelegramApp,
    user,
    webApp: WebApp,
    // Данные для валидации на сервере
    initData: WebApp.initData,
    initDataUnsafe: WebApp.initDataUnsafe,
    // Утилиты
    showAlert: (message: string) => WebApp.showAlert(message),
    showConfirm: (message: string) => WebApp.showConfirm(message),
    close: () => WebApp.close(),
    // Главная кнопка
    MainButton: WebApp.MainButton,
    BackButton: WebApp.BackButton,
    // Тема
    themeParams: WebApp.themeParams,
    colorScheme: WebApp.colorScheme,
  };
}
