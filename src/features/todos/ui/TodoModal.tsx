import { Modal, TextInput, Textarea, Select, Button, Group, Stack } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import type { Todo, CreateTodoInput, TodoPriority, TodoTag } from '../types';

interface TodoModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTodoInput) => void;
  todo?: Todo | null;
  projects: { value: string; label: string }[];
}

interface TodoFormValues {
  title: string;
  description?: string;
  priority: TodoPriority;
  due_date: Date | null;
  project_id?: string;
  tags?: TodoTag[];
  time_estimate?: number;
}

const priorityOptions = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'urgent', label: 'Срочный' },
];

export default function TodoModal({ opened, onClose, onSubmit, todo, projects }: TodoModalProps) {
  const form = useForm<TodoFormValues>({
    initialValues: {
      title: todo?.title || '',
      description: todo?.description || '',
      priority: todo?.priority || 'medium',
      due_date: todo?.due_date ? new Date(todo.due_date) : null,
      project_id: todo?.project_id || undefined,
      tags: todo?.tags || [],
      time_estimate: todo?.time_estimate || undefined,
    },
  });

  const handleSubmit = (values: TodoFormValues) => {
    const data: CreateTodoInput = {
      ...values,
      due_date: values.due_date ? values.due_date.toISOString() : undefined,
    };
    onSubmit(data);
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={todo ? 'Редактировать задачу' : 'Новая задача'}
      size="lg"
      styles={{ inner: { right: 0, left: 0 } }}
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Название"
            placeholder="Введите название задачи"
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Описание"
            placeholder="Добавьте описание"
            minRows={3}
            {...form.getInputProps('description')}
          />

          <Group grow>
            <Select
              label="Приоритет"
              data={priorityOptions}
              {...form.getInputProps('priority')}
            />

            <DateInput
              label="Срок выполнения"
              placeholder="Выберите дату"
              valueFormat="DD.MM.YYYY"
              clearable
              minDate={new Date()}
              {...form.getInputProps('due_date')}
            />
          </Group>

          <Select
            label="Проект"
            placeholder="Выберите проект"
            data={projects}
            clearable
            {...form.getInputProps('project_id')}
          />

          <TextInput
            label="Оценка времени (минуты)"
            placeholder="Введите оценку в минутах"
            type="number"
            min={0}
            {...form.getInputProps('time_estimate')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">
              {todo ? 'Сохранить' : 'Создать'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
