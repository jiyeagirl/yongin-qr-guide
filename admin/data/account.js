import React from "react";
import { safeStore } from "../../screens/main/data/sessionStore.js";
import { readCollection, subscribe } from "./store.js";

/* 계정 (M01 · M16).
 *
 * ── 진짜 인증이 아니다 ──────────────────────────────────────────────────────
 * 서버가 없다. 실서비스에서는 이 파일이 통째로 세션 API 호출로 바뀐다. 비밀번호를
 * 소스에 적어 둔 것도 그래서다 — 감출 가치가 있는 비밀이 아니라 검수용 열쇠다.
 * 로그인 화면이 그 사실을 화면에 그대로 적는다.
 *
 * ── 권한을 나누지 않는다 (2026-08-20) ──────────────────────────────────────
 * 전에는 `CITY`(시청 담당자)와 `DEVELOPER`(개발자) 둘이었고 계정 관리와 API 쿼터가
 * 개발자 전용이었다. 그 구분을 없앴다. **이 화면은 용인시 담당자가 쓰는 화면이고,**
 * 개발자는 여기서 할 일이 없다 — 고칠 것이 있으면 코드를 고친다. 쓰지 않는 두 번째
 * 권한을 위해 화면마다 "이 계정에는 보이나"를 따지면, 그 갈래가 실제로 쓰이는 유일한
 * 계정에는 아무 일도 하지 않으면서 검수할 경우의 수만 두 배로 만든다.
 *
 * 그래서 **모든 계정이 같은 권한**이고, 계정 관리도 담당자가 직접 한다 (인사이동으로
 * 사람이 바뀌는 일이 개발사를 부를 일은 아니다).
 *
 * ── 그래도 화면 키 목록은 남는다 ────────────────────────────────────────────
 * 권한이 하나여도 **없는 주소로 들어오는 일**은 막아야 한다 (`#/zzz`). `can()` 이
 * 그 판정을 계속 맡는다 — 나중에 권한이 다시 갈라져도 부르는 쪽은 그대로다.
 */

/* 화면 키 전체. 라우터·내비·권한 셋이 같은 이 목록을 본다 */
export const ALL_PAGES = [
  "dashboard",
  "districts", "stores", "festivals",
  "facilities",
  "qr",
  "reports",
  "asof", "settings", "accounts",
];

/* 검수용 계정 한 벌. 권한을 나누지 않으므로 계정도 하나면 된다 —
   두 벌을 두면 "이 계정으로는 무엇이 다른가"를 검수하는 사람이 매번 확인하게 된다. */
export const SEED_ACCOUNTS = [
  { id: "yongin", pw: "yongin1234", name: "포곡읍 김담당",
    email: "gis@yongin.go.kr", phone: "031-324-8000", active: true },
];

/* 계정 표도 덮개 위에 있다 (M17 이 여기에 계정을 더한다). 로그인은 훅 밖에서 한 번
   읽어야 하므로 readCollection 을 쓴다 — 새로 만든 계정으로 바로 들어와 볼 수 있어야
   그 화면을 검수했다고 할 수 있다. */
export function readAccounts() {
  return readCollection("accounts", SEED_ACCOUNTS);
}

export function can(account, key) {
  return !!account && ALL_PAGES.includes(key);
}

/* 마지막으로 남은 쓸 수 있는 계정은 비활성화·삭제할 수 없다. 막지 않으면 아무도
   들어오지 못하는 상태가 만들어지고, 서버가 없는 지금은 그것을 되돌릴 방법이
   소스 수정뿐이다. (권한을 나누던 때에는 "마지막 개발자 계정"이 이 자리였다.) */
export function isLastAccount(accounts, id) {
  const live = accounts.filter(a => a.active !== false);
  return live.length <= 1 && live.some(a => a.id === id);
}

/* ── 세션 ────────────────────────────────────────────────────────────────────
   sessionStorage 다. 새로고침에 살아남아야 검수가 되고(화면 하나 고칠 때마다 다시
   로그인하게 만들 이유가 없다), 탭을 닫으면 사라져야 한다. 실서비스라면 이 자리는
   서버가 준 세션 쿠키다 — 브라우저 저장소에 담을 값이 아니다. */
const KEY = "yongin.admin.session.v2";
const LOCK_KEY = "yongin.admin.lock.v1";

export const SESSION_HOURS = 8;             /* 명세서 9장 — 세션 8시간 */
export const MAX_ATTEMPTS = 5;              /* 5회 실패 시 */
export const LOCK_MINUTES = 10;             /* 10분 잠금 */

function readRaw(key) {
  const s = safeStore("sessionStorage");
  if (!s) return null;
  try { return JSON.parse(s.getItem(key) || "null"); } catch (e) { return null; }
}

function writeRaw(key, value) {
  const s = safeStore("sessionStorage");
  if (!s) return;
  try {
    if (value == null) s.removeItem(key);
    else s.setItem(key, JSON.stringify(value));
  } catch (e) { /* 저장이 막혀도 화면은 돈다 */ }
}

function session(a) {
  return { id: a.id, name: a.name, roleLabel: "관리자" };
}

function readSession() {
  const raw = readRaw(KEY);
  if (!raw || !raw.id) return null;
  /* 8시간이 지났으면 없는 것으로 친다. 만료를 저장 시점에 계산해 두지 않고 읽을 때마다
     재는 이유: 저장해 두면 시계를 되돌린 기기에서 영원한 세션이 만들어진다 */
  if (raw.at && Date.now() - raw.at > SESSION_HOURS * 3600 * 1000) { writeRaw(KEY, null); return null; }
  /* 저장된 것은 id 뿐이다. 이름은 표에서 다시 읽는다 — 계정 관리에서 이름을 고쳤는데
     상단바가 옛 이름을 들고 있으면, 지금 누구로 들어와 있는지가 화면마다 달라진다.
     계정을 중지하거나 지우면 그 자리에서 세션이 끝난다 */
  const found = readAccounts().find(a => a.id === raw.id);
  if (!found || found.active === false) { writeRaw(KEY, null); return null; }
  return session(found);
}

/* ── 로그인 시도 잠금 ────────────────────────────────────────────────────────
   아이디마다 따로 센다. 하나로 세면 담당자 A 의 오타가 담당자 B 를 잠근다.
   실서비스에서는 이 판정이 서버에 있어야 한다 — 브라우저 저장소를 지우면 풀리는
   잠금은 공격자를 막지 못한다. 여기서는 **화면이 잠긴 상태를 어떻게 보여주는가**를
   확인하는 것이 목적이다. */
function readLocks() { return readRaw(LOCK_KEY) || {}; }

export function lockStatus(id) {
  const rec = readLocks()[String(id || "").trim()];
  if (!rec) return { locked: false, left: 0, fails: 0 };
  const until = rec.until || 0;
  const ms = until - Date.now();
  if (ms <= 0) return { locked: false, left: 0, fails: rec.fails || 0 };
  return { locked: true, left: Math.ceil(ms / 60000), fails: rec.fails || 0 };
}

function noteFail(id) {
  const locks = readLocks();
  const key = String(id || "").trim();
  const rec = locks[key] || { fails: 0, until: 0 };
  const fails = (rec.until && rec.until < Date.now() ? 0 : rec.fails) + 1;
  const next = { fails, until: fails >= MAX_ATTEMPTS ? Date.now() + LOCK_MINUTES * 60000 : 0 };
  writeRaw(LOCK_KEY, { ...locks, [key]: next });
  return next;
}

function clearFail(id) {
  const locks = readLocks();
  delete locks[String(id || "").trim()];
  writeRaw(LOCK_KEY, locks);
}

export function useSession() {
  const [account, setAccount] = React.useState(readSession);

  /* 계정 표가 바뀌면(계정 관리에서 내 이름을 고쳤거나 나를 중지했으면) 세션을 다시 읽는다.
     그러지 않으면 자기 계정을 꺼 놓고도 새로고침 전까지 그대로 돌아다닌다 */
  React.useEffect(() => subscribe(() => setAccount(readSession())), []);

  const signIn = React.useCallback((id, pw) => {
    const key = String(id || "").trim();
    const lock = lockStatus(key);
    if (lock.locked) {
      return `로그인 시도가 ${MAX_ATTEMPTS}회 실패해 잠겼습니다. ${lock.left}분 뒤에 다시 시도해 주세요.`;
    }
    const found = readAccounts().find(a => a.id === key && a.pw === pw);
    if (!found) {
      const next = noteFail(key);
      if (next.until) return `로그인 시도가 ${MAX_ATTEMPTS}회 실패해 ${LOCK_MINUTES}분간 잠겼습니다.`;
      const left = MAX_ATTEMPTS - next.fails;
      return `아이디 또는 비밀번호가 올바르지 않습니다. (${left}회 더 실패하면 ${LOCK_MINUTES}분간 잠깁니다)`;
    }
    if (found.active === false) {
      return "사용 중지된 계정입니다. 다른 계정을 가진 담당자에게 문의해 주세요.";
    }
    clearFail(key);
    writeRaw(KEY, { id: found.id, at: Date.now() });
    setAccount(session(found));
    return null;
  }, []);

  const signOut = React.useCallback(() => {
    writeRaw(KEY, null);
    setAccount(null);
  }, []);

  return { account, signIn, signOut };
}
