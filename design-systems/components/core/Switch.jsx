import React from "react";

/* ── 이름은 본체가 갖는다 ────────────────────────────────────────────────────
   글자를 붙이지 않고 스위치만 세우는 자리가 있다 (관리자 표의 [노출 여부] 열 —
   머리말이 이미 무엇을 켜고 끄는지 말하므로 칸마다 같은 글자를 되풀이하지 않는다).
   그때 label 만 지우면 읽어주는 도구에는 이름 없는 무언가가 남으므로, 본체가
   role="switch" 로 서서 `aria-label` 을 받고 켬/끔은 `aria-checked` 가 말한다.
   글자를 붙인 자리에서는 그 글자가 그대로 이름이 된다 (aria-labelledby). */
export function Switch({ checked, onChange, label, disabled, style, "aria-label": ariaLabel, ...rest }) {
  const labelId = React.useId();
  const toggle = () => { if (!disabled && onChange) onChange(!checked); };
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-3)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, ...style }} {...rest}>
      {/* 44x26. 스위치 자체는 작아도 감싼 label 전체가 클릭 영역이라 터치 타겟은 충분하다 */}
      <span role="switch" aria-checked={!!checked} aria-disabled={disabled || undefined}
        aria-label={label ? undefined : ariaLabel} aria-labelledby={label ? labelId : undefined}
        tabIndex={disabled ? -1 : 0}
        onClick={toggle}
        onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } }}
        style={{ flex: "0 0 auto", width: 44, height: 26, borderRadius: 999, background: checked ? "var(--brand-primary)" : "var(--yong-ink-200)", border: "var(--stroke-hairline) solid " + (checked ? "var(--brand-primary)" : "var(--border-strong)"), padding: 2, display: "inline-flex", justifyContent: checked ? "flex-end" : "flex-start", transition: "background var(--dur-base) var(--ease-standard)" }}>
        <span style={{ width: 20, height: 20, borderRadius: 999, background: "var(--yong-white)", boxShadow: "0 1px 3px rgba(22,34,28,.28)", transition: "transform var(--dur-base) var(--ease-bounce)" }} />
      </span>
      {label ? <span id={labelId} style={{ font: "var(--type-body)", color: "var(--text-body)" }}>{label}</span> : null}
    </label>
  );
}
