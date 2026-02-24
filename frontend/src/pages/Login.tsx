import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import "./Login.css";

import logo from "../assets/likelion_sch_logo.png";

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const em = email.trim();
    if (!em || !password) {
      setMsg("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      // 백엔드가 /api/auth/login 으로 되어있는 흐름을 그대로 사용
      const res = await apiFetch<{ ok?: boolean }>(`/api/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email: em, password }),
      });

      // 프로젝트에 따라 login이 그냥 200 + 토큰쿠키 세팅일 수 있어서
      // ok 없어도 성공 취급(실패는 catch로 오거나 ok:false로 오게 보통 구성)
      if (res?.ok === false) {
        setMsg("로그인에 실패했습니다. 입력 정보를 확인해주세요.");
        return;
      }

      // 로그인 성공 후 이동(원하는 라우트로 바꿔도 됨)
      nav("/");
    } catch {
      setMsg("로그인에 실패했습니다. 입력 정보를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="LIKELION SCH" />
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-row">
            <div className="login-label">이메일</div>
            <input
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="login-row">
            <div className="login-label">비밀번호</div>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div className="login-links">
            <button
              type="button"
              className="login-link"
              onClick={() => nav("/signup")}
            >
              회원가입
            </button>
            <div className="login-link-divider">|</div>
            <button
              type="button"
              className="login-link"
              onClick={() => nav("/reset-password")}
            >
              비밀번호 재설정
            </button>
          </div>

          {msg && <div className="login-msg">{msg}</div>}
        </form>
      </div>
    </div>
  );
}