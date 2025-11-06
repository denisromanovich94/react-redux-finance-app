import { useEffect } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { useTelegram } from './useTelegram';

/**
 * Компонент для синхронизации темы приложения с темой Telegram
 */
export function TelegramThemeProvider({ children }: { children: React.ReactNode }) {
  const { isTelegramApp, colorScheme } = useTelegram();
  const { setColorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (isTelegramApp && colorScheme) {
      // Применяем тему из Telegram
      setColorScheme(colorScheme === 'dark' ? 'dark' : 'light');
    }
  }, [isTelegramApp, colorScheme, setColorScheme]);

  return <>{children}</>;
}
