import React from "react";
import {
  DetailPage, DetailBody, DetailNotice, InfoList, yesNoMark, CopyField, Button, Badge,
  FacilityIcon, FACILITY_LABELS, EMERGENCY, facilityBadgeTone, Icon,
} from "../../design-systems/index.js";
import { WALK_M_PER_MIN, FACILITY_AS_OF } from "../main/config.js";

/* S05 시설 상세 (기능명세서 v1.0 4장 S05 행).
 * 관련 기능: U-FC-05(시설 상세) · U-FC-06(거리 표기) · U-FC-07(길찾기 진입)
 *            U-CM-07(정보 기준일자) · U-CM-08(참고용 고지와 119) · U-CM-10(오류 신고)
 *
 *   [AppBar]  ← 뒤로 · 시설명
 *   ─────────────────────────────────
 *   아이콘 · 명칭 · 유형 배지
 *   약 320m, 도보 5분
 *   ─────────────────────────────────
 *   도로명주소                       [복사]
 *   ─────────────────────────────────
 *   유형별 항목 (아래 FIELDS)
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
 * ── 항목은 우리가 정하지 않는다 (2026-08-19) ────────────────────────────
 * 정보는 전부 공공데이터에서 오고, 화면이 보여줄 수 있는 항목은 **입력 항목 정의서
 * 2-1~2-4 에 적힌 것뿐**이다. 유형마다 목록이 다르므로 아래 FIELDS 표가 유일한 출처다 —
 * 여기 없는 항목을 화면에서 조립하면 원천에 없는 값을 지어내게 된다.
 *
 * **선택 항목은 값이 없어도 줄을 지우지 않고 "-" 로 남긴다.** 항목의 존재 자체가 정보라서다
 * (InfoList 머리말). 화장실에 "비상벨 설치 여부" 줄이 아예 없으면, 읽는 사람은 원천에
 * 값이 없는 것인지 우리가 빠뜨린 것인지 구분할 수 없다.
 *
 * ── 화면에 적지 않는 것 ─────────────────────────────────────────────────
 * U-FC-08 의 내부 상한(1km)은 어디에도 쓰지 않는다. 명세가 "사용자 비노출"로 못박고 있고,
 * 목록에서 조용히 빠진 시설이 있다는 사실을 상세에서 흘리면 규칙이 반쪽이 된다.
 * 개방 여부·상시개방 배지도 뺐다 (2026-08-19). 정의서에 없는 항목이고, 운영시간은
 * 쉼터에만 있다.
 */

/* 칸수는 "2칸"처럼 단위를 붙인다 — 숫자만 있으면 무엇의 2 인지 라벨을 다시 읽어야 한다.
   0 도 값이다(대변기 0칸인 화장실이 있다). null 만 "-" 가 된다. */
function count(v) {
  return v == null ? null : `${v}칸`;
}

/* 유형별 항목 — **입력 항목 정의서 2-1 ~ 2-4 그대로다.** 순서도 정의서의 표 순서다.
   `omitEmpty` 를 쓰지 않는다: 여기 있는 항목은 그 유형이라면 언제나 물어야 하는 것들이라,
   비어 있을 때 지우는 것이 아니라 "-" 로 남기는 것이 맞다. */
const FIELDS = {
  /* 2-1 AED — 도로명주소(필수) 는 위 CopyField 가 맡는다 */
  aed: f => [
    { label: "설치 위치", value: f.place },
  ],
  /* 2-2 공중화장실 — 화장실명(필수)은 제목, 도로명주소(필수)는 CopyField.
         아래 8개는 전부 선택이다. 개방시간이 맨 위인 이유: 나머지 일곱은 "가서 쓸 만한가"를
         말하는데 이것은 **가도 되는가**를 말한다. 잠긴 화장실 앞에서 칸수는 소용이 없다.
         남성용/여성용을 한 줄에 묶지 않는다 — 묶으면 한쪽만 있는 곳에서 "2칸 · -" 같은
         읽기 어려운 값이 된다. */
  toilet: f => [
    { label: "개방시간", value: f.hours },
    { label: "남성용 대변기수", value: count(f.menToilet) },
    { label: "남성용 소변기수", value: count(f.menUrinal) },
    { label: "여성용 대변기수", value: count(f.womenToilet) },
    { label: "여성용 소변기수", value: count(f.womenUrinal) },
    /* 있고 없고를 묻는 셋은 ○ · × 다 (yesNoMark). 여러 줄을 한꺼번에 훑는 자리라
       낱말보다 부호가 눈에 먼저 들어온다. 읽어줄 때는 "있음"·"없음"이다. */
    { label: "비상벨 설치 여부", value: yesNoMark(f.emergencyBell) },
    { label: "기저귀 교환대", value: yesNoMark(f.diaperTable) },
    { label: "입구 CCTV", value: yesNoMark(f.entranceCctv) },
  ],
  /* 2-3 쉼터 — 쉼터명칭(필수)은 제목, 도로명주소(필수)는 CopyField */
  rest: f => [
    { label: "운영시간", value: f.hours },
    { label: "이용가능 인원", value: f.capacity != null ? `${f.capacity}명` : null },
    { label: "부가정보", value: f.extra },
  ],
  /* 2-4 대피소 */
  shelter: f => [
    { label: "실제 위치", value: f.place },
    { label: "최대 수용 인원", value: f.capacity != null ? `약 ${f.capacity.toLocaleString("ko-KR")}명` : null },
  ],
};

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
            {/* 색은 디자인 시스템의 유형별 표가 정한다 — 목록(FacilityRow)과 같은 표라
                같은 시설이 목록과 상세에서 다른 색으로 나올 일이 없다 */}
            <Badge tone={facilityBadgeTone(f.type)}>{label}</Badge>
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

        {/* ── 도로명주소 (4종 공통 필수 항목) ──────────────────────────
               라벨을 "도로명주소"로 적는다 — 정의서의 항목명이 그것이고, 지번주소와
               섞이는 자료라 어느 쪽인지가 실제로 갈린다. */}
        <CopyField label="도로명주소" value={f.addr} onCopied={onCopied} />

        {/* ── 유형별 항목 (정의서 2-1 ~ 2-4) ──────────────────────────── */}
        {/* 오류 신고는 신고 대상이 무엇인지 바로 위에 보이는 이 자리에 붙인다 (U-CM-10).
             주 행동이 아니므로 작은 ghost 로 두고 상세 정보 박스에 바짝 붙인다 —
             DetailBody 의 기본 간격(20px)을 그대로 받으면 독립된 섹션처럼 보인다.
             S10 이 아직 없어 지금은 안내 토스트로 떨어진다.

             [지도에서 보기]는 뒀다가 뺐다. 상단에 뒤로가기가 있고 하단에 길찾기가 있어
             지도로 가는 길이 이미 둘이다. 셋째 버튼은 고를 것만 늘린다. */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <InfoList items={(FIELDS[f.type] || (() => []))(f)} />
          <Button variant="ghost" size="sm" icon="flag" onClick={onReport}
            style={{ alignSelf: "flex-start", color: "var(--text-muted)" }}>
            정보 오류 신고
          </Button>
        </div>

        {/* ── 고지 (U-CM-07 · U-CM-08) ────────────────────────────────
               응급 시설을 다루는 화면이므로 119 안내가 특히 중요하다. AED 상세를 보고 있는
               사람은 이미 급한 상황일 수 있고, 이 화면의 정보가 최신이라는 보장이 없다. */}
        {/* 기준일은 **시설 유형마다 다르다** (정의서 3-2). 표준데이터 갱신 주기가 4종 각각
             달라서, 한 값으로 묶으면 어느 한쪽에는 반드시 틀린 날짜가 붙는다. */}
        <DetailNotice asOf={`공공시설 정보 ${FACILITY_AS_OF[f.type] || ""} 기준`} />

        {/* "이 화면보다"를 뺐다 (2026-08-20). 기본 글자 크기에서도 줄이 넘어가 「119 신고」가
             홀로 다음 줄에 떨어졌는데, 이 문장에서 가장 먼저 읽혀야 할 넉 자가 문장 밖으로
             밀려나 보였다. 뺀 말은 급한 사람에게 보탬이 없다 — "119 가 먼저"라고 하면
             무엇보다 먼저인지는 이미 들린다.
             `keep-all` 과 `nowrap` 은 글자를 키웠을 때를 위한 것이다. 줄이 넘어가더라도
             낱말 가운데나 「119」와 「신고」 사이에서 끊기지 않는다. */}
        {urgent ? (
          <p style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)",
            fontSize: "var(--fs-caption)", color: "var(--yong-red-500)", fontWeight: "var(--fw-semibold)",
            lineHeight: 1.55, wordBreak: "keep-all" }}>
            <Icon name="phone" size={16} style={{ flex: "0 0 auto", marginTop: 2 }} />
            <span>심정지나 재난 상황이라면 <b style={{ whiteSpace: "nowrap" }}>119 신고</b>가 먼저입니다.</span>
          </p>
        ) : null}
      </DetailBody>
    </DetailPage>
  );
}

export default FacilityDetail;
