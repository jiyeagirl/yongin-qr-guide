import React from "react";
import { safeStore } from "./sessionStore.js";

/* 골목 한바퀴(S08)의 "방문 완료" 기록.
 *
 * ── GPS 를 쓰지 않는다 ───────────────────────────────────────────────────
 * 방문 여부는 **오직 사용자가 누른 기록**이다. 위치로 자동 판정하지 않는다 (제안서 3-1 —
 * 이 서비스의 "내 위치"는 언제나 QR 스캔 지점이고 그 좌표는 사용자가 걸어도 바뀌지 않는다).
 * 그래서 이 값은 검증된 사실이 아니라 사용자가 스스로 붙이는 표시이며, 화면도 그렇게
 * 다뤄야 한다 — 순서를 강제하지 않고, 한 번도 누르지 않아도 화면이 온전해야 하고,
 * 언제든 되돌릴 수 있어야 한다.
 *
 * ── 왜 sessionStorage 인가 ──────────────────────────────────────────────
 * React 상태로만 들고 있으면 가게를 한 번 눌러보고 돌아왔을 때 체크가 전부 풀린다.
 * 코스를 돌면서 가장 자주 하는 동작이 바로 그것인데(오버레이가 갈리면서 CourseDetail 이
 * 언마운트된다) 그때마다 처음부터 다시 눌러야 한다면 이 기능은 없느니만 못하다.
 *
 * 반대로 localStorage 에 두면 몇 달 뒤 다시 왔을 때 남의 일 같은 체크가 남아 있다.
 * 코스를 도는 일은 한 번의 나들이 안에서 끝나므로 그 나들이만큼만 남으면 된다.
 * (walkRoute.js 의 경로 캐시가 sessionStorage 인 것과 같은 이유다.)
 *
 * 저장이 막힌 환경에서는 조용히 메모리에만 남는다 — 그때도 화면은 그대로 동작하고,
 * 새로고침에 기록이 날아갈 뿐이다.
 */
const KEY = "yongin.course.visits.v1";

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
  const ids = readAll()[courseId];
  return Array.isArray(ids) ? ids : [];
}

function save(courseId, ids) {
  const s = safeStore("sessionStorage");
  if (!s) return;
  const all = readAll();
  if (ids.length) all[courseId] = ids;
  else delete all[courseId]; /* 빈 코스를 남겨두면 저장값이 코스 수만큼 쌓이기만 한다 */
  try {
    s.setItem(KEY, JSON.stringify(all));
  } catch (e) {
    /* 용량 초과 등 — 화면 상태는 이미 바뀌었으므로 그대로 진행한다 */
  }
}

export function useCourseVisits(courseId) {
  /* 코스 id 와 그 코스의 기록을 **한 상태에 묶는다.** 따로 두면 코스가 갈리는 순간
     "직전 코스의 기록"과 "새 코스의 id"가 잠깐 짝을 이루고, 그 사이에 저장이 돌면
     남의 기록이 새 코스에 적힌다. */
  const [seen, setSeen] = React.useState(() => ({ id: courseId, ids: load(courseId) }));

  /* prop 이 바뀌면 렌더 중에 맞춘다 (React 의 "props 변화에 상태 맞추기" 패턴).
     effect 로 미루면 한 프레임 동안 다른 코스의 체크가 화면에 보인다. */
  if (seen.id !== courseId) setSeen({ id: courseId, ids: load(courseId) });

  React.useEffect(() => { save(seen.id, seen.ids); }, [seen]);

  const toggle = React.useCallback(id => {
    setSeen(cur => ({
      id: cur.id,
      ids: cur.ids.includes(id) ? cur.ids.filter(x => x !== id) : cur.ids.concat(id),
    }));
  }, []);

  const clear = React.useCallback(() => setSeen(cur => ({ id: cur.id, ids: [] })), []);

  return { visited: seen.ids, toggle, clear };
}

export default useCourseVisits;
