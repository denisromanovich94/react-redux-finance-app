import dayjs from 'dayjs';
import { createSelector } from '@reduxjs/toolkit';
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

export const selectCurrentActivity = (state: RootState) => state.timeTracker.currentActivity;

export const selectCurrentActivityType = (state: RootState) => state.timeTracker.currentActivityType;

export const selectCurrentProjectId = (state: RootState) => state.timeTracker.currentProjectId;

export const selectCurrentClientId = (state: RootState) => state.timeTracker.currentClientId;

export const selectCurrentTags = (state: RootState) => state.timeTracker.currentTags;

export const selectProjects = (state: RootState) => state.timeTracker.projects;

export const selectStats = (state: RootState) => state.timeTracker.stats;

export const selectIsRunning = (state: RootState) => state.timeTracker.status === 'running';

export const selectIsPaused = (state: RootState) => state.timeTracker.status === 'paused';

export const selectCanPause = (state: RootState) => state.timeTracker.status === 'running';

export const selectCanResume = (state: RootState) => state.timeTracker.status === 'paused';

export const selectTodaySessions = createSelector(
  [(state: RootState) => state.timeTracker.allSessions],
  (allSessions) => {
    const today = dayjs().format('YYYY-MM-DD');
    return allSessions.filter((session) =>
      dayjs(session.start_time).format('YYYY-MM-DD') === today
    );
  }
);

export const selectTodayLogs = createSelector(
  [selectTodaySessions],
  (todaySessions) => todaySessions.flatMap((s) => s.logs ?? [])
);