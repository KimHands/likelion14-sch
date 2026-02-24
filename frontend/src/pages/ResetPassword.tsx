import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import "./ResetPassword.css";

import logo from "../assets/likelion_sch_logo.png";

type Step = "email" | "verify" | "reset" | "done";

function formatMMSS(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

export default function ResetPassword() {
  const nav = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const [remainSec, setRemainSec] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 타이머 카운트다운
  useEffect(() => {
    if (remainSec <= 0) return;
    const t = setInterval(() => setRemainSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [remainSec]);

  const pwMismatch = pw2.length > 0 && pw !== pw2;

  const canSendCode = useMemo(() => {
    const em = email.trim().toLowerCase();
    return em.endsWith("@sch.ac.kr") && remainSec === 0;
  }, [email, remainSec]);

  // Step 1: 인증코드 발송
  const sendCode = async () => {
    setMsg(null);
    const em = email.trim().toLowerCase();
    if (!em.endsWith("@sch.ac.kr")) {
      setMsg("학교 이메일(@sch.ac.kr)만 가능합니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ ok: boolean; expires_in: number }>(
        "/api/auth/password/send-code",
        { method: "POST", body: JSON.stringify({ email: em }) }
      );
      if (!res.ok) {
        setMsg("인증코드 전송에 실패했습니다.");
        return;
      }
      setRemainSec(res.expires_in ?? 120);
      setStep("verify");
    } catch {
      setMsg("인증코드 전송 실패 (서버 오류)");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: 인증코드 확인
  const verifyCode = async () => {
    setMsg(null);
    if (!code.trim()) {
      setMsg("인증번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ ok: boolean }>(
        "/api/auth/email/verify",
        {
          method: "POST",
          body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
        }
      );
      if (!res.ok) {
        setMsg("인증 실패: 코드가 올바르지 않거나 만료되었습니다.");
        return;
      }
      setStep("reset");
      setMsg(null);
    } catch {
      setMsg("인증 실패 (서버 오류)");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: 비밀번호 재설정
  const resetPassword = async () => {
    setMsg(null);
    if (!pw || pw.length < 8) {
      setMsg("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }
    if (pwMismatch) {
      setMsg("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ ok: boolean; error?: string }>(
        "/api/auth/password/reset",
        {
          method: "POST",
          body: JSON.stringify({ email: email.trim().toLowerCase(), password: pw }),
        }
      );
      if (!res.ok) {
        if (res.error === "EMAIL_VERIFICATION_EXPIRED") {
          setMsg("인증 유효시간이 만료되었습니다. 처음부터 다시 시도해주세요.");
          setStep("email");
          setCode("");
          setPw("");
          setPw2("");
          setRemainSec(0);
        } else if (res.error === "PASSWORD_TOO_SHORT") {
          setMsg("비밀번호는 최소 8자 이상이어야 합니다.");
        } else {
          setMsg(`비밀번호 변경 실패: ${res.error}`);
        }
        return;
      }
      setStep("done");
    } catch {
      setMsg("비밀번호 변경 실패 (서버 오류)");
    } finally {
      setLoading(false);
    }
  };

  const goBackToEmail = () => {
    setStep("email");
    setCode("");
    setRemainSec(0);
    setMsg(null);
  };

  const stepOrder: Step[] = ["email", "verify", "reset", "done"];
  const stepIdx = stepOrder.indexOf(step);

  return (
    <div className="rp-page">
      <div className="rp-card">
        <div className="rp-logo">
          <img src={logo} alt="LIKELION SCH" />
        </div>

        <div className="rp-title">비밀번호 재설정</div>

        {/* 단계 표시 */}
        <div className="rp-steps">
          {(["1. 이메일 인증", "2. 코드 확인", "3. 비밀번호 변경"] as const).map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <div className="rp-step-divider">›</div>}
              <div className={`rp-step ${stepIdx === i ? "active" : stepIdx > i ? "done" : ""}`}>
                {label}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: 이메일 입력 */}
        {step === "email" && (
          <div className="rp-form">
            <div className="rp-row">
              <div className="rp-label">이메일</div>
              <div className="rp-input-wrap">
                <input
                  className="rp-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@sch.ac.kr"
                  autoComplete="email"
                  onKeyDown={(e) => e.key === "Enter" && canSendCode && !loading && sendCode()}
                />
                <button
                  className="rp-btn-sub"
                  type="button"
                  onClick={sendCode}
                  disabled={!canSendCode || loading}
                >
                  {loading ? "전송 중..." : "인증코드 발송"}
                </button>
              </div>
            </div>
            <div className="rp-hint">*순천향대학교 이메일(@sch.ac.kr)만 사용 가능합니다.</div>
          </div>
        )}

        {/* Step 2: 인증번호 확인 */}
        {step === "verify" && (
          <div className="rp-form">
            <div className="rp-row">
              <div className="rp-label">이메일</div>
              <input className="rp-input rp-readonly" value={email} readOnly />
            </div>
            <div className="rp-row">
              <div className="rp-label">인증번호</div>
              <div className="rp-input-wrap">
                <input
                  className="rp-input"
                  value={code}
                  onChange={(e) => setCode(onlyDigits(e.target.value))}
                  maxLength={6}
                  placeholder="6자리 숫자"
                  autoComplete="one-time-code"
                  onKeyDown={(e) => e.key === "Enter" && !loading && verifyCode()}
                />
                <div className={`rp-timer ${remainSec > 0 ? "on" : ""}`}>
                  {remainSec > 0 ? formatMMSS(remainSec) : ""}
                </div>
                <button
                  className="rp-btn-sub"
                  type="button"
                  onClick={verifyCode}
                  disabled={!code.trim() || loading}
                >
                  {loading ? "확인 중..." : "인증 확인"}
                </button>
              </div>
            </div>
            <div className="rp-resend">
              코드를 받지 못하셨나요?{" "}
              <button className="rp-link" type="button" onClick={goBackToEmail}>
                이메일 다시 입력
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 새 비밀번호 */}
        {step === "reset" && (
          <div className="rp-form">
            <div className="rp-row">
              <div className="rp-label">이메일</div>
              <input className="rp-input rp-readonly" value={email} readOnly />
            </div>
            <div className="rp-row">
              <div className="rp-label">새 비밀번호</div>
              <input
                className="rp-input"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="rp-hint">*최소 8자, 영문 대소문자, 숫자, 특수기호 사용 권장</div>
            <div className="rp-row">
              <div className="rp-label">비밀번호 확인</div>
              <input
                className="rp-input"
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                autoComplete="new-password"
                onKeyDown={(e) =>
                  e.key === "Enter" && !pwMismatch && pw.length >= 8 && !loading && resetPassword()
                }
              />
            </div>
            {pwMismatch && <div className="rp-error">*비밀번호가 일치하지 않습니다.</div>}
            <div className="rp-actions">
              <button
                className="rp-btn-primary"
                type="button"
                onClick={resetPassword}
                disabled={!pw || !pw2 || pwMismatch || loading}
              >
                {loading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: 완료 */}
        {step === "done" && (
          <div className="rp-done">
            <div className="rp-done-icon">✓</div>
            <div className="rp-done-title">비밀번호가 변경되었습니다!</div>
            <div className="rp-done-sub">새 비밀번호로 로그인해주세요.</div>
            <button
              className="rp-btn-primary"
              type="button"
              onClick={() => nav("/login")}
            >
              로그인으로 이동
            </button>
          </div>
        )}

        {msg && <div className="rp-msg">{msg}</div>}

        {step !== "done" && (
          <div className="rp-back">
            <button className="rp-link" type="button" onClick={() => nav("/login")}>
              ← 로그인으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
