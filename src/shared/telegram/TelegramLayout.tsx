import { useEffect } from 'react';
import { useTelegram } from './useTelegram';

interface TelegramLayoutProps {
  children: React.ReactNode;
  /**
   * Показывать ли главную кнопку Telegram
   */
  showMainButton?: boolean;
  /**
   * Текст главной кнопки
   */
  mainButtonText?: string;
  /**
   * Обработчик нажатия на главную кнопку
   */
  onMainButtonClick?: () => void;
  /**
   * Показывать ли кнопку "Назад"
   */
  showBackButton?: boolean;
  /**
   * Обработчик нажатия на кнопку "Назад"
   */
  onBackButtonClick?: () => void;
}

/**
 * Компонент для управления элементами интерфейса Telegram Mini App
 */
export function TelegramLayout({
  children,
  showMainButton = false,
  mainButtonText = 'Продолжить',
  onMainButtonClick,
  showBackButton = false,
  onBackButtonClick,
}: TelegramLayoutProps) {
  const { isTelegramApp, MainButton, BackButton } = useTelegram();

  useEffect(() => {
    if (!isTelegramApp) return;

    // Настраиваем главную кнопку
    if (showMainButton && onMainButtonClick) {
      MainButton.setText(mainButtonText);
      MainButton.show();
      MainButton.onClick(onMainButtonClick);

      return () => {
        MainButton.hide();
        MainButton.offClick(onMainButtonClick);
      };
    } else {
      MainButton.hide();
    }
  }, [isTelegramApp, showMainButton, mainButtonText, onMainButtonClick, MainButton]);

  useEffect(() => {
    if (!isTelegramApp) return;

    // Настраиваем кнопку "Назад"
    if (showBackButton && onBackButtonClick) {
      BackButton.show();
      BackButton.onClick(onBackButtonClick);

      return () => {
        BackButton.hide();
        BackButton.offClick(onBackButtonClick);
      };
    } else {
      BackButton.hide();
    }
  }, [isTelegramApp, showBackButton, onBackButtonClick, BackButton]);

  return <>{children}</>;
}
