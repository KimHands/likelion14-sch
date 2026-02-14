import { apiFetch } from "./client";

export interface RoadmapItem {
  id: number;
  half: "TOP" | "BOTTOM";
  row: number;
  col_start: number;
  col_span: number;
  label: string;
  bg_color: string;
  text_color: string;
  order: number;
}

export function fetchRoadmapItems(): Promise<RoadmapItem[]> {
  return apiFetch<RoadmapItem[]>("/api/roadmap/");
}

export function fetchAdminRoadmapItems(): Promise<RoadmapItem[]> {
  return apiFetch<RoadmapItem[]>("/api/roadmap/admin/");
}

export function createRoadmapItem(
  payload: Omit<RoadmapItem, "id">
): Promise<RoadmapItem> {
  return apiFetch<RoadmapItem>("/api/roadmap/admin/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRoadmapItem(
  id: number,
  payload: Partial<Omit<RoadmapItem, "id">>
): Promise<RoadmapItem> {
  return apiFetch<RoadmapItem>(`/api/roadmap/admin/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteRoadmapItem(id: number): Promise<void> {
  return apiFetch<void>(`/api/roadmap/admin/${id}/`, { method: "DELETE" });
}
