import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { fetchSessions } from '../features/timetracker/timeTrackerThunks';
import { Calendar } from '@mantine/dates';
import { Modal, Text, Title, Stack, Badge } from '@mantine/core';
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

  return (
    <>
      <div style={{ width: '100%' }}>
  <Calendar
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
          }}
          onClick={() => {
            setSelectedDate(dayStr);
            setModalOpen(true);
          }}
        >
          {date.getDate()}
          {hasSession && (
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
          )}
        </div>
      );
    }}
  />
</div>


      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        size="lg"
        styles={{ inner: { right: 0, left: 0 } }} 
        centered
        title={selectedDate ? `Сессии: ${dayjs(selectedDate).format('DD.MM.YYYY')}` : 'Сессии'}
      >
        {selectedSessions.length === 0 ? (
          <Text c="dimmed">Нет данных за этот день.</Text>
        ) : (
          <Stack gap="sm">
            {selectedSessions.map((s) => (
              <div key={s.id} style={{ borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 8 }}>
                <Title order={5}>
                  {dayjs(s.start_time).format('HH:mm')} – {s.end_time ? dayjs(s.end_time).format('HH:mm') : 'не завершено'}
                </Title>
                <Badge>
                  Длительность: {s.duration_seconds ? Math.floor(s.duration_seconds / 60) : 0} мин
                </Badge>
                {s.logs && s.logs.length > 0 && (
                  <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                    {s.logs.map((log, idx) => (
                      <li key={idx}>
                        {log.hour ? `${dayjs(log.hour).format('HH:mm')} – ` : ''}
                        {log.endTime ? `${dayjs(log.endTime).format('HH:mm')} ` : ''}
                        {log.activity}
                        {log.activityType ? ` (${log.activityType})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Stack>
        )}
      </Modal>
    </>
  );
}
