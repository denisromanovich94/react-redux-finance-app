import { useEffect, useState, useMemo } from 'react';
import { Title, Button, Group, Stack, SegmentedControl, TextInput } from '@mantine/core';
import { IconPlus, IconSearch, IconFolder } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import PageContainer from '../shared/ui/PageContainer';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  loadTodos,
  loadProjects,
  createTodoAsync,
  updateTodoAsync,
  deleteTodoAsync,
  createProjectAsync,
  setStatusFilter,
  setSearchFilter,
} from '../features/todos/todosSlice';
import TodoItem from '../features/todos/ui/TodoItem';
import TodoModal from '../features/todos/ui/TodoModal';
import ProjectModal from '../features/todos/ui/ProjectModal';
import type { Todo, TodoStatus, CreateTodoInput } from '../features/todos/types';

export default function TodosPage() {
  const dispatch = useAppDispatch();
  const todos = useAppSelector((s) => s.todos.items);
  const projects = useAppSelector((s) => s.todos.projects);
  const filters = useAppSelector((s) => s.todos.filters);
  const loading = useAppSelector((s) => s.todos.loading);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [projectModalOpened, { open: openProjectModal, close: closeProjectModal }] = useDisclosure(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useEffect(() => {
    dispatch(loadTodos());
    dispatch(loadProjects());
  }, [dispatch]);

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects]
  );

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (filters.status.length > 0 && !filters.status.includes(todo.status)) {
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

  const handleCreateProject = (data: { name: string; color: string; description?: string }) => {
    dispatch(createProjectAsync(data));
  };

  return (
    <PageContainer maxWidth={1600}>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Задачи</Title>
        <Group>
          <Button
            variant="light"
            leftSection={<IconFolder size={16} />}
            onClick={openProjectModal}
          >
            Новый проект
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

        <SegmentedControl
          value={filters.status.length === 1 ? filters.status[0] : 'all'}
          onChange={(value) => {
            if (value === 'all') {
              dispatch(setStatusFilter([]));
            } else {
              dispatch(setStatusFilter([value as TodoStatus]));
            }
          }}
          data={[
            { label: 'Все', value: 'all' },
            { label: 'К выполнению', value: 'todo' },
            { label: 'В процессе', value: 'in_progress' },
            { label: 'Завершено', value: 'completed' },
          ]}
        />
      </Stack>

      {loading && <Title order={4}>Загрузка...</Title>}

      <Stack gap="md">
        {filteredTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
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
        projects={projectOptions}
      />

      <ProjectModal
        opened={projectModalOpened}
        onClose={closeProjectModal}
        onSubmit={handleCreateProject}
      />
    </PageContainer>
  );
}
