import React from "react";

export function Switch({ checked, onChange, label, disabled, style, ...rest }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-3)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, ...style }} {...rest}>
      {/* 44x26. 스위치 자체는 작아도 감싼 label 전체가 클릭 영역이라 터치 타겟은 충분하다 */}
      <span onClick={() => !disabled && onChange && onChange(!checked)} style={{ flex: "0 0 auto", width: 44, height: 26, borderRadius: 999, background: checked ? "var(--brand-primary)" : "var(--yong-ink-200)", border: "var(--stroke-hairline) solid " + (checked ? "var(--brand-primary)" : "var(--border-strong)"), padding: 2, display: "inline-flex", justifyContent: checked ? "flex-end" : "flex-start", transition: "background var(--dur-base) var(--ease-standard)" }}>
        <span style={{ width: 20, height: 20, borderRadius: 999, background: "var(--yong-white)", boxShadow: "0 1px 3px rgba(22,34,28,.28)", transition: "transform var(--dur-base) var(--ease-bounce)" }} />
      </span>
      {label ? <span style={{ font: "var(--type-body)", color: "var(--text-body)" }}>{label}</span> : null}
    </label>
  );
}
