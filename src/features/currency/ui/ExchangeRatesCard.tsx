import { Card, Group, Text, ThemeIcon } from '@mantine/core';
import { IconArrowsExchange } from '@tabler/icons-react';
import { useAppSelector } from '../../../hooks';

export default function ExchangeRatesCard() {
  const exchangeRates = useAppSelector((state) => state.currency.rates);
  const loading = useAppSelector((state) => state.currency.loading);
  const displayCurrency = useAppSelector((state) => state.currency.displayCurrency);

  if (loading || !exchangeRates?.Valute) {
    return (
      <Card radius="lg" p="lg" withBorder style={{ height: '100%', width: '100%' }}>
        <Group justify="space-between" mb="xs">
          <Text size="sm" c="dimmed">Курс валют</Text>
          <ThemeIcon color="indigo" variant="light" radius="xl">
            <IconArrowsExchange size={18} />
          </ThemeIcon>
        </Group>
        <Text size="sm" c="dimmed">Загрузка...</Text>
      </Card>
    );
  }

  const usd = exchangeRates.Valute.USD;
  const formatRate = (value: number) => value.toFixed(2);

  // Определяем, какой курс показывать в зависимости от выбранной валюты
  const shouldShowUsd = displayCurrency === 'RUB';
  const shouldShowRub = displayCurrency === 'USD';

  return (
    <Card radius="lg" p="lg" withBorder style={{ height: '100%', width: '100%' }}>
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed">Курс валют</Text>
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
        {/* Показываем USD, если выбран рубль */}
        {shouldShowUsd && usd && (
          <Group gap={6} wrap="nowrap">
            <Text size="sm" c="dimmed" fw={500}>$ USD</Text>
            <Text size="lg" fw={700}>{formatRate(usd.Value)}</Text>
          </Group>
        )}

        {/* Показываем RUB (обратный курс), если выбран доллар */}
        {shouldShowRub && usd && (
          <Group gap={6} wrap="nowrap">
            <Text size="sm" c="dimmed" fw={500}>₽ RUB</Text>
            <Text size="lg" fw={700}>{formatRate(1 / usd.Value)}</Text>
          </Group>
        )}
      </Group>
    </Card>
  );
}
