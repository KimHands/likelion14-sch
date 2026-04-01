import { useState, useEffect, useCallback } from "react";
import {
  TRACK_TO_DB,
  fetchQuizzes, createQuiz,
  fetchQnAPosts, fetchQnADetail, createQnAComment,
  fetchAssignments, fetchAssignmentDetail, createAssignment,
  markSubmissionRead,
  fetchAnnouncements, createAnnouncement,
  fetchAttendanceSessions, createAttendanceSession, fetchAttendanceSessionDetail, markAttendance,
  fetchGroups, createGroup, deleteGroup, updateGroupMembers, fetchTrackStudents, fetchClassReviews,
  fetchHomeworkCategories, createHomeworkCategory, deleteHomeworkCategory,
  type QuizItem, type QnAPostItem, type QnAPostDetail,
  type AssignmentItem, type SubmissionItem, type AnnouncementItem,
  type AttendanceSessionItem, type AttendanceSessionDetail, type AttendanceStatus,
  type GroupItem, type StudentItem, type ClassReviewItem,
  type HomeworkCategoryItem,
} from "../api/sessions";
import "./AdminSessions.css";

type AdminTab = "fullstack" | "ai" | "planning";

export default function AdminSessions() {
  const [tab, setTab] = useState<AdminTab>("fullstack");

  return (
    <div className="adminSessions-root">
      <div className="adminSessions-inner">
        <div className="adminSessions-title">교육 세션 관리</div>
        <div className="adminSessions-sub">
          트랙별 퀴즈, Q&A, 과제, 공지, 출석부를 관리합니다.
        </div>

        <div className="admin-tabs">
          {(["fullstack", "ai", "planning"] as AdminTab[]).map((t) => (
            <button
              key={t}
              className={`admin-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {{ fullstack: "풀스택", ai: "AI", planning: "기획/디자인" }[t]}
            </button>
          ))}
        </div>

        {tab === "fullstack" && <QuizQnAAdmin trackLabel="FULLSTACK" />}
        {(tab === "ai" || tab === "planning") && (
          <AssignmentAdmin
            trackLabel={tab === "ai" ? "AI" : "PLANNING"}
            showReadStatus={tab === "planning"}
          />
        )}

        {/* 출석부는 모든 탭에서 공통으로 제공 */}
        <AttendanceAdmin trackLabel={
          tab === "fullstack" ? "FULLSTACK" : tab === "ai" ? "AI" : "PLANNING"
        } />

        {/* 그룹 관리 & 수업 감상평 & 과제 갤러리는 풀스택 탭에서만 */}
        {tab === "fullstack" && <GroupAdmin />}
        {tab === "fullstack" && <HomeworkCategoryAdmin />}
        {tab === "fullstack" && <ClassReviewAdmin />}
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

// ── 출석부 관리 ──

function AttendanceAdmin({ trackLabel }: { trackLabel: string }) {
  const dbTrack = TRACK_TO_DB[trackLabel];

  const [sessions, setSessions] = useState<AttendanceSessionItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<AttendanceSessionDetail | null>(null);
  const [createForm, setCreateForm] = useState({ title: "", date: "" });

  const loadSessions = useCallback(() => {
    fetchAttendanceSessions(dbTrack).then(setSessions).catch(() => {});
  }, [dbTrack]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleCreateSession = async () => {
    if (!createForm.title || !createForm.date) {
      alert("세션명과 날짜를 입력하세요."); return;
    }
    await createAttendanceSession({ track: dbTrack, ...createForm });
    setCreateForm({ title: "", date: "" });
    loadSessions();
  };

  const handleViewSession = async (id: number) => {
    const detail = await fetchAttendanceSessionDetail(id);
    setSelectedSession(detail);
  };

  const handleMarkAttendance = async (studentId: number, status: AttendanceStatus) => {
    if (!selectedSession) return;
    await markAttendance(selectedSession.id, studentId, status);
    const detail = await fetchAttendanceSessionDetail(selectedSession.id);
    setSelectedSession(detail);
  };

  const statusLabel: Record<AttendanceStatus, string> = {
    PRESENT: "출석",
    ABSENT: "결석",
    LATE: "지각",
  };

  const statusClass: Record<AttendanceStatus, string> = {
    PRESENT: "att-present",
    ABSENT: "att-absent",
    LATE: "att-late",
  };

  const presentCount = selectedSession?.records.filter((r) => r.status === "PRESENT").length ?? 0;
  const lateCount = selectedSession?.records.filter((r) => r.status === "LATE").length ?? 0;
  const totalCount = selectedSession?.records.length ?? 0;

  return (
    <div className="admin-section" style={{ marginTop: 32 }}>
      <div className="admin-card">
        <h3>출석부 관리</h3>

        {/* 세션 생성 */}
        <div className="admin-form">
          <div className="form-inline">
            <input
              placeholder="세션명 (예: 1주차 세션)"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              style={{ flex: 2 }}
            />
            <input
              type="date"
              value={createForm.date}
              onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
              style={{ flex: 1 }}
            />
            <button className="admin-btn" onClick={handleCreateSession}>세션 생성</button>
          </div>
        </div>

        {/* 세션 목록 */}
        <table className="admin-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>세션명</th><th>날짜</th><th>생성자</th><th>출석부</th></tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>{s.date}</td>
                <td>{s.created_by_name}</td>
                <td>
                  <button className="admin-btn small" onClick={() => handleViewSession(s.id)}>
                    출석 확인
                  </button>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan={4} className="empty-text">생성된 세션이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 출석부 상세 */}
      {selectedSession && (
        <div className="admin-card highlight">
          <div className="admin-card-header">
            <h3>출석부: {selectedSession.title} ({selectedSession.date})</h3>
            <button className="close-btn" onClick={() => setSelectedSession(null)}>&times;</button>
          </div>
          <p className="post-meta">
            출석 {presentCount} / 지각 {lateCount} / 전체 {totalCount}
          </p>
          <table className="admin-table">
            <thead>
              <tr><th>이름</th><th>상태</th><th>변경</th></tr>
            </thead>
            <tbody>
              {selectedSession.records.map((r) => (
                <tr key={r.id}>
                  <td>{r.student_name}</td>
                  <td>
                    <span className={`att-badge ${statusClass[r.status]}`}>
                      {statusLabel[r.status]}
                    </span>
                  </td>
                  <td>
                    <div className="att-btn-group">
                      {(["PRESENT", "LATE", "ABSENT"] as AttendanceStatus[]).map((s) => (
                        <button
                          key={s}
                          className={`admin-btn small ${r.status === s ? "active" : ""}`}
                          onClick={() => handleMarkAttendance(r.student_id, s)}
                          disabled={r.status === s}
                        >
                          {statusLabel[s]}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {selectedSession.records.length === 0 && (
                <tr><td colSpan={3} className="empty-text">등록된 학생이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── 그룹 관리 ──

function GroupAdmin() {
  const dbTrack = TRACK_TO_DB["FULLSTACK"];

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<GroupItem | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());

  const load = useCallback(() => {
    fetchGroups(dbTrack).then(setGroups).catch(() => {});
    fetchTrackStudents(dbTrack).then(setStudents).catch(() => {});
  }, [dbTrack]);

  useEffect(() => { load(); }, [load]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) { alert("그룹명을 입력하세요."); return; }
    await createGroup({ track: dbTrack, name: newGroupName.trim() });
    setNewGroupName("");
    load();
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm("그룹을 삭제하시겠습니까?")) return;
    await deleteGroup(id);
    load();
  };

  const openEdit = (group: GroupItem) => {
    setEditingGroup(group);
    setSelectedMemberIds(new Set(group.members.map((m) => m.id)));
  };

  const toggleMember = (id: number) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSaveMembers = async () => {
    if (!editingGroup) return;
    await updateGroupMembers(editingGroup.id, Array.from(selectedMemberIds));
    setEditingGroup(null);
    load();
  };

  return (
    <div className="admin-section" style={{ marginTop: 32 }}>
      <div className="admin-card">
        <h3>그룹 관리</h3>

        <div className="admin-form">
          <div className="form-inline">
            <input
              placeholder="그룹명 (예: 1팀)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              style={{ flex: 2 }}
            />
            <button className="admin-btn" onClick={handleCreateGroup}>그룹 생성</button>
          </div>
        </div>

        <table className="admin-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>그룹명</th><th>인원</th><th>멤버</th><th>관리</th></tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id}>
                <td>{g.name}</td>
                <td>{g.member_count}명</td>
                <td className="post-meta">{g.members.map((m) => m.name).join(", ") || "—"}</td>
                <td>
                  <div className="att-btn-group">
                    <button className="admin-btn small" onClick={() => openEdit(g)}>멤버 편집</button>
                    <button className="admin-btn small" onClick={() => handleDeleteGroup(g.id)}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr><td colSpan={4} className="empty-text">생성된 그룹이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editingGroup && (
        <div className="admin-card highlight">
          <div className="admin-card-header">
            <h3>"{editingGroup.name}" 멤버 편집</h3>
            <button className="close-btn" onClick={() => setEditingGroup(null)}>&times;</button>
          </div>
          <p className="post-meta">체크된 학생이 해당 그룹에 포함됩니다.</p>
          <div className="group-member-grid">
            {students.map((s) => (
              <label key={s.id} className="group-member-item">
                <input
                  type="checkbox"
                  checked={selectedMemberIds.has(s.id)}
                  onChange={() => toggleMember(s.id)}
                />
                <span>{s.name}</span>
                {s.groups.length > 0 && (
                  <span className="post-meta"> ({s.groups.map((g) => g.name).join(", ")})</span>
                )}
              </label>
            ))}
            {students.length === 0 && <p className="empty-text">풀스택 수강생이 없습니다.</p>}
          </div>
          <button className="admin-btn" style={{ marginTop: 12 }} onClick={handleSaveMembers}>저장</button>
        </div>
      )}
    </div>
  );
}

// ── 과제 갤러리 카테고리 관리 ──

function HomeworkCategoryAdmin() {
  const dbTrack = TRACK_TO_DB["FULLSTACK"];
  const [categories, setCategories] = useState<HomeworkCategoryItem[]>([]);
  const [form, setForm] = useState({ title: "", week: 1 });

  const load = useCallback(() => {
    fetchHomeworkCategories(dbTrack).then(setCategories).catch(() => {});
  }, [dbTrack]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title.trim()) { alert("카테고리 제목을 입력하세요."); return; }
    await createHomeworkCategory({ track: dbTrack, title: form.title.trim(), week: form.week });
    setForm({ title: "", week: 1 });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("카테고리를 삭제하시겠습니까? 제출물도 함께 삭제됩니다.")) return;
    await deleteHomeworkCategory(id);
    load();
  };

  return (
    <div className="admin-section" style={{ marginTop: 32 }}>
      <div className="admin-card">
        <h3>과제 갤러리 카테고리 관리</h3>
        <p className="post-meta" style={{ marginBottom: 12 }}>
          풀스택 수강생이 PDF를 제출하는 주차별 카테고리를 관리합니다.
        </p>

        {/* 생성 폼 */}
        <div className="admin-form">
          <div className="form-inline">
            <input
              type="number"
              min={1}
              max={20}
              value={form.week}
              onChange={(e) => setForm({ ...form, week: Number(e.target.value) })}
              style={{ width: 70 }}
              placeholder="주차"
            />
            <input
              placeholder="카테고리 제목 (예: UX 리서치 발표 자료)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ flex: 2 }}
            />
            <button className="admin-btn" onClick={handleCreate}>카테고리 추가</button>
          </div>
        </div>

        {/* 목록 */}
        <table className="admin-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>주차</th><th>제목</th><th>제출 수</th><th>생성일</th><th>삭제</th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.week}주차</td>
                <td>{c.title}</td>
                <td>{c.submission_count}개</td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="admin-btn small" onClick={() => handleDelete(c.id)}>삭제</button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={5} className="empty-text">생성된 카테고리가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 수업 감상평 목록 (교육자 열람용) ──

function ClassReviewAdmin() {
  const dbTrack = TRACK_TO_DB["FULLSTACK"];
  const [reviews, setReviews] = useState<ClassReviewItem[]>([]);

  const load = useCallback(() => {
    fetchClassReviews(dbTrack).then(setReviews).catch(() => {});
  }, [dbTrack]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="admin-section" style={{ marginTop: 32 }}>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>수업 감상평 목록</h3>
          <button className="admin-btn small" onClick={load}>새로고침</button>
        </div>
        <p className="post-meta" style={{ marginBottom: 12 }}>학생들이 수업 후 작성한 감상 및 후기입니다.</p>
        {reviews.length === 0 ? (
          <p className="empty-text">아직 작성된 감상평이 없습니다.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="admin-comment" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="comment-name">{r.author_name}</span>
                <span className="post-meta">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{r.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
