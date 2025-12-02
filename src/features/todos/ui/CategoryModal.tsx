import { Modal, TextInput, ColorInput, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TodoCategory } from '../types';

interface CategoryModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; color: string; description?: string }) => void;
  category?: TodoCategory | null;
}

export default function CategoryModal({ opened, onClose, onSubmit, category }: CategoryModalProps) {
  const form = useForm({
    initialValues: {
      name: category?.name || '',
      color: category?.color || '#228be6',
      description: category?.description || '',
    },
    validate: {
      name: (value) => (!value ? 'Введите название категории' : null),
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
      title={category ? 'Редактировать категорию' : 'Новая категория'}
      size="md"
      styles={{ inner: { right: 0, left: 0 } }}
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Название"
            placeholder="Введите название категории"
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
              {category ? 'Сохранить' : 'Создать'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
