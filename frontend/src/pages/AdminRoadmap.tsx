import { useState, useEffect, useCallback } from "react";
import {
  fetchAdminRoadmapItems,
  createRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
} from "../api/roadmap";
import type { RoadmapItem } from "../api/roadmap";
import "./AdminRoadmap.css";

const EMPTY_FORM = {
  half: "TOP" as "TOP" | "BOTTOM",
  row: 0,
  col_start: 1,
  col_span: 1,
  label: "",
  bg_color: "#F8F8FC",
  text_color: "#000000",
  order: 0,
};

export default function AdminRoadmap() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);

  const load = useCallback(() => {
    fetchAdminRoadmapItems().then(setItems).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!form.label.trim()) {
      alert("텍스트를 입력하세요.");
      return;
    }
    try {
      if (editId !== null) {
        await updateRoadmapItem(editId, form);
      } else {
        await createRoadmapItem(form);
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      load();
    } catch {
      alert("저장에 실패했습니다.");
    }
  };

  const handleEdit = (item: RoadmapItem) => {
    setEditId(item.id);
    setForm({
      half: item.half,
      row: item.row,
      col_start: item.col_start,
      col_span: item.col_span,
      label: item.label,
      bg_color: item.bg_color,
      text_color: item.text_color,
      order: item.order,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteRoadmapItem(id);
      load();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
  };

  // 미리보기용 그룹핑
  const renderPreviewHalf = (half: "TOP" | "BOTTOM") => {
    const halfItems = items.filter((i) => i.half === half);
    const months =
      half === "TOP"
        ? ["1월", "2월", "3월", "4월", "5월", "6월"]
        : ["7월", "8월", "9월", "10월", "11월", "12월"];
    const rows = [...new Set(halfItems.map((i) => i.row))].sort((a, b) => a - b);

    return (
      <div key={half}>
        <div className="preview-half-label">
          {half === "TOP" ? "1~6월" : "7~12월"}
        </div>

        <div className={`preview-row${half === "BOTTOM" ? " bottom" : ""}`}>
          {months.map((m) => (
            <div key={m} className="preview-month">
              <div className="preview-month-label">{m}</div>
              <div className="preview-dot" />
            </div>
          ))}
          <div className="preview-line" />
        </div>

        {rows.map((row) => {
          const rowItems = halfItems.filter((i) => i.row === row);
          return (
            <div key={`${half}-${row}`} className="preview-items">
              {rowItems.map((item) => (
                <div
                  key={item.id}
                  className="preview-item"
                  style={{
                    gridColumn: `${item.col_start} / span ${item.col_span}`,
                    background: item.bg_color,
                    color: item.text_color,
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="adminRoadmap-root">
      <div className="adminRoadmap-inner">
        <div className="adminRoadmap-title">로드맵 관리</div>
        <div className="adminRoadmap-sub">
          메인 페이지 ANNUAL ROADMAP 항목을 관리합니다.
        </div>

        {/* 폼 */}
        <div className="roadmap-form">
          <h3>{editId !== null ? "항목 수정" : "항목 추가"}</h3>

          <div className="roadmap-form-grid">
            <div className="rf-group full">
              <label>텍스트</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="예: 아기사자 모집"
              />
            </div>

            <div className="rf-group">
              <label>구간</label>
              <select
                value={form.half}
                onChange={(e) =>
                  setForm({ ...form, half: e.target.value as "TOP" | "BOTTOM" })
                }
              >
                <option value="TOP">1~6월 (TOP)</option>
                <option value="BOTTOM">7~12월 (BOTTOM)</option>
              </select>
            </div>

            <div className="rf-group">
              <label>행 (0=메인, 1+=상세)</label>
              <input
                type="number"
                min={0}
                value={form.row}
                onChange={(e) =>
                  setForm({ ...form, row: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="rf-group">
              <label>시작 열 (1~6)</label>
              <input
                type="number"
                min={1}
                max={6}
                value={form.col_start}
                onChange={(e) =>
                  setForm({ ...form, col_start: parseInt(e.target.value) || 1 })
                }
              />
            </div>

            <div className="rf-group">
              <label>열 너비 (1~6)</label>
              <input
                type="number"
                min={1}
                max={6}
                value={form.col_span}
                onChange={(e) =>
                  setForm({ ...form, col_span: parseInt(e.target.value) || 1 })
                }
              />
            </div>

            <div className="rf-group">
              <label>정렬 순서</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="rf-group">
              <label>배경색</label>
              <div className="rf-color-row">
                <input
                  type="color"
                  value={form.bg_color}
                  onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                />
                <input
                  type="text"
                  value={form.bg_color}
                  onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                />
              </div>
            </div>

            <div className="rf-group">
              <label>글자색</label>
              <div className="rf-color-row">
                <input
                  type="color"
                  value={form.text_color}
                  onChange={(e) =>
                    setForm({ ...form, text_color: e.target.value })
                  }
                />
                <input
                  type="text"
                  value={form.text_color}
                  onChange={(e) =>
                    setForm({ ...form, text_color: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="roadmap-form-actions">
            <button className="rf-submit" type="button" onClick={handleSubmit}>
              {editId !== null ? "수정 저장" : "추가"}
            </button>
            {editId !== null && (
              <button className="rf-cancel" type="button" onClick={handleCancel}>
                취소
              </button>
            )}
          </div>
        </div>

        {/* 미리보기 */}
        <div className="roadmap-preview">
          <h3>미리보기</h3>
          <div className="preview-card">
            {renderPreviewHalf("TOP")}
            {renderPreviewHalf("BOTTOM")}
          </div>
        </div>

        {/* 테이블 */}
        <div className="roadmap-table-section">
          <h3>항목 목록</h3>
          <table className="roadmap-table">
            <thead>
              <tr>
                <th>구간</th>
                <th>행</th>
                <th>시작열</th>
                <th>너비</th>
                <th>텍스트</th>
                <th>배경색</th>
                <th>글자색</th>
                <th>순서</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.half === "TOP" ? "1~6월" : "7~12월"}</td>
                  <td>{item.row}</td>
                  <td>{item.col_start}</td>
                  <td>{item.col_span}</td>
                  <td>{item.label}</td>
                  <td>
                    <span
                      className="rt-color-swatch"
                      style={{ background: item.bg_color }}
                    />
                    {item.bg_color}
                  </td>
                  <td>
                    <span
                      className="rt-color-swatch"
                      style={{ background: item.text_color }}
                    />
                    {item.text_color}
                  </td>
                  <td>{item.order}</td>
                  <td>
                    <div className="rt-actions">
                      <button
                        className="rt-edit-btn"
                        type="button"
                        onClick={() => handleEdit(item)}
                      >
                        수정
                      </button>
                      <button
                        className="rt-del-btn"
                        type="button"
                        onClick={() => handleDelete(item.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
