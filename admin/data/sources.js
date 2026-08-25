import { STORES, COURSES } from "../../screens/main/data/dunjeon.js";
import { DISTRICTS, FESTIVALS, CURRENT_DISTRICT_ID } from "../../screens/main/data/districts.js";
import { FACILITIES } from "../../screens/main/data/facilities.js";
import { QR_POINTS } from "../../screens/main/data/qr.js";

/* 관리자가 읽는 원천 표 — **빠진 기본값을 여기서 한 번 채운다** (2026-08-25).
 *
 * ── 왜 필요해졌나 ───────────────────────────────────────────────────────────
 * 시민 화면의 표(dunjeon.js · districts.js · facilities.js)는 **시민 화면이 쓰는 값만**
 * 갖고 있다. 「노출 여부」는 관리자만 다루는 값이라 아무 줄에도 없고, 점포의 「소속 골목형
 * 상점가」도 없다 — 더미 세계의 335곳이 전부 둔전 것이라 적을 이유가 없었다.
 *
 * 목록 화면들은 그 빈자리를 읽는 자리마다 메웠다: 표의 토글은 `s.visible !== false`,
 * 상점가별 집계는 `s.districtId || CURRENT_DISTRICT_ID`. 그래서 **목록은 맞게 보였는데
 * 폼은 아니었다.** 수정 창을 열면 스위치가 전부 꺼진 채로 서고(폼은 값을 그대로 읽는다),
 * 소속 상점가는 빈 칸이라 손도 대지 않은 항목이 「필수 항목입니다」로 막았다. 담당자
 * 눈에는 **값이 있는데 없다고 하는 화면**이다.
 *
 * 메우는 자리를 화면에서 **표로 옮긴다.** 폼도 목록도 같은 줄을 읽으므로 두 곳이 갈릴
 * 자리가 없어지고, 화면에서는 기본값을 다시 적지 않는다 (`|| CURRENT_DISTRICT_ID` ·
 * `!== false` 가 화면에서 사라진 이유).
 *
 * ── 원천을 고치지 않는다 ────────────────────────────────────────────────────
 * 시민 화면이 같은 배열을 읽고 있어서다. 여기서 새 배열을 만들 뿐 저쪽 값은 손대지 않는다.
 * 실데이터가 들어오면 서버가 이 값들을 함께 주므로 `?? 기본값` 자리가 저절로 비게 된다 —
 * 그때 이 파일이 하는 일이 줄어들 뿐 구조는 그대로다.
 */

/* 「노출 여부」는 **적혀 있지 않으면 켜짐**이다. 자료에 없는 점포가 목록에서 사라지는 것보다
   보이는 편이 안전하다 — 끄는 것은 담당자가 폐업을 확인하고 내리는 결정이다 (2-2). */
const shown = r => r.visible !== false;

/* 등록 일자 (⚙). 더미는 「기준월에서 뺀 개월 수」(agoMonths)만 갖고 있어 여기서 날짜로 편다.
   실데이터에서는 서버가 준 created_at 이 그대로 들어온다.

   ── 일자까지 만든다 (2026-08-25) ───────────────────────────────────────────
   폼의 칸이 연월(`month`)에서 **일자**(`date`)가 되면서 필요해졌다 (fields.js 의
   `createdAt` 머리말 — 같은 달에 문을 연 가게가 여섯을 넘으면 신규 매장 여섯 자리를
   담당자가 정할 수 없다). `2026-04` 를 날짜 칸에 넣으면 **칸이 통째로 빈 채로 뜬다** —
   값이 있는데 없다고 하는 화면을 막 고쳐 놓고 같은 것을 다시 만들 수는 없다.

   날짜를 **id 에서 뽑는다.** 더미에 없는 값을 만드는 것이지만, 전부 1일로 두면 방금 없애려던
   같은 값 무더기가 그대로 남는다. 난수를 쓰지 않는 것은 **새로고침해도 같아야** 하기
   때문이다 — 검수하는 사람이 어제 본 차례와 오늘 본 차례가 다르면 무엇을 확인했는지 알 수
   없다 (stats.js 가 시드 난수를 쓰는 이유와 같다). */
const BASE_YEAR = 2026, BASE_MONTH = 6;
const dayOf = id => {
  let n = 0;
  for (let i = 0; i < String(id).length; i++) n = (n * 31 + String(id).charCodeAt(i)) % 28;
  return n + 1;                                  /* 1~28 — 어느 달에도 있는 날짜만 쓴다 */
};
export function createdAtOf(s) {
  if (s.createdAt) return s.createdAt;
  if (s.agoMonths == null) return null;
  let y = BASE_YEAR, m = BASE_MONTH - Number(s.agoMonths);
  while (m < 1) { m += 12; y -= 1; }
  return `${y}-${String(m).padStart(2, "0")}-${String(dayOf(s.id)).padStart(2, "0")}`;
}

/* 점포 — 채우는 것이 넷이다. `onnuriType` 이 여기 있는 것은 다중 선택 칸이 배열을 받기
   때문이다: `undefined` 를 넘기면 그 칸이 아무것도 못 그린다.

   ── 가맹 점포에는 **지류 · 디지털 둘 다**를 넣는다 (2026-08-25 오후) ───────────
   원천에는 종류가 없다(가맹 여부 하나뿐이다). 그런데 시민 화면 상세는 가맹 점포마다
   **「지류 및 디지털 온누리상품권 가맹점입니다」**라고 적는다 (StoreDetail.jsx) —
   그러니 빈 배열로 두면 같은 점포를 두 화면이 다르게 말하게 된다: 저쪽은 둘 다 된다고
   적고, 관리자 목록의 배지는 종류 없이 「가맹」이라고만 선다.

   비어 있는 채로 두면 걸리는 자리가 하나 더 있다. 종류는 **가맹이면 필수**가 되었으므로
   (fields.js 의 `onnuriType`), 가맹 점포 139곳이 전부 「고쳐서 저장할 수 없는 줄」이 된다 —
   전화번호 한 자리를 고치러 연 담당자가 자기가 모르는 값을 먼저 골라야 한다. */
export const STORE_ROWS = STORES.map(s => ({
  ...s,
  districtId: s.districtId || CURRENT_DISTRICT_ID,
  visible: shown(s),
  onnuriType: s.onnuriType || (s.onnuri ? ["paper", "digital"] : []),
  createdAt: createdAtOf(s),
}));

export const FACILITY_ROWS = FACILITIES.map(f => ({ ...f, visible: shown(f) }));
export const DISTRICT_ROWS = DISTRICTS.map(d => ({ ...d, visible: shown(d) }));
export const FESTIVAL_ROWS = FESTIVALS.map(f => ({ ...f, visible: shown(f) }));

/* ── 골목 한바퀴 코스 (2026-08-25) ───────────────────────────────────────────
   여기서 하는 일이 다른 표와 다르다. 저것들은 **빠진 기본값을 채우는** 일이지만,
   코스는 시민 화면에서 **규칙이 만들어 내던 것**을 담당자가 고칠 수 있는 줄로 굳힌다.

   지금까지 코스는 자료가 아니라 계산이었다 — 300~500m 밴드에서 세 축(업종 · 온누리 ·
   조건 없음)으로 갈라 가까운 순 넷을 잇는다 (dunjeon.js 의 COURSE_PLAN, U-DC-03).
   시민용 명세서 6장이 그 자리를 이렇게 적어 두었다: "자동 생성 **또는 관리자 큐레이션**.
   현재 화면은 자동 생성 쪽으로 서 있다. 큐레이션으로 결정되면 이 규칙 한 블록만 서버
   응답으로 바꾼다." 관리 화면이 생겼으니 **큐레이션 쪽으로 정해진 것**이고, 이 표가
   그 서버 응답 자리에 서는 첫 판이다.

   그래서 씨앗은 **지금 규칙이 뽑아 놓은 결과 그대로**다. 손으로 다른 넷을 골라 적으면
   검수하는 사람이 시민 화면과 관리자 화면에서 다른 코스를 보게 된다 — 서버가 없어
   여기서 고친 것이 저쪽에 가지 않는 것과는 **다른 종류의 어긋남**이다(그쪽은 상단
   띠가 늘 적는다).

   저장하는 것은 **점포의 id 뿐**이다. 이름·좌표·거리를 함께 굳히면 점포를 고쳤을 때
   코스만 옛 이름을 들고 남는다 — 코스가 갖는 것은 「어느 가게를 어떤 차례로」이고,
   그 가게가 무엇인지는 점포 표가 답한다. 구간 거리와 도보 시간도 여기 없다: QR 지점을
   기준으로 재는 값이라 시민 화면이 그 자리에서 계산한다 (coursePlan.js). */
export const COURSE_ROWS = COURSES.map(c => ({
  id: c.id,
  districtId: CURRENT_DISTRICT_ID,
  name: c.name,
  desc: c.desc,
  visible: shown(c),
  stops: c.stops.map(s => ({ storeId: s.id })),
}));

/* QR 지점만 채우는 것이 기본값이 아니라 **열쇠**다. qr.js 의 표는 `code` 를 열쇠로 쓰고
   덮개 저장소는 `id` 를 쓴다 — 저쪽 데이터의 모양을 바꾸지 않고 여기서 맞춘다.
   화면에서 등록한 지점은 이 규칙 밖이다(덮개가 매기는 일련번호를 쓴다. QrPoints.jsx). */
export const QR_ROWS = QR_POINTS.map(p => ({ ...p, id: p.code }));
