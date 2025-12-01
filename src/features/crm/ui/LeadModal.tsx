import { useEffect } from 'react';
import { Modal, TextInput, Textarea, Select, Button, Group, Stack, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { Lead, CreateLeadInput } from '../types';

interface LeadModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLeadInput) => void;
  lead?: Lead | null;
}

const statusOptions = [
  { value: 'new', label: 'Новый' },
  { value: 'contacted', label: 'Связались' },
  { value: 'negotiation', label: 'Переговоры' },
  { value: 'won', label: 'Сделка' },
  { value: 'lost', label: 'Отказ' },
];

const sourceOptions = [
  { value: 'referral', label: 'Сарафанка' },
  { value: 'kwork', label: 'Кворк' },
  { value: 'website', label: 'Сайт' },
  { value: 'social', label: 'Соцсети' },
  { value: 'phone', label: 'Телефон' },
  { value: 'other', label: 'Другое' },
];

export default function LeadModal({ opened, onClose, onSubmit, lead }: LeadModalProps) {
  const form = useForm<CreateLeadInput>({
    initialValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      status: 'new',
      source: 'referral',
      value_min: undefined,
      value_max: undefined,
      description: '',
      rejection_reason: '',
      tags: [],
    },
    validate: {
      name: (value) => (!value ? 'Введите имя' : null),
    },
  });

  useEffect(() => {
    if (opened && lead) {
      form.setValues({
        name: lead.name || '',
        company: lead.company || '',
        email: lead.email || '',
        phone: lead.phone || '',
        status: lead.status || 'new',
        source: lead.source || 'referral',
        value_min: lead.value_min || undefined,
        value_max: lead.value_max || undefined,
        description: lead.description || '',
        rejection_reason: lead.rejection_reason || '',
        tags: lead.tags || [],
      });
    } else if (opened && !lead) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, lead]);

  const handleSubmit = (values: CreateLeadInput) => {
    onSubmit(values);
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={lead ? 'Редактировать лид' : 'Новый лид'}
      size="lg"
      styles={{ inner: { right: 0, left: 0 } }}
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Имя"
            placeholder="Введите имя контакта"
            required
            {...form.getInputProps('name')}
          />

          <TextInput
            label="Компания"
            placeholder="Название компании"
            {...form.getInputProps('company')}
          />

          <Group grow>
            <TextInput
              label="Telegram"
              placeholder="@username"
              {...form.getInputProps('email')}
            />

            <TextInput
              label="Телефон"
              placeholder="+7 (999) 123-45-67"
              {...form.getInputProps('phone')}
            />
          </Group>

          <Group grow>
            <Select
              label="Статус"
              data={statusOptions}
              {...form.getInputProps('status')}
            />

            <Select
              label="Источник"
              data={sourceOptions}
              {...form.getInputProps('source')}
            />
          </Group>

          <Group grow>
            <NumberInput
              label="Мин. ценность (₽)"
              placeholder="От"
              min={0}
              thousandSeparator=" "
              {...form.getInputProps('value_min')}
            />

            <NumberInput
              label="Макс. ценность (₽)"
              placeholder="До"
              min={0}
              thousandSeparator=" "
              {...form.getInputProps('value_max')}
            />
          </Group>

          <Textarea
            label="Описание"
            placeholder="Добавьте заметки о лиде"
            minRows={3}
            {...form.getInputProps('description')}
          />

          {form.values.status === 'lost' && (
            <Textarea
              label="Причина отказа"
              placeholder="Укажите причину, почему не состоялась сделка"
              minRows={2}
              required
              {...form.getInputProps('rejection_reason')}
            />
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">
              {lead ? 'Сохранить' : 'Создать'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
