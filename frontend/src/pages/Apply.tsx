import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../auth/useAuth";
import HomeHeader from "../components/HomeHeader";
import HomeFooter from "../components/HomeFooter";
import "./Apply.css";

type Track = "PLANNING_DESIGN" | "FRONTEND" | "BACKEND" | "AI_SERVER";

type MeResponse = {
  id: number;
  email: string;
  role: string;
  email_verified: boolean;
  name: string;
  student_id: string;
  department: string;
  phone: string;
};

type ApplyUIForm = {
  name: string;
  student_id: string;
  department: string;
  phone: string;
  email_local: string;
  track: Track;

  portfolio_main: string;

  motivation: string;
  common_growth_experience: string;
  common_time_management: string;
  common_teamwork: string;

  planning_experience: string;
  planning_idea: string;

  ai_programming_level: string;
  ai_service_impression: string;

  backend_web_process: string;
  backend_code_quality: string;

  frontend_ui_experience: string;
  frontend_design_implementation: string;
};

type ApplicationData = {
  track: Track;
  one_liner: string;
  portfolio_url: string;

  motivation: string;
  common_growth_experience: string;
  common_time_management: string;
  common_teamwork: string;

  planning_experience: string;
  planning_idea: string;

  ai_programming_level: string;
  ai_service_impression: string;

  backend_web_process: string;
  backend_code_quality: string;

  frontend_ui_experience: string;
  frontend_design_implementation: string;

  experience: string;
};

type MyResponse = {
  status: "DRAFT" | "SUBMITTED" | "ACCEPTED" | "REJECTED";
  application: ApplicationData | null;
  draft: ApplicationData | null;
};

const TRACK_LABEL: Record<Track, string> = {
  PLANNING_DESIGN: "기획/디자인",
  FRONTEND: "프론트엔드",
  BACKEND: "백엔드",
  AI_SERVER: "AI",
};

const EMPTY_FORM: ApplyUIForm = {
  name: "",
  student_id: "",
  department: "",
  phone: "",
  email_local: "",
  track: "PLANNING_DESIGN",
  portfolio_main: "",
  motivation: "",
  common_growth_experience: "",
  common_time_management: "",
  common_teamwork: "",
  planning_experience: "",
  planning_idea: "",
  ai_programming_level: "",
  ai_service_impression: "",
  backend_web_process: "",
  backend_code_quality: "",
  frontend_ui_experience: "",
  frontend_design_implementation: "",
};

function safeStr(v: any) {
  return typeof v === "string" ? v : "";
}

type ToastKind = "success" | "error" | "info";

export default function Apply() {
  const nav = useNavigate();
  const { me } = useAuth();
  const isInstructor = me?.role === "INSTRUCTOR";

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<MyResponse["status"]>("DRAFT");
  const locked = useMemo(() => status !== "DRAFT", [status]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<ApplyUIForm>(EMPTY_FORM);

  const [toast, setToast] = useState<{ text: string; kind: ToastKind } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = (text: string, kind: ToastKind = "info") => {
    setToast({ text, kind });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2900);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const step1Ref = useRef<HTMLDivElement | null>(null);
  const step2Ref = useRef<HTMLDivElement | null>(null);
  const step3Ref = useRef<HTMLDivElement | null>(null);

  const setField = <K extends keyof ApplyUIForm>(key: K, value: ApplyUIForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toPayload = (): ApplicationData => ({
    track: form.track,
    one_liner: "",
    portfolio_url: form.portfolio_main.trim(),
    motivation: form.motivation,
    common_growth_experience: form.common_growth_experience,
    common_time_management: form.common_time_management,
    common_teamwork: form.common_teamwork,
    planning_experience: form.planning_experience,
    planning_idea: form.planning_idea,
    ai_programming_level: form.ai_programming_level,
    ai_service_impression: form.ai_service_impression,
    backend_web_process: form.backend_web_process,
    backend_code_quality: form.backend_code_quality,
    frontend_ui_experience: form.frontend_ui_experience,
    frontend_design_implementation: form.frontend_design_implementation,
    experience: "",
  });

  const scrollToStep = (n: 1 | 2 | 3) => {
    const el = n === 1 ? step1Ref.current : n === 2 ? step2Ref.current : step3Ref.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setStep(n);
  };

  const goHome = () => nav("/");
  const goLogin = () => nav("/login");
  const goPrimary = () => {
    if (isInstructor) nav("/admin");
    else nav("/apply");
  };

  useEffect(() => {
    setLoading(true);

    Promise.all([apiFetch<MeResponse>("/api/auth/me"), apiFetch<MyResponse>("/api/applications/my")])
      .then(([meRes, myRes]) => {
        const local = (meRes.email || "").split("@")[0] || "";
        setForm((prev) => ({
          ...prev,
          name: meRes.name ?? "",
          student_id: meRes.student_id ?? "",
          department: meRes.department ?? "",
          phone: meRes.phone ?? "",
          email_local: local,
        }));

        setStatus(myRes.status);

        const src = myRes.status !== "DRAFT" ? myRes.application : myRes.draft;
        if (src) {
          setForm((prev) => ({
            ...prev,
            track: src.track,
            portfolio_main: safeStr(src.portfolio_url),
            motivation: safeStr(src.motivation),
            common_growth_experience: safeStr(src.common_growth_experience),
            common_time_management: safeStr(src.common_time_management),
            common_teamwork: safeStr(src.common_teamwork),
            planning_experience: safeStr(src.planning_experience),
            planning_idea: safeStr(src.planning_idea),
            ai_programming_level: safeStr(src.ai_programming_level),
            ai_service_impression: safeStr(src.ai_service_impression),
            backend_web_process: safeStr(src.backend_web_process),
            backend_code_quality: safeStr(src.backend_code_quality),
            frontend_ui_experience: safeStr(src.frontend_ui_experience),
            frontend_design_implementation: safeStr(src.frontend_design_implementation),
          }));
        }

        setStep(myRes.status !== "DRAFT" ? 3 : 1);
      })
      .catch(() => {
        showToast("지원서/유저 정보를 불러오지 못했습니다.", "error");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (locked) {
      setStep(3);
      return;
    }

    const s1 = step1Ref.current;
    const s2 = step2Ref.current;
    const s3 = step3Ref.current;
    if (!s1 || !s2 || !s3) return;

    const obs = new IntersectionObserver(
      (entries) => {
        let best: { idx: 1 | 2 | 3; ratio: number } | null = null;
        for (const e of entries) {
          const idx = e.target === s1 ? (1 as const) : e.target === s2 ? (2 as const) : (3 as const);
          if (e.isIntersecting) {
            if (!best || e.intersectionRatio > best.ratio) best = { idx, ratio: e.intersectionRatio };
          }
        }
        if (best) setStep(best.idx);
      },
      {
        root: null,
        rootMargin: "-120px 0px -55% 0px",
        threshold: [0.15, 0.25, 0.35, 0.5, 0.7],
      }
    );

    obs.observe(s1);
    obs.observe(s2);
    obs.observe(s3);

    return () => obs.disconnect();
  }, [loading, locked]);

  const onSelectTrack = (t: Track) => {
    if (locked) return;
    setField("track", t);
    setTimeout(() => scrollToStep(3), 0);
  };

  const saveDraft = async () => {
    try {
      const payload = toPayload();
      const res = await apiFetch<any>("/api/applications/draft", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res?.ok === false && res?.errors) {
        showToast(`임시저장 실패: ${JSON.stringify(res.errors, null, 2)}`, "error");
        return;
      }
      showToast("임시저장 완료", "success");
    } catch {
      showToast("임시저장 실패", "error");
    }
  };

  const validateForm = (): boolean => {
    if (!form.name.trim() || !form.student_id.trim() || !form.department.trim()) {
      showToast("기본정보가 비어있습니다. (회원가입 정보를 확인해주세요)", "error");
      scrollToStep(1);
      return false;
    }

    if (!form.motivation.trim()) {
      showToast("자기소개 및 지원동기를 작성해주세요.", "error");
      scrollToStep(3);
      return false;
    }
    if (!form.common_growth_experience.trim()) {
      showToast("열정적으로 몰입했던 경험을 작성해주세요.", "error");
      scrollToStep(3);
      return false;
    }
    if (!form.common_time_management.trim()) {
      showToast("시간 관리 계획을 작성해주세요.", "error");
      scrollToStep(3);
      return false;
    }
    if (!form.common_teamwork.trim()) {
      showToast("팀 협업 경험을 작성해주세요.", "error");
      scrollToStep(3);
      return false;
    }

    if (form.track === "PLANNING_DESIGN") {
      if (!form.planning_experience.trim()) {
        showToast("기획/디자인 경험을 작성해주세요.", "error");
        scrollToStep(3);
        return false;
      }
      if (!form.planning_idea.trim()) {
        showToast("사회 문제 해결 아이디어를 작성해주세요.", "error");
        scrollToStep(3);
        return false;
      }
    } else if (form.track === "AI_SERVER") {
      if (!form.ai_programming_level.trim()) {
        showToast("프로그래밍 학습 경험을 작성해주세요.", "error");
        scrollToStep(3);
        return false;
      }
      if (!form.ai_service_impression.trim()) {
        showToast("AI 서비스 인상을 작성해주세요.", "error");
        scrollToStep(3);
        return false;
      }
    } else if (form.track === "BACKEND") {
      if (!form.backend_web_process.trim()) {
        showToast("웹 동작 원리를 작성해주세요.", "error");
        scrollToStep(3);
        return false;
      }
      if (!form.backend_code_quality.trim()) {
        showToast("코드 품질 기준을 작성해주세요.", "error");
        scrollToStep(3);
        return false;
      }
    } else if (form.track === "FRONTEND") {
      if (!form.frontend_ui_experience.trim()) {
        showToast("UI/UX 개선 아이디어를 작성해주세요.", "error");
        scrollToStep(3);
        return false;
      }
      if (!form.frontend_design_implementation.trim()) {
        showToast("디자인 구현 우선순위를 작성해주세요.", "error");
        scrollToStep(3);
        return false;
      }
    }

    return true;
  };

  const submit = async () => {
    if (locked) return;
    if (!validateForm()) return;

    if (!window.confirm("최종 제출 하시겠습니까?\n제출 후에는 수정이 불가능합니다.")) return;

    try {
      const payload = toPayload();
      const res = await apiFetch<any>("/api/applications/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res?.ok === false && res?.errors) {
        showToast(`제출 실패: ${JSON.stringify(res.errors, null, 2)}`, "error");
        return;
      }

      setStatus(res.status ?? "SUBMITTED");
      setStep(3);
      showToast("제출 완료되었습니다.", "success");
    } catch {
      showToast("제출 실패", "error");
    }
  };

  const StepDot = ({ idx, label }: { idx: 1 | 2 | 3; label: string }) => {
    const active = step === idx;
    const done = step > idx;
    const color = active || done ? "#17538D" : "#CFCFCF";
    const shadow = active ? "0 0 0 6px rgba(23,83,141,0.14)" : "none";

    return (
      <button type="button" onClick={() => scrollToStep(idx)} className="apply-step-btn" aria-label={`${idx}단계 ${label} 이동`}>
        <div className="apply-step-item">
          <div className="apply-step-dot" style={{ ["--dot-color" as any]: color, ["--dot-shadow" as any]: shadow }} />
          <div
            className="apply-step-label"
            style={{
              ["--label-color" as any]: active ? "#17538D" : "#333",
              ["--label-weight" as any]: active ? 900 : 700,
            }}
          >
            {idx}. {label}
          </div>
        </div>
      </button>
    );
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="apply-root">
      <HomeHeader
        scrolled={true}
        onClickIntro={goHome}
        onClickProjects={goHome}
        onClickSessions={goHome}
        onClickLogin={goLogin}
        onClickPrimary={goPrimary}
        me={me ?? null}
      />

      {toast && (
        <div className="apply-toast-wrap" aria-live="polite" aria-atomic="true">
          <div className={`apply-toast ${toast.kind}`}>{toast.text}</div>
        </div>
      )}

      <div className="apply-page">
        {locked && <div className="apply-locked-banner">✅ 제출 완료된 지원서입니다. 수정할 수 없습니다.</div>}

        <div className="apply-stepper">
          <StepDot idx={1} label="기본정보" />
          <div className="apply-step-line" />
          <StepDot idx={2} label="파트선택" />
          <div className="apply-step-line" />
          <StepDot idx={3} label="서류작성" />
        </div>

        <div ref={step1Ref} className="apply-section">
          <h2 className="apply-section-title">1. 기본 정보를 입력해주세요.</h2>

          <div className="apply-grid-4">
            <input className="apply-input" disabled value={form.name} placeholder="이름" />
            <input className="apply-input" disabled value={form.student_id} placeholder="학번" />
            <input className="apply-input" disabled value={form.department} placeholder="학과" />
            <input className="apply-input" disabled value={form.phone} placeholder="연락처" />
          </div>

          <div className="apply-email-grid">
            <input className="apply-input" disabled value={form.email_local} placeholder="이메일" />
            <div className="apply-at">@</div>
            <input className="apply-input" disabled value="sch.ac.kr" />
          </div>
        </div>

        <div ref={step2Ref} className="apply-section">
          <h2 className="apply-section-title">2. 지원할 파트를 선택해주세요.</h2>

          <div className="apply-track-row">
            {(Object.keys(TRACK_LABEL) as Track[]).map((t) => {
              const selected = form.track === t;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={locked}
                  onClick={() => onSelectTrack(t)}
                  className={`apply-track-btn ${selected ? "selected" : ""}`}
                >
                  {TRACK_LABEL[t]}
                </button>
              );
            })}
          </div>
        </div>

        <div ref={step3Ref} className="apply-section">
          <h2 className="apply-section-title">3. 서류를 작성해주세요.</h2>

          <div className="apply-question-block">
            <div className="apply-q-title">포트폴리오 제출</div>
            <input
              className="apply-portfolio-input"
              disabled={locked}
              value={form.portfolio_main}
              onChange={(e) => setField("portfolio_main", e.target.value)}
              placeholder="포트폴리오 링크나 구글 드라이브 링크가 있다면 입력해주세요."
            />
          </div>

          <div className="apply-question-block">
            <div className="apply-q-title">자기소개 및 지원동기</div>
            <textarea
              disabled={locked}
              value={form.motivation}
              onChange={(e) => setField("motivation", e.target.value)}
              rows={10}
              className="apply-textarea"
              placeholder="자기소개와 멋쟁이사자처럼에 지원하게 된 동기를 서술해주세요."
            />
          </div>

          <div className="apply-question-block">
            <div className="apply-q-title">지금까지 가장 열정적으로 몰입하여 어려움을 극복하고 성장했던 경험</div>
            <div className="apply-q-desc">
              구체적으로 서술해주세요. 그 과정에서 부딪힌 문제와 자신만의 해결 방식, 그리고 그 경험을 통해 무엇을 배우고 느꼈는지를 중심으로 작성해주세요.
            </div>
            <textarea
              disabled={locked}
              value={form.common_growth_experience}
              onChange={(e) => setField("common_growth_experience", e.target.value)}
              rows={10}
              className="apply-textarea"
            />
          </div>

          <div className="apply-question-block">
            <div className="apply-q-title">멋쟁이사자처럼 활동 계획 및 각오</div>
            <div className="apply-q-desc">
              멋쟁이사자처럼 활동은 상당한 시간과 노력을 필요로 합니다. 학업 및 다른 활동과 병행하며 멋쟁이사자처럼에 꾸준히 기여하기 위한 자신만의 계획이나 각오가 있다면 들려주세요.
            </div>
            <textarea
              disabled={locked}
              value={form.common_time_management}
              onChange={(e) => setField("common_time_management", e.target.value)}
              rows={10}
              className="apply-textarea"
            />
          </div>

          <div className="apply-question-block">
            <div className="apply-q-title">팀 협업 경험</div>
            <div className="apply-q-desc">
              멋쟁이사자처럼에서는 운영진, 다른 아기사자들과의 협업이 필수적입니다. 팀 프로젝트나 단체 활동 중 의견 충돌이나 예상치 못한 문제가 발생했을 때, 어떻게 해결해 나갔던 경험이 있는지 구체적인 사례를 들어 설명해주세요.
            </div>
            <textarea
              disabled={locked}
              value={form.common_teamwork}
              onChange={(e) => setField("common_teamwork", e.target.value)}
              rows={10}
              className="apply-textarea"
            />
          </div>

          {form.track === "PLANNING_DESIGN" && (
            <>
              <div className="apply-track-divider">기획/디자인 트랙 개별 질문</div>

              <div className="apply-question-block">
                <div className="apply-q-title">기획/디자인 관련 경험과 프로젝트</div>
                <div className="apply-q-desc">기획/디자인과 관련된 경험과 프로젝트가 있다면 들려주세요.</div>
                <textarea
                  disabled={locked}
                  value={form.planning_experience}
                  onChange={(e) => setField("planning_experience", e.target.value)}
                  rows={10}
                  className="apply-textarea"
                />
              </div>

              <div className="apply-question-block">
                <div className="apply-q-title">사회 문제 해결 아이디어</div>
                <div className="apply-q-desc">현재 사회 문제를 해결할 수 있는 아이디어가 있다면 들려주세요. (다양한 부문 포함)</div>
                <textarea
                  disabled={locked}
                  value={form.planning_idea}
                  onChange={(e) => setField("planning_idea", e.target.value)}
                  rows={10}
                  className="apply-textarea"
                />
              </div>
            </>
          )}

          {form.track === "AI_SERVER" && (
            <>
              <div className="apply-track-divider">AI 트랙 개별 질문</div>

              <div className="apply-question-block">
                <div className="apply-q-title">프로그래밍 학습 경험</div>
                <div className="apply-q-desc">
                  AI 트랙에서는 Python 프로그래밍과 딥러닝 기초, LLM 활용 등을 다루게 됩니다. 프로그래밍 학습 경험이 있다면 그 수준을 적어주시고, 만약 경험이 없다면 낯설고 어려운 기술을 어떤 방식으로 학습하여 자신의 것으로 만들 것인지 계획을 들려주세요.
                </div>
                <textarea
                  disabled={locked}
                  value={form.ai_programming_level}
                  onChange={(e) => setField("ai_programming_level", e.target.value)}
                  rows={10}
                  className="apply-textarea"
                />
              </div>

              <div className="apply-question-block">
                <div className="apply-q-title">AI 서비스 인상</div>
                <div className="apply-q-desc">
                  최근 경험했던 AI 서비스나 기술(GPT, Claude, sora, 뤼튼 등) 중 가장 인상 깊었던 것은 무엇이며, 그 이유를 본인의 관점에서 설명해주세요.
                </div>
                <textarea
                  disabled={locked}
                  value={form.ai_service_impression}
                  onChange={(e) => setField("ai_service_impression", e.target.value)}
                  rows={10}
                  className="apply-textarea"
                />
              </div>
            </>
          )}

          {form.track === "BACKEND" && (
            <>
              <div className="apply-track-divider">백엔드 트랙 개별 질문</div>

              <div className="apply-question-block">
                <div className="apply-q-title">웹 동작 원리</div>
                <div className="apply-q-desc">
                  웹 브라우저 주소창에 www.naver.com을 입력하고 엔터를 눌렀을 때, 우리 눈에 화면이 보이기까지 서버에서는 어떤 과정을 거쳐 데이터를 보내주는지 아는 만큼 설명해 주세요.
                </div>
                <textarea
                  disabled={locked}
                  value={form.backend_web_process}
                  onChange={(e) => setField("backend_web_process", e.target.value)}
                  rows={10}
                  className="apply-textarea"
                />
              </div>

              <div className="apply-question-block">
                <div className="apply-q-title">코드 품질 기준</div>
                <div className="apply-q-desc">
                  만약 코드를 짰는데 결과는 잘 나오지만, 내부 로직이 복잡하고 지저분하다면 그대로 넘어가시겠습니까, 아니면 시간이 걸리더라도 깔끔하게 정리하시겠습니까? 본인만의 기준이 궁금합니다.
                </div>
                <textarea
                  disabled={locked}
                  value={form.backend_code_quality}
                  onChange={(e) => setField("backend_code_quality", e.target.value)}
                  rows={10}
                  className="apply-textarea"
                />
              </div>
            </>
          )}

          {form.track === "FRONTEND" && (
            <>
              <div className="apply-track-divider">프론트엔드 트랙 개별 질문</div>

              <div className="apply-question-block">
                <div className="apply-q-title">UI/UX 개선 아이디어</div>
                <div className="apply-q-desc">
                  본인이 자주 사용하는 웹사이트나 앱 중에서 이 기능은 참 편리하다 혹은 이건 정말 불편하다라고 느꼈던 점이 있나요? 개발자가 된다면 그 부분을 어떻게 개선해보고 싶으신가요?
                </div>
                <textarea
                  disabled={locked}
                  value={form.frontend_ui_experience}
                  onChange={(e) => setField("frontend_ui_experience", e.target.value)}
                  rows={10}
                  className="apply-textarea"
                />
              </div>

              <div className="apply-question-block">
                <div className="apply-q-title">디자인 구현 우선순위</div>
                <div className="apply-q-desc">
                  프론트엔드는 디자인을 코드로 구현하는 작업입니다. 만약 본인이 짠 코드와 디자이너의 결과물이 미세하게 다르다면, 끝까지 완벽하게 맞추기 위해 노력하는 편인가요, 아니면 기능 작동에 우선순위를 두는 편인가요?
                </div>
                <textarea
                  disabled={locked}
                  value={form.frontend_design_implementation}
                  onChange={(e) => setField("frontend_design_implementation", e.target.value)}
                  rows={10}
                  className="apply-textarea"
                />
              </div>
            </>
          )}
        </div>

        {!locked && (
          <div className="apply-actions">
            <button type="button" onClick={saveDraft} className="apply-btn draft">
              임시 저장
            </button>
            <button type="button" onClick={submit} className="apply-btn submit">
              최종 제출
            </button>
          </div>
        )}
      </div>

      <HomeFooter />
    </div>
  );
}