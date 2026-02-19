import "./HomeFooter.css";
import instagramIcon from "../assets/icons/Instagram.png";
import githubIcon from "../assets/icons/github.png";

export default function HomeFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        <div className="home-footer-left">
          <div className="pill">Contact</div>

          <div className="contact-row">
            <img src={instagramIcon} alt="Instagram" className="contact-icon" />
            <span>@likelion_sch</span>
          </div>
          <div className="contact-row">
            <img src={githubIcon} alt="GitHub" className="contact-icon" />
            <span>@LikeLionSCH</span>
          </div>
        </div>

        <div className="home-footer-center">
          Copyright © 2026 SCH LIKELION. All rights reserved.
        </div>

        <div className="home-footer-right">
          <div className="pill">Credit</div>
          <div className="credit-grid">
            <div>김도현</div>
            <div>김종건</div>
            <div>유정희</div>
            <div>조아람</div>
          </div>
        </div>
      </div>
    </footer>
  );
}