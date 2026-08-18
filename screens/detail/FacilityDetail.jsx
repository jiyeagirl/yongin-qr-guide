import React from "react";
import {
  DetailPage, DetailBody, DetailNotice, InfoList, CopyField, Button, Badge,
  FacilityIcon, FACILITY_LABELS, EMERGENCY, Icon,
} from "../../design-systems/index.js";
import { WALK_M_PER_MIN, FACILITY_AS_OF } from "../main/config.js";

/* S05 시설 상세 (기능명세서 v1.0 4장 S05 행).
 * 관련 기능: U-FC-05(시설 상세) · U-FC-06(거리 표기) · U-FC-07(길찾기 진입)
 *            U-CM-07(정보 기준일자) · U-CM-08(참고용 고지와 119) · U-CM-10(오류 신고)
 *
 *   [AppBar]  ← 뒤로 · 시설명
 *   ─────────────────────────────────
 *   아이콘 · 명칭 · 유형 배지 · 상시개방 배지
 *   약 320m, 도보 5분
 *   ─────────────────────────────────
 *   주소                            [복사]
 *   ─────────────────────────────────
 *   상세 위치 / 운영시간 / 개방 여부 / 부가정보
 *   [정보 오류 신고]                  ← 신고 대상이 바로 위에 보이는 자리
 *   ─────────────────────────────────
 *   기준일자 · 참고용 고지 · 119
 *   ─────────────────────────────────
 *   [길찾기]                          ← sticky 하단
 *
 * ── 이 화면이 상세 화면들의 기준이다 ────────────────────────────────────
 * S03 이 지도 화면의 기준이었던 것처럼, 여기서 정한 것이 S06·S08·S09·S10 에 복제된다:
 * 페이지 셸(DetailPage), 주소 복사 자리, 길찾기 CTA 의 위치, 고지 문구의 순서.
 * 새 상세 화면을 만들 때 이 배치를 다시 정하지 않는다.
 *
 * ── 화면에 적지 않는 것 ─────────────────────────────────────────────────
 * U-FC-08 의 내부 상한(1km)은 어디에도 쓰지 않는다. 명세가 "사용자 비노출"로 못박고 있고,
 * 목록에서 조용히 빠진 시설이 있다는 사실을 상세에서 흘리면 규칙이 반쪽이 된다.
 */
export function FacilityDetail({ facility, onBack, onRoute, onReport, onCopied }) {
  const f = facility;
  const urgent = EMERGENCY.includes(f.type);
  const label = FACILITY_LABELS[f.type] || "공공시설";

  /* 목록(FacilityRow)과 같은 규칙으로 환산한다 — 목록에서 "약 1.4km"로 본 것이
     상세에서 "약 1400m"가 되면 다른 시설로 읽힌다 (U-FC-06) */
  const walk = Math.max(1, Math.round(f.dist / WALK_M_PER_MIN));
  const distance = f.dist >= 1000 ? `약 ${(f.dist / 1000).toFixed(1)}km` : `약 ${f.dist}m`;

  return (
    <DetailPage title={f.name} onBack={onBack}
      /* 주 행동은 길찾기 하나다 (U-FC-07). 여기에 두 번째 버튼을 나란히 놓으면 둘 다 좁아지고,
         AED 를 찾는 사람에게 고를 것을 주게 된다. 보조 행동은 본문 안에 있다. */
      footer={<Button variant="primary" size="lg" icon="footprints" block onClick={onRoute}>길찾기</Button>}>

      <DetailBody>
        {/* ── 머리 — 무엇인지, 얼마나 먼지 ───────────────────────────────
               배지는 전체 폭의 제 줄에 두고, 아이콘은 **시설명 옆**에 붙인다.
               아이콘을 배지·이름·거리 전체의 왼쪽에 세우면 배지 옆에 있는 것처럼 읽혀
               "AED 아이콘"이 아니라 "이 배지 묶음의 아이콘"이 된다. */}
        <header>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "var(--space-2)" }}>
            {/* 유형을 글자로 한 번 더 적는다 — 지도 핀은 색으로만 4종을 가르는데
                색약 사용자에게는 그것이 구분이 되지 않는다 (6장 남은 확인사항 #1) */}
            <Badge tone={urgent ? "danger" : "info"}>{label}</Badge>
            {f.always ? <Badge tone="success">상시 개방</Badge> : null}
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
            <span style={{ flex: "0 0 auto", paddingTop: 3 }}>
              <FacilityIcon type={f.type} size={26} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ font: "var(--type-title-2)", letterSpacing: "var(--ls-snug)",
                color: "var(--text-heading)", wordBreak: "keep-all" }}>{f.name}</h2>
              <p style={{ marginTop: 4, fontSize: "var(--fs-body)", color: "var(--text-body)" }}>
                {distance}, 도보 {walk}분
              </p>
            </div>
          </div>
        </header>

        {/* ── 주소 복사 (U-FC-05) ──────────────────────────────────────── */}
        <CopyField value={f.addr} onCopied={onCopied} />

        {/* ── 유형별 상세 (U-FC-05) ────────────────────────────────────
               값이 없는 항목은 InfoList 가 걸러내므로 여기서 조건문을 쓰지 않는다.
               순서는 "가서 쓸 수 있는가"가 먼저다 — 어디에 있고(상세 위치), 열려 있는가(운영시간).
               부가정보(칸 수, 설치층, 수용 인원)는 그 다음이다. */}
        {/* 오류 신고는 신고 대상이 무엇인지 바로 위에 보이는 이 자리에 붙인다 (U-CM-10).
             주 행동이 아니므로 작은 ghost 로 두고 상세 정보 박스에 바짝 붙인다 —
             DetailBody 의 기본 간격(20px)을 그대로 받으면 독립된 섹션처럼 보인다.
             S10 이 아직 없어 지금은 안내 토스트로 떨어진다.

             [지도에서 보기]는 뒀다가 뺐다. 상단에 뒤로가기가 있고 하단에 길찾기가 있어
             지도로 가는 길이 이미 둘이다. 셋째 버튼은 고를 것만 늘린다. */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <InfoList items={[
            { label: "상세 위치", value: f.detail },
            { label: "운영시간", value: f.hours },
            { label: "개방 여부", value: f.always ? "상시 개방" : "운영시간 내 개방" },
            { label: "부가정보", value: f.extra },
          ]} />
          <Button variant="ghost" size="sm" icon="flag" onClick={onReport}
            style={{ alignSelf: "flex-start", color: "var(--text-muted)" }}>
            정보 오류 신고
          </Button>
        </div>

        {/* ── 고지 (U-CM-07 · U-CM-08) ────────────────────────────────
               응급 시설을 다루는 화면이므로 119 안내가 특히 중요하다. AED 상세를 보고 있는
               사람은 이미 급한 상황일 수 있고, 이 화면의 정보가 최신이라는 보장이 없다. */}
        <DetailNotice asOf={`공공시설 정보 ${FACILITY_AS_OF}`} />

        {urgent ? (
          <p style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)",
            fontSize: "var(--fs-caption)", color: "var(--yong-red-500)", fontWeight: "var(--fw-semibold)",
            lineHeight: 1.55 }}>
            <Icon name="phone" size={16} style={{ flex: "0 0 auto", marginTop: 2 }} />
            심정지나 재난 상황이라면 이 화면보다 <b>119 신고</b>가 먼저입니다.
          </p>
        ) : null}
      </DetailBody>
    </DetailPage>
  );
}

export default FacilityDetail;
