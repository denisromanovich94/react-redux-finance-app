import { Stack, Title, Text, SimpleGrid, Divider } from '@mantine/core';
import { PresetCard } from './PresetCard';
import { CustomizeControls } from './CustomizeControls';
import { THEME_PRESETS } from '../../../shared/theme/presets';
import { useAppSelector } from '../../../hooks';
import { DEFAULT_APPEARANCE } from '../../profile/types';

export function AppearanceSection() {
  const { profile } = useAppSelector((state) => state.profile);
  const currentSettings = profile?.appearance_settings || DEFAULT_APPEARANCE;

  return (
    <Stack gap="xl">
      {/* Секция пресетов */}
      <div>
        <Title order={3} mb="xs">Готовые темы</Title>
        <Text size="sm" c="dimmed" mb="lg">
          Выберите один из готовых стилей оформления
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          {Object.values(THEME_PRESETS).map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isActive={currentSettings.preset === preset.id}
            />
          ))}
        </SimpleGrid>
      </div>

      <Divider />

      {/* Секция детальной настройки */}
      <div>
        <Title order={3} mb="xs">Персональные настройки</Title>
        <Text size="sm" c="dimmed" mb="lg">
          Настройте детали оформления под свой вкус
        </Text>

        <CustomizeControls />
      </div>
    </Stack>
  );
}
