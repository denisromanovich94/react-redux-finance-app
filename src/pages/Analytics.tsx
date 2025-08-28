import { Card, Title, Grid } from '@mantine/core';
import { PieChart, AreaChart } from '@mantine/charts';
import PageContainer from '../shared/ui/PageContainer';
import { useAnalyticsData } from '../features/analytics/useAnalyticsData';

export default function Analytics() {
  const { expenseData, incomeData, trendData } = useAnalyticsData();

  return (
    <PageContainer>
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Card radius="lg" p="lg" withBorder>
            <Title order={2} mb="md">Расходы по категориям</Title>
            <PieChart data={expenseData} withLabels withTooltip size={260} />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Card radius="lg" p="lg" withBorder>
            <Title order={2} mb="md">Доходы по категориям</Title>
            <PieChart data={incomeData} withLabels withTooltip size={260} />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 12, lg: 4 }}>
          <Card radius="lg" p="lg" withBorder>
            <Title order={2} mb="md">Доходы vs Расходы по месяцам</Title>
            <AreaChart
              h={280}
              data={trendData}
              dataKey="month"
              series={[
                { name: 'income', label: 'Доход', color: 'teal' },
                { name: 'expenses', label: 'Расход', color: 'red' },
              ]}
              withLegend
              withTooltip
            />
          </Card>
        </Grid.Col>
      </Grid>
    </PageContainer>
  );
}
