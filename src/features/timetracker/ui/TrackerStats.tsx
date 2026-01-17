import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Grid, Stack, Title, SegmentedControl, Text, Group, Paper } from '@mantine/core';
import { IconClock, IconTrendingUp, IconCalendar } from '@tabler/icons-react';
import StatCard from '../../../shared/ui/StatCard';
import type { RootState } from '../../../app/store';
import dayjs from 'dayjs';

export default function TrackerStats() {
  const allSessions = useSelector((state: RootState) => state.timeTracker.allSessions);
  const projects = useSelector((state: RootState) => state.timeTracker.projects);

  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const stats = useMemo(() => {
    let startDate: dayjs.Dayjs;
    const endDate = dayjs().endOf('day');

    if (period === 'today') {
      startDate = dayjs().startOf('day');
    } else if (period === 'week') {
      startDate = dayjs().startOf('week');
    } else {
      startDate = dayjs().startOf('month');
    }

    const filteredSessions = allSessions.filter((session) => {
      const sessionDate = dayjs(session.start_time);
      return sessionDate.isAfter(startDate) && sessionDate.isBefore(endDate);
    });

    const totalSeconds = filteredSessions.reduce(
      (sum, session) => sum + (session.duration_seconds || 0),
      0
    );

    const breakdownByActivityType = {
      'работал': 0,
      'общался с клиентами': 0,
      'писал отклики': 0,
    };

    filteredSessions.forEach((session) => {
      session.logs?.forEach((log) => {
        const logStart = dayjs(log.hour);
        const logEnd = log.endTime ? dayjs(log.endTime) : dayjs();
        const logDuration = logEnd.diff(logStart, 'second');
        breakdownByActivityType[log.activityType] += logDuration;
      });
    });

    const breakdownByProject: { projectId: string; projectName: string; totalSeconds: number }[] =
      [];

    const projectMap = new Map<string, number>();

    filteredSessions.forEach((session) => {
      if (session.project_id) {
        const current = projectMap.get(session.project_id) || 0;
        projectMap.set(session.project_id, current + (session.duration_seconds || 0));
      }
    });

    projectMap.forEach((seconds, projectId) => {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        breakdownByProject.push({
          projectId,
          projectName: project.name,
          totalSeconds: seconds,
        });
      }
    });

    breakdownByProject.sort((a, b) => b.totalSeconds - a.totalSeconds);

    const sessionsCount = filteredSessions.length;
    const averageSessionDuration = sessionsCount > 0 ? totalSeconds / sessionsCount : 0;

    return {
      totalSeconds,
      breakdownByActivityType,
      breakdownByProject,
      sessionsCount,
      averageSessionDuration,
    };
  }, [allSessions, projects, period]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${minutes}м`;
  };

  return (
    <Stack>
      <Title order={3}>Статистика</Title>

      <SegmentedControl
        value={period}
        onChange={(val) => setPeriod(val as any)}
        data={[
          { label: 'Сегодня', value: 'today' },
          { label: 'Неделя', value: 'week' },
          { label: 'Месяц', value: 'month' },
        ]}
      />

      <Grid gutter="lg" grow>
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Всего времени"
            value={formatDuration(stats.totalSeconds)}
            color="blue"
            icon={<IconClock size={20} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Сессий"
            value={stats.sessionsCount}
            color="green"
            icon={<IconCalendar size={20} />}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Средняя сессия"
            value={formatDuration(stats.averageSessionDuration)}
            color="orange"
            icon={<IconTrendingUp size={20} />}
          />
        </Grid.Col>
      </Grid>

      <Paper p="md" withBorder>
        <Title order={4} mb="sm">
          По типам активности
        </Title>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text>Работал</Text>
            <Text fw={600}>{formatDuration(stats.breakdownByActivityType['работал'])}</Text>
          </Group>
          <Group justify="space-between">
            <Text>Общался с клиентами</Text>
            <Text fw={600}>
              {formatDuration(stats.breakdownByActivityType['общался с клиентами'])}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text>Писал отклики</Text>
            <Text fw={600}>
              {formatDuration(stats.breakdownByActivityType['писал отклики'])}
            </Text>
          </Group>
        </Stack>
      </Paper>

      {stats.breakdownByProject.length > 0 && (
        <Paper p="md" withBorder>
          <Title order={4} mb="sm">
            По проектам
          </Title>
          <Stack gap="xs">
            {stats.breakdownByProject.map((p) => (
              <Group key={p.projectId} justify="space-between">
                <Text>{p.projectName}</Text>
                <Text fw={600}>{formatDuration(p.totalSeconds)}</Text>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
