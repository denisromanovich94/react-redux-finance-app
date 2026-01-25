import { useState } from 'react';
import {
  Table,
  Badge,
  ActionIcon,
  Group,
  Text,
  Menu,
  TextInput,
  Select,
  Stack,
  Loader,
  Center,
  Modal,
  Button,
  NumberInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSearch,
  IconDotsVertical,
  IconCrown,
  IconShield,
  IconUser,
  IconKey,
  IconX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { AdminUser } from '../types';
import type { SubscriptionType } from '../../profile/types';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import {
  grantSubscription,
  revokeSubscription,
  updateUserRole,
  assignVpnKey,
} from '../adminSlice';

interface UsersTableProps {
  users: AdminUser[];
  loading: boolean;
}

const subscriptionColors: Record<SubscriptionType, string> = {
  free: 'gray',
  premium: 'yellow',
  vip: 'grape',
};

const subscriptionLabels: Record<SubscriptionType, string> = {
  free: 'Free',
  premium: 'Premium',
  vip: 'VIP',
};

export default function UsersTable({ users, loading }: UsersTableProps) {
  const dispatch = useAppDispatch();
  const vpnKeys = useAppSelector((s) => s.admin.vpnKeys);

  const [search, setSearch] = useState('');
  const [filterSub, setFilterSub] = useState<string | null>(null);

  // Модалка подписки
  const [subModalOpened, { open: openSubModal, close: closeSubModal }] = useDisclosure(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [subType, setSubType] = useState<SubscriptionType>('premium');
  const [subDays, setSubDays] = useState<number | ''>(30);

  // Модалка VPN
  const [vpnModalOpened, { open: openVpnModal, close: closeVpnModal }] = useDisclosure(false);
  const [selectedVpnKey, setSelectedVpnKey] = useState<string | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.telegram?.toLowerCase().includes(search.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(search.toLowerCase());

    const matchesSub = !filterSub || user.subscription_type === filterSub;

    return matchesSearch && matchesSub;
  });

  const handleGrantSubscription = (user: AdminUser) => {
    setSelectedUser(user);
    setSubType('premium');
    setSubDays(30);
    openSubModal();
  };

  const handleAssignVpn = (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedVpnKey(null);
    openVpnModal();
  };

  const confirmGrantSubscription = () => {
    if (!selectedUser) return;

    const expiresAt = subDays
      ? dayjs().add(subDays, 'day').toISOString()
      : undefined;

    dispatch(
      grantSubscription({
        user_id: selectedUser.user_id,
        type: subType,
        expires_at: expiresAt,
        reason: 'manual_grant',
      })
    );
    closeSubModal();
  };

  const confirmAssignVpn = () => {
    if (!selectedUser || !selectedVpnKey) return;
    dispatch(assignVpnKey({ keyId: selectedVpnKey, userId: selectedUser.user_id }));
    closeVpnModal();
  };

  const handleRevoke = (user: AdminUser) => {
    dispatch(revokeSubscription(user.user_id));
  };

  const handleToggleAdmin = (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    dispatch(updateUserRole({ userId: user.user_id, role: newRole }));
  };

  const freeVpnKeys = vpnKeys.filter((k) => !k.user_id && k.is_active);

  if (loading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  return (
    <>
      <Stack gap="md">
        <Group>
          <TextInput
            placeholder="Поиск по email, telegram, имени..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Подписка"
            clearable
            data={[
              { value: 'free', label: 'Free' },
              { value: 'premium', label: 'Premium' },
              { value: 'vip', label: 'VIP' },
            ]}
            value={filterSub}
            onChange={setFilterSub}
            w={150}
          />
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Email</Table.Th>
              <Table.Th>Telegram</Table.Th>
              <Table.Th>Подписка</Table.Th>
              <Table.Th>Истекает</Table.Th>
              <Table.Th>Роль</Table.Th>
              <Table.Th>Регистрация</Table.Th>
              <Table.Th w={50}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredUsers.map((user) => (
              <Table.Tr key={user.user_id}>
                <Table.Td>
                  <Text size="sm">{user.email}</Text>
                </Table.Td>
                <Table.Td>
                  {user.telegram ? (
                    <Text size="sm" c="blue">
                      {user.telegram.startsWith('@') ? user.telegram : `@${user.telegram}`}
                    </Text>
                  ) : (
                    <Text size="sm" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Badge color={subscriptionColors[user.subscription_type]} variant="light">
                    {subscriptionLabels[user.subscription_type]}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {user.subscription_expires_at ? (
                    <Text size="sm">{dayjs(user.subscription_expires_at).format('DD.MM.YYYY')}</Text>
                  ) : (
                    <Text size="sm" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {user.role === 'admin' ? (
                    <Badge color="red" variant="light" leftSection={<IconShield size={12} />}>
                      Admin
                    </Badge>
                  ) : (
                    <Badge color="gray" variant="light" leftSection={<IconUser size={12} />}>
                      User
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {dayjs(user.created_at).format('DD.MM.YYYY')}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Подписка</Menu.Label>
                      <Menu.Item
                        leftSection={<IconCrown size={14} />}
                        onClick={() => handleGrantSubscription(user)}
                      >
                        Выдать подписку
                      </Menu.Item>
                      {user.subscription_type !== 'free' && (
                        <Menu.Item
                          leftSection={<IconX size={14} />}
                          color="red"
                          onClick={() => handleRevoke(user)}
                        >
                          Отменить подписку
                        </Menu.Item>
                      )}

                      <Menu.Divider />
                      <Menu.Label>VPN</Menu.Label>
                      <Menu.Item
                        leftSection={<IconKey size={14} />}
                        onClick={() => handleAssignVpn(user)}
                        disabled={freeVpnKeys.length === 0}
                      >
                        Назначить VPN ключ
                      </Menu.Item>

                      <Menu.Divider />
                      <Menu.Label>Роль</Menu.Label>
                      <Menu.Item
                        leftSection={<IconShield size={14} />}
                        onClick={() => handleToggleAdmin(user)}
                      >
                        {user.role === 'admin' ? 'Снять админа' : 'Сделать админом'}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {filteredUsers.length === 0 && (
          <Center py="xl">
            <Text c="dimmed">Пользователи не найдены</Text>
          </Center>
        )}
      </Stack>

      {/* Модалка выдачи подписки */}
      <Modal opened={subModalOpened} onClose={closeSubModal} title="Выдать подписку" styles={{ inner: { right: 0, left: 0 } }}>
        <Stack>
          <Text size="sm">
            Пользователь: <strong>{selectedUser?.email}</strong>
          </Text>
          <Select
            label="Тип подписки"
            data={[
              { value: 'premium', label: 'Premium' },
              { value: 'vip', label: 'VIP' },
            ]}
            value={subType}
            onChange={(v) => setSubType((v as SubscriptionType) || 'premium')}
          />
          <NumberInput
            label="Срок (дней)"
            description="Оставьте пустым для бессрочной"
            value={subDays}
            onChange={(val) => setSubDays(typeof val === 'number' ? val : '')}
            min={1}
            max={365}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeSubModal}>
              Отмена
            </Button>
            <Button onClick={confirmGrantSubscription}>Выдать</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модалка назначения VPN */}
      <Modal opened={vpnModalOpened} onClose={closeVpnModal} title="Назначить VPN ключ" styles={{ inner: { right: 0, left: 0 } }}>
        <Stack>
          <Text size="sm">
            Пользователь: <strong>{selectedUser?.email}</strong>
          </Text>
          <Select
            label="VPN ключ"
            placeholder="Выберите ключ"
            data={freeVpnKeys.map((k) => ({
              value: k.id,
              label: `${k.server_name || 'Без имени'} (${k.protocol})`,
            }))}
            value={selectedVpnKey}
            onChange={setSelectedVpnKey}
          />
          {freeVpnKeys.length === 0 && (
            <Text size="sm" c="dimmed">
              Нет свободных ключей. Создайте новый во вкладке "VPN ключи".
            </Text>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeVpnModal}>
              Отмена
            </Button>
            <Button onClick={confirmAssignVpn} disabled={!selectedVpnKey}>
              Назначить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
