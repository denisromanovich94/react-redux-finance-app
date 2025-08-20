import { Card, Grid, Title, Text } from '@mantine/core';

export default function Overview() {
  return (
  <div style={{ maxWidth: 1200, margin: '0 auto' }}>
    <Title order={2} mb="md">Overview</Title>
    <Grid>
      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
        <Card radius="lg" p="lg" withBorder>
          <Text size="sm" c="dimmed">Balance</Text>
          <Title order={3}>$12,340.21</Title>
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
        <Card radius="lg" p="lg" withBorder>
          <Text size="sm" c="dimmed">Income (M)</Text>
          <Title order={3}>$5,200</Title>
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
        <Card radius="lg" p="lg" withBorder>
          <Text size="sm" c="dimmed">Expenses (M)</Text>
          <Title order={3}>$3,870</Title>
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
        <Card radius="lg" p="lg" withBorder>
          <Text size="sm" c="dimmed">Savings</Text>
          <Title order={3}>$1,330</Title>
        </Card>
      </Grid.Col>
    </Grid>
  </div>
);
}