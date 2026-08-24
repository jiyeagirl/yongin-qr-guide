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
 * ── 계정을 만들고 지우는 사람만 따로 있다 (2026-08-24) ─────────────────────
 * v1.1 에서 `CITY`/`DEVELOPER` 두 권한을 없앤 것은 그대로다 — **업무 화면 아홉 개는
 * 모든 계정이 똑같이 본다.** 시설을 고치는 일에 등급을 매길 이유는 지금도 없다.
 *
 * 갈라지는 자리는 하나, **계정 관리(M16)** 뿐이고 이유는 업무가 아니라 자물쇠다.
 * 모든 계정이 계정을 지울 수 있으면 서로를 지울 수 있고, 마지막 하나가 남을 때까지
 * 지우고 나면 **그 하나를 쓰던 사람이 떠나는 순간 아무도 못 들어온다.** 「마지막 계정
 * 보호」는 계정이 0이 되는 것만 막을 뿐, *누가* 마지막으로 남는지는 못 정한다.
 *
 * 그래서 **지워지지 않는 계정 하나**(`admin`)를 두고 계정 관리를 그 계정에만 연다.
 * 담당자가 바뀌어도 돌아올 자리가 늘 남고, 되돌리는 방법이 소스 수정뿐인 상태
 * (서버가 없다)로 떨어지지 않는다.
 *
 * 계정 관리 화면을 통째로 가리는 것이지 [삭제] 버튼만 감추는 것이 아니다. 화면이 열려
 * 있으면 **남의 비밀번호를 바꿀 수 있고**, 그러면 `admin` 을 지우지 못하게 막아 봐야
 * 그 비밀번호를 바꿔 들어가면 그만이라 자물쇠가 아무 것도 잠그지 않는다.
 * 일반 계정의 비밀번호 변경 통로는 로그인 화면의 **초기화 요청**이다 (명세서 9장).
 *
 * ── 화면 키 목록이 그 판정을 맡는다 ────────────────────────────────────────
 * `can()` 이 **없는 주소**(`#/zzz`)와 **못 가는 화면**을 함께 본다. 부르는 쪽
 * (AdminApp 의 내비 필터와 라우터)은 v1.1 때 쓰던 그대로다.
 */

/* 최종 관리자의 아이디. 아이디로 정한다 — 계정에 `role` 열을 되살리면 등록·수정 화면에
   「권한」 칸이 생기고, 그 칸은 고를 것이 사실상 없으면서 항목표(fields.js)와 명세서
   항목 표를 함께 늘린다. 지켜야 할 것은 **이 한 계정**이지 등급 체계가 아니다. */
export const SUPER_ID = "admin";

export const isSuper = a => !!a && a.id === SUPER_ID;

/* 계정 관리에서만 갈라진다. 나머지 아홉 화면은 모든 계정이 같다 */
const SUPER_ONLY = ["accounts"];

/* 화면 키 전체. 라우터·내비·권한 셋이 같은 이 목록을 본다 */
export const ALL_PAGES = [
  "dashboard",
  "districts", "stores", "festivals",
  "facilities",
  "qr",
  "reports",
  "asof", "settings", "accounts",
];

/* 검수용 계정 두 벌 — 최종 관리자와 담당자. 화면이 갈리는 자리가 하나(계정 관리)뿐이라
   두 벌이면 그 하나를 양쪽에서 다 볼 수 있다: `admin` 으로 들어오면 좌측 내비에 계정
   관리가 있고, `yongin` 으로 들어오면 없다. */
export const SEED_ACCOUNTS = [
  { id: SUPER_ID, pw: "admin1234!", name: "최종 관리자",
    email: "admin@yongin.go.kr", phone: "031-324-2114", active: true },
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
  if (!account || !ALL_PAGES.includes(key)) return false;
  return SUPER_ONLY.includes(key) ? isSuper(account) : true;
}

/* 마지막으로 남은 쓸 수 있는 계정은 비활성화·삭제할 수 없다. 막지 않으면 아무도
   들어오지 못하는 상태가 만들어지고, 서버가 없는 지금은 그것을 되돌릴 방법이
   소스 수정뿐이다. (권한을 나누던 때에는 "마지막 개발자 계정"이 이 자리였다.) */
export function isLastAccount(accounts, id) {
  const live = accounts.filter(a => a.active !== false);
  return live.length <= 1 && live.some(a => a.id === id);
}

/* 최종 관리자는 지울 수도, 사용 중지할 수도 없다.
   둘 다 막는 이유는 「마지막 계정 보호」와 같다 — **끄는 것과 지우는 것의 결과가 같다.**
   `admin` 이 꺼지면 로그인이 막히고, 계정 관리는 `admin` 만 열 수 있으므로 그것을 다시
   켜 줄 사람이 아무도 없다. 지운 것과 정확히 같은 자리다.

   막는 자리를 화면이 아니라 여기에 두는 이유: 계정 관리 화면은 지우는 길이 셋이다
   (행의 [삭제] · [사용 여부] 토글 · 수정 창의 사용 여부). 셋이 각자 판정하면 언젠가
   하나가 빠진다. */
export function isProtectedAccount(id) {
  return id === SUPER_ID;
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
  return { id: a.id, name: a.name, roleLabel: isSuper(a) ? "최종 관리자" : "관리자" };
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
