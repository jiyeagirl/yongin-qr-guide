import React from "react";
import { Button, Input, Icon, Notice, Modal, Textarea } from "../../design-systems/admin.js";
import { SEED_ACCOUNTS, lockStatus, MAX_ATTEMPTS, LOCK_MINUTES, SESSION_HOURS }
  from "../data/account.js";

/* M01 로그인 — 로그인, 비밀번호 초기화 요청.
 *
 * ── 데모 계정을 화면에 그대로 적는다 ────────────────────────────────────────
 * 서버가 없어 진짜 인증이 아니다. 검수하는 사람에게 계정을 따로 전달하면 그 쪽지가
 * 화면보다 먼저 사라지고, 그러면 이 화면 뒤를 아무도 못 본다. 감출 가치가 있는 비밀이
 * 아니라 검수용 열쇠이므로 안내 상자에 적어 두고, **이것이 임시라는 사실도 함께 적는다.**
 *
 * ── 계정이 하나다 (2026-08-20) ─────────────────────────────────────────────
 * 전에는 권한이 다른 두 계정(시청 담당자 · 개발자)을 나란히 적었다. 권한 구분을
 * 없애면서 검수용 계정도 하나가 됐다 — 화면이 계정에 따라 달라지지 않으므로
 * 두 벌을 두면 "이 계정으로는 무엇이 다른가"를 확인하는 데 시간만 쓴다.
 *
 * ── 잠금을 화면에 적는다 ────────────────────────────────────────────────────
 * 명세서 9장: "로그인 5회 실패 시 10분 잠금". 잠긴 뒤에야 그 사실을 알려주면 담당자는
 * 비밀번호를 계속 의심한다. 실패할 때마다 **몇 번 남았는지**를 적고, 잠기면 몇 분 뒤에
 * 풀리는지를 적는다. (실서비스에서는 이 판정이 서버에 있어야 한다 — 브라우저 저장소를
 * 지우면 풀리는 잠금은 공격자를 막지 못한다. 여기서 확인하는 것은 화면의 반응이다.)
 *
 * ── 비밀번호 초기화가 "요청"인 이유 ─────────────────────────────────────────
 * 메일로 재설정 링크를 보내려면 서버가 필요하고, 계정이 시청·운영사 몇 명뿐이라
 * 자동 재설정을 만들 만한 규모가 아니다. 그래서 "비밀번호 초기화 **요청**"이고 —
 * 다른 계정을 가진 담당자가 [계정 관리]에서 새 비밀번호를 넣어 주는 흐름이다.
 *
 * ── 조아용을 쓰지 않는다 ────────────────────────────────────────────────────
 * 캐릭터는 시민을 맞이하는 자리의 것이다 (디자인 시스템 7번 규칙). 업무 화면의 로그인은
 * 맞이하는 자리가 아니라 시작하는 자리다.
 */
export function Login({ onSignIn }) {
  const [id, setId] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [error, setError] = React.useState(null);
  const [reset, setReset] = React.useState(false);
  const [resetSent, setResetSent] = React.useState(false);
  const [resetNote, setResetNote] = React.useState("");

  const lock = lockStatus(id);

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
            <p style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>관리자 페이지</p>
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

            {lock.locked ? (
              <Notice tone="danger" size="sm">
                로그인 시도가 {MAX_ATTEMPTS}회 실패해 잠겼습니다. 약 {lock.left}분 뒤에 다시 시도할 수 있습니다.
              </Notice>
            ) : null}

            <Button variant="primary" size="lg" block type="submit" disabled={lock.locked}>로그인</Button>

            <button type="button" onClick={() => { setReset(true); setResetSent(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "var(--space-2) 0",
                fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)", color: "var(--text-link)",
                textDecoration: "underline", textUnderlineOffset: 3 }}>
              비밀번호를 잊으셨나요?
            </button>
          </div>
        </form>

        <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-caption)",
          color: "var(--text-muted)", lineHeight: 1.6 }}>
          로그인 후 세션은 {SESSION_HOURS}시간 유지됩니다. {MAX_ATTEMPTS}회 실패하면 {LOCK_MINUTES}분간 잠깁니다.
        </p>

        {/* 검수용 안내. 실서비스에서는 이 상자를 통째로 지운다 —
             config.js 의 TODAY 나 ?district=none 과 같은 성격의 검수 장치다 */}
        <Notice tone="neutral" size="sm" title="검수용 계정" style={{ marginTop: "var(--space-4)" }}>
          {SEED_ACCOUNTS.map(a => (
            <span key={a.id} style={{ display: "block", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
              <b>{a.name}</b> — {a.id} / {a.pw}
            </span>
          ))}
          <span style={{ display: "block", marginTop: "var(--space-2)" }}>
            서버 연동 전이라 화면 안에서만 확인하는 임시 계정입니다.
            계정을 더 만들려면 들어간 뒤 [계정 관리]에서 등록합니다.
          </span>
        </Notice>
      </div>

      {/* ── 비밀번호 초기화 요청 (M01) ──────────────────────────────────── */}
      <Modal open={reset} size="md" title="비밀번호 초기화 요청"
        description={resetSent ? undefined : "다른 계정을 가진 담당자에게 초기화를 요청합니다."}
        onClose={() => setReset(false)}
        footer={resetSent ? (
          <Button variant="primary" onClick={() => setReset(false)}>닫기</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setReset(false)}>취소</Button>
            <Button variant="primary" onClick={() => setResetSent(true)}>요청 보내기</Button>
          </>
        )}>
        {resetSent ? (
          <>
            <p style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.65 }}>
              요청을 접수했습니다. 담당자가 확인한 뒤 새 비밀번호를 알려 드립니다.
            </p>
            <Notice tone="neutral" size="sm" style={{ marginTop: "var(--space-4)" }}>
              서버 연동 전이라 실제로 전달되지는 않습니다. 지금은 [계정 관리] 화면에서
              다른 계정이 비밀번호를 직접 바꿔 주는 흐름입니다.
            </Notice>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Input label="아이디" value={id} onChange={e => setId(e.target.value)}
              placeholder="초기화할 계정의 아이디"
              hint="이 아이디로 등록된 이메일로 담당자가 연락합니다." />
            <Textarea label="사유" value={resetNote} rows={3} maxLength={200}
              onChange={e => setResetNote(e.target.value)}
              placeholder="예) 인사이동으로 인수인계 받았습니다."
              hint="자동 재설정을 만들지 않은 이유는 계정이 몇 명뿐이기 때문입니다 — 사람이 확인하는 편이 빠르고 안전합니다." />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Login;
