import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { apiFetch } from "../api/client";
import { fetchProjects } from "../api/projects";
import type { Project } from "../api/projects";
import { fetchRoadmapItems } from "../api/roadmap";
import type { RoadmapItem } from "../api/roadmap";
import HomeHeader from "../components/HomeHeader";
import HomeFooter from "../components/HomeFooter";
import ResultModal from "../components/ResultModal";
import type { ResultModalData } from "../components/ResultModal";
import "./Home.css";

import heroBg from "../assets/home/wave_hero.png";
import aboutBg from "../assets/home/wave_about.png";
import ctaBg from "../assets/home/wave_cta.png";

/**
 * ✅ ANNUAL ROADMAP 타이틀 바(물결) 배경은 별도 파일로 두는 걸 추천
 * 네가 파일 가지고 있다 했으니 아래 경로에 넣으면 됨
 */
import roadmapBarBg from "../assets/home/wave_roadmap_bar.png";

import iconPlanning from "../assets/home/icon_plannig.png";
import iconFrontend from "../assets/home/frontend.png";
import iconBackend from "../assets/home/backend.png";
import iconAI from "../assets/home/icon_ai.png";

// Members 섹션용 import
import membersBg from "../assets/team/team_bg.png";
import aiJoaram from "../assets/team/ai_joaram.png";
import vpKimdohyun from "../assets/team/vp_kimdohyun.png";
import pmYujeonghee from "../assets/team/pm_yujeonghee.png";
import fsKimjonggun from "../assets/team/fs_kimjonggun.png";

type TrackCard = {
  key: string;
  title: string;
  desc: string;
  tags: string;
  icon?: string;
};

type MemberCard = {
  key: string;
  name: string;
  roleLine: string;
  tags: string;
  img: string;
  halo?: boolean;
};

const TRACKS: TrackCard[] = [
  {
    key: "planning",
    title: "기획/디자인",
    desc: "서비스의 시작과 끝을\n설계하다",
    tags: "#UI/UX #서비스기획 #피그마",
    icon: iconPlanning,
  },
  {
    key: "frontend",
    title: "프론트엔드",
    desc: "사용자가 만나는 첫 화면,\n코드로 그려내다",
    tags: "#React #JavaScript #UI개발",
    icon: iconFrontend,
  },
  {
    key: "backend",
    title: "백엔드",
    desc: "보이지 않는 곳에서\n서비스를 움직이다",
    tags: "#Django #Python #API설계",
    icon: iconBackend,
  },
  {
    key: "ai",
    title: "AI (인공지능)",
    desc: "데이터로 세상을\n예측하다",
    tags: "#Python #딥러닝 #데이터분석",
    icon: iconAI,
  },
];

const MEMBERS: MemberCard[] = [
  {
    key: "ai",
    name: "AI 조아람",
    roleLine: "대표 / AI",
    tags: "#AI에_관심_있는 #GPT",
    img: aiJoaram,
    halo: true,
  },
  {
    key: "vp",
    name: "VP 김도현",
    roleLine: "부대표",
    tags: "#올라운더",
    img: vpKimdohyun,
  },
  {
    key: "pm",
    name: "PM 유정희",
    roleLine: "기획 / 디자인",
    tags: "#창의적이고_문제해결을_좋아하는 #중앙운영단",
    img: pmYujeonghee,
  },
  {
    key: "fs",
    name: "FS 김종건",
    roleLine: "풀스택",
    tags: "#기술_리더 #프론트 #백엔드",
    img: fsKimjonggun,
  },
];

function useTypewriter(text: string, speedMs: number, enabled = true) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let i = 0;
    setOut("");
    setDone(false);

    const t = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(t);
        setDone(true);
      }
    }, speedMs);

    return () => window.clearInterval(t);
  }, [text, speedMs, enabled]);

  return { out, done };
}

export default function Home() {
  const nav = useNavigate();
  const { me } = useAuth();
  const isInstructor = me?.role === "INSTRUCTOR";

  const goPrimary = () => {
    if (isInstructor) nav("/admin");
    else nav("/apply");
  };

  const line1 = useMemo(
    () => "전공 무관!\n열정만 있다면 누구나 환영합니다.",
    []
  );
  const line2 = useMemo(
    () => "멋쟁이사자처럼 순천향대학교 14기 아기사자 모집",
    []
  );

  const t1 = useTypewriter(line1, 45, true);
  const t2 = useTypewriter(line2, 28, t1.done);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const headerH = 45;
    const y = el.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const goToSession = () => {
    // 로그인하지 않은 경우
    if (!me) {
      alert("교육 세션은 로그인 후 이용하실 수 있습니다.");
      return;
    }
    
    // STUDENT 또는 INSTRUCTOR만 접근 가능
    if (me.role !== "STUDENT" && me.role !== "INSTRUCTOR") {
      alert("교육 세션은 학생 또는 관리자만 이용할 수 있습니다.");
      return;
    }
    
    nav("/session");
  };

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.add("page-home");
    return () => document.body.classList.remove("page-home");
  }, []);

  // ✅ 결과 모달 상태
  const [resultModal, setResultModal] = useState<ResultModalData | null>(null);

  // ✅ Roadmap 상태
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);

  useEffect(() => {
    fetchRoadmapItems().then(setRoadmapItems).catch(() => {});
  }, []);

  // ✅ Projects 섹션 상태
  const [projects, setProjects] = useState<Project[]>([]);
  const [projIdx, setProjIdx] = useState(0);
  const [pdfModal, setPdfModal] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects().then((data) => {
      setProjects(data);
    }).catch(() => {});
  }, []);

  const projPrev = () => {
    if (projects.length === 0) return;
    setProjIdx((i) => (i - 1 + projects.length) % projects.length);
    setActiveDetail(null);
  };
  const projNext = () => {
    if (projects.length === 0) return;
    setProjIdx((i) => (i + 1) % projects.length);
    setActiveDetail(null);
  };
  const getProj = (offset: number): Project | null => {
    if (projects.length === 0) return null;
    return projects[(projIdx + offset + projects.length) % projects.length];
  };
  const centerProj = getProj(0);

  // ✅ 로그인 이후(me 존재) 합불 결과 조회 → 있으면 모달 띄움
  useEffect(() => {
    // me가 없으면(비로그인) 호출 X
    if (!me) return;

    const fetchMyResult = async () => {
      try {
        // ✅ 백엔드 코드가 /api/results/my 라고 했으니 그대로 맞춤
        const res = await apiFetch<any>("/api/applications/results/my");
        if (res?.ok && res.result) {
          setResultModal(res.result as ResultModalData);
        }
      } catch {
        // 결과 없거나 권한 없으면 그냥 무시
      }
    };

    fetchMyResult();
  }, [me]);

  return (
    <div className="home-root">
      <HomeHeader
        scrolled={scrolled}
        onClickIntro={() => scrollToId("sec-about")}
        onClickProjects={() => scrollToId("sec-projects")}
        onClickSessions={goToSession}
        onClickLogin={() => nav("/login")}
        onClickPrimary={goPrimary}
        me={me}
      />

      {/* HERO */}
      <section
        className="home-hero full-bleed"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="home-hero-overlay" />

        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <div className="home-hero-title">
              {t1.out.split("\n").map((line, idx) => (
                <div key={idx}>{line || <span>&nbsp;</span>}</div>
              ))}
            </div>

            <div className="home-hero-sub">{t2.out}</div>

            <button className="home-hero-cta" onClick={goPrimary} type="button">
              {isInstructor ? "관리자 페이지" : "지원하러 가기"}
            </button>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="sec-about"
        className="home-about full-bleed"
        style={{ backgroundImage: `url(${aboutBg})` }}
      >
        <div className="home-about-overlay" />

        <div className="home-about-inner">
          <div className="home-about-head">
            <div className="home-about-title">ABOUT US</div>
            <div className="home-about-sub">
              멋쟁이사자처럼 순천향대학교를 소개합니다.
            </div>
          </div>

          <div className="home-about-stack">
            <div className="home-about-item">
              <div className="home-about-item-title">멋사대학 소개</div>
              <div className="home-about-item-body">
                멋쟁이사자처럼 대학은 2026년 기준, 전국 약 80개 대학에서 14년째 운영 중인 국내 최대 규모의 IT 창업 동아리입니다.
                <br />
                비전공자와 전공자 모두가 함께 참여하여 웹 앱 개발을 기반으로 문제 해결과 창업 경험을 쌓을 수 있는 교육 중심 커뮤니티입니다.
                <br />
                <br />
                각 대학에서는 정기적인 스터디와 교육 세션을 통해 개발 역량을 기르고,
                전국 단위의 중앙 해커톤을 통해 다양한 학교의 구성원들과 협업하며 실제 서비스를 기획·개발하는 경험을 제공합니다.
              </div>
            </div>

            <div className="home-about-item">
              <div className="home-about-item-title">
                멋쟁이사자처럼 순천향대학교
              </div>

              <div className="home-about-item-body about-sch">
                멋쟁이사자처럼 순천향대학교는 교내 구성원들이 개발 역량을 기르고 협업 경험을 쌓을 수 있도록 다양한 활동을 운영하고 있습니다.
                <br />
                매주 정기적으로 진행되는 스터디를 통해 기초부터 심화 과정까지 단계적으로 학습하며,
                이론에 그치지 않고 직접 만들고 구현하는 실습 중심의 교육을 지향합니다.
                <br />
                <br />
                또한 타 대학 멋쟁이사자처럼과 함께하는 연합 행사 및 해커톤을 통해
                다양한 배경의 구성원들과 협업하며 실제 서비스를 기획·개발하는 과정을 경험할 수 있는 기회를 제공합니다.
                <br />
                특히 14기에서는 선배 기수와의 교류 활성화를 핵심 방향으로 삼아,
                멘토링/경험 공유/네트워킹 중심의 활동을 확대하여
                기수 간 단절 없이 지속 성장 가능한 커뮤니티를 만들어가고자 합니다.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="home-roadmap full-bleed">
        <div className="home-roadmap-inner">
          <div
            className="home-roadmap-bar"
            style={{ backgroundImage: `url(${roadmapBarBg})` }}
          >
            ANNUAL ROADMAP
          </div>

          <div className="home-roadmap-card">
            {(["TOP", "BOTTOM"] as const).map((half) => {
              const halfItems = roadmapItems.filter((i) => i.half === half);
              const months =
                half === "TOP"
                  ? ["1월", "2월", "3월", "4월", "5월", "6월"]
                  : ["7월", "8월", "9월", "10월", "11월", "12월"];
              const rows = [...new Set(halfItems.map((i) => i.row))].sort(
                (a, b) => a - b
              );

              return (
                <div key={half}>
                  <div className={`road-row${half === "BOTTOM" ? " bottom" : ""}`}>
                    {months.map((m) => (
                      <div key={m} className="road-month">
                        <div className="road-month-label">{m}</div>
                        <div className="road-dot" />
                      </div>
                    ))}
                    <div className="road-line" />
                  </div>

                  {rows.map((row) => {
                    const rowItems = halfItems.filter((i) => i.row === row);
                    const isMain = row === 0;
                    const cls = isMain
                      ? `road-items${half === "BOTTOM" ? " bottom" : " top"}`
                      : `road-items-detail${half === "BOTTOM" ? " bottom" : " top"}`;

                    return (
                      <div key={row} className={cls}>
                        {rowItems.map((item) => (
                          <div
                            key={item.id}
                            className={`road-item${!isMain ? " small" : ""}`}
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
            })}
          </div>
        </div>
      </section>

      {/* TRACKS */}
      <section className="home-tracks full-bleed">
        <div className="home-tracks-inner">
          <div className="home-tracks-title">TRACKS</div>
          <div className="home-tracks-sub">나에게 맞는 트랙을 찾아보세요.</div>

          <div className="home-tracks-grid">
            {TRACKS.map((t) => (
              <div key={t.key} className="track-wrap">
                <div className="track-card">
                  <div className="track-icon">
                    {t.icon ? (
                      <img src={t.icon} alt={t.title} />
                    ) : (
                      <div className="track-icon-fallback">◎</div>
                    )}
                  </div>

                  <div className="track-title">{t.title}</div>

                  <div className="track-desc">
                    {t.desc.split("\n").map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </div>

                  <div className="track-divider" />

                  <div className="track-tags">{t.tags}</div>
                </div>

                <button
                  className="track-action"
                  type="button"
                  onClick={() => nav("/tracks")}
                >
                  커리큘럼 바로가기 <span aria-hidden>→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBERS */}
      <section 
        id="sec-members"
        className="home-members full-bleed" 
        style={{ backgroundImage: `url(${membersBg})` }}
      >
        <div className="home-members-overlay" />
        
        <div className="home-members-inner">
          <div className="home-members-title">MEET THE TEAM</div>
          <div className="home-members-sub">14기를 이끌어갈 운영진을 소개합니다.</div>
          
          <div className="home-members-grid">
            {MEMBERS.map((m) => (
              <div key={m.key} className="member-card">
                <div className="member-photo">
                  <div className={`member-photo-frame ${m.halo ? "halo" : ""}`}>
                    <img src={m.img} alt={m.name} />
                  </div>
                </div>
                <div className="member-name">{m.name}</div>
                <div className="member-role">{m.roleLine}</div>
                <div className="member-tags">{m.tags}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="sec-projects" className="home-projects full-bleed">
        <div className="home-projects-inner">
          <div className="home-projects-title">PROJECTS</div>
          <div className="home-projects-sub">
            비전공자 아기사자들도 멋사와 함께 만든 결과물입니다.
          </div>

          {projects.length > 0 ? (
            <>
              <div className="projects-stage">
                <button className="proj-nav proj-nav-left" type="button" onClick={projPrev} aria-label="이전 프로젝트">&#8249;</button>
                <button className="proj-nav proj-nav-right" type="button" onClick={projNext} aria-label="다음 프로젝트">&#8250;</button>

                <div className="projects-carousel" aria-label="프로젝트 캐러셀">
                  {([-2, -1, 0, 1, 2] as const).map((offset) => {
                    const p = getProj(offset);
                    if (!p) return null;
                    const cls =
                      offset === 0 ? "proj-card main" :
                      offset === -1 ? "proj-card left2" :
                      offset === 1 ? "proj-card right2" :
                      offset === -2 ? "proj-card side left" :
                      "proj-card side right";
                    return (
                      <div
                        key={`${p.id}-${offset}`}
                        className={cls}
                        style={p.thumbnail_url ? {
                          backgroundImage: `url(${p.thumbnail_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        } : undefined}
                      >
                        {offset === 0 && p.pdf_url && (
                          <button
                            className="proj-pdf-btn"
                            type="button"
                            onClick={() => setPdfModal(p.pdf_url)}
                          >
                            PDF 보기
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="projects-name">
                  [{centerProj?.generation}기] {centerProj?.title}
                </div>
              </div>

              {centerProj?.description && (
                <div className="projects-desc">{centerProj.description}</div>
              )}

              <div className="projects-meta">
                <div className="projects-pill-col">
                  <button
                    className={`pill-btn ${activeDetail === "tech" ? "active" : ""}`}
                    type="button"
                    onClick={() => setActiveDetail(activeDetail === "tech" ? null : "tech")}
                  >
                    사용 기술 스택
                  </button>
                  <button
                    className={`pill-btn ${activeDetail === "detail" ? "active" : ""}`}
                    type="button"
                    onClick={() => setActiveDetail(activeDetail === "detail" ? null : "detail")}
                  >
                    서비스 상세 설명
                  </button>
                  {centerProj?.github_url && (
                    <button
                      className="pill-btn"
                      type="button"
                      onClick={() => window.open(centerProj.github_url, "_blank")}
                    >
                      깃허브 링크
                    </button>
                  )}
                  <button
                    className={`pill-btn ${activeDetail === "team" ? "active" : ""}`}
                    type="button"
                    onClick={() => setActiveDetail(activeDetail === "team" ? null : "team")}
                  >
                    참여 팀원
                  </button>
                </div>

                <div className="projects-right">
                  {activeDetail === "tech" && centerProj?.tech_stack && (
                    <div className="hash-row">
                      {centerProj.tech_stack.split(",").map((t) => `#${t.trim()}`).join(" ")}
                    </div>
                  )}
                  {activeDetail === "detail" && centerProj?.detail && (
                    <div className="detail-text">{centerProj.detail}</div>
                  )}
                  {activeDetail === "team" && centerProj?.team_members && (
                    <div className="hash-row">
                      {centerProj.team_members.split(",").map((m) => m.trim()).join(" · ")}
                    </div>
                  )}
                  {!activeDetail && centerProj?.tech_stack && (
                    <div className="hash-row">
                      {centerProj.tech_stack.split(",").map((t) => `#${t.trim()}`).join(" ")}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="projects-empty">등록된 프로젝트가 없습니다.</div>
          )}
        </div>
      </section>

      {/* PDF 모달 */}
      {pdfModal && (
        <div className="pdf-modal-overlay" onClick={() => setPdfModal(null)}>
          <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
            <button className="pdf-modal-close" type="button" onClick={() => setPdfModal(null)}>✕</button>
            <iframe className="pdf-modal-iframe" src={pdfModal} title="PDF Viewer" />
          </div>
        </div>
      )}

      {/* CTA */}
      <section
        id="sec-apply"
        className="home-cta full-bleed"
        style={{ backgroundImage: `url(${ctaBg})` }}
      >
        <div className="home-cta-overlay" />

        <div className="home-cta-inner">
          <div className="home-cta-title">
            실력보다 성장을 봅니다.<br />
            망설이지 말고 지원하세요.
          </div>

          <button
            className="home-cta-btn"
            type="button"
            onClick={() => nav("/apply")}
          >
            14기 지원하기
          </button>
        </div>
      </section>

      <HomeFooter />

      {/* ✅ 로그인 후 합불 결과 모달 */}
      {resultModal && (
        <ResultModal data={resultModal} onClose={() => setResultModal(null)} />
      )}
    </div>
  );
}