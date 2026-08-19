import React from "react";
import { Button, Input, Icon, Notice } from "../../design-systems/admin.js";
import { ACCOUNTS, ROLES } from "../data/account.js";

/* A-AC-01 로그인.
 *
 * ── 데모 계정을 화면에 그대로 적는다 ────────────────────────────────────────
 * 서버가 없어 진짜 인증이 아니다. 검수하는 사람에게 계정을 따로 전달하면 그 쪽지가
 * 화면보다 먼저 사라지고, 그러면 이 화면 뒤를 아무도 못 본다. 감출 가치가 있는 비밀이
 * 아니라 검수용 열쇠이므로 안내 상자에 적어 두고, **이것이 임시라는 사실도 함께 적는다.**
 *
 * ── 두 계정을 나란히 적는 이유 ──────────────────────────────────────────────
 * A-AC-01 의 요구는 "권한 분리"인데, 계정이 하나면 그것이 화면에서 보이지 않는다.
 * 두 계정으로 각각 들어가 보면 좌측 메뉴가 7개와 5개로 갈리는 것이 바로 확인된다.
 *
 * ── 조아용을 쓰지 않는다 ────────────────────────────────────────────────────
 * 캐릭터는 시민을 맞이하는 자리의 것이다 (디자인 시스템 7번 규칙). 업무 화면의 로그인은
 * 맞이하는 자리가 아니라 시작하는 자리다.
 */
export function Login({ onSignIn }) {
  const [id, setId] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [error, setError] = React.useState(null);

  const submit = e => {
    e.preventDefault();
    if (!id.trim() || !pw) { setError("아이디와 비밀번호를 입력해 주세요."); return; }
    setError(onSignIn(id, pw));
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "var(--space-7)", background: "var(--surface-page)" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--brand-primary)" }}>
            <Icon name="qr-code" size={22} color="var(--text-on-brand)" />
          </span>
          <div>
            <h1 style={{ font: "var(--type-title-2)", color: "var(--text-heading)", letterSpacing: "var(--ls-snug)" }}>
              용인시 QR 위치안내
            </h1>
            <p style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>관리자 웹</p>
          </div>
        </div>

        <form onSubmit={submit}
          style={{ padding: "var(--space-6)", background: "var(--surface-card)",
            border: "var(--stroke-hairline) solid var(--border-default)",
            borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-card)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Input label="아이디" value={id} onChange={e => { setId(e.target.value); setError(null); }}
              placeholder="아이디" autoComplete="username" />
            <Input label="비밀번호" type="password" value={pw}
              onChange={e => { setPw(e.target.value); setError(null); }}
              placeholder="비밀번호" autoComplete="current-password"
              error={error || undefined} />
            <Button variant="primary" size="lg" block type="submit">로그인</Button>
          </div>
        </form>

        {/* 검수용 안내. 실서비스에서는 이 상자를 통째로 지운다 —
             config.js 의 TODAY 나 ?district=none 과 같은 성격의 검수 장치다 */}
        <Notice tone="neutral" size="sm" title="검수용 계정" style={{ marginTop: "var(--space-4)" }}>
          {ACCOUNTS.map(a => (
            <span key={a.id} style={{ display: "block", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
              <b>{ROLES[a.role].label}</b> — {a.id} / {a.pw}
            </span>
          ))}
          <span style={{ display: "block", marginTop: "var(--space-2)" }}>
            서버 연동 전이라 화면 안에서만 확인하는 임시 계정입니다. 두 계정의 좌측 메뉴가 다릅니다.
          </span>
        </Notice>
      </div>
    </div>
  );
}

export default Login;
