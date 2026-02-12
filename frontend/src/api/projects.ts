import { apiFetch } from "./client";

export interface Project {
  id: number;
  title: string;
  generation: number;
  description: string;
  detail: string;
  tech_stack: string;
  github_url: string;
  team_members: string;
  thumbnail_url: string | null;
  pdf_url: string | null;
  order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export function fetchProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects/");
}

export function fetchAllProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects/?all=true");
}

export function createProject(payload: FormData): Promise<Project> {
  return apiFetch<Project>("/api/projects/", {
    method: "POST",
    body: payload,
  });
}

export function updateProject(id: number, payload: FormData): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${id}/`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteProject(id: number): Promise<void> {
  return apiFetch<void>(`/api/projects/${id}/`, { method: "DELETE" });
}
