import React from "react";
import { safeStore } from "./sessionStore.js";

/* 골목 한바퀴(S08)에서 **사용자가 끌어 옮긴 순서**.
 *
 * ── 왜 생겼나 (2026-08-19) ──────────────────────────────────────────────────
 * 전에는 순서를 화면이 자동으로 다시 짰다. [방문 완료]를 누를 때마다 그 곳을 기준으로
 * 남은 곳을 가까운 순으로 다시 이었고, 방문한 곳은 "실제로 걸은 차례"로 번호가 바뀌었다.
 * 계산은 맞았지만 **누른 결과가 목록의 뒤바뀜**이라, 방문 표시를 하나 켤 때마다 화면이
 * 통째로 흔들렸다. 사용자가 요청한 적 없는 변화가 사용자의 동작에 딸려 오는 셈이다.
 *
 * 이제 순서를 바꾸는 것은 **사용자뿐**이다. 방문 표시는 표시만 한다.
 *
 *   ids  사용자가 정한 차례. 비어 있으면 코스가 추천한 순서 그대로다.
 *
 * 출발지는 여기 없다. 그것은 **길찾기(S07)의 값**이다 — 코스 목록은 "어디를 도나"를
 * 말하고, "지금 어디서 출발하나"는 실제로 길을 물을 때 정해진다 (RouteView 머리말).
 *
 * ── 왜 sessionStorage 인가 ──────────────────────────────────────────────────
 * courseVisits.js 와 같은 이유이고 같은 수명이다 (그쪽 머리말). 가게를 한 번 눌러보고
 * 돌아오면 이 화면은 언마운트되는데, 그때마다 애써 맞춘 순서가 풀리면 이 기능은
 * 없느니만 못하다. 반대로 localStorage 면 몇 달 뒤 남의 일 같은 순서가 남아 있다.
 *
 * 방문 기록과 **키를 나눠 둔다.** 한 덩어리로 묶으면 [처음부터](방문 지우기)가 순서까지
 * 지우게 되고, 그 둘은 이제 서로 상관없는 값이다.
 */
const KEY = "yongin.course.order.v1";

const EMPTY = { ids: [] };

function readAll() {
  const s = safeStore("sessionStorage");
  if (!s) return {};
  try {
    const all = JSON.parse(s.getItem(KEY) || "{}");
    return all && typeof all === "object" ? all : {};
  } catch (e) {
    return {}; /* 깨진 값은 없는 것으로 본다 */
  }
}

function load(courseId) {
  const v = readAll()[courseId];
  if (!v || typeof v !== "object") return EMPTY;
  return { ids: Array.isArray(v.ids) ? v.ids : [] };
}

function save(courseId, v) {
  const s = safeStore("sessionStorage");
  if (!s) return;
  const all = readAll();
  /* 손대지 않은 코스를 남겨두면 저장값이 코스 수만큼 쌓이기만 한다 */
  if (v.ids.length) all[courseId] = v;
  else delete all[courseId];
  try {
    s.setItem(KEY, JSON.stringify(all));
  } catch (e) {
    /* 용량 초과 등 — 화면 상태는 이미 바뀌었으므로 그대로 진행한다 */
  }
}

export function useCourseOrder(courseId) {
  /* 코스 id 와 그 코스의 값을 **한 상태에 묶는다** — courseVisits.js 와 같은 이유다.
     따로 두면 코스가 갈리는 순간 "직전 코스의 순서"와 "새 코스의 id"가 잠깐 짝을 이루고,
     그 사이에 저장이 돌면 남의 순서가 새 코스에 적힌다. */
  const [state, setState] = React.useState(() => ({ id: courseId, ...load(courseId) }));

  /* prop 이 바뀌면 렌더 중에 맞춘다 (React 의 "props 변화에 상태 맞추기" 패턴).
     effect 로 미루면 한 프레임 동안 다른 코스의 순서가 화면에 보인다. */
  if (state.id !== courseId) setState({ id: courseId, ...load(courseId) });

  React.useEffect(() => { save(state.id, { ids: state.ids }); }, [state]);

  /* 순서를 정하는 쪽은 **화면이 지금 깔고 있는 배열**이다. 여기서 다시 계산하지 않는다 —
     끌어 옮긴 결과가 사용자가 보고 있던 그 목록 그대로여야 한다. */
  const setIds = React.useCallback(ids => {
    setState(cur => ({ ...cur, ids }));
  }, []);

  /* 추천 순서로 되돌린다. 방문 기록은 건드리지 않는다 */
  const reset = React.useCallback(() => {
    setState(cur => ({ id: cur.id, ...EMPTY }));
  }, []);

  return { orderIds: state.ids, setIds, reset };
}

export default useCourseOrder;
