import React from "react";
import { safeStore } from "../../screens/main/data/sessionStore.js";
import { readCollection, subscribe } from "./store.js";

/* 계정과 권한 (명세서 9장 · M01 · M17).
 *
 * ── 진짜 인증이 아니다 ──────────────────────────────────────────────────────
 * 서버가 없다. 이 표는 **권한 분리가 화면에서 어떻게 보이는지**를 확인하기 위한 것이고,
 * 실서비스에서는 이 파일이 통째로 세션 API 호출로 바뀐다. 비밀번호를 소스에 적어 둔 것도
 * 그래서다 — 감출 가치가 있는 비밀이 아니라 검수용 열쇠다. 로그인 화면이 그 사실을
 * 화면에 그대로 적는다.
 *
 * ── 권한을 가르는 기준 (명세서 9장) ─────────────────────────────────────────
 *   CITY       시청 담당자 — 등록·수정·삭제, 오류신고 처리, 통계 조회, 운영 설정
 *   DEVELOPER  개발자      — 위 전부 + 계정 관리 · API 쿼터 설정
 *
 * 즉 **시청 담당자가 거의 전부를 할 수 있고, 개발자 전용은 딱 두 가지다.** 그 둘을
 * 가른 기준은 권한의 크기가 아니라 **잘못 건드렸을 때 벌어지는 일**이다 — 계정을
 * 잘못 만지면 아무도 못 들어오고, 쿼터를 잘못 만지면 비용이 나간다. 둘 다 되돌리는 데
 * 사람이 필요하다.
 *
 * (전에는 「공공데이터 동기화 실행」이 셋째였다. 그 화면이 개발 쪽으로 가면서 빠졌다.)
 *
 * ── 두 겹으로 막지만 보안은 아니다 ──────────────────────────────────────────
 * 내비에서 감추고, 주소로 직접 들어와도 되돌린다. 하나만으로는 부족하다 — 감추기만
 * 하면 `#/accounts` 를 주소창에 치는 것으로 들어와지고, 되돌리기만 하면 눌러보고
 * 튕겨나는 메뉴가 남는다. **다만 이것은 UI 수준의 분리일 뿐이다.** 실서비스의 권한은
 * 서버가 막는다. 화면이 막는 것은 실수를 줄이는 장치이지 보안이 아니다.
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

/* 개발자 전용 (명세서 9장). 화면인 것은 계정 관리 하나뿐이다 — API 쿼터는 설정 화면
   **안의 한 구획**이라 화면 단위로 나눌 수 없다. 8-1 운영 설정은 CITY 의 일이고 8-2 는
   아니어서, 화면은 열어 두고 그 안에서 canQuota 로 한 번 더 본다. */
export const DEVELOPER_ONLY = ["accounts"];

export const ROLES = {
  CITY: { key: "CITY", label: "시청 담당자", allow: ALL_PAGES.filter(p => !DEVELOPER_ONLY.includes(p)) },
  DEVELOPER: { key: "DEVELOPER", label: "개발자", allow: ALL_PAGES },
};

export const ROLE_LABEL = { CITY: "시청 담당자", DEVELOPER: "개발자" };

/* 검수용 계정 두 벌. 명세서 9장의 항목을 전부 채워 둔다 — M17 이 열렸을 때
   빈 칸투성이 행이 보이면 그 화면이 무엇을 보여주는지 알 수 없다. */
export const SEED_ACCOUNTS = [
  { id: "yongin", pw: "yongin1234", name: "포곡읍 김담당", role: "CITY",
    email: "gis@yongin.go.kr", phone: "031-324-8000", active: true },
  { id: "ninelight", pw: "ninelight1234", name: "나인라이트 운영팀", role: "DEVELOPER",
    email: "dev@ninelight.kr", phone: "031-000-0000", active: true },
];

/* 계정 표도 덮개 위에 있다 (M17 이 여기에 계정을 더한다). 로그인은 훅 밖에서 한 번
   읽어야 하므로 readCollection 을 쓴다 — 새로 만든 계정으로 바로 들어와 볼 수 있어야
   그 화면을 검수했다고 할 수 있다. */
export function readAccounts() {
  return readCollection("accounts", SEED_ACCOUNTS);
}

export function can(account, key) {
  if (!account) return false;
  const role = ROLES[account.role];
  return !!role && role.allow.includes(key);
}

/* API 쿼터 구획(8-2)을 볼 수 있나. 화면 키로는 나눌 수 없는 자리라 따로 둔다 */
export function canQuota(account) { return !!account && account.role === "DEVELOPER"; }

/* 마지막 개발자 계정은 비활성화·삭제할 수 없다 (명세서 9장 동작 규칙).
   막지 않으면 아무도 계정 관리·동기화·쿼터에 들어가지 못하는 상태가 만들어지고,
   서버가 없는 지금은 그것을 되돌릴 방법이 소스 수정뿐이다. */
export function isLastDeveloper(accounts, id) {
  const live = accounts.filter(a => a.role === "DEVELOPER" && a.active !== false);
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
  return { id: a.id, name: a.name, role: a.role, roleLabel: ROLE_LABEL[a.role] || a.role };
}

function readSession() {
  const raw = readRaw(KEY);
  if (!raw || !raw.id) return null;
  /* 8시간이 지났으면 없는 것으로 친다. 만료를 저장 시점에 계산해 두지 않고 읽을 때마다
     재는 이유: 저장해 두면 시계를 되돌린 기기에서 영원한 세션이 만들어진다 */
  if (raw.at && Date.now() - raw.at > SESSION_HOURS * 3600 * 1000) { writeRaw(KEY, null); return null; }
  /* 저장된 것은 id 뿐이다. 이름과 권한은 표에서 다시 읽는다 —
     표가 바뀌었는데(M17 에서 권한을 낮췄는데) 저장값이 옛 권한을 들고 있으면
     없는 권한으로 들어와진다 */
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

  /* 계정 표가 바뀌면(M17 에서 내 권한을 바꿨거나 나를 비활성화했으면) 세션을 다시 읽는다.
     그러지 않으면 자기 권한을 낮춰 놓고도 새로고침 전까지 옛 권한으로 돌아다닌다 */
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
      return "사용 중지된 계정입니다. 개발자 계정 담당자에게 문의해 주세요.";
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
