import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { selectElapsedSeconds } from './selectors';
import type { TimeSession, HourLog, Interval, TrackerProject } from './types';
import { getUserId } from '../../shared/api/auth';
import { timeTrackerApi } from './timeTrackerApi';


export const saveSession = createAsyncThunk<
  TimeSession,
  void,
  { state: RootState; rejectValue: string }
>(
  'timeTracker/saveSession',
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const tracker = state.timeTracker;

    if (!tracker.startTime) return rejectWithValue('No session to save');

    const duration = selectElapsedSeconds(state);
    const userId = await getUserId();
    if (!userId) return rejectWithValue('Not authenticated');

    const logs: HourLog[] = tracker.logs.map((l) => ({
      hour: l.hour,
      endTime: l.endTime,
      activity: l.activity,
      activityType: l.activityType,
    }));

    const payload: Partial<TimeSession> = {
      start_time: tracker.startTime,
      end_time: tracker.endTime,
      duration_seconds: duration,
      intervals: tracker.intervals as Interval[],
      logs,
      project_id: tracker.currentProjectId,
      client_id: tracker.currentClientId,
      tags: tracker.currentTags,
    };

    try {
      return await timeTrackerApi.createSession(userId, payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save session');
    }
  }
);

export const fetchSessions = createAsyncThunk<
  TimeSession[],
  void,
  { rejectValue: string }
>(
  'timeTracker/fetchSessions',
  async (_, { rejectWithValue }) => {
    const userId = await getUserId();
    if (!userId) return rejectWithValue('Not authenticated');

    try {
      return await timeTrackerApi.fetchSessions(userId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sessions');
    }
  }
);

export const updateSessionThunk = createAsyncThunk<
  TimeSession,
  { id: string; updates: Partial<TimeSession> },
  { rejectValue: string }
>(
  'timeTracker/updateSession',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      return await timeTrackerApi.updateSession(id, updates);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update session');
    }
  }
);

export const deleteSessionThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'timeTracker/deleteSession',
  async (id, { rejectWithValue }) => {
    try {
      await timeTrackerApi.deleteSession(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete session');
    }
  }
);

export const fetchProjects = createAsyncThunk<
  TrackerProject[],
  void,
  { rejectValue: string }
>(
  'timeTracker/fetchProjects',
  async (_, { rejectWithValue }) => {
    const userId = await getUserId();
    if (!userId) return rejectWithValue('Not authenticated');

    try {
      return await timeTrackerApi.fetchProjects(userId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch projects');
    }
  }
);

export const createProjectThunk = createAsyncThunk<
  TrackerProject,
  {
    name: string;
    color: string;
    description?: string;
    client_id?: string | null;
    category_id?: string | null;
  },
  { rejectValue: string }
>(
  'timeTracker/createProject',
  async (projectData, { rejectWithValue }) => {
    const userId = await getUserId();
    if (!userId) return rejectWithValue('Not authenticated');

    try {
      return await timeTrackerApi.createProject(userId, projectData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create project');
    }
  }
);

export const updateProjectThunk = createAsyncThunk<
  TrackerProject,
  { id: string; updates: Partial<TrackerProject> },
  { rejectValue: string }
>(
  'timeTracker/updateProject',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      return await timeTrackerApi.updateProject(id, updates);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update project');
    }
  }
);

export const deleteProjectThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'timeTracker/deleteProject',
  async (id, { rejectWithValue }) => {
    try {
      await timeTrackerApi.deleteProject(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete project');
    }
  }
);
