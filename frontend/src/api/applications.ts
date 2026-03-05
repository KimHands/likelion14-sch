import { apiFetch } from "./client";

// ✅ 합격 알림 설정 타입
export interface ResultNotificationSettings {
  interview_location: string;
  interview_date: string;
  interview_deadline: string;
  ot_datetime: string;
  doc_result_open: boolean;
  final_result_open: boolean;
  track_planning_design_open: boolean;
  track_frontend_open: boolean;
  track_backend_open: boolean;
  track_ai_server_open: boolean;
  updated_at: string;
}

// ✅ 트랙별 지원 활성화 상태 타입
export interface TrackSettings {
  PLANNING_DESIGN: boolean;
  FRONTEND: boolean;
  BACKEND: boolean;
  AI_SERVER: boolean;
}

interface GetSettingsResponse {
  ok: boolean;
  settings: ResultNotificationSettings;
}

interface UpdateSettingsResponse {
  ok: boolean;
  settings: ResultNotificationSettings;
}

interface TrackSettingsResponse {
  ok: boolean;
  tracks: TrackSettings;
}

// ✅ 합격 알림 설정 조회
export async function getNotificationSettings(): Promise<ResultNotificationSettings> {
  const data = await apiFetch<GetSettingsResponse>("/api/applications/admin/notification-settings");
  return data.settings;
}

// ✅ 트랙별 지원 활성화 상태 조회 (공개, 인증 불필요)
export async function getTrackSettings(): Promise<TrackSettings> {
  const data = await apiFetch<TrackSettingsResponse>("/api/applications/track-settings");
  return data.tracks;
}

// ✅ 합격 알림 설정 업데이트
export async function updateNotificationSettings(
  settings: Partial<ResultNotificationSettings>
): Promise<ResultNotificationSettings> {
  const data = await apiFetch<UpdateSettingsResponse>("/api/applications/admin/notification-settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  return data.settings;
}
