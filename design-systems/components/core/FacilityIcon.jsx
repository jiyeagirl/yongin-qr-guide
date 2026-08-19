import React from "react";
import { Icon } from "./Icon.jsx";

/* 공공시설 4종 아이콘 (U-CM-05, 기능명세서 5-2).
   글리프를 바꾸려면 여기 한 곳만 고친다 — 목록·칩·미리보기·상세가 모두 이 표를 본다.

   쉼터는 `armchair` 였다가 `parasol` 로 바꿨다 (2026-08-14).
   안락의자는 가구로 읽혀 "앉는 물건"을 가리키지, 길에 있는 장소를 가리키지 못했다.
   실제 대상은 그늘쉼터·무더위쉼터가 대부분이고 파라솔이 그 표지판의 관용 기호다.
   `sofa`/`bed` 는 같은 이유로 탈락, `tree-deciduous` 는 공원과 구분되지 않고,
   `umbrella` 는 비로 읽힌다.

   `all` 은 5번째 시설 유형이 아니라 필터 칩의 "전체"다. 업종 칩의 전체와 같은 layout-grid 를 쓴다. */
export const FACILITY_ICONS = { all: "layout-grid", aed: "heart-pulse", toilet: "toilet", rest: "parasol", shelter: "shield" };
export const FACILITY_LABELS = { all: "전체", aed: "AED", toilet: "화장실", rest: "쉼터", shelter: "대피소" };

/* ── 두 가지 분류를 구분한다. 하나로 뭉치면 지도의 붉은색이 뜻을 잃는다 ──────────
 *
 * SAFETY    목록에서 "안전시설" 섹션으로 묶이는 유형. 쉼터가 여기 들어간다 —
 *           이 서비스의 쉼터는 무더위쉼터·한파쉼터이고, 폭염은 실제 인명 피해가 나는 재난이다.
 *           편의시설로 남는 것은 화장실 하나뿐이다.
 *
 * EMERGENCY 지도 핀을 **적색**으로 칠하는 유형. AED 와 대피소뿐이다 (기능명세서 5-2 유지).
 *           쉼터를 여기 넣지 않는 이유: 붉은색은 "지금 당장"을 뜻해야 하는데
 *           4종 중 3종이 붉으면 색이 아무것도 구분하지 못한다. 심정지와 재난 대피는
 *           분 단위로 다투는 일이고 무더위쉼터는 그 층위가 아니다.
 *           쉼터의 안전 성격은 **섹션 배치**로 드러내고, 색은 중립 계열로 남긴다.
 */
export const SAFETY = ["aed", "shelter", "rest"];
export const EMERGENCY = ["aed", "shelter"];
export const CONVENIENCE = ["toilet"];

/* 목록·칩의 표시 순서. 안전시설이 앞이고 그 안에서도 긴급한 것이 앞이다.
   `all` 은 칩에서만 쓰이므로 여기 넣지 않는다. */
export const FACILITY_TYPES = ["aed", "shelter", "rest", "toilet"];

/* 유형별 핀 색. 지도 마커(KakaoMap)와 목록의 유형 배지가 같은 값을 본다 —
   지도에서 본 색과 목록에서 본 색이 어긋나면 둘을 같은 것으로 읽지 못한다. */
export const FACILITY_PIN = { aed: "--pin-aed", shelter: "--pin-shelter", toilet: "--pin-toilet", rest: "--pin-rest" };

/* 목록·상세의 유형 배지 톤 (2026-08-19 신설). 위 핀 색과 **같은 계열**을 본다 —
   지도에서 본 색과 목록에서 본 색이 어긋나면 둘을 같은 것으로 읽지 못한다.

   전에는 부르는 쪽마다 `tone={urgent ? "danger" : "info"}` 를 적었다. 그 삼항은 4종을
   2색으로 뭉개서, **화장실과 쉼터의 배지가 완전히 같은 색**이었다 (AED·대피소도 마찬가지).
   지도 핀은 teal-700 / teal-500 으로 갈려 있는데 목록은 갈리지 않아, 색이 유형을
   말하다 마는 상태였다. 화장실을 파랑으로 옮겨(icons.css 의 --pin-toilet 주석) 표로 세운다.

   **AED 와 대피소는 여전히 같은 빨강이다.** 기능명세서 5-2 가 "AED와 대피소는 적색 계열"
   이라고 못박아 색으로는 가를 자리가 아니다 — 그 둘을 가르는 것은 배지의 **글자**이고,
   애초에 배지를 단 이유가 그것이다 (FacilityRow 머리말 · 6장 남은 확인사항 #1).
   화장실·쉼터는 그런 제약이 없다. 5-2 는 "중립 계열"만 요구하고 파랑도 중립 계열이다. */
export const FACILITY_BADGE = { aed: "danger", shelter: "danger", toilet: "blue", rest: "info" };
export function facilityBadgeTone(type) { return FACILITY_BADGE[type] || "info"; }

export function FacilityIcon({ type, size = 24, emphasis = true, style, ...rest }) {
  /* emphasis: 안전시설을 적색으로 물들인다. 칩처럼 색이 선택 상태를 뜻하는 자리에서는 꺼야 한다 */
  const color = emphasis && EMERGENCY.includes(type) ? "var(--pin-emergency)" : undefined;
  return <Icon name={FACILITY_ICONS[type] || "map-pin"} size={size} color={color} style={style} {...rest} />;
}
