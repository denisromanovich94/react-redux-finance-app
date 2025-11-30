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
  { value: 'qualified', label: 'Квалифицирован' },
  { value: 'proposal', label: 'Предложение' },
  { value: 'negotiation', label: 'Переговоры' },
  { value: 'won', label: 'Выиграно' },
  { value: 'lost', label: 'Проиграно' },
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
      name: lead?.name || '',
      company: lead?.company || '',
      email: lead?.email || '',
      phone: lead?.phone || '',
      status: lead?.status || 'new',
      source: lead?.source || 'referral',
      value: lead?.value || undefined,
      description: lead?.description || '',
      tags: lead?.tags || [],
    },
    validate: {
      name: (value) => (!value ? 'Введите имя' : null),
    },
  });

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

          <NumberInput
            label="Потенциальная ценность (₽)"
            placeholder="Введите сумму"
            min={0}
            thousandSeparator=" "
            {...form.getInputProps('value')}
          />

          <Textarea
            label="Описание"
            placeholder="Добавьте заметки о лиде"
            minRows={3}
            {...form.getInputProps('description')}
          />

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
