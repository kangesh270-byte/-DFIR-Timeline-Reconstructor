import api from './axios';
import { Scenario, EvaluationResult, LeaderboardEntry, UserStats, UserPlacement, RelationshipLink } from '../types';

function readStoredProfile(): Partial<UserStats> | null {
  try {
    const raw = localStorage.getItem('dfir-auth-profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredProfile(profile: Partial<UserStats>) {
  localStorage.setItem('dfir-auth-profile', JSON.stringify(profile));
}

export async function fetchScenarios(): Promise<Scenario[]> {
  const { data } = await api.get<Scenario[]>('/scenarios');
  return data;
}

export async function fetchScenarioById(id: string): Promise<Scenario> {
  const { data } = await api.get<Scenario>(`/scenarios/${id}`);
  return data;
}

export async function submitTimelineEvaluation(
  scenarioId: string,
  userPlacements: UserPlacement[],
  relationships: RelationshipLink[],
  timeTakenSeconds: number
): Promise<{ reportId: string; evaluation: EvaluationResult }> {
  const { data } = await api.post('/reports/timeline/evaluate', {
    scenarioId,
    userPlacements,
    relationships,
    timeTakenSeconds,
  });
  return data;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await api.get<LeaderboardEntry[]>('/leaderboard');
  return data;
}

export async function fetchUserProfile(): Promise<UserStats> {
  try {
    const { data } = await api.get('/users/profile');
    const storedProfile = readStoredProfile();
    const profile: UserStats = {
      username: data.username ?? storedProfile?.username ?? 'Alex_Vance_DFIR',
      title: data.title ?? storedProfile?.title ?? 'Lead Incident Responder',
      xp: data.xp ?? storedProfile?.xp ?? 1850,
      level: data.level ?? storedProfile?.level ?? 4,
      labsCompleted: data.labsCompleted ?? data.labs_completed ?? storedProfile?.labsCompleted ?? 3,
      averageAccuracy: data.averageAccuracy ?? data.average_accuracy ?? storedProfile?.averageAccuracy ?? 88,
      totalTimeSpentMinutes: data.totalTimeSpentMinutes ?? data.total_time_spent_minutes ?? storedProfile?.totalTimeSpentMinutes ?? 74,
      badges: data.badges ?? storedProfile?.badges ?? [],
      recentSessions: data.recentSessions ?? storedProfile?.recentSessions ?? [],
    };
    writeStoredProfile(profile);
    return profile;
  } catch {
    const storedProfile = readStoredProfile();
    return {
      username: storedProfile?.username ?? 'Alex_Vance_DFIR',
      title: storedProfile?.title ?? 'Lead Incident Responder',
      xp: storedProfile?.xp ?? 1850,
      level: storedProfile?.level ?? 4,
      labsCompleted: storedProfile?.labsCompleted ?? 3,
      averageAccuracy: storedProfile?.averageAccuracy ?? 88,
      totalTimeSpentMinutes: storedProfile?.totalTimeSpentMinutes ?? 74,
      badges: storedProfile?.badges ?? [],
      recentSessions: storedProfile?.recentSessions ?? [],
    };
  }
}

export async function loginUser(email: string, password: string) {
  // TODO: Restore real backend login API once demo mode is disabled.
  const accessToken = `demo-${window.btoa(`${email}:${Date.now()}`)}`;
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', accessToken);
  return { access_token: accessToken, refresh_token: accessToken };
}

export async function registerUser(email: string, password: string, username: string, full_name?: string, title?: string) {
  // TODO: Restore real backend registration API once demo mode is disabled.
  const accessToken = `demo-${window.btoa(`${email}:${Date.now()}`)}`;
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', accessToken);

  const profile = {
    username: username || email.split('@')[0],
    title: title || full_name || 'Lead Incident Responder',
  };
  writeStoredProfile(profile as Partial<UserStats>);

  return { access_token: accessToken, refresh_token: accessToken };
}
