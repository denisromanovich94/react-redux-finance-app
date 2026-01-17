import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../app/store';
import { Paper, Button, Textarea, Stack, Text, Group, Select, ActionIcon } from '@mantine/core';
import {
  stopSession,
  setLog,
  pauseSession,
  resumeSession,
  setCurrentActivity,
  setCurrentActivityType,
  setCurrentProject,
  setCurrentClient,
} from '../../timetracker/timeTrackerSlice';
import { saveSession, fetchProjects } from '../../timetracker/timeTrackerThunks';
import { loadClients } from '../../../features/clients/clientsSlice';
import {
  selectCurrentActivity,
  selectCurrentActivityType,
  selectCurrentProjectId,
  selectCurrentClientId,
  selectElapsedSeconds,
  selectCanPause,
  selectCanResume,
  selectProjects,
} from '../../timetracker/selectors';
import { notifications } from '@mantine/notifications';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { HourLog } from '../../timetracker/types';
import { useActivityReminder } from '../../timetracker/hooks/useActivityReminder';

const activityOptions = [
  { value: 'работал', label: 'Работал' },
  { value: 'общался с клиентами', label: 'Общался с клиентами' },
  { value: 'писал отклики', label: 'Писал отклики' },
];

export default function FloatingTracker() {
  const dispatch = useDispatch<AppDispatch>();
  const tracker = useSelector((state: RootState) => state.timeTracker);
  const activity = useSelector(selectCurrentActivity);
  const activityType = useSelector(selectCurrentActivityType);
  const projectId = useSelector(selectCurrentProjectId);
  const clientId = useSelector(selectCurrentClientId);
  const canPause = useSelector(selectCanPause);
  const canResume = useSelector(selectCanResume);
  const projects = useSelector(selectProjects);
  const clients = useSelector((state: RootState) => state.clients.items);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [displayedSeconds, setDisplayedSeconds] = useState(0);

  // Activity reminder hook
  useActivityReminder();

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(loadClients());
  }, [dispatch]);

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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStop = async () => {
    if (!tracker.startTime) return;

    const endTime = dayjs().toISOString();
    const startHour = dayjs(tracker.startTime).toISOString();

    const log: HourLog = {
      hour: startHour,
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
        message: `Сессия сохранена (${formatTime(displayedSeconds)})`,
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: String(err || 'Не удалось сохранить сессию'),
        color: 'red',
      });
    }
  };

  if (tracker.status !== 'running' && tracker.status !== 'paused') {
    return null;
  }

  return (
    <Paper
      shadow="xl"
      p={isCollapsed ? 'xs' : 'md'}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: isCollapsed ? 200 : 350,
        zIndex: 1000,
        border: '2px solid #228be6',
        transition: 'width 0.2s ease',
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600} size="sm">
            Тайм-трекер
          </Text>
          <Group gap="xs">
            <Text c="blue" fw={700}>
              {formatTime(displayedSeconds)}
              {tracker.status === 'paused' && ' ⏸'}
            </Text>
            <ActionIcon variant="subtle" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          </Group>
        </Group>

        {!isCollapsed && (
          <>
            <Select
              data={projects.map((p) => ({ value: p.id, label: p.name }))}
              value={projectId || ''}
              onChange={(val) => dispatch(setCurrentProject(val || null))}
              placeholder="Выберите проект"
              size="xs"
              clearable
            />

            <Select
              data={clients.map((c) => ({ value: c.id, label: c.name }))}
              value={clientId || ''}
              onChange={(val) => dispatch(setCurrentClient(val || null))}
              placeholder="Выберите клиента"
              size="xs"
              clearable
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
              size="xs"
            />

            <Textarea
              placeholder="Что делали в этой сессии?"
              value={activity}
              onChange={(e) => dispatch(setCurrentActivity(e.currentTarget.value))}
              minRows={2}
              size="xs"
            />

            <Group grow>
              {canPause && (
                <Button color="orange" onClick={() => dispatch(pauseSession())} size="xs">
                  Пауза
                </Button>
              )}
              {canResume && (
                <Button color="green" onClick={() => dispatch(resumeSession())} size="xs">
                  Продолжить
                </Button>
              )}
              <Button color="red" onClick={handleStop} size="xs">
                Остановить
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Paper>
  );
}
