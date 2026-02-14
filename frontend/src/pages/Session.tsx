import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/useAuth";
import {
  TRACK_TO_DB,
  fetchQuizzes, submitQuizAnswer, createQuiz,
  fetchQnAPosts, fetchQnADetail, createQnAPost, createQnAComment,
  fetchAssignments, fetchAssignmentDetail, submitAssignment, createAssignment, markSubmissionRead,
  fetchAnnouncements, createAnnouncement,
  type QuizItem, type QuizAnswerResult,
  type QnAPostItem, type QnAPostDetail,
  type AssignmentItem, type SubmissionItem,
  type AnnouncementItem,
} from "../api/sessions";
import "./Session.css";

type MainTab = "frontend" | "backend" | "ai" | "planning";

export default function Session() {
  const { me } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>("ai");

  useEffect(() => {
    if (me?.track) {
      const trackMap: Record<string, MainTab> = {
        FRONTEND: "frontend",
        BACKEND: "backend",
        AI: "ai",
        PLANNING: "planning",
      };
      setMainTab(trackMap[me.track] || "ai");
    }
  }, [me]);

  const canAccessTab = (tab: MainTab): boolean => {
    if (me?.role === "INSTRUCTOR") return true;
    if (me?.role === "STUDENT") {
      const trackMap: Record<string, MainTab> = {
        FRONTEND: "frontend",
        BACKEND: "backend",
        AI: "ai",
        PLANNING: "planning",
      };
      return trackMap[me.track || ""] === tab;
    }
    return false;
  };

  const handleTabClick = (tab: MainTab) => {
    if (!canAccessTab(tab)) {
      alert("해당 트랙에 접근 권한이 없습니다.");
      return;
    }
    setMainTab(tab);
  };

  return (
    <div className="session-page">
      <div className="session-container">
        <h1 className="session-title">EDUCATION SESSION</h1>

        <div className="session-main-tabs">
          {(["frontend", "backend", "ai", "planning"] as MainTab[]).map((tab) => (
            <button
              key={tab}
              className={`session-tab ${mainTab === tab ? "active" : ""} ${!canAccessTab(tab) ? "disabled" : ""}`}
              onClick={() => handleTabClick(tab)}
              disabled={!canAccessTab(tab)}
            >
              {{ frontend: "프론트엔드", backend: "백엔드", ai: "AI", planning: "기획/디자인" }[tab]}
            </button>
          ))}
        </div>

        <div className="session-content">
          {mainTab === "frontend" && <QuizQnATab trackLabel="FRONTEND" desc="프론트엔드 개발을 학습하는 과정입니다." role={me?.role} />}
          {mainTab === "backend" && <QuizQnATab trackLabel="BACKEND" desc="백엔드 개발을 학습하는 과정입니다." role={me?.role} />}
          {mainTab === "ai" && <AssignmentTab trackLabel="AI" desc="AI 및 서버 개발을 학습하는 과정입니다." role={me?.role} />}
          {mainTab === "planning" && <PlanningTab trackLabel="PLANNING" desc="서비스 아이디어를 구체화하는 과정입니다." role={me?.role} />}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 프론트엔드 / 백엔드 탭 (Quiz + Q&A)
// ============================================
function QuizQnATab({ trackLabel, desc, role }: { trackLabel: string; desc: string; role?: string }) {
  const dbTrack = TRACK_TO_DB[trackLabel];
  const isInstructor = role === "INSTRUCTOR";

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [qnaPosts, setQnaPosts] = useState<QnAPostItem[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizItem | null>(null);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  const [answerResult, setAnswerResult] = useState<QuizAnswerResult | null>(null);
  const [selectedPost, setSelectedPost] = useState<QnAPostDetail | null>(null);
  const [showQuizCreate, setShowQuizCreate] = useState(false);
  const [showQnaCreate, setShowQnaCreate] = useState(false);
  const [commentText, setCommentText] = useState("");

  const loadData = useCallback(() => {
    fetchQuizzes(dbTrack).then(setQuizzes).catch(() => {});
    fetchQnAPosts(dbTrack).then(setQnaPosts).catch(() => {});
  }, [dbTrack]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleQuizSubmit = async () => {
    if (!selectedQuiz || !selectedOption) return;
    try {
      const res = await submitQuizAnswer(selectedQuiz.id, selectedOption);
      setAnswerResult(res);
    } catch {
      alert("이미 답변을 제출했습니다.");
    }
  };

  const handleOpenPost = async (id: number) => {
    const detail = await fetchQnADetail(id);
    setSelectedPost(detail);
    setCommentText("");
  };

  const handleAddComment = async () => {
    if (!selectedPost || !commentText.trim()) return;
    await createQnAComment(selectedPost.id, commentText);
    const detail = await fetchQnADetail(selectedPost.id);
    setSelectedPost(detail);
    setCommentText("");
  };

  return (
    <div className="fullstack-tab">
      <p className="session-desc">{desc}</p>

      <div className="fullstack-grid">
        {/* 왼쪽: 퀴즈 목록 */}
        <div className="session-list-panel">
          <div className="panel-header">
            <h2 className="panel-title">퀴즈 목록</h2>
            {isInstructor && (
              <button className="small-btn" onClick={() => setShowQuizCreate(true)}>퀴즈 출제</button>
            )}
          </div>
          {quizzes.length === 0 && <p className="empty-text">등록된 퀴즈가 없습니다.</p>}
          {quizzes.map((q) => (
            <div key={q.id} className="session-item">
              <div className="session-item-info">
                <span className="session-label">{q.title}</span>
                <span className="session-meta">{q.created_by_name} | {new Date(q.created_at).toLocaleDateString()}</span>
              </div>
              {q.my_answer ? (
                <span className={`quiz-badge ${q.my_answer.is_correct ? "correct" : "wrong"}`}>
                  {q.my_answer.is_correct ? "정답" : "오답"}
                </span>
              ) : (
                <button className="quiz-btn" onClick={() => { setSelectedQuiz(q); setSelectedOption(0); setAnswerResult(null); }}>
                  Quiz 풀기
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 오른쪽: Q&A 게시판 */}
        <div className="qna-panel">
          <div className="panel-header">
            <h2 className="qna-title">Q&A 게시판</h2>
            <button className="small-btn" onClick={() => setShowQnaCreate(true)}>글쓰기</button>
          </div>
          <table className="qna-table">
            <thead>
              <tr>
                <th>작성자</th>
                <th>제목</th>
                <th>답변</th>
                <th>날짜</th>
              </tr>
            </thead>
            <tbody>
              {qnaPosts.length === 0 && (
                <tr><td colSpan={4} className="empty-text">게시글이 없습니다.</td></tr>
              )}
              {qnaPosts.map((p) => (
                <tr key={p.id} onClick={() => handleOpenPost(p.id)}>
                  <td>{p.author_name}</td>
                  <td>{p.title}</td>
                  <td>{p.comment_count}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quiz 풀기 모달 */}
      {selectedQuiz && (
        <Modal onClose={() => setSelectedQuiz(null)} title={selectedQuiz.title}>
          <p className="modal-question">{selectedQuiz.question}</p>
          <div className="quiz-options">
            {[1, 2, 3, 4, 5].map((n) => {
              const optText = selectedQuiz[`option_${n}` as keyof QuizItem] as string;
              if (!optText) return null;
              return (
                <label key={n} className={`quiz-option ${selectedOption === n ? "selected" : ""} ${answerResult ? (n === answerResult.correct_option ? "correct-answer" : n === answerResult.selected_option && !answerResult.is_correct ? "wrong-answer" : "") : ""}`}>
                  <input
                    type="radio"
                    name="quiz-option"
                    value={n}
                    checked={selectedOption === n}
                    onChange={() => setSelectedOption(n)}
                    disabled={!!answerResult}
                  />
                  <span>{n}. {optText}</span>
                </label>
              );
            })}
          </div>
          {answerResult ? (
            <div className={`answer-result ${answerResult.is_correct ? "correct" : "wrong"}`}>
              {answerResult.is_correct ? "정답입니다!" : `오답입니다. 정답: ${answerResult.correct_option}번`}
            </div>
          ) : (
            <button className="submit-btn" onClick={handleQuizSubmit} disabled={!selectedOption}>제출하기</button>
          )}
        </Modal>
      )}

      {/* Q&A 상세 모달 */}
      {selectedPost && (
        <Modal onClose={() => setSelectedPost(null)} title={selectedPost.title}>
          <p className="modal-author">{selectedPost.author_name} | {new Date(selectedPost.created_at).toLocaleDateString()}</p>
          <div className="modal-content-body">{selectedPost.content}</div>
          <div className="comments-section">
            <h3>답변 ({selectedPost.comments.length})</h3>
            {selectedPost.comments.map((c) => (
              <div key={c.id} className={`comment-item ${c.author_role === "INSTRUCTOR" ? "instructor" : ""}`}>
                <div className="comment-header">
                  <span className="comment-author">{c.author_name}</span>
                  {c.author_role === "INSTRUCTOR" && <span className="instructor-badge">교육자</span>}
                  <span className="comment-date">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p>{c.content}</p>
              </div>
            ))}
            <div className="comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="답변을 입력하세요..."
              />
              <button className="submit-btn" onClick={handleAddComment}>답변 작성</button>
            </div>
          </div>
        </Modal>
      )}

      {/* 퀴즈 출제 모달 */}
      {showQuizCreate && (
        <QuizCreateModal
          track={dbTrack}
          onClose={() => setShowQuizCreate(false)}
          onCreated={() => { setShowQuizCreate(false); loadData(); }}
        />
      )}

      {/* Q&A 글쓰기 모달 */}
      {showQnaCreate && (
        <QnACreateModal
          track={dbTrack}
          onClose={() => setShowQnaCreate(false)}
          onCreated={() => { setShowQnaCreate(false); loadData(); }}
        />
      )}
    </div>
  );
}

// ============================================
// AI/서버 / 기획/디자인 탭 (Assignment + Announcement)
// ============================================
function AssignmentTab({
  trackLabel, desc, role, showReadStatus = false,
}: {
  trackLabel: string; desc: string; role?: string; showReadStatus?: boolean;
}) {
  const dbTrack = TRACK_TO_DB[trackLabel];
  const isInstructor = role === "INSTRUCTOR";

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [showAssignCreate, setShowAssignCreate] = useState(false);
  const [showAnnounceCreate, setShowAnnounceCreate] = useState(false);

  const loadData = useCallback(() => {
    fetchAssignments(dbTrack).then(setAssignments).catch(() => {});
    fetchAnnouncements(dbTrack).then(setAnnouncements).catch(() => {});
  }, [dbTrack]);

  useEffect(() => { loadData(); }, [loadData]);

  const latestAssignment = assignments[0] || null;

  const handleSubmitLink = async () => {
    if (!latestAssignment || !linkInput.trim()) return;
    try {
      await submitAssignment(latestAssignment.id, linkInput);
      setLinkInput("");
      loadData();
    } catch {
      alert("제출에 실패했습니다.");
    }
  };

  const handleViewDetail = async (id: number) => {
    const detail = await fetchAssignmentDetail(id);
    setSelectedAssignment(detail);
  };

  const handleMarkRead = async (subId: number) => {
    await markSubmissionRead(subId);
    if (selectedAssignment) {
      const detail = await fetchAssignmentDetail(selectedAssignment.id);
      setSelectedAssignment(detail);
    }
  };

  return (
    <div className="ai-tab">
      <p className="session-desc">{desc}</p>

      {/* 이번주 과제 공지 */}
      <div className="assignment-notice">
        <div className="panel-header">
          <h2 className="assignment-title">이번주 과제 공지</h2>
          {isInstructor && (
            <div className="btn-group">
              <button className="small-btn" onClick={() => setShowAssignCreate(true)}>과제 출제</button>
              <button className="small-btn secondary" onClick={() => setShowAnnounceCreate(true)}>공지 작성</button>
            </div>
          )}
        </div>

        {latestAssignment ? (
          <>
            <div className="assignment-info">
              <div className="info-row">
                <span className="info-label">과제명:</span>
                <span className="info-value">{latestAssignment.title}</span>
              </div>
              <div className="info-row">
                <span className="info-label">내용:</span>
                <span className="info-value">{latestAssignment.content}</span>
              </div>
              <div className="info-row">
                <span className="info-label">제출기한:</span>
                <span className="info-value">{new Date(latestAssignment.deadline).toLocaleString()}</span>
              </div>
            </div>

            {latestAssignment.my_submission ? (
              <div className="submission-status">
                <span className="submitted-badge">제출 완료</span>
                <span className="submitted-link">{latestAssignment.my_submission.link}</span>
                {showReadStatus && latestAssignment.my_submission.is_read && (
                  <span className="read-badge">읽음</span>
                )}
              </div>
            ) : (
              !isInstructor && (
                <div className="assignment-form">
                  <div className="form-row">
                    <label>링크 제출</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://..."
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                    />
                  </div>
                  <button className="submit-btn" onClick={handleSubmitLink}>제출하기</button>
                </div>
              )
            )}
          </>
        ) : (
          <p className="empty-text">등록된 과제가 없습니다.</p>
        )}
      </div>

      {/* 과제 목록 (여러 과제가 있을 경우) */}
      {assignments.length > 1 && (
        <div className="submitted-list">
          <h2 className="submitted-title">전체 과제 목록</h2>
          <table className="submitted-table">
            <thead>
              <tr>
                <th>과제명</th>
                <th>제출기한</th>
                <th>상태</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{new Date(a.deadline).toLocaleDateString()}</td>
                  <td>{a.my_submission ? "제출 완료" : "미제출"}</td>
                  <td><button className="link-btn" onClick={() => handleViewDetail(a.id)}>보기</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* INSTRUCTOR: 최신 과제 제출물 확인 */}
      {isInstructor && latestAssignment && (
        <div className="submitted-list" style={{ marginTop: 20 }}>
          <h2 className="submitted-title">제출물 확인</h2>
          <button className="link-btn" onClick={() => handleViewDetail(latestAssignment.id)} style={{ marginBottom: 12 }}>
            제출물 새로고침
          </button>
          {selectedAssignment && selectedAssignment.submissions ? (
            <table className="submitted-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>링크</th>
                  <th>제출일</th>
                  {showReadStatus && <th>읽음</th>}
                </tr>
              </thead>
              <tbody>
                {selectedAssignment.submissions.map((s: SubmissionItem) => (
                  <tr key={s.id}>
                    <td>{s.student_name}</td>
                    <td><a href={s.link} target="_blank" rel="noreferrer" className="link-text">{s.link}</a></td>
                    <td>{new Date(s.submitted_at).toLocaleDateString()}</td>
                    {showReadStatus && (
                      <td>
                        {s.is_read ? (
                          <span className="read-badge">읽음 ({s.read_by_name})</span>
                        ) : (
                          <button className="small-btn" onClick={() => handleMarkRead(s.id)}>읽음 표시</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {selectedAssignment.submissions.length === 0 && (
                  <tr><td colSpan={showReadStatus ? 4 : 3} className="empty-text">제출물이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <p className="empty-text">"제출물 새로고침" 버튼을 클릭하세요.</p>
          )}
        </div>
      )}

      {/* 공지 목록 */}
      <div className="submitted-list" style={{ marginTop: 20 }}>
        <h2 className="submitted-title">공지사항</h2>
        {announcements.length === 0 ? (
          <p className="empty-text">공지가 없습니다.</p>
        ) : (
          <div className="announcement-list">
            {announcements.map((a) => (
              <div key={a.id} className="announcement-item">
                <div className="announcement-header">
                  <strong>{a.title}</strong>
                  <span className="announcement-meta">{a.author_name} | {new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <p className="announcement-body">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 과제 상세 모달 */}
      {selectedAssignment && !isInstructor && (
        <Modal onClose={() => setSelectedAssignment(null)} title={selectedAssignment.title}>
          <p>{selectedAssignment.content}</p>
          <p>제출기한: {new Date(selectedAssignment.deadline).toLocaleString()}</p>
          {selectedAssignment.my_submission && (
            <div className="submission-status">
              <span className="submitted-badge">제출 완료</span>
              <span className="submitted-link">{selectedAssignment.my_submission.link}</span>
            </div>
          )}
        </Modal>
      )}

      {/* 과제 출제 모달 */}
      {showAssignCreate && (
        <AssignmentCreateModal
          track={dbTrack}
          onClose={() => setShowAssignCreate(false)}
          onCreated={() => { setShowAssignCreate(false); loadData(); }}
        />
      )}

      {/* 공지 작성 모달 */}
      {showAnnounceCreate && (
        <AnnouncementCreateModal
          track={dbTrack}
          onClose={() => setShowAnnounceCreate(false)}
          onCreated={() => { setShowAnnounceCreate(false); loadData(); }}
        />
      )}
    </div>
  );
}

// ============================================
// 기획/디자인 탭 (Rotation Schedule + Gallery)
// ============================================

interface CalendarEvent {
  name: string;
  startDay: number;
  endDay: number;
  isComplete: boolean;
}

interface AssignmentSubs {
  assignmentId: number;
  assignmentTitle: string;
  submissions: SubmissionItem[];
}

function PlanningTab({ trackLabel, desc, role }: { trackLabel: string; desc: string; role?: string }) {
  const dbTrack = TRACK_TO_DB[trackLabel];
  const isInstructor = role === "INSTRUCTOR";

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [assignmentSubs, setAssignmentSubs] = useState<AssignmentSubs[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<{ submission: SubmissionItem; title: string } | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [showAssignCreate, setShowAssignCreate] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const assigns = await fetchAssignments(dbTrack);
      setAssignments(assigns);

      const subs: AssignmentSubs[] = [];
      if (role === "INSTRUCTOR") {
        const details = await Promise.all(assigns.map((a) => fetchAssignmentDetail(a.id)));
        details.forEach((d, i) => {
          subs.push({
            assignmentId: assigns[i].id,
            assignmentTitle: assigns[i].title,
            submissions: d.submissions || [],
          });
        });
      } else {
        assigns.forEach((a) => {
          if (a.my_submission) {
            subs.push({
              assignmentId: a.id,
              assignmentTitle: a.title,
              submissions: [a.my_submission],
            });
          }
        });
      }
      setAssignmentSubs(subs);
    } catch {
      /* ignore */
    }
  }, [dbTrack, role]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Calendar logic ── */
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  function getCalendarWeeks() {
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];

    for (let i = 0; i < firstDow; i++) week.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }

  const weeks = getCalendarWeeks();

  function buildCalendarEvents(): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    for (const a of assignments) {
      const deadline = new Date(a.deadline);
      if (deadline.getMonth() !== month || deadline.getFullYear() !== year) continue;

      const deadlineDay = deadline.getDate();
      const startDay = Math.max(1, deadlineDay - 2);

      if (isInstructor) {
        const subs = assignmentSubs.find((s) => s.assignmentId === a.id);
        if (subs && subs.submissions.length > 0) {
          subs.submissions.forEach((s) => {
            events.push({ name: s.student_name, startDay, endDay: deadlineDay, isComplete: true });
          });
        } else {
          events.push({ name: a.title, startDay, endDay: deadlineDay, isComplete: false });
        }
      } else {
        events.push({
          name: a.my_submission ? "제출완료" : a.title,
          startDay,
          endDay: deadlineDay,
          isComplete: !!a.my_submission,
        });
      }
    }
    return events;
  }

  const calendarEvents = buildCalendarEvents();

  function getEventsForWeek(weekDays: (number | null)[]) {
    const results: Array<{ name: string; isComplete: boolean; startCol: number; endCol: number }> = [];
    for (const evt of calendarEvents) {
      let startCol = -1;
      let endCol = -1;
      for (let i = 0; i < 7; i++) {
        const day = weekDays[i];
        if (day !== null && day >= evt.startDay && day <= evt.endDay) {
          if (startCol === -1) startCol = i + 1;
          endCol = i + 1;
        }
      }
      if (startCol !== -1) {
        results.push({ name: evt.name, isComplete: evt.isComplete, startCol, endCol: endCol + 1 });
      }
    }
    return results;
  }

  /* ── Gallery items ── */
  const galleryItems = assignmentSubs.flatMap((a) =>
    a.submissions.map((s) => ({
      ...s,
      assignmentTitle: a.assignmentTitle,
      assignmentId: a.assignmentId,
    }))
  );

  const latestAssignment = assignments[0] || null;

  /* ── Handlers ── */
  const handleSubmitLink = async () => {
    if (!latestAssignment || !linkInput.trim()) return;
    try {
      await submitAssignment(latestAssignment.id, linkInput);
      setLinkInput("");
      setShowSubmitModal(false);
      loadData();
    } catch {
      alert("제출에 실패했습니다.");
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    try {
      await createQnAPost({ track: dbTrack, title: "피드백", content: feedbackText });
      setFeedbackText("");
      alert("피드백이 등록되었습니다.");
    } catch {
      alert("등록에 실패했습니다.");
    }
  };

  /* ── Render ── */
  return (
    <div className="planning-tab">
      <p className="session-desc">{desc}</p>

      <div className="planning-grid">
        {/* Left: Rotation Schedule */}
        <div className="rotation-schedule">
          <div className="rotation-header">
            <h2 className="rotation-title">Rotation Schedule</h2>
            <div className="rotation-legend">
              <span className="legend-item"><span className="legend-dot complete" />제작완료</span>
              <span className="legend-item"><span className="legend-dot progress" />제작중</span>
            </div>
          </div>

          <div className="calendar">
            <div className="cal-header-row">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="cal-header">{d}</div>
              ))}
            </div>
            {weeks.map((week, wi) => {
              const weekEvents = getEventsForWeek(week);
              return (
                <div key={wi} className="cal-week">
                  <div className="cal-day-row">
                    {week.map((day, di) => (
                      <div
                        key={di}
                        className={`cal-day${day === null ? " empty" : ""}${di === 0 || di === 6 ? " weekend" : ""}`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  {weekEvents.length > 0 && (
                    <div className="cal-event-row">
                      {weekEvents.map((evt, ei) => (
                        <div
                          key={ei}
                          className={`cal-event ${evt.isComplete ? "complete" : "progress"}`}
                          style={{ gridColumn: `${evt.startCol} / ${evt.endCol}` }}
                        >
                          {evt.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Gallery */}
        <div className="gallery-section">
          <div className="gallery-header">
            <h2 className="gallery-title">Gallery</h2>
            {!isInstructor && latestAssignment && !latestAssignment.my_submission && (
              <button className="gallery-submit-btn" onClick={() => setShowSubmitModal(true)}>과제 제출하기</button>
            )}
            {isInstructor && (
              <button className="gallery-submit-btn" onClick={() => setShowAssignCreate(true)}>과제 출제</button>
            )}
          </div>

          <div className="gallery-grid">
            {galleryItems.length === 0 && (
              <p className="empty-text" style={{ gridColumn: "1 / -1" }}>제출된 과제가 없습니다.</p>
            )}
            {galleryItems.map((item) => (
              <div
                key={`${item.assignmentId}-${item.id}`}
                className="gallery-card"
                onClick={() => setSelectedSubmission({ submission: item, title: item.assignmentTitle })}
              >
                <div className="gallery-thumbnail" />
                <p className="gallery-caption">{item.student_name} {item.assignmentTitle} 제출</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="feedback-section">
        <textarea
          className="feedback-textarea"
          placeholder="피드백이나 질문을 남겨주세요."
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        />
        {feedbackText.trim() && (
          <button className="submit-btn feedback-submit" onClick={handleFeedbackSubmit}>등록하기</button>
        )}
      </div>

      {/* Submit Assignment Modal */}
      {showSubmitModal && latestAssignment && (
        <Modal onClose={() => setShowSubmitModal(false)} title="과제 제출하기">
          <div className="create-form">
            <div className="info-row">
              <span className="info-label">과제명:</span>
              <span className="info-value">{latestAssignment.title}</span>
            </div>
            <div className="info-row">
              <span className="info-label">제출기한:</span>
              <span className="info-value">{new Date(latestAssignment.deadline).toLocaleString()}</span>
            </div>
            <label>제출 링크</label>
            <input type="text" placeholder="https://..." value={linkInput} onChange={(e) => setLinkInput(e.target.value)} />
            <button className="submit-btn" onClick={handleSubmitLink}>제출하기</button>
          </div>
        </Modal>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <Modal onClose={() => setSelectedSubmission(null)} title={selectedSubmission.title}>
          <div className="submission-detail">
            <p><strong>제출자:</strong> {selectedSubmission.submission.student_name}</p>
            <p><strong>제출일:</strong> {new Date(selectedSubmission.submission.submitted_at).toLocaleString()}</p>
            <p>
              <strong>링크:</strong>{" "}
              <a href={selectedSubmission.submission.link} target="_blank" rel="noreferrer" className="link-text">
                {selectedSubmission.submission.link}
              </a>
            </p>
            {isInstructor && !selectedSubmission.submission.is_read && (
              <button
                className="small-btn"
                style={{ marginTop: 16 }}
                onClick={async () => {
                  await markSubmissionRead(selectedSubmission.submission.id);
                  loadData();
                  setSelectedSubmission(null);
                }}
              >
                읽음 표시
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Assignment Create Modal (Instructor) */}
      {showAssignCreate && (
        <AssignmentCreateModal
          track={dbTrack}
          onClose={() => setShowAssignCreate(false)}
          onCreated={() => { setShowAssignCreate(false); loadData(); }}
        />
      )}
    </div>
  );
}

// ============================================
// 공통 모달
// ============================================
function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ============================================
// 퀴즈 출제 모달
// ============================================
function QuizCreateModal({ track, onClose, onCreated }: { track: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "", question: "",
    option_1: "", option_2: "", option_3: "", option_4: "", option_5: "",
    correct_option: 1,
  });

  const handleSubmit = async () => {
    if (!form.title || !form.question || !form.option_1 || !form.option_2) {
      alert("필수 항목을 입력하세요.");
      return;
    }
    await createQuiz({ ...form, track });
    onCreated();
  };

  return (
    <Modal onClose={onClose} title="퀴즈 출제">
      <div className="create-form">
        <label>제목</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label>문제</label>
        <textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n}>
            <label>선택지 {n}{n <= 2 ? " (필수)" : ""}</label>
            <input
              value={form[`option_${n}` as keyof typeof form] as string}
              onChange={(e) => setForm({ ...form, [`option_${n}`]: e.target.value })}
            />
          </div>
        ))}
        <label>정답 번호</label>
        <select
          value={form.correct_option}
          onChange={(e) => setForm({ ...form, correct_option: Number(e.target.value) })}
        >
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}번</option>)}
        </select>
        <button className="submit-btn" onClick={handleSubmit}>출제하기</button>
      </div>
    </Modal>
  );
}

// ============================================
// Q&A 글쓰기 모달
// ============================================
function QnACreateModal({ track, onClose, onCreated }: { track: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!title || !content) { alert("제목과 내용을 입력하세요."); return; }
    await createQnAPost({ track, title, content });
    onCreated();
  };

  return (
    <Modal onClose={onClose} title="Q&A 글쓰기">
      <div className="create-form">
        <label>제목</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <label>내용</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
        <button className="submit-btn" onClick={handleSubmit}>등록하기</button>
      </div>
    </Modal>
  );
}

// ============================================
// 과제 출제 모달
// ============================================
function AssignmentCreateModal({ track, onClose, onCreated }: { track: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", content: "", deadline: "" });

  const handleSubmit = async () => {
    if (!form.title || !form.content || !form.deadline) { alert("모든 항목을 입력하세요."); return; }
    await createAssignment({ ...form, track });
    onCreated();
  };

  return (
    <Modal onClose={onClose} title="과제 출제">
      <div className="create-form">
        <label>과제명</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label>내용</label>
        <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} />
        <label>제출기한</label>
        <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        <button className="submit-btn" onClick={handleSubmit}>출제하기</button>
      </div>
    </Modal>
  );
}

// ============================================
// 공지 작성 모달
// ============================================
function AnnouncementCreateModal({ track, onClose, onCreated }: { track: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!title || !content) { alert("제목과 내용을 입력하세요."); return; }
    await createAnnouncement({ track, title, content });
    onCreated();
  };

  return (
    <Modal onClose={onClose} title="공지 작성">
      <div className="create-form">
        <label>제목</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <label>내용</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
        <button className="submit-btn" onClick={handleSubmit}>등록하기</button>
      </div>
    </Modal>
  );
}
