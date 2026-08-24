import React from "react";
import { safeStore } from "../../screens/main/data/sessionStore.js";

/* 관리자가 고친 것을 담아 두는 곳.
 *
 * ── 원본을 건드리지 않는다 ──────────────────────────────────────────────────
 * 시민 화면이 읽는 배열(FACILITIES · STORES · DISTRICTS · QR_POINTS)은 모듈이 뜰 때
 * 한 번 만들어지는 상수다. 관리자가 그것을 직접 밀어 넣으면 두 화면이 같은 배열을
 * 공유한다는 사실에 기대게 되는데, 실서비스에서 그 자리는 서버다 — 배열이 아니다.
 *
 * 그래서 **원본 위에 덮개(overlay)를 얹는다.** 덮개가 갖는 것은 넷뿐이다:
 *
 *   edits    { id: 바뀐 필드만 }   원본 행을 고친 것
 *   added    [ 통째 행 ]           새로 등록한 것
 *   removed  [ id ]                지운 것
 *   links    { id: 함께 지운 것 }  연쇄 삭제의 기억 (아래 linkRemoval)
 *
 * ── removed 가 곧 명세서 10장의 "물리 삭제 없음" 이다 ──────────────────────
 * 명세서 공통 정책: "물리 삭제 없음. `is_deleted` 플래그로 처리한다."
 * 여기서 `removed` 에 id 를 넣는 것이 그 플래그다 — **원본 배열에서는 아무 것도 지워지지
 * 않는다.** 목록을 만들 때 걸러낼 뿐이다. 실연동 때 이 자리는 서버의 `is_deleted = true`.
 *
 * ── 그 플래그가 화면에서도 보인다 (2026-08-24) ─────────────────────────────
 * 예전에는 지운 것을 되돌리는 길이 [데모 데이터 초기화] 하나뿐이었다. 그것은 **전부**를
 * 되돌리는 버튼이라, 한 건을 잘못 지운 사람이 쓸 수 있는 길이 아니었다 — 되돌리려면
 * 그날 고친 것을 전부 버려야 했다. 그래서 화면이 "물리 삭제 없음"이라고 적으면서도
 * 담당자에게는 사실상 영구 삭제로 보였다.
 *
 * 이제 목록 화면마다 [삭제된 항목 n] 이 서고 거기서 한 건씩 되돌린다 (`restore`).
 * 덮개 구조는 그대로다 — `removed` 에서 id 하나를 빼는 것이 곧 복구다.
 *
 * **새로 등록한 행도 같은 길을 탄다** (2026-08-24 바뀜). 전에는 `added` 에서 빼버려
 * 흔적이 남지 않았는데, 그러면 방금 등록한 것을 잘못 지웠을 때만 되돌릴 수 없다 —
 * 가장 되돌리고 싶은 경우가 유일하게 안 되는 셈이었다. 이제 `added` 에 그대로 두고
 * `removed` 에 id 를 넣는다. 아래 merge 가 이미 두 곳을 다 거르고 있었다.
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

const KEY = "yongin.admin.data.v2";
const EMPTY = { edits: {}, added: [], removed: [], links: {}, seq: 0 };
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
  return out.concat(ov.added.filter(r => !ov.removed.includes(r.id)));
}

/* 위 merge 가 걸러낸 것들 — [삭제된 항목] 상자가 이것을 읽는다.
   **고친 값을 얹어서 돌려준다.** 지우기 전에 이름을 고쳤다면 담당자가 목록에서 마지막으로
   본 이름은 고친 쪽이고, 원본 이름으로 적으면 자기가 지운 줄을 못 알아본다.
   차례는 merge 와 같다 (원본 순서 다음 새로 등록한 것) — 두 목록이 같은 규칙으로 늘어서야
   [삭제된 항목]에서 되돌린 줄을 목록에서 다시 찾을 때 짐작이 맞는다. */
function removedOf(source, ov) {
  const out = source
    .filter(r => ov.removed.includes(r.id))
    .map(r => (ov.edits[r.id] ? { ...r, ...ov.edits[r.id] } : r));
  return out.concat(ov.added.filter(r => ov.removed.includes(r.id)));
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

/* ── 지우기·되돌리기는 원본 배열을 보지 않는다 ─────────────────────────────
   `removed` 에 id 를 넣고 빼는 일이 전부라, 그 컬렉션의 원본이 무엇인지 알 필요가 없다.
   그래서 훅 밖으로 낸다 — **한 화면이 다른 컬렉션을 함께 지워야 하는 자리**가 있기
   때문이다 (상점가를 지우면 거기 걸린 축제 · QR 지점 · 소속 점포가 함께 간다. Districts.jsx).
   그 화면이 `useCollection("festivals")` 를 따로 세우면 원본 배열과 훅이 하나씩 더 붙는데,
   정작 쓰는 것은 이 두 줄뿐이다.

   `useCollection` 의 remove/restore 도 이것을 부른다 — 같은 일을 두 벌 적지 않는다.

   ── 여럿을 한 번에 (2026-08-24) ────────────────────────────────────────────
   상점가 하나를 지우면 소속 점포가 함께 간다. 둔전은 335곳이다.
   그것을 removeRow 로 335번 부르면 두 가지가 망가진다:
     · 저장과 알림이 335번 돌아 목록이 그만큼 다시 그려진다
     · **이력이 335줄이 된다.** HISTORY_MAX 가 200이라 그날 한 일이 전부 밀려나고,
       남는 것은 점포 삭제 200줄뿐이다 — 무엇을 했는지 알아볼 수 없는 이력이 된다
   그래서 한 번 쓰고 **한 줄로 적는다** (patchMany 와 같은 규칙). 한 건이면 「삭제」,
   여럿이면 「일괄 삭제」다 — 셈이 아니라 담당자가 한 번 누른 일의 단위를 적는 것이다. */
export function removeRows(name, rows, label, note) {
  const cur = overlayOf(name);
  /* 두 번 눌러도 이력이 두 줄이 되지 않는다 — 이미 지워진 것은 세지 않는다 */
  const add = rows.filter(r => !cur.removed.includes(r.id));
  if (!add.length) return [];
  const ids = add.map(r => r.id);
  setOverlay(name, { removed: cur.removed.concat(ids) });
  logMany("삭제", name, label, add, note);
  return ids;   /* **이번에 지운 것만** 돌려준다 — 부르는 쪽이 그것을 적어 둔다 (linkRemoval) */
}

/* `hide` 를 주면 되돌리면서 그 필드를 함께 덮는다 — `{ visible: false }` · `{ active: false }`.
   **되돌린 것은 꺼진 채로 돌아온다** (2026-08-24, 사용자 요청):

   지운 것을 되돌리는 일과 그것을 사용자 화면에 다시 내보이는 일은 **다른 결정**이다.
   담당자가 [되돌리기]를 누르는 이유는 대개 "잘못 지웠다"이지 "지금 이대로 다시 내보내라"가
   아니고, 되돌린 자료는 지우기 전 그대로라 값이 맞는지 아직 아무도 다시 보지 않았다.
   켜는 것은 표에서 토글 하나이므로, 끄고 돌려주는 쪽이 되돌리기 어려운 쪽이 아니다.
   그 사실을 토스트가 적는다 (RemovedItems 의 undoToast).

   **연쇄 복구에는 주지 않는다** — 상점가와 함께 돌아오는 축제·QR·점포 말이다.
   상점가가 이미 꺼진 채로 돌아오고, 상점가가 꺼져 있으면 그 아래는 어차피 사용자 화면에
   없다. 335곳을 하나씩 다시 켜게 만들 이유가 없다 (Districts.jsx 의 undo). */
export function restoreRows(name, rows, label, note, hide) {
  const cur = overlayOf(name);
  const back = rows.filter(r => cur.removed.includes(r.id));
  if (!back.length) return [];
  const ids = back.map(r => r.id);
  setOverlay(name, {
    removed: cur.removed.filter(x => !ids.includes(x)),
    ...hidePatch(cur, back, hide),
  });
  logMany("복구", name, label, back, note, Object.keys(hide || {}));
  return ids;
}

/* 되돌리는 그 한 번의 쓰기에 노출 끄기를 얹는다. 따로 patch 를 부르면 저장이 두 번 돌고
   이력에 「복구」 다음 「수정」이 붙어, 담당자가 하지 않은 수정이 한 줄 남는다.
   원본 행은 `edits` 에, 새로 등록한 행은 `added` 에 덮는다 (patchMany 와 같은 갈래). */
function hidePatch(cur, rows, hide) {
  if (!hide) return {};
  const edits = { ...cur.edits };
  let added = cur.added;
  for (const r of rows) {
    if (added.some(a => a.id === r.id)) added = added.map(a => (a.id === r.id ? { ...a, ...hide } : a));
    else edits[r.id] = { ...(edits[r.id] || {}), ...hide };
  }
  return { edits, added };
}

/* ── 함께 지운 것을 적어 둔다 ────────────────────────────────────────────────
   상점가를 되돌릴 때 무엇을 함께 되살릴지 정하는 값이다.

   처음에는 적어 두지 않고 **"지금 지워져 있으면서 이 상점가를 가리키는 것"** 을 전부
   되살렸다. 축제와 QR 지점만 걸릴 때는 그것으로 충분했는데, 점포가 함께 가면서 깨졌다 —
   담당자가 지난주에 폐업 오등록으로 지운 점포 한 곳이 상점가를 되돌리는 순간 **아무도
   되살리지 않았는데 되살아난다.** 되돌리기가 자기가 지운 것 이상을 건드리면 그 단추는
   못 믿을 단추가 된다.

   그래서 지운 **그 순간에 실제로 지워진 id** 만 적어 두고(removeRows 의 반환값),
   되돌릴 때 그것만 되살린다. 따로 남는 삭제는 그대로 남고, 각자의 목록 위
   [삭제된 항목]에서 한 건씩 되돌린다 — 그 자리가 화면마다 있으므로 갇히지 않는다.

   되돌리면서 지운다(take) — 상점가를 되돌린 뒤에도 기록이 남아 있으면, 그 상점가를
   다시 지웠다 되돌릴 때 옛 목록이 섞인다. */
export function linkRemoval(name, id, links) {
  const cur = overlayOf(name);
  setOverlay(name, { links: { ...(cur.links || {}), [id]: links } });
}

export function takeRemovalLinks(name, id) {
  const cur = overlayOf(name);
  const all = cur.links || {};
  if (!all[id]) return null;
  const next = { ...all };
  delete next[id];
  setOverlay(name, { links: next });
  return all[id];
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

export function restoreRow(name, id, rowName, label, hide) {
  return restoreRows(name, [{ id, name: rowName }], label, null, hide);
}

/* 지금 지워져 있는 것들 — 훅 밖에서도 봐야 한다 (상점가가 함께 되돌릴 것을 고를 때).
   원본이 필요하므로 화면이 넘긴다. */
export function readRemoved(name, source) {
  return removedOf(source, overlayOf(name));
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

  /* [삭제된 항목] 상자가 읽는다. 지운 것이 없으면 빈 배열이고, 그때 그 단추는 나오지 않는다 */
  const removed = React.useMemo(() => removedOf(source, ov),
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

  /* 지운다 = `removed` 에 id 를 넣는다 (= is_deleted 플래그). **원본이든 새로 등록한
     행이든 같다** (2026-08-24. 머리말 참조) — 그래야 둘 다 되돌릴 수 있다.
     되돌리기도 그 id 를 빼면 끝이고, 이력에 「복구」로 남는다 — 지운 것만 적히면
     이력을 읽는 사람에게는 아직 지워진 채로 보인다. 둘 다 위 removeRow/restoreRow 다. */
  const remove = React.useCallback((id, rowName) => removeRow(name, id, rowName, target), [name, target]);
  const restore = React.useCallback((id, rowName, hide) => restoreRow(name, id, rowName, target, hide), [name, target]);

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

  return { rows, removed, upsert, remove, restore, patch, patchMany,
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
