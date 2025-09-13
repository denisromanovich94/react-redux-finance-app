import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { startSession, stopSession, setLog } from '../features/timetracker/timeTrackerSlice';
import { saveSession, fetchSessions } from '../features/timetracker/timeTrackerThunks';
import { Button, Group, Stack, Title, Divider, Table, Textarea, Select } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import dayjs from 'dayjs';
import type { HourLog } from '../features/timetracker/types';

export default function Tracker() {
  const dispatch = useDispatch<AppDispatch>();
  const tracker = useSelector((state: RootState) => state.timeTracker);

  const [time, setTime] = useState(dayjs());
  const [activity, setActivity] = useState('');
  const [activityType, setActivityType] = useState<'работал' | 'общался с клиентами' | 'писал отклики'>('работал');
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [sessionLogs, setSessionLogs] = useState<HourLog[]>([]);
  const [currentDayLogs, setCurrentDayLogs] = useState<HourLog[]>([]);

  const activityOptions = [
    { value: 'работал', label: 'Работал' },
    { value: 'общался с клиентами', label: 'Общался с клиентами' },
    { value: 'писал отклики', label: 'Писал отклики' },
  ];

  useEffect(() => {
    const id = setInterval(() => setTime(dayjs()), 1000);
    return () => clearInterval(id);
  }, []);


  useEffect(() => {
    dispatch(fetchSessions())
      .unwrap()
      .then(data => setSessionLogs(data.flatMap(s => s.logs ?? [])))
      .catch(err => console.error(err));
  }, [dispatch]);


  useEffect(() => {
    try {
      localStorage.setItem('timeTracker', JSON.stringify(sessionLogs));
    } catch (err) {
      console.error(err);
    }
  }, [sessionLogs]);


  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD');
    setCurrentDayLogs(sessionLogs.filter(log => dayjs(log.hour).format('YYYY-MM-DD') === today));
  }, [sessionLogs]);


  useEffect(() => {
    const now = dayjs();
    const nextMidnight = dayjs().endOf('day').add(1, 'second');
    const msUntilMidnight = nextMidnight.diff(now);

    const timer = setTimeout(() => setCurrentDayLogs([]), msUntilMidnight);
    return () => clearTimeout(timer);
  }, [currentDayLogs]);

  const handleStart = () => {
    dispatch(startSession());
    setActivity('');
    setSessionStart(dayjs().format());
  };

  const handleStop = async () => {
    if (!sessionStart) return;

    const endTime = dayjs().format();
    const log: HourLog = {
      hour: sessionStart,
      endTime,
      activity,
      activityType,
    };

    // Локальные логи
    setSessionLogs(prev => [...prev, log]);
    dispatch(setLog(log));


    dispatch(stopSession());

    try {
      await dispatch(saveSession()).unwrap();
    } catch (err) {
      showNotification({ title: 'Ошибка', message: String(err || 'Не удалось сохранить') });
    }

    setActivity('');
    setSessionStart(null);
  };

  const elapsedSeconds = sessionStart
    ? Math.floor(dayjs().diff(dayjs(sessionStart), 'second'))
    : 0;

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Тайм-трекер</Title>
        <div>{time.format('DD.MM.YYYY HH:mm:ss')}</div>
      </Group>

      <Group justify="space-between">
        {tracker.status === 'idle' || tracker.status === 'stopped' ? (
          <Button onClick={handleStart}>Старт</Button>
        ) : tracker.status === 'running' ? (
          <Button color="red" onClick={handleStop}>Стоп</Button>
        ) : null}
      </Group>

      {tracker.status === 'running' && (
        <>
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
            label="Тип активности"
            mt="md"
          />
          <Textarea
            placeholder="Что делаете в этой сессии?"
            value={activity}
            onChange={(e) => setActivity(e.currentTarget.value)}
            minRows={3}
            mt="md"
          />
        </>
      )}

      <Divider my="md" />

      {currentDayLogs.length > 0 && (
        <>
          <Title order={4}>Занятия за сегодня</Title>
          <Table striped highlightOnHover>
            <thead>
              <tr>
                <th>С</th>
                <th>До</th>
                <th>Что делал</th>
                <th>Тип</th>
              </tr>
            </thead>
            <tbody>
              {currentDayLogs.map((log, idx) => (
                <tr key={idx}>
                  <td>{dayjs(log.hour).format('HH:mm')}</td>
                  <td>{log.endTime ? dayjs(log.endTime).format('HH:mm') : '-'}</td>
                  <td>{log.activity}</td>
                  <td>{log.activityType}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      {tracker.status === 'running' && sessionStart && (
        <div style={{ marginTop: 16 }}>
          Прошло времени: {formatTime(elapsedSeconds)}
        </div>
      )}
    </Stack>
  );
}