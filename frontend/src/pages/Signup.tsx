import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";
import "./Signup.css";
import { useNavigate } from "react-router-dom";

// ✅ 로고 이미지 (너가 이 경로에 저장해줘)
import logo from "../assets/likelion_sch_logo.png";

type SendCodeRes =
  | { ok: true; expires_in?: number; already_verified?: boolean }
  | { ok: false; error: string };

type VerifyRes =
  | { ok: true; verified?: boolean; user_exists?: boolean }
  | { ok: false; error: string };

type SignupRes =
  | { ok: true; id: number }
  | { ok: false; error: string };

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}
function clampLen(v: string, n: number) {
  return v.slice(0, n);
}
function formatMMSS(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Signup() {
  const nav = useNavigate();

  // 기본정보
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [studentId, setStudentId] = useState("");

  // phone 3칸
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");

  // email + verify
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // timer (2분)
  const [remainSec, setRemainSec] = useState<number>(0);

  // password
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  // message
  const [msg, setMsg] = useState<string | null>(null);

  // 약관동의
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);

  const phone = useMemo(() => {
    const a = p1.trim();
    const b = p2.trim();
    const c = p3.trim();
    if (!a && !b && !c) return "";
    return `${a}-${b}-${c}`;
  }, [p1, p2, p3]);

  const pwMismatch = pw2.length > 0 && pw !== pw2;

  // 타이머 카운트다운
  useEffect(() => {
    if (remainSec <= 0) return;
    const t = setInterval(() => setRemainSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [remainSec]);

  const canSendCode = useMemo(() => {
    const em = email.trim().toLowerCase();
    if (!em) return false;
    if (!em.endsWith("@sch.ac.kr")) return false;
    if (remainSec > 0) return false;
    return true;
  }, [email, remainSec]);

  const canVerifyCode = useMemo(() => {
    if (!email.trim()) return false;
    if (!code.trim()) return false;
    return true;
  }, [email, code]);

  const sendCode = async () => {
    setMsg(null);
    setEmailVerified(false);

    const em = email.trim().toLowerCase();
    if (!em.endsWith("@sch.ac.kr")) {
      setMsg("학교 이메일(@sch.ac.kr)만 가능합니다.");
      return;
    }

    try {
      const res = await apiFetch<SendCodeRes>("/api/auth/email/send-code", {
        method: "POST",
        body: JSON.stringify({ email: em }),
      });

      if (!res.ok) {
        setEmailSent(false);
        setRemainSec(0);
        setMsg(`인증코드 전송 실패: ${res.error}`);
        return;
      }

      if (res.already_verified) {
        setEmailSent(false);
        setRemainSec(0);
        setEmailVerified(true);
        setMsg("이미 인증된 이메일입니다.");
        return;
      }

      setEmailSent(true);
      setRemainSec(res.expires_in ?? 120);
      setMsg("인증코드를 이메일로 전송했습니다.");
    } catch {
      setEmailSent(false);
      setRemainSec(0);
      setMsg("인증코드 전송 실패 (서버 오류)");
    }
  };

  const verifyCode = async () => {
    setMsg(null);

    const em = email.trim().toLowerCase();
    if (!em.endsWith("@sch.ac.kr")) {
      setMsg("학교 이메일(@sch.ac.kr)만 가능합니다.");
      return;
    }
    if (!code.trim()) {
      setMsg("인증번호를 입력해주세요.");
      return;
    }
    if (!emailSent && remainSec <= 0) {
      setMsg("먼저 인증코드를 요청해주세요.");
      return;
    }

    try {
      const res = await apiFetch<VerifyRes>("/api/auth/email/verify", {
        method: "POST",
        body: JSON.stringify({ email: em, code: code.trim() }),
      });

      if (!res.ok) {
        setEmailVerified(false);
        setMsg(`인증 실패: ${res.error}`);
        return;
      }

      setEmailVerified(true);
      setMsg("이메일 인증 완료");
    } catch {
      setEmailVerified(false);
      setMsg("인증 실패 (서버 오류)");
    }
  };

  const signup = async () => {
    setMsg(null);

    if (!name.trim() || !department.trim() || !studentId.trim()) {
      setMsg("이름/학과/학번을 입력해주세요.");
      return;
    }

    const em = email.trim().toLowerCase();
    if (!em.endsWith("@sch.ac.kr")) {
      setMsg("학교 이메일(@sch.ac.kr)만 가능합니다.");
      return;
    }

    if (!emailVerified) {
      setMsg("이메일 인증을 완료해주세요.");
      return;
    }

    if (!pw || pw.length < 8) {
      setMsg("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }
    if (pwMismatch) {
      setMsg("비밀번호가 같지 않습니다.");
      return;
    }

    if (!agreePrivacy || !agreeThirdParty) {
      setMsg("필수 약관에 동의해주세요.");
      return;
    }

    try {
      const res = await apiFetch<SignupRes>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          department: department.trim(),
          student_id: studentId.trim(),
          phone: phone.trim(),
          email: em,
          password: pw,
        }),
      });

      if (!res.ok) {
        if (res.error === "EMAIL_NOT_VERIFIED") {
          setMsg("이메일 인증을 먼저 완료해주세요.");
        } else if (res.error === "EMAIL_VERIFICATION_EXPIRED") {
          setMsg("이메일 인증 유효시간이 만료되었습니다. 다시 인증해주세요.");
          setEmailVerified(false);
        } else if (res.error === "EMAIL_EXISTS") {
          setMsg("이미 가입된 이메일입니다. 로그인 해주세요.");
        } else if (res.error === "SCHOOL_EMAIL_REQUIRED") {
          setMsg("학교 이메일(@sch.ac.kr)만 가능합니다.");
        } else if (res.error === "PROFILE_REQUIRED") {
          setMsg("이름/학과/학번을 입력해주세요.");
        } else {
          setMsg(`회원가입 실패: ${res.error}`);
        }
        return;
      }

      setMsg(null);
      nav("/signup/done");
    } catch {
      setMsg("회원가입 실패 (서버 오류)");
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        {/* ✅ 로고 이미지 */}
        <div className="signup-logo">
          <img src={logo} alt="LIKELION SCH" className="signup-logo-img" />
        </div>

        {/* form */}
        <div className="signup-form">
          {/* 이름 */}
          <div className="row">
            <div className="label">이름</div>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* 학과 */}
          <div className="row">
            <div className="label">학과</div>
            <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>

          {/* 학번 */}
          <div className="row">
            <div className="label">학번</div>
            <input className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          </div>

          {/* 전화번호 3칸 */}
          <div className="row">
            <div className="label">전화번호</div>
            <div className="phone-wrap">
              <input
                className="input phone"
                value={p1}
                onChange={(e) => setP1(clampLen(onlyDigits(e.target.value), 3))}
              />
              <div className="dash">-</div>
              <input
                className="input phone"
                value={p2}
                onChange={(e) => setP2(clampLen(onlyDigits(e.target.value), 4))}
              />
              <div className="dash">-</div>
              <input
                className="input phone"
                value={p3}
                onChange={(e) => setP3(clampLen(onlyDigits(e.target.value), 4))}
              />
            </div>
          </div>

          {/* 이메일 + 인증하기 */}
          <div className="row">
            <div className="label">이메일</div>
            <div className="email-wrap">
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@sch.ac.kr"
              />
              <button className="btn verify-btn" onClick={sendCode} disabled={!canSendCode}>
                인증하기
              </button>
            </div>
          </div>
          <div className="hint">*순천향대학교 이메일(@sch.ac.kr)만 사용 가능합니다.</div>

          {/* ✅ 인증번호 + 타이머 + 인증확인(버튼 이동) */}
          <div className="row">
            <div className="label">인증번호</div>
            <div className="code-wrap">
              <input
                className="input"
                value={code}
                onChange={(e) => setCode(onlyDigits(e.target.value))}
              />

              <div className={`timer ${remainSec > 0 ? "on" : ""}`}>
                {remainSec > 0 ? `${formatMMSS(remainSec)} 남음` : ""}
              </div>

              {/* ✅ 여기로 이동 */}
              <button className="btn sub-btn inline" onClick={verifyCode} disabled={!canVerifyCode}>
                인증 확인
              </button>

              {emailVerified && <div className="ok">✅ 인증 완료</div>}
            </div>
          </div>

          {/* 비밀번호 */}
          <div className="row">
            <div className="label">비밀번호</div>
            <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div className="hint">*비밀번호 최소 8자, 영문 대소문자, 숫자, 특수기호 사용</div>

          {/* 비밀번호 확인 */}
          <div className="row">
            <div className="label">비밀번호 확인</div>
            <input className="input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>

          {pwMismatch && <div className="error">*비밀번호가 같지 않습니다.</div>}

          {/* 약관동의 */}
          <div className="terms-section">
            <div className="terms-title">개인정보 수집 및 이용 동의 (필수)</div>
            <div className="terms-content">
              <p>멋쟁이사자처럼 순천향대학교 14기 운영진은 아기사자 선발 및 향후 원활한 동아리 운영을 위해 아래와 같이 지원자분들의 개인정보를 수집 및 이용하고자 합니다. 내용을 자세히 읽으신 후 동의 여부를 결정해 주시기 바랍니다.</p>
              <h4>1. 개인정보 수집 및 이용 목적</h4>
              <ul>
                <li>14기 아기사자 선발을 위한 서류 심사 및 면접 진행</li>
                <li>합격 여부 통보 및 면접 일정 안내 등 지원자와의 원활한 의사소통</li>
                <li>동아리 인재풀 등록 및 차기 모집 안내</li>
              </ul>
              <h4>2. 수집하는 개인정보 항목</h4>
              <ul>
                <li>필수항목: 성명, 학과, 학번, 학년, 전화번호, 이메일</li>
                <li>선택항목: 포트폴리오 링크, 지원서 내 답변 내용</li>
              </ul>
              <h4>3. 개인정보 보유 및 이용 기간</h4>
              <ul>
                <li>수집일로부터 귀하의 개인정보 파기 요청 시까지 보관 및 이용합니다.</li>
                <li>귀하는 언제든지 개인정보 파기를 요청할 수 있으며, 요청 시 해당 정보는 지체 없이 파기됩니다.</li>
              </ul>
              <h4>4. 동의 거부 권리 및 불이익</h4>
              <ul>
                <li>지원자는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다.</li>
                <li>단, 동의를 거부할 경우 선발을 위한 최소한의 연락 및 심사가 불가능하여 지원이 제한될 수 있습니다.</li>
              </ul>
            </div>
            <label className="terms-checkbox">
              <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} />
              <span>개인정보 수집 및 이용에 동의합니다. (필수)</span>
            </label>
          </div>

          <div className="terms-section">
            <div className="terms-title">개인정보 제3자 제공 동의 (필수)</div>
            <div className="terms-content">
              <p>멋쟁이사자처럼 순천향대학교 14기 선발 및 활동을 위하여, 수집된 개인정보가 다음과 같이 제3자((주)멋쟁이사자처럼)에게 제공됨을 알려드립니다. 이는 중앙 통합 시스템 등록 및 공식 수료증 발급을 위해 필수적인 절차입니다.</p>
              <h4>1. 개인정보를 제공받는 자</h4>
              <ul>
                <li>(주)멋쟁이사자처럼</li>
              </ul>
              <h4>2. 제공받는 자의 이용 목적</h4>
              <ul>
                <li>멋쟁이사자처럼 통합 회원 관리 및 시스템 등록</li>
                <li>중앙 해커톤 등 연합 행사 참여 자격 확인</li>
                <li>공식 수료증 발급 및 이력 관리</li>
              </ul>
              <h4>3. 제공하는 개인정보 항목</h4>
              <ul>
                <li>성명, 소속(순천향대학교), 학과, 학번, 전화번호, 이메일</li>
              </ul>
              <h4>4. 보유 및 이용 기간</h4>
              <ul>
                <li>제공받는 자의 회원 탈퇴 및 개인정보 파기 요청 시까지</li>
              </ul>
              <h4>5. 동의 거부 권리 및 불이익</h4>
              <ul>
                <li>귀하는 개인정보 제3자 제공에 대한 동의를 거부할 권리가 있습니다.</li>
                <li>단, 동의를 거부할 경우 본부 시스템 등록이 불가능하여 중앙 해커톤 참여 및 수료증 발급이 제한될 수 있습니다.</li>
              </ul>
            </div>
            <label className="terms-checkbox">
              <input type="checkbox" checked={agreeThirdParty} onChange={(e) => setAgreeThirdParty(e.target.checked)} />
              <span>개인정보 제3자 제공에 동의합니다. (필수)</span>
            </label>
          </div>

          {/* 가입하기 */}
          <div className="row center">
            <button
              className="btn join-btn"
              onClick={signup}
              disabled={pwMismatch || !emailVerified || !agreePrivacy || !agreeThirdParty}
              title={
                !emailVerified
                  ? "이메일 인증을 먼저 완료해주세요."
                  : !agreePrivacy || !agreeThirdParty
                  ? "필수 약관에 동의해주세요."
                  : ""
              }
            >
              가입하기
            </button>
          </div>

          {msg && <div className="msg">{msg}</div>}
        </div>
      </div>
    </div>
  );
}