import { useState, useMemo } from 'react';
import { Card, Title, Modal, Table, Group, Text, Grid } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { PieChart } from '@mantine/charts';
import PageContainer from '../shared/ui/PageContainer';
import { useAnalyticsData } from '../features/analytics/useAnalyticsData';
import { useAppSelector } from '../hooks';
import dayjs from '../shared/dayjs';

export default function Analytics() {
  const [range, setRange] = useState<[Date | null, Date | null]>([null, null]);

  const { expenseData, incomeData } = useAnalyticsData({
    from: range[0],
    to: range[1],
  });

  const transactions = useAppSelector((s) => s.transactions.items);

  const [catModal, setCatModal] = useState<{
    open: boolean;
    category: string | null;
    type: 'income' | 'expense' | null;
  }>({
    open: false,
    category: null,
    type: null,
  });

const currentRange = range;
const filteredTx = useMemo(() => {
  if (!catModal.category) return [];

  const inRangeFn = (dateStr: string) => {
    if (!currentRange[0] && !currentRange[1]) return true;
    const ts = dayjs(dateStr, 'DD.MM.YYYY').valueOf();
    const fromTs = currentRange[0] ? dayjs(currentRange[0]).startOf('day').valueOf() : -Infinity;
    const toTs = currentRange[1] ? dayjs(currentRange[1]).endOf('day').valueOf() : Infinity;
    return ts >= fromTs && ts <= toTs;
  };
  return transactions.filter((t) => t.category === catModal.category && inRangeFn(t.date));
}, [transactions, catModal.category, currentRange]);

  const openCatModal = (category: string, type: 'income' | 'expense') =>
    setCatModal({ open: true, category, type });

  const closeCatModal = () =>
    setCatModal({ open: false, category: null, type: null });
const hourlyRateForCategory = useMemo(() => {
  if (!filteredTx.length) return 0;

  let totalIncome = 0;
  let totalHours = 0;

  for (const tx of filteredTx) {
    if (tx.amount > 0 && tx.hours && tx.hours > 0) {
      totalIncome += tx.amount;
      totalHours += tx.hours;
    }
  }

  if (totalHours === 0) return 0;

  return totalIncome / totalHours;
}, [filteredTx]);
  return (
    <PageContainer>
      <Card radius="lg" p="lg" withBorder mb="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>Аналитика</Title>
          <DatePickerInput
  type="range"
  value={range}
  onChange={(val) => setRange(val as [Date | null, Date | null])}
  placeholder="Период"
  valueFormat="DD.MM.YYYY"
  allowSingleDateInRange
/>
        </Group>
      </Card>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 6, lg: 6 }}>
          <Card radius="lg" p="lg" withBorder>
            <Title order={3} mb="md">
              Расходы по категориям
            </Title>
            <PieChart
  data={expenseData}
  withLabels
  withTooltip
  size={260}
  pieProps={{
    onClick: (data: { name?: string }) => {
      if (data?.name) openCatModal(data.name, 'expense');
    },
  }}
/>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 6 }}>
          <Card radius="lg" p="lg" withBorder>
            <Title order={3} mb="md">
              Доходы по категориям
            </Title>
            <PieChart
  data={incomeData}
  withLabels
  withTooltip
  size={260}
  pieProps={{
    onClick: (data: { name?: string }) => {
      if (data?.name) openCatModal(data.name, 'income');
    },
  }}
/>
          </Card>
        </Grid.Col>

      </Grid>

      <Modal
        opened={catModal.open}
        onClose={closeCatModal}
        size="lg"
        title={
          catModal.category ? `Транзакции: ${catModal.category}` : 'Транзакции'
        }
        styles={{ inner: { right: 0, left: 0 } }}
      >
        {filteredTx.length === 0 ? (
  <Text c="dimmed">За выбранный период нет записей.</Text>
) : (
  <>
    {catModal.type === 'income' && (
      <Text mb="sm" fw={500}>
        Стоимость работы в час: {hourlyRateForCategory.toFixed(2)}
      </Text>
    )}
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Дата</Table.Th>
          <Table.Th ta="right">Сумма</Table.Th>
          <Table.Th>Комментарий</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {filteredTx.map((t) => (
          <Table.Tr key={t.id}>
            <Table.Td>{t.date}</Table.Td>
            <Table.Td ta="right">
              <Text c={t.amount < 0 ? 'red' : 'green'}>
                {t.amount.toLocaleString('ru-RU')}
              </Text>
            </Table.Td>
            <Table.Td
              style={{
                maxWidth: 420,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {t.comment ?? '—'}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  </>
)}

      </Modal>
    </PageContainer>
  );
}
