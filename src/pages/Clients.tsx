import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { loadClients, addClient, updateClient, deleteClient } from '../features/clients/clientsSlice';
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
} from '@mantine/core';
import { IconPencil, IconTrash, IconBrandTelegram, IconBrandWhatsapp, IconPhone, IconMail } from '@tabler/icons-react';
import PageContainer from '../shared/ui/PageContainer';
import { showNotification } from '@mantine/notifications';

export default function Clients() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: clients, loading } = useSelector((state: RootState) => state.clients);

  const [modalOpened, setModalOpened] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [name, setName] = useState('');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    dispatch(loadClients());
  }, [dispatch]);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setName('');
    setTelegram('');
    setWhatsapp('');
    setPhone('');
    setEmail('');
    setDescription('');
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
    setModalOpened(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showNotification({ title: 'Ошибка', message: 'Введите имя клиента', color: 'red' });
      return;
    }

    try {
      if (editingClient) {
        await dispatch(updateClient({
          id: editingClient.id,
          data: { name, telegram, whatsapp, phone, email, description },
        })).unwrap();
        showNotification({ title: 'Успешно', message: 'Клиент обновлен', color: 'green' });
      } else {
        await dispatch(addClient({ name, telegram, whatsapp, phone, email, description })).unwrap();
        showNotification({ title: 'Успешно', message: 'Клиент добавлен', color: 'green' });
      }
      setModalOpened(false);
    } catch (err: any) {
      showNotification({ title: 'Ошибка', message: err || 'Что-то пошло не так', color: 'red' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить клиента?')) {
      try {
        await dispatch(deleteClient(id)).unwrap();
        showNotification({ title: 'Успешно', message: 'Клиент удален', color: 'green' });
      } catch (err: any) {
        showNotification({ title: 'Ошибка', message: err || 'Не удалось удалить', color: 'red' });
      }
    }
  };

  return (
    <PageContainer>
      <Group justify="space-between" mb="md">
        <Title order={2}>Клиенты</Title>
        <Button onClick={handleOpenAdd}>Добавить клиента</Button>
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
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Имя/Название</Table.Th>
              <Table.Th>Контакты</Table.Th>
              <Table.Th>Описание</Table.Th>
              <Table.Th style={{ width: '100px' }}>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {clients.map((client) => (
              <Table.Tr key={client.id}>
                <Table.Td>
                  <Text fw={600}>{client.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Stack gap={4}>
                    {client.telegram && (
                      <Group gap={6}>
                        <IconBrandTelegram size={16} />
                        <Text size="sm">{client.telegram}</Text>
                      </Group>
                    )}
                    {client.whatsapp && (
                      <Group gap={6}>
                        <IconBrandWhatsapp size={16} />
                        <Text size="sm">{client.whatsapp}</Text>
                      </Group>
                    )}
                    {client.phone && (
                      <Group gap={6}>
                        <IconPhone size={16} />
                        <Text size="sm">{client.phone}</Text>
                      </Group>
                    )}
                    {client.email && (
                      <Group gap={6}>
                        <IconMail size={16} />
                        <Text size="sm">{client.email}</Text>
                      </Group>
                    )}
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={2}>
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
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingClient ? 'Редактировать клиента' : 'Добавить клиента'}
        size="lg"
      >
        <Stack>
          <TextInput
            label="Имя/Название"
            placeholder="Иван Иванов или ООО Компания"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
          />
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
    </PageContainer>
  );
}
