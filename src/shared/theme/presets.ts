import type {
  ThemePreset,
  ThemeColor,
  BorderRadius,
  FontSize,
  Spacing,
  ShadowLevel
} from '../../features/profile/types';

// Типы для Mantine theme overrides
type MantineSpacing = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

type MantineShadows = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

// Определение пресета
export interface PresetDefinition {
  id: ThemePreset;
  name: string;
  description: string;
  icon: string; // emoji или название иконки
  defaultColor: ThemeColor;
  // Характеристики пресета
  characteristics: {
    radius: BorderRadius;
    fontSize: FontSize;
    spacing: Spacing;
    shadows: ShadowLevel;
  };
}

// 4 готовых пресета
export const THEME_PRESETS: Record<ThemePreset, PresetDefinition> = {
  classic: {
    id: 'classic',
    name: 'Классический',
    description: 'Сбалансированный дизайн с умеренными отступами',
    icon: '📘',
    defaultColor: 'blue',
    characteristics: {
      radius: 'soft',
      fontSize: 'normal',
      spacing: 'normal',
      shadows: 'normal',
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Минималистичный',
    description: 'Плоский дизайн, острые углы, минимум теней',
    icon: '⬜',
    defaultColor: 'indigo',
    characteristics: {
      radius: 'sharp',
      fontSize: 'compact',
      spacing: 'compact',
      shadows: 'none',
    },
  },
  vibrant: {
    id: 'vibrant',
    name: 'Яркий',
    description: 'Насыщенные цвета, большие радиусы, выразительный',
    icon: '🌈',
    defaultColor: 'violet',
    characteristics: {
      radius: 'round',
      fontSize: 'comfortable',
      spacing: 'comfortable',
      shadows: 'elevated',
    },
  },
  corporate: {
    id: 'corporate',
    name: 'Корпоративный',
    description: 'Строгий стиль для профессионального использования',
    icon: '💼',
    defaultColor: 'cyan',
    characteristics: {
      radius: 'soft',
      fontSize: 'normal',
      spacing: 'compact',
      shadows: 'subtle',
    },
  },
};

// Маппинг параметров в значения Mantine
export const RADIUS_VALUES: Record<BorderRadius, MantineSpacing> = {
  sharp: { xs: '0', sm: '0.125rem', md: '0.25rem', lg: '0.375rem', xl: '0.5rem' },
  soft: { xs: '0.25rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.25rem' },
  round: { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
};

export const FONT_SIZE_VALUES: Record<FontSize, MantineSpacing> = {
  compact: { xs: '0.625rem', sm: '0.6875rem', md: '0.8125rem', lg: '0.9375rem', xl: '1.0625rem' },
  normal: { xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.25rem' },
  comfortable: { xs: '0.875rem', sm: '1rem', md: '1.125rem', lg: '1.25rem', xl: '1.5rem' },
};

export const SPACING_VALUES: Record<Spacing, MantineSpacing> = {
  compact: { xs: '0.25rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.25rem' },
  normal: { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
  comfortable: { xs: '0.75rem', sm: '1rem', md: '1.5rem', lg: '2rem', xl: '2.5rem' },
};

export const SHADOW_VALUES: Record<ShadowLevel, MantineShadows> = {
  none: {
    xs: 'none',
    sm: 'none',
    md: 'none',
    lg: 'none',
    xl: 'none',
  },
  subtle: {
    xs: '0 1px 2px rgba(0,0,0,0.05)',
    sm: '0 1px 3px rgba(0,0,0,0.08)',
    md: '0 2px 6px rgba(0,0,0,0.1)',
    lg: '0 4px 12px rgba(0,0,0,0.12)',
    xl: '0 8px 24px rgba(0,0,0,0.15)',
  },
  normal: {
    xs: '0 1px 3px rgba(0,0,0,0.1)',
    sm: '0 2px 6px rgba(0,0,0,0.15)',
    md: '0 4px 12px rgba(0,0,0,0.2)',
    lg: '0 8px 24px rgba(0,0,0,0.25)',
    xl: '0 16px 48px rgba(0,0,0,0.3)',
  },
  elevated: {
    xs: '0 2px 4px rgba(0,0,0,0.15)',
    sm: '0 4px 8px rgba(0,0,0,0.2)',
    md: '0 8px 16px rgba(0,0,0,0.25)',
    lg: '0 16px 32px rgba(0,0,0,0.3)',
    xl: '0 32px 64px rgba(0,0,0,0.35)',
  },
};
