export interface Interval {
  start: string;
  end: string | null;
}

export type ActivityType = 'работал' | 'общался с клиентами' | 'писал отклики';

export interface HourLog {
  hour: string;
  endTime?: string;
  activity: string;
  activityType: ActivityType;
}


export interface TimeTrackerState {
  status: 'idle' | 'running' | 'paused' | 'stopped';
  startTime: string | null;
  endTime: string | null;
  intervals: Interval[];
  logs: HourLog[];
  currentActivity: string;
  currentActivityType: ActivityType;
  currentProjectId: string | null;
  currentClientId: string | null;
  currentTags: string[];
}

export interface TimeSession {
  id?: string;
  user_id?: string;
  start_time: string;
  end_time?: string | null;
  duration_seconds?: number;
  intervals?: Interval[];
  logs?: HourLog[];
  project_id?: string | null;
  client_id?: string | null;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface TrackerProject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  description?: string;
  client_id?: string | null;
  category_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeTrackerStats {
  totalTimeToday: number;
  totalTimeThisWeek: number;
  totalTimeThisMonth: number;
  breakdownByActivityType: {
    [key in ActivityType]: number;
  };
  breakdownByProject: {
    projectId: string;
    projectName: string;
    totalSeconds: number;
  }[];
  sessionsCount: number;
  averageSessionDuration: number;
}
