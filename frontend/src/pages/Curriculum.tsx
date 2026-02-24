// Curriculum.tsx
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./Curriculum.css";

type TrackKey = "plan" | "frontend" | "backend" | "ai";

type CurriculumData = {
  label: string; // 상단 탭 표시명
  whatWeLearn: { title: string; desc: string; emoji?: string }[];
  weekly: string[]; // "1주차: ..." 형태로 넣기
  goal: string; // 우측 GOAL 박스 문구
};

const CURRICULUM: Record<TrackKey, CurriculumData> = {
  plan: {
    label: "기획/디자인",
    whatWeLearn: [
      { title: "서비스 기획", desc: "문제 정의부터 구조 설계까지", emoji: "💡" },
      { title: "UX/UI 디자인", desc: "피그마(Figma)로 화면 설계", emoji: "🎨" },
      { title: "협업 Hand-off", desc: "개발자에게 전달하는 법", emoji: "💬" },
    ],
    weekly: [
      "1주차: 문제 정의 — 아이디어 발상 & 팀 빌딩",
      "2주차: 사용자 이해 — 시나리오 & 피그마 맛보기",
      "3주차: 구조 설계 — 정보 구조도(IA) 설계",
      "4주차: 흐름 설계 — 유저 플로우(User Flow)",
      "5주차: UI 구조화 — 컴포넌트 & 오토레이아웃",
      "6주차: 화면 설계 — 와이어프레임(Lo-Fi)",
      "7주차: 명세화 — 기능 명세서(Description)",
      "8주차: 디자인 시스템 — 스타일 가이드 기초",
      "9주차: 시각 설계 — Hi-Fi 디자인 & 폴리싱",
      "10주차: 협업 마무리 — 개발 전달(Hand-off)",
    ],
    goal: "내 아이디어를\n완벽한 기획서와 디자인으로\n만들어내는 PM",
  },

  frontend: {
    label: "프론트엔드",
    whatWeLearn: [
      { title: "React 기초", desc: "컴포넌트 기반 UI 개발", emoji: "⚛️" },
      { title: "UI/UX 구현", desc: "반응형 웹 & 인터랙션 구현", emoji: "🖥️" },
      { title: "협업", desc: "Git/GitHub로 팀 개발하기", emoji: "🤝" },
    ],
    weekly: [
      "1주차: OT 및 팀 빌딩",
      "2주차: 웹 기본(HTML/CSS/JavaScript)",
      "3주차: React 기초(컴포넌트/props/state)",
      "4주차: React 심화(라우터/비동기/폼)",
      "5주차: 스타일링(CSS Module/반응형)",
      "6주차: 상태 관리 & API 연동",
      "7주차: TypeScript 기초 & 적용",
      "8주차: 성능 최적화 & 빌드/배포",
      "9주차: 팀 프로젝트 구현(스프린트)",
      "10주차: 리팩터링 & 최종 발표",
    ],
    goal: "사용자 경험을 코드로 구현하는\n프론트엔드 개발자",
  },

  backend: {
    label: "백엔드",
    whatWeLearn: [
      { title: "Django 기초", desc: "Python 기반 웹 서버 구축", emoji: "🐍" },
      { title: "API 설계", desc: "REST API 설계 & 데이터베이스", emoji: "🧩" },
      { title: "협업", desc: "Git/GitHub로 팀 개발하기", emoji: "🤝" },
    ],
    weekly: [
      "1주차: OT 및 팀 빌딩",
      "2주차: Python 기초 & 웹 개념(HTTP/REST)",
      "3주차: Django 기초(프로젝트 구조/모델/뷰)",
      "4주차: Django ORM & 데이터베이스 모델링",
      "5주차: Django REST Framework(시리얼라이저/뷰셋)",
      "6주차: 인증/인가(로그인/세션/JWT)",
      "7주차: 파일 업로드 & 외부 API 연동",
      "8주차: 배포 기초(Docker/서버 환경)",
      "9주차: 팀 프로젝트 구현(스프린트)",
      "10주차: 리팩터링 & 최종 발표",
    ],
    goal: "안정적인 서버와 API를 설계하는\n백엔드 개발자",
  },

  ai: {
    label: "AI",
    whatWeLearn: [
      { title: "ML/DL 기초", desc: "머신러닝부터 딥러닝까지", emoji: "🤖" },
      { title: "NLP & LLM", desc: "자연어 처리와 거대 언어 모델", emoji: "🧠" },
      { title: "AI 서빙", desc: "모델을 서비스로 배포하기", emoji: "🚀" },
    ],
    weekly: [
      "1주차: AI 개발 환경 세팅",
      "2주차: ML 입문",
      "3주차: 데이터 전처리",
      "4주차: DL 입문",
      "5주차: 이미지 처리와 전이학습",
      "6주차: NLP와 Hugging Face",
      "7주차: LLM & Vector DB (RAG 구현)",
      "8주차: AI 서빙 & 서버/DB 연동 (FastAPI)",
    ],
    goal: "데이터와 모델을 다뤄\nAI 기능을 실제 서비스에\n녹여내는 엔지니어",
  },
};

const VALID_TABS: TrackKey[] = ["plan", "frontend", "backend", "ai"];

export default function Curriculum() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TrackKey | null;
  const initialTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "frontend";

  const [active, setActive] = useState<TrackKey>(initialTab);
  const data = useMemo(() => CURRICULUM[active], [active]);

  return (
    <div className="curri-root">
      <div className="curri-container">
        {/* 헤더 */}
        <header className="curri-head">
          <h1 className="curri-title">CURRICULUM</h1>
          <p className="curri-sub">14기 아기사자들의 성장 로드맵</p>

          {/* 탭 */}
          <div className="curri-tabs" role="tablist" aria-label="커리큘럼 트랙 선택">
            <button
              type="button"
              role="tab"
              aria-selected={active === "plan"}
              className={`curri-tab ${active === "plan" ? "active" : ""}`}
              onClick={() => setActive("plan")}
            >
              [기획/디자인]
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={active === "frontend"}
              className={`curri-tab ${active === "frontend" ? "active" : ""}`}
              onClick={() => setActive("frontend")}
            >
              [프론트엔드]
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={active === "backend"}
              className={`curri-tab ${active === "backend" ? "active" : ""}`}
              onClick={() => setActive("backend")}
            >
              [백엔드]
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={active === "ai"}
              className={`curri-tab ${active === "ai" ? "active" : ""}`}
              onClick={() => setActive("ai")}
            >
              [AI]
            </button>
          </div>
        </header>

        {/* 본문 3컬럼 */}
        <main className="curri-grid">
          {/* WHAT WE LEARN */}
          <section className="curri-col">
            <div className="curri-pill what">WHAT WE LEARN</div>

            <div className="curri-list">
              {data.whatWeLearn.map((item) => (
                <div key={item.title} className="curri-bullet">
                  <div className="curri-dot">•</div>
                  <div className="curri-bullet-body">
                    <div className="curri-bullet-title">
                      <span className="curri-emoji" aria-hidden>
                        {item.emoji ?? "•"}
                      </span>
                      <span>{item.title}:</span>
                    </div>
                    <div className="curri-bullet-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* WEEKLY SCHEDULE */}
          <section className="curri-col">
            <div className="curri-pill weekly">WEEKLY SCHEDULE</div>

            <div className="weekly-scroll" role="region" aria-label="주차별 커리큘럼 목록">
              <div className="weekly-items">
                {data.weekly.map((w, idx) => (
                  <div key={`${active}-${idx}`} className="weekly-item">
                    <div className="weekly-node" aria-hidden />
                    <div className="weekly-text">{w}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* GOAL */}
          <section className="curri-col">
            <div className="curri-pill goal">GOAL</div>

            <div className="goal-card">
              <div className="goal-text">{data.goal}</div>
            </div>
          </section>
        </main>

        {/* 페이지 하단 여백(스크롤 여유) */}
        <div className="curri-bottom-space" />
      </div>
    </div>
  );
}