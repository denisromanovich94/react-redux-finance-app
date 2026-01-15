import {
  Card,Table,Title,Text,Button,Modal,NumberInput,Stack,Select,Tabs,ActionIcon,Grid, Textarea, ScrollArea,Group,Tooltip,Alert,Loader,Center,SegmentedControl,TextInput as MantineTextInput,Radio,Box,Paper,ColorInput,}
  from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import PageContainer from '../shared/ui/PageContainer';
import { useAppDispatch, useAppSelector } from '../hooks';
import { useTransactionForm, toTxPayload } from '../features/transactions/useTransactionForm';
import { formatRub } from '../shared/utils/currency';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import dayjs from '../shared/dayjs';
import {
  loadTransactions,
  addTransactionAsync,
  updateTransactionAsync,
  deleteTransactionAsync,
} from '../features/transactions/transactionsSlice';
import { loadCategories, addCategoryAsync, updateCategoryAsync, deleteCategoryAsync } from '../features/categories/categoriesSlice';

import { useEffect, useState, useMemo } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { IconMaximize, IconMinimize, IconPencil, IconTrash } from '@tabler/icons-react';
import { selectTransactionCategoryNames, makeSelectVisibleTransactions } from '../features/transactions/selectors';
import { selectCategoryUsageCount } from '../features/transactions/selectors';
import { notifications } from '@mantine/notifications';
import { convertCurrency } from '../features/currency/utils';
import type { CurrencyCode } from '../features/currency/types';

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
  const [selectedMonth, setSelectedMonth] = useState(() => dayjs().format('YYYY-MM'));
  const [catOpened, setCatOpened] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatColor, setNewCatColor] = useState('#20c997');
  const [displayCount, setDisplayCount] = useState(15);

  const exchangeRates = useAppSelector((s) => s.currency.rates);

  useEffect(() => {
    dispatch(loadTransactions());
    dispatch(loadCategories());
  }, [dispatch]);
  const usageCount = useAppSelector(selectCategoryUsageCount) as Record<string, number>;
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const catByName = new Map(categories.map((c) => [c.name, c]));
  const catOptions = categories
  .filter(c => c.type === txType)
  .sort((a, b) => {
    const countA = usageCount[a.name] || 0;
    const countB = usageCount[b.name] || 0;
    return countB - countA;
  })
  .map(c => ({
    value: c.name,
    label: c.name,
    color: c.color,
    type: c.type,
  }));
  
const visibleSelector = useMemo(
  () => makeSelectVisibleTransactions(filterCategory, typeFilter, selectedMonth),
  [filterCategory, typeFilter, selectedMonth]
);

const allVisibleTransactions = useAppSelector(visibleSelector);
const visibleTransactions = useMemo(
  () => allVisibleTransactions.slice(0, displayCount),
  [allVisibleTransactions, displayCount]
);
const hasMore = allVisibleTransactions.length > displayCount;
const allCategoryNames = useAppSelector(selectTransactionCategoryNames);

const filteredCategoryNames = useMemo(() => {
  if (typeFilter === 'all') return allCategoryNames;

  return categories
    .filter(c => c.type === typeFilter)
    .map(c => c.name)
    .filter(name => allCategoryNames.includes(name));
}, [allCategoryNames, categories, typeFilter]);

useEffect(() => {
  setDisplayCount(15);
}, [filterCategory, typeFilter, selectedMonth]);

useEffect(() => {
  // Сбросить выбранную категорию, если она не соответствует типу
  if (filterCategory && !filteredCategoryNames.includes(filterCategory)) {
    setFilterCategory(null);
  }
}, [typeFilter, filterCategory, filteredCategoryNames]);

const loadMore = () => {
  setDisplayCount(prev => prev + 15);
};
  const onEdit = (id: string) => {
  const tx = transactions.find((t) => t.id === id);
if (!tx) return;
setEditingId(id);
setFromTransaction(tx);
const cat = catByName.get(tx.category);
setTxType(cat?.type ?? 'expense');
open();
};


  const onDelete = (id: string) => {
    dispatch(deleteTransactionAsync(id));
  };

const [catEditingId, setCatEditingId] = useState<string | null>(null);

const canSaveCategory = newCatName.trim().length > 0;

const resetNewCategoryForm = () => {
  setNewCatName('');
  setNewCatType('expense');
  setNewCatColor('#20c997');
  setCatEditingId(null);
};

const handleSaveCategory = () => {
  if (!canSaveCategory) return;

  if (catEditingId) {
    dispatch(
      updateCategoryAsync({
        id: catEditingId,
        changes: {
          name: newCatName.trim(),
          type: newCatType,
          color: newCatColor,
          icon: null,
        },
      })
    );
  } else {
    dispatch(
      addCategoryAsync({
        name: newCatName.trim(),
        type: newCatType,
        color: newCatColor,
        icon: null,
      })
    );
  }

  resetNewCategoryForm();
  setCatOpened(false);
};

const handleEditCategory = (id: string) => {
  const c = categories.find((x) => x.id === id);
  if (!c) return;
  setCatEditingId(id);
  setNewCatName(c.name);
  setNewCatType(c.type);
  setNewCatColor(c.color);
  setCatTab(c.type);
  setCatOpened(true);
};

const handleDeleteCategory = (id: string) => {
  dispatch(deleteCategoryAsync(id));
};



const handleCategoryChange = (val: string | null) => {
  form.setFieldValue('category', val ?? '');

  const cat = val ? catByName.get(val) : undefined;
  if (!cat) {
    return;
  }

  const amt = Number(form.values.amount ?? 0);

  if (cat.type === 'income' && amt < 0) {
    form.setFieldValue('amount', Math.abs(amt));
  } else if (cat.type === 'expense' && amt > 0) {
    form.setFieldValue('amount', -Math.abs(amt));
  }
};


const handleSubmitTransaction = form.onSubmit((values) => {

  if (!values.category || values.category.trim() === '') {
    notifications.show({
      title: 'Выберите категорию',
      message: 'Перед сохранением транзакции нужно выбрать категорию или создать новую',
      color: 'red',
    });
    setCatOpened(true);
    return;
  }

  const cat = catByName.get(values.category);
  const adjustedAmount = values.amount ?? 0;

  // Конвертируем в рубли ПЕРЕД сохранением в БД
  let amountInRubles = convertCurrency(
    Math.abs(adjustedAmount),
    values.currency,
    'RUB',
    exchangeRates
  );

  // Применяем знак в зависимости от типа
  if (cat?.type === 'expense') {
    amountInRubles = -Math.abs(amountInRubles);
  } else {
    amountInRubles = Math.abs(amountInRubles);
  }

  const payload = toTxPayload({
    ...values,
    amount: amountInRubles,  // Сохраняем в рублях
  });

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

const selectedDate = dayjs(selectedMonth, 'YYYY-MM');
const isCurrentMonth = selectedDate.format('YYYY-MM') === dayjs().format('YYYY-MM');

const handlePrevMonth = () => {
  setSelectedMonth(prev => dayjs(prev, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM'));
};

const handleNextMonth = () => {
  setSelectedMonth(prev => dayjs(prev, 'YYYY-MM').add(1, 'month').format('YYYY-MM'));
};

const handleCurrentMonth = () => {
  setSelectedMonth(dayjs().format('YYYY-MM'));
};

const isSmall = useMediaQuery('(max-width: 48em)'); 
const [catFull, setCatFull] = useState(false);
const closeCategoriesModal = () => {
  resetNewCategoryForm();
  setCatOpened(false);
};
const [catTab, setCatTab] = useState<'income' | 'expense'>('expense');

const incomeCategories = useMemo(
  () => categories.filter((c) => c.type === 'income'),
  [categories]
);
const expenseCategories = useMemo(
  () => categories.filter((c) => c.type === 'expense'),
  [categories]
);


  return (
    <PageContainer maxWidth={1200}>
      <Card radius="lg" p={isSmall ? 'sm' : 'lg'} withBorder>
        <Title order={isSmall ? 3 : 2} mb="md">Транзакции</Title>
<Button onClick={handleAddTransaction} mb="md" fullWidth={isSmall}>
  Добавить транзакцию
</Button>

        <Modal
  opened={opened}
  onClose={close}
  styles={{ inner: { right: 0, left: 0 } }}
  title={editingId ? 'Редактировать транзакцию' : 'Добавить транзакцию'}
>
  <form onSubmit={handleSubmitTransaction}>
    <DateInput
      label="Дата"
      placeholder="ДД.MM.ГГГГ"
      value={form.values.date}
      onChange={(value) => form.setFieldValue('date', value as Date | null)}
      valueFormat="DD.MM.YYYY"
      locale="ru"
      mb="sm"
      clearable
    />
<Radio.Group
  label="Тип транзакции"
  value={txType}
  onChange={(val) => setTxType(val as 'income' | 'expense')}
  mb="sm"
>
  <Group mt="xs">
    <Radio value="income" label="Доход" />
    <Radio value="expense" label="Расход" />
  </Group>
</Radio.Group>
    <Select
  label="Категория"
  placeholder="Выберите категорию"
  data={catOptions}
  value={form.values.category}
  onChange={handleCategoryChange}
  mb="sm"
/>

    <NumberInput
      label="Сумма"
      placeholder="Введите сумму"
      {...form.getInputProps('amount')}
      mb="sm"
    />

    <Select
      label="Валюта"
      data={[
        { value: 'RUB', label: '₽ Рубль' },
        { value: 'USD', label: '$ Доллар' },
        { value: 'EUR', label: '€ Евро' },
      ]}
      value={form.values.currency}
      onChange={(val) => form.setFieldValue('currency', (val as CurrencyCode) || 'RUB')}
      mb="sm"
    />

    {form.values.category && catByName.get(form.values.category)?.type === 'income' && (
      <NumberInput
        label="Часы работы"
        placeholder="Например: 8"
        value={form.values.hours ?? 0}
        onChange={(val) => form.setFieldValue('hours', val === '' ? 0 : Number(val))}
        mb="sm"
        min={0}
      />
    )}

    <Textarea
      label="Комментарий"
      placeholder="Необязательное примечание"
      autosize
      minRows={2}
      {...form.getInputProps('comment')}
      mb="sm"
    />

    <Button type="submit" mt="md" fullWidth={isSmall}>
      Сохранить
    </Button>
  </form>
</Modal>


        <Modal
  opened={catOpened}
  onClose={closeCategoriesModal}
  fullScreen={catFull || isSmall}
  size={catFull || isSmall ? '100%' : '80%'}
  styles={{ inner: { right: 0, left: 0 } }} 
  title={
    <Group justify="space-between" w="100%">
      <Title order={4} m={0}>{catEditingId ? 'Редактировать категорию' : 'Категории'}</Title>
      <ActionIcon variant="light" onClick={() => setCatFull((v) => !v)} title={catFull ? 'Свернуть' : 'Во весь экран'}>
        {catFull ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
      </ActionIcon>
    </Group>
  }
>
  <Grid gutter="lg" align="start">
    <Grid.Col span={{ base: 12, md: 7 }}>
  <Tabs value={catTab} onChange={(v) => setCatTab((v as 'income' | 'expense') ?? 'expense')}>
    <Tabs.List grow>
      <Tabs.Tab value="income">Доходы</Tabs.Tab>
      <Tabs.Tab value="expense">Расходы</Tabs.Tab>
    </Tabs.List>

    <Tabs.Panel value="income" pt="md">
      <Table.ScrollContainer minWidth={300} h={catFull || isSmall ? 'calc(100vh - 220px)' : 520}>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Цвет</Table.Th>
              <Table.Th ta="right">Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {incomeCategories.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.name}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: c.color }} />
                    <Text>{c.color}</Text>
                  </Group>
                </Table.Td>
                <Table.Td ta="right">
                  <Group gap="xs" justify="flex-end">
                    <Tooltip label="Редактировать">
                      <ActionIcon variant="subtle" onClick={() => handleEditCategory(c.id)}>
                        <IconPencil size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Удалить">
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteCategory(c.id)}>
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Tabs.Panel>

    <Tabs.Panel value="expense" pt="md">
      <Table.ScrollContainer minWidth={300} h={catFull || isSmall ? 'calc(100vh - 220px)' : 520}>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Цвет</Table.Th>
              <Table.Th ta="right">Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {expenseCategories.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.name}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: c.color }} />
                    <Text>{c.color}</Text>
                  </Group>
                </Table.Td>
                <Table.Td ta="right">
                  <Group gap="xs" justify="flex-end">
                    <Tooltip label="Редактировать">
                      <ActionIcon variant="subtle" onClick={() => handleEditCategory(c.id)}>
                        <IconPencil size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Удалить">
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteCategory(c.id)}>
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Tabs.Panel>
  </Tabs>
</Grid.Col>

    <Grid.Col span={{ base: 12, md: 5 }}>
      <Stack>
        <MantineTextInput
          label="Название"
          placeholder="Например: Еда"
          value={newCatName}
          onChange={(e) => setNewCatName(e.currentTarget.value)}
        />

        <Radio.Group label="Тип" value={newCatType} onChange={(v) => setNewCatType(v as 'income' | 'expense')}>
          <Group mt="xs">
            <Radio value="income" label="Доход" />
            <Radio value="expense" label="Расход" />
          </Group>
        </Radio.Group>

        <ColorInput
          label="Цвет"
          value={newCatColor}
          onChange={(v) => setNewCatColor(v)}
          format="hex"
          swatches={[
            'teal', 'blue', 'red', 'yellow', 'orange', 'purple', 'green', 'pink',
            'cyan', 'indigo', 'lime', 'grape', 'violet', 'brown', 'gray',
            '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA',
            '#FCBAD3', '#FFFFD2', '#A8D8EA', '#FFD3B6', '#FFAAA5',
            '#FF8B94', '#FFC6C7', '#C7CEEA', '#B5EAD7', '#E2F0CB',
          ]}
          placeholder="Выберите цвет"
        />

        <Group justify="flex-end" mt="sm">
          {catEditingId && (
            <Button variant="subtle" onClick={resetNewCategoryForm}>
              Отмена
            </Button>
          )}
          <Button onClick={handleSaveCategory} disabled={!canSaveCategory}>
            {catEditingId ? 'Обновить' : 'Сохранить'}
          </Button>
        </Group>
      </Stack>
    </Grid.Col>
  </Grid>
</Modal>
        <Button variant="light" onClick={() => setCatOpened(true)} mb="md" fullWidth={isSmall}>
          Добавить категорию
        </Button>

        <Select
  label="Фильтр по категории"
  placeholder="Все категории"
  data={filteredCategoryNames}
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
          fullWidth
        />

        <Group gap="xs" mb="md" justify="center">
          <ActionIcon
            variant="default"
            size={isSmall ? 'lg' : 'md'}
            onClick={handlePrevMonth}
          >
            <IconChevronLeft size={isSmall ? 20 : 16} />
          </ActionIcon>
          <Button
            variant={isCurrentMonth ? 'filled' : 'default'}
            size="xs"
            onClick={handleCurrentMonth}
          >
            {selectedDate.format('MMMM YYYY')}
          </Button>
          <ActionIcon
            variant="default"
            size={isSmall ? 'lg' : 'md'}
            onClick={handleNextMonth}
          >
            <IconChevronRight size={isSmall ? 20 : 16} />
          </ActionIcon>
        </Group>

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
          <>
            {/* Desktop view - таблица */}
            {!isSmall && (
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Дата</Table.Th>
                    <Table.Th>Категория</Table.Th>
                    <Table.Th ta="right">Сумма</Table.Th>
                    <Table.Th>Комментарий</Table.Th>
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
                      <Table.Td style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.comment ?? '—'}
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

            {/* Mobile view - карточки */}
            {isSmall && (
              <Stack gap="sm">
                {visibleTransactions.map((r) => (
                  <Paper key={r.id} p="md" withBorder radius="md">
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <Box
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: catByName.get(r.category)?.color || 'gray',
                          }}
                        />
                        <Text fw={500}>{r.category}</Text>
                      </Group>
                      <Text size="sm" c="dimmed">{r.date}</Text>
                    </Group>

                    <Text
                      size="xl"
                      fw={700}
                      c={r.amount < 0 ? 'red' : 'green'}
                      mb="xs"
                    >
                      {formatRub(r.amount)}
                    </Text>

                    {r.comment && (
                      <Text size="sm" c="dimmed" mb="sm" lineClamp={2}>
                        {r.comment}
                      </Text>
                    )}

                    <Group gap="xs" justify="flex-end">
                      <ActionIcon
                        variant="light"
                        size="lg"
                        onClick={() => onEdit(r.id)}
                      >
                        <IconPencil size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        size="lg"
                        onClick={() => onDelete(r.id)}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}

        {!transactionsLoading && !transactionsError && visibleTransactions.length > 0 && (
          <>
            <Text c="dimmed" size="sm" ta="center" mt="md">
              Показано {visibleTransactions.length} из {allVisibleTransactions.length} транзакций
            </Text>
            {hasMore && (
              <Center mt="md">
                <Button variant="light" onClick={loadMore}>
                  Показать еще
                </Button>
              </Center>
            )}
          </>
        )}
      </Card>
    </PageContainer>
  );
}
