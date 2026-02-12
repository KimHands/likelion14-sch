export type Role = "APPLICANT" | "STUDENT" | "INSTRUCTOR";
export type Track = "FRONTEND" | "BACKEND" | "AI" | "PLANNING";

export interface MeResponse {
  id: number;
  email: string;
  role: Role;
  email_verified: boolean;
  name: String;
  track?: Track; // STUDENT인 경우에만 존재
}