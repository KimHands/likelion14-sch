import { useState } from "react";
import { Link } from "react-router-dom";
import "./HomeHeader.css";
import type { MeResponse } from "../auth/types";
import { apiLogout } from "../api/auth";
import logo from "../assets/likelion_white_logo.png";

type HomeHeaderProps = {
  scrolled: boolean;
  onClickIntro: () => void;
  onClickProjects: () => void;
  onClickSessions: () => void;
  onClickLogin: () => void;

  // ✅ 바뀜: 버튼 1개를 "지원하기 or 관리자"로 재활용
  onClickPrimary: () => void;

  // ✅ 추가: 로그인 사용자 정보
  me: MeResponse | null;
};

export default function HomeHeader({
  scrolled,
  onClickIntro,
  onClickProjects,
  onClickSessions,
  onClickLogin,
  onClickPrimary,
  me,
}: HomeHeaderProps) {
  const isInstructor = me?.role === "INSTRUCTOR";
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // API 실패해도 클라이언트 측 로그아웃 처리 진행
    } finally {
      localStorage.clear(); // 모든 localStorage 정리
      sessionStorage.clear(); // 모든 sessionStorage 정리

      // 쿠키도 정리 (csrftoken, sessionid 등)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // 강제 리로드
      window.location.href = '/';
    }
  };

  return (
    <>
      <header className={`home-header ${scrolled ? "scrolled" : ""}`}>
        <div className="home-header-inner">
          <div className="home-header-left">
            <Link to="/">
              <img src={logo} alt="멋쟁이사자처럼 SCH" className="home-header-logo" style={{ cursor: 'pointer' }} />
            </Link>
          </div>

          <div className="home-header-line" />

          {/* 데스크탑 네비게이션 */}
          <nav className="home-header-nav">
            <button className="home-nav-link" onClick={onClickIntro}>
              소개
            </button>
            <button className="home-nav-link" onClick={onClickProjects}>
              프로젝트
            </button>
            <button className="home-nav-link" onClick={onClickSessions}>
              교육세션
            </button>

            {/* ✅ 로그인/로그아웃 분기 */}
            {!me ? (
              <Link className="home-nav-link" to="/login" onClick={onClickLogin}>
                로그인
              </Link>
            ) : (
              <button className="home-nav-link" onClick={handleLogout}>
                로그아웃
              </button>
            )}

            {/* ✅ INSTRUCTOR면 관리자 페이지, 아니면 지원하기 */}
            <button className="home-nav-btn" onClick={onClickPrimary}>
              {isInstructor ? "관리자 페이지" : "14기 지원하기"}
            </button>
          </nav>

          {/* 햄버거 버튼 (모바일) */}
          <button
            className={`home-hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="메뉴 열기"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* 모바일 드로어 오버레이 */}
      {menuOpen && (
        <div className="home-mobile-overlay" onClick={closeMenu} />
      )}

      {/* 모바일 드로어 메뉴 */}
      <nav className={`home-mobile-menu ${menuOpen ? "open" : ""}`}>
        <button className="home-mobile-nav-link" onClick={() => { onClickIntro(); closeMenu(); }}>
          소개
        </button>
        <button className="home-mobile-nav-link" onClick={() => { onClickProjects(); closeMenu(); }}>
          프로젝트
        </button>
        <button className="home-mobile-nav-link" onClick={() => { onClickSessions(); closeMenu(); }}>
          교육세션
        </button>

        {!me ? (
          <Link className="home-mobile-nav-link" to="/login" onClick={() => { onClickLogin(); closeMenu(); }}>
            로그인
          </Link>
        ) : (
          <button className="home-mobile-nav-link" onClick={() => { handleLogout(); closeMenu(); }}>
            로그아웃
          </button>
        )}

        <button className="home-mobile-nav-btn" onClick={() => { onClickPrimary(); closeMenu(); }}>
          {isInstructor ? "관리자 페이지" : "14기 지원하기"}
        </button>
      </nav>
    </>
  );
}