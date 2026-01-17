import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { fetchSessions, fetchProjects } from '../features/timetracker/timeTrackerThunks';
import { loadClients } from '../features/clients/clientsSlice';
import { Calendar } from '@mantine/dates';
import { Modal, Text, Title, Stack, Badge, Divider, Card, Timeline, Group } from '@mantine/core';
import { IconClock, IconActivity, IconBriefcase, IconUser } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import dayjs from 'dayjs';

export default function CalendarPage() {
  const dispatch = useDispatch<AppDispatch>();
  const sessions = useSelector((state: RootState) => state.timeTracker.allSessions);
  const projects = useSelector((state: RootState) => state.timeTracker.projects);
  const clients = useSelector((state: RootState) => state.clients.items);
  const isSmall = useMediaQuery('(max-width: 48em)');

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSessions());
    dispatch(fetchProjects());
    dispatch(loadClients());
  }, [dispatch]);

  const sessionDates = sessions.map((s) => dayjs(s.start_time).format('YYYY-MM-DD'));

  const selectedSessions = selectedDate
    ? sessions.filter((s) => dayjs(s.start_time).format('YYYY-MM-DD') === selectedDate)
    : [];

  return (
    <Stack gap="lg">
      <div>
        <Title order={isSmall ? 3 : 2}>Календарь работы</Title>
        <Text c="dimmed" size="sm" mt={4}>
          Нажмите на дату, чтобы посмотреть детали сессий
        </Text>
      </div>

      <Card shadow="sm" padding={isSmall ? 'sm' : 'lg'} radius="md" withBorder>
        <Calendar
          size={isSmall ? 'md' : 'xl'}
          styles={{
            month: { fontSize: isSmall ? '1rem' : '1.5rem' },
            weekday: { fontSize: isSmall ? '0.8rem' : '1.2rem', fontWeight: 600 },
            day: {
              width: isSmall ? 40 : 64,
              height: isSmall ? 40 : 64,
              margin: isSmall ? 1 : 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: 8,
              position: 'relative',
              fontSize: isSmall ? '0.85rem' : '1rem',
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
                        bottom: isSmall ? 2 : 4,
                        width: isSmall ? 6 : 8,
                        height: isSmall ? 6 : 8,
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
                          top: isSmall ? 0 : 2,
                          right: isSmall ? 0 : 2,
                          fontSize: isSmall ? '0.6rem' : '0.7rem',
                          padding: isSmall ? '2px 4px' : undefined,
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
        fullScreen={isSmall}
        title={
          <Group>
            <IconClock size={isSmall ? 20 : 24} />
            <Title order={isSmall ? 4 : 3}>
              {selectedDate ? dayjs(selectedDate).format('DD MMMM YYYY') : 'Сессии'}
            </Title>
          </Group>
        }
        styles={{
          inner: {
            right: 0,
            left: 0,
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

              const project = projects.find(p => p.id === s.project_id);
              const client = clients.find(c => c.id === s.client_id);

              return (
                <Card key={s.id} shadow="sm" padding={isSmall ? 'sm' : 'lg'} radius="md" withBorder>
                  <Group justify="space-between" mb="md" wrap="wrap">
                    <Group gap="xs">
                      <IconClock size={isSmall ? 16 : 18} />
                      <Text fw={600} size={isSmall ? 'md' : 'lg'}>
                        {dayjs(s.start_time).format('HH:mm')} – {s.end_time ? dayjs(s.end_time).format('HH:mm') : 'не завершено'}
                      </Text>
                    </Group>
                    <Badge size={isSmall ? 'md' : 'lg'} variant="light" color="teal">
                      {durationText}
                    </Badge>
                  </Group>

                  {(project || client) && (
                    <Group gap="xs" mb="sm">
                      {project && (
                        <Badge
                          size={isSmall ? 'sm' : 'md'}
                          variant="light"
                          leftSection={
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: project.color,
                              }}
                            />
                          }
                        >
                          <Group gap={4}>
                            <IconBriefcase size={12} />
                            {project.name}
                          </Group>
                        </Badge>
                      )}
                      {client && (
                        <Badge size={isSmall ? 'sm' : 'md'} variant="light" color="blue">
                          <Group gap={4}>
                            <IconUser size={12} />
                            {client.name}
                          </Group>
                        </Badge>
                      )}
                    </Group>
                  )}

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
