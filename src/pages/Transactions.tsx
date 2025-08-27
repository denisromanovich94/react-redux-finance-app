import {
  Card,Table,Title,Text,Button,Modal,NumberInput,Stack,Select,ActionIcon,Group,Tooltip,Alert,Loader,Center,SegmentedControl,TextInput as MantineTextInput,Radio,} 
  from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import PageContainer from '../shared/ui/PageContainer';
import { useAppDispatch, useAppSelector } from '../hooks';
import { useTransactionForm, toTxPayload } from '../features/transactions/useTransactionForm';
import { formatRub } from '../shared/utils/currency';
import {
  loadTransactions,
  addTransactionAsync,
  updateTransactionAsync,
  deleteTransactionAsync,
} from '../features/transactions/transactionsSlice';
import { loadCategories, addCategoryAsync } from '../features/categories/categoriesSlice';
import { useEffect, useState } from 'react';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { selectTransactionCategoryNames, makeSelectVisibleTransactions } from '../features/transactions/selectors';
import { useMemo } from 'react';


const colorOptions = [
    { value: 'teal', label: 'Бирюзовый' },
    { value: 'blue', label: 'Синий' },
    { value: 'red', label: 'Красный' },
    { value: 'yellow', label: 'Жёлтый' },
    { value: 'orange', label: 'Оранжевый' },
    { value: 'purple', label: 'Пурпурный' },
  ];
export default function Transactions() {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector((s) => s.transactions.items);
  const transactionsLoading = useAppSelector((s) => s.transactions.loading);
  const transactionsError = useAppSelector((s) => s.transactions.error);
  const categories = useAppSelector((s) => s.categories.items);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { form, setFromTransaction } = useTransactionForm();
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateQuery, setDateQuery] = useState('');
  const [catOpened, setCatOpened] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatColor, setNewCatColor] = useState('teal');
  useEffect(() => {
    dispatch(loadTransactions());
    dispatch(loadCategories());
  }, [dispatch]);
  const catByName = new Map(categories.map((c) => [c.name, c]));
  const catOptions = categories.map((c) => ({
    value: c.name,
    label: c.name,
    color: c.color,
    type: c.type,
  }));
const visibleSelector = useMemo(
  () => makeSelectVisibleTransactions(filterCategory, typeFilter, dateQuery),
  [filterCategory, typeFilter, dateQuery]
);

const visibleTransactions = useAppSelector(visibleSelector);
const categoryNames = useAppSelector(selectTransactionCategoryNames);
  const onEdit = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    setEditingId(id);
    setFromTransaction({ date: tx.date, category: tx.category, amount: tx.amount });
    open();
  };
  const onDelete = (id: string) => {
    dispatch(deleteTransactionAsync(id));
  };

const canSaveCategory = newCatName.trim().length > 0;

const resetNewCategoryForm = () => {
  setNewCatName('');
  setNewCatType('expense');
  setNewCatColor('teal');
};

const handleSaveCategory = () => {
  if (!canSaveCategory) return;

  dispatch(
    addCategoryAsync({
      name: newCatName.trim(),
      type: newCatType,
      color: newCatColor,
      icon: null,
    })
  );

  resetNewCategoryForm();
  setCatOpened(false);
};
const handleCategoryChange = (val: string | null) => {
  form.setFieldValue('category', val ?? '');

  const cat = val ? catByName.get(val) : undefined;
  if (!cat) {
    return;
  }

  const amt = Number(form.values.amount || 0);

  if (cat.type === 'income' && amt < 0) {
    form.setFieldValue('amount', Math.abs(amt));
  } else if (cat.type === 'expense' && amt > 0) {
    form.setFieldValue('amount', -Math.abs(amt));
  }
};
const handleSubmitTransaction = form.onSubmit((values) => {
  const payload = toTxPayload(values);

  if (editingId) {
    dispatch(updateTransactionAsync({ id: editingId, changes: payload }));
  } else {
    dispatch(addTransactionAsync(payload));
  }

  form.reset();
  setEditingId(null);
  close();
});
const handleAddTransaction = () => {
  setEditingId(null);
  form.reset();
  open();
};
  return (
    <PageContainer maxWidth={1200}>
      <Card radius="lg" p="lg" withBorder>
        <Title order={2} mb="md">Транзакции</Title>
<Button onClick={handleAddTransaction} mb="md">
  Добавить транзакцию
</Button>

        <Modal
          opened={opened}
          onClose={close}
          title={editingId ? 'Редактировать транзакцию' : 'Добавить транзакцию'}
        >
          <form
            onSubmit={handleSubmitTransaction}
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
  onChange={handleCategoryChange}
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
            <MantineTextInput
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
             <Button onClick={handleSaveCategory} disabled={!canSaveCategory}>
  Сохранить
</Button>
            </Group>
          </Stack>
        </Modal>

        <Button variant="light" onClick={() => setCatOpened(true)} mb="md">
          + Добавить категорию
        </Button>

        <Select
  label="Фильтр по категории"
  placeholder="Все категории"
  data={categoryNames}
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

        <MantineTextInput
          label="Поиск по дате"
          placeholder="Например: 08.2025 или 01.08.2025"
          value={dateQuery}
          onChange={(e) => setDateQuery(e.currentTarget.value)}
          mb="md"
        />

        {transactionsLoading && (
          <Center my="md">
            <Loader />
          </Center>
        )}

        {transactionsError && (
          <Alert color="red" my="md" title="Ошибка">
            {transactionsError}
          </Alert>
        )}

        {!transactionsLoading && !transactionsError && (
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
              {visibleTransactions.map((r) => (
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
