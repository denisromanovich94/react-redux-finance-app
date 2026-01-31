import { useEffect, useState, useMemo } from 'react';
import {
  Card, Title, Button, Table, Modal, Stack, NumberInput,
  Select, TextInput, Group, ActionIcon, Text, Badge,
  Switch, Tooltip, Alert, Loader, Center, Paper, Grid
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconPencil, IconTrash, IconPlayerPlay,
  IconCalendar, IconCreditCard, IconHome, IconReceipt,
  IconBuildingBank, IconBolt, IconPhone, IconRepeat
} from '@tabler/icons-react';

import PageContainer from '../shared/ui/PageContainer';
import StatCard from '../shared/ui/StatCard';
import { useAppDispatch, useAppSelector } from '../hooks';
import { formatRub } from '../shared/utils/currency';
import dayjs from '../shared/dayjs';

import {
  loadRecurringExpenses,
  loadRecurringExpenseTypes,
  addRecurringExpense,
  updateRecurringExpenseAsync,
  deleteRecurringExpenseAsync,
  addRecurringExpenseType,
  processRecurringExpensesAsync,
  selectMonthlyTotal,
  selectPendingExpenses,
  selectRecurringExpenseTypes,
  selectProcessingStatus,
} from '../features/recurringExpenses/recurringExpensesSlice';
import { loadTransactions } from '../features/transactions/transactionsSlice';
import { loadCategories } from '../features/categories/categoriesSlice';

import type { RecurringExpense, CreateRecurringExpenseInput } from '../features/recurringExpenses/types';

// Иконки для типов
const TYPE_ICONS: Record<string, React.ReactNode> = {
  IconCreditCard: <IconCreditCard size={16} />,
  IconHome: <IconHome size={16} />,
  IconBuildingBank: <IconBuildingBank size={16} />,
  IconReceipt: <IconReceipt size={16} />,
  IconBolt: <IconBolt size={16} />,
  IconPhone: <IconPhone size={16} />,
};

const DEFAULT_FORM_DATA: CreateRecurringExpenseInput = {
  name: '',
  type_id: null,
  amount: 0,
  day_of_month: 1,
  start_date: dayjs().format('YYYY-MM-DD'),
  end_date: null,
  category_id: null,
  comment: null,
};

export default function RecurringExpensesPage() {
  const dispatch = useAppDispatch();
  const isSmall = useMediaQuery('(max-width: 48em)');

  const { items, types, loading } = useAppSelector((s) => s.recurringExpenses);
  const categories = useAppSelector((s) => s.categories.items);
  const monthlyTotal = useAppSelector(selectMonthlyTotal);
  const pendingExpenses = useAppSelector(selectPendingExpenses);
  const processingStatus = useAppSelector(selectProcessingStatus);
  const expenseTypes = useAppSelector(selectRecurringExpenseTypes);

  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Форма
  const [formData, setFormData] = useState<CreateRecurringExpenseInput>(DEFAULT_FORM_DATA);
  const [hasEndDate, setHasEndDate] = useState(false);

  // Модалка добавления типа
  const [typeModalOpened, setTypeModalOpened] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  useEffect(() => {
    dispatch(loadRecurringExpenses());
    dispatch(loadRecurringExpenseTypes());
    dispatch(loadCategories());
  }, [dispatch]);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );

  const typeOptions = useMemo(
    () => expenseTypes.map((t) => ({
      value: t.id,
      label: t.name,
    })),
    [expenseTypes]
  );

  const categoryOptions = useMemo(
    () => expenseCategories.map((c) => ({
      value: c.id,
      label: c.name,
    })),
    [expenseCategories]
  );

  const dayOptions = useMemo(
    () => Array.from({ length: 31 }, (_, i) => ({
      value: String(i + 1),
      label: `${i + 1} числа`,
    })),
    []
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(DEFAULT_FORM_DATA);
    setHasEndDate(false);
    open();
  };

  const handleOpenEdit = (expense: RecurringExpense) => {
    setEditingId(expense.id);
    setFormData({
      name: expense.name,
      type_id: expense.type_id,
      amount: expense.amount,
      day_of_month: expense.day_of_month,
      start_date: expense.start_date,
      end_date: expense.end_date,
      category_id: expense.category_id,
      comment: expense.comment,
    });
    setHasEndDate(!!expense.end_date);
    open();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      notifications.show({
        message: 'Введите название расхода',
        color: 'red',
      });
      return;
    }
    if (formData.amount <= 0) {
      notifications.show({
        message: 'Сумма должна быть больше нуля',
        color: 'red',
      });
      return;
    }

    const payload = {
      ...formData,
      end_date: hasEndDate ? formData.end_date : null,
    };

    try {
      if (editingId) {
        await dispatch(updateRecurringExpenseAsync({
          id: editingId,
          changes: payload,
        })).unwrap();
        notifications.show({ message: 'Расход обновлен', color: 'teal' });
      } else {
        await dispatch(addRecurringExpense(payload)).unwrap();
        notifications.show({ message: 'Расход добавлен', color: 'teal' });
      }
      close();
    } catch {
      notifications.show({
        message: 'Ошибка сохранения',
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteRecurringExpenseAsync(id)).unwrap();
      notifications.show({ message: 'Расход удален', color: 'teal' });
    } catch {
      notifications.show({ message: 'Ошибка удаления', color: 'red' });
    }
  };

  const handleToggleActive = async (expense: RecurringExpense) => {
    await dispatch(updateRecurringExpenseAsync({
      id: expense.id,
      changes: { is_active: !expense.is_active },
    }));
  };

  const handleProcessNow = async () => {
    try {
      const result = await dispatch(processRecurringExpensesAsync()).unwrap();
      if (result.created > 0) {
        notifications.show({
          title: 'Готово',
          message: `Создано ${result.created} транзакций`,
          color: 'teal',
        });
        dispatch(loadTransactions());
      } else {
        notifications.show({
          message: 'Все расходы уже обработаны в этом месяце',
          color: 'blue',
        });
      }
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось создать транзакции',
        color: 'red',
      });
    }
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    try {
      await dispatch(addRecurringExpenseType({ name: newTypeName.trim() })).unwrap();
      setNewTypeName('');
      setTypeModalOpened(false);
      notifications.show({ message: 'Тип добавлен', color: 'teal' });
    } catch {
      notifications.show({ message: 'Ошибка добавления типа', color: 'red' });
    }
  };

  const getTypeById = (id: string | null) => types.find((t) => t.id === id);

  const activeCount = items.filter((e) => e.is_active).length;

  return (
    <PageContainer maxWidth={1200}>
      {/* Статистика */}
      <Grid mb="lg">
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <StatCard
            label="Обязательные платежи (месяц)"
            value={formatRub(monthlyTotal)}
            color="red"
            icon={<IconCalendar size={18} />}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <StatCard
            label="Активных расходов"
            value={activeCount.toString()}
            color="blue"
            icon={<IconRepeat size={18} />}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <StatCard
            label="Ожидают обработки"
            value={pendingExpenses.length.toString()}
            color={pendingExpenses.length > 0 ? 'orange' : 'green'}
            icon={<IconPlayerPlay size={18} />}
          />
        </Grid.Col>
      </Grid>

      <Card radius="lg" p={isSmall ? 'sm' : 'lg'} withBorder>
        <Group justify="space-between" mb="md" wrap="wrap">
          <Title order={isSmall ? 3 : 2}>Регулярные расходы</Title>
          <Group gap="sm">
            {pendingExpenses.length > 0 && (
              <Button
                variant="light"
                color="orange"
                leftSection={<IconPlayerPlay size={16} />}
                onClick={handleProcessNow}
                loading={processingStatus === 'processing'}
                size={isSmall ? 'xs' : 'sm'}
              >
                Создать транзакции ({pendingExpenses.length})
              </Button>
            )}
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleOpenAdd}
              size={isSmall ? 'xs' : 'sm'}
            >
              Добавить
            </Button>
          </Group>
        </Group>

        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : items.length === 0 ? (
          <Alert color="blue" variant="light">
            У вас пока нет регулярных расходов. Добавьте кредит, аренду, абонемент или другой повторяющийся платеж.
          </Alert>
        ) : (
          <>
            {/* Desktop Table */}
            {!isSmall && (
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Название</Table.Th>
                    <Table.Th>Тип</Table.Th>
                    <Table.Th ta="right">Сумма</Table.Th>
                    <Table.Th ta="center">День</Table.Th>
                    <Table.Th ta="center">Срок</Table.Th>
                    <Table.Th ta="center">Активен</Table.Th>
                    <Table.Th ta="right">Действия</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {items.map((expense) => {
                    const expenseType = getTypeById(expense.type_id);
                    const isPending = pendingExpenses.some((p) => p.id === expense.id);
                    return (
                      <Table.Tr
                        key={expense.id}
                        style={{ opacity: expense.is_active ? 1 : 0.5 }}
                        bg={isPending ? 'var(--mantine-color-orange-light)' : undefined}
                      >
                        <Table.Td>
                          <Text fw={500}>{expense.name}</Text>
                          {expense.comment && (
                            <Text size="xs" c="dimmed">{expense.comment}</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {expenseType?.icon && TYPE_ICONS[expenseType.icon]}
                            <Text size="sm">{expenseType?.name || '—'}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text c="red" fw={500}>{formatRub(expense.amount)}</Text>
                        </Table.Td>
                        <Table.Td ta="center">
                          <Badge variant="light">{expense.day_of_month} числа</Badge>
                        </Table.Td>
                        <Table.Td ta="center">
                          {expense.end_date ? (
                            <Text size="sm">до {dayjs(expense.end_date).format('DD.MM.YYYY')}</Text>
                          ) : (
                            <Text size="sm" c="dimmed">бессрочно</Text>
                          )}
                        </Table.Td>
                        <Table.Td ta="center">
                          <Switch
                            checked={expense.is_active}
                            onChange={() => handleToggleActive(expense)}
                            size="sm"
                          />
                        </Table.Td>
                        <Table.Td ta="right">
                          <Group gap="xs" justify="flex-end">
                            <Tooltip label="Редактировать">
                              <ActionIcon
                                variant="subtle"
                                onClick={() => handleOpenEdit(expense)}
                              >
                                <IconPencil size={18} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Удалить">
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() => handleDelete(expense.id)}
                              >
                                <IconTrash size={18} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}

            {/* Mobile Cards */}
            {isSmall && (
              <Stack gap="sm">
                {items.map((expense) => {
                  const expenseType = getTypeById(expense.type_id);
                  const isPending = pendingExpenses.some((p) => p.id === expense.id);
                  return (
                    <Paper
                      key={expense.id}
                      p="md"
                      withBorder
                      radius="md"
                      style={{
                        opacity: expense.is_active ? 1 : 0.5,
                        backgroundColor: isPending ? 'var(--mantine-color-orange-light)' : undefined,
                      }}
                    >
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          {expenseType?.icon && TYPE_ICONS[expenseType.icon]}
                          <Text fw={500}>{expense.name}</Text>
                        </Group>
                        <Switch
                          checked={expense.is_active}
                          onChange={() => handleToggleActive(expense)}
                          size="sm"
                        />
                      </Group>
                      {expense.comment && (
                        <Text size="xs" c="dimmed" mb="xs">{expense.comment}</Text>
                      )}
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          <Badge variant="light" size="sm">{expense.day_of_month} числа</Badge>
                          {expense.end_date ? (
                            <Badge variant="outline" size="sm">до {dayjs(expense.end_date).format('DD.MM.YY')}</Badge>
                          ) : (
                            <Badge variant="outline" size="sm" color="gray">бессрочно</Badge>
                          )}
                        </Group>
                        <Text c="red" fw={700} size="lg">
                          {formatRub(expense.amount)}
                        </Text>
                      </Group>
                      <Group gap="xs" justify="flex-end">
                        <ActionIcon
                          variant="light"
                          size="lg"
                          onClick={() => handleOpenEdit(expense)}
                        >
                          <IconPencil size={18} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="lg"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </>
        )}
      </Card>

      {/* Модалка добавления/редактирования */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingId ? 'Редактировать расход' : 'Добавить расход'}
        size="md"
      >
        <Stack>
          <TextInput
            label="Название"
            placeholder="Например: Ипотека Сбербанк"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Group grow align="flex-end">
            <Select
              label="Тип расхода"
              placeholder="Выберите тип"
              data={typeOptions}
              value={formData.type_id}
              onChange={(val) => setFormData({ ...formData, type_id: val })}
              clearable
            />
            <Button
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={() => setTypeModalOpened(true)}
            >
              Свой тип
            </Button>
          </Group>

          <NumberInput
            label="Сумма (в рублях)"
            placeholder="Введите сумму"
            value={formData.amount}
            onChange={(val) => setFormData({ ...formData, amount: Number(val) || 0 })}
            min={0}
            thousandSeparator=" "
            required
          />

          <Select
            label="День списания"
            data={dayOptions}
            value={String(formData.day_of_month)}
            onChange={(val) => setFormData({
              ...formData,
              day_of_month: Number(val) || 1
            })}
          />

          <DateInput
            label="Дата начала"
            value={formData.start_date ? dayjs(formData.start_date).toDate() : null}
            onChange={(val) => setFormData({
              ...formData,
              start_date: val ? dayjs(val).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
            })}
            valueFormat="DD.MM.YYYY"
          />

          <Switch
            label="Указать дату окончания"
            checked={hasEndDate}
            onChange={(e) => setHasEndDate(e.currentTarget.checked)}
          />

          {hasEndDate && (
            <DateInput
              label="Дата окончания"
              placeholder="Выберите дату"
              value={formData.end_date ? dayjs(formData.end_date).toDate() : null}
              onChange={(val) => setFormData({
                ...formData,
                end_date: val ? dayjs(val).format('YYYY-MM-DD') : null
              })}
              valueFormat="DD.MM.YYYY"
              minDate={formData.start_date ? dayjs(formData.start_date).toDate() : undefined}
            />
          )}

          <Select
            label="Категория транзакции"
            description="В какую категорию попадут созданные транзакции"
            placeholder="Выберите категорию"
            data={categoryOptions}
            value={formData.category_id}
            onChange={(val) => setFormData({ ...formData, category_id: val })}
            clearable
          />

          <TextInput
            label="Комментарий"
            placeholder="Необязательно"
            value={formData.comment || ''}
            onChange={(e) => setFormData({
              ...formData,
              comment: e.target.value || null
            })}
          />

          <Button onClick={handleSubmit} fullWidth mt="md">
            {editingId ? 'Сохранить' : 'Добавить'}
          </Button>
        </Stack>
      </Modal>

      {/* Модалка добавления типа */}
      <Modal
        opened={typeModalOpened}
        onClose={() => setTypeModalOpened(false)}
        title="Добавить свой тип"
        size="sm"
      >
        <Stack>
          <TextInput
            label="Название типа"
            placeholder="Например: Подписки"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
          />
          <Button onClick={handleAddType} disabled={!newTypeName.trim()}>
            Добавить
          </Button>
        </Stack>
      </Modal>
    </PageContainer>
  );
}
