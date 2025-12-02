import { Card, Checkbox, Text, Badge, Group, ActionIcon, Menu, Progress } from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconClock, IconFlag, IconTag } from '@tabler/icons-react';
import type { Todo, TodoCategory } from '../types';
import dayjs from '../../../shared/dayjs';

interface TodoItemProps {
  todo: Todo;
  categories: TodoCategory[];
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
} as const;

const priorityLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочный',
} as const;

const statusColors = {
  todo: 'gray',
  in_progress: 'blue',
  completed: 'green',
  archived: 'dark',
} as const;

const statusLabels = {
  todo: 'К выполнению',
  in_progress: 'В процессе',
  completed: 'Завершено',
  archived: 'Архив',
} as const;

export default function TodoItem({ todo, categories, onToggle, onEdit, onDelete }: TodoItemProps) {
  const isCompleted = todo.status === 'completed';
  const isOverdue = todo.due_date && dayjs(todo.due_date).isBefore(dayjs(), 'day') && !isCompleted;

  const completedSubtasks = todo.subtasks.filter(s => s.completed).length;
  const totalSubtasks = todo.subtasks.length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const category = categories.find(c => c.id === todo.project_id);

  return (
    <Card shadow="xs" padding="md" withBorder style={{ width: '100%' }}>
      <Group justify="space-between" wrap="nowrap">
        <Group wrap="nowrap" style={{ flex: 1 }}>
          <Checkbox
            checked={isCompleted}
            onChange={(e) => onToggle(todo.id, e.currentTarget.checked)}
            size="md"
          />

          <div style={{ flex: 1 }}>
            <Group gap="xs" mb={4}>
              <Text
                size="sm"
                fw={500}
                td={isCompleted ? 'line-through' : undefined}
                c={isCompleted ? 'dimmed' : undefined}
              >
                {todo.title}
              </Text>

              {category && (
                <Badge size="xs" color={category.color} variant="filled" leftSection={<IconTag size={12} />}>
                  {category.name}
                </Badge>
              )}

              <Badge size="xs" color={priorityColors[todo.priority]} variant="dot">
                {priorityLabels[todo.priority]}
              </Badge>

              <Badge size="xs" color={statusColors[todo.status]}>
                {statusLabels[todo.status]}
              </Badge>
            </Group>

            {todo.description && (
              <Text size="xs" c="dimmed" lineClamp={2} mb={4} style={{ whiteSpace: 'pre-wrap' }}>
                {todo.description}
              </Text>
            )}

            <Group gap="xs">
              {todo.due_date && (
                <Group gap={4}>
                  <IconClock size={14} color={isOverdue ? 'red' : 'gray'} />
                  <Text size="xs" c={isOverdue ? 'red' : 'dimmed'}>
                    {dayjs(todo.due_date).format('DD MMM')}
                  </Text>
                </Group>
              )}

              {todo.time_estimate && (
                <Group gap={4}>
                  <IconFlag size={14} />
                  <Text size="xs" c="dimmed">
                    {Math.floor(todo.time_estimate / 60)}ч {todo.time_estimate % 60}м
                  </Text>
                </Group>
              )}

              {totalSubtasks > 0 && (
                <Text size="xs" c="dimmed">
                  {completedSubtasks}/{totalSubtasks} подзадач
                </Text>
              )}

              {todo.tags.map((tag) => (
                <Badge key={tag.id} size="xs" variant="light" color={tag.color}>
                  {tag.name}
                </Badge>
              ))}
            </Group>

            {totalSubtasks > 0 && (
              <Progress value={progress} size="xs" mt="xs" />
            )}
          </div>
        </Group>

        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(todo)}>
              Редактировать
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={() => onDelete(todo.id)}
            >
              Удалить
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}
