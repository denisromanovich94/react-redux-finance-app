import { Box, Card, Group, Stack, ThemeIcon } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import type { PresetDefinition } from '../../../shared/theme/presets';
import {
  RADIUS_VALUES,
  SHADOW_VALUES,
} from '../../../shared/theme/presets';

interface PresetPreviewProps {
  preset: PresetDefinition;
}

export function PresetPreview({ preset }: PresetPreviewProps) {
  const radiusValue = RADIUS_VALUES[preset.characteristics.radius];
  const shadowValue = SHADOW_VALUES[preset.characteristics.shadows];

  return (
    <Box
      style={{
        backgroundColor: 'var(--mantine-color-gray-0)',
        borderRadius: radiusValue.md,
        padding: preset.characteristics.spacing === 'compact' ? 8 :
                 preset.characteristics.spacing === 'comfortable' ? 16 : 12,
        minHeight: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack gap={preset.characteristics.spacing === 'compact' ? 4 : 8} align="center">
        {/* Мини карточка */}
        <Card
          shadow={shadowValue.sm}
          radius={radiusValue.md}
          p={preset.characteristics.spacing === 'compact' ? 'xs' : 'sm'}
          withBorder
          style={{ width: '100%' }}
        >
          <Group gap="xs" justify="center">
            <ThemeIcon
              color={preset.defaultColor}
              size="sm"
              radius={radiusValue.sm}
            >
              <IconUser size={12} />
            </ThemeIcon>
            <Box
              style={{
                width: 40,
                height: preset.characteristics.fontSize === 'compact' ? 8 :
                       preset.characteristics.fontSize === 'comfortable' ? 12 : 10,
                backgroundColor: 'var(--mantine-color-gray-3)',
                borderRadius: radiusValue.xs,
              }}
            />
          </Group>
        </Card>

        {/* Мини элементы */}
        <Group gap="xs" justify="center">
          <Box
            style={{
              width: 24,
              height: 24,
              backgroundColor: `var(--mantine-color-${preset.defaultColor}-6)`,
              borderRadius: radiusValue.sm,
              boxShadow: shadowValue.xs,
            }}
          />
          <Box
            style={{
              width: 24,
              height: 24,
              backgroundColor: 'var(--mantine-color-gray-2)',
              borderRadius: radiusValue.sm,
            }}
          />
        </Group>
      </Stack>
    </Box>
  );
}
