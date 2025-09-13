export interface Interval {
  start: string;
  end: string | null;
}

export interface HourLog {
  hour: string;
  endTime?: string;
  activity: string;
  activityType: 'работал' | 'общался с клиентами' | 'писал отклики';
}


export interface TimeTrackerState {
  status: 'idle' | 'running' | 'paused' | 'stopped';
  startTime: string | null;
  endTime: string | null;
  intervals: Interval[];
  logs: HourLog[];
}

export interface TimeSession {
  id?: string;
  user_id?: string;
  start_time: string;
  end_time?: string | null;
  duration_seconds?: number;
  intervals?: Interval[];
  logs?: HourLog[];
  created_at?: string;
}
