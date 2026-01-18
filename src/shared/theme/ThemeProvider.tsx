import {
  MantineProvider,
  createTheme,
  localStorageColorSchemeManager,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { useAppSelector } from '../../hooks';
import {
  DEFAULT_APPEARANCE,
  type AppearanceSettings,
} from '../../features/profile/types';
import {
  RADIUS_VALUES,
  FONT_SIZE_VALUES,
  SPACING_VALUES,
  SHADOW_VALUES,
} from './presets';

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mantine-color-scheme',
});

interface CustomThemeProviderProps {
  children: React.ReactNode;
}

export function CustomThemeProvider({ children }: CustomThemeProviderProps) {
  const { profile } = useAppSelector((state) => state.profile);
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(
    DEFAULT_APPEARANCE
  );

  // Синхронизация с профилем
  useEffect(() => {
    if (profile?.appearance_settings) {
      setAppearanceSettings(profile.appearance_settings);
    } else if (profile?.theme_color) {
      // Миграция старых пользователей: используем theme_color как primaryColor
      setAppearanceSettings({
        ...DEFAULT_APPEARANCE,
        primaryColor: profile.theme_color,
      });
    }
  }, [profile]);

  // Создаем тему на основе настроек
  const theme = createTheme({
    primaryColor: appearanceSettings.primaryColor,
    fontSizes: FONT_SIZE_VALUES[appearanceSettings.fontSize],
    radius: RADIUS_VALUES[appearanceSettings.radius],
    spacing: SPACING_VALUES[appearanceSettings.spacing],
    shadows: SHADOW_VALUES[appearanceSettings.shadows],
  });

  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="auto"
      colorSchemeManager={colorSchemeManager}
    >
      {children}
    </MantineProvider>
  );
}
