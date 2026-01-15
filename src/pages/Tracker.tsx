import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { startSession, stopSession, setLog } from '../features/timetracker/timeTrackerSlice';
import { saveSession, fetchSessions } from '../features/timetracker/timeTrackerThunks';
import { Button, Group, Stack, Title, Divider, Table, Textarea, Select, Modal, ActionIcon } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { HourLog } from '../features/timetracker/types';

export default function Tracker() {
  const dispatch = useDispatch<AppDispatch>();
  const tracker = useSelector((state: RootState) => state.timeTracker);

  const [time, setTime] = useState(dayjs());
  const [activity, setActivity] = useState(() => {
    return localStorage.getItem('currentActivity') || '';
  });
  const [activityType, setActivityType] = useState<'работал' | 'общался с клиентами' | 'писал отклики'>(() => {
    const stored = localStorage.getItem('currentActivityType');
    if (stored === 'общался с клиентами' || stored === 'писал отклики') return stored;
    return 'работал';
  });
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [sessionLogs, setSessionLogs] = useState<HourLog[]>([]);
  const [currentDayLogs, setCurrentDayLogs] = useState<HourLog[]>([]);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editActivity, setEditActivity] = useState('');
  const [editActivityType, setEditActivityType] = useState<'работал' | 'общался с клиентами' | 'писал отклики'>('работал');

  const activityOptions = [
    { value: 'работал', label: 'Работал' },
    { value: 'общался с клиентами', label: 'Общался с клиентами' },
    { value: 'писал отклики', label: 'Писал отклики' },
  ];

  // Синхронизация с localStorage
  useEffect(() => {
    localStorage.setItem('currentActivity', activity);
  }, [activity]);

  useEffect(() => {
    localStorage.setItem('currentActivityType', activityType);
  }, [activityType]);

  useEffect(() => {
    const id = setInterval(() => setTime(dayjs()), 1000);
    return () => clearInterval(id);
  }, []);


  const allSessions = useSelector((state: RootState) => state.timeTracker.allSessions);

  useEffect(() => {
    dispatch(fetchSessions())
      .unwrap()
      .then(data => setSessionLogs(data.flatMap(s => s.logs ?? [])))
      .catch(err => console.error(err));
  }, [dispatch]);

  // Обновляем sessionLogs когда приходят новые сессии из Redux
  useEffect(() => {
    if (allSessions.length > 0) {
      setSessionLogs(allSessions.flatMap(s => s.logs ?? []));
    }
  }, [allSessions]);


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
    setActivityType('работал');
    localStorage.removeItem('currentActivity');
    localStorage.removeItem('currentActivityType');
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

  const handleEdit = (index: number) => {
    const log = currentDayLogs[index];
    setEditingIndex(index);
    setEditActivity(log.activity);
    setEditActivityType(log.activityType);
    setEditModalOpened(true);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const updatedLogs = [...sessionLogs];
    const logToEdit = currentDayLogs[editingIndex];
    const globalIndex = sessionLogs.findIndex(l => l.hour === logToEdit.hour && l.endTime === logToEdit.endTime);

    if (globalIndex !== -1) {
      updatedLogs[globalIndex] = {
        ...updatedLogs[globalIndex],
        activity: editActivity,
        activityType: editActivityType,
      };
      setSessionLogs(updatedLogs);
    }

    setEditModalOpened(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const logToDelete = currentDayLogs[index];
    const updatedLogs = sessionLogs.filter(l => !(l.hour === logToDelete.hour && l.endTime === logToDelete.endTime));
    setSessionLogs(updatedLogs);
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
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '80px' }}>С</Table.Th>
                <Table.Th style={{ width: '80px' }}>До</Table.Th>
                <Table.Th>Что делал</Table.Th>
                <Table.Th style={{ width: '200px' }}>Тип</Table.Th>
                <Table.Th style={{ width: '100px' }}>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {currentDayLogs.map((log, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>{dayjs(log.hour).format('HH:mm')}</Table.Td>
                  <Table.Td>{log.endTime ? dayjs(log.endTime).format('HH:mm') : '-'}</Table.Td>
                  <Table.Td style={{
                    maxWidth: '400px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {log.activity}
                  </Table.Td>
                  <Table.Td>{log.activityType}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleEdit(idx)}
                      >
                        <IconPencil size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(idx)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </>
      )}

      {tracker.status === 'running' && sessionStart && (
        <div style={{ marginTop: 16 }}>
          Прошло времени: {formatTime(elapsedSeconds)}
        </div>
      )}

      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="Редактировать запись"
        size="lg"
        styles={{ inner: { right: 0, left: 0 } }}
        centered
      >
        <Stack>
          <Select
            data={activityOptions}
            value={editActivityType}
            onChange={(val) => {
              if (!val) return;
              if (
                val === 'работал' ||
                val === 'общался с клиентами' ||
                val === 'писал отклики'
              ) {
                setEditActivityType(val);
              }
            }}
            label="Тип активности"
          />
          <Textarea
            placeholder="Что делали в этой сессии?"
            value={editActivity}
            onChange={(e) => setEditActivity(e.currentTarget.value)}
            minRows={3}
            label="Описание"
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setEditModalOpened(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveEdit}>
              Сохранить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}