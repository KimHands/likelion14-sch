import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";
import { sanitizeUrl } from "../utils/sanitizeUrl";
import "./AdminApplicants.css";
import { useNavigate } from "react-router-dom";

type Track = "PLANNING_DESIGN" | "FRONTEND" | "BACKEND" | "AI_SERVER";
type Status = "DRAFT" | "SUBMITTED" | "ACCEPTED" | "REJECTED";

type AdminUser = {
  id: number;
  email: string;
  name: string;
  student_id: string;
  department: string;
  phone: string;
  role: string;
  email_verified: boolean;
  education_track?: Track | null;
};

type ScoreKind = "DOC" | "INTERVIEW";

type ScoreReviewer = {
  id: number;
  name: string;
  email: string;
};

type ApplicationScore = {
  id: number;
  kind: ScoreKind;
  score1: number;
  score2: number;
  score3: number;
  total: number;
  comment: string;
  created_at: string;
  updated_at: string;
  reviewer: ScoreReviewer;
};

type Decision = "PENDING" | "ACCEPTED" | "REJECTED";

type AdminApplication = {
  id: number;
  status: Status;
  submitted_at: string | null;
  track: Track;
  one_liner: string;
  portfolio_url: string;
  // 공통 질문
  motivation: string;
  common_growth_experience: string;
  common_time_management: string;
  common_teamwork: string;
  // 기획/디자인
  planning_experience: string;
  planning_idea: string;
  // AI
  ai_programming_level: string;
  ai_service_impression: string;
  // 백엔드
  backend_web_process: string;
  backend_code_quality: string;
  // 프론트엔드
  frontend_ui_experience: string;
  frontend_design_implementation: string;
  // 기타
  experience: string;
  created_at: string;
  updated_at: string;
  user: AdminUser;

  doc_avg?: number | null;
  interview_avg?: number | null;
  doc_count?: number | null;
  interview_count?: number | null;

  total_avg?: number | null;

  doc_scores?: ApplicationScore[];
  interview_scores?: ApplicationScore[];

  // ✅ 서류/최종 확정 분리
  doc_decision?: Decision;
  doc_finalized_at?: string | null;

  final_decision?: Decision;
  finalized_at?: string | null;
};

type AdminListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results?: {
    ok: boolean;
    results: AdminApplication[];
  };
};

const TRACK_LABEL: Record<Track, string> = {
  PLANNING_DESIGN: "기획/디자인",
  FRONTEND: "프론트엔드",
  BACKEND: "백엔드",
  AI_SERVER: "AI",
};

const STATUS_LABEL: Record<Status, string> = {
  DRAFT: "작성중",
  SUBMITTED: "완료",
  ACCEPTED: "합격",
  REJECTED: "불합격",
};


const DECISION_LABEL = (v?: Decision) => {
  if (v === "ACCEPTED") return "확정 합격";
  if (v === "REJECTED") return "확정 불합격";
  return "미확정";
};

function safeStr(v: unknown) {
  return typeof v === "string" ? v : "";
}

function fmtAvg(v: number | null | undefined) {
  if (v === null || v === undefined) return "-";
  if (Number.isNaN(v)) return "-";
  return Number(v).toFixed(1);
}

/**
 * ✅ 채점자 표시 정책
 * - 점수 없으면: 채점자 A/B/C
 * - 점수 있으면: 운영진 이름만 표시 (점수 표시 X)
 */
function getReviewerSlots(scores: ApplicationScore[] | undefined) {
  const s = [...(scores ?? [])].sort((a, b) => (a.reviewer?.id ?? 0) - (b.reviewer?.id ?? 0));
  const slots = ["A", "B", "C"] as const;

  return slots.map((label, idx) => {
    const sc = s[idx];
    if (!sc) return { label, text: `채점자 ${label}` };
    const name = sc.reviewer?.name || "익명";
    return { label, text: name };
  });
}

type Sort = "DEFAULT" | "TOTAL_ASC" | "TOTAL_DESC";

export default function AdminApplicants() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 검색/필터
  const [q, setQ] = useState("");
  const [track, setTrack] = useState<Track | "ALL">("ALL");
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const [sort, setSort] = useState<Sort>("DEFAULT");

  // 목록/페이지
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [items, setItems] = useState<AdminApplication[]>([]);

  // 토글
  const [openRowId, setOpenRowId] = useState<number | null>(null);

  // 토스트(플로팅 메시지)
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const pageSize = 20;
  const totalPages = useMemo(() => {
    if (!totalCount) return 1;
    return Math.max(1, Math.ceil(totalCount / pageSize));
  }, [totalCount]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));

    const qq = q.trim();
    if (qq) params.set("q", qq);
    if (track !== "ALL") params.set("track", track);
    if (status !== "ALL") params.set("status", status);

    if (sort !== "DEFAULT") params.set("sort", sort);

    return params.toString();
  }, [q, track, status, sort, page]);

  const fetchList = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch<AdminListResponse>(`/api/applications/admin?${queryString}`);
      const list = res?.results?.results ?? [];
      setItems(list);
      setTotalCount(res.count ?? list.length);
    } catch {
      setErrorMsg("지원자 리스트를 불러오지 못했습니다.");
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  useEffect(() => {
    setPage(1);
  }, [q, track, status, sort]);

  const onToggleRow = (id: number) => setOpenRowId((prev) => (prev === id ? null : id));

  const selected = useMemo(() => {
    if (!openRowId) return null;
    return items.find((x) => x.id === openRowId) ?? null;
  }, [openRowId, items]);

  const canFinalizeDoc = (it: AdminApplication | null) => {
    if (!it) return false;
    const v = it.doc_decision ?? "PENDING";
    return v === "PENDING";
  };

  const canFinalizeFinal = (it: AdminApplication | null) => {
    if (!it) return false;
    const v = it.final_decision ?? "PENDING";
    // ✅ 최종 확정은 "서류 합격 확정" 이후에만 가능하게(원하면 이 조건 빼도 됨)
    const docOk = (it.doc_decision ?? "PENDING") === "ACCEPTED";
    return v === "PENDING" && docOk;
  };

  // ✅ 서류 확정 API
  const finalizeDoc = async (decision: "ACCEPTED" | "REJECTED") => {
    if (!openRowId) {
      showToast("먼저 지원자를 클릭해서 펼쳐주세요.");
      return;
    }
    const it = selected;
    if (!canFinalizeDoc(it)) {
      showToast("서류 결과가 이미 확정된 지원서입니다.");
      return;
    }

    const ok = window.confirm(decision === "ACCEPTED" ? "서류 '합격 확정' 할까요?" : "서류 '불합격 확정' 할까요?");
    if (!ok) return;

    try {
      const res = await apiFetch<{ ok?: boolean }>(`/api/applications/admin/${openRowId}/doc-finalize`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      });

      if (res?.ok === false) {
        showToast("서류 확정 실패: 서버 응답을 확인하세요.");
        return;
      }

      showToast(decision === "ACCEPTED" ? "서류 합격 확정 완료" : "서류 불합격 확정 완료");
      await fetchList();
    } catch {
      showToast("서류 확정 실패");
    }
  };

  // ✅ 최종 확정 API
  const finalizeFinal = async (decision: "ACCEPTED" | "REJECTED") => {
    if (!openRowId) {
      showToast("먼저 지원자를 클릭해서 펼쳐주세요.");
      return;
    }
    const it = selected;
    if (!canFinalizeFinal(it)) {
      if ((it?.final_decision ?? "PENDING") !== "PENDING") {
        showToast("최종 결과가 이미 확정된 지원서입니다.");
        return;
      }
      showToast("최종 확정은 '서류 합격 확정' 이후에만 가능합니다.");
      return;
    }

    const ok = window.confirm(decision === "ACCEPTED" ? "최종 '합격 확정' 할까요?" : "최종 '불합격 확정' 할까요?");
    if (!ok) return;

    try {
      const res = await apiFetch<{ ok?: boolean }>(`/api/applications/admin/${openRowId}/finalize`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      });

      if (res?.ok === false) {
        showToast("최종 확정 실패: 서버 응답을 확인하세요.");
        return;
      }

      showToast(decision === "ACCEPTED" ? "최종 합격 확정 완료" : "최종 불합격 확정 완료");
      await fetchList();
    } catch {
      showToast("최종 확정 실패");
    }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-title">지원자 리스트 페이지</h1>

      {toast && <div className="admin-toast">{toast}</div>}

      {/* 상단 필터 */}
      <div className="admin-controls">
        <div className="search-box">
          <div className="search-icon">⌕</div>
          <input className="search-input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div className="filter-box">
          <div className="filter-col">
            <div className="filter-label big">파트</div>
            <select className="filter-select" value={track} onChange={(e) => setTrack(e.target.value as Track | "ALL")}>
              <option value="ALL">전체</option>
              <option value="PLANNING_DESIGN">기획/디자인</option>
              <option value="FRONTEND">프론트엔드</option>
              <option value="BACKEND">백엔드</option>
              <option value="AI_SERVER">AI</option>
            </select>
          </div>

          <div className="filter-divider" />

          <div className="filter-col">
            <div className="filter-label big">상태</div>
            <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value as Status | "ALL")}>
              <option value="ALL">전체</option>
              <option value="DRAFT">작성중</option>
              <option value="SUBMITTED">제출완료</option>
              <option value="ACCEPTED">합격</option>
              <option value="REJECTED">불합격</option>
            </select>
          </div>

          <div className="filter-divider" />

          <div className="filter-col">
            <div className="filter-label big">총점 정렬</div>
            <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="DEFAULT">기본(최근 수정)</option>
              <option value="TOTAL_DESC">총점 내림차순</option>
              <option value="TOTAL_ASC">총점 오름차순</option>
            </select>
          </div>

          <div className="filter-divider" />

          {/* ✅ 결과 확정(서류/최종) */}
          <div className="finalize-col">
            <div className="filter-label big">결과 확정</div>

            <div className="finalize-row">
              <div className="finalize-group">
                <div className="finalize-group-title">서류</div>
                <div className="finalize-btn-row">
                  <button
                    className="finalize-btn accept"
                    disabled={!openRowId || !canFinalizeDoc(selected)}
                    onClick={() => finalizeDoc("ACCEPTED")}
                    type="button"
                  >
                    서류 합격
                  </button>
                  <button
                    className="finalize-btn reject"
                    disabled={!openRowId || !canFinalizeDoc(selected)}
                    onClick={() => finalizeDoc("REJECTED")}
                    type="button"
                  >
                    서류 불합
                  </button>
                </div>
              </div>

              <div className="finalize-group">
                <div className="finalize-group-title">최종</div>
                <div className="finalize-btn-row">
                  <button
                    className="finalize-btn accept"
                    disabled={!openRowId || !canFinalizeFinal(selected)}
                    onClick={() => finalizeFinal("ACCEPTED")}
                    type="button"
                  >
                    최종 합격
                  </button>
                  <button
                    className="finalize-btn reject"
                    disabled={!openRowId || !canFinalizeFinal(selected)}
                    onClick={() => finalizeFinal("REJECTED")}
                    type="button"
                  >
                    최종 불합
                  </button>
                </div>
              </div>
            </div>

            <div className="finalize-hint">
              {selected
                ? `선택: ${selected.user?.name || "-"} · 서류:${DECISION_LABEL(selected.doc_decision)} · 최종:${DECISION_LABEL(selected.final_decision)}`
                : "선택된 지원자 없음"}
            </div>
          </div>
        </div>
      </div>

      {/* 표 */}
      <div className="admin-table-wrap">
        <div className="admin-table-inner">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>이름</th>
                <th style={{ width: 140 }}>파트</th>
                <th style={{ width: 140 }}>학번</th>
                <th style={{ width: 140 }}>제출상태</th>
                <th style={{ width: 140 }}>서류 평균</th>
                <th style={{ width: 140 }}>면접 평균</th>
                <th style={{ width: 120 }}>총점</th>
                <th style={{ width: 140 }}>서류결과</th>
                <th style={{ width: 140 }}>최종결과</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="admin-empty">Loading...</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan={9} className="admin-empty error">{errorMsg}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="admin-empty">결과가 없습니다.</td></tr>
              ) : (
                items.map((it) => {
                  const isOpen = openRowId === it.id;

                  const docAvg = fmtAvg(it.doc_avg);
                  const interviewAvg = fmtAvg(it.interview_avg);
                  const totalAvg = fmtAvg(it.total_avg);

                  const docSlots = getReviewerSlots(it.doc_scores);
                  const interviewSlots = getReviewerSlots(it.interview_scores);

                  return (
                    <React.Fragment key={it.id}>
                      <tr
                        className={`admin-row ${isOpen ? "open" : ""}`}
                        onClick={() => onToggleRow(it.id)}
                        title="클릭 시 상세 토글"
                      >
                        <td>{it.user?.name || "-"}</td>
                        <td>{TRACK_LABEL[it.track] ?? it.track}</td>
                        <td>{it.user?.student_id || "-"}</td>
                        <td>{STATUS_LABEL[it.status] ?? it.status}</td>
                        <td>{docAvg === "0.0" ? "-" : docAvg}</td>
                        <td>{interviewAvg === "0.0" ? "-" : interviewAvg}</td>
                        <td>{totalAvg === "0.0" ? "-" : totalAvg}</td>

                        {/* ✅ 서류/최종 확정 pill */}
                        <td>
                          <span className={`final-pill ${it.doc_decision ?? "PENDING"}`}>
                            {DECISION_LABEL(it.doc_decision)}
                          </span>
                        </td>
                        <td>
                          <span className={`final-pill ${it.final_decision ?? "PENDING"}`}>
                            {DECISION_LABEL(it.final_decision)}
                          </span>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="admin-detail-row">
                          <td colSpan={9}>
                            <div className="detail-box">
                              <div className="detail-left">
                                <div className="detail-title big">제출 내용</div>

                                <div className="detail-item big">
                                  <div className="detail-label big">포트폴리오</div>
                                  <div className="detail-value big">
                                    {sanitizeUrl(it.portfolio_url) ? (
                                      <a href={sanitizeUrl(it.portfolio_url)} target="_blank" rel="noreferrer">
                                        {it.portfolio_url}
                                      </a>
                                    ) : (
                                      "-"
                                    )}
                                  </div>
                                </div>

                                <div className="detail-item big">
                                  <div className="detail-label big">Q1. 자기소개 및 지원동기</div>
                                  <pre className="detail-pre big">{safeStr(it.motivation) || "-"}</pre>
                                </div>

                                <div className="detail-item big">
                                  <div className="detail-label big">Q2. 열정적으로 몰입하여 성장했던 경험</div>
                                  <pre className="detail-pre big">{safeStr(it.common_growth_experience) || "-"}</pre>
                                </div>

                                <div className="detail-item big">
                                  <div className="detail-label big">Q3. 멋쟁이사자처럼 활동 계획 및 각오</div>
                                  <pre className="detail-pre big">{safeStr(it.common_time_management) || "-"}</pre>
                                </div>

                                <div className="detail-item big">
                                  <div className="detail-label big">Q4. 팀 협업 경험</div>
                                  <pre className="detail-pre big">{safeStr(it.common_teamwork) || "-"}</pre>
                                </div>

                                {it.track === "PLANNING_DESIGN" && (
                                  <>
                                    <div className="detail-item big">
                                      <div className="detail-label big">Q5. [기획/디자인] 기획/디자인 관련 경험과 프로젝트</div>
                                      <pre className="detail-pre big">{safeStr(it.planning_experience) || "-"}</pre>
                                    </div>
                                    <div className="detail-item big">
                                      <div className="detail-label big">Q6. [기획/디자인] 사회 문제 해결 아이디어</div>
                                      <pre className="detail-pre big">{safeStr(it.planning_idea) || "-"}</pre>
                                    </div>
                                  </>
                                )}

                                {it.track === "AI_SERVER" && (
                                  <>
                                    <div className="detail-item big">
                                      <div className="detail-label big">Q5. [AI] 프로그래밍 학습 경험</div>
                                      <pre className="detail-pre big">{safeStr(it.ai_programming_level) || "-"}</pre>
                                    </div>
                                    <div className="detail-item big">
                                      <div className="detail-label big">Q6. [AI] AI 서비스 인상</div>
                                      <pre className="detail-pre big">{safeStr(it.ai_service_impression) || "-"}</pre>
                                    </div>
                                  </>
                                )}

                                {it.track === "BACKEND" && (
                                  <>
                                    <div className="detail-item big">
                                      <div className="detail-label big">Q5. [백엔드] 웹 동작 원리</div>
                                      <pre className="detail-pre big">{safeStr(it.backend_web_process) || "-"}</pre>
                                    </div>
                                    <div className="detail-item big">
                                      <div className="detail-label big">Q6. [백엔드] 코드 품질 기준</div>
                                      <pre className="detail-pre big">{safeStr(it.backend_code_quality) || "-"}</pre>
                                    </div>
                                  </>
                                )}

                                {it.track === "FRONTEND" && (
                                  <>
                                    <div className="detail-item big">
                                      <div className="detail-label big">Q5. [프론트엔드] UI/UX 개선 아이디어</div>
                                      <pre className="detail-pre big">{safeStr(it.frontend_ui_experience) || "-"}</pre>
                                    </div>
                                    <div className="detail-item big">
                                      <div className="detail-label big">Q6. [프론트엔드] 디자인 구현 우선순위</div>
                                      <pre className="detail-pre big">{safeStr(it.frontend_design_implementation) || "-"}</pre>
                                    </div>
                                  </>
                                )}
                              </div>

                              <div className="detail-right">
                                <div className="score-panel">
                                  <div className="score-panel-title big">서류 채점</div>
                                  <ul className="score-list big">
                                    {docSlots.map((s) => (
                                      <li key={`doc-${it.id}-${s.label}`}>
                                        채점자 {s.label} : {s.text}
                                      </li>
                                    ))}
                                  </ul>
                                  <div className="score-divider" />
                                  <div className="score-total big">평점: {docAvg === "0.0" ? "-" : docAvg}</div>

                                  <div className="score-panel-title big" style={{ marginTop: 16 }}>
                                    면접 채점
                                  </div>
                                  <ul className="score-list big">
                                    {interviewSlots.map((s) => (
                                      <li key={`iv-${it.id}-${s.label}`}>
                                        채점자 {s.label} : {s.text}
                                      </li>
                                    ))}
                                  </ul>
                                  <div className="score-divider" />
                                  <div className="score-total big">평점: {interviewAvg === "0.0" ? "-" : interviewAvg}</div>

                                  <div className="score-divider" />
                                  <div className="score-total big">총점: {totalAvg === "0.0" ? "-" : totalAvg}</div>
                                </div>

                                <div className="admin-action-row">
                                  <button
                                    className="admin-action-btn primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      nav(`/admin/applicants/${it.id}/doc`);
                                    }}
                                  >
                                    서류 채점
                                  </button>
                                  <button
                                    className="admin-action-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      nav(`/admin/applicants/${it.id}/interview`);
                                    }}
                                  >
                                    면접 채점
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="pager">
          <button className="pager-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            이전
          </button>
          <div className="pager-info">
            {page} / {totalPages} <span className="pager-count">({totalCount}명)</span>
          </div>
          <button className="pager-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            다음
          </button>
        </div>
      </div>
    </div>
  );
}