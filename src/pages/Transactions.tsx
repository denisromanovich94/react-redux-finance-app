import { Card, Table, Title, Text } from '@mantine/core';

const rows = [
  { date: '2025-08-01', category: 'Rent', amount: -1200 },
  { date: '2025-08-03', category: 'Salary', amount: 2600 },
  { date: '2025-08-05', category: 'Groceries', amount: -95.4 },
];

export default function Transactions() {
  return (
    <Card radius="lg" p="lg" withBorder>
      <Title order={2} mb="md">Transactions</Title>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Category</Table.Th>
            <Table.Th ta="right">Amount</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r, i) => (
            <Table.Tr key={i}>
              <Table.Td>{r.date}</Table.Td>
              <Table.Td>{r.category}</Table.Td>
              <Table.Td ta="right">
                <Text c={r.amount < 0 ? 'red' : 'green'}>
                  {r.amount < 0 ? '-' : '+'}${Math.abs(r.amount)}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}