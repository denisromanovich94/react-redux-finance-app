import { supabase } from '../../shared/api/supabase';
import type { TimeSession, TrackerProject } from './types';

export const timeTrackerApi = {
  // ============ SESSIONS CRUD ============

  async fetchSessions(userId: string): Promise<TimeSession[]> {
    const { data, error } = await supabase
      .from('time_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return (data || []) as TimeSession[];
  },

  async createSession(userId: string, session: Partial<TimeSession>): Promise<TimeSession> {
    const now = new Date().toISOString();
    const newSession = {
      user_id: userId,
      ...session,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('time_sessions')
      .insert(newSession)
      .select()
      .single();

    if (error) throw error;
    return data as TimeSession;
  },

  async updateSession(id: string, updates: Partial<TimeSession>): Promise<TimeSession> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('time_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TimeSession;
  },

  async deleteSession(id: string): Promise<void> {
    const { error } = await supabase
      .from('time_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ============ PROJECTS CRUD ============

  async fetchProjects(userId: string): Promise<TrackerProject[]> {
    const { data, error } = await supabase
      .from('tracker_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as TrackerProject[];
  },

  async createProject(
    userId: string,
    data: {
      name: string;
      color: string;
      description?: string;
      client_id?: string | null;
      category_id?: string | null;
    }
  ): Promise<TrackerProject> {
    const now = new Date().toISOString();
    const newProject = {
      user_id: userId,
      ...data,
      description: data.description || '',
      created_at: now,
      updated_at: now,
    };

    const { data: result, error } = await supabase
      .from('tracker_projects')
      .insert(newProject)
      .select()
      .single();

    if (error) throw error;
    return result as TrackerProject;
  },

  async updateProject(id: string, updates: Partial<TrackerProject>): Promise<TrackerProject> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('tracker_projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TrackerProject;
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('tracker_projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
