import { useState } from 'react';
import {
  Table,
  Badge,
  ActionIcon,
  Group,
  Text,
  Menu,
  TextInput,
  Stack,
  Loader,
  Center,
  Modal,
  Button,
  Textarea,
  Select,
  Switch,
  CopyButton,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DateInput } from '@mantine/dates';
import {
  IconSearch,
  IconDotsVertical,
  IconPlus,
  IconTrash,
  IconUserPlus,
  IconUserMinus,
  IconCopy,
  IconCheck,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { VpnKey } from '../types';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { createVpnKey, deleteVpnKey, assignVpnKey, toggleVpnKey } from '../adminSlice';

interface VpnKeysTableProps {
  vpnKeys: VpnKey[];
  loading: boolean;
}

export default function VpnKeysTable({ vpnKeys, loading }: VpnKeysTableProps) {
  const dispatch = useAppDispatch();
  const users = useAppSelector((s) => s.admin.users);

  const [search, setSearch] = useState('');
  const [filterAssigned, setFilterAssigned] = useState<string | null>(null);

  // Модалка создания
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [keyValue, setKeyValue] = useState('');
  const [serverName, setServerName] = useState('');
  const [protocol, setProtocol] = useState('wireguard');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  // Модалка назначения
  const [assignModalOpened, { open: openAssignModal, close: closeAssignModal }] = useDisclosure(false);
  const [selectedKey, setSelectedKey] = useState<VpnKey | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filteredKeys = vpnKeys.filter((key) => {
    const matchesSearch =
      !search ||
      key.server_name?.toLowerCase().includes(search.toLowerCase()) ||
      key.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      key.key_value.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      !filterAssigned ||
      (filterAssigned === 'assigned' && key.user_id) ||
      (filterAssigned === 'free' && !key.user_id);

    return matchesSearch && matchesFilter;
  });

  const handleCreate = () => {
    if (!keyValue.trim()) return;

    dispatch(
      createVpnKey({
        key_value: keyValue.trim(),
        server_name: serverName.trim() || undefined,
        protocol,
        expires_at: expiresAt ? expiresAt.toISOString() : undefined,
      })
    );

    setKeyValue('');
    setServerName('');
    setProtocol('wireguard');
    setExpiresAt(null);
    closeCreateModal();
  };

  const handleDelete = (keyId: string) => {
    dispatch(deleteVpnKey(keyId));
  };

  const handleAssign = (key: VpnKey) => {
    setSelectedKey(key);
    setSelectedUserId(null);
    openAssignModal();
  };

  const handleUnassign = (key: VpnKey) => {
    dispatch(assignVpnKey({ keyId: key.id, userId: null }));
  };

  const handleToggle = (key: VpnKey) => {
    dispatch(toggleVpnKey({ keyId: key.id, isActive: !key.is_active }));
  };

  const confirmAssign = () => {
    if (!selectedKey || !selectedUserId) return;
    dispatch(assignVpnKey({ keyId: selectedKey.id, userId: selectedUserId }));
    closeAssignModal();
  };

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
        <Group justify="space-between">
          <Group>
            <TextInput
              placeholder="Поиск..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              w={300}
            />
            <Select
              placeholder="Статус"
              clearable
              data={[
                { value: 'assigned', label: 'Назначенные' },
                { value: 'free', label: 'Свободные' },
              ]}
              value={filterAssigned}
              onChange={setFilterAssigned}
              w={150}
            />
          </Group>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
            Создать ключ
          </Button>
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Сервер</Table.Th>
              <Table.Th>Ключ</Table.Th>
              <Table.Th>Протокол</Table.Th>
              <Table.Th>Пользователь</Table.Th>
              <Table.Th>Активен</Table.Th>
              <Table.Th>Истекает</Table.Th>
              <Table.Th w={50}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredKeys.map((key) => (
              <Table.Tr key={key.id} style={{ opacity: key.is_active ? 1 : 0.5 }}>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {key.server_name || '—'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Text size="sm" ff="monospace" lineClamp={1} style={{ maxWidth: 200 }}>
                      {key.key_value.substring(0, 30)}...
                    </Text>
                    <CopyButton value={key.key_value}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Скопировано' : 'Копировать'}>
                          <ActionIcon
                            variant="subtle"
                            color={copied ? 'teal' : 'gray'}
                            onClick={copy}
                            size="sm"
                          >
                            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light">{key.protocol}</Badge>
                </Table.Td>
                <Table.Td>
                  {key.user_email ? (
                    <Text size="sm">{key.user_email}</Text>
                  ) : (
                    <Badge color="gray" variant="outline">
                      Свободен
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Switch
                    checked={key.is_active}
                    onChange={() => handleToggle(key)}
                    size="sm"
                  />
                </Table.Td>
                <Table.Td>
                  {key.expires_at ? (
                    <Text size="sm" c={dayjs(key.expires_at).isBefore(dayjs()) ? 'red' : undefined}>
                      {dayjs(key.expires_at).format('DD.MM.YYYY')}
                    </Text>
                  ) : (
                    <Text size="sm" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={180}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {key.user_id ? (
                        <Menu.Item
                          leftSection={<IconUserMinus size={14} />}
                          onClick={() => handleUnassign(key)}
                        >
                          Отвязать
                        </Menu.Item>
                      ) : (
                        <Menu.Item
                          leftSection={<IconUserPlus size={14} />}
                          onClick={() => handleAssign(key)}
                        >
                          Назначить
                        </Menu.Item>
                      )}
                      <Menu.Divider />
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={() => handleDelete(key.id)}
                      >
                        Удалить
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {filteredKeys.length === 0 && (
          <Center py="xl">
            <Text c="dimmed">VPN ключи не найдены</Text>
          </Center>
        )}
      </Stack>

      {/* Модалка создания ключа */}
      <Modal opened={createModalOpened} onClose={closeCreateModal} title="Создать VPN ключ" styles={{ inner: { right: 0, left: 0 } }}>
        <Stack>
          <Textarea
            label="Ключ / Конфиг"
            placeholder="Вставьте WireGuard конфиг или ключ..."
            value={keyValue}
            onChange={(e) => setKeyValue(e.currentTarget.value)}
            minRows={4}
            required
          />
          <TextInput
            label="Название сервера"
            placeholder="NL-1, DE-2..."
            value={serverName}
            onChange={(e) => setServerName(e.currentTarget.value)}
          />
          <Select
            label="Протокол"
            data={[
              { value: 'wireguard', label: 'WireGuard' },
              { value: 'openvpn', label: 'OpenVPN' },
              { value: 'outline', label: 'Outline' },
            ]}
            value={protocol}
            onChange={(v) => setProtocol(v || 'wireguard')}
          />
          <DateInput
            label="Срок действия"
            placeholder="Выберите дату..."
            value={expiresAt}
            onChange={(value) => setExpiresAt(value as Date | null)}
            clearable
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeCreateModal}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={!keyValue.trim()}>
              Создать
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модалка назначения */}
      <Modal opened={assignModalOpened} onClose={closeAssignModal} title="Назначить ключ пользователю" styles={{ inner: { right: 0, left: 0 } }}>
        <Stack>
          <Text size="sm">
            Сервер: <strong>{selectedKey?.server_name || 'Без имени'}</strong>
          </Text>
          <Select
            label="Пользователь"
            placeholder="Выберите пользователя..."
            searchable
            data={users.map((u) => ({
              value: u.user_id,
              label: u.email + (u.telegram ? ` (@${u.telegram})` : ''),
            }))}
            value={selectedUserId}
            onChange={setSelectedUserId}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeAssignModal}>
              Отмена
            </Button>
            <Button onClick={confirmAssign} disabled={!selectedUserId}>
              Назначить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
