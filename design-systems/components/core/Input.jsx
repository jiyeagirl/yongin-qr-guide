import React from "react";
import { VisuallyHidden } from "./VisuallyHidden.jsx";
import { Icon } from "./Icon.jsx";

/* 크기 두 벌.
 *
 * md(기본) 는 손가락으로 누르는 화면의 값이다 — 높이 44px(--tap-min, U-CM-13)와
 * 16px 글자(iOS Safari 가 그 아래에서 자동 확대한다).
 *
 * sm(36px · 14px) 은 **관리자 표 안에서만** 쓴다 (2026-08-20). 표의 한 칸에 md 입력칸을
 * 넣으면 그 행만 20px 높아져, 고치는 중일 때와 아닐 때 표가 다른 표처럼 보인다. 44px 하한은
 * 손가락 기준이고 관리자는 마우스를 쓰는 데스크톱 전용 화면이라(--admin-min 1024px)
 * 그 근거가 성립하지 않는다 — Button 의 sm(40px) 과 같은 성격의 예외다.
 * **시민용 화면에서는 쓰지 않는다.** */
const SIZES = {
  md: { minHeight: "var(--tap-min)", padding: "8px 12px", fontSize: 16 },
  sm: { minHeight: 36, padding: "5px 10px", fontSize: "var(--fs-label)" },
};

/* ── 비밀번호를 눈으로 확인하는 길 (`reveal`, 2026-08-24) ────────────────────
   `type="password"` 는 값을 까만 동그라미로 가린다. 가리는 것이 기본인 이유는 어깨 너머로
   읽히지 않기 위해서인데, **관리자가 남의 계정에 새 비밀번호를 넣어 주는 자리**에서는
   그 가림이 오히려 문제가 된다 — 넣은 값을 전화로 불러 줘야 하고, 오타가 나도 알 수 없다.

   그래서 `reveal` 을 켜면 칸 오른쪽에 눈 단추가 선다. **기본은 꺼져 있다** — 로그인 칸처럼
   자기 비밀번호를 넣는 자리에는 필요 없는 단추이고, 켜고 끄는 판단은 화면의 것이다.

   `type="password"` 일 때만 뜬다. 다른 칸에 눈이 붙으면 무엇을 감추고 있었다는 말이 된다. */
export function Input({ label, hint, error, required, icon, value, onChange, placeholder, type = "text", size = "md", disabled, clearable = false, onClear, reveal = false, elevated = false, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const canReveal = reveal && type === "password" && !disabled;
  /* 켜면 실제로 글자가 되어야 한다 — 점을 지우는 흉내가 아니라 type 을 바꾼다.
     그래야 브라우저의 글자 선택·복사가 그대로 동작한다 (전화로 불러 주는 자리다) */
  const inputType = canReveal && shown ? "text" : type;
  const s = SIZES[size] || SIZES.md;
  const borderColor = error ? "var(--state-danger)" : focus ? "var(--brand-secondary)" : "var(--border-strong)";
  /* elevated: 지도 위에 떠 있을 때. 그림자는 바깥 label 이 아니라 실제 테두리를 가진 안쪽 상자에 준다 */
  const shadow = focus ? "var(--shadow-focus)" : elevated ? "var(--shadow-raised)" : "none";
  const showClear = clearable && !disabled && value != null && String(value).length > 0;
  return (
    <label style={{ display: "block", ...style }}>
      {label ? <span style={{ display: "block", fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)", marginBottom: 6 }}>
          {label}
          {required ? <span aria-hidden="true" style={{ color: "var(--state-danger)", marginLeft: 3 }}>*</span> : null}
          {required ? <VisuallyHidden>필수</VisuallyHidden> : null}
        </span> : null}
      {/* 시민용(md)에서 높이는 tap-min(44px) 까지만 줄인다. 입력창은 그 자체가 터치 타겟이라
          여기서 더 낮추면 접근성 규칙(U-CM-13)을 깨는 것이지 디자인이 아니다.
          시각적 부피는 좌우 여백과 아이콘 크기로 덜어낸다. sm 은 위 SIZES 주석 참조 */}
      <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minHeight: s.minHeight, padding: s.padding,
        background: disabled ? "var(--surface-sunken)" : "var(--surface-card)", border: `var(--stroke-hairline) solid ${borderColor}`,
        borderRadius: "var(--radius-control)", boxShadow: shadow, transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)" }}>
        {icon ? <Icon name={icon} size={18} color="var(--yong-ink-300)" /> : null}
        {/* md 의 16px 는 iOS Safari 의 자동 확대를 막는다 (sm 은 데스크톱 전용이라 해당 없음) */}
        <input type={inputType} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} required={required} aria-invalid={error ? "true" : undefined}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: s.fontSize, color: "var(--text-heading)", letterSpacing: "var(--ls-normal)" }} {...rest} />
        {/* 지우기 — 44px 최소 타겟을 지키되 입력창 높이를 늘리지 않도록 음수 마진으로 상쇄한다 */}
        {showClear ? (
          <button type="button" onClick={onClear} aria-label="입력 지우기"
            style={{ flex: "0 0 auto", width: "var(--tap-min)", height: "var(--tap-min)", margin: "-8px -8px -8px 0",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <Icon name="circle-x" size={18} />
          </button>
        ) : null}
        {/* 눈 — 지우기 단추와 같은 규격이다 (44px 타겟을 음수 마진으로 상쇄해 칸 높이를
            늘리지 않는다). `aria-pressed` 로 지금 켜져 있는지를 함께 알린다.
            `<label>` 안이지만 단추는 상호작용 요소라 라벨 클릭이 칸으로 넘어가지 않는다 */}
        {canReveal ? (
          <button type="button" onClick={() => setShown(v => !v)} aria-pressed={shown}
            aria-label={shown ? "비밀번호 가리기" : "비밀번호 보기"}
            style={{ flex: "0 0 auto", width: "var(--tap-min)", height: "var(--tap-min)", margin: "-8px -8px -8px 0",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", cursor: "pointer",
              color: shown ? "var(--brand-secondary)" : "var(--text-muted)" }}>
            <Icon name={shown ? "eye-off" : "eye"} size={18} />
          </button>
        ) : null}
      </span>
      {error || hint ? <span style={{ display: "block", fontSize: "var(--fs-caption)", color: error ? "var(--state-danger)" : "var(--text-muted)", marginTop: 6 }}>{error || hint}</span> : null}
    </label>
  );
}
