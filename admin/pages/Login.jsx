import React from "react";
import { Button, Input, Icon, Notice, Modal, Textarea } from "../../design-systems/admin.js";
import { SEED_ACCOUNTS, SUPER_ID, lockStatus, MAX_ATTEMPTS, LOCK_MINUTES }
  from "../data/account.js";
import { submitReset } from "../data/passwordResets.js";

/* M01 로그인 — 로그인, 비밀번호 초기화 요청.
 *
 * ── 데모 계정을 화면에 그대로 적는다 ────────────────────────────────────────
 * 서버가 없어 진짜 인증이 아니다. 검수하는 사람에게 계정을 따로 전달하면 그 쪽지가
 * 화면보다 먼저 사라지고, 그러면 이 화면 뒤를 아무도 못 본다. 감출 가치가 있는 비밀이
 * 아니라 검수용 열쇠이므로 안내 상자에 적어 두고, **이것이 임시라는 사실도 함께 적는다.**
 *
 * ── 계정이 둘이다 (2026-08-24) ─────────────────────────────────────────────
 * v1.1 에서 하나로 줄였던 것을 다시 둘로 둔다. 이번에는 **화면이 실제로 갈리기**
 * 때문이다 — `admin` 으로 들어오면 좌측 내비에 [계정 관리]가 있고 `yongin` 으로
 * 들어오면 없다. 한 벌만 적어 두면 그 차이를 검수할 방법이 없다.
 * (없앤 것은 `CITY`/`DEVELOPER` 등급이고, 업무 화면 아홉 개는 여전히 둘이 똑같다.)
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
 * 최종 관리자가 [계정 관리]에서 새 비밀번호를 넣어 주는 흐름이다. 계정 관리가
 * `admin` 전용이 된 뒤로 이 통로는 **담당자가 비밀번호를 바꾸는 유일한 길**이다.
 *
 * ── 그 요청이 이제 실제로 남는다 (2026-08-24, 사용자 요청) ─────────────────
 * 종전에는 [요청 보내기]가 "접수했습니다"를 띄우고 끝이었다 — 받는 자리가 없었다.
 * 이제 `submitReset()` 이 줄을 남기고, 계정 관리의 세 번째 탭이 그것을 받는다
 * (`data/passwordResets.js`). 화면이 접수했다고 말하면서 접수하지 않는 것은
 * 이 화면에서 가장 나쁜 종류의 거짓말이다.
 *
 * **아이디가 등록된 것인지 여기서 따지지 않는다.** 오타면 최종 관리자가 목록에서
 * 「등록되지 않은 아이디」 배지를 보고 거른다 — 로그인 화면이 "그런 아이디 없습니다"라고
 * 답하면 아이디가 있는지 없는지를 밖에서 물어볼 수 있는 창구가 된다.
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
  const [resetError, setResetError] = React.useState(null);

  const lock = lockStatus(id);

  const submit = e => {
    e.preventDefault();
    if (!id.trim() || !pw) { setError("아이디와 비밀번호를 입력해 주세요."); return; }
    setError(onSignIn(id, pw));
  };

  /* 아이디만 본다 — 사유는 비워도 보낸다. 필수로 두면 "비밀번호를 잊었다"를 사유 칸에
     한 번 더 적게 되고, 최종 관리자가 그 줄에서 새로 알게 되는 것이 없다 */
  const sendReset = () => {
    if (!id.trim()) { setResetError("아이디를 입력해 주세요."); return; }
    submitReset(id, resetNote);
    setResetError(null);
    setResetSent(true);
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
              /* 「약 n분」이 아니라 잠금 시간을 그대로 적는다 (2026-08-24, 사용자 요청).
                 남은 시간을 분 단위로 올림해 보여주면 새로고침마다 숫자가 바뀌는데,
                 그 숫자로 담당자가 하는 일은 달라지지 않는다 — 기다리는 것뿐이다 */
              <Notice tone="danger" size="sm">
                로그인 시도를 {MAX_ATTEMPTS}회 실패했습니다. {LOCK_MINUTES}분 뒤에 다시 시도할 수 있습니다.
              </Notice>
            ) : null}

            <Button variant="primary" size="lg" block type="submit" disabled={lock.locked}>로그인</Button>

            <button type="button"
              onClick={() => { setReset(true); setResetSent(false); setResetError(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "var(--space-2) 0",
                fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)", color: "var(--text-link)",
                textDecoration: "underline", textUnderlineOffset: 3 }}>
              비밀번호를 잊으셨나요?
            </button>
          </div>
        </form>

        {/* 세션 시간을 적던 자리다 (2026-08-24 — 시간 제한을 없앴다. account.js 머리말).
            남은 것은 담당자가 실제로 겪을 수 있는 것 하나다 */}
        <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-caption)",
          color: "var(--text-muted)", lineHeight: 1.6 }}>
          로그인하면 브라우저 탭을 닫을 때까지 유지됩니다. {MAX_ATTEMPTS}회 실패하면 {LOCK_MINUTES}분간 잠깁니다.
        </p>

        {/* 검수용 안내. 실서비스에서는 이 상자를 통째로 지운다 —
             config.js 의 TODAY 나 ?district=none 과 같은 성격의 검수 장치다 */}
        <Notice tone="neutral" size="sm" title="검수용 계정" style={{ marginTop: "var(--space-4)" }}>
          {SEED_ACCOUNTS.map(a => (
            <span key={a.id} style={{ display: "block", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
              <b>{a.name}</b> — {a.id} / {a.pw}
              {/* 어느 쪽으로 들어와야 계정 관리가 보이는지를 여기서 적는다.
                  둘의 차이가 그 한 화면뿐이라 적어두지 않으면 검수하는 사람이
                  「내비가 계정마다 다르다」를 결함으로 적게 된다 */}
              {a.id === SUPER_ID ? (
                <span style={{ color: "var(--text-muted)" }}> · [계정 관리] 화면은 이 계정에만 보입니다</span>
              ) : null}
            </span>
          ))}
          <span style={{ display: "block", marginTop: "var(--space-2)" }}>
            서버 연동 전이라 화면 안에서만 확인하는 임시 계정입니다.
            나머지 아홉 화면은 두 계정이 똑같이 씁니다.
            계정을 더 만들려면 최종 관리자로 들어간 뒤 [계정 관리]에서 등록합니다.
          </span>
        </Notice>
      </div>

      {/* ── 비밀번호 초기화 요청 (M01) ──────────────────────────────────── */}
      <Modal open={reset} size="md" title="비밀번호 초기화 요청"
        description={resetSent ? undefined : "최종 관리자에게 초기화를 요청합니다."}
        onClose={() => setReset(false)}
        footer={resetSent ? (
          <Button variant="primary" onClick={() => setReset(false)}>닫기</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setReset(false)}>취소</Button>
            <Button variant="primary" onClick={sendReset}>요청 보내기</Button>
          </>
        )}>
        {resetSent ? (
          <>
            <p style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.65 }}>
              <b>{id.trim()}</b> 계정의 초기화 요청을 접수했습니다.
              최종 관리자가 확인한 뒤 새 비밀번호를 알려 드립니다.
            </p>
            <Notice tone="neutral" size="sm" style={{ marginTop: "var(--space-4)" }}>
              서버 연동 전이라 메일이나 문자로 전달되지는 않습니다. 요청은 최종 관리자의
              [계정 관리] 화면 &gt; [비밀번호 초기화 요청] 탭에 쌓이며,
              같은 브라우저 탭 안에서만 유지됩니다.
            </Notice>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Input label="아이디" value={id}
              onChange={e => { setId(e.target.value); setResetError(null); }}
              placeholder="초기화할 계정의 아이디"
              error={resetError || undefined}
              hint="이 아이디로 등록된 이메일이나 연락처로 최종 관리자가 연락합니다." />
            <Textarea label="사유" value={resetNote} rows={3} maxLength={200}
              onChange={e => setResetNote(e.target.value)}
              placeholder="예) 인사이동으로 인수인계 받았습니다."
              hint="적지 않아도 보낼 수 있습니다. 자동 재설정을 만들지 않은 이유는 계정이 몇 명뿐이기 때문입니다 — 사람이 확인하는 편이 빠르고 안전합니다." />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Login;
