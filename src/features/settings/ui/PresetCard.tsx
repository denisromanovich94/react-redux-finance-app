import { Card, Stack, Text, Badge, Group, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { PresetPreview } from './PresetPreview';
import type { PresetDefinition } from '../../../shared/theme/presets';
import { useAppDispatch } from '../../../hooks';
import { updateProfile } from '../../profile/profileSlice';
import { useAuth } from '../../../shared/auth/AuthContext';
import type { AppearanceSettings } from '../../profile/types';

interface PresetCardProps {
  preset: PresetDefinition;
  isActive: boolean;
}

export function PresetCard({ preset, isActive }: PresetCardProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const handleApply = async () => {
    if (!user?.id) {
      notifications.show({
        color: 'red',
        message: 'Ошибка: пользователь не авторизован',
      });
      return;
    }

    const newSettings: AppearanceSettings = {
      preset: preset.id,
      primaryColor: preset.defaultColor,
      radius: preset.characteristics.radius,
      fontSize: preset.characteristics.fontSize,
      spacing: preset.characteristics.spacing,
      shadows: preset.characteristics.shadows,
    };

    try {
      await dispatch(
        updateProfile({
          userId: user.id,
          updates: {
            appearance_settings: newSettings,
          },
        })
      ).unwrap();

      notifications.show({
        color: 'teal',
        message: `Тема "${preset.name}" применена`,
      });
    } catch (err) {
      console.error('Error updating appearance:', err);
      notifications.show({
        color: 'red',
        message: 'Ошибка при изменении темы',
      });
    }
  };

  return (
    <Card
      shadow={isActive ? 'md' : 'sm'}
      radius="md"
      withBorder
      style={{
        borderColor: isActive ? 'var(--mantine-primary-color-filled)' : undefined,
        borderWidth: isActive ? 2 : 1,
      }}
    >
      <Stack gap="sm">
        {/* Preview */}
        <PresetPreview preset={preset} />

        {/* Info */}
        <Group justify="space-between" align="start">
          <div>
            <Text fw={600} size="sm">
              {preset.icon} {preset.name}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={2}>
              {preset.description}
            </Text>
          </div>
          {isActive && (
            <Badge size="xs" color="teal" variant="filled">
              Активна
            </Badge>
          )}
        </Group>

        {/* Apply button */}
        <Button
          size="xs"
          variant={isActive ? 'light' : 'outline'}
          onClick={handleApply}
          disabled={isActive}
          fullWidth
        >
          {isActive ? 'Текущая тема' : 'Применить'}
        </Button>
      </Stack>
    </Card>
  );
}
