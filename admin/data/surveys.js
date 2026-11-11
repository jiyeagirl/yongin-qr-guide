import { STORE_ROWS, FACILITY_ROWS, FESTIVAL_ROWS, COURSE_ROWS, QR_ROWS } from "./sources.js";
import { listSurveyResponses } from "../../screens/main/data/survey.js";

/* 사용자 만족도 조사 응답 (2026-11-09, 사용자 요청) — 관리자 [사용자 만족도 조사] 화면이 읽는다.
 *
 * 시민 화면이 응답과 함께 남기는 값(screens/main/data/survey.js · docs/spec/citizen-survey.md)을 그대로 보인다:
 * 페이지 유형과 항목 ID · QR 유입 위치(URL 파라미터) · 응답 일시 · 응답 값, 그리고 고르게 쓴 이유.
 *
 * ── 두 갈래를 합친다 ────────────────────────────────────────────────────────
 *   예시 응답      아래 `seed()` 가 만든다. 실제 자료 이름(가게 · 시설 · 축제 · 코스 · QR 지점)을 빌리지만
 *                  점수와 일시는 지어낸 값이다
 *   이 브라우저    시민 화면에서 실제로 제출한 응답. 서버가 없어 시민 화면은 응답을 localStorage 에 쌓는데,
 *                  관리자 웹과 **같은 주소(origin)** 라 여기서 읽힌다. 다른 브라우저 · 기기의 응답은 오지 않는다
 * 실연동 때는 이 파일이 서버 응답 하나로 바뀐다. 관리자는 응답을 고치거나 지우지 않는다(조회만).
 */

export const PAGE_TYPE_LABEL = { store: "상점", facility: "공공시설", festival: "축제", course: "코스" };

const NAME_SOURCES = { store: STORE_ROWS, facility: FACILITY_ROWS, festival: FESTIVAL_ROWS, course: COURSE_ROWS };

export function itemName(pageType, id) {
  const rows = NAME_SOURCES[pageType];
  const row = rows && id ? rows.find(r => r.id === id) : null;
  return row ? row.name : null;
}

export function qrName(code) {
  const row = code ? QR_ROWS.find(r => r.code === code || r.id === code) : null;
  return row ? row.name : null;
}

/* 같은 판에서 늘 같은 예시가 나오도록 씨앗 있는 난수 */
function rng(seed) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
}

const COMMENTS = {
  1: ["가게 정보가 실제와 달랐어요.", "지도가 너무 늦게 떠요."],
  2: ["영업시간이 안 맞았어요.", "길찾기 안내가 헷갈렸어요.", "글씨가 좀 작아요."],
  3: ["가게 사진이 더 있으면 좋겠어요.", "메뉴 정보도 보고 싶어요."],
  4: ["축제 시간표가 있으면 좋겠어요."],
  5: [],
};

function seed() {
  const r = rng(20261109);
  const pick = a => a[Math.floor(r() * a.length)];
  const stores = STORE_ROWS.slice(0, 60);
  const facilities = FACILITY_ROWS;
  const festivals = FESTIVAL_ROWS.filter(f => f.id === "ft-dongbaekium");
  const courses = COURSE_ROWS;
  /* QR 은 상점 QR 이 대부분이다 — 일반(m-1) · 정회원(m-6) · 축제 팜플렛(m-4) · 버스정류장 안내판(m-5) */
  const QRS = ["m-1", "m-1", "m-1", "m-6", "m-6", "m-4", "m-5"];
  const VALUES = [5, 5, 5, 4, 4, 4, 4, 3, 3, 2, 1];
  const rows = [];
  for (let n = 0; n < 46; n++) {
    const roll = r();
    const pageType = roll < 0.55 ? "store" : roll < 0.75 ? "facility" : roll < 0.9 ? "festival" : "course";
    const item = pick(pageType === "store" ? stores : pageType === "facility" ? facilities
      : pageType === "festival" ? festivals : courses);
    const qr = pick(QRS);
    const value = pick(VALUES);
    /* 11월 1~8일 — 오늘(검수일 11-09)보다 앞이다. 이 브라우저의 실제 응답이 맨 위에 서도록 */
    const day = 1 + Math.floor(r() * 8);
    const hh = 10 + Math.floor(r() * 10);
    const mm = Math.floor(r() * 60);
    const comment = COMMENTS[value].length && r() < 0.6 ? pick(COMMENTS[value]) : null;
    rows.push({
      id: `sv-demo-${String(n + 1).padStart(3, "0")}`,
      value, pageType, itemId: item.id, qr,
      entryParams: qr === "m-1" ? "" : `?qr=${qr}`,
      answeredAt: `2026-11-${String(day).padStart(2, "0")}T${String(hh - 9).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00.000Z`,
      comment,
      source: "demo",
    });
  }
  return rows;
}

const SEED = seed();

/* 지금 볼 응답 전체 — 이 브라우저 것을 앞에 붙인다(최신순 정렬은 화면이 한다) */
export function readSurveyResponses() {
  const local = listSurveyResponses().map(r => ({ ...r, source: "local" }));
  return local.concat(SEED);
}

/* 응답 일시를 한국 시각 「2026-11-09 13:25」 로 */
export function formatAt(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "";
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  const p = v => String(v).padStart(2, "0");
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())} ${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`;
}

export default readSurveyResponses;
