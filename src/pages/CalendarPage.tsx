import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { fetchSessions } from '../features/timetracker/timeTrackerThunks';
import { Calendar } from '@mantine/dates';
import { Modal, Text, Title, Stack, Badge, Group, Divider, Card, Timeline } from '@mantine/core';
import { IconClock, IconActivity } from '@tabler/icons-react';
import dayjs from 'dayjs';

type TimeLog = { hour?: string; endTime?: string; activity: string; activityType?: string };
type Session = {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds?: number;
  logs?: TimeLog[];
};

export default function CalendarPage() {
  const dispatch = useDispatch<AppDispatch>();
  const sessions = useSelector((state: RootState) => state.timeTracker.allSessions) as Session[];

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const sessionDates = sessions.map((s) => dayjs(s.start_time).format('YYYY-MM-DD'));

  const selectedSessions = selectedDate
    ? sessions.filter((s) => dayjs(s.start_time).format('YYYY-MM-DD') === selectedDate)
    : [];

  const totalDaysWithSessions = new Set(sessionDates).size;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2}>Календарь работы</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Нажмите на дату, чтобы посмотреть детали сессий
          </Text>
        </div>
        <Badge size="xl" variant="light" color="teal">
          Рабочих дней: {totalDaysWithSessions}
        </Badge>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Calendar
          size="xl"
          styles={{
            month: { fontSize: '1.5rem' },
            weekday: { fontSize: '1.2rem', fontWeight: 600 },
            day: {
              width: 64,
              height: 64,
              margin: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: 8,
              position: 'relative',
            },
          }}
          renderDay={(dayStr: string) => {
            const hasSession = sessionDates.includes(dayStr);
            const date = new Date(dayStr);
            const daySessionCount = sessions.filter(
              (s) => dayjs(s.start_time).format('YYYY-MM-DD') === dayStr
            ).length;

            return (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: 8,
                  backgroundColor: hasSession ? 'rgba(0,128,128,0.2)' : 'transparent',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => {
                  setSelectedDate(dayStr);
                  setModalOpen(true);
                }}
                onMouseEnter={(e) => {
                  if (hasSession) {
                    e.currentTarget.style.backgroundColor = 'rgba(0,128,128,0.35)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasSession) {
                    e.currentTarget.style.backgroundColor = 'rgba(0,128,128,0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {date.getDate()}
                {hasSession && (
                  <>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'teal',
                      }}
                    />
                    {daySessionCount > 1 && (
                      <Badge
                        size="xs"
                        variant="filled"
                        color="teal"
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                        }}
                      >
                        {daySessionCount}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            );
          }}
        />
      </Card>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        size="xl"
        centered
        title={
          <Group>
            <IconClock size={24} />
            <Title order={3}>
              {selectedDate ? dayjs(selectedDate).format('DD MMMM YYYY') : 'Сессии'}
            </Title>
          </Group>
        }
        styles={{
          inner: {
            right: 0,
            left: 0,
            padding: '0 16px',
          },
        }}
      >
        {selectedSessions.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Нет данных за этот день.
          </Text>
        ) : (
          <Stack gap="md">
            {selectedSessions.map((s, sessionIdx) => {
              const durationMinutes = s.duration_seconds ? Math.floor(s.duration_seconds / 60) : 0;
              const hours = Math.floor(durationMinutes / 60);
              const minutes = durationMinutes % 60;
              const durationText = hours > 0 ? `${hours} ч ${minutes} мин` : `${minutes} мин`;

              return (
                <Card key={s.id} shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <Group gap="xs">
                      <IconClock size={18} />
                      <Text fw={600} size="lg">
                        {dayjs(s.start_time).format('HH:mm')} – {s.end_time ? dayjs(s.end_time).format('HH:mm') : 'не завершено'}
                      </Text>
                    </Group>
                    <Badge size="lg" variant="light" color="teal">
                      {durationText}
                    </Badge>
                  </Group>

                  {s.logs && s.logs.length > 0 && (
                    <>
                      <Divider my="sm" label="Активности" labelPosition="center" />
                      <Timeline active={s.logs.length} bulletSize={24} lineWidth={2}>
                        {s.logs.map((log, idx) => (
                          <Timeline.Item
                            key={idx}
                            bullet={<IconActivity size={12} />}
                            title={
                              <Group gap="xs">
                                <Text size="sm" c="dimmed">
                                  {log.hour ? dayjs(log.hour).format('HH:mm') : ''}
                                  {log.endTime ? ` – ${dayjs(log.endTime).format('HH:mm')}` : ''}
                                </Text>
                                {log.activityType && (
                                  <Badge size="xs" variant="dot">
                                    {log.activityType}
                                  </Badge>
                                )}
                              </Group>
                            }
                          >
                            <Text size="sm" mt={4} style={{ whiteSpace: 'pre-wrap' }}>
                              {log.activity}
                            </Text>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </>
                  )}

                  {sessionIdx < selectedSessions.length - 1 && <Divider my="md" />}
                </Card>
              );
            })}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
