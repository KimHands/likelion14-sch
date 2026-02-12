import { apiFetch } from "./client";

// ── Track mapping (frontend label → DB value) ──

export const TRACK_TO_DB: Record<string, string> = {
  FRONTEND: "FRONTEND",
  BACKEND: "BACKEND",
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
