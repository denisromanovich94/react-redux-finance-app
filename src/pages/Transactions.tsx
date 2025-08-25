import { Card, Table, Title, Text, Button, Modal, NumberInput, Stack, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import PageContainer from '../shared/ui/PageContainer';
import { useAppDispatch, useAppSelector } from '../hooks';
import { DateInput } from '@mantine/dates';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { formatRub } from '../shared/utils/currency';
import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import {
  loadTransactions,
  addTransactionAsync,
  updateTransactionAsync,
  deleteTransactionAsync,
} from '../features/transactions/transactionsSlice';
import { useEffect, useState } from 'react';
import { Alert, Loader, Center } from '@mantine/core';
import { SegmentedControl } from '@mantine/core';
import { TextInput } from '@mantine/core';
import { loadCategories } from '../features/categories/categoriesSlice';
import { addCategoryAsync } from '../features/categories/categoriesSlice';
import { Radio } from '@mantine/core';




export default function Transactions() {
  
  const loading = useAppSelector((s) => s.transactions.loading);
const error = useAppSelector((s) => s.transactions.error);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
const items = useAppSelector((s) => s.transactions.items);
const catItems = useAppSelector((s) => s.categories.items);
const catByName = new Map(catItems.map((c) => [c.name, c]));
const catOptions = catItems.map((c) => ({
  value: c.name,
  label: c.name,
  color: c.color,
  type: c.type,
}));

const categories = Array.from(new Set(items.map((i) => i.category)));
const visibleItems = items
  .filter((i) => !filterCategory || i.category === filterCategory)
  .filter((i) => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'income') return i.amount > 0;
    return i.amount < 0;
  })
  .filter((i) =>
    dateQuery.trim()
      ? i.date.toLowerCase().includes(dateQuery.trim().toLowerCase())
      : true
  );
const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
const [dateQuery, setDateQuery] = useState('');
const [catOpened, setCatOpened] = useState(false);
const [newCatName, setNewCatName] = useState('');
const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
const [newCatColor, setNewCatColor] = useState('teal'); 
const dispatch = useAppDispatch();
useEffect(() => {
  dispatch(loadTransactions());
  dispatch(loadCategories());
}, [dispatch]);
const onEdit = (id: string) => {
  const tx = items.find((t) => t.id === id);
  if (!tx) return;
  setEditingId(id);
  form.setValues({
    date: dayjs(tx.date, 'DD.MM.YYYY').toDate(),
    category: tx.category,
    amount: tx.amount,
  });
  open();
};

const onDelete = (id: string) => {
  dispatch(deleteTransactionAsync(id));
};
  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm<{
  date: Date | null;
  category: string;
  amount: number;
}>({
  initialValues: {
    date: null,
    category: '',
    amount: 0,
  },
  validate: {
    date: (value) => (value ? null : 'Выберите дату'),
    category: (value) => (value ? null : 'Выберите категорию'),
    amount: (value) => (Number(value) !== 0 ? null : 'Сумма не должна быть равна 0'),
  },
});
const colorOptions = [
  { value: 'teal', label: 'Бирюзовый' },
  { value: 'blue', label: 'Синий' },
  { value: 'red', label: 'Красный' },
  { value: 'purple', label: 'Пурпурный' },
  { value: 'yellow', label: 'Жёлтый' },
  { value: 'orange', label: 'Оранжевый' },
  { value: 'violet', label: 'Лиловый' },
];


  return (
    <PageContainer maxWidth={1200}>
    <Card radius="lg" p="lg" withBorder>
      <Title order={2} mb="md">Транзакции</Title>
<Button
  onClick={() => {
    setEditingId(null);
    form.reset();
    open();
  }}
  mb="md"
>
  Добавить транзакцию
</Button>

<Modal opened={opened} onClose={close} title={editingId ? 'Редактировать транзакцию' : 'Добавить транзакцию'}>
<form
  onSubmit={form.onSubmit((values) => {
    const payload = {
      date: dayjs(values.date!).format('DD.MM.YYYY'),
      category: values.category,
      amount: Number(values.amount),
    };

    if (editingId) {
      dispatch(updateTransactionAsync({ id: editingId, changes: payload }));
    } else {
      dispatch(addTransactionAsync(payload));
    }

    form.reset();
    setEditingId(null);
    close();
  })}
>
    <DateInput
  label="Дата"
  placeholder="ДД.ММ.ГГГГ"
  value={form.values.date}
  onChange={(value) => form.setFieldValue('date', value as Date | null)}
  valueFormat="DD.MM.YYYY"
  locale="ru"
  mb="sm"
  clearable
/>
    <Select
  label="Категория"
  placeholder="Выберите категорию"
  data={catOptions}
  value={form.values.category}
  onChange={(val) => {
    form.setFieldValue('category', val || '');
    const cat = val ? catByName.get(val) : undefined;
    if (cat) {

      const amt = Number(form.values.amount || 0);
      if (cat.type === 'income' && amt < 0) form.setFieldValue('amount', Math.abs(amt));
      if (cat.type === 'expense' && amt > 0) form.setFieldValue('amount', -Math.abs(amt));
    }
  }}
  renderOption={({ option }) => {
  const { label } = option;
  const color = (option as { label: string; value: string; color?: string }).color;

  return (
    <Group gap="xs">
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: color || 'gray',
        }}
      />
      <span>{label}</span>
    </Group>
  );
}}
  mb="sm"
/>
    <NumberInput
      label="Сумма"
      placeholder="Введите сумму (отрицательное — расход)"
      {...form.getInputProps('amount')}
      mb="sm"
    />
    <Button type="submit" mt="md">Сохранить</Button>
  </form>
</Modal>
<Modal
  opened={catOpened}
  onClose={() => setCatOpened(false)}
  title="Новая категория"
>
  <Stack>
    <TextInput
      label="Название"
      placeholder="Например: Еда"
      value={newCatName}
      onChange={(e) => setNewCatName(e.currentTarget.value)}
    />

    <Radio.Group
      label="Тип"
      value={newCatType}
      onChange={(v) => setNewCatType(v as 'income' | 'expense')}
    >
      <Group mt="xs">
        <Radio value="income" label="Доход" />
        <Radio value="expense" label="Расход" />
      </Group>
    </Radio.Group>

    <Select
  label="Цвет"
  value={newCatColor}
  onChange={(v) => setNewCatColor(v || 'teal')}
  data={colorOptions}
  renderOption={({ option }) => (
    <Group gap="xs">
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          backgroundColor: option.value,
        }}
      />
      <span>{option.label}</span>
    </Group>
  )}
/>

    <Group justify="flex-end" mt="sm">
      <Button
        onClick={() => {
          if (!newCatName.trim()) return;
          dispatch(
            addCategoryAsync({
              name: newCatName.trim(),
              type: newCatType,
              color: newCatColor,
              icon: null,
            })
          );
          setNewCatName('');
          setNewCatType('expense');
          setNewCatColor('teal');
          setCatOpened(false);
        }}
      >
        Сохранить
      </Button>
    </Group>
  </Stack>
</Modal>

<Button variant="light" onClick={() => setCatOpened(true)} mb="md">
  + Добавить категорию
</Button>
<Select
  placeholder="Все категории"
  data={categories}
  value={filterCategory}
  onChange={setFilterCategory}
  clearable
  mb="md"
/>

<SegmentedControl
  data={[
    { label: 'Все', value: 'all' },
    { label: 'Доход', value: 'income' },
    { label: 'Расход', value: 'expense' },
  ]}
  value={typeFilter}
  onChange={(v) => setTypeFilter(v as 'all' | 'income' | 'expense')}
  mb="md"
/>
<TextInput
  label="Поиск по дате"
  placeholder="Например: 08.2025 или 01.08.2025"
  value={dateQuery}
  onChange={(e) => setDateQuery(e.currentTarget.value)}
  mb="md"
/>
{loading && (
  <Center my="md">
    <Loader />
  </Center>
)}

{error && (
  <Alert color="red" my="md" title="Ошибка">
    {error}
  </Alert>
)}
{!loading && !error && (
  <Table striped highlightOnHover withTableBorder>
  <Table.Thead>
  <Table.Tr>
    <Table.Th>Дата</Table.Th>
    <Table.Th>Категория</Table.Th>
    <Table.Th ta="right">Сумма</Table.Th>
    <Table.Th ta="right">Действия</Table.Th>
  </Table.Tr>
</Table.Thead>
  <Table.Tbody>
  {visibleItems.map((r) => (
    <Table.Tr key={r.id}>
      <Table.Td>{r.date}</Table.Td>
      <Table.Td>
  <Group gap="xs">
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: catByName.get(r.category)?.color || 'gray',
      }}
    />
    <span>{r.category}</span>
  </Group>
</Table.Td>
      <Table.Td ta="right">
        <Text c={r.amount < 0 ? 'red' : 'green'}>
          {formatRub(r.amount)}
        </Text>
      </Table.Td>
      <Table.Td ta="right">
        <Group gap="xs" justify="flex-end">
          <Tooltip label="Редактировать">
            <ActionIcon variant="subtle" onClick={() => onEdit(r.id)}>
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Удалить">
            <ActionIcon variant="subtle" color="red" onClick={() => onDelete(r.id)}>
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))}
</Table.Tbody>
</Table>
)}
    </Card>
    </PageContainer>
  );
}