import { useState } from 'react';
import { Card, Text, Badge, Group, ActionIcon, Menu, Stack, Button, Modal, Textarea } from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconMail, IconPhone, IconBuilding } from '@tabler/icons-react';
import type { Lead, LeadStatus } from '../types';
import dayjs from '../../../shared/dayjs';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: LeadStatus, rejectionReason?: string) => void;
}

const statusColors = {
  new: 'blue',
  contacted: 'cyan',
  negotiation: 'orange',
  won: 'green',
  lost: 'red',
} as const;

const statusLabels = {
  new: 'Новый',
  contacted: 'Связались',
  negotiation: 'Переговоры',
  won: 'Сделка',
  lost: 'Отказ',
} as const;

const sourceColors = {
  referral: 'green',
  kwork: 'violet',
  website: 'blue',
  social: 'pink',
  phone: 'orange',
  other: 'gray',
} as const;

const sourceLabels = {
  referral: 'Сарафанка',
  kwork: 'Кворк',
  website: 'Сайт',
  social: 'Соцсети',
  phone: 'Телефон',
  other: 'Другое',
} as const;

// Порядок статусов воронки
const statusFlow: LeadStatus[] = ['new', 'contacted', 'negotiation', 'won'];

const getNextStatus = (currentStatus: LeadStatus): LeadStatus | null => {
  if (currentStatus === 'lost') return null; // Из отказа никуда
  if (currentStatus === 'won') return null; // Из сделки никуда

  const currentIndex = statusFlow.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === statusFlow.length - 1) return null;

  return statusFlow[currentIndex + 1];
};

export default function LeadCard({ lead, onEdit, onDelete, onStatusChange }: LeadCardProps) {
  const [rejectionModalOpened, setRejectionModalOpened] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleRejectClick = () => {
    setRejectionModalOpened(true);
  };

  const handleRejectConfirm = () => {
    if (rejectionReason.trim()) {
      onStatusChange(lead.id, 'lost', rejectionReason);
      setRejectionModalOpened(false);
      setRejectionReason('');
    }
  };

  return (
    <>
    <Card shadow="sm" padding="xl" withBorder radius="md" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Group justify="space-between" mb="md">
        <Text fw={700} size="xl">
          {lead.name}
        </Text>

        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(lead)}>
              Редактировать
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={() => onDelete(lead.id)}
            >
              Удалить
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Stack gap="md">
        {lead.company && (
          <Group gap="sm">
            <IconBuilding size={18} />
            <Text size="md" c="dimmed">
              {lead.company}
            </Text>
          </Group>
        )}

        {lead.email && (
          <Group gap="sm">
            <IconMail size={18} />
            <Text size="md" c="dimmed">
              {lead.email}
            </Text>
          </Group>
        )}

        {lead.phone && (
          <Group gap="sm">
            <IconPhone size={18} />
            <Text size="md" c="dimmed">
              {lead.phone}
            </Text>
          </Group>
        )}

        {lead.description && (
          <Text size="sm" c="dimmed" lineClamp={3} style={{ whiteSpace: 'pre-wrap' }}>
            {lead.description}
          </Text>
        )}

        <Group gap="sm" mt="xs">
          <Badge size="md" color={sourceColors[lead.source]} variant="light">
            {sourceLabels[lead.source]}
          </Badge>
        </Group>

        {(lead.value_min || lead.value_max || lead.value) && (
          <Text size="sm" c="dimmed" fw={500}>
            Потенциальная ценность: {
              lead.value_min && lead.value_max
                ? `${lead.value_min.toLocaleString('ru-RU')} - ${lead.value_max.toLocaleString('ru-RU')} ₽`
                : lead.value_min
                  ? `от ${lead.value_min.toLocaleString('ru-RU')} ₽`
                  : lead.value_max
                    ? `до ${lead.value_max.toLocaleString('ru-RU')} ₽`
                    : `${lead.value?.toLocaleString('ru-RU')} ₽`
            }
          </Text>
        )}

        {lead.rejection_reason && lead.status === 'lost' && (
          <Text size="sm" c="red" fw={500}>
            Причина отказа: {lead.rejection_reason}
          </Text>
        )}

        {lead.next_action && (
          <Text size="sm" c="blue" fw={500}>
            Следующее действие: {lead.next_action}
            {lead.next_action_date && ` (${dayjs(lead.next_action_date).format('DD.MM.YYYY')})`}
          </Text>
        )}

        {lead.tags.length > 0 && (
          <Group gap="sm">
            {lead.tags.map((tag) => (
              <Badge key={tag} size="sm" variant="dot">
                {tag}
              </Badge>
            ))}
          </Group>
        )}

        <Text size="sm" c="dimmed">
          Создан: {dayjs(lead.created_at).format('DD.MM.YYYY HH:mm')}
        </Text>

        {/* Кнопка управления воронкой */}
        {lead.status !== 'won' && lead.status !== 'lost' && (
          <Menu position="bottom" withArrow width={200}>
            <Menu.Target>
              <Button
                size="sm"
                variant="light"
                fullWidth
                color={statusColors[lead.status]}
                mt="md"
              >
                {statusLabels[lead.status]}
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Изменить статус</Menu.Label>
              {statusFlow.map((status) => {
                if (status !== lead.status) {
                  return (
                    <Menu.Item
                      key={status}
                      onClick={() => onStatusChange(lead.id, status)}
                    >
                      {statusLabels[status]}
                    </Menu.Item>
                  );
                }
                return null;
              })}
              <Menu.Divider />
              <Menu.Item
                color="red"
                onClick={handleRejectClick}
              >
                Отказ
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Stack>
    </Card>

    <Modal
      opened={rejectionModalOpened}
      onClose={() => setRejectionModalOpened(false)}
      title="Причина отказа"
      size="lg"
      styles={{ inner: { right: 0, left: 0 } }}
      centered
    >
      <Stack>
        <Textarea
          label="Укажите причину отказа"
          placeholder="Почему не состоялась сделка?"
          minRows={3}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.currentTarget.value)}
          required
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setRejectionModalOpened(false)}>
            Отмена
          </Button>
          <Button color="red" onClick={handleRejectConfirm} disabled={!rejectionReason.trim()}>
            Подтвердить отказ
          </Button>
        </Group>
      </Stack>
    </Modal>
    </>
  );
}
