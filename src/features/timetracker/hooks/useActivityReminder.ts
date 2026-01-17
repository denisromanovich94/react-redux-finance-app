import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { notifications } from '@mantine/notifications';
import {
  selectIsRunning,
  selectCurrentActivity,
} from '../selectors';

const REMINDER_DELAY_MS = 5 * 60 * 1000; // 5 minutes

export function useActivityReminder() {
  const isRunning = useSelector(selectIsRunning);
  const currentActivity = useSelector(selectCurrentActivity);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Only set reminder if tracker is running AND activity is empty
    if (isRunning && !currentActivity.trim()) {
      timerRef.current = setTimeout(() => {
        notifications.show({
          title: 'Напоминание',
          message: 'Заполните описание активности!',
          color: 'yellow',
          autoClose: 10000,
        });
      }, REMINDER_DELAY_MS);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, currentActivity]);
}
