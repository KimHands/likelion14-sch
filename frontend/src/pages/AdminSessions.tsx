import { useState, useEffect, useCallback } from "react";
import {
  TRACK_TO_DB,
  fetchQuizzes, createQuiz,
  fetchQnAPosts, fetchQnADetail, createQnAComment,
  fetchAssignments, fetchAssignmentDetail, createAssignment,
  markSubmissionRead,
  fetchAnnouncements, createAnnouncement,
  type QuizItem, type QnAPostItem, type QnAPostDetail,
  type AssignmentItem, type SubmissionItem, type AnnouncementItem,
} from "../api/sessions";
import "./AdminSessions.css";

type AdminTab = "frontend" | "backend" | "ai" | "planning";

export default function AdminSessions() {
  const [tab, setTab] = useState<AdminTab>("frontend");

  return (
    <div className="adminSessions-root">
      <div className="adminSessions-inner">
        <div className="adminSessions-title">교육 세션 관리</div>
        <div className="adminSessions-sub">
          트랙별 퀴즈, Q&A, 과제, 공지를 관리합니다.
        </div>

        <div className="admin-tabs">
          {(["frontend", "backend", "ai", "planning"] as AdminTab[]).map((t) => (
            <button
              key={t}
              className={`admin-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {{ frontend: "프론트엔드", backend: "백엔드", ai: "AI", planning: "기획/디자인" }[t]}
            </button>
          ))}
        </div>

        {(tab === "frontend" || tab === "backend") && (
          <QuizQnAAdmin trackLabel={tab === "frontend" ? "FRONTEND" : "BACKEND"} />
        )}
        {(tab === "ai" || tab === "planning") && (
          <AssignmentAdmin
            trackLabel={tab === "ai" ? "AI" : "PLANNING"}
            showReadStatus={tab === "planning"}
          />
        )}
      </div>
    </div>
  );
}

// ── 프론트/백엔드 관리 ──

function QuizQnAAdmin({ trackLabel }: { trackLabel: string }) {
  const dbTrack = TRACK_TO_DB[trackLabel];

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [qnaPosts, setQnaPosts] = useState<QnAPostItem[]>([]);
  const [selectedPost, setSelectedPost] = useState<QnAPostDetail | null>(null);
  const [commentText, setCommentText] = useState("");

  // Quiz create form
  const [quizForm, setQuizForm] = useState({
    title: "", question: "",
    option_1: "", option_2: "", option_3: "", option_4: "", option_5: "",
    correct_option: 1,
  });

  const loadData = useCallback(() => {
    fetchQuizzes(dbTrack).then(setQuizzes).catch(() => {});
    fetchQnAPosts(dbTrack).then(setQnaPosts).catch(() => {});
  }, [dbTrack]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateQuiz = async () => {
    if (!quizForm.title || !quizForm.question || !quizForm.option_1 || !quizForm.option_2) {
      alert("필수 항목을 입력하세요."); return;
    }
    await createQuiz({ ...quizForm, track: dbTrack });
    setQuizForm({ title: "", question: "", option_1: "", option_2: "", option_3: "", option_4: "", option_5: "", correct_option: 1 });
    loadData();
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
    <div className="admin-section">
      {/* 퀴즈 출제 */}
      <div className="admin-card">
        <h3>퀴즈 출제</h3>
        <div className="admin-form">
          <input placeholder="제목" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} />
          <textarea placeholder="문제 내용" value={quizForm.question} onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })} />
          {[1, 2, 3, 4, 5].map((n) => (
            <input
              key={n}
              placeholder={`선택지 ${n}${n <= 2 ? " (필수)" : ""}`}
              value={quizForm[`option_${n}` as keyof typeof quizForm] as string}
              onChange={(e) => setQuizForm({ ...quizForm, [`option_${n}`]: e.target.value })}
            />
          ))}
          <div className="form-inline">
            <label>정답:</label>
            <select value={quizForm.correct_option} onChange={(e) => setQuizForm({ ...quizForm, correct_option: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}번</option>)}
            </select>
            <button className="admin-btn" onClick={handleCreateQuiz}>출제</button>
          </div>
        </div>
      </div>

      {/* 퀴즈 목록 */}
      <div className="admin-card">
        <h3>퀴즈 목록 ({quizzes.length})</h3>
        <table className="admin-table">
          <thead><tr><th>제목</th><th>정답</th><th>출제일</th></tr></thead>
          <tbody>
            {quizzes.map((q) => (
              <tr key={q.id}>
                <td>{q.title}</td>
                <td>{q.correct_option}번</td>
                <td>{new Date(q.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {quizzes.length === 0 && <tr><td colSpan={3} className="empty-text">퀴즈가 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Q&A 목록 */}
      <div className="admin-card">
        <h3>Q&A 게시판 ({qnaPosts.length})</h3>
        <table className="admin-table">
          <thead><tr><th>작성자</th><th>제목</th><th>답변</th><th>날짜</th></tr></thead>
          <tbody>
            {qnaPosts.map((p) => (
              <tr key={p.id} onClick={() => handleOpenPost(p.id)} className="clickable">
                <td>{p.author_name}</td>
                <td>{p.title}</td>
                <td>{p.comment_count}</td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {qnaPosts.length === 0 && <tr><td colSpan={4} className="empty-text">게시글이 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Q&A 상세 + 답변 */}
      {selectedPost && (
        <div className="admin-card highlight">
          <div className="admin-card-header">
            <h3>{selectedPost.title}</h3>
            <button className="close-btn" onClick={() => setSelectedPost(null)}>&times;</button>
          </div>
          <p className="post-meta">{selectedPost.author_name} | {new Date(selectedPost.created_at).toLocaleDateString()}</p>
          <div className="post-content">{selectedPost.content}</div>
          <div className="comments-list">
            <h4>답변 ({selectedPost.comments.length})</h4>
            {selectedPost.comments.map((c) => (
              <div key={c.id} className={`admin-comment ${c.author_role === "INSTRUCTOR" ? "instructor" : ""}`}>
                <span className="comment-name">{c.author_name} {c.author_role === "INSTRUCTOR" && "(교육자)"}</span>
                <p>{c.content}</p>
              </div>
            ))}
          </div>
          <div className="admin-reply">
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="답변을 입력하세요..." />
            <button className="admin-btn" onClick={handleAddComment}>답변 작성</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI/서버, 기획/디자인 관리 ──

function AssignmentAdmin({ trackLabel, showReadStatus }: { trackLabel: string; showReadStatus: boolean }) {
  const dbTrack = TRACK_TO_DB[trackLabel];

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);

  // Create forms
  const [assignForm, setAssignForm] = useState({ title: "", content: "", deadline: "" });
  const [announceForm, setAnnounceForm] = useState({ title: "", content: "" });

  const loadData = useCallback(() => {
    fetchAssignments(dbTrack).then(setAssignments).catch(() => {});
    fetchAnnouncements(dbTrack).then(setAnnouncements).catch(() => {});
  }, [dbTrack]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateAssignment = async () => {
    if (!assignForm.title || !assignForm.content || !assignForm.deadline) {
      alert("모든 항목을 입력하세요."); return;
    }
    await createAssignment({ ...assignForm, track: dbTrack });
    setAssignForm({ title: "", content: "", deadline: "" });
    loadData();
  };

  const handleCreateAnnouncement = async () => {
    if (!announceForm.title || !announceForm.content) {
      alert("제목과 내용을 입력하세요."); return;
    }
    await createAnnouncement({ ...announceForm, track: dbTrack });
    setAnnounceForm({ title: "", content: "" });
    loadData();
  };

  const handleViewSubmissions = async (id: number) => {
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
    <div className="admin-section">
      {/* 과제 출제 */}
      <div className="admin-card">
        <h3>과제 출제</h3>
        <div className="admin-form">
          <input placeholder="과제명" value={assignForm.title} onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })} />
          <textarea placeholder="과제 내용" value={assignForm.content} onChange={(e) => setAssignForm({ ...assignForm, content: e.target.value })} />
          <div className="form-inline">
            <label>제출기한:</label>
            <input type="datetime-local" value={assignForm.deadline} onChange={(e) => setAssignForm({ ...assignForm, deadline: e.target.value })} />
            <button className="admin-btn" onClick={handleCreateAssignment}>출제</button>
          </div>
        </div>
      </div>

      {/* 과제 목록 */}
      <div className="admin-card">
        <h3>과제 목록 ({assignments.length})</h3>
        <table className="admin-table">
          <thead><tr><th>과제명</th><th>제출기한</th><th>출제일</th><th>제출물</th></tr></thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{new Date(a.deadline).toLocaleString()}</td>
                <td>{new Date(a.created_at).toLocaleDateString()}</td>
                <td><button className="admin-btn small" onClick={() => handleViewSubmissions(a.id)}>확인</button></td>
              </tr>
            ))}
            {assignments.length === 0 && <tr><td colSpan={4} className="empty-text">과제가 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* 제출물 확인 */}
      {selectedAssignment && selectedAssignment.submissions && (
        <div className="admin-card highlight">
          <div className="admin-card-header">
            <h3>제출물: {selectedAssignment.title}</h3>
            <button className="close-btn" onClick={() => setSelectedAssignment(null)}>&times;</button>
          </div>
          <table className="admin-table">
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
                  <td><a href={s.link} target="_blank" rel="noreferrer">{s.link}</a></td>
                  <td>{new Date(s.submitted_at).toLocaleDateString()}</td>
                  {showReadStatus && (
                    <td>
                      {s.is_read ? (
                        <span className="read-tag">읽음 ({s.read_by_name})</span>
                      ) : (
                        <button className="admin-btn small" onClick={() => handleMarkRead(s.id)}>읽음 표시</button>
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
        </div>
      )}

      {/* 공지 작성 */}
      <div className="admin-card">
        <h3>공지 작성</h3>
        <div className="admin-form">
          <input placeholder="제목" value={announceForm.title} onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })} />
          <textarea placeholder="내용" value={announceForm.content} onChange={(e) => setAnnounceForm({ ...announceForm, content: e.target.value })} />
          <button className="admin-btn" onClick={handleCreateAnnouncement}>공지 등록</button>
        </div>
      </div>

      {/* 공지 목록 */}
      <div className="admin-card">
        <h3>공지 목록 ({announcements.length})</h3>
        {announcements.map((a) => (
          <div key={a.id} className="announce-item">
            <strong>{a.title}</strong>
            <span className="announce-meta">{a.author_name} | {new Date(a.created_at).toLocaleDateString()}</span>
            <p>{a.content}</p>
          </div>
        ))}
        {announcements.length === 0 && <p className="empty-text">공지가 없습니다.</p>}
      </div>
    </div>
  );
}
