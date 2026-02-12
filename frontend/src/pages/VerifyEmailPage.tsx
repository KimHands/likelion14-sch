import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetMe, apiSendEmailCode, apiVerifyEmailCode } from "../api/auth";

export default function VerifyEmailPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 현재 로그인된 me에서 email 자동 채우기
  useEffect(() => {
    apiGetMe()
      .then((me) => setEmail(me.email))
      .catch(() => setEmail(""));
  }, []);

  // 타이머
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const mmss = useMemo(() => {
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const s = String(secondsLeft % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  const onSend = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const r = await apiSendEmailCode(email);
      setSecondsLeft(r.expires_in);
      setMsg("인증 코드가 발송되었습니다. 메일을 확인해주세요.");
    } catch {
      setMsg("발송 실패: 이메일/서버 상태를 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    setMsg(null);
    setLoading(true);
    try {
      await apiVerifyEmailCode(email, code);

      // ✅ me 재조회 (email_verified true 반영)
      await apiGetMe();

      setMsg("인증 성공! 지원서 페이지로 이동합니다.");
      setTimeout(() => nav("/apply", { replace: true }), 300);
    } catch {
      setMsg("인증 실패: 코드가 틀리거나 만료되었습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "70px auto", padding: 24 }}>
      <h2>이메일 인증</h2>
      <p style={{ color: "#666" }}>학교 이메일로 발송된 6자리 코드를 입력하세요.</p>

      <div style={{ marginTop: 16 }}>
        <label>이메일</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          placeholder="test@sch.ac.kr"
        />
      </div>

      <button
        onClick={onSend}
        disabled={loading || !email}
        style={{ width: "100%", padding: 12, marginTop: 12 }}
      >
        인증 코드 발송 {secondsLeft > 0 ? `(남은시간 ${mmss})` : ""}
      </button>

      <div style={{ marginTop: 16 }}>
        <label>인증 코드</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          placeholder="6자리"
          maxLength={6}
        />
      </div>

      <button
        onClick={onVerify}
        disabled={loading || code.length !== 6}
        style={{ width: "100%", padding: 12, marginTop: 12 }}
      >
        인증 확인
      </button>

      {msg && <div style={{ marginTop: 12 }}>{msg}</div>}
    </div>
  );
}