import {
  Title,
  Text,
  Card,
  Group,
  Stack,
  CopyButton,
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Badge,
} from '@mantine/core';
import {
  IconCopy,
  IconCheck,
  IconHeart,
  IconBrandTether,
  IconDiamond,
  IconShoppingBag,
} from '@tabler/icons-react';
import PageContainer from '../shared/ui/PageContainer';

type DonateOption = {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
};

const donateOptions: DonateOption[] = [
  {
    label: 'Озон Банк',
    value: '2204321098256118',
    icon: <IconShoppingBag size={24} />,
    color: 'blue',
  },
  {
    label: 'USDT',
    value: 'TVdwjWsc5qLVZcJVzFieiSc3vAse23HyCK',
    icon: <IconBrandTether size={24} />,
    color: 'teal',
    badge: 'TRC20',
  },
  {
    label: 'TON',
    value: 'UQAEYGob8yLxdsk71qKH0g_kYRekK6OXrwzYkEyAkndx_ONL',
    icon: <IconDiamond size={24} />,
    color: 'cyan',
  },
];

function DonateCard({ option }: { option: DonateOption }) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Group gap="sm">
          <ThemeIcon variant="light" color={option.color} size="lg" radius="md">
            {option.icon}
          </ThemeIcon>
          <Text fw={500}>{option.label}</Text>
          {option.badge && (
            <Badge size="sm" variant="light" color={option.color}>
              {option.badge}
            </Badge>
          )}
        </Group>
      </Group>

      <Card.Section inheritPadding py="sm">
        <CopyButton value={option.value} timeout={2000}>
          {({ copied, copy }) => (
            <Group
              gap="sm"
              p="sm"
              onClick={copy}
              style={{
                backgroundColor: 'var(--mantine-color-default)',
                borderRadius: 'var(--mantine-radius-sm)',
                cursor: 'pointer',
              }}
            >
              <Text
                size="sm"
                ff="monospace"
                style={{
                  wordBreak: 'break-all',
                  flex: 1,
                }}
              >
                {option.value}
              </Text>
              <Tooltip label={copied ? 'Скопировано!' : 'Копировать'} withArrow>
                <ActionIcon
                  color={copied ? 'teal' : 'gray'}
                  variant="subtle"
                >
                  {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </CopyButton>
      </Card.Section>
    </Card>
  );
}

export default function DonatePage() {
  return (
    <PageContainer maxWidth={600}>
      <Stack gap="xl">
        <Group justify="center" gap="sm">
          <ThemeIcon variant="light" color="pink" size="xl" radius="xl">
            <IconHeart size={28} />
          </ThemeIcon>
          <Title order={2}>Поддержать проект</Title>
        </Group>

        <Text c="dimmed" ta="center" size="sm">
          Если приложение оказалось полезным и вы хотите поддержать разработку,
          буду благодарен за любую сумму. Нажмите на адрес, чтобы скопировать.
        </Text>

        <Stack gap="md">
          {donateOptions.map((option) => (
            <DonateCard key={option.label} option={option} />
          ))}
        </Stack>

        <Text c="dimmed" ta="center" size="xs">
          Спасибо за поддержку!
        </Text>
      </Stack>
    </PageContainer>
  );
}
