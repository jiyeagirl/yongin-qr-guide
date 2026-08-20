import {
  MAP_LEVEL, TAB_MAP_LEVEL, WALK_ROUTE_QUOTA, FACILITY_AS_OF, STORE_AS_OF,
} from "../../screens/main/config.js";
import { NEAR_LIMIT, NEAR_ENOUGH } from "../../screens/main/data/facilities.js";

/* 설정값 세 벌 — 운영 설정(8-1) · API 쿼터(8-2) · 데이터 기준일(7장).
 *
 * ── 기본값을 여기서 지어내지 않는다 ─────────────────────────────────────────
 * 명세서가 적은 기본값과 시민용 config.js 가 실제로 쓰는 값이 **같아야 한다.**
 * 지금 시민 화면은 config.js 를 읽고 관리자는 이 파일을 읽으니, 두 곳에 숫자를 따로
 * 적어 두면 담당자가 관리자에서 본 "탭 기본 줌 4"와 실제 화면의 줌이 갈릴 수 있다.
 * 그래서 config.js 에 이미 있는 값은 **가져다 쓴다.** 없는 값(임계 거리 등)만 여기 적고,
 * 그 사실을 화면이 한 줄로 밝힌다.
 *
 * ── 여기서 고쳐도 시민 화면은 바뀌지 않는다 ─────────────────────────────────
 * config.js 는 모듈 상수라 관리자가 밀어 넣을 수 없고, 애초에 두 화면이 다른 탭에서 뜬다.
 * 실연동 때는 이 값이 서버에 저장되고 시민 화면이 그것을 받아 쓴다 — 그때 config.js 의
 * 해당 상수들이 서버 응답으로 대체된다. 상단 띠가 그 사실을 늘 적는다.
 */

/* ── 8-1 서비스 운영 설정 ────────────────────────────────────────────────────
   거리 값이 두 개다. 명세서 8-1 이 역할을 갈라 적었고, **시민 화면이 이미 그대로 돌고 있다**:

     facility_radius_m 2km   목록에 담는 범위 (facilities.js 의 NEAR_LIMIT)
     safety_far_banner_m 1km 원거리 배너 기준 (facilities.js 의 NEAR_ENOUGH)

   그래서 여기서 숫자를 지어내지 않고 그 상수를 가져온다. 유형별 상한(화장실 1km 등)은
   시민 화면 쪽에서 2026-08-19 에 이미 걷어냈고, 명세서가 그것을 따라온 것이다. */
export const OPERATION_DEFAULTS = {
  facilityRadiusM: NEAR_LIMIT,
  safetyFarBannerM: NEAR_ENOUGH,
  marketThresholdM: 1000,
  newStoreDays: 30,
  courseRadiusM: 500,
  zoomFacility: TAB_MAP_LEVEL.facility || MAP_LEVEL,
  zoomMarket: TAB_MAP_LEVEL.district || MAP_LEVEL,
  zoomDiscover: TAB_MAP_LEVEL.discover || MAP_LEVEL,
};

/* 시민 화면 코드에서 그대로 가져온 항목. 화면이 이 목록을 보고 "지금 시민 화면이 쓰는 값"
   이라는 표시를 붙인다 — 나머지는 아직 화면에 연결되지 않은 값이라 구분되어야 한다. */
export const OPERATION_FROM_CONFIG = [
  "facilityRadiusM", "safetyFarBannerM", "zoomFacility", "zoomMarket", "zoomDiscover",
];

/* ── 8-2 API 쿼터 설정 (개발자 전용) ─────────────────────────────────────── */
export const QUOTA_DEFAULTS = {
  dailyQuota: WALK_ROUTE_QUOTA || 1000,
  warnThresholdPct: 80,
  warnEmail: "",
  fallbackOnExceed: "straight",
};

/* ── 7장 데이터 기준일 ───────────────────────────────────────────────────────
   카테고리 단위로 관리한다. 개별 점포·시설 등록 화면에는 입력란을 두지 않는다 —
   갱신이 원천 파일 단위로 일어나므로 건별로 적으면 같은 날 받은 자료에 다른 날짜가 붙는다.

   `managed: false` 인 두 줄을 목록에서 지우지 않는 이유: 지우면 "기준일이 없는 카테고리"와
   "우리가 빠뜨린 카테고리"가 구분되지 않는다. 상점가 정보와 축제 정보는 공공데이터가
   아니라 시·상인회가 그때그때 전달하는 자료라 "몇 월 기준"이라는 말이 성립하지 않는다. */
export const AS_OF_CATEGORIES = [
  { key: "district", group: "골목형 상점가", label: "상점가 정보", managed: false,
    reason: "시·상인회 전달 자료라 기준월이 성립하지 않습니다" },
  { key: "store", group: "골목형 상점가", label: "개별 점포 정보", managed: true,
    phrase: "점포 정보 {v} 기준", source: "상가(상권)정보 공공데이터 · 분기 갱신" },
  { key: "festival", group: "골목형 상점가", label: "축제 정보", managed: false,
    reason: "시·상인회 전달 자료라 기준월이 성립하지 않습니다" },
  { key: "aed", group: "공공시설", label: "AED", managed: true,
    phrase: "공공시설 정보 {v} 기준", source: "자동심장충격기 설치 표준데이터" },
  { key: "toilet", group: "공공시설", label: "공중화장실", managed: true,
    phrase: "공공시설 정보 {v} 기준", source: "공중화장실 표준데이터" },
  { key: "rest", group: "공공시설", label: "쉼터", managed: true,
    phrase: "공공시설 정보 {v} 기준", source: "무더위쉼터 표준데이터" },
  { key: "shelter", group: "공공시설", label: "대피소", managed: true,
    phrase: "공공시설 정보 {v} 기준", source: "민방위·지진 대피시설 표준데이터" },
];

/* 값도 config.js 에서 가져온다. 관리자에서 본 기준월과 시민 상세 하단 고지의 기준월이
   처음부터 다르면, 값을 바꿔도 무엇이 달라졌는지 알 수 없다. `YYYY.MM.` 의 끝 점을
   떼어 저장한다 — 명세서의 입력 형식은 `YYYY.MM` 이고, 점은 노출 문구가 붙인다. */
const trim = s => String(s || "").replace(/\.$/, "");

export const AS_OF_DEFAULTS = {
  store: trim(STORE_AS_OF),
  aed: trim(FACILITY_AS_OF.aed),
  toilet: trim(FACILITY_AS_OF.toilet),
  rest: trim(FACILITY_AS_OF.rest),
  shelter: trim(FACILITY_AS_OF.shelter),
};

export function asOfPhrase(cat, value) {
  if (!cat || !cat.managed || !value) return null;
  return cat.phrase.replace("{v}", `${value}.`);
}
