import { useNavigate } from "react-router-dom";
import "./SignupDone.css";

import doneIcon from "../assets/signup_done_icon.png";

export default function SignupDone() {
  const nav = useNavigate();

  return (
    <div className="done-page">
      <div className="done-wrap">
        <div className="done-icon">
          <img src={doneIcon} alt="done" />
        </div>

        <div className="done-title">회원가입이 완료되었습니다!</div>
        <div className="done-desc">순천향대 멋쟁이사자처럼 14기에 오신 것을 환영합니다.</div>

        <div className="done-actions">
          <button className="done-btn ghost" onClick={() => nav("/")}>
            홈으로 가기
          </button>
          <button className="done-btn primary" onClick={() => nav("/login")}>
            로그인 하러 가기
          </button>
        </div>
      </div>
    </div>
  );
}