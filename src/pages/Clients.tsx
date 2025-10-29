import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { loadClients, addClient, updateClient, deleteClient } from '../features/clients/clientsSlice';
import { loadCategories, addCategoryAsync } from '../features/categories/categoriesSlice';
import { loadTransactions } from '../features/transactions/transactionsSlice';
import type { Client } from '../features/clients/types';
import {
  Button,
  Table,
  Modal,
  TextInput,
  Textarea,
  Stack,
  Group,
  Title,
  ActionIcon,
  Text,
  Loader,
  Select,
  Alert,
  Radio,
  Tooltip,
  Card,
  Divider,
} from '@mantine/core';
import { IconPencil, IconTrash, IconBrandTelegram, IconBrandWhatsapp, IconPhone, IconMail, IconAlertCircle } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import PageContainer from '../shared/ui/PageContainer';
import { showNotification } from '@mantine/notifications';
import { formatRub } from '../shared/utils/currency';

export default function Clients() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: clients, loading } = useSelector((state: RootState) => state.clients);
  const { items: categories } = useSelector((state: RootState) => state.categories);
  const { items: transactions } = useSelector((state: RootState) => state.transactions);
  const isSmall = useMediaQuery('(max-width: 48em)');

  const [modalOpened, setModalOpened] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [createCategoryModalOpened, setCreateCategoryModalOpened] = useState(false);

  const [name, setName] = useState('');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [incomeCategoryId, setIncomeCategoryId] = useState<string | null>(null);
  const [showCategoryWarning, setShowCategoryWarning] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('teal');

  useEffect(() => {
    dispatch(loadClients());
    dispatch(loadCategories());
    dispatch(loadTransactions());
  }, [dispatch]);

  const incomeCategories = categories.filter(cat => cat.type === 'income');

  // Функция подсчета статистики по клиенту
  const getClientStats = useMemo(() => {
    return (client: Client) => {
      if (!client.income_category_id) {
        return { totalIncome: 0, totalHours: 0, hourlyRate: 0 };
      }

      // Находим категорию клиента
      const category = categories.find(cat => cat.id === client.income_category_id);
      if (!category) {
        return { totalIncome: 0, totalHours: 0, hourlyRate: 0 };
      }

      // Считаем общий доход по категории (транзакции с положительной суммой по категории)
      const totalIncome = transactions
        .filter(tx => tx.category === category.name && tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Считаем общие часы из транзакций, где есть поле hours
      const totalHours = transactions
        .filter(tx => tx.category === category.name && tx.hours)
        .reduce((sum, tx) => sum + (tx.hours || 0), 0);

      // Рассчитываем стоимость часа
      const hourlyRate = totalHours > 0 ? totalIncome / totalHours : 0;

      return { totalIncome, totalHours, hourlyRate, categoryName: category.name };
    };
  }, [transactions, categories]);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setName('');
    setTelegram('');
    setWhatsapp('');
    setPhone('');
    setEmail('');
    setDescription('');
    setIncomeCategoryId(null);
    setShowCategoryWarning(incomeCategories.length === 0);
    setModalOpened(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setTelegram(client.telegram || '');
    setWhatsapp(client.whatsapp || '');
    setPhone(client.phone || '');
    setEmail(client.email || '');
    setDescription(client.description || '');
    setIncomeCategoryId(client.income_category_id || null);
    setShowCategoryWarning(false);
    setModalOpened(true);
  };

  const handleOpenCreateCategory = () => {
    setModalOpened(false);
    setNewCategoryName('');
    setNewCategoryColor('teal');
    setCreateCategoryModalOpened(true);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showNotification({ title: 'Ошибка', message: 'Введите название категории', color: 'red' });
      return;
    }

    try {
      await dispatch(addCategoryAsync({
        name: newCategoryName,
        type: 'income',
        color: newCategoryColor,
      })).unwrap();

      await dispatch(loadCategories());

      showNotification({ title: 'Успешно', message: 'Категория дохода создана', color: 'green' });
      setCreateCategoryModalOpened(false);
      setShowCategoryWarning(false);
      setModalOpened(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Не удалось создать категорию';
      showNotification({ title: 'Ошибка', message, color: 'red' });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showNotification({ title: 'Ошибка', message: 'Введите имя клиента', color: 'red' });
      return;
    }

    try {
      const clientData = {
        name,
        telegram,
        whatsapp,
        phone,
        email,
        description,
        income_category_id: incomeCategoryId || undefined,
      };

      if (editingClient) {
        await dispatch(updateClient({
          id: editingClient.id,
          data: clientData,
        })).unwrap();
        showNotification({ title: 'Успешно', message: 'Клиент обновлен', color: 'green' });
      } else {
        await dispatch(addClient(clientData)).unwrap();
        showNotification({ title: 'Успешно', message: 'Клиент добавлен', color: 'green' });
      }
      setModalOpened(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Что-то пошло не так';
      showNotification({ title: 'Ошибка', message, color: 'red' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить клиента?')) {
      try {
        await dispatch(deleteClient(id)).unwrap();
        showNotification({ title: 'Успешно', message: 'Клиент удален', color: 'green' });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Не удалось удалить';
        showNotification({ title: 'Ошибка', message, color: 'red' });
      }
    }
  };

  return (
    <PageContainer>
      <Group justify="space-between" mb="md">
        <Title order={isSmall ? 3 : 2}>Клиенты</Title>
        <Button onClick={handleOpenAdd} fullWidth={isSmall} size={isSmall ? 'sm' : 'md'}>
          Добавить клиента
        </Button>
      </Group>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader />
        </div>
      ) : clients.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Нет клиентов. Добавьте первого клиента!
        </Text>
      ) : (
        <>
          {/* Desktop - Table */}
          {!isSmall && (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '25%' }}>Имя/Название</Table.Th>
                  <Table.Th style={{ width: '15%' }}>Контакты</Table.Th>
                  <Table.Th style={{ width: '50%' }}>Описание</Table.Th>
                  <Table.Th style={{ width: '10%' }}>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {clients.map((client) => {
                  const stats = getClientStats(client);
                  return (
                  <Table.Tr key={client.id}>
                    <Table.Td>
                      <Stack gap="md">
                        <Text fw={600} size="lg">{client.name}</Text>
                        {client.income_category_id && stats.totalIncome > 0 && (
                          <Group gap="md">
                            <Stack gap={2}>
                              <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                                Общая сумма
                              </Text>
                              <Text size="lg" fw={700} c="teal">
                                {formatRub(stats.totalIncome)}
                              </Text>
                            </Stack>
                            {stats.totalHours > 0 && (
                              <Stack gap={2}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                                  Цена/час
                                </Text>
                                <Text size="lg" fw={700} c="blue">
                                  {formatRub(stats.hourlyRate)}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {stats.totalHours.toFixed(1)} часов
                                </Text>
                              </Stack>
                            )}
                          </Group>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="sm">
                        {client.telegram && (
                          <Tooltip label="Открыть Telegram">
                            <ActionIcon
                              component="a"
                              href={`https://t.me/@${client.telegram.replace('@', '')}`}
                              target="_blank"
                              size="xl"
                              variant="subtle"
                              color="blue"
                            >
                              <IconBrandTelegram size={48} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        {client.whatsapp && (
                          <Tooltip label="Открыть WhatsApp">
                            <ActionIcon
                              component="a"
                              href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              size="xl"
                              variant="subtle"
                              color="green"
                            >
                              <IconBrandWhatsapp size={48} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        {client.phone && (
                          <Tooltip label="Позвонить">
                            <ActionIcon
                              component="a"
                              href={`tel:${client.phone}`}
                              size="xl"
                              variant="subtle"
                              color="grape"
                            >
                              <IconPhone size={48} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        {client.email && (
                          <Tooltip label="Написать email">
                            <ActionIcon
                              component="a"
                              href={`mailto:${client.email}`}
                              size="xl"
                              variant="subtle"
                              color="red"
                            >
                              <IconMail size={48} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text
                        size="sm"
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxWidth: '400px'
                        }}
                      >
                        {client.description || '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => handleOpenEdit(client)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(client.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          )}

          {/* Mobile - Cards */}
          {isSmall && (
            <Stack gap="md">
              {clients.map((client) => {
                const stats = getClientStats(client);
                return (
                  <Card key={client.id} p="md" withBorder radius="md">
                    <Stack gap="sm">
                      {/* Header: Name and Actions */}
                      <Group justify="space-between" align="flex-start">
                        <Text fw={600} size="lg" style={{ flex: 1 }}>
                          {client.name}
                        </Text>
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            size="lg"
                            onClick={() => handleOpenEdit(client)}
                          >
                            <IconPencil size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="lg"
                            onClick={() => handleDelete(client.id)}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      </Group>

                      {/* Stats */}
                      {client.income_category_id && stats.totalIncome > 0 && (
                        <>
                          <Divider />
                          <Group gap="lg" grow>
                            <Stack gap={2}>
                              <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                                Общая сумма
                              </Text>
                              <Text size="lg" fw={700} c="teal">
                                {formatRub(stats.totalIncome)}
                              </Text>
                            </Stack>
                            {stats.totalHours > 0 && (
                              <Stack gap={2}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                                  Цена/час
                                </Text>
                                <Text size="lg" fw={700} c="blue">
                                  {formatRub(stats.hourlyRate)}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {stats.totalHours.toFixed(1)} часов
                                </Text>
                              </Stack>
                            )}
                          </Group>
                        </>
                      )}

                      {/* Contacts */}
                      {(client.telegram || client.whatsapp || client.phone || client.email) && (
                        <>
                          <Divider />
                          <Group gap="sm" justify="flex-start">
                            {client.telegram && (
                              <ActionIcon
                                component="a"
                                href={`https://t.me/@${client.telegram.replace('@', '')}`}
                                target="_blank"
                                size="xl"
                                variant="subtle"
                                color="blue"
                              >
                                <IconBrandTelegram size={32} />
                              </ActionIcon>
                            )}
                            {client.whatsapp && (
                              <ActionIcon
                                component="a"
                                href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                size="xl"
                                variant="subtle"
                                color="green"
                              >
                                <IconBrandWhatsapp size={32} />
                              </ActionIcon>
                            )}
                            {client.phone && (
                              <ActionIcon
                                component="a"
                                href={`tel:${client.phone}`}
                                size="xl"
                                variant="subtle"
                                color="grape"
                              >
                                <IconPhone size={32} />
                              </ActionIcon>
                            )}
                            {client.email && (
                              <ActionIcon
                                component="a"
                                href={`mailto:${client.email}`}
                                size="xl"
                                variant="subtle"
                                color="red"
                              >
                                <IconMail size={32} />
                              </ActionIcon>
                            )}
                          </Group>
                        </>
                      )}

                      {/* Description */}
                      {client.description && (
                        <>
                          <Divider />
                          <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {client.description}
                          </Text>
                        </>
                      )}
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          )}
        </>
      )}

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingClient ? 'Редактировать клиента' : 'Добавить клиента'}
        size="lg"
        fullScreen={isSmall}
        styles={{
          inner: {
            right: 0,
            left: 0,
          },
        }}
      >
        <Stack>
          <TextInput
            label="Имя/Название"
            placeholder="Иван Иванов или ООО Компания"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
          />

          {showCategoryWarning && (
            <Alert icon={<IconAlertCircle size={16} />} title="Нет категорий доходов" color="orange">
              <Text size="sm" mb="sm">
                У вас нет категорий доходов. Создать категорию?
              </Text>
              <Button size="xs" onClick={handleOpenCreateCategory}>
                Создать категорию
              </Button>
            </Alert>
          )}

          {incomeCategories.length > 0 && (
            <Select
              label="Категория дохода"
              placeholder="Выберите категорию дохода"
              data={incomeCategories.map(cat => ({ value: cat.id, label: cat.name }))}
              value={incomeCategoryId}
              onChange={(value) => setIncomeCategoryId(value)}
              clearable
            />
          )}

          <TextInput
            label="Telegram"
            placeholder="@username"
            value={telegram}
            onChange={(e) => setTelegram(e.currentTarget.value)}
            leftSection={<IconBrandTelegram size={16} />}
          />
          <TextInput
            label="WhatsApp"
            placeholder="+7 900 123 45 67"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.currentTarget.value)}
            leftSection={<IconBrandWhatsapp size={16} />}
          />
          <TextInput
            label="Телефон"
            placeholder="+7 900 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
            leftSection={<IconPhone size={16} />}
          />
          <TextInput
            label="Email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            leftSection={<IconMail size={16} />}
          />
          <Textarea
            label="Описание"
            placeholder="Дополнительная информация о клиенте"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            minRows={3}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setModalOpened(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              {editingClient ? 'Сохранить' : 'Добавить'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={createCategoryModalOpened}
        onClose={() => {
          setCreateCategoryModalOpened(false);
          setModalOpened(true);
        }}
        title="Создать категорию дохода"
        size="md"
        fullScreen={isSmall}
        styles={{
          inner: {
            right: 0,
            left: 0,
          },
        }}
      >
        <Stack>
          <TextInput
            label="Название категории"
            placeholder="Например: Фриланс, Зарплата"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.currentTarget.value)}
            required
          />
          <Radio.Group
            label="Цвет категории"
            value={newCategoryColor}
            onChange={setNewCategoryColor}
          >
            <Group mt="xs">
              <Radio value="teal" label="Чайный" />
              <Radio value="blue" label="Синий" />
              <Radio value="green" label="Зеленый" />
              <Radio value="orange" label="Оранжевый" />
              <Radio value="purple" label="Пурпурный" />
              <Radio value="red" label="Красный" />
            </Group>
          </Radio.Group>
          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={() => {
                setCreateCategoryModalOpened(false);
                setModalOpened(true);
              }}
            >
              Отмена
            </Button>
            <Button onClick={handleCreateCategory}>
              Создать
            </Button>
          </Group>
        </Stack>
      </Modal>
    </PageContainer>
  );
}
