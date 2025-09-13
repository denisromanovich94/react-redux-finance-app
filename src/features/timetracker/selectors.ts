import dayjs from 'dayjs';
import type { RootState } from '../../app/store';

export const selectElapsedSeconds = (state: RootState) => {
  const tracker = state.timeTracker;
  if (!tracker || !tracker.startTime) return 0;

  const intervals = tracker.intervals || [];
  let total = 0;
  for (const iv of intervals) {
    if (iv.end) {
      total += dayjs(iv.end).diff(dayjs(iv.start), 'second');
    } else {
      total += dayjs().diff(dayjs(iv.start), 'second');
    }
  }

  return total;
};