import React from "react";
import { safeStore } from "../../screens/main/data/sessionStore.js";

/* 로그인과 권한 (A-AC-01).
 *
 * ── 진짜 인증이 아니다 ──────────────────────────────────────────────────────
 * 서버가 없다. 이 표는 **권한 분리가 화면에서 어떻게 보이는지**를 확인하기 위한 것이고,
 * 실서비스에서는 이 파일이 통째로 세션 API 호출로 바뀐다. 비밀번호를 소스에 적어 둔 것도
 * 그래서다 — 감출 가치가 있는 비밀이 아니라 검수용 열쇠다. 로그인 화면이 그 사실을
 * 화면에 그대로 적는다.
 *
 * ── 권한을 둘로 나눈 이유 ───────────────────────────────────────────────────
 * 명세서 A-AC-01 이 "시청 담당자와 운영사 권한 분리"라고만 적고 있어, 무엇이 갈리는지는
 * 이 화면을 만들면서 정해야 했다. 기준은 **책임의 종류**다:
 *
 *   시청 담당자  시민에게 답하고(문의) 성과를 보고한다(통계). 데이터도 고칠 수 있다
 *   운영사       데이터를 채워 넣는다. 시민에게 직접 답하지 않는다
 *
 * 문의 답변이 갈리는 자리인 것은, 그 답이 **시청의 답으로 읽히기** 때문이다.
 * 통계는 대외 보고에 쓰이는 수치라 같은 쪽에 둔다.
 */

/* 권한 → 볼 수 있는 화면 키. 내비와 라우터가 같은 이 표를 본다 —
   내비에서만 감추면 주소를 직접 치는 것으로 들어가진다. */
export const ROLES = {
  city: {
    key: "city",
    label: "시청 담당자",
    allow: ["dashboard", "facilities", "districts", "stores", "festivals", "qr", "inquiries"],
  },
  vendor: {
    key: "vendor",
    label: "운영사",
    allow: ["facilities", "districts", "stores", "festivals", "qr"],
  },
};

export const ACCOUNTS = [
  { id: "yongin", pw: "yongin1234", name: "포곡읍 김담당", role: "city" },
  { id: "ninelight", pw: "ninelight1234", name: "나인라이트 운영팀", role: "vendor" },
];

export function can(account, key) {
  if (!account) return false;
  const role = ROLES[account.role];
  return !!role && role.allow.includes(key);
}

/* 로그인 상태는 sessionStorage 다. 새로고침에 살아남아야 검수가 되고
   (화면 하나 고칠 때마다 다시 로그인하게 만들 이유가 없다), 탭을 닫으면 사라져야 한다.
   실서비스라면 이 자리는 서버가 준 세션 쿠키다 — 브라우저 저장소에 담을 값이 아니다. */
const KEY = "yongin.admin.session.v1";

function read() {
  const s = safeStore("sessionStorage");
  if (!s) return null;
  try {
    const raw = JSON.parse(s.getItem(KEY) || "null");
    if (!raw || !raw.id) return null;
    /* 저장된 것은 id 뿐이다. 이름과 권한은 표에서 다시 읽는다 —
       표가 바뀌었는데 저장값이 옛 권한을 들고 있으면 없는 권한으로 들어와진다 */
    const found = ACCOUNTS.find(a => a.id === raw.id);
    return found ? session(found) : null;
  } catch (e) {
    return null;
  }
}

function session(a) {
  return { id: a.id, name: a.name, role: a.role, roleLabel: ROLES[a.role].label };
}

export function useSession() {
  const [account, setAccount] = React.useState(read);

  const signIn = React.useCallback((id, pw) => {
    const found = ACCOUNTS.find(a => a.id === id.trim() && a.pw === pw);
    if (!found) return "아이디 또는 비밀번호가 올바르지 않습니다.";
    const s = safeStore("sessionStorage");
    if (s) { try { s.setItem(KEY, JSON.stringify({ id: found.id })); } catch (e) { /* 저장이 막혀도 로그인은 된다 */ } }
    setAccount(session(found));
    return null;
  }, []);

  const signOut = React.useCallback(() => {
    const s = safeStore("sessionStorage");
    if (s) { try { s.removeItem(KEY); } catch (e) { /* 무시 */ } }
    setAccount(null);
  }, []);

  return { account, signIn, signOut };
}
