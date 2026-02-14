import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getNotificationSettings, updateNotificationSettings } from "../api/applications";
import type { ResultNotificationSettings } from "../api/applications";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const nav = useNavigate();
  const [settings, setSettings] = useState<ResultNotificationSettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ResultNotificationSettings>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ 설정 불러오기
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await getNotificationSettings();
      setSettings(data);
      setEditForm(data);
    } catch (err) {
      console.error("설정 불러오기 실패:", err);
      // 에러가 나도 페이지는 정상 표시되도록 함
      setSettings(null);
    }
  }

  async function handleSave() {
    if (!editForm) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updateNotificationSettings(editForm);
      setSettings(updated);
      setEditForm(updated);
      setIsEditing(false);
      alert("설정이 저장되었습니다.");
    } catch (err) {
      console.error("설정 저장 실패:", err);
      setError("설정 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setEditForm(settings || {});
    setIsEditing(false);
    setError(null);
  }

  function handleChange(field: keyof ResultNotificationSettings, value: string) {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div className="adminDash-root">
      <div className="adminDash-inner">
        <div className="adminDash-title">관리자 페이지</div>
        <div className="adminDash-sub">지원서 관리와 교육 세션 관리를 진행할 수 있습니다.</div>

        <div className="adminDash-grid">
          <button
            className="adminDash-card"
            type="button"
            onClick={() => nav("/admin/applicants")}
          >
            <div className="card-title">지원서 리스트</div>
            <div className="card-desc">지원자 목록 확인 / 서류·면접 평가</div>
          </button>

          <button
            className="adminDash-card"
            type="button"
            onClick={() => nav("/admin/sessions")}
          >
            <div className="card-title">교육 세션 관리</div>
            <div className="card-desc">세션 등록 / 수정 / 삭제 / 공개 여부 관리</div>
          </button>

          <button
            className="adminDash-card"
            type="button"
            onClick={() => nav("/admin/projects")}
          >
            <div className="card-title">프로젝트 관리</div>
            <div className="card-desc">프로젝트 등록 / 썸네일·PDF 업로드 / 공개 여부 관리</div>
          </button>

          <button
            className="adminDash-card"
            type="button"
            onClick={() => nav("/admin/roadmap")}
          >
            <div className="card-title">로드맵 관리</div>
            <div className="card-desc">메인 페이지 ANNUAL ROADMAP 항목 추가 / 수정 / 삭제</div>
          </button>
        </div>

        {/* ✅ 합격 알림 설정 */}
        <div className="notification-settings-section">
          <div className="settings-header">
            <h2>합격 알림 설정</h2>
            {!isEditing && settings && (
              <button
                className="edit-btn"
                type="button"
                onClick={() => setIsEditing(true)}
              >
                수정
              </button>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          
          {!settings && !error && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              설정을 불러오는 중... (백엔드 서버와 마이그레이션을 먼저 실행해주세요)
            </div>
          )}

          {settings && (
            <div className="settings-form">
              <div className="form-group">
                <label>면접 장소</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.interview_location || ""}
                    onChange={(e) => handleChange("interview_location", e.target.value)}
                  />
                ) : (
                  <div className="value">{settings.interview_location}</div>
                )}
              </div>

              <div className="form-group">
                <label>면접 일자</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.interview_date || ""}
                    onChange={(e) => handleChange("interview_date", e.target.value)}
                    placeholder="예: 2026년 03월 05일"
                  />
                ) : (
                  <div className="value">{settings.interview_date}</div>
                )}
              </div>

              <div className="form-group">
                <label>입실 시간</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.interview_deadline || ""}
                    onChange={(e) => handleChange("interview_deadline", e.target.value)}
                    placeholder="예: 18:00 까지"
                  />
                ) : (
                  <div className="value">{settings.interview_deadline}</div>
                )}
              </div>

              <div className="form-group">
                <label>OT 일시</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.ot_datetime || ""}
                    onChange={(e) => handleChange("ot_datetime", e.target.value)}
                    placeholder="예: 2026년 03월 09일 18:00"
                  />
                ) : (
                  <div className="value">{settings.ot_datetime}</div>
                )}
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button
                    className="save-btn"
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? "저장 중..." : "저장"}
                  </button>
                  <button
                    className="cancel-btn"
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    취소
                  </button>
                </div>
              )}

              <div className="last-updated">
                마지막 수정: {new Date(settings.updated_at).toLocaleString("ko-KR")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}