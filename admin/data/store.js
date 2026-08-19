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
 * 읽을 때 이 셋을 원본에 겹쳐 목록을 만든다. 실연동 때는 이 파일이 통째로
 * fetch/POST 로 바뀌고, 화면 코드는 useCollection 의 모양만 같으면 손대지 않는다.
 *
 * ── sessionStorage 인 이유 ─────────────────────────────────────────────────
 * courseVisits.js 와 같다. 새로고침에 살아남아야 검수가 되고(폼을 채우다 새로고침하면
 * 처음부터다), 탭을 닫으면 사라져야 다음 검수가 깨끗한 상태에서 시작한다.
 * localStorage 에 두면 몇 주 뒤 누군가 열었을 때 남의 검수 흔적이 데이터인 척 남는다.
 *
 * ── 모듈 수준 구독을 두는 이유 ──────────────────────────────────────────────
 * 상단바의 [데모 데이터 초기화]는 지금 열려 있는 화면 밖에 있다. React 상태로만 들고
 * 있으면 초기화를 눌러도 아래 표가 그대로 남아, 눌린 것 같지 않은 버튼이 된다.
 */

const KEY = "yongin.admin.data.v1";
const EMPTY = { edits: {}, added: [], removed: [], seq: 0 };

let cache = null;
const listeners = new Set();

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
  return Object.values(all).some(ov =>
    (ov && (Object.keys(ov.edits || {}).length || (ov.added || []).length || (ov.removed || []).length)));
}

/* 한 컬렉션을 읽고 고친다.
     name    저장 키 ("facilities" 등)
     source  원본 배열
     derive  저장 직전에 한 번 돌리는 보정 (예: AED 이름을 주소에서 다시 만든다)  */
export function useCollection(name, source, derive) {
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
      return id;
    }

    const isAdded = cur.added.some(r => r.id === value.id);
    if (isAdded) {
      setOverlay(name, { added: cur.added.map(r => (r.id === value.id ? { ...r, ...value } : r)) });
    } else {
      /* 원본 행은 **바뀐 필드만** 덮개에 남긴다. 통째로 복사해 두면 원본이 갱신됐을 때
         (실데이터 연동 후) 손대지 않은 필드까지 옛 값으로 되돌린다 */
      const base = source.find(r => r.id === value.id) || {};
      const patch = {};
      for (const k of Object.keys(value)) if (value[k] !== base[k]) patch[k] = value[k];
      setOverlay(name, { edits: { ...cur.edits, [value.id]: { ...(cur.edits[value.id] || {}), ...patch } } });
    }
    return value.id;
  }, [name, source, derive]);

  const remove = React.useCallback((id) => {
    const cur = overlayOf(name);
    /* 새로 등록한 행은 덮개에서 빼면 흔적이 남지 않는다. 원본 행은 지웠다는 사실을
       남겨야 하므로 removed 에 넣는다 */
    if (cur.added.some(r => r.id === id)) setOverlay(name, { added: cur.added.filter(r => r.id !== id) });
    else setOverlay(name, { removed: cur.removed.concat(id) });
  }, [name]);

  /* 노출 토글처럼 필드 하나만 바꾸는 자리 — 폼을 열지 않고 표에서 바로 누른다 */
  const patch = React.useCallback((id, part) => {
    const cur = overlayOf(name);
    if (cur.added.some(r => r.id === id)) {
      setOverlay(name, { added: cur.added.map(r => (r.id === id ? { ...r, ...part } : r)) });
    } else {
      setOverlay(name, { edits: { ...cur.edits, [id]: { ...(cur.edits[id] || {}), ...part } } });
    }
  }, [name]);

  /* 여러 행을 한 번에 고친다 — 노출 순서 바꾸기가 이것을 쓴다.
     patch 를 32번 부르면 저장과 알림이 32번 돌아, 목록이 그만큼 다시 그려진다. */
  const patchMany = React.useCallback((entries) => {
    const cur = overlayOf(name);
    const edits = { ...cur.edits };
    let added = cur.added;
    for (const [id, part] of entries) {
      if (added.some(r => r.id === id)) added = added.map(r => (r.id === id ? { ...r, ...part } : r));
      else edits[id] = { ...(edits[id] || {}), ...part };
    }
    setOverlay(name, { edits, added });
  }, [name]);

  return { rows, upsert, remove, patch, patchMany,
    changed: Object.keys(ov.edits).length + ov.added.length + ov.removed.length };
}
