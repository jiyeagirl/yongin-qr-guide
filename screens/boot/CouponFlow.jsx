import React from "react";
import { AppBar, Badge, Button, Icon, Input, Mascot, TextButton } from "../../design-systems/index.js";

/* 축제 쿠폰 흐름 — 셸(MainApp) **앞에** 서는 예외 화면 셋 (2026-10-16, 사용자 요청).
 *
 *   C1 안내      QR 을 찍은 직후. 무엇을 받는지와 쓰는 조건을 보여주고 [쿠폰 받기]
 *   C2 쿠폰      받은 뒤. 손님이 상인에게 보여주는 화면. 상인이 [확인하기]를 누른다
 *   C3 확인 완료  상인이 누른 뒤. 「쿠폰이 확인되었어요」
 *
 * ── 왜 셸 앞인가 ────────────────────────────────────────────────────────────
 * 코치마크(U-CM-19)는 셸 위에 덮이는 것이라 이 화면은 그보다 먼저 서야 한다 (사용자가
 * 「코치마크 앞 예외 화면」으로 요청). S11 처럼 `App` 이 셸을 세우기 전에 갈라 두므로
 * 지도 SDK 는 [다음에 받을게요] / [안내 보러 가기]를 누른 뒤에야 내려받는다.
 *
 * ── 가입도 로그인도 없다 ────────────────────────────────────────────────────
 * 모든 손님에게 같은 쿠폰이 보이고, 할인은 상인이 점포 POS 로 직접 한다. 그래서 이
 * 화면들이 하는 일은 **보여주는 것**과 **상인이 눌렀다는 사실을 남기는 것**뿐이다.
 * 서버가 없으므로 그 사실은 이 브라우저의 `localStorage` 에 둔다 (결제 1회당 1장 —
 * 확인한 쿠폰으로 다시 [확인하기] 화면이 열리면 같은 쿠폰이 두 번 쓰인다). 저장이 막힌
 * 브라우저에서는 이 세션 안에서만 지켜진다.
 *
 * 쿠폰 내용(혜택·조건)은 **협의 중인 예시값**이다 — 한 곳(`COUPON`)에서만 받는다.
 */

export const COUPON = {
  id: "festival-1107",
  eyebrow: "11월 7일 단 하루!",
  name: "골목 축제 할인 쿠폰",
  benefit: "1,000원 할인",
  /* 카드 한 줄 요약 — C2 쿠폰 카드에 들어간다 */
  summary: "2만 원 이상 결제 시, 11.7(토) 당일 한정",
  conditions: [
    "2만 원 이상 결제 시 사용 가능",
    "11월 7일(토) 축제 당일에만 사용 가능",
    "참여 점포에서만 사용 가능",
    "결제 1회당 1장 사용",
  ],
};

/* 저장 — A안은 기기 하나에 쿠폰 상태 하나, B안은 계정마다 하나다 (`acct`).
   B안의 계정 표와 로그인 상태도 여기 둔다. **서버가 없는 시연용**이라 비밀번호를 간단히
   뒤섞어(hash) 두지만 보안이 아니다 — 실서비스에서는 서버가 계정·발급·사용 처리를 맡는다. */
const KEY = `yongin.coupon.${COUPON.id}`;
const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* 막힌 브라우저 */ } };
const read = acct => get(acct ? `${KEY}.u.${acct}` : KEY);
const write = (v, acct) => put(acct ? `${KEY}.u.${acct}` : KEY, v);

const hash = t => { let h = 5381; for (const c of t) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0; return String(h); };
const ACCOUNTS = `yongin.coupon.accounts`;
const SESSION = `yongin.coupon.session`;
const accounts = () => { try { return JSON.parse(get(ACCOUNTS) || "{}"); } catch { return {}; } };

function signUp(id, pw) {
  const all = accounts();
  if (all[id]) return false;
  put(ACCOUNTS, JSON.stringify({ ...all, [id]: hash(pw) }));
  put(SESSION, id);
  return true;
}
const logIn = (id, pw) => {
  if (accounts()[id] !== hash(pw)) return false;
  put(SESSION, id);
  return true;
};
function clearAll() {
  const all = accounts();
  Object.keys(all).forEach(id => write(null, id));
  put(ACCOUNTS, null); put(SESSION, null); write(null);
}

const BASE = "../../design-systems/";
const WRAP = { wordBreak: "keep-all", overflowWrap: "anywhere" };

/* 세 화면의 겉틀 — 앱바 + 세로 스크롤 본문 + 바닥에 붙는 단추 자리 */
function Frame({ children, footer }) {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "var(--screen-max)", height: "100%",
      margin: "0 auto", overflow: "hidden", background: "var(--surface-page)",
      display: "flex", flexDirection: "column" }}>
      <AppBar title="용인시 위치안내" style={{ flex: "0 0 auto" }} />
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch", display: "flex", flexDirection: "column" }}>
        <div style={{ margin: "auto 0", padding: "var(--space-5) var(--gutter-screen)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-4)" }}>
          {children}
        </div>
      </div>
      {footer ? (
        <div style={{ flex: "0 0 auto", padding: "var(--space-3) var(--gutter-screen) var(--space-5)",
          background: "var(--surface-page)", display: "flex", flexDirection: "column",
          alignItems: "center", gap: "var(--space-2)" }}>{footer}</div>
      ) : null}
    </div>
  );
}

/* ── C1 안내 ─────────────────────────────────────────────────────────────── */
function Intro({ onGet, onLater, note, cta }) {
  return (
    <Frame footer={<>
      <Button block size="lg" icon="ticket" onClick={onGet}>{cta}</Button>
      <TextButton tone="muted" onClick={onLater}>다음에 받을게요</TextButton>
    </>}>
      <Badge tone="accent">{COUPON.eyebrow}</Badge>
      <Mascot pose="excited" size={104} base={BASE} />
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <h1 style={{ font: "var(--type-title-1)", color: "var(--text-heading)", ...WRAP, textWrap: "balance" }}>
          골목 축제에 오신 걸 환영해요
        </h1>
        <p style={{ font: "var(--type-body)", color: "var(--text-muted)", ...WRAP }}>
          참여 점포에서 쓸 수 있는 할인 쿠폰을 받아가세요
        </p>
      </div>

      <div style={{ width: "100%", background: "var(--surface-card)", borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)", padding: "var(--space-5)",
        display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <p style={{ textAlign: "center", font: "var(--type-display)", color: "var(--brand-primary)" }}>
          {COUPON.benefit}
        </p>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {COUPON.conditions.map(t => (
            <li key={t} style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start",
              font: "var(--type-body)", color: "var(--text-body)", ...WRAP }}>
              <span style={{ flex: "0 0 auto", marginTop: 2, display: "inline-flex" }}>
                <Icon name="check" size={18} color="var(--brand-primary)" />
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <p style={{ font: "var(--type-caption)", color: "var(--text-muted)", textAlign: "center", ...WRAP }}>
        {note}
      </p>
    </Frame>
  );
}

/* ── B안: 간편 가입 / 로그인 ─────────────────────────────────────────────────
   [쿠폰 받기] 다음에 선다. 가입을 마치면 곧바로 로그인된 상태가 되어 쿠폰이 발급된다
   (계정 하나당 한 장). 이미 가입한 사람은 [로그인]으로 바꿔 같은 계정으로 돌아온다. */
const ID_RULE = /^[a-z0-9]{4,12}$/;

function Auth({ onDone, onBack }) {
  const [mode, setMode] = React.useState("up");
  const [id, setId] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [err, setErr] = React.useState({});
  const up = mode === "up";

  const submit = e => {
    e.preventDefault();
    const next = {};
    if (!ID_RULE.test(id)) next.id = "영문 소문자와 숫자 4~12자로 입력해 주세요.";
    if (pw.length < 6) next.pw = "비밀번호는 6자 이상 입력해 주세요.";
    if (up && !next.pw && pw !== pw2) next.pw2 = "비밀번호가 서로 달라요.";
    if (!Object.keys(next).length) {
      if (up && !signUp(id, pw)) next.id = "이미 사용 중인 아이디예요.";
      if (!up && !logIn(id, pw)) next.pw = "아이디 또는 비밀번호가 맞지 않아요.";
    }
    setErr(next);
    if (!Object.keys(next).length) onDone(id);
  };

  return (
    <Frame footer={<TextButton tone="muted" onClick={onBack}>이전으로</TextButton>}>
      <Mascot pose="hello" size={88} base={BASE} />
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <h1 style={{ font: "var(--type-title-1)", color: "var(--text-heading)", ...WRAP }}>
          {up ? "간단 가입하고 쿠폰 받기" : "로그인하고 쿠폰 보기"}
        </h1>
        <p style={{ font: "var(--type-body)", color: "var(--text-muted)", ...WRAP }}>
          {up ? "아이디와 비밀번호만 정하면 바로 발급돼요. 계정 하나당 쿠폰은 1장이에요."
            : "가입한 아이디로 로그인하면 받은 쿠폰을 다시 볼 수 있어요."}
        </p>
      </div>
      <form onSubmit={submit} noValidate style={{ width: "100%", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <Input label="아이디" value={id} placeholder="영문 소문자·숫자 4~12자" error={err.id}
          autoComplete="username" autoCapitalize="none" onChange={e => setId(e.target.value.trim())} />
        <Input label="비밀번호" type="password" reveal value={pw} placeholder="6자 이상" error={err.pw}
          autoComplete={up ? "new-password" : "current-password"} onChange={e => setPw(e.target.value)} />
        {up ? (
          <Input label="비밀번호 확인" type="password" reveal value={pw2} error={err.pw2}
            autoComplete="new-password" onChange={e => setPw2(e.target.value)} />
        ) : null}
        <Button block size="lg" type="submit" style={{ marginTop: "var(--space-2)" }}>
          {up ? "가입하고 쿠폰 받기" : "로그인"}
        </Button>
      </form>
      <TextButton onClick={() => { setMode(up ? "in" : "up"); setErr({}); }}>
        {up ? "이미 가입했어요 · 로그인" : "처음이에요 · 가입하기"}
      </TextButton>
    </Frame>
  );
}

/* ── C2 쿠폰 ─────────────────────────────────────────────────────────────── */
function Ticket({ onConfirm }) {
  return (
    <Frame>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", textAlign: "center",
        font: "var(--type-title-3)", color: "var(--text-heading)", ...WRAP }}>
        <Icon name="store" size={20} />
        <span>계산할 때 이 화면을 상인분께 보여주세요</span>
      </div>

      <div style={{ width: "100%", background: "var(--surface-card)", borderRadius: "var(--radius-card)",
        border: "2px dashed var(--brand-primary)", boxShadow: "var(--shadow-raised)",
        padding: "var(--space-6) var(--space-5)", textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
        <Badge tone="brand">{COUPON.eyebrow}</Badge>
        <p style={{ font: "var(--type-title-3)", color: "var(--text-body)", marginTop: "var(--space-2)" }}>{COUPON.name}</p>
        <p style={{ font: "var(--type-display)", color: "var(--brand-primary)" }}>{COUPON.benefit}</p>
        <p style={{ font: "var(--type-caption)", color: "var(--text-muted)", ...WRAP }}>{COUPON.summary}</p>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
        <Button block size="lg" onClick={onConfirm}>확인하기 (상인 전용)</Button>
        <p style={{ font: "var(--type-caption)", color: "var(--text-muted)", textAlign: "center", ...WRAP }}>
          이 버튼은 계산할 때 상인분이 눌러주세요
        </p>
      </div>
    </Frame>
  );
}

/* ── C3 확인 완료 ────────────────────────────────────────────────────────── */
function Done({ onEnter }) {
  return (
    <Frame footer={<Button block variant="outline" onClick={onEnter}>주변 안내 보러 가기</Button>}>
      <Mascot pose="thumbsup" size={120} base={BASE} />
      <h1 style={{ font: "var(--type-title-1)", color: "var(--text-heading)", textAlign: "center", ...WRAP }}>
        쿠폰이 확인되었어요
      </h1>
      <p style={{ font: "var(--type-body)", color: "var(--text-muted)", textAlign: "center", ...WRAP }}>
        {COUPON.name} · {COUPON.benefit}
      </p>
    </Frame>
  );
}

/* 흐름 — onEnter 는 셸로 들어가는 길이다 (C1 의 [다음에 받을게요] · C3 의 [주변 안내 보러 가기]).
   `reset` 은 검수용 — 저장된 상태를 지우고 처음부터 연다 (?coupon=reset).
   `plan` 은 두 안 중 어느 쪽인가 (?plan=b) — A안은 가입 없이 바로 발급, B안은
   간편 가입(아이디·비밀번호) 후에만 발급이다. 기본은 A안. */
export function CouponFlow({ onEnter, reset = false, plan = "a" }) {
  const b = plan === "b";
  const [acct, setAcct] = React.useState(() => {
    if (reset) clearAll();
    return b ? get(SESSION) : null;
  });
  const [step, setStep] = React.useState(() => {
    if (reset) return "intro";
    const who = b ? get(SESSION) : null;
    /* 다시 찍은 사람은 받은 자리로 돌아온다 — 이미 받았는데 [쿠폰 받기]를 또 보여주면
       쿠폰이 한 장 더 나오는 화면처럼 읽힌다. B안에서는 로그인된 계정이 있을 때만 그렇다 */
    if (b && !who) return "intro";
    const saved = read(who);
    return saved === "used" ? "done" : saved === "issued" ? "ticket" : "intro";
  });

  const go = (next, store) => { if (store) write(store, acct); setStep(next); };

  /* 가입·로그인을 마친 계정의 상태로 이어간다 — 가입 직후는 발급, 기존 계정은 있던 자리 */
  const afterAuth = id => {
    setAcct(id);
    const saved = read(id);
    if (!saved) write("issued", id);
    setStep(saved === "used" ? "done" : "ticket");
  };

  if (step === "auth") return <Auth onDone={afterAuth} onBack={() => setStep("intro")} />;
  if (step === "ticket") return <Ticket onConfirm={() => go("done", "used")} />;
  if (step === "done") return <Done onEnter={onEnter} />;
  return b
    ? <Intro cta="쿠폰 받기" note="아이디와 비밀번호만으로 간단하게 가입해요" onGet={() => setStep("auth")} onLater={onEnter} />
    : <Intro cta="쿠폰 받기" note="가입 없이 바로 사용할 수 있어요" onGet={() => go("ticket", "issued")} onLater={onEnter} />;
}

export default CouponFlow;
