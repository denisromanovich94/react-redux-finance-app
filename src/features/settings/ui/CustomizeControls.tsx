import { Stack, Group, Text, SegmentedControl, Paper, Button, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { updateProfile } from '../../profile/profileSlice';
import { useAuth } from '../../../shared/auth/AuthContext';
import {
  DEFAULT_APPEARANCE,
  type AppearanceSettings,
  type ThemeColor,
  type BorderRadius,
  type FontSize,
  type Spacing,
  type ShadowLevel,
} from '../../profile/types';

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Синий' },
  { value: 'green', label: 'Зеленый' },
  { value: 'orange', label: 'Оранжевый' },
  { value: 'red', label: 'Красный' },
  { value: 'pink', label: 'Розовый' },
  { value: 'grape', label: 'Виноградный' },
  { value: 'violet', label: 'Фиолетовый' },
  { value: 'indigo', label: 'Индиго' },
  { value: 'cyan', label: 'Циан' },
  { value: 'teal', label: 'Бирюзовый' },
  { value: 'lime', label: 'Лайм' },
  { value: 'yellow', label: 'Желтый' },
];

export function CustomizeControls() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { profile } = useAppSelector((state) => state.profile);

  const currentSettings = profile?.appearance_settings || DEFAULT_APPEARANCE;
  const [localSettings, setLocalSettings] = useState(currentSettings);

  // Синхронизация с профилем
  useEffect(() => {
    setLocalSettings(currentSettings);
  }, [currentSettings]);

  const updateSetting = async <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
  ) => {
    if (!user?.id) return;

    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);

    try {
      await dispatch(
        updateProfile({
          userId: user.id,
          updates: {
            appearance_settings: newSettings,
          },
        })
      ).unwrap();
    } catch (err) {
      console.error('Error updating appearance:', err);
      notifications.show({
        color: 'red',
        message: 'Ошибка при сохранении настроек',
      });
      // Откатываем локальные изменения
      setLocalSettings(currentSettings);
    }
  };

  const handleReset = async () => {
    if (!user?.id) return;

    try {
      await dispatch(
        updateProfile({
          userId: user.id,
          updates: {
            appearance_settings: DEFAULT_APPEARANCE,
          },
        })
      ).unwrap();

      notifications.show({
        color: 'teal',
        message: 'Настройки сброшены до значений по умолчанию',
      });
    } catch (err) {
      console.error('Error resetting appearance:', err);
      notifications.show({
        color: 'red',
        message: 'Ошибка при сбросе настроек',
      });
    }
  };

  return (
    <Stack gap="xl" style={{ maxWidth: 600 }}>
      {/* Основной цвет */}
      <Paper p="md" withBorder>
        <Text fw={500} mb="sm">Основной цвет</Text>
        <Group gap="xs">
          {COLOR_OPTIONS.map((color) => (
            <Box
              key={color.value}
              onClick={() => updateSetting('primaryColor', color.value as ThemeColor)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: `var(--mantine-color-${color.value}-6)`,
                cursor: 'pointer',
                border: localSettings.primaryColor === color.value
                  ? '3px solid var(--mantine-color-gray-9)'
                  : '2px solid transparent',
                transition: 'border 0.2s',
              }}
              title={color.label}
            />
          ))}
        </Group>
      </Paper>

      {/* Скругление */}
      <Paper p="md" withBorder>
        <Text fw={500} mb="sm">Скругление углов</Text>
        <SegmentedControl
          fullWidth
          value={localSettings.radius}
          onChange={(value) => updateSetting('radius', value as BorderRadius)}
          data={[
            { value: 'sharp', label: 'Острые' },
            { value: 'soft', label: 'Мягкие' },
            { value: 'round', label: 'Круглые' },
          ]}
        />
      </Paper>

      {/* Размер шрифта */}
      <Paper p="md" withBorder>
        <Text fw={500} mb="sm">Размер шрифта</Text>
        <SegmentedControl
          fullWidth
          value={localSettings.fontSize}
          onChange={(value) => updateSetting('fontSize', value as FontSize)}
          data={[
            { value: 'compact', label: 'Компактный' },
            { value: 'normal', label: 'Обычный' },
            { value: 'comfortable', label: 'Комфортный' },
          ]}
        />
      </Paper>

      {/* Отступы */}
      <Paper p="md" withBorder>
        <Text fw={500} mb="sm">Плотность интерфейса</Text>
        <SegmentedControl
          fullWidth
          value={localSettings.spacing}
          onChange={(value) => updateSetting('spacing', value as Spacing)}
          data={[
            { value: 'compact', label: 'Компактно' },
            { value: 'normal', label: 'Обычно' },
            { value: 'comfortable', label: 'Просторно' },
          ]}
        />
      </Paper>

      {/* Тени */}
      <Paper p="md" withBorder>
        <Text fw={500} mb="sm">Уровень теней</Text>
        <SegmentedControl
          fullWidth
          value={localSettings.shadows}
          onChange={(value) => updateSetting('shadows', value as ShadowLevel)}
          data={[
            { value: 'none', label: 'Без теней' },
            { value: 'subtle', label: 'Легкие' },
            { value: 'normal', label: 'Обычные' },
            { value: 'elevated', label: 'Выраженные' },
          ]}
        />
      </Paper>

      {/* Кнопка сброса */}
      <Group justify="center" mt="xl">
        <Button
          variant="subtle"
          color="red"
          onClick={handleReset}
        >
          Сбросить все настройки
        </Button>
      </Group>
    </Stack>
  );
}
