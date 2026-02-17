import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../api/projects";
import type { Project } from "../api/projects";
import "./AdminProjects.css";

export default function AdminProjects() {
  const nav = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // 등록 폼
  const [title, setTitle] = useState("");
  const [generation, setGeneration] = useState("");
  const [description, setDescription] = useState("");
  const [detail, setDetail] = useState("");
  const [techStack, setTechStack] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [teamMembers, setTeamMembers] = useState("");
  const [order, setOrder] = useState("0");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  async function load() {
    try {
      const data = await fetchAllProjects();
      setProjects(data);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!title || !generation || !thumbnail || !pdfFile) {
      alert("프로젝트명, 기수, 썸네일, PDF 파일은 필수입니다.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("generation", generation);
      fd.append("description", description);
      fd.append("detail", detail);
      fd.append("tech_stack", techStack);
      fd.append("github_url", githubUrl);
      fd.append("team_members", teamMembers);
      fd.append("order", order);
      fd.append("thumbnail", thumbnail);
      fd.append("pdf_file", pdfFile);
      await createProject(fd);
      // 초기화
      setTitle("");
      setGeneration("");
      setDescription("");
      setDetail("");
      setTechStack("");
      setGithubUrl("");
      setTeamMembers("");
      setOrder("0");
      setThumbnail(null);
      setPdfFile(null);
      // 파일 input 초기화
      const inputs = document.querySelectorAll<HTMLInputElement>('.ap-form input[type="file"]');
      inputs.forEach((el) => { el.value = ""; });
      await load();
    } catch {
      alert("등록 실패");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleVisible(p: Project) {
    const fd = new FormData();
    fd.append("is_visible", String(!p.is_visible));
    await updateProject(p.id, fd);
    await load();
  }

  async function handleDelete(id: number) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deleteProject(id);
    await load();
  }

  return (
    <div className="ap-root">
      <div className="ap-inner">
        <button className="ap-back" type="button" onClick={() => nav("/admin")}>
          ← 대시보드
        </button>
        <div className="ap-title">프로젝트 관리</div>
        <div className="ap-sub">프로젝트를 등록·수정·삭제합니다.</div>

        {/* 등록 폼 */}
        <div className="ap-card">
          <h3>프로젝트 등록</h3>
          <div className="ap-form">
            <div className="ap-row">
              <input placeholder="프로젝트명 *" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input placeholder="기수 (숫자) *" type="number" value={generation} onChange={(e) => setGeneration(e.target.value)} style={{ width: 120 }} />
              <input placeholder="정렬 순서" type="number" value={order} onChange={(e) => setOrder(e.target.value)} style={{ width: 100 }} />
            </div>
            <input placeholder="한 줄소개" value={description} onChange={(e) => setDescription(e.target.value)} />
            <textarea placeholder="서비스 상세 설명" value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} />
            <input placeholder="기술 스택 (쉼표 구분: React, Spring, ...)" value={techStack} onChange={(e) => setTechStack(e.target.value)} />
            <input placeholder="깃허브 URL" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
            <input placeholder="팀원 (쉼표 구분: 김철수, 이영희, ...)" value={teamMembers} onChange={(e) => setTeamMembers(e.target.value)} />
            <div className="ap-row">
              <label className="ap-file-label">
                썸네일 이미지 *
                <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)} />
              </label>
              <label className="ap-file-label">
                발표 PDF *
                <input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <button className="ap-btn" type="button" onClick={handleCreate} disabled={loading}>
              {loading ? "등록 중..." : "등록"}
            </button>
          </div>
        </div>

        {/* 프로젝트 목록 */}
        <div className="ap-card">
          <h3>프로젝트 목록 ({projects.length})</h3>
          <table className="ap-table">
            <thead>
              <tr>
                <th>기수</th>
                <th>프로젝트명</th>
                <th>순서</th>
                <th>공개</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>{p.generation}기</td>
                  <td>{p.title}</td>
                  <td>{p.order}</td>
                  <td>
                    <button
                      className={`ap-toggle ${p.is_visible ? "on" : "off"}`}
                      type="button"
                      onClick={() => handleToggleVisible(p)}
                    >
                      {p.is_visible ? "공개" : "비공개"}
                    </button>
                  </td>
                  <td>
                    <button className="ap-del" type="button" onClick={() => handleDelete(p.id)}>삭제</button>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={5} className="ap-empty">프로젝트가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
