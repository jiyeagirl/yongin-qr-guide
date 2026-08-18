/* 공공시설 탭(S02) 더미 데이터 — QR 지점 주변의 AED · 화장실 · 쉼터 · 대피소.
 *
 * 좌표는 손으로 찍지 않고 (거리, 방위) → 좌표 순으로 계산한다. 상점가 데이터(dunjeon.js)와 같은 규칙이라
 * 목록의 "약 340m"와 지도 마커 위치가 어긋나지 않는다. 실데이터 연동 시 이 파일만 서버 응답으로 바꾼다.
 *
 * ── 수치를 이렇게 잡은 이유 ────────────────────────────────────────────────
 * 이 데이터는 U-FC-08(유형별 내부 상한)과 U-FC-09(원거리 안내 배너)가 **실제로 걸리도록** 짜여 있다.
 * 둘 다 "보통은 안 보이는" 규칙이라 데이터가 전부 가까우면 구현했는지 확인할 방법이 없다.
 *
 *   AED      최근접 120m   — 정상. 배너 없음
 *   화장실   최근접 210m   — 정상. 단 포곡천 산책로(1,240m)는 1km 상한에 걸려 조용히 빠진다
 *   쉼터     최근접  90m   — 정상. 단 포곡천 둔치(1,080m)는 1km 상한에 걸려 조용히 빠진다
 *   대피소   최근접 1,400m — 상한이 없어 목록에는 나오지만 "가깝지 않다".
 *                            → U-FC-09 배너가 뜬다. 기능명세서의 예시 문구와 같은 상황이다
 *
 * 둔전에 1km 안쪽 대피소가 없는 것은 부자연스럽지 않다. 지진 옥외대피장소와 민방위 대피시설은
 * 지정된 곳만 대피소이고, 근처 공원이라고 자동으로 대피소가 되지는 않는다.
 * (그래서 둔전근린공원은 화장실로만 등록되어 있고 대피소 목록에는 없다.)
 */

import { ANCHOR } from "./dunjeon.js";

const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LNG = 111320 * Math.cos((ANCHOR.lat * Math.PI) / 180);

/* 거리(m) + 방위(도, 북=0 시계방향) → QR 지점 기준 좌표 */
function at(dist, bearingDeg) {
  const r = (bearingDeg * Math.PI) / 180;
  return {
    lat: +(ANCHOR.lat + (Math.cos(r) * dist) / M_PER_DEG_LAT).toFixed(6),
    lng: +(ANCHOR.lng + (Math.sin(r) * dist) / M_PER_DEG_LNG).toFixed(6),
  };
}

/* detail = 상세 위치 설명, hours = 개방 시간, extra = 유형별 부가정보 (U-FC-05, S05 시설 상세에서 쓴다)
 *
 * always = 상시 개방 여부 (U-FC-05 의 "개방 여부"). hours 문자열에서 파생하지 않고 명시한다 —
 * "24시간" 을 찾는 식으로 짜면 포곡읍 민방위 대피시설의 `상시 (경보 시 개방)` 을 놓치거나
 * 반대로 상시 개방으로 잘못 읽는다. 저기는 평소에 잠겨 있고 경보가 울려야 열리는 곳이라
 * 24시간 개방과 정반대의 의미인데, 문자열만 보면 "상시"라는 같은 낱말이 들어 있다.
 * 실데이터 연동 시에도 이 값은 서버가 판단해서 내려주어야 한다. */
const RAW = [
  /* ── AED — 상한 없음. 최근접을 반드시 제시한다 (U-FC-08) ────────────────── */
  { type: "aed", name: "둔전마을회관 AED", dist: 120, bearing: 335,
    addr: "처인구 포곡읍 둔전로 42", detail: "1층 로비 자동심장충격기함", hours: "24시간 개방", always: true,
    extra: "설치 1층 · 관리자 마을회관 사무장" },
  { type: "aed", name: "포곡읍행정복지센터 AED", dist: 340, bearing: 58,
    addr: "처인구 포곡읍 둔전로 91", detail: "1층 민원실 입구 벽면", hours: "평일 09:00~18:00",
    extra: "설치 1층 · 주말·공휴일 휴관" },
  { type: "aed", name: "둔전 공영주차장 관리동 AED", dist: 520, bearing: 148,
    addr: "처인구 포곡읍 둔전2로 8", detail: "관리동 출입구 옆 외부함", hours: "06:00~22:00",
    extra: "설치 지상 · 야외 보관함" },
  { type: "aed", name: "둔전보건진료소 AED", dist: 690, bearing: 272,
    addr: "처인구 포곡읍 포곡로 133", detail: "1층 대기실 안내데스크", hours: "평일 09:00~18:00",
    extra: "설치 1층 · 점심시간 12:00~13:00 제외" },
  { type: "aed", name: "에버랜드로 버스환승장 AED", dist: 1150, bearing: 96,
    addr: "처인구 포곡읍 에버랜드로 305", detail: "대합실 매표소 옆", hours: "05:30~23:00",
    extra: "설치 1층 · 환승장 운영시간과 동일" },

  /* ── 대피소 — 상한 없음. 다만 최근접이 1.4km 라 U-FC-09 배너가 뜬다 ───────── */
  { type: "shelter", name: "포곡중학교 운동장", dist: 1400, bearing: 24,
    addr: "처인구 포곡읍 금어로 216", detail: "지진 옥외대피장소 · 운동장 전체", hours: "24시간 개방", always: true,
    extra: "수용 약 1,200명 · 지진 옥외대피장소" },
  { type: "shelter", name: "포곡읍 민방위 대피시설", dist: 1760, bearing: 63,
    addr: "처인구 포곡읍 둔전로 91 지하", detail: "행정복지센터 지하 1층", hours: "상시 (경보 시 개방)",
    extra: "수용 약 480명 · 정부지원시설" },
  { type: "shelter", name: "포곡체육공원", dist: 2050, bearing: 189,
    addr: "처인구 포곡읍 삼계로 77", detail: "지진 옥외대피장소 · 다목적구장", hours: "24시간 개방", always: true,
    extra: "수용 약 900명 · 지진 옥외대피장소" },

  /* ── 화장실 — 1km 상한 (U-FC-08). 마지막 1건이 상한에 걸려 목록에서 빠진다 ─── */
  { type: "toilet", name: "둔전 공영주차장 공중화장실", dist: 210, bearing: 128,
    addr: "처인구 포곡읍 둔전2로 8", detail: "주차장 북측 단독 건물", hours: "24시간 개방", always: true,
    extra: "남 2칸 · 여 3칸 · 장애인 겸용 1칸 · 기저귀교환대 있음" },
  { type: "toilet", name: "포곡읍행정복지센터 화장실", dist: 350, bearing: 60,
    addr: "처인구 포곡읍 둔전로 91", detail: "1층·2층 각 1개소", hours: "평일 09:00~18:00",
    extra: "남 2칸 · 여 2칸 · 장애인 겸용 1칸" },
  { type: "toilet", name: "둔전시장 공중화장실", dist: 380, bearing: 213,
    addr: "처인구 포곡읍 둔전로 55", detail: "시장 중앙통로 끝", hours: "06:00~22:00",
    extra: "남 2칸 · 여 2칸" },
  { type: "toilet", name: "둔전사거리 간이화장실", dist: 640, bearing: 301,
    addr: "처인구 포곡읍 포곡로 108", detail: "버스정류장 뒤편", hours: "24시간 개방", always: true,
    extra: "남녀공용 1칸" },
  { type: "toilet", name: "둔전근린공원 화장실", dist: 870, bearing: 166,
    addr: "처인구 포곡읍 둔전1로 24", detail: "공원 주차장 옆", hours: "05:00~23:00",
    extra: "남 3칸 · 여 4칸 · 장애인 겸용 1칸" },
  { type: "toilet", name: "포곡천 산책로 화장실", dist: 1240, bearing: 341,
    addr: "처인구 포곡읍 금어로 12", detail: "산책로 2번 출입구", hours: "05:00~22:00",
    extra: "남 2칸 · 여 2칸" },

  /* ── 쉼터 — 무더위쉼터·한파쉼터다. 그래서 편의시설이 아니라 **안전시설**로 분류된다.
        폭염과 한파는 실제 인명 피해가 나는 재난이고, 지정 쉼터는 그 대응 시설이다.
        1km 상한은 유지한다 (U-FC-08). 상한 안에 하나도 없으면 U-FC-09 폴백이 최근접을 되살리므로
        "가까운 쉼터가 없다"는 빈 화면은 나오지 않는다. 마지막 1건이 상한에 걸려 빠진다 ───── */
  { type: "rest", name: "둔전 버스정류장 한파쉼터", dist: 90, bearing: 12,
    addr: "처인구 포곡읍 둔전로 38", detail: "승차대 안 온열의자 2석", hours: "24시간 개방", always: true,
    extra: "한파쉼터 · 12~2월 온열 가동 · 지붕과 방풍막 있음" },
  { type: "rest", name: "둔전마을회관 무더위쉼터", dist: 150, bearing: 331,
    addr: "처인구 포곡읍 둔전로 42", detail: "2층 경로당 · 냉방 운영", hours: "평일 09:00~18:00",
    extra: "실내 무더위쉼터 · 수용 40명 · 정수기 있음" },
  { type: "rest", name: "둔전사거리 그늘막쉼터", dist: 260, bearing: 74,
    addr: "처인구 포곡읍 둔전로 70", detail: "횡단보도 앞 그늘막 · 벤치 4석", hours: "24시간 개방", always: true,
    extra: "야외 무더위쉼터 · 그늘막 5~9월 운영" },
  { type: "rest", name: "포곡천 둔치 그늘막쉼터", dist: 1080, bearing: 347,
    addr: "처인구 포곡읍 금어로 20", detail: "산책로 정자 1동 · 벤치 6석", hours: "24시간 개방", always: true,
    extra: "야외 무더위쉼터 · 정자" },
];

export const FACILITIES = RAW
  .map((f, i) => ({ id: `fc-${String(i + 1).padStart(3, "0")}`, ...f, ...at(f.dist, f.bearing) }))
  .sort((a, b) => a.dist - b.dist);

/* U-FC-08 유형별 내부 상한. **사용자에게 노출하지 않는다** — 화면 어디에도 "1km"라고 적지 않는다.
   AED 와 대피소에 상한이 없는 이유: 없다고 답하면 안 되는 유형이다. 멀어도 최근접을 반드시 제시한다. */
export const NEAR_LIMIT = { aed: Infinity, shelter: Infinity, toilet: 1000, rest: 1000 };

/* U-FC-09 배너를 띄우는 기준 거리. 상한과 값은 같지만 역할이 다르다 —
   상한은 "목록에서 빼는 선", 이 값은 "가깝다고 말할 수 있는 선"이다.
   대피소처럼 상한이 없는 유형도 이 선을 넘으면 배너가 필요하다. */
export const NEAR_ENOUGH = 1000;

/* U-ST-07 주변 공공시설 — 상점가 탭 하단에 붙는 4줄.
   같은 FACILITIES 에서 유형별 최근접 1건씩 뽑는다. 별도 목록을 두면 두 탭이
   같은 시설을 다른 거리로 말하게 된다.

   **가까운 순으로 늘어놓는다** (2026-08-18). 전에는 위 배열의 유형 순서(aed→toilet→
   rest→shelter)로 나갔는데, 그것은 뽑는 순서지 읽는 순서가 아니다. 화장실이 40m 인데
   AED 가 380m 라면 위에 와야 하는 것은 화장실이다 — 이 목록은 "곁에 뭐가 있나"에
   답하는 자리이고, 곁이라는 말의 뜻이 곧 거리다. 공공시설 탭의 목록도 같은 순서다. */
export const NEARBY = ["aed", "toilet", "rest", "shelter"]
  .map(t => FACILITIES.find(f => f.type === t))
  .filter(Boolean)
  .sort((a, b) => a.dist - b.dist);
