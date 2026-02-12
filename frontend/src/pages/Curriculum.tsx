// Curriculum.tsx
import { useMemo, useState } from "react";
import "./Curriculum.css";

type TrackKey = "plan" | "fullstack" | "ai";

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
      { title: "서비스 기획", desc: "문제 정의부터 솔루션 도출까지", emoji: "💡" },
      { title: "UX/UI 디자인", desc: "피그마(Figma) 마스터", emoji: "🎨" },
      { title: "협업 커뮤니케이션", desc: "개발자와 소통하는 법", emoji: "💬" },
    ],
    weekly: [
      "1주차: OT 및 팀 빌딩",
      "2주차: 문제 정의 & 유저 리서치",
      "3주차: 아이디어 발상법",
      "4주차: IA/유저 플로우 & 와이어프레임",
      "5주차: 피그마 기초(컴포넌트/오토레이아웃)",
      "6주차: 디자인 시스템 기초",
      "7주차: 프로토타이핑 & 사용성 테스트",
      "8주차: 발표 자료 구성 & 데모 스토리",
      "9주차: 팀 프로젝트 기획서 완성",
      "10주차: 최종 발표 리허설",
    ],
    goal: "내 아이디어를\n완벽한 기획서와 디자인으로\n만들어내는 PM",
  },

  fullstack: {
    label: "풀스택",
    whatWeLearn: [
      { title: "프론트엔드", desc: "React로 UI를 구현하는 법", emoji: "🖥️" },
      { title: "백엔드", desc: "API 설계 & 서버 구축", emoji: "🧩" },
      { title: "협업", desc: "Git/GitHub로 팀 개발하기", emoji: "🤝" },
    ],
    weekly: [
      "1주차: OT 및 팀 빌딩",
      "2주차: 웹 기본(HTTP/라우팅/상태)",
      "3주차: React 기초(컴포넌트/props/state)",
      "4주차: React 심화(라우터/비동기/폼)",
      "5주차: API 연동(axios/fetch) & 에러 처리",
      "6주차: 백엔드 기초(REST/DB 모델링)",
      "7주차: 인증/인가(로그인/JWT/세션)",
      "8주차: 배포 기초(Docker/서버 환경)",
      "9주차: 팀 프로젝트 구현(스프린트)",
      "10주차: 리팩터링 & 최종 발표",
    ],
    goal: "기획부터 배포까지,\n하나의 서비스를\n끝까지 완성하는 개발자",
  },

  ai: {
    label: "AI/서버",
    whatWeLearn: [
      { title: "AI 기초", desc: "데이터 전처리/모델 개념", emoji: "🤖" },
      { title: "서버 운영", desc: "배포/모니터링/로그", emoji: "🛰️" },
      { title: "프로젝트 적용", desc: "AI를 서비스에 녹이는 법", emoji: "🧪" },
    ],
    weekly: [
      "1주차: OT 및 팀 빌딩",
      "2주차: 데이터/전처리 기초",
      "3주차: 분류 모델 기초(평가 지표 포함)",
      "4주차: 간단한 API로 모델 서빙하기",
      "5주차: DB/캐시/큐 개념 맛보기",
      "6주차: 배포/환경 변수/보안 기초",
      "7주차: 모니터링/로깅/알람",
      "8주차: 성능 튜닝(응답/비용 관점)",
      "9주차: 팀 프로젝트 적용(서버+AI)",
      "10주차: 최종 발표 & 회고",
    ],
    goal: "데이터와 서버를 다뤄\nAI 기능을 안정적으로\n서비스에 붙이는 엔지니어",
  },
};

export default function Curriculum() {
  const [active, setActive] = useState<TrackKey>("fullstack");
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
              aria-selected={active === "fullstack"}
              className={`curri-tab ${active === "fullstack" ? "active" : ""}`}
              onClick={() => setActive("fullstack")}
            >
              [풀스택]
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={active === "ai"}
              className={`curri-tab ${active === "ai" ? "active" : ""}`}
              onClick={() => setActive("ai")}
            >
              [AI/서버]
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

          <div className="curri-vline yellow" aria-hidden />

          {/* WEEKLY SCHEDULE */}
          <section className="curri-col">
            <div className="curri-pill weekly">WEEKLY SCHEDULE</div>

            {/* ✅ 내부 스크롤 영역 */}
            <div className="weekly-scroll" role="region" aria-label="주차별 커리큘럼 목록">
              {/* ✅ 레일은 weekly-items::before 로 그림 */}
              <div className="weekly-items">
                {data.weekly.map((w, idx) => (
                  <div key={`${w}-${idx}`} className="weekly-item">
                    <div className="weekly-node" aria-hidden />
                    <div className="weekly-text">{w}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="curri-vline green" aria-hidden />

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