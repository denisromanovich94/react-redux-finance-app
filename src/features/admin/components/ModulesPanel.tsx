import {
  Stack,
  Paper,
  Group,
  Text,
  Badge,
  Switch,
  Loader,
  Center,
} from '@mantine/core';
import type { AppModule } from '../types';
import { useAppDispatch } from '../../../hooks';
import { toggleModule } from '../adminSlice';

interface ModulesPanelProps {
  modules: AppModule[];
  loading: boolean;
}

export default function ModulesPanel({ modules, loading }: ModulesPanelProps) {
  const dispatch = useAppDispatch();

  const handleToggle = (moduleId: string, currentState: boolean) => {
    dispatch(toggleModule({ moduleId, isEnabled: !currentState }));
  };

  if (loading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (modules.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">Модули не настроены. Выполните SQL миграцию в Supabase.</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Управляйте доступностью модулей для всех пользователей. Отключённые модули не будут отображаться в меню.
      </Text>

      {modules.map((module) => (
        <Paper key={module.id} withBorder p="md" radius="md">
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={4}>
              <Group gap="sm">
                <Text fw={500}>{module.name}</Text>
                {module.requires_subscription.length > 0 && (
                  <Group gap={4}>
                    {module.requires_subscription.map((sub) => (
                      <Badge
                        key={sub}
                        size="xs"
                        color={sub === 'vip' ? 'grape' : 'yellow'}
                        variant="light"
                      >
                        {sub.toUpperCase()}
                      </Badge>
                    ))}
                  </Group>
                )}
              </Group>
              {module.description && (
                <Text size="sm" c="dimmed">
                  {module.description}
                </Text>
              )}
            </Stack>
            <Switch
              checked={module.is_enabled}
              onChange={() => handleToggle(module.id, module.is_enabled)}
              size="md"
            />
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
