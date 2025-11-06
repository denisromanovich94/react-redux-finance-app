import { useEffect, useRef } from 'react';
import { Box } from '@mantine/core';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginWidgetProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: boolean;
  usePic?: boolean;
  lang?: string;
}

/**
 * Виджет Telegram Login для входа в браузере
 * Требует указать @botName в настройках
 */
export function TelegramLoginWidget({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius,
  requestAccess = true,
  usePic = true,
  lang = 'ru',
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!botName) {
      console.error('TelegramLoginWidget: botName is required');
      return;
    }

    // Создаем глобальную функцию для callback
    const callbackName = `onTelegramAuth_${Date.now()}`;
    (window as any)[callbackName] = (user: TelegramUser) => {
      onAuth(user);
      // Очищаем глобальную функцию после использования
      delete (window as any)[callbackName];
    };

    // Создаем скрипт для виджета Telegram
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    if (cornerRadius !== undefined) {
      script.setAttribute('data-radius', cornerRadius.toString());
    }
    script.setAttribute('data-request-access', requestAccess ? 'write' : '');
    script.setAttribute('data-userpic', usePic.toString());
    script.setAttribute('data-lang', lang);
    script.setAttribute('data-onauth', `${callbackName}(user)`);

    // Добавляем скрипт в контейнер
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }

    return () => {
      // Очистка
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      delete (window as any)[callbackName];
    };
  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, usePic, lang]);

  if (!botName) {
    return (
      <Box c="red" p="sm">
        Ошибка: не указан botName для Telegram Login Widget
      </Box>
    );
  }

  return <Box ref={containerRef} />;
}
