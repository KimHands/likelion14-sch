import { apiFetch } from "./client";

// ✅ 합격 알림 설정 타입
export interface ResultNotificationSettings {
  interview_location: string;
  interview_date: string;
  interview_deadline: string;
  ot_datetime: string;
  doc_result_open: boolean;
  final_result_open: boolean;
  updated_at: string;
}

interface GetSettingsResponse {
  ok: boolean;
  settings: ResultNotificationSettings;
}

interface UpdateSettingsResponse {
  ok: boolean;
  settings: ResultNotificationSettings;
}

// ✅ 합격 알림 설정 조회
export async function getNotificationSettings(): Promise<ResultNotificationSettings> {
  const data = await apiFetch<GetSettingsResponse>("/api/applications/admin/notification-settings");
  return data.settings;
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
