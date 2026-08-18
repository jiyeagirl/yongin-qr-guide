/* 골목형 상점가 32개소 + 축제 6건 — 둘러보기 탭(S04)의 데이터.
 *
 * 32개소는 기능명세서 확정 결정사항 5 (2026년 7월 3곳 추가 지정 반영).
 * 축제 6건은 1-6 의 "1차 제공 대상 축제 6건"을 그대로 쓴다.
 *
 * ── 어디까지가 실제 값인가 ────────────────────────────────────────────────
 * 실제:   둔전(335/139), BOCA(462/257), 에버랜드마을(214/71) 의 점포·온누리 수 — 명세서 3-3 검증치
 *         축제 6건의 상점가명과 날짜 — 명세서 1-6
 * 생성값: 나머지 25개소의 이름과 수치, 그리고 **모든 좌표**.
 *         상점가 이름은 용인시 실제 행정동 이름에 "상점가"를 붙여 만든 것이고 실제 지정 명칭이 아니다.
 *         실데이터 연동 시 이 파일만 서버 응답으로 교체한다.
 *
 * 좌표는 dunjeon.js / facilities.js 와 같은 (거리, 방위) → 좌표 규칙으로 만든다.
 * 목록에 적힌 "12km"와 지도 마커 위치가 어긋나지 않는다.
 * 거리 기준점은 QR 스캔 지점이다 (제안서 3-1: 사용자 GPS 를 쓰지 않는다).
 * 명세서 1-6 의 예시("10월 24일 남사한숲 상점가, 12km")에 맞춰 남사한숲을 12km 에 두고
 * 나머지 거리를 용인시 실제 지리(포곡읍 기준 처인 8~10km, 기흥 13~18km, 수지 19~24km)에 맞춰 잡았다.
 */

import { ANCHOR } from "./dunjeon.js";
import { TODAY } from "../config.js";

const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LNG = 111320 * Math.cos((ANCHOR.lat * Math.PI) / 180);

function at(dist, bearingDeg) {
  const r = (bearingDeg * Math.PI) / 180;
  return {
    lat: +(ANCHOR.lat + (Math.cos(r) * dist) / M_PER_DEG_LAT).toFixed(6),
    lng: +(ANCHOR.lng + (Math.sin(r) * dist) / M_PER_DEG_LNG).toFixed(6),
  };
}

/* [id, 상점가명, 구, 소재, 점포수, 온누리 가맹, 거리(m), 방위(도)] */
const RAW = [
  ["dunjeon",    "둔전 골목형 상점가",   "처인구", "포곡읍 둔전리 일원",     335, 139,     0,   0],
  ["everland",   "에버랜드마을 상점가",  "처인구", "포곡읍 전대리 일원",     214,  71,  2100, 118],
  ["mohyeon",    "모현 왕산 상점가",     "처인구", "모현읍 왕산리 일원",     128,  47,  5400, 328],
  ["yangji",     "양지 남곡 상점가",     "처인구", "양지면 남곡리 일원",     156,  58,  7200, 176],
  ["kimryang",   "김량장 중앙 상점가",   "처인구", "김량장동 일원",          388, 162,  9100, 214],
  ["yeokbuk",    "역북 행정타운 상점가", "처인구", "역북동 일원",            241,  92,  9800, 226],
  ["samga",      "삼가 시청앞 상점가",   "처인구", "삼가동 일원",            173,  64, 10400, 231],
  ["mapyeong",   "마평 공단로 상점가",   "처인구", "마평동 일원",            142,  51, 10900, 204],
  ["idong",      "이동 송전 상점가",     "처인구", "이동읍 송전리 일원",     119,  44, 14300, 197],
  ["baegam",     "백암 시장통 상점가",   "처인구", "백암면 백암리 일원",     167,  71, 15600, 148],
  ["wonsam",     "원삼 사암 상점가",     "처인구", "원삼면 사암리 일원",      96,  35, 13200, 165],
  ["namsa",      "남사한숲 상점가",      "처인구", "남사읍 완장리 일원",     198,  76, 12000, 219],
  ["namsa2",     "남사 아곡 상점가",     "처인구", "남사읍 아곡리 일원",     134,  49, 13100, 224],
  ["singal",     "신갈 오거리 상점가",   "기흥구", "신갈동 일원",            412, 188, 13800, 262],
  ["gugal",      "구갈 그랑프리 상점가", "기흥구", "구갈동 일원",            287, 121, 14600, 268],
  ["sanggal",    "상갈 민속촌 상점가",   "기흥구", "상갈동 일원",            203,  84, 15100, 274],
  ["yeongdeok",  "영덕 흥덕 상점가",     "기흥구", "영덕동 일원",            356, 149, 16300, 281],
  ["giheung",    "기흥역 광장 상점가",   "기흥구", "구갈동 기흥역 일원",     298, 118, 14900, 266],
  ["seonong",    "서농 하갈 상점가",     "기흥구", "하갈동 일원",            147,  55, 16800, 289],
  ["guseong",    "구성언남 상점가",      "기흥구", "언남동 일원",            264, 108, 14800, 298],
  ["mabuk",      "마북 언동로 상점가",   "기흥구", "마북동 일원",            219,  87, 15900, 303],
  ["dongbaek",   "동백 호수공원 상점가", "기흥구", "중동 동백지구 일원",     441, 183, 12700, 289],
  ["sanghadong", "상하 어정가구 상점가", "기흥구", "상하동 일원",            172,  63, 13400, 296],
  ["bora",       "보라 민속마을 상점가", "기흥구", "보라동 일원",            188,  72, 16100, 277],
  ["bojeong",    "보정중심 상점가",      "기흥구", "보정동 일원",            276, 114, 17200, 306],
  ["boca",       "BOCA 상점가",          "기흥구", "보정동 카페거리 일원",   462, 257, 16500, 309],
  ["cheongdeok", "청덕 언북 상점가",     "기흥구", "청덕동 일원",            158,  61, 16700, 312],
  ["jukjeon",    "죽전 보정로 상점가",   "수지구", "죽전동 일원",            394, 161, 19200, 311],
  ["pungdeok",   "풍덕천 정자 상점가",   "수지구", "풍덕천동 일원",          367, 148, 21800, 302],
  ["dongcheon",  "머내마을 상점가",      "수지구", "동천동 일원",            229,  91, 21400, 316],
  ["sanghyeon",  "상현 광교 상점가",     "수지구", "상현동 일원",            312, 126, 20600, 288],
  ["seongbok",   "성복 수지로 상점가",   "수지구", "성복동 일원",            241,  96, 22300, 296],
];

/* 축제 6건 (기능명세서 1-6). [상점가 id, 명칭, 시작, 종료, 시간, 장소, 프로그램 개요] */
const FESTIVAL_RAW = [
  ["everland",  "에버랜드마을 가을장터",  "2026-10-09", "2026-10-09", "11:00~19:00",
    "전대리 상점가 일원", "먹거리 장터 · 버스킹 공연 · 어린이 체험부스"],
  ["guseong",   "구성언남 골목축제",      "2026-10-16", "2026-10-18", "15:00~21:00",
    "언남동 중앙골목 일원", "야시장 · 플리마켓 · 야간 조명거리 · 가족 노래자랑"],
  ["dunjeon",   "둔전 골목축제",          "2026-10-17", "2026-10-17", "15:00~21:00",
    "둔전 시장통 일원", "먹거리 장터 · 상인 경품행사 · 어르신 한마당"],
  ["namsa",     "남사한숲 수확축제",      "2026-10-24", "2026-10-24", "10:00~18:00",
    "완장리 한숲공원 일원", "농산물 직거래 · 김장 체험 · 마을 음악회"],
  ["dongcheon", "머내마을 가을거리축제",  "2026-10-31", "2026-10-31", "13:00~20:00",
    "동천동 머내로 일원", "핼러윈 거리 퍼레이드 · 소상공인 할인전"],
  ["bojeong",   "보정중심 빛거리축제",    "2026-11-07", "2026-11-07", "16:00~21:00",
    "보정동 중심상가 일원", "빛거리 점등식 · 카페거리 할인전 · 겨울 마켓"],
];

/* 진행중 / 예정 / 종료. 기준일은 config 의 TODAY 다 (왜 상수인지는 그쪽 주석 참조). */
function stateOf(start, end) {
  if (TODAY < start) return "예정";
  if (TODAY > end) return "종료";
  return "진행중";
}

/* "10.17 (금)" — 하루짜리는 한 날짜, 여러 날은 범위로 적는다 */
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
function label(start, end) {
  const d = s => new Date(`${s}T00:00:00+09:00`);
  const fmt = s => `${+s.slice(5, 7)}.${+s.slice(8, 10)}`;
  const head = `${fmt(start)} (${DOW[d(start).getUTCDay()]})`;
  return start === end ? head : `${head} ~ ${fmt(end)} (${DOW[d(end).getUTCDay()]})`;
}

const FESTIVAL_BY_DISTRICT = FESTIVAL_RAW.reduce((o, [did, name, start, end, time, place, program]) => {
  o[did] = { id: `ft-${did}`, districtId: did, name, start, end, time, place, program,
    state: stateOf(start, end), date: `${label(start, end)} ${time}` };
  return o;
}, {});

export const DISTRICTS = RAW
  .map(([id, name, gu, area, stores, onnuri, dist, bearing]) => ({
    id, kind: "district", name, gu, area, stores, onnuri, dist,
    ...at(dist, bearing),
    festival: FESTIVAL_BY_DISTRICT[id] || null,
  }))
  .sort((a, b) => a.dist - b.dist);

/* 현재 상점가 (U-ST-01). QR 지점이 속한 곳이라 거리 0 이다.
   둘러보기의 "다른 상점가 목록"(U-DC-04)에서는 이 한 곳을 뺀다 — 지금 보고 있는 곳이다. */
export const CURRENT_DISTRICT_ID = "dunjeon";
export const OTHER_DISTRICTS = DISTRICTS.filter(d => d.id !== CURRENT_DISTRICT_ID);

/* U-DC-01 축제 목록 — 32개소 전체가 대상이고 각 항목에 상점가명과 거리를 병기한다.
   정렬은 상태 먼저, 그 다음 거리다. 명세서는 "가까운 순"만 적었지만 그대로 두면
   종료된 축제가 진행 중인 축제 위로 올라온다. 상태는 기간 한정 정보의 1순위다. */
const STATE_RANK = { 진행중: 0, 예정: 1, 종료: 2 };
export const FESTIVALS = DISTRICTS
  .filter(d => d.festival)
  .map(d => ({ ...d.festival, districtName: d.name, dist: d.dist }))
  .sort((a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || a.dist - b.dist);

/* U-CM-18 — 진행 중 축제가 있으면 둘러보기 탭 아이콘에 점을 찍는다.
   "예정"으로는 찍지 않는다. 6건이 모두 예정인 기간에는 점이 상시 켜져 있어 신호가 죽는다. */
export const HAS_LIVE_FESTIVAL = FESTIVALS.some(f => f.state === "진행중");

/* U-FT-03 우리 상점가 축제 배너 — 현재 상점가 1건. 종료된 축제는 배너에 걸지 않는다. */
const own = FESTIVAL_BY_DISTRICT[CURRENT_DISTRICT_ID];
export const CURRENT_FESTIVAL = own && own.state !== "종료" ? own : null;

export default DISTRICTS;
