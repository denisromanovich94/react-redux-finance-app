import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import {
  startSession,
  stopSession,
  setLog,
  pauseSession,
  resumeSession,
  setCurrentActivity,
  setCurrentActivityType,
  setCurrentProject,
  setCurrentClient,
} from '../features/timetracker/timeTrackerSlice';
import {
  saveSession,
  fetchSessions,
  updateSessionThunk,
  deleteSessionThunk,
  fetchProjects,
} from '../features/timetracker/timeTrackerThunks';
import {
  selectCurrentActivity,
  selectCurrentActivityType,
  selectCurrentProjectId,
  selectCurrentClientId,
  selectTodayLogs,
  selectProjects,
} from '../features/timetracker/selectors';
import { loadClients } from '../features/clients/clientsSlice';
import { Button, Group, Stack, Title, Divider, Table, Textarea, Select, Modal, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { HourLog, ActivityType, TimeSession } from '../features/timetracker/types';
import TrackerStats from '../features/timetracker/ui/TrackerStats';

export default function Tracker() {
  const dispatch = useDispatch<AppDispatch>();
  const tracker = useSelector((state: RootState) => state.timeTracker);
  const activity = useSelector(selectCurrentActivity);
  const activityType = useSelector(selectCurrentActivityType);
  const currentProjectId = useSelector(selectCurrentProjectId);
  const currentClientId = useSelector(selectCurrentClientId);
  const currentDayLogs = useSelector(selectTodayLogs);
  const allSessions = useSelector((state: RootState) => state.timeTracker.allSessions);
  const projects = useSelector(selectProjects);
  const clients = useSelector((state: RootState) => state.clients.items);

  const [time, setTime] = useState(dayjs());
  const [displayedSeconds, setDisplayedSeconds] = useState(0);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string | null>(null);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editingSession, setEditingSession] = useState<TimeSession | null>(null);
  const [editingLogIndex, setEditingLogIndex] = useState<number | null>(null);
  const [editActivity, setEditActivity] = useState('');
  const [editActivityType, setEditActivityType] = useState<ActivityType>('работал');

  const activityOptions = [
    { value: 'работал', label: 'Работал' },
    { value: 'общался с клиентами', label: 'Общался с клиентами' },
    { value: 'писал отклики', label: 'Писал отклики' },
  ];

  // Filter logs by selected project
  const filteredLogs = selectedProjectFilter
    ? currentDayLogs.filter((log) => {
        const session = allSessions.find((s) =>
          s.logs?.some((l) => l.hour === log.hour && l.endTime === log.endTime)
        );
        return session?.project_id === selectedProjectFilter;
      })
    : currentDayLogs;

  useEffect(() => {
    const id = setInterval(() => {
      setTime(dayjs());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Update displayed time every second
  useEffect(() => {
    const updateTime = () => {
      if (tracker.status === 'running' || tracker.status === 'paused') {
        const intervals = tracker.intervals || [];
        let total = 0;
        for (const iv of intervals) {
          if (iv.end) {
            const start = new Date(iv.start).getTime();
            const end = new Date(iv.end).getTime();
            total += Math.floor((end - start) / 1000);
          } else {
            const start = new Date(iv.start).getTime();
            const now = Date.now();
            total += Math.floor((now - start) / 1000);
          }
        }
        setDisplayedSeconds(total);
      }
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [tracker.status, tracker.intervals]);

  useEffect(() => {
    dispatch(fetchSessions());
    dispatch(fetchProjects());
    dispatch(loadClients());
  }, [dispatch]);

  const handleStart = () => {
    dispatch(startSession());
  };

  const handleStop = async () => {
    if (!tracker.startTime) return;

    const endTime = dayjs().toISOString();
    const log: HourLog = {
      hour: tracker.startTime,
      endTime,
      activity,
      activityType,
    };

    dispatch(setLog(log));
    dispatch(stopSession());

    try {
      await dispatch(saveSession()).unwrap();
      notifications.show({
        title: 'Успех',
        message: 'Сессия сохранена',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: String(err || 'Не удалось сохранить'),
        color: 'red',
      });
    }
  };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleEdit = (index: number) => {
    const log = currentDayLogs[index];
    const session = allSessions.find((s) =>
      s.logs?.some((l) => l.hour === log.hour && l.endTime === log.endTime)
    );

    if (session) {
      const logIndex = session.logs?.findIndex(
        (l) => l.hour === log.hour && l.endTime === log.endTime
      );

      if (logIndex !== undefined && logIndex !== -1) {
        setEditingSession(session);
        setEditingLogIndex(logIndex);
        setEditActivity(log.activity);
        setEditActivityType(log.activityType);
        setEditModalOpened(true);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSession || editingLogIndex === null) return;

    const updatedLogs = [...(editingSession.logs ?? [])];
    updatedLogs[editingLogIndex] = {
      ...updatedLogs[editingLogIndex],
      activity: editActivity,
      activityType: editActivityType,
    };

    try {
      await dispatch(
        updateSessionThunk({
          id: editingSession.id!,
          updates: { logs: updatedLogs },
        })
      ).unwrap();

      notifications.show({
        title: 'Успех',
        message: 'Запись обновлена',
        color: 'green',
      });

      setEditModalOpened(false);
      setEditingSession(null);
      setEditingLogIndex(null);
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: String(err),
        color: 'red',
      });
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Удалить запись?')) return;

    const log = currentDayLogs[index];
    const session = allSessions.find((s) =>
      s.logs?.some((l) => l.hour === log.hour && l.endTime === log.endTime)
    );

    if (session?.id) {
      try {
        await dispatch(deleteSessionThunk(session.id)).unwrap();

        notifications.show({
          title: 'Успех',
          message: 'Запись удалена',
          color: 'green',
        });
      } catch (err) {
        notifications.show({
          title: 'Ошибка',
          message: String(err),
          color: 'red',
        });
      }
    }
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
          <Group>
            <Button color="orange" onClick={() => dispatch(pauseSession())}>
              Пауза
            </Button>
            <Button color="red" onClick={handleStop}>
              Стоп
            </Button>
          </Group>
        ) : tracker.status === 'paused' ? (
          <Group>
            <Button color="green" onClick={() => dispatch(resumeSession())}>
              Продолжить
            </Button>
            <Button color="red" onClick={handleStop}>
              Стоп
            </Button>
          </Group>
        ) : null}
      </Group>

      {(tracker.status === 'running' || tracker.status === 'paused') && (
        <>
          <Select
            data={projects.map((p) => ({ value: p.id, label: p.name }))}
            value={currentProjectId || ''}
            onChange={(val) => dispatch(setCurrentProject(val || null))}
            label="Проект"
            placeholder="Выберите проект (необязательно)"
            clearable
            searchable
            mt="md"
          />

          <Select
            data={clients.map((c) => ({ value: c.id, label: c.name }))}
            value={currentClientId || ''}
            onChange={(val) => dispatch(setCurrentClient(val || null))}
            label="Клиент"
            placeholder="Выберите клиента (необязательно)"
            clearable
            searchable
            mt="md"
          />

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
                dispatch(setCurrentActivityType(val));
              }
            }}
            label="Тип активности"
            mt="md"
          />
          <Textarea
            placeholder="Что делаете в этой сессии?"
            value={activity}
            onChange={(e) => dispatch(setCurrentActivity(e.currentTarget.value))}
            minRows={3}
            mt="md"
          />
        </>
      )}

      <Divider my="md" />

      {currentDayLogs.length > 0 && (
        <>
          <Title order={4}>Занятия за сегодня</Title>

          <Select
            data={[
              { value: '', label: 'Все проекты' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
            value={selectedProjectFilter ?? ''}
            onChange={(val) => setSelectedProjectFilter(val || null)}
            placeholder="Фильтр по проекту"
            clearable
          />

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
              {filteredLogs.map((log, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>{dayjs(log.hour).format('HH:mm')}</Table.Td>
                  <Table.Td>{log.endTime ? dayjs(log.endTime).format('HH:mm') : '-'}</Table.Td>
                  <Table.Td
                    style={{
                      maxWidth: '400px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {log.activity}
                  </Table.Td>
                  <Table.Td>{log.activityType}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="subtle" color="blue" onClick={() => handleEdit(idx)}>
                        <IconPencil size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(idx)}>
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

      {(tracker.status === 'running' || tracker.status === 'paused') && (
        <div style={{ marginTop: 16 }}>
          Прошло времени: {formatTime(displayedSeconds)}
          {tracker.status === 'paused' && ' (на паузе)'}
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
            <Button onClick={handleSaveEdit}>Сохранить</Button>
          </Group>
        </Stack>
      </Modal>

      <Divider my="xl" />

      <TrackerStats />
    </Stack>
  );
}
