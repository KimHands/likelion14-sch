import React, { useMemo } from "react";
import "./ResultModal.css";

type Decision = "PENDING" | "ACCEPTED" | "REJECTED";

type Track = "PLANNING_DESIGN" | "FRONTEND" | "BACKEND" | "AI_SERVER";

const TRACK_LABEL: Record<Track, string> = {
  PLANNING_DESIGN: "기획/디자인",
  FRONTEND: "프론트엔드",
  BACKEND: "백엔드",
  AI_SERVER: "AI",
};

export type ResultModalData = {
  // 사용자 기본 정보
  name: string;
  student_id: string;
  department: string;

  // 지원 트랙
  track: Track;

  // 결과
  doc_decision: Decision;   // 서류 결과
  final_decision: Decision; // 최종 결과

  // 아래는 “하드코딩/운영에서 넣어줄 값”
  // (서류 합격자 안내용)
  interview_location?: string | null;
  interview_date?: string | null;   // "2026년 03월 05일"
  interview_deadline?: string | null; // "18:00 까지"

  // (최종 합격자 안내용)
  ot_datetime?: string | null; // "2026년 03월 09일 18:00"
};

export default function ResultModal({
  data,
  onClose,
}: {
  data: ResultModalData;
  onClose: () => void;
}) {
  // ✅ 어떤 화면을 보여줄지 결정 (우선순위: 최종 > 서류)
  const view = useMemo<"FINAL_ACCEPT" | "FINAL_REJECT" | "DOC_ACCEPT" | "DOC_REJECT" | "NONE">(() => {
    if (data.final_decision === "ACCEPTED") return "FINAL_ACCEPT";
    if (data.final_decision === "REJECTED") return "FINAL_REJECT";
    if (data.doc_decision === "ACCEPTED") return "DOC_ACCEPT";
    if (data.doc_decision === "REJECTED") return "DOC_REJECT";
    return "NONE";
  }, [data.final_decision, data.doc_decision]);

  if (view === "NONE") return null;

  const title =
    view === "FINAL_ACCEPT" || view === "FINAL_REJECT"
      ? "멋쟁이사자처럼 순천향대학교 최종 합격자 조회"
      : "멋쟁이사자처럼 순천향대학교 서류 합격자 조회";

  const passFailText =
    view === "DOC_ACCEPT" || view === "FINAL_ACCEPT" ? "합격" : "불합격";

  const passFailClass =
    view === "DOC_ACCEPT" || view === "FINAL_ACCEPT" ? "pass" : "fail";

  // ✅ 하드코딩 기본값(원하면 여기 숫자/문구만 바꿔도 됨)
  const interviewLocation = data.interview_location ?? "향설생활관 1관 RC218";
  const interviewDate = data.interview_date ?? "2026년 03월 05일";
  const interviewDeadline = data.interview_deadline ?? "18:00 까지";
  const otDatetime = data.ot_datetime ?? "2026년 03월 09일 18:00";

  const bodyMessage = (() => {
    if (view === "DOC_ACCEPT") {
      return (
        <div className="rm-message pass">
          서류 합격을 축하드립니다! 면접 입실 시간을 꼭 준수해 주시기 바랍니다.
        </div>
      );
    }
    if (view === "DOC_REJECT") {
      return (
        <div className="rm-reject-box">
          <div className="rm-reject-title">귀한 시간을 내어 지원해 주셔서 진심으로 감사드립니다.</div>
          <div className="rm-reject-text">
            지원자님의 뛰어난 역량과 열정에도 불구하고,<br />
            한정된 선발 인원으로 인해<br />
            아쉽게도 이번 여정은 함께하지 못하게 되었습니다.<br />
            <br />
            비록 이번에는 아쉬운 결과를 전해드리지만,<br />
            추후 더 좋은 인연과 기회로 다시 뵙기를 진심으로 기원합니다.
          </div>
        </div>
      );
    }
    if (view === "FINAL_ACCEPT") {
      return (
        <div className="rm-final-pass-box">
          <div className="rm-final-pass-title">최종 합격을 축하드립니다!</div>
          <div className="rm-final-pass-text">
            앞으로 1년간 함께 성장할 여정이 기대됩니다.<br />
            하단에 첨부된 공지사항을 반드시 숙지해 주시기 바라며,<br />
            건강한 모습으로 OT 날 뵙겠습니다.
          </div>
        </div>
      );
    }
    // FINAL_REJECT
    return (
      <div className="rm-reject-box">
        <div className="rm-reject-title">지원해 주셔서 진심으로 감사드립니다.</div>
        <div className="rm-reject-text">
          최종 선발 과정에서 아쉽게도 함께하지 못하게 되었습니다.<br />
          함께하지 못해 아쉽지만, 앞으로의 도전과 성장을 응원합니다.<br />
          더 좋은 기회로 다시 만나길 진심으로 바랍니다.
        </div>
      </div>
    );
  })();

  const showInterviewFields = view === "DOC_ACCEPT";
  const showOtFields = view === "FINAL_ACCEPT";

  return (
    <div className="rm-backdrop" role="dialog" aria-modal="true" aria-label="합불 안내">
      <div className="rm-modal">
        <div className="rm-header">
          <div className="rm-header-title">{title}</div>
        </div>

        <div className="rm-table">
          <Row label="이름" value={data.name || "-"} />
          <Row label="학번" value={data.student_id || "-"} />
          <Row label="학과/학부" value={data.department || "-"} />
          <Row label="지원 트랙" value={TRACK_LABEL[data.track] ?? data.track} />

          <Row
            label="합격 여부"
            value={<span className={`rm-decision ${passFailClass}`}>{passFailText}</span>}
          />

          {showInterviewFields && (
            <>
              <Row label="면접 장소" value={interviewLocation} />
              <Row label="면접 일자" value={interviewDate} />
              <Row label="입실 시간" value={interviewDeadline} />
            </>
          )}

          {showOtFields && (
            <>
              <Row label="OT 일시" value={otDatetime} />
            </>
          )}
        </div>

        <div className="rm-footer">
          {bodyMessage}

          <div className="rm-actions">
            <button className="rm-close" type="button" onClick={onClose}>
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rm-row">
      <div className="rm-cell label">{label}</div>
      <div className="rm-cell value">{value}</div>
    </div>
  );
}