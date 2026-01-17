import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TimeTrackerState, Interval, HourLog, TimeSession, TrackerProject, TimeTrackerStats, ActivityType } from './types';
import type { RootState } from '../../app/store';
import {
  saveSession,
  fetchSessions,
  updateSessionThunk,
  deleteSessionThunk,
  fetchProjects,
  createProjectThunk,
  updateProjectThunk,
  deleteProjectThunk,
} from './timeTrackerThunks';

interface TimeTrackerSliceState extends TimeTrackerState {
  saving: boolean;
  saveError: string | null;
  lastSavedSession: TimeSession | null;
  allSessions: TimeSession[];
  projects: TrackerProject[];
  stats: TimeTrackerStats | null;
  loadingProjects: boolean;
  loadingStats: boolean;
}

const initialState: TimeTrackerSliceState = {
  status: 'idle',
  startTime: null,
  endTime: null,
  intervals: [],
  logs: [],
  currentActivity: '',
  currentActivityType: 'работал',
  currentProjectId: null,
  currentClientId: null,
  currentTags: [],
  saving: false,
  saveError: null,
  lastSavedSession: null,
  allSessions: [],
  projects: [],
  stats: null,
  loadingProjects: false,
  loadingStats: false,
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
      state.currentActivity = '';
      state.currentActivityType = 'работал';
      state.currentProjectId = null;
      state.currentTags = [];
    },
    pauseSession(state) {
      if (state.status === 'running') {
        state.status = 'paused';
        const now = new Date().toISOString();
        const last = state.intervals[state.intervals.length - 1];
        if (last && !last.end) {
          last.end = now;
        }
      }
    },
    resumeSession(state) {
      if (state.status === 'paused') {
        state.status = 'running';
        const now = new Date().toISOString();
        state.intervals.push({ start: now, end: null });
      }
    },
    setCurrentActivity(state, action: PayloadAction<string>) {
      state.currentActivity = action.payload;
    },
    setCurrentActivityType(state, action: PayloadAction<ActivityType>) {
      state.currentActivityType = action.payload;
    },
    setCurrentProject(state, action: PayloadAction<string | null>) {
      state.currentProjectId = action.payload;
    },
    setCurrentClient(state, action: PayloadAction<string | null>) {
      state.currentClientId = action.payload;
    },
    setCurrentTags(state, action: PayloadAction<string[]>) {
      state.currentTags = action.payload;
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
      })
      .addCase(updateSessionThunk.fulfilled, (state, action: PayloadAction<TimeSession>) => {
        const index = state.allSessions.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.allSessions[index] = action.payload;
        }
      })
      .addCase(deleteSessionThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.allSessions = state.allSessions.filter((s) => s.id !== action.payload);
      })
      .addCase(fetchProjects.pending, (state) => {
        state.loadingProjects = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<TrackerProject[]>) => {
        state.loadingProjects = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state) => {
        state.loadingProjects = false;
      })
      .addCase(createProjectThunk.fulfilled, (state, action: PayloadAction<TrackerProject>) => {
        state.projects.unshift(action.payload);
      })
      .addCase(updateProjectThunk.fulfilled, (state, action: PayloadAction<TrackerProject>) => {
        const index = state.projects.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
      })
      .addCase(deleteProjectThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.projects = state.projects.filter((p) => p.id !== action.payload);
      });
  },
});

export const {
  startSession,
  stopSession,
  setLog,
  restoreSession,
  resetSession,
  pauseSession,
  resumeSession,
  setCurrentActivity,
  setCurrentActivityType,
  setCurrentProject,
  setCurrentClient,
  setCurrentTags,
} = timeTrackerSlice.actions;
export const selectAllSessions = (state: RootState) => state.timeTracker.allSessions;
export default timeTrackerSlice.reducer;
