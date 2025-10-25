import { Card, Group, Text, ThemeIcon } from '@mantine/core';
import { IconArrowsExchange } from '@tabler/icons-react';
import { useAppSelector } from '../../../hooks';

export default function ExchangeRatesCard() {
  const exchangeRates = useAppSelector((state) => state.currency.rates);
  const loading = useAppSelector((state) => state.currency.loading);

  if (loading || !exchangeRates?.Valute) {
    return (
      <Card radius="lg" p="lg" withBorder>
        <Group justify="space-between" mb="xs">
          <Text size="sm" c="dimmed">Курсы валют</Text>
          <ThemeIcon color="indigo" variant="light" radius="xl">
            <IconArrowsExchange size={18} />
          </ThemeIcon>
        </Group>
        <Text size="sm" c="dimmed">Загрузка...</Text>
      </Card>
    );
  }

  const usd = exchangeRates.Valute.USD;
  const eur = exchangeRates.Valute.EUR;

  const formatRate = (value: number) => value.toFixed(2);

  return (
    <Card radius="lg" p="lg" withBorder>
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed">Курсы валют</Text>
        <Group gap={4}>
          {exchangeRates.Date && (
            <Text size="xs" c="dimmed">
              {new Date(exchangeRates.Date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
            </Text>
          )}
          <ThemeIcon color="indigo" variant="light" radius="xl">
            <IconArrowsExchange size={18} />
          </ThemeIcon>
        </Group>
      </Group>

      <Group gap="xl" wrap="nowrap">
        {/* USD */}
        {usd && (
          <Group gap={6} wrap="nowrap">
            <Text size="sm" c="dimmed" fw={500}>$ USD</Text>
            <Text size="lg" fw={700}>{formatRate(usd.Value)}</Text>
          </Group>
        )}

        {/* EUR */}
        {eur && (
          <Group gap={6} wrap="nowrap">
            <Text size="sm" c="dimmed" fw={500}>€ EUR</Text>
            <Text size="lg" fw={700}>{formatRate(eur.Value)}</Text>
          </Group>
        )}
      </Group>
    </Card>
  );
}
