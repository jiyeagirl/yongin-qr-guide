/* 공공시설 탭(S02) 더미 데이터 — QR 지점 주변의 AED · 화장실 · 쉼터 · 대피소.
 *
 * 좌표는 손으로 찍지 않고 (거리, 방위) → 좌표 순으로 계산한다. 상점가 데이터(dunjeon.js)와 같은 규칙이라
 * 목록의 "약 340m"와 지도 마커 위치가 어긋나지 않는다. 실데이터 연동 시 이 파일만 서버 응답으로 바꾼다.
 *
 * ── 수치를 이렇게 잡은 이유 ────────────────────────────────────────────────
 * 이 데이터는 U-FC-08(안내 반경)과 U-FC-09(원거리 안내 배너)가 **실제로 걸리도록** 짜여 있다.
 * 둘 다 "보통은 안 보이는" 규칙이라 데이터가 전부 가까우면 구현했는지 확인할 방법이 없다.
 *
 *   AED      최근접 120m   — 정상. 배너 없음
 *   화장실   최근접 210m   — 정상
 *   쉼터     최근접  90m   — 정상
 *   대피소   최근접 1,400m — 목록에는 나오지만 "가깝지 않다".
 *                            → U-FC-09 배너가 뜬다. 기능명세서의 예시 문구와 같은 상황이다
 *
 * 둔전에 1km 안쪽 대피소가 없는 것은 부자연스럽지 않다. 지진 옥외대피장소와 민방위 대피시설은
 * 지정된 곳만 대피소이고, 근처 공원이라고 자동으로 대피소가 되지는 않는다.
 * (그래서 둔전근린공원은 화장실로만 등록되어 있고 대피소 목록에는 없다.)
 *
 * ── 2~4km 밴드에 일부러 넣어둔 넷 (2026-08-26) ──────────────────────────────
 * 반경이 고정 2km 에서 **사용자가 고르는 2·3·4km** 가 되면서(아래 `RADIUS_STEPS`),
 * 그 고르개가 하는 일이 화면에서 보여야 한다. 원래 자료는 대피소 하나(2,050m)를 빼면
 * 전부 1.3km 안쪽이라 2 → 3 → 4km 로 밀어도 **줄 하나가 늘 뿐**이었다.
 * 그래서 각 칸이 적어도 두 유형을 바꾸도록 넷을 더했다:
 *
 *            2km        3km        4km
 *   AED       5    →     6    →     7
 *   대피소     2    →     3          3
 *   화장실     6          6    →     7
 *   쉼터      4    →     5          5
 *   합계      17         20         22
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

/* ── 필드는 입력 항목 정의서(2-1 ~ 2-4)를 그대로 따른다 (2026-08-19) ─────────────
 *
 * 이 서비스의 시설 정보는 전부 공공데이터에서 온다. 그래서 화면이 보여줄 수 있는 항목은
 * **원천에 있는 항목뿐**이고, 유형마다 그 목록이 다르다. 예전에는 네 유형이 같은 스키마
 * (detail·hours·always·extra)를 썼는데, 그것은 우리가 지어낸 틀이라 원천에 없는 값을
 * 채워 넣게 되고(AED 의 "관리자 마을회관 사무장"), 반대로 원천에 있는 값은 한 줄 문자열
 * 안에 뭉개졌다(화장실의 "남 2칸 · 여 3칸 · … · 기저귀교환대 있음").
 *
 *   aed      addr · place                                    (둘 다 필수)
 *   toilet   name · addr | hours menToilet menUrinal womenToilet womenUrinal
 *                          emergencyBell diaperTable entranceCctv  (뒤 8개 선택)
 *   rest     name · addr | hours capacity extra               (뒤 3개 선택)
 *   shelter  addr · place | capacity                          (capacity 선택)
 *
 * **선택 항목은 비어 있는 것이 정상이다.** null 로 둔 자리는 원천에 값이 없다는 뜻이고,
 * 상세 화면은 그 줄을 지우지 않고 "-" 로 남긴다 (InfoList 머리말). 그래야 "확인되지
 * 않았다"와 "우리가 빠뜨렸다"가 구분된다. 아래 더미에 null 을 섞어 둔 것은 그 화면을
 * 실제로 볼 수 있게 하려는 것이다 — 전부 채우면 만들어놓고 확인할 방법이 없다.
 *
 * **AED 와 대피소에는 명칭 항목이 없다** (정의서 2-1 · 2-4). 그래서 이름을 데이터에 적지
 * 않고 **도로명주소에서 만든다** (아래 `named`). 목록 한 줄과 화면 제목에는 부를 것이
 * 있어야 하는데, 없는 이름을 지어 적어 두면 그 뒤로는 그것이 원천 값인지 우리가 만든
 * 것인지 구분되지 않는다. 만드는 규칙을 코드에 두면 실데이터가 와도 같은 규칙이 돈다.
 *
 * 빠진 것들: `always`(개방 여부)와 AED·대피소의 `hours`. 정의서에 없다.
 * U-FC-05 는 "개방 여부"를 적고 있으나 그것은 원천 항목을 확정하기 전의 문구다 —
 * 명세서 쪽을 정의서에 맞춰야 한다. */
const RAW = [
  /* ── AED — place = 설치 위치 (2-1 필수). 예) 관리사무소 건물 1층 출입구 ────── */
  { type: "aed", dist: 120, bearing: 335,
    addr: "처인구 포곡읍 둔전로 42", place: "1층 로비 자동심장충격기함" },
  { type: "aed", dist: 340, bearing: 58,
    addr: "처인구 포곡읍 둔전로 91", place: "1층 민원실 입구 벽면" },
  { type: "aed", dist: 520, bearing: 148,
    addr: "처인구 포곡읍 둔전2로 8", place: "관리동 출입구 옆 외부 보관함" },
  { type: "aed", dist: 690, bearing: 272,
    addr: "처인구 포곡읍 포곡로 133", place: "1층 대기실 안내데스크" },
  { type: "aed", dist: 1150, bearing: 96,
    addr: "처인구 포곡읍 에버랜드로 305", place: "대합실 매표소 옆" },
  /* 아래 둘은 반경 고르개용이다 (머리말 표). 3km 칸과 4km 칸에서 각각 하나씩 들어온다 */
  { type: "aed", dist: 2340, bearing: 78,
    addr: "처인구 포곡읍 전대로 44", place: "1층 안내데스크 옆 벽면" },
  { type: "aed", dist: 3480, bearing: 300,
    addr: "처인구 포곡읍 유운로 21", place: "관리동 1층 복도 소화전 옆" },

  /* ── 대피소 — 최근접이 1.4km 라 U-FC-09 배너가 뜬다 ─────────────────────────
        place = 실제 위치(시설명) (2-4 필수) · capacity = 최대 수용 인원 (선택) */
  { type: "shelter", dist: 1400, bearing: 24,
    addr: "처인구 포곡읍 금어로 216", place: "포곡중학교 운동장 전체 (지진 옥외대피장소)",
    capacity: 1200 },
  { type: "shelter", dist: 1760, bearing: 63,
    addr: "처인구 포곡읍 둔전로 91 지하", place: "포곡읍행정복지센터 지하 1층 주차장",
    capacity: 480 },
  { type: "shelter", dist: 2050, bearing: 189,
    addr: "처인구 포곡읍 삼계로 77", place: "포곡체육공원 다목적구장 (지진 옥외대피장소)",
    capacity: null },

  /* ── 화장실 — 칸수 4종 · 비상벨 · 기저귀 교환대 · 입구 CCTV 는 전부 **선택**이다 (2-2).
        한 줄 문자열이 아니라 항목으로 나눈 이유: 비상벨이나 기저귀 교환대는 있고 없고가
        갈 곳을 바꾸는 값이라, 문장 안에 섞여 있으면 훑어서 찾을 수 없다. */
  { type: "toilet", name: "둔전 공영주차장 공중화장실", dist: 210, bearing: 128,
    addr: "처인구 포곡읍 둔전2로 8", hours: "상시 개방",
    menToilet: 2, menUrinal: 3, womenToilet: 3, womenUrinal: null,
    emergencyBell: true, diaperTable: true, entranceCctv: true },
  { type: "toilet", name: "포곡읍행정복지센터 화장실", dist: 350, bearing: 60,
    addr: "처인구 포곡읍 둔전로 91", hours: "평일 09:00~18:00",
    menToilet: 2, menUrinal: 2, womenToilet: 2, womenUrinal: null,
    emergencyBell: true, diaperTable: false, entranceCctv: null },
  { type: "toilet", name: "둔전시장 공중화장실", dist: 380, bearing: 213,
    addr: "처인구 포곡읍 둔전로 55", hours: "06:00~22:00",
    menToilet: 2, menUrinal: 2, womenToilet: 2, womenUrinal: null,
    emergencyBell: null, diaperTable: null, entranceCctv: null },
  /* 간이화장실이라 남녀 구분 칸수 자체가 원천에 없다 — 네 줄이 모두 "-" 로 남는다 */
  { type: "toilet", name: "둔전사거리 간이화장실", dist: 640, bearing: 301,
    addr: "처인구 포곡읍 포곡로 108", hours: "상시 개방",
    menToilet: null, menUrinal: null, womenToilet: null, womenUrinal: null,
    emergencyBell: false, diaperTable: false, entranceCctv: null },
  { type: "toilet", name: "둔전근린공원 화장실", dist: 870, bearing: 166,
    addr: "처인구 포곡읍 둔전1로 24", hours: "05:00~23:00",
    menToilet: 3, menUrinal: 4, womenToilet: 4, womenUrinal: null,
    emergencyBell: true, diaperTable: true, entranceCctv: false },
  { type: "toilet", name: "포곡천 산책로 화장실", dist: 1240, bearing: 341,
    addr: "처인구 포곡읍 금어로 12", hours: null,
    menToilet: 2, menUrinal: 2, womenToilet: 2, womenUrinal: null,
    emergencyBell: null, diaperTable: null, entranceCctv: null },
  /* 반경 고르개의 4km 칸에서 들어온다 (머리말 표) */
  { type: "toilet", name: "전대리마을회관 화장실", dist: 3720, bearing: 86,
    addr: "처인구 포곡읍 전대로 88", hours: "평일 09:00~18:00",
    menToilet: 1, menUrinal: 1, womenToilet: 2, womenUrinal: null,
    emergencyBell: false, diaperTable: false, entranceCctv: null },

  /* ── 쉼터 — 무더위쉼터·한파쉼터다. 그래서 편의시설이 아니라 **안전시설**로 분류된다.
        폭염과 한파는 실제 인명 피해가 나는 재난이고, 지정 쉼터는 그 대응 시설이다.
        1km 상한은 유지한다 (U-FC-08). 상한 안에 하나도 없으면 U-FC-09 폴백이 최근접을 되살리므로
        "가까운 쉼터가 없다"는 빈 화면은 나오지 않는다. 마지막 1건이 상한에 걸려 빠진다.
        hours = 운영시간 · capacity = 이용가능 인원 · extra = 부가정보 (셋 다 선택, 2-3)

        ── 부가정보는 **쉼표로 잇는다** (2026-08-25, 사용자 요청) ──────────────────
        가운뎃점(·)으로 이어 두었던 것을 쉼표로 바꿨다. 이 자리에서 가운뎃점은 **우리가
        지어낸 표기**다 — 원천 자료가 그 글자를 담지 못하므로, 실제로 들어올 값은 쉼표로
        이어진 문장이다. 더미가 원천에 없는 모양을 하고 있으면 화면을 그 모양에 맞춰
        다듬게 되고, 실데이터가 들어오는 날 그 다듬은 것이 전부 어긋난다.

        가운뎃점은 **화면이 스스로 잇는 자리**에만 남는다 (「음식 · 카페」 칩 요약처럼
        우리가 두 값을 나란히 놓는 자리). 한 칸에 담당자가 적어 넣는 문장은 그 반대다. */
  { type: "rest", name: "둔전 버스정류장 한파쉼터", dist: 90, bearing: 12,
    addr: "처인구 포곡읍 둔전로 38", hours: "24시간 개방", capacity: null,
    extra: "한파쉼터, 12~2월 온열의자 가동, 지붕과 방풍막 있음" },
  { type: "rest", name: "둔전마을회관 무더위쉼터", dist: 150, bearing: 331,
    addr: "처인구 포곡읍 둔전로 42", hours: "평일 09:00~18:00", capacity: 40,
    extra: "실내 무더위쉼터, 냉방기 있음, 정수기 있음" },
  { type: "rest", name: "둔전사거리 그늘막쉼터", dist: 260, bearing: 74,
    addr: "처인구 포곡읍 둔전로 70", hours: "5~9월 상시", capacity: null,
    extra: "야외 무더위쉼터, 그늘막, 벤치 4석" },
  { type: "rest", name: "포곡천 둔치 그늘막쉼터", dist: 1080, bearing: 347,
    addr: "처인구 포곡읍 금어로 20", hours: null, capacity: null, extra: null },
  /* 반경 고르개의 3km 칸에서 들어온다 (머리말 표) */
  { type: "rest", name: "삼계리 경로당 무더위쉼터", dist: 2870, bearing: 205,
    addr: "처인구 포곡읍 삼계로 132", hours: "평일 09:00~18:00", capacity: 25,
    extra: "실내 무더위쉼터, 냉방기 있음, 정수기 있음" },
];

/* ── AED · 대피소의 이름을 도로명주소에서 만든다 (2026-08-19) ───────────────────
 *
 * 두 유형에는 명칭 항목이 자체가 없다 (정의서 2-1 · 2-4). 그런데 목록 한 줄과 화면 제목,
 * 지도 카드, 길찾기 도착지에는 부를 것이 있어야 한다. 없는 이름을 지어 데이터에 적어 두면
 * 그 뒤로는 원천 값인지 우리가 만든 것인지 구분되지 않으므로, **규칙을 코드에 둔다.**
 *
 * 도로명 + 건물번호 + 유형 → "둔전로 42 AED" · "금어로 216 대피소".
 * 도로명만 떼면 짧지만 유일하지 않다 — 이 더미만 해도 둔전로에 AED 가 둘이다. 두 줄이
 * "둔전로 AED" 로 똑같이 보이면 목록에서 어느 쪽을 눌렀는지 알 수 없다. 번호까지 붙이면
 * 언제나 유일하고, 무엇보다 **이름이 곧 위치**라 지어낸 이름보다 실제로 쓸모가 있다.
 *
 * 시·구·읍면동은 뗀다. 이 서비스는 QR 지점 반경 안만 다뤄서 앞부분이 전부 같고,
 * 목록에서 같은 글자가 줄마다 반복되면 다른 부분을 찾아 읽어야 한다.
 * 건물번호 뒤의 군더더기("… 91 지하")도 뗀다 — 그 정보는 실제 위치(place) 줄이 말한다. */
function roadPart(addr = "") {
  const parts = String(addr).trim().split(/\s+/);
  const i = parts.findIndex(p => /[로길]\d*$/.test(p));
  if (i < 0) return addr;                       /* 도로명이 아니면 주소를 그대로 쓴다 */
  const no = parts[i + 1];
  return /^\d/.test(no || "") ? `${parts[i]} ${no}` : parts[i];
}

const NAMED = { aed: "AED", shelter: "대피소" };

/* 규칙 하나를 두 곳이 쓴다 (2026-08-19). 관리자 웹(admin/)에서 AED 의 주소를 고치면
   이름도 따라 바뀌어야 하는데, 그 계산을 저쪽에 다시 적으면 두 이름 규칙이 생긴다.
   화장실·쉼터는 명칭이 필수 항목이라 데이터의 값을 그대로 쓴다. */
export function facilityName(f) {
  return f.name || `${roadPart(f.addr)} ${NAMED[f.type] || ""}`.trim();
}

export const FACILITIES = RAW
  .map((f, i) => ({
    id: `fc-${String(i + 1).padStart(3, "0")}`,
    ...f,
    name: facilityName(f),
    ...at(f.dist, f.bearing),
  }))
  .sort((a, b) => a.dist - b.dist);

/* ── 안내 반경과 "가깝다"의 선 — 서로 다른 두 값 ──────────────────────────────
 *
 * 2026-08-19 에 유형별 상한을 하나로 통일했다. 전에는 유형마다 달랐는데
 * (aed·shelter 무제한 / toilet·rest 1km) 그 갈림의 근거는 거리 감각의 차이가 아니라
 * **"없다고 답하면 안 되는 유형"** 이었다. 그런데 그 보장은 이미 U-FC-09 폴백이 하고
 * 있다 (MainApp: 반경 안에 0건이면 반경을 무시하고 최근접 2건을 되살린다). 무제한은
 * 그 위에 덧댄 중복이었고, 대가로 실데이터가 들어오는 순간 **용인시 전역의 AED 가
 * 거리순으로 전부 목록에 실린다.**
 *
 * 폴백이 빈 목록을 막아주므로 반경은 순수하게 **꼬리를 자르는 선** 하나만 하면 된다.
 * 그 선은 유형과 무관하다 — 화장실이든 대피소든 걸어갈 수 없으면 안내할 것이 아니다.
 *
 * ── 그 선을 **사용자가 고른다** (2026-08-26, 사용자 요청) ──────────────────────
 * `NEAR_LIMIT = 2000` 한 값이었다. 2km 는 도보 30분이라 "이 서비스가 다루는 최대
 * 거리"로 잡은 수인데, 그 30분이 **누구에게나 같은 30분이 아니다.** 안내판 앞에 선
 * 사람이 급히 AED 를 찾는 중인지 오후 내내 골목을 돌 참인지에 따라 걸어갈 마음이 있는
 * 거리가 달라지고, 그것은 우리가 정할 수 있는 값이 아니다.
 *
 *   RADIUS_STEPS    2 · 3 · 4km   상단 필터 바의 반경 고르개가 내놓는 칸
 *   RADIUS_DEFAULT  2km           처음 열었을 때. 옛 `NEAR_LIMIT` 과 같은 값이라
 *                                 아무것도 건드리지 않은 화면은 전과 똑같다
 *   NEAR_ENOUGH     1km           "가깝다"고 말할 수 있는 선. 넘으면 U-FC-09 배지가 붙는다
 *
 * **하한이 2km 인 것이 요점이다.** 더 좁게 고르는 칸을 두지 않는 이유는 그 아래에서
 * 빈 목록이 나오기 시작해서다 — 1km 로 좁힌 사람은 자기가 좁힌 줄 알지만, 그때 뜨는
 * 폴백(최근접 2건)은 반경 밖의 시설을 되살려 **고른 값과 어긋나는 목록**을 만든다.
 *
 * `NEAR_ENOUGH` 는 그대로 **사용자에게 노출하지 않는다.** 이쪽은 고르는 값이 아니라
 * 화면이 "이건 좀 멀다"고 말할 때 쓰는 기준이고, 안전시설(AED·대피소·쉼터)이 이 선
 * 밖이면 반경을 얼마로 두었든 U-FC-09 원거리 안내가 그대로 뜬다.
 *
 * 남은 것: 도심 지점(수지·기흥)은 2km 안에도 AED 가 수백 개다. 반경만으로는 거기가
 * 풀리지 않고 **유형별 건수 상한**이 필요한데, 그 값은 실데이터 규모를 보고 정하기로 미뤘다.
 * 반경을 4km 까지 열어둔 만큼 그 자리는 더 급해졌다. */
export const RADIUS_STEPS = [2000, 3000, 4000];
export const RADIUS_DEFAULT = RADIUS_STEPS[0];
export const NEAR_ENOUGH = 1000;

/* U-ST-07 주변 공공시설 — `NEARBY`(유형별 최근접 1건씩 4줄)가 여기 있었다.
   **읽는 화면이 없어져 함께 지웠다** (2026-08-24, 사용자 요청).

   붙던 자리가 둘이었고 둘 다 같은 이유로 빠졌다. 점포 상세(S06)는 2026-08-20 에,
   상점가 탭 시트 하단은 2026-08-24 에 — 가게를 묻고 들어온 화면에 시설 목록이 끼는
   자리였고, 시설을 찾을 생각이면 **공공시설 탭이 그 일을 통째로 맡는다** (유형 칩 ·
   거리순 목록 · 지도 마커). 네 줄로는 그중 아무것도 줄 수 없었다.

   자료가 없어진 것이 아니다. 이 파일의 `FACILITIES` 가 그대로 있고 공공시설 탭이
   같은 것을 본다 — 애초에 이 상수가 별도 목록을 두지 않고 `FACILITIES` 에서 뽑았던
   것도 두 탭이 같은 시설을 다른 거리로 말하지 않게 하기 위해서였다. */
