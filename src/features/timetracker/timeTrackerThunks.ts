import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../shared/api/supabase';
import type { RootState } from '../../app/store';
import { selectElapsedSeconds } from './selectors';
import type { TimeSession, HourLog, Interval } from './types';
import { getUserId } from '../../shared/api/auth';


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
      user_id: userId,
      start_time: tracker.startTime,
      end_time: tracker.endTime,
      duration_seconds: duration,
      intervals: tracker.intervals as Interval[],
      logs,
    };

    const { data, error } = await supabase
      .from('time_sessions')
      .insert(payload)
      .select()
      .single();

    if (error) return rejectWithValue(error.message);

    return data as TimeSession;
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

    const { data, error } = await supabase
      .from('time_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) return rejectWithValue(error.message);

    return (data ?? []) as TimeSession[];
  }
);
