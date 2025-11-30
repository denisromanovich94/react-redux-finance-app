import { Card, Text, Badge, Group, ActionIcon, Menu, Progress, Stack } from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconMail, IconPhone, IconBuilding } from '@tabler/icons-react';
import type { Lead } from '../types';
import dayjs from '../../../shared/dayjs';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
}

const statusColors = {
  new: 'blue',
  contacted: 'cyan',
  qualified: 'teal',
  proposal: 'yellow',
  negotiation: 'orange',
  won: 'green',
  lost: 'red',
} as const;

const sourceColors = {
  referral: 'green',
  kwork: 'violet',
  website: 'blue',
  social: 'pink',
  phone: 'orange',
  other: 'gray',
} as const;

export default function LeadCard({ lead, onEdit, onDelete }: LeadCardProps) {
  return (
    <Card shadow="xs" padding="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Text fw={600} size="lg">
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

      <Stack gap="xs">
        {lead.company && (
          <Group gap="xs">
            <IconBuilding size={14} />
            <Text size="sm" c="dimmed">
              {lead.company}
            </Text>
          </Group>
        )}

        {lead.email && (
          <Group gap="xs">
            <IconMail size={14} />
            <Text size="sm" c="dimmed">
              {lead.email}
            </Text>
          </Group>
        )}

        {lead.phone && (
          <Group gap="xs">
            <IconPhone size={14} />
            <Text size="sm" c="dimmed">
              {lead.phone}
            </Text>
          </Group>
        )}

        <Group gap="xs" mt="xs">
          <Badge size="sm" color={statusColors[lead.status]}>
            {lead.status}
          </Badge>
          <Badge size="sm" color={sourceColors[lead.source]} variant="light">
            {lead.source}
          </Badge>
        </Group>

        {lead.value && (
          <div>
            <Text size="xs" c="dimmed" mb={4}>
              Потенциальная ценность: {lead.value.toLocaleString('ru-RU')} ₽
            </Text>
            {lead.probability !== undefined && (
              <>
                <Progress value={lead.probability} size="sm" color="teal" />
                <Text size="xs" c="dimmed" mt={4}>
                  Вероятность: {lead.probability}%
                </Text>
              </>
            )}
          </div>
        )}

        {lead.next_action && (
          <Text size="xs" c="blue" fw={500}>
            Следующее действие: {lead.next_action}
            {lead.next_action_date && ` (${dayjs(lead.next_action_date).format('DD.MM.YYYY')})`}
          </Text>
        )}

        {lead.tags.length > 0 && (
          <Group gap="xs">
            {lead.tags.map((tag) => (
              <Badge key={tag} size="xs" variant="dot">
                {tag}
              </Badge>
            ))}
          </Group>
        )}

        <Text size="xs" c="dimmed">
          Создан: {dayjs(lead.created_at).format('DD.MM.YYYY HH:mm')}
        </Text>
      </Stack>
    </Card>
  );
}
