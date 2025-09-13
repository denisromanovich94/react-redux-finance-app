import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TimeTrackerState, Interval, HourLog, TimeSession } from './types';
import type { RootState } from '../../app/store';
import { saveSession, fetchSessions } from './timeTrackerThunks';

interface TimeTrackerSliceState extends TimeTrackerState {
  saving: boolean;
  saveError: string | null;
  lastSavedSession: TimeSession | null;
  allSessions: TimeSession[];
}

const initialState: TimeTrackerSliceState = {
  status: 'idle',
  startTime: null,
  endTime: null,
  intervals: [],
  logs: [],
  saving: false,
  saveError: null,
  lastSavedSession: null,
  allSessions: [],
};

const timeTrackerSlice = createSlice({
  name: 'timeTracker',
  initialState,
  reducers: {
    startSession(state) {
      if (state.status === 'idle' || state.status === 'stopped') {
        const now = new Date().toISOString();
        state.status = 'running';
        state.startTime = now;
        state.endTime = null;
        state.intervals = [{ start: now, end: null }];
        state.logs = [];
      }
    },
    stopSession(state) {
      if (state.status === 'running' || state.status === 'paused') {
        state.status = 'stopped';
        const now = new Date().toISOString();
        state.endTime = now;
        const last = state.intervals[state.intervals.length - 1];
        if (last && !last.end) last.end = now;
      }
    },
    setLog(state, action: PayloadAction<HourLog>) {
      state.logs.push(action.payload);
    },
    restoreSession(state, action: PayloadAction<Partial<TimeTrackerState>>) {
      const payload = action.payload;
      if (!payload) return;
      if (payload.status) state.status = payload.status;
      if (payload.startTime !== undefined) state.startTime = payload.startTime ?? null;
      if (payload.endTime !== undefined) state.endTime = payload.endTime ?? null;
      if (payload.intervals !== undefined) state.intervals = payload.intervals as Interval[];
      if (payload.logs !== undefined) state.logs = payload.logs as HourLog[];
    },
    resetSession(state) {
      state.status = 'idle';
      state.startTime = null;
      state.endTime = null;
      state.intervals = [];
      state.logs = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveSession.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(saveSession.fulfilled, (state, action: PayloadAction<TimeSession>) => {
        state.saving = false;
        state.saveError = null;
        state.lastSavedSession = action.payload;
        state.allSessions.unshift(action.payload);
      })
      .addCase(saveSession.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload ?? (action.error?.message ?? 'Unknown error');
      })
      .addCase(fetchSessions.fulfilled, (state, action: PayloadAction<TimeSession[]>) => {
        state.allSessions = action.payload;
      });
  },
});

export const { startSession, stopSession, setLog, restoreSession, resetSession } = timeTrackerSlice.actions;
export const selectAllSessions = (state: RootState) => state.timeTracker.allSessions;
export default timeTrackerSlice.reducer;
