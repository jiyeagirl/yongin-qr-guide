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
 *   removed  [ id ]                지운 것 (아래)
 *
 * ── 삭제는 영구다 (2026-08-24, 사용자 요청으로 뒤집음) ──────────────────────
 * 종전 정책은 명세서 10장의 "물리 삭제 없음 · `is_deleted` 플래그"였고, `removed` 가 곧
 * 그 플래그였다 — 목록 화면마다 「삭제된 항목 n」 탭이 서서 한 건씩 되돌렸다.
 * **그 되돌리는 자리를 전부 걷어냈다.** 지금 [삭제]는 누르는 순간 끝이고, 확인 창이
 * 그 사실을 먼저 적는다 (`ConfirmDialog` 의 DELETE_NOTE).
 *
 * ── 그래도 `removed` 라는 목록이 남아 있는 이유 ────────────────────────────
 * **원본 배열을 지울 수가 없다.** 시민 화면이 읽는 `STORES` · `FACILITIES` 는 모듈이 뜰 때
 * 만들어지는 상수이고, 이 파일은 그 위에 덮개를 얹을 뿐이다(맨 위 문단). 그래서 원본에서
 * 온 행을 지우는 유일한 방법은 **id 를 여기 적어 두고 merge 에서 거르는 것**이다.
 * 종전과 다른 점은 그 목록이 **비석이지 서랍이 아니라는 것**이다 — 읽는 화면이 없고,
 * 되돌리는 함수도 없다. 실연동에서는 이 자리가 서버의 DELETE 이고 그때 이 배열은 사라진다.
 *
 * **새로 등록한 행은 진짜로 없어진다.** `added` 에서 빼내고 `edits` 에 남은 것도 함께
 * 지운다 — 덮개 안에만 있던 자료라 원본처럼 붙들고 있을 이유가 없다. (2026-08-24 이전에는
 * 되돌리려고 `added` 에 남겨 두었는데, 되돌릴 자리가 없어졌으므로 남길 이유도 없어졌다.)
 *
 * 한 가지만 남는다: 상단바의 **[데모 데이터 초기화]**. 그것은 되돌리기가 아니라 덮개를
 * 통째로 버리고 처음 상태로 가는 버튼이고(검수용), 그날 고친 것이 전부 함께 사라진다.
 *
 * ── 변경 이력 (명세서 10장) ─────────────────────────────────────────────────
 * "모든 등록·수정·삭제에 변경 이력을 기록한다 (대상, 변경 필드, 주체, 일시)."
 * 덮개와 같은 저장소에 `history` 로 쌓는다. **읽는 화면은 지금 없다** (아래 readHistory).
 * 주체는 setActor 로 들어온다 — 저장하는 쪽(useCollection)이 지금 누가 로그인해 있는지
 * 알 방법이 없고, 화면마다 계정을 넘기게 하면 한 화면은 반드시 빠뜨린다.
 *
 * ── sessionStorage 인 이유 ─────────────────────────────────────────────────
 * courseVisits.js 와 같다. 새로고침에 살아남아야 검수가 되고(폼을 채우다 새로고침하면
 * 처음부터다), 탭을 닫으면 사라져야 다음 검수가 깨끗한 상태에서 시작한다.
 * localStorage 에 두면 몇 주 뒤 누군가 열었을 때 남의 검수 흔적이 데이터인 척 남는다.
 */

/* v2 → v3 (2026-08-24). 덮개의 **뜻이 달라져서** 올린다 — v2 에는 되돌리기를 위해
   `added` 에 남겨 둔 채 `removed` 에도 오른 행과 연쇄 삭제 기억(`links`)이 들어 있다.
   그 모양을 새 코드가 읽으면 지운 줄이 목록에 되살아난다 (merge 가 이제 `added` 를
   거르지 않는다). 키를 올리면 검수 중이던 탭도 깨끗한 상태에서 다시 시작한다. */
const KEY = "yongin.admin.data.v3";
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
   [환경 설정] 화면 아래 구획이 유일한 독자였고 그 화면이 없어졌다 (AdminApp 머리말).
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
  return out.concat(ov.added);
}

/* 훅 밖에서 한 번 읽어야 하는 자리가 있다 — 로그인(계정 표)과 처리 대기 배지가 그렇다.
   같은 merge 를 두 번 적지 않기 위해 내보낸다. */
export function readCollection(name, source) {
  return merge(source, overlayOf(name));
}

/* ── 훅 밖에서 한 줄을 더하고 고친다 (2026-08-24) ───────────────────────────
   **로그인 화면의 비밀번호 초기화 요청이 이것을 쓴다.** 그 화면은 세션보다 앞에 서 있어서
   (AdminApp 은 로그인 전에는 셸을 세우지 않는다) `useCollection` 을 걸 자리가 없다 —
   훅을 쓰려면 로그인하지 않은 사람에게 셸을 세워 주어야 하는데, 그것이야말로 저쪽
   머리말이 하지 않기로 한 일이다.

   아래 `useCollection` 의 upsert/patch 도 이 둘을 부른다. 같은 일을 두 벌 적으면 언젠가
   한쪽만 고쳐지고, 그때 갈라지는 것은 **이력에 남는 줄**이라 눈에 띄지도 않는다. */
export function addRow(name, row, label) {
  const cur = overlayOf(name);
  const seq = (cur.seq || 0) + 1;
  /* id 를 시각이 아니라 일련번호로 만든다. 같은 검수를 두 번 해도 같은 id 가 나와야
     "아까 그 행"을 말로 지목할 수 있다 */
  const id = `${name}-new-${String(seq).padStart(3, "0")}`;
  setOverlay(name, { added: cur.added.concat({ ...row, id }), seq });
  log({ action: "등록", target: label || name, id, name: row.name || id, fields: [] });
  return id;
}

export function patchRow(name, id, part, rowName, label) {
  const cur = overlayOf(name);
  if (cur.added.some(r => r.id === id)) {
    setOverlay(name, { added: cur.added.map(r => (r.id === id ? { ...r, ...part } : r)) });
  } else {
    setOverlay(name, { edits: { ...cur.edits, [id]: { ...(cur.edits[id] || {}), ...part } } });
  }
  log({ action: "수정", target: label || name, id, name: rowName || id, fields: Object.keys(part) });
}

/* ── 지우기는 원본 배열을 보지 않는다 ──────────────────────────────────────
   덮개에서 빼거나 `removed` 에 id 를 적는 일이 전부라, 그 컬렉션의 원본이 무엇인지 알
   필요가 없다. 그래서 훅 밖으로 낸다 — **한 화면이 다른 컬렉션을 함께 지워야 하는 자리**가
   있기 때문이다 (상점가를 지우면 거기 걸린 축제 · QR 지점 · 소속 점포가 함께 간다.
   Districts.jsx). 그 화면이 `useCollection("festivals")` 를 따로 세우면 원본 배열과 훅이
   하나씩 더 붙는데, 정작 쓰는 것은 이 한 줄뿐이다.

   `useCollection` 의 remove 도 이것을 부른다 — 같은 일을 두 벌 적지 않는다.

   ── 새로 등록한 행과 원본 행의 갈래 (2026-08-24) ───────────────────────────
   덮개 안에만 있던 행(`added`)은 **거기서 빼면 그대로 없어진다.** 원본에서 온 행은 그럴
   수 없어(맨 위 문단) id 를 `removed` 에 적어 둔다. 어느 쪽이든 남은 `edits` 는 함께
   지운다 — 지운 행의 수정 기록을 붙들고 있으면 같은 id 가 다시 들어올 때 옛 값이 얹힌다.

   ── 여럿을 한 번에 ────────────────────────────────────────────────────────
   상점가 하나를 지우면 소속 점포가 함께 간다. 둔전은 335곳이다.
   그것을 removeRow 로 335번 부르면 두 가지가 망가진다:
     · 저장과 알림이 335번 돌아 목록이 그만큼 다시 그려진다
     · **이력이 335줄이 된다.** HISTORY_MAX 가 200이라 그날 한 일이 전부 밀려나고,
       남는 것은 점포 삭제 200줄뿐이다 — 무엇을 했는지 알아볼 수 없는 이력이 된다
   그래서 한 번 쓰고 **한 줄로 적는다** (patchMany 와 같은 규칙). 한 건이면 「삭제」,
   여럿이면 「일괄 삭제」다 — 셈이 아니라 담당자가 한 번 누른 일의 단위를 적는 것이다. */
export function removeRows(name, rows, label, note) {
  const cur = overlayOf(name);
  const addedIds = new Set(cur.added.map(r => r.id));
  /* 두 번 눌러도 이력이 두 줄이 되지 않는다 — 이미 없어진 것은 세지 않는다 */
  const gone = rows.filter(r => addedIds.has(r.id) || !cur.removed.includes(r.id));
  if (!gone.length) return [];
  const ids = gone.map(r => r.id);
  const idSet = new Set(ids);
  const edits = { ...cur.edits };
  for (const id of ids) delete edits[id];
  setOverlay(name, {
    added: cur.added.filter(r => !idSet.has(r.id)),
    /* 새로 등록한 행은 위에서 사라졌으니 비석을 세우지 않는다 — 원본에 없는 id 를
       `removed` 에 남기면 그 목록이 영영 줄지 않는다 */
    removed: cur.removed.concat(ids.filter(id => !addedIds.has(id))),
    edits,
  });
  logMany("삭제", name, label, gone, note);
  return ids;
}

function logMany(action, name, label, rows, note, fields = []) {
  const target = label || name;
  if (rows.length === 1) {
    log({ action, target, id: rows[0].id, name: rows[0].name || rows[0].id, fields });
    return;
  }
  log({ action: `일괄 ${action}`, target, id: `${rows.length}건`,
    name: note || `${rows.length}건`, fields });
}

export function removeRow(name, id, rowName, label) {
  return removeRows(name, [{ id, name: rowName }], label);
}

/* 여기 `restoreRow` · `restoreRows` · `readRemoved` 가 있었다 (2026-08-24 삭제).
   삭제가 영구가 되면서 되돌리는 길을 통째로 걷어냈다 — 맨 위 문단 참조.
   그것들을 부르던 자리는 목록 화면 다섯의 「삭제된 항목」 탭이었고, 그 탭도 함께 없앴다
   (`admin/pages/RemovedItems.jsx` 삭제). */

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

    if (!value.id) return addRow(name, value, target);

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

  /* 지운다 — 되돌리는 짝이 없다 (2026-08-24. 머리말 참조). 남는 것은 변경 이력의
     「삭제」 한 줄뿐이고, 그것도 읽는 화면이 아직 없다 (readHistory 위 주석). */
  const remove = React.useCallback((id, rowName) => removeRow(name, id, rowName, target), [name, target]);

  /* 노출 토글처럼 필드 하나만 바꾸는 자리 — 폼을 열지 않고 표에서 바로 누른다 */
  const patch = React.useCallback((id, part, rowName) =>
    patchRow(name, id, part, rowName, target), [name, target]);

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
