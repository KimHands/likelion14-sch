import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import "./AdminInterviewScore.css";

type Track = "PLANNING_DESIGN" | "FRONTEND" | "BACKEND" | "AI_SERVER";
type Status = "DRAFT" | "SUBMITTED" | "ACCEPTED" | "REJECTED";

type AdminMe = { id: number; email: string; name: string; role: string };

type AdminUser = {
  id: number;
  email: string;
  name: string;
  student_id: string;
  department: string;
  phone: string;
  role: string;
  email_verified: boolean;
};

type AdminApplication = {
  id: number;
  status: Status;
  submitted_at: string | null;
  track: Track;
  one_liner: string;
  portfolio_url: string;
  motivation: string;
  experience: string;
  created_at: string;
  updated_at: string;
  user: AdminUser;
};

type Score = {
  id: number;
  kind: "DOC" | "INTERVIEW";
  score1: number;
  score2: number;
  score3: number;
  total: number;
  comment: string;
  reviewer: { id: number; name: string; email: string };
};

const TRACK_LABEL: Record<Track, string> = {
  PLANNING_DESIGN: "기획/디자인",
  FRONTEND: "프론트엔드",
  BACKEND: "백엔드",
  AI_SERVER: "AI",
};

function clampNum(v: string, min: number, max: number) {
  const n = Number(v);
  if (Number.isNaN(n)) return "";
  return String(Math.min(max, Math.max(min, n)));
}

export default function AdminInterviewScore() {
  const nav = useNavigate();
  const { appId } = useParams();

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [app, setApp] = useState<AdminApplication | null>(null);
  const [me, setMe] = useState<AdminMe | null>(null);

  const [s1, setS1] = useState("0");
  const [s2, setS2] = useState("0");
  const [s3, setS3] = useState("0");
  const [comment, setComment] = useState("");

  const total = useMemo(() => {
    const a = Number(s1) || 0;
    const b = Number(s2) || 0;
    const c = Number(s3) || 0;
    return a + b + c;
  }, [s1, s2, s3]);

  const fetchAll = async () => {
    if (!appId) return;
    setLoading(true);
    setMsg(null);

    try {
      const [meRes, appRes, scoreRes] = await Promise.all([
        apiFetch<{ ok: boolean } & AdminMe>("/api/auth/me"),
        apiFetch<{ ok: boolean; application: AdminApplication }>(`/api/applications/admin/${appId}`),
        apiFetch<{ ok: boolean; doc: Score[]; interview: Score[] }>(`/api/applications/admin/${appId}/scores`),
      ]);

      if ((meRes as any)?.ok !== false) {
        setMe({
          id: (meRes as any).id,
          email: (meRes as any).email,
          name: (meRes as any).name,
          role: (meRes as any).role,
        });
      }

      if (!appRes.ok) {
        setMsg("지원서 상세를 불러오지 못했습니다.");
        setApp(null);
        return;
      }
      setApp(appRes.application);

      const myId = (meRes as any)?.id;
      if (scoreRes.ok && myId) {
        const mine = (scoreRes.interview || []).find((x) => x.reviewer?.id === myId);
        if (mine) {
          setS1(String(mine.score1 ?? 0));
          setS2(String(mine.score2 ?? 0));
          setS3(String(mine.score3 ?? 0));
          setComment(String(mine.comment ?? ""));
        }
      }
    } catch {
      setMsg("데이터를 불러오지 못했습니다.");
      setApp(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  const saveScoreToDB = async () => {
    if (!appId) return;
    setMsg(null);
    try {
      const res = await apiFetch<any>(`/api/applications/admin/${appId}/scores`, {
        method: "POST",
        body: JSON.stringify({
          kind: "INTERVIEW",
          score1: Number(s1) || 0,
          score2: Number(s2) || 0,
          score3: Number(s3) || 0,
          comment: comment ?? "",
        }),
      });

      if (res?.ok === false) {
        setMsg(`채점 저장 실패: ${JSON.stringify(res?.errors ?? res)}`);
        return;
      }
      setMsg("채점 저장 완료 (DB)");
    } catch {
      setMsg("채점 저장 실패");
    }
  };

  const setDecision = async (status: "ACCEPTED" | "REJECTED") => {
    if (!appId) return;
    setMsg(null);

    try {
      const res = await apiFetch<any>(`/api/applications/admin/${appId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      if (res?.ok === false) {
        setMsg(`결과 반영 실패: ${JSON.stringify(res)}`);
        return;
      }

      setMsg(status === "ACCEPTED" ? "합격 처리 완료" : "불합격 처리 완료");
      setApp((prev) => (prev ? { ...prev, status } : prev));
    } catch {
      setMsg("결과 반영 실패");
    }
  };

  const topBarLeft = me?.name || "admin";

  if (loading) return <div className="iv-page">Loading...</div>;
  if (!app) return <div className="iv-page">지원서가 없습니다. {msg ? `(${msg})` : ""}</div>;

  const u = app.user;

  return (
    <div className="iv-page">
      <h1 className="iv-title">면접 채점 페이지</h1>

      <div className="iv-card">
        <div className="iv-topbar">
          <div className="iv-top-left">{topBarLeft}</div>
          <button className="iv-back-btn" onClick={() => nav("/admin/applicants")}>
            지원자 리스트로 돌아가기
          </button>
        </div>

        <div className="iv-body">
          <div className="iv-left">
            <div className="iv-left-title">면접 문항</div>
            <div className="iv-left-content">
              <div className="iv-qbox" />
              <div className="iv-qbox" />
            </div>
          </div>

          <div className="iv-divider" />

          <div className="iv-right">
            <div className="iv-user-card">
              <div className="iv-user-name">
                {u.name || "-"} ({TRACK_LABEL[app.track]})
              </div>
              <div className="iv-user-meta">학번: {u.student_id || "-"}</div>
              <div className="iv-user-meta">학과: {u.department || "-"}</div>
            </div>

            <div className="iv-score-card">
              <div className="iv-score-row">
                <div className="iv-score-text">1. 지원동기 및 포부 (40점)</div>
                <input className="iv-score-input" value={s1} onChange={(e) => setS1(clampNum(e.target.value, 0, 40))} />
              </div>
              <div className="iv-score-row">
                <div className="iv-score-text">2. 협업 경험 (30점)</div>
                <input className="iv-score-input" value={s2} onChange={(e) => setS2(clampNum(e.target.value, 0, 30))} />
              </div>
              <div className="iv-score-row">
                <div className="iv-score-text">3. 기술 역량 (20점)</div>
                <input className="iv-score-input" value={s3} onChange={(e) => setS3(clampNum(e.target.value, 0, 20))} />
              </div>

              <div className="iv-hr" />

              <div className="iv-comment-title">면접관 코멘트</div>
              <textarea className="iv-comment-box" value={comment} onChange={(e) => setComment(e.target.value)} />

              <div className="iv-total-row">
                <div className="iv-total-title">총점: {String(total).padStart(2, "0")}점</div>
              </div>

              <div className="iv-btn-row">
                <button className="iv-fail-btn" onClick={() => setDecision("REJECTED")}>불합격(Fail)</button>
                <button className="iv-pass-btn" onClick={() => setDecision("ACCEPTED")}>합격(Pass)</button>
                <button className="iv-save-btn" onClick={saveScoreToDB}>채점 저장하기</button>
              </div>

              {msg && <div className="iv-msg">{msg}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}