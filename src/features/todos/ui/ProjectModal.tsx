import { Modal, TextInput, ColorInput, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TodoProject } from '../types';

interface ProjectModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; color: string; description?: string }) => void;
  project?: TodoProject | null;
}

export default function ProjectModal({ opened, onClose, onSubmit, project }: ProjectModalProps) {
  const form = useForm({
    initialValues: {
      name: project?.name || '',
      color: project?.color || '#228be6',
      description: project?.description || '',
    },
    validate: {
      name: (value) => (!value ? 'Введите название проекта' : null),
    },
  });

  const handleSubmit = (values: { name: string; color: string; description?: string }) => {
    onSubmit(values);
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={project ? 'Редактировать проект' : 'Новый проект'}
      size="md"
      styles={{ inner: { right: 0, left: 0 } }}
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Название"
            placeholder="Введите название проекта"
            required
            {...form.getInputProps('name')}
          />

          <ColorInput
            label="Цвет"
            placeholder="Выберите цвет"
            {...form.getInputProps('color')}
          />

          <TextInput
            label="Описание"
            placeholder="Добавьте описание (опционально)"
            {...form.getInputProps('description')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">
              {project ? 'Сохранить' : 'Создать'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
