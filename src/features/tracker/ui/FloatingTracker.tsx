import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../app/store';
import { Paper, Button, Textarea, Stack, Text, Group, Select } from '@mantine/core';
import { stopSession } from '../../timetracker/timeTrackerSlice';
import dayjs from 'dayjs';
import type { HourLog } from '../../timetracker/types';

const activityOptions = [
  { value: 'работал', label: 'Работал' },
  { value: 'общался с клиентами', label: 'Общался с клиентами' },
  { value: 'писал отклики', label: 'Писал отклики' },
];

export default function FloatingTracker() {
  const dispatch = useDispatch<AppDispatch>();
  const tracker = useSelector((state: RootState) => state.timeTracker);

  const [activity, setActivity] = useState(() => {
    return localStorage.getItem('currentActivity') || '';
  });
  const [activityType, setActivityType] = useState<'работал' | 'общался с клиентами' | 'писал отклики'>(() => {
    const stored = localStorage.getItem('currentActivityType');
    if (stored === 'общался с клиентами' || stored === 'писал отклики') return stored;
    return 'работал';
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Синхронизация с localStorage
  useEffect(() => {
    localStorage.setItem('currentActivity', activity);
  }, [activity]);

  useEffect(() => {
    localStorage.setItem('currentActivityType', activityType);
  }, [activityType]);

  // Вычисляем прошедшее время
  useEffect(() => {
    if (tracker.status !== 'running' || !tracker.startTime) {
      return;
    }

    const interval = setInterval(() => {
      const now = dayjs();
      const start = dayjs(tracker.startTime);
      const diff = now.diff(start, 'second');
      setElapsedSeconds(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [tracker.status, tracker.startTime]);

  // Форматирование времени
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStop = () => {
    if (!tracker.startTime) return;

    const endTime = dayjs().toISOString();
    const startHour = dayjs(tracker.startTime).toISOString();

    // Сохраняем лог в localStorage
    const storedLogs: HourLog[] = JSON.parse(localStorage.getItem('sessionLogs') || '[]');
    storedLogs.push({
      hour: startHour,
      endTime,
      activity,
      activityType,
    });
    localStorage.setItem('sessionLogs', JSON.stringify(storedLogs));

    // Останавливаем трекер
    dispatch(stopSession());

    // Очищаем поля и localStorage
    setActivity('');
    setActivityType('работал');
    localStorage.removeItem('currentActivity');
    localStorage.removeItem('currentActivityType');
  };

  // Не показываем виджет если трекер не запущен
  if (tracker.status !== 'running') {
    return null;
  }

  return (
    <Paper
      shadow="xl"
      p="md"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 350,
        zIndex: 1000,
        border: '2px solid #228be6',
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600} size="sm">Тайм-трекер</Text>
          <Text c="blue" fw={700}>{formatTime(elapsedSeconds)}</Text>
        </Group>

        <Select
          data={activityOptions}
          value={activityType}
          onChange={(val) => {
            if (!val) return;
            if (
              val === 'работал' ||
              val === 'общался с клиентами' ||
              val === 'писал отклики'
            ) {
              setActivityType(val);
            }
          }}
          size="xs"
        />

        <Textarea
          placeholder="Что делали в этой сессии?"
          value={activity}
          onChange={(e) => setActivity(e.currentTarget.value)}
          minRows={2}
          size="xs"
        />

        <Button
          color="red"
          onClick={handleStop}
          size="xs"
          fullWidth
        >
          Остановить
        </Button>
      </Stack>
    </Paper>
  );
}
