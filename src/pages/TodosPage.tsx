import { useEffect, useState, useMemo } from 'react';
import { Title, Button, Group, Stack, SegmentedControl, TextInput, Select } from '@mantine/core';
import { IconPlus, IconSearch, IconTag } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import PageContainer from '../shared/ui/PageContainer';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  loadTodos,
  loadCategories,
  createTodoAsync,
  updateTodoAsync,
  deleteTodoAsync,
  createCategoryAsync,
  setStatusFilter,
  setSearchFilter,
  setCategoryFilter,
} from '../features/todos/todosSlice';
import TodoItem from '../features/todos/ui/TodoItem';
import TodoModal from '../features/todos/ui/TodoModal';
import CategoryModal from '../features/todos/ui/CategoryModal';
import type { Todo, TodoStatus, CreateTodoInput } from '../features/todos/types';

export default function TodosPage() {
  const dispatch = useAppDispatch();
  const todos = useAppSelector((s) => s.todos.items);
  const categories = useAppSelector((s) => s.todos.categories);
  const filters = useAppSelector((s) => s.todos.filters);
  const loading = useAppSelector((s) => s.todos.loading);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [categoryModalOpened, { open: openCategoryModal, close: closeCategoryModal }] = useDisclosure(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useEffect(() => {
    dispatch(loadTodos());
    dispatch(loadCategories());
    // Устанавливаем "Активные" по умолчанию при первой загрузке
    if (filters.status.length === 0) {
      dispatch(setStatusFilter(['todo', 'in_progress']));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (filters.status.length > 0 && !filters.status.includes(todo.status)) {
        return false;
      }

      if (filters.project_id && todo.project_id !== filters.project_id) {
        return false;
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          todo.title.toLowerCase().includes(search) ||
          todo.description?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [todos, filters]);

  const handleCreateTodo = (data: CreateTodoInput) => {
    dispatch(createTodoAsync(data));
  };

  const handleUpdateTodo = (data: CreateTodoInput) => {
    if (editingTodo) {
      dispatch(updateTodoAsync({ id: editingTodo.id, updates: data }));
      setEditingTodo(null);
    }
  };

  const handleToggleTodo = (id: string, completed: boolean) => {
    dispatch(updateTodoAsync({
      id,
      updates: { status: completed ? 'completed' : 'todo' },
    }));
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    openModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить задачу?')) {
      dispatch(deleteTodoAsync(id));
    }
  };

  const handleModalClose = () => {
    setEditingTodo(null);
    closeModal();
  };

  const handleCreateCategory = (data: { name: string; color: string; description?: string }) => {
    dispatch(createCategoryAsync(data));
  };

  return (
    <PageContainer maxWidth={1600}>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Задачи</Title>
        <Group>
          <Button
            variant="light"
            leftSection={<IconTag size={16} />}
            onClick={openCategoryModal}
          >
            Новая категория
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
            Создать задачу
          </Button>
        </Group>
      </Group>

      <Stack gap="md" mb="lg">
        <TextInput
          placeholder="Поиск задач..."
          leftSection={<IconSearch size={16} />}
          value={filters.search}
          onChange={(e) => dispatch(setSearchFilter(e.currentTarget.value))}
        />

        <Group grow>
          <SegmentedControl
            value={
              filters.status.length === 0
                ? 'all'
                : filters.status.length === 2 && filters.status.includes('todo') && filters.status.includes('in_progress')
                  ? 'active'
                  : filters.status[0]
            }
            onChange={(value) => {
              if (value === 'active') {
                dispatch(setStatusFilter(['todo', 'in_progress']));
              } else if (value === 'all') {
                dispatch(setStatusFilter([]));
              } else {
                dispatch(setStatusFilter([value as TodoStatus]));
              }
            }}
            data={[
              { label: 'Активные', value: 'active' },
              { label: 'Завершено', value: 'completed' },
              { label: 'Все', value: 'all' },
            ]}
          />

          <Select
            placeholder="Все категории"
            leftSection={<IconTag size={16} />}
            data={[
              { value: '', label: 'Все категории' },
              ...categoryOptions,
            ]}
            value={filters.project_id || ''}
            onChange={(value) => dispatch(setCategoryFilter(value || undefined))}
            clearable
          />
        </Group>
      </Stack>

      {loading && <Title order={4}>Загрузка...</Title>}

      <Stack gap="md">
        {filteredTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            categories={categories}
            onToggle={handleToggleTodo}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

        {!loading && filteredTodos.length === 0 && (
          <Title order={4} c="dimmed" ta="center" mt="xl">
            Нет задач
          </Title>
        )}
      </Stack>

      <TodoModal
        opened={modalOpened}
        onClose={handleModalClose}
        onSubmit={editingTodo ? handleUpdateTodo : handleCreateTodo}
        todo={editingTodo}
        categories={categoryOptions}
      />

      <CategoryModal
        opened={categoryModalOpened}
        onClose={closeCategoryModal}
        onSubmit={handleCreateCategory}
      />
    </PageContainer>
  );
}
