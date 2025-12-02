import { MantineProvider, createTheme, localStorageColorSchemeManager } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useAppSelector } from '../../hooks';
import type { ThemeColor } from '../../features/profile/types';

const themeColors: Record<ThemeColor, string> = {
  blue: 'blue',
  green: 'green',
  orange: 'orange',
};

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mantine-color-scheme',
});

interface CustomThemeProviderProps {
  children: React.ReactNode;
}

export function CustomThemeProvider({ children }: CustomThemeProviderProps) {
  const { profile } = useAppSelector((state) => state.profile);
  const [primaryColor, setPrimaryColor] = useState<string>('blue');

  useEffect(() => {
    if (profile?.theme_color) {
      setPrimaryColor(themeColors[profile.theme_color]);
    }
  }, [profile?.theme_color]);

  const theme = createTheme({
    primaryColor,
    components: {
      NavLink: {
        defaultProps: {
          color: primaryColor,
        },
      },
    },
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
