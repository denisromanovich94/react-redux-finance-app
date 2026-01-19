import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import {
  fetchProjects,
  createProjectThunk,
  updateProjectThunk,
  deleteProjectThunk,
} from '../features/timetracker/timeTrackerThunks';
import { fetchSessions } from '../features/timetracker/timeTrackerThunks';
import { loadClients } from '../features/clients/clientsSlice';
import { loadCategories } from '../features/categories/categoriesSlice';
import type { TrackerProject } from '../features/timetracker/types';
import {
  Button,
  Modal,
  TextInput,
  Textarea,
  Stack,
  Group,
  Title,
  ActionIcon,
  Text,
  Loader,
  Select,
  Card,
  Divider,
  Grid,
  Badge,
  ColorInput,
} from '@mantine/core';
import { IconPencil, IconTrash, IconClock, IconFileText } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import PageContainer from '../shared/ui/PageContainer';
import { showNotification } from '@mantine/notifications';

export default function Projects() {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, loadingProjects } = useSelector((state: RootState) => state.timeTracker);
  const allSessions = useSelector((state: RootState) => state.timeTracker.allSessions);
  const { items: clients } = useSelector((state: RootState) => state.clients);
  const { items: categories } = useSelector((state: RootState) => state.categories);
  const isSmall = useMediaQuery('(max-width: 48em)');

  const [modalOpened, setModalOpened] = useState(false);
  const [editingProject, setEditingProject] = useState<TrackerProject | null>(null);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#228be6');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchSessions());
    dispatch(loadClients());
    dispatch(loadCategories());
  }, [dispatch]);

  // Calculate project stats
  const getProjectStats = useMemo(() => {
    return (project: TrackerProject) => {
      const projectSessions = allSessions.filter(s => s.project_id === project.id);
      const totalSeconds = projectSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      const totalHours = totalSeconds / 3600;
      const sessionsCount = projectSessions.length;

      return { totalHours, sessionsCount };
    };
  }, [allSessions]);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setName('');
    setColor('#228be6');
    setDescription('');
    setClientId(null);
    setCategoryId(null);
    setModalOpened(true);
  };

  const handleOpenEdit = (project: TrackerProject) => {
    setEditingProject(project);
    setName(project.name);
    setColor(project.color);
    setDescription(project.description || '');
    setClientId(project.client_id || null);
    setCategoryId(project.category_id || null);
    setModalOpened(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showNotification({ title: 'Ошибка', message: 'Введите название проекта', color: 'red' });
      return;
    }

    try {
      const projectData = {
        name,
        color,
        description,
        client_id: clientId || null,
        category_id: categoryId || null,
      };

      if (editingProject) {
        await dispatch(updateProjectThunk({
          id: editingProject.id,
          updates: projectData,
        })).unwrap();
        showNotification({ title: 'Успешно', message: 'Проект обновлен', color: 'green' });
      } else {
        await dispatch(createProjectThunk(projectData)).unwrap();
        showNotification({ title: 'Успешно', message: 'Проект создан', color: 'green' });
      }
      setModalOpened(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Что-то пошло не так';
      showNotification({ title: 'Ошибка', message, color: 'red' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить проект? Связанные сессии не будут удалены.')) {
      try {
        await dispatch(deleteProjectThunk(id)).unwrap();
        showNotification({ title: 'Успешно', message: 'Проект удален', color: 'green' });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Не удалось удалить';
        showNotification({ title: 'Ошибка', message, color: 'red' });
      }
    }
  };

  return (
    <PageContainer>
      <Group justify="space-between" mb="md">
        <Title order={isSmall ? 3 : 2}>Проекты</Title>
        <Button onClick={handleOpenAdd} fullWidth={isSmall} size={isSmall ? 'sm' : 'md'}>
          Создать проект
        </Button>
      </Group>

      {loadingProjects ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader />
        </div>
      ) : projects.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Нет проектов. Создайте первый проект!
        </Text>
      ) : (
        <Grid>
          {projects.map((project) => {
            const stats = getProjectStats(project);
            const client = clients.find(c => c.id === project.client_id);
            const category = categories.find(c => c.id === project.category_id);

            return (
              <Grid.Col key={project.id} span={12}>
                <Card p="md" withBorder radius="md" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
                  <Stack gap="sm" style={{ flex: 1 }}>
                    {/* Header: Color + Name + Actions */}
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Group gap="xs" style={{ flex: 1 }}>
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            backgroundColor: project.color,
                            flexShrink: 0,
                          }}
                        />
                        <Text fw={600} size="md" lineClamp={2} style={{ flex: 1 }}>
                          {project.name}
                        </Text>
                      </Group>
                      <Group gap={4} wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          size="sm"
                          onClick={() => handleOpenEdit(project)}
                        >
                          <IconPencil size={14} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => handleDelete(project.id)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>

                    {/* Client and Category */}
                    {(client || category) && (
                      <>
                        <Divider />
                        <Stack gap="xs">
                          {client && (
                            <Group gap="xs" justify="space-between">
                              <Text size="xs" c="dimmed">Клиент</Text>
                              <Badge color="blue" variant="light" size="sm">
                                {client.name}
                              </Badge>
                            </Group>
                          )}
                          {category && (
                            <Group gap="xs" justify="space-between">
                              <Text size="xs" c="dimmed">Категория</Text>
                              <Badge color={category.color} variant="light" size="sm">
                                {category.name}
                              </Badge>
                            </Group>
                          )}
                        </Stack>
                      </>
                    )}

                    {/* Stats */}
                    {stats.sessionsCount > 0 && (
                      <>
                        <Divider />
                        <Stack gap="xs">
                          <Group gap="xs" justify="space-between">
                            <Group gap={4}>
                              <IconClock size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                              <Text size="xs" c="dimmed">Всего времени</Text>
                            </Group>
                            <Badge color="teal" variant="light" size="sm">
                              {stats.totalHours.toFixed(1)} ч
                            </Badge>
                          </Group>
                          <Group gap="xs" justify="space-between">
                            <Group gap={4}>
                              <IconFileText size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                              <Text size="xs" c="dimmed">Сессий</Text>
                            </Group>
                            <Badge color="gray" variant="light" size="sm">
                              {stats.sessionsCount}
                            </Badge>
                          </Group>
                        </Stack>
                      </>
                    )}

                    {/* Description */}
                    {project.description && (
                      <>
                        <Divider />
                        <Text size="xs" c="dimmed" lineClamp={3}>
                          {project.description}
                        </Text>
                      </>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
            );
          })}
        </Grid>
      )}

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingProject ? 'Редактировать проект' : 'Создать проект'}
        size="lg"
        fullScreen={isSmall}
        styles={{
          inner: {
            right: 0,
            left: 0,
          },
        }}
      >
        <Stack>
          <TextInput
            label="Название проекта"
            placeholder="Мой проект"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
          />

          <ColorInput
            label="Цвет проекта"
            value={color}
            onChange={setColor}
            format="hex"
            swatches={[
              '#228be6',
              '#40c057',
              '#fab005',
              '#fd7e14',
              '#fa5252',
              '#e64980',
              '#be4bdb',
              '#7950f2',
            ]}
          />

          <Select
            label="Клиент"
            placeholder="Выберите клиента"
            data={clients.map(c => ({ value: c.id, label: c.name }))}
            value={clientId}
            onChange={setClientId}
            clearable
            searchable
          />

          <Select
            label="Категория"
            placeholder="Выберите категорию"
            data={categories.map(c => ({ value: c.id, label: c.name }))}
            value={categoryId}
            onChange={setCategoryId}
            clearable
            searchable
          />

          <Textarea
            label="Описание"
            placeholder="Дополнительная информация о проекте"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            minRows={3}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setModalOpened(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              {editingProject ? 'Сохранить' : 'Создать'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </PageContainer>
  );
}
