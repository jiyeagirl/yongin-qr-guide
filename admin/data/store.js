import React from "react";
import { safeStore } from "../../screens/main/data/sessionStore.js";

/* 관리자가 고친 것을 담아 두는 곳.
 *
 * ── 원본을 건드리지 않는다 ──────────────────────────────────────────────────
 * 시민 화면이 읽는 배열(FACILITIES · STORES · DISTRICTS · QR_POINTS)은 모듈이 뜰 때
 * 한 번 만들어지는 상수다. 관리자가 그것을 직접 밀어 넣으면 두 화면이 같은 배열을
 * 공유한다는 사실에 기대게 되는데, 실서비스에서 그 자리는 서버다 — 배열이 아니다.
 *
 * 그래서 **원본 위에 덮개(overlay)를 얹는다.** 덮개가 갖는 것은 셋뿐이다:
 *
 *   edits    { id: 바뀐 필드만 }   원본 행을 고친 것
 *   added    [ 통째 행 ]           새로 등록한 것
 *   removed  [ id ]                지운 것
 *
 * ── removed 가 곧 명세서 10장의 "물리 삭제 없음" 이다 ──────────────────────
 * 명세서 공통 정책: "물리 삭제 없음. `is_deleted` 플래그로 처리한다."
 * 여기서 `removed` 에 id 를 넣는 것이 그 플래그다 — **원본 배열에서는 아무 것도 지워지지
 * 않는다.** 목록을 만들 때 걸러낼 뿐이라 [데모 데이터 초기화] 한 번으로 전부 돌아온다.
 * 실연동 때 이 자리는 서버의 `is_deleted = true` 가 된다.
 *
 * ── 변경 이력 (명세서 10장) ─────────────────────────────────────────────────
 * "모든 등록·수정·삭제에 변경 이력을 기록한다 (대상, 변경 필드, 주체, 일시)."
 * 덮개와 같은 저장소에 `history` 로 쌓는다. 화면(설정 > 변경 이력)이 그것을 읽는다.
 * 주체는 setActor 로 들어온다 — 저장하는 쪽(useCollection)이 지금 누가 로그인해 있는지
 * 알 방법이 없고, 화면마다 계정을 넘기게 하면 한 화면은 반드시 빠뜨린다.
 *
 * ── sessionStorage 인 이유 ─────────────────────────────────────────────────
 * courseVisits.js 와 같다. 새로고침에 살아남아야 검수가 되고(폼을 채우다 새로고침하면
 * 처음부터다), 탭을 닫으면 사라져야 다음 검수가 깨끗한 상태에서 시작한다.
 * localStorage 에 두면 몇 주 뒤 누군가 열었을 때 남의 검수 흔적이 데이터인 척 남는다.
 */

const KEY = "yongin.admin.data.v2";
const EMPTY = { edits: {}, added: [], removed: [], seq: 0 };
const HISTORY_MAX = 200;   /* 세션 저장소 용량이 5MB 안팎이다. 검수용으로 충분하고, 넘으면 앞에서 버린다 */

let cache = null;
let actor = null;
const listeners = new Set();

/* 지금 로그인한 사람. AdminApp 이 로그인·로그아웃 때 한 번씩 넣는다 */
export function setActor(account) { actor = account ? { id: account.id, name: account.name } : null; }

function readAll() {
  if (cache) return cache;
  const s = safeStore("sessionStorage");
  let raw = null;
  if (s) {
    try { raw = JSON.parse(s.getItem(KEY) || "null"); } catch (e) { raw = null; }
  }
  cache = raw && typeof raw === "object" ? raw : {};
  return cache;
}

function writeAll(next) {
  cache = next;
  const s = safeStore("sessionStorage");
  if (s) {
    try { s.setItem(KEY, JSON.stringify(next)); }
    catch (e) { /* 용량 초과 등 — 화면 상태는 이미 바뀌었으므로 그대로 간다 */ }
  }
  listeners.forEach(fn => fn());
}

function overlayOf(name) {
  const all = readAll();
  return { ...EMPTY, ...(all[name] || {}) };
}

function setOverlay(name, patch) {
  const all = readAll();
  writeAll({ ...all, [name]: { ...overlayOf(name), ...patch } });
}

/* ── 변경 이력 ────────────────────────────────────────────────────────────── */
function log(entry) {
  const all = readAll();
  const list = (all.history || []).concat({
    at: new Date().toISOString(),
    by: actor ? actor.name : "(로그인 정보 없음)",
    byId: actor ? actor.id : null,
    ...entry,
  });
  writeAll({ ...all, history: list.slice(-HISTORY_MAX) });
}

/* ── 지금 이것을 부르는 화면이 없다 (2026-08-24) ────────────────────────────
   [환경 설정](M15) 아래 구획이 유일한 독자였고 그 화면이 없어졌다 (AdminApp 머리말).
   **그래도 지우지 않는다.** 명세서 10장이 요구하는 것은 *기록*이고 그것은 위 `record()`
   가 계속 하고 있다 — 없어진 것은 보는 자리다. 다시 붙인다면 대시보드 아래이고,
   그때 필요한 것이 이 함수 하나다. 기록만 남기고 읽는 길을 지우면, 쌓이는 줄들이
   어디서도 꺼낼 수 없는 것이 된다. */
export function readHistory() {
  const all = readAll();
  return (all.history || []).slice().reverse();   /* 최근 것이 위로 */
}

/* 덮개를 원본에 겹친다. 지운 것은 빼고, 고친 것은 덮고, 새 것은 뒤에 붙인다.
   차례를 원본과 같게 유지하기 위해 새 행만 뒤로 보낸다 — 화면이 정한 정렬(거리순 등)이
   있는 목록에서 새 행이 한가운데 끼면 등록한 담당자가 그것을 찾지 못한다. */
function merge(source, ov) {
  const out = [];
  for (const row of source) {
    if (ov.removed.includes(row.id)) continue;
    const patch = ov.edits[row.id];
    out.push(patch ? { ...row, ...patch } : row);
  }
  return out.concat(ov.added.filter(r => !ov.removed.includes(r.id)));
}

/* 훅 밖에서 한 번 읽어야 하는 자리가 있다 — 로그인(계정 표)과 처리 대기 배지가 그렇다.
   같은 merge 를 두 번 적지 않기 위해 내보낸다. */
export function readCollection(name, source) {
  return merge(source, overlayOf(name));
}

/* 덮개가 바뀔 때 알려 준다. 상단바가 이것을 듣는다 — [데모 데이터 초기화] 버튼은
   화면 밖에 있어서, 표에서 무언가를 고쳤을 때 그 사실을 스스로 알 방법이 없다. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/* 전체 초기화 — 상단바 버튼이 쓴다. 덮개만 지우므로 원본은 그대로다. */
export function resetAll() {
  const s = safeStore("sessionStorage");
  if (s) { try { s.removeItem(KEY); } catch (e) { /* 무시 */ } }
  cache = {};
  listeners.forEach(fn => fn());
}

/* 고친 것이 하나라도 있나. 상단바가 [초기화] 버튼을 띄울지 정하는 데 쓴다 —
   아무 것도 안 고쳤는데 초기화 버튼이 서 있으면 무엇을 되돌리는 것인지 알 수 없다. */
export function hasChanges() {
  const all = readAll();
  return Object.entries(all).some(([k, ov]) => (k === "history"
    ? (ov || []).length > 0
    : ov && (Object.keys(ov.edits || {}).length || (ov.added || []).length || (ov.removed || []).length)));
}

/* 바뀐 필드 이름만 뽑는다. 이력에 통째로 적으면 한 줄이 화면을 넘고, 무엇이 달라졌는지는
   오히려 안 보인다 — 명세서가 요구하는 것도 "변경 필드"다. */
function changedKeys(base, next) {
  const out = [];
  for (const k of Object.keys(next)) {
    if (k === "id") continue;
    if (JSON.stringify(next[k]) !== JSON.stringify(base[k])) out.push(k);
  }
  return out;
}

/* 한 컬렉션을 읽고 고친다.
     name    저장 키 ("facilities" 등)
     source  원본 배열
     derive  저장 직전에 한 번 돌리는 보정 (예: AED 이름을 주소에서 다시 만든다)
     label   변경 이력에 적히는 대상 이름 ("공공시설")  */
export function useCollection(name, source, derive, label) {
  const [, bump] = React.useReducer(n => n + 1, 0);

  React.useEffect(() => {
    listeners.add(bump);
    return () => { listeners.delete(bump); };
  }, []);

  const ov = overlayOf(name);
  const rows = React.useMemo(() => merge(source, ov),
    /* ov 는 매 렌더 새 객체라 의존성에 넣을 수 없다. 대신 그 내용을 문자열로 견준다 —
       덮개는 작아서(수십 건) 비용이 무시할 만하고, 바뀌지 않았는데 다시 겹치는 일을 막는다 */
    [source, JSON.stringify(ov)]);   // eslint-disable-line react-hooks/exhaustive-deps

  const target = label || name;

  /* 새로 만들거나 고친다. id 가 있으면 수정, 없으면 등록이다. */
  const upsert = React.useCallback((row) => {
    const cur = overlayOf(name);
    const value = derive ? derive(row) : row;

    if (!value.id) {
      const seq = (cur.seq || 0) + 1;
      /* id 를 시각이 아니라 일련번호로 만든다. 같은 검수를 두 번 해도 같은 id 가 나와야
         "아까 그 행"을 말로 지목할 수 있다 */
      const id = `${name}-new-${String(seq).padStart(3, "0")}`;
      setOverlay(name, { added: cur.added.concat({ ...value, id }), seq });
      log({ action: "등록", target, id, name: value.name || id, fields: [] });
      return id;
    }

    const isAdded = cur.added.some(r => r.id === value.id);
    if (isAdded) {
      const base = cur.added.find(r => r.id === value.id) || {};
      setOverlay(name, { added: cur.added.map(r => (r.id === value.id ? { ...r, ...value } : r)) });
      log({ action: "수정", target, id: value.id, name: value.name || value.id, fields: changedKeys(base, value) });
    } else {
      /* 원본 행은 **바뀐 필드만** 덮개에 남긴다. 통째로 복사해 두면 원본이 갱신됐을 때
         (실데이터 연동 후) 손대지 않은 필드까지 옛 값으로 되돌린다 */
      const base = source.find(r => r.id === value.id) || {};
      const merged = { ...base, ...(cur.edits[value.id] || {}) };
      const patch = {};
      for (const k of Object.keys(value)) if (JSON.stringify(value[k]) !== JSON.stringify(base[k])) patch[k] = value[k];
      setOverlay(name, { edits: { ...cur.edits, [value.id]: { ...(cur.edits[value.id] || {}), ...patch } } });
      log({ action: "수정", target, id: value.id, name: value.name || value.id, fields: changedKeys(merged, value) });
    }
    return value.id;
  }, [name, source, derive, target]);

  const remove = React.useCallback((id, rowName) => {
    const cur = overlayOf(name);
    /* 새로 등록한 행은 덮개에서 빼면 흔적이 남지 않는다. 원본 행은 지웠다는 사실을
       남겨야 하므로 removed 에 넣는다 (= is_deleted 플래그) */
    if (cur.added.some(r => r.id === id)) setOverlay(name, { added: cur.added.filter(r => r.id !== id) });
    else setOverlay(name, { removed: cur.removed.concat(id) });
    log({ action: "삭제", target, id, name: rowName || id, fields: [] });
  }, [name, target]);

  /* 노출 토글처럼 필드 하나만 바꾸는 자리 — 폼을 열지 않고 표에서 바로 누른다 */
  const patch = React.useCallback((id, part, rowName) => {
    const cur = overlayOf(name);
    if (cur.added.some(r => r.id === id)) {
      setOverlay(name, { added: cur.added.map(r => (r.id === id ? { ...r, ...part } : r)) });
    } else {
      setOverlay(name, { edits: { ...cur.edits, [id]: { ...(cur.edits[id] || {}), ...part } } });
    }
    log({ action: "수정", target, id, name: rowName || id, fields: Object.keys(part) });
  }, [name, target]);

  /* 여러 행을 한 번에 고친다 — 노출 순서 바꾸기와 일괄 처리가 이것을 쓴다.
     patch 를 32번 부르면 저장과 알림이 32번 돌아, 목록이 그만큼 다시 그려진다.
     이력도 32줄이 되어 무엇을 한 번에 했는지가 오히려 안 보인다 — 한 줄로 적는다. */
  const patchMany = React.useCallback((entries, note) => {
    if (!entries.length) return;
    const cur = overlayOf(name);
    const edits = { ...cur.edits };
    let added = cur.added;
    for (const [id, part] of entries) {
      if (added.some(r => r.id === id)) added = added.map(r => (r.id === id ? { ...r, ...part } : r));
      else edits[id] = { ...(edits[id] || {}), ...part };
    }
    setOverlay(name, { edits, added });
    log({ action: "일괄 수정", target, id: `${entries.length}건`,
      name: note || `${entries.length}건`, fields: Object.keys(entries[0][1] || {}) });
  }, [name, target]);

  return { rows, upsert, remove, patch, patchMany,
    changed: Object.keys(ov.edits).length + ov.added.length + ov.removed.length };
}

/* ── 설정값처럼 "행이 아니라 한 벌"인 것 ──────────────────────────────────────
   운영 설정과 데이터 기준일은 목록이 아니라 값 한 벌이다.
   useCollection 에 억지로 태우면 id 가 없는 행 하나를 만들게 되고, 그 행을 지우는
   갈래가 생긴다 — 지울 수 없는 것에 삭제 버튼이 생기는 구조는 만들지 않는다. */
export function useSettings(name, defaults, label) {
  const [, bump] = React.useReducer(n => n + 1, 0);
  React.useEffect(() => {
    listeners.add(bump);
    return () => { listeners.delete(bump); };
  }, []);

  const all = readAll();
  const value = { ...defaults, ...(all[name] || {}) };

  const save = React.useCallback((next) => {
    const cur = readAll();
    const base = { ...defaults, ...(cur[name] || {}) };
    writeAll({ ...cur, [name]: { ...(cur[name] || {}), ...next } });
    log({ action: "수정", target: label || name, id: name, name: label || name,
      fields: changedKeys(base, { ...base, ...next }) });
  }, [name, defaults, label]);

  const isDefault = JSON.stringify(value) === JSON.stringify(defaults);
  return { value, save, isDefault };
}
