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
  festivalId: "ft-dongbaekium",   /* 동백이음길 가을마실 축제 (11.7) — 이 쿠폰이 걸린 축제 — 축제 상세(S09)의 [쿠폰] 버튼이 이 축제에서만 선다 */
  eyebrow: "11월 7일 단 하루!",
  name: "축제 할인 쿠폰",
  /* 축제 상세의 쿠폰 칸(detail/CouponCard.jsx) 두 줄 — 한 줄씩 */
  lead: "축제 방문객을 위한 특별 혜택",
  voucher: "1,000원 할인권",
  benefit: "1,000원 할인",
  /* 카드 한 줄 요약 — C2 쿠폰 카드에 들어간다 */
  summary: "2만 원 이상 결제 시, 11.7(토) 당일 한정",
  conditions: [
    "2만 원 이상 결제 시 사용 가능",
    "11월 7일(토) 축제 당일에만 사용 가능",
    "참여 가게에서만 사용 가능",
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

/* ── 축제 상세(S09)와 팝업(FestivalCoupon)을 잇는 작은 규약 (2026-10-19) ───────────
   상세의 우측 상단 [쿠폰]이 `openCoupon()` 을 부르면 팝업 쪽이 열리고, 상태가 바뀔 때마다
   `COUPON_CHANGE` 가 울려 상세가 단추 글자를 다시 읽는다. 둘 사이에 props 를 놓지 않는 이유는
   팝업이 셸 밖(App)에 서 있기 때문이다 — 셸을 다시 세우지 않는다(U-CM-16). */
export const COUPON_OPEN = "yongin:coupon-open";
export const COUPON_CHANGE = "yongin:coupon-change";
export const couponState = () => { const v = read(null); return v === "used" ? "used" : v === "issued" ? "issued" : "none"; };
export const openCoupon = () => window.dispatchEvent(new Event(COUPON_OPEN));
/* 받기 — 쿠폰 칸의 다운로드 아이콘이 부른다. 발급만 하고 화면은 열지 않는다(칸이 「받음」으로 바뀐다) */
export const issueCoupon = () => { if (couponState() === "none") { write("issued"); window.dispatchEvent(new Event(COUPON_CHANGE)); } };
/* 사용 일시 — 상인 확인으로 사용 처리한 시각(ISO). 완료 화면이 적는다 */
const USED_AT = `${KEY}.usedAt`;
export const couponUsedAt = () => get(USED_AT);

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
  put(ACCOUNTS, null); put(SESSION, null); write(null); put(USED_AT, null);
}

const BASE = "../../design-systems/";
const WRAP = { wordBreak: "keep-all", overflowWrap: "anywhere" };

/* 세 화면의 겉틀 — 앱바 + 세로 스크롤 본문 + 바닥에 붙는 단추 자리 */
function Frame({ children, footer, onClose }) {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "var(--screen-max)", height: "100%",
      margin: "0 auto", overflow: "hidden", background: "var(--surface-page)",
      display: "flex", flexDirection: "column" }}>
      {/* onClose 를 주면 **오른쪽 위**에 [X] 가 선다 — 받은 쿠폰 화면에서 셸로 나가는 길 (2026-10-19, 사용자 요청) */}
      <AppBar title="용인시 위치안내" style={{ flex: "0 0 auto" }}
        actions={onClose ? (
          <button type="button" onClick={onClose} aria-label="닫기" title="닫기"
            style={{ width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", color: "inherit", cursor: "pointer" }}>
            <Icon name="x" size={24} />
          </button>
        ) : null} />
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
          참여 가게에서 쓸 수 있는 할인 쿠폰을 받아가세요
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
function Ticket({ onConfirm, onClose }) {
  return (
    <Frame onClose={onClose}>
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
        <Button block size="lg" onClick={onConfirm}>상인 확인</Button>
        {/* 붉고 굵게 (2026-10-19, 사용자 요청) — 손님이 눌러 버리면 쿠폰이 쓰인 것으로 남는다 */}
        <p style={{ font: "var(--type-label)", fontWeight: "var(--fw-bold)", color: "var(--yong-red-800)",
          textAlign: "center", ...WRAP }}>
          ※ 상인 전용 버튼입니다. 버튼을 누르면 쿠폰 사용이 완료되어 재사용할 수 없으니, 결제 시에만 눌러 주세요.
        </p>
      </div>
    </Frame>
  );
}

/* ── C3 확인 완료 ────────────────────────────────────────────────────────── */
/* 하단 버튼은 상세 화면의 것과 같다 (2026-10-19, 사용자 요청 — 버튼 통일): primary · store 아이콘 · 「상점가 둘러보기」 */
function Done({ onEnter }) {
  return (
    <Frame footer={<Button variant="primary" size="lg" icon="store" block onClick={onEnter}>상점가 둘러보기</Button>}>
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

/* ── 축제 쿠폰 층 (2026-10-19, 사용자 요청) ─────────────────────────────────────
   축제 QR 로 들어와도 **팝업이 뜨지 않는다.** 쿠폰은 축제 상세 본문의 「쿠폰」 칸(detail/CouponCard.jsx)에서 받고,
   그 칸이 `openCoupon()` 을 부르면 여기서 전체화면 층이 열린다: 받기 전이면 곧바로 발급하고 상인에게 보이는 쿠폰(C2),
   받은 뒤면 같은 쿠폰 화면, 쓴 뒤면 확인 완료(C3). A안이다(가입 없이 발급). 셸은 이 아래에서 그대로 서 있다(U-CM-16).
   저장은 위 localStorage 이다. 지우려면 `?qr=qr-004&popup=reset` 으로 연다. */
/* `fixed` 가 아니라 `absolute` 다 — 데스크톱 검수 틀(#root 390×844)을 벗어나 브라우저 창 전체를 덮지 않는다.
   그래서 #root 가 위치 기준이어야 한다(index.html 의 `#root { position: relative }`). 휴대폰에서는 둘이 같다. */
const LAYER = { position: "absolute", inset: 0, zIndex: "var(--z-modal)" };

/* 전체화면 층 — 상인에게 보여주는 C2 · C3 가 셸 위에 덮인다 */
function Layer({ children }) {
  return <div style={LAYER}>{children}</div>;
}

/* 쿠폰 사용 흐름 (2026-10-19, 사용자 요청) — 축제 상세의 쿠폰 칸(CouponCard)에서 시작한다.
     받기(칸의 ⤓) → 받음 → 칸을 누르면 [바텀시트: 쿠폰 설명 + 「쿠폰 사용하기」]
     → [직원 확인 화면: 다른 바탕색, 「직원에게 이 화면을 보여주세요」 + 「사용 확인」]
     → [확인 팝업: 「되돌릴 수 없어요」] → 사용 처리 → [완료 화면: 사용 일시]
   직원 확인 화면에서 뒤로 가면 아직 쓴 것이 아니라서 쿠폰은 **미사용 그대로**다. 사용 처리는 확인 팝업을 지난 뒤에만 한다.
   완료 화면에는 사용 일시가 초 단위까지 적힌다. */
const pad = n => String(n).padStart(2, "0");
const clock = d => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const stamp = d => `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${clock(d)}`;

const Dim = ({ onClick, children, align = "flex-end" }) => (
  <div style={{ ...LAYER, display: "flex", alignItems: align, justifyContent: "center" }}>
    <div onClick={onClick} style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.55)" }} />
    {children}
  </div>
);

/* 받은 쿠폰의 바텀시트 — 설명과 [쿠폰 사용하기]. 바깥을 누르거나 [닫기]로 내린다 */
function UseSheet({ onUse, onClose }) {
  React.useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <Dim onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={COUPON.name}
        style={{ position: "relative", width: "100%", maxWidth: "var(--screen-max)", maxHeight: "88%", overflowY: "auto",
          background: "var(--surface-card)", borderRadius: "var(--radius-card) var(--radius-card) 0 0",
          padding: "var(--space-5) var(--gutter-screen) var(--space-5)", boxShadow: "var(--shadow-raised)",
          display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <span aria-hidden="true" style={{ alignSelf: "center", width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)" }} />
        <Badge tone="accent" style={{ alignSelf: "flex-start" }}>{COUPON.eyebrow}</Badge>
        <div>
          <h2 style={{ font: "var(--type-title-2)", color: "var(--text-heading)", ...WRAP }}>{COUPON.name}</h2>
          <p style={{ marginTop: 2, font: "var(--type-title-1)", color: "var(--brand-primary)" }}>{COUPON.benefit}</p>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {COUPON.conditions.map(t => (
            <li key={t} style={{ display: "flex", gap: 6, alignItems: "flex-start", font: "var(--type-body)", color: "var(--text-body)", ...WRAP }}>
              <span style={{ flex: "0 0 auto", marginTop: 2, display: "inline-flex" }}><Icon name="check" size={18} color="var(--brand-primary)" /></span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <Button block size="lg" icon="ticket" onClick={onUse}>쿠폰 사용하기</Button>
        <p style={{ font: "var(--type-caption)", color: "var(--text-muted)", textAlign: "center", ...WRAP }}>
          매장에서 결제할 때 눌러주세요
        </p>
        <TextButton tone="muted" onClick={onClose} style={{ alignSelf: "center" }}>닫기</TextButton>
      </div>
    </Dim>
  );
}

/* 직원 확인 화면 — 앱 바탕색과 다른 짙은 바탕이라 손님 화면이 아니라는 것이 한눈에 읽힌다. 뒤로 가면 미사용 */
function StaffScreen({ onConfirm, onBack }) {
  const [ask, setAsk] = React.useState(false);
  React.useEffect(() => {
    const onKey = e => { if (e.key === "Escape") { if (ask) setAsk(false); else onBack(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ask, onBack]);
  return (
    <div style={{ ...LAYER, display: "flex", justifyContent: "center", background: "var(--surface-dark)", color: "#fff" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: "var(--screen-max)", height: "100%",
        display: "flex", flexDirection: "column" }}>
        <header style={{ flex: "0 0 auto", minHeight: "var(--appbar-h)", padding: "6px var(--space-2)", display: "flex", alignItems: "center" }}>
          <button type="button" onClick={onBack} aria-label="뒤로" data-back
            style={{ width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
            <Icon name="chevron-left" size={24} />
          </button>
        </header>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "var(--space-4) var(--gutter-screen)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-5)", textAlign: "center" }}>
          <h1 style={{ font: "var(--type-title-3)", color: "#fff", ...WRAP }}>직원에게 해당 화면을 보여주세요</h1>
          <div style={{ width: "100%", background: "var(--surface-card)", color: "var(--text-body)", borderRadius: "var(--radius-card)",
            padding: "var(--space-6) var(--space-5)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
            <Badge tone="brand">{COUPON.eyebrow}</Badge>
            <p style={{ font: "var(--type-title-3)", marginTop: "var(--space-2)" }}>{COUPON.name}</p>
            <p style={{ font: "var(--type-display)", color: "var(--brand-primary)" }}>{COUPON.benefit}</p>
            <p style={{ font: "var(--type-caption)", color: "var(--text-muted)", ...WRAP }}>{COUPON.summary}</p>
          </div>
        </div>
        <div style={{ flex: "0 0 auto", padding: "var(--space-3) var(--gutter-screen) var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <Button block size="lg" variant="mint" onClick={() => setAsk(true)}>사용 확인</Button>
          <p style={{ font: "var(--type-label)", fontWeight: "var(--fw-bold)", color: "#ffb4b4", textAlign: "center", ...WRAP }}>
            ※ 직원 전용 기능입니다. 직원 외에는 조작하지 마세요.
          </p>
        </div>
        {ask ? (
          <Dim onClick={() => setAsk(false)} align="center">
            <div role="alertdialog" aria-modal="true" aria-label="쿠폰을 사용 처리할까요?"
              style={{ position: "relative", width: "calc(100% - 2 * var(--gutter-screen))", maxWidth: 320, background: "var(--surface-card)",
                color: "var(--text-body)", borderRadius: "var(--radius-card)", padding: "var(--space-5)", boxShadow: "var(--shadow-raised)",
                display: "flex", flexDirection: "column", gap: "var(--space-3)", textAlign: "center" }}>
              <h2 style={{ font: "var(--type-title-3)", color: "var(--text-heading)", ...WRAP }}>쿠폰을 사용 처리할까요?</h2>
              <p style={{ font: "var(--type-body)", color: "var(--text-muted)", ...WRAP }}>
                사용 확인 시 쿠폰이 사용 처리되며,<br />다시 사용할 수 없습니다.
              </p>
              <p style={{ font: "var(--type-caption)", fontWeight: "var(--fw-semibold)", color: "var(--yong-red-800)", ...WRAP }}>
                *실제 거래가 완료되었는지 확인해주세요
              </p>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <Button block variant="outline" onClick={() => setAsk(false)}>취소</Button>
                <Button block onClick={onConfirm}>사용처리</Button>
              </div>
            </div>
          </Dim>
        ) : null}
      </div>
    </div>
  );
}

/* 사용 완료 화면 — 사용 일시(초 단위까지)가 적힌다. 흐르는 현재 시각은 두지 않는다(사용자 요청) */
function UsedScreen({ usedAt, onClose }) {
  const at = usedAt ? new Date(usedAt) : null;
  return (
    <Layer>
      <Frame onClose={onClose} footer={<Button variant="primary" size="lg" block onClick={onClose}>닫기</Button>}>
        <Mascot pose="thumbsup" size={112} base={BASE} />
        <h1 style={{ font: "var(--type-title-1)", color: "var(--text-heading)", textAlign: "center", ...WRAP }}>쿠폰 사용이 완료됐어요</h1>
        <p style={{ font: "var(--type-body)", color: "var(--text-muted)", textAlign: "center", ...WRAP }}>{COUPON.name} · {COUPON.benefit}</p>
        <div style={{ width: "100%", background: "var(--surface-card)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)",
          padding: "var(--space-5)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
          <span style={{ font: "var(--type-caption)", color: "var(--text-muted)" }}>사용 일시</span>
          <span style={{ font: "var(--type-title-2)", color: "var(--text-heading)", fontVariantNumeric: "tabular-nums" }}>{at ? stamp(at) : "-"}</span>
        </div>
      </Frame>
    </Layer>
  );
}

export function FestivalCoupon() {
  /* ?popup=reset — 저장된 상태(받음 · 사용)를 지우고 처음부터 연다 (검수용) */
  React.useState(() => {
    try { if (new URLSearchParams(location.search).get("popup") === "reset") clearAll(); } catch { /* 주소를 못 읽는 환경 */ }
    return 0;
  });
  const [step, setStep] = React.useState("closed");   /* closed | sheet | staff | used */

  /* 쿠폰 칸이 부른다 — 받은 쿠폰이면 바텀시트, 쓴 쿠폰이면 완료 화면 (받기는 칸이 issueCoupon 으로 직접 한다) */
  React.useEffect(() => {
    const open = () => { const st = couponState(); if (st === "issued") setStep("sheet"); else if (st === "used") setStep("used"); };
    window.addEventListener(COUPON_OPEN, open);
    return () => window.removeEventListener(COUPON_OPEN, open);
  }, []);
  React.useEffect(() => { window.dispatchEvent(new Event(COUPON_CHANGE)); }, [step]);

  const close = () => setStep("closed");
  if (step === "sheet") return <UseSheet onUse={() => setStep("staff")} onClose={close} />;
  /* 뒤로(onBack)는 쿠폰을 건드리지 않는다 — 미사용 그대로. 사용 처리는 확인 팝업의 [사용 확인] 뒤에만 */
  if (step === "staff") {
    return <StaffScreen onBack={close} onConfirm={() => { write("used"); put(USED_AT, new Date().toISOString()); setStep("used"); }} />;
  }
  /* 완료 화면 — [닫기]만 있다(2026-10-19, 사용자 요청). 닫으면 아래의 축제 상세가 그대로 보인다 */
  if (step === "used") {
    return <UsedScreen usedAt={couponUsedAt()} onClose={close} />;
  }
  return null;
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
  if (step === "ticket") return <Ticket onConfirm={() => go("done", "used")} onClose={onEnter} />;
  if (step === "done") return <Done onEnter={onEnter} />;
  return b
    ? <Intro cta="쿠폰 받기" note="아이디와 비밀번호만으로 간단하게 가입해요" onGet={() => setStep("auth")} onLater={onEnter} />
    : <Intro cta="쿠폰 받기" note="가입 없이 바로 사용할 수 있어요" onGet={() => go("ticket", "issued")} onLater={onEnter} />;
}

export default CouponFlow;
