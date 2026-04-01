import { apiFetch } from "./client";

// ── Track mapping (frontend label → DB value) ──

export const TRACK_TO_DB: Record<string, string> = {
  FULLSTACK: "FULLSTACK",
  AI: "AI_SERVER",
  PLANNING: "PLANNING_DESIGN",
};

// ── Types ────────────────────────────────

export interface QuizItem {
  id: number;
  track: string;
  title: string;
  question: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  option_5: string;
  correct_option?: number; // INSTRUCTOR only
  created_by_name: string;
  created_at: string;
  my_answer: { selected_option: number; is_correct: boolean } | null;
}

export interface QuizAnswerResult {
  selected_option: number;
  correct_option: number;
  is_correct: boolean;
}

export interface QnAPostItem {
  id: number;
  track: string;
  title: string;
  author_name: string;
  comment_count: number;
  created_at: string;
}

export interface QnAComment {
  id: number;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
}

export interface QnAPostDetail {
  id: number;
  track: string;
  title: string;
  content: string;
  author_name: string;
  comments: QnAComment[];
  created_at: string;
}

export interface SubmissionItem {
  id: number;
  student_name: string;
  link: string;
  submitted_at: string;
  is_read: boolean;
  read_at: string | null;
  read_by_name: string | null;
}

export interface AssignmentItem {
  id: number;
  track: string;
  title: string;
  content: string;
  deadline: string;
  created_by_name: string;
  created_at: string;
  my_submission: SubmissionItem | null;
  submissions?: SubmissionItem[];
}

export interface AnnouncementItem {
  id: number;
  track: string;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
}

// ── Quiz API ─────────────────────────────

export function fetchQuizzes(track: string) {
  return apiFetch<QuizItem[]>(`/api/sessions/quizzes/?track=${track}`);
}

export function fetchQuizDetail(id: number) {
  return apiFetch<QuizItem>(`/api/sessions/quizzes/${id}/`);
}

export function submitQuizAnswer(quizId: number, selectedOption: number) {
  return apiFetch<QuizAnswerResult>(`/api/sessions/quizzes/${quizId}/answer/`, {
    method: "POST",
    body: JSON.stringify({ selected_option: selectedOption }),
  });
}

export function createQuiz(data: {
  track: string;
  title: string;
  question: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  option_5: string;
  correct_option: number;
}) {
  return apiFetch<QuizItem>("/api/sessions/quizzes/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Q&A API ──────────────────────────────

export function fetchQnAPosts(track: string) {
  return apiFetch<QnAPostItem[]>(`/api/sessions/qna/?track=${track}`);
}

export function fetchQnADetail(id: number) {
  return apiFetch<QnAPostDetail>(`/api/sessions/qna/${id}/`);
}

export function createQnAPost(data: { track: string; title: string; content: string }) {
  return apiFetch<QnAPostItem>("/api/sessions/qna/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createQnAComment(postId: number, content: string) {
  return apiFetch<QnAComment>(`/api/sessions/qna/${postId}/comments/`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

// ── Assignment API ───────────────────────

export function fetchAssignments(track: string) {
  return apiFetch<AssignmentItem[]>(`/api/sessions/assignments/?track=${track}`);
}

export function fetchAssignmentDetail(id: number) {
  return apiFetch<AssignmentItem>(`/api/sessions/assignments/${id}/`);
}

export function createAssignment(data: {
  track: string;
  title: string;
  content: string;
  deadline: string;
}) {
  return apiFetch<AssignmentItem>("/api/sessions/assignments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function submitAssignment(assignmentId: number, link: string) {
  return apiFetch<SubmissionItem>(`/api/sessions/assignments/${assignmentId}/submit/`, {
    method: "POST",
    body: JSON.stringify({ link }),
  });
}

export function markSubmissionRead(submissionId: number) {
  return apiFetch<SubmissionItem>(`/api/sessions/submissions/${submissionId}/read/`, {
    method: "PATCH",
  });
}

// ── Announcement API ─────────────────────

export function fetchAnnouncements(track: string) {
  return apiFetch<AnnouncementItem[]>(`/api/sessions/announcements/?track=${track}`);
}

export function createAnnouncement(data: { track: string; title: string; content: string }) {
  return apiFetch<AnnouncementItem>("/api/sessions/announcements/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Attendance API ────────────────────────

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export interface AttendanceRecordItem {
  id: number;
  student_id: number;
  student_name: string;
  status: AttendanceStatus;
  marked_at: string;
}

export interface AttendanceSessionItem {
  id: number;
  track: string;
  title: string;
  date: string;
  created_by_name: string;
  created_at: string;
}

export interface AttendanceSessionDetail extends AttendanceSessionItem {
  records: AttendanceRecordItem[];
}

export function fetchAttendanceSessions(track: string) {
  return apiFetch<AttendanceSessionItem[]>(`/api/sessions/attendance/?track=${track}`);
}

export function createAttendanceSession(data: { track: string; title: string; date: string }) {
  return apiFetch<AttendanceSessionDetail>("/api/sessions/attendance/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function fetchAttendanceSessionDetail(id: number) {
  return apiFetch<AttendanceSessionDetail>(`/api/sessions/attendance/${id}/`);
}

export function markAttendance(sessionId: number, studentId: number, status: AttendanceStatus) {
  return apiFetch<AttendanceRecordItem>(`/api/sessions/attendance/${sessionId}/mark/`, {
    method: "PATCH",
    body: JSON.stringify({ student_id: studentId, status }),
  });
}

// ── Groups API ────────────────────────────

export interface StudentItem {
  id: number;
  name: string;
  email: string;
  groups: { id: number; name: string }[];
}

export interface GroupItem {
  id: number;
  track: string;
  name: string;
  members: { id: number; name: string; email: string }[];
  member_count: number;
  created_by_name: string;
  created_at: string;
}

export function fetchGroups(track: string) {
  return apiFetch<GroupItem[]>(`/api/sessions/groups/?track=${track}`);
}

export function createGroup(data: { track: string; name: string }) {
  return apiFetch<GroupItem>("/api/sessions/groups/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteGroup(id: number) {
  return apiFetch<void>(`/api/sessions/groups/${id}/`, { method: "DELETE" });
}

export function updateGroupMembers(id: number, memberIds: number[]) {
  return apiFetch<GroupItem>(`/api/sessions/groups/${id}/members/`, {
    method: "PATCH",
    body: JSON.stringify({ member_ids: memberIds }),
  });
}

export function fetchTrackStudents(track: string) {
  return apiFetch<StudentItem[]>(`/api/sessions/students/?track=${track}`);
}

// ── ClassReview API (수업 감상평 - 학생이 작성) ───────────────────────────

export interface ClassReviewItem {
  id: number;
  author_id: number;
  author_name: string;
  track: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function fetchClassReviews(track: string) {
  return apiFetch<ClassReviewItem[]>(`/api/sessions/class-reviews/?track=${track}`);
}

export function createClassReview(track: string, content: string) {
  return apiFetch<ClassReviewItem>("/api/sessions/class-reviews/", {
    method: "POST",
    body: JSON.stringify({ track, content }),
  });
}

export function deleteClassReview(id: number) {
  return apiFetch<void>(`/api/sessions/class-reviews/${id}/`, { method: "DELETE" });
}

export function fetchMyClassReviews() {
  return apiFetch<ClassReviewItem[]>("/api/sessions/class-reviews/my/");
}

// ── Homework Gallery API (과제 갤러리 - PDF 제출) ──────────────

export interface HomeworkSubmissionItem {
  id: number;
  student_id: number;
  student_name: string;
  pdf_url: string;
  submitted_at: string;
}

export interface HomeworkCategoryItem {
  id: number;
  track: string;
  title: string;
  week: number;
  created_by_name: string;
  created_at: string;
  submission_count: number;
  submissions: HomeworkSubmissionItem[];
  my_submission: HomeworkSubmissionItem | null;
}

export function fetchHomeworkCategories(track: string) {
  return apiFetch<HomeworkCategoryItem[]>(`/api/sessions/homework-categories/?track=${track}`);
}

export function createHomeworkCategory(data: { track: string; title: string; week: number }) {
  return apiFetch<HomeworkCategoryItem>("/api/sessions/homework-categories/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteHomeworkCategory(id: number) {
  return apiFetch<void>(`/api/sessions/homework-categories/${id}/`, { method: "DELETE" });
}

export function submitHomeworkPdf(categoryId: number, file: File) {
  const formData = new FormData();
  formData.append("pdf_file", file);
  return apiFetch<HomeworkSubmissionItem>(`/api/sessions/homework-categories/${categoryId}/submit/`, {
    method: "POST",
    body: formData,
  });
}

export function deleteHomeworkSubmission(id: number) {
  return apiFetch<void>(`/api/sessions/homework-submissions/${id}/`, { method: "DELETE" });
}
