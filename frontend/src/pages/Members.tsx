import "./Members.css";

import bg from "../assets/team/team_bg.png";
import titleImg from "../assets/team/meet_the_team.png"; // ✅ 추가 (MEET THE TEAM 이미지)

import aiJoaram from "../assets/team/ai_joaram.png";
import vpAhnchaeyeon from "../assets/team/ai_ahnchaeyeon.png";
import pmYujeonghee from "../assets/team/pm_yujeonghee.png";
import fsKimjonggun from "../assets/team/fs_kimjonggun.png";

type Members = {
  key: string;
  name: string;
  roleLine: string;
  trackLine: string;
  tags: string;
  img: string;
  halo?: boolean;
};

const MEMBERS: Members[] = [
  {
    key: "ai",
    name: "AI 조아람",
    roleLine: "대표 / AI",
    trackLine: "",
    tags: "#AI에_관심_있는 #GPT",
    img: aiJoaram,
    halo: true,
  },
  {
    key: "vp",
    name: "VP 안채연",
    roleLine: "부대표 / AI",
    trackLine: "",
    tags: "#AI #꾸준히_배우는_중",
    img: vpAhnchaeyeon,
  },
  {
    key: "pm",
    name: "PM 유정희",
    roleLine: "기획 / 디자인",
    trackLine: "",
    tags: "#창의적이고_문제해결을_좋아하는",
    img: pmYujeonghee,
  },
  {
    key: "fs",
    name: "FS 김종건",
    roleLine: "풀스택",
    trackLine: "",
    tags: "#기술_리더 #프론트 #백엔드",
    img: fsKimjonggun,
  },
];

export default function Members() {
  return (
    <div className="members-page" style={{ backgroundImage: `url(${bg})` }}>
      <div className="members-overlay" />

      <div className="members-inner">
        {/* 상단 타이틀 영역 */}
        <div className="members-head">

          {/* ✅ MEET THE TEAM을 이미지로 */}
          <div className="members-title-img-wrap">
            <img className="members-title-img" src={titleImg} alt="MEET THE TEAM" />
          </div>

          <div className="members-subtitle">14기를 이끌어갈 운영진을 소개합니다.</div>
        </div>

        {/* 카드 그리드 */}
        <div className="members-grid">
          {MEMBERS.map((m) => (
            <div key={m.key} className="member-card">
              <div className="member-photo">
                <div className={`member-photo-frame ${m.halo ? "halo" : ""}`}>
                  <img src={m.img} alt={m.name} />
                </div>
              </div>

              <div className="member-name">{m.name}</div>
              <div className="member-role">{m.roleLine}</div>
              {m.trackLine ? (
                <div className="member-role">{m.trackLine}</div>
              ) : (
                <div className="member-role spacer" />
              )}

              <div className="member-tags">{m.tags}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}