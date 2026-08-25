import { STORES } from "../../screens/main/data/dunjeon.js";
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

/* 등록 시점 (⚙). 더미는 「기준월에서 뺀 개월 수」(agoMonths)만 갖고 있어 여기서 연월로 편다.
   실데이터에서는 서버가 준 created_at 이 그대로 들어온다. */
const BASE_YEAR = 2026, BASE_MONTH = 6;
export function createdAtOf(s) {
  if (s.createdAt) return s.createdAt;
  if (s.agoMonths == null) return null;
  let y = BASE_YEAR, m = BASE_MONTH - Number(s.agoMonths);
  while (m < 1) { m += 12; y -= 1; }
  return `${y}-${String(m).padStart(2, "0")}`;
}

/* 점포 — 채우는 것이 넷이다. `onnuriType` 이 여기 있는 것은 다중 선택 칸이 배열을 받기
   때문이다: `undefined` 를 넘기면 그 칸이 아무것도 못 그린다 */
export const STORE_ROWS = STORES.map(s => ({
  ...s,
  districtId: s.districtId || CURRENT_DISTRICT_ID,
  visible: shown(s),
  onnuriType: s.onnuriType || [],
  createdAt: createdAtOf(s),
}));

export const FACILITY_ROWS = FACILITIES.map(f => ({ ...f, visible: shown(f) }));
export const DISTRICT_ROWS = DISTRICTS.map(d => ({ ...d, visible: shown(d) }));
export const FESTIVAL_ROWS = FESTIVALS.map(f => ({ ...f, visible: shown(f) }));

/* QR 지점만 채우는 것이 기본값이 아니라 **열쇠**다. qr.js 의 표는 `code` 를 열쇠로 쓰고
   덮개 저장소는 `id` 를 쓴다 — 저쪽 데이터의 모양을 바꾸지 않고 여기서 맞춘다.
   화면에서 등록한 지점은 이 규칙 밖이다(덮개가 매기는 일련번호를 쓴다. QrPoints.jsx). */
export const QR_ROWS = QR_POINTS.map(p => ({ ...p, id: p.code }));
