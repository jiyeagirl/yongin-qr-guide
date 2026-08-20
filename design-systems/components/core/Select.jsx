import React from "react";
import { VisuallyHidden } from "./VisuallyHidden.jsx";
import { Icon } from "./Icon.jsx";

export function Select({ label, options = [], value, onChange, hint, error, required, disabled, style, ...rest }) {
  const borderColor = error ? "var(--state-danger)" : "var(--border-strong)";
  return (
    <label style={{ display: "block", ...style }}>
      {label ? <span style={{ display: "block", fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)", marginBottom: 6 }}>
          {label}
          {required ? <span aria-hidden="true" style={{ color: "var(--state-danger)", marginLeft: 3 }}>*</span> : null}
          {required ? <VisuallyHidden>필수</VisuallyHidden> : null}
        </span> : null}
      <span style={{ position: "relative", display: "block" }}>
        {/* 못 고르는 상태는 **보여야** 한다. 전에는 disabled 를 넘겨도 겉모습이 그대로라
            눌리지 않는 것이 고장으로 읽혔다 (2026-08-20). 입력칸(Input)의 disabled 와 같은
            가라앉은 바탕을 쓴다 — 같은 상태는 같은 모양이어야 한다. */}
        <select value={value} onChange={onChange} required={required} disabled={disabled}
          aria-invalid={error ? "true" : undefined} style={{ appearance: "none", width: "100%", minHeight: "var(--tap-comfortable)", padding: "10px 40px 10px 14px",
          background: disabled ? "var(--surface-sunken)" : "var(--surface-card)", border: `var(--stroke-hairline) solid ${borderColor}`, borderRadius: "var(--radius-control)",
          fontFamily: "var(--font-sans)", fontSize: 16, color: disabled ? "var(--text-muted)" : "var(--text-heading)" }} {...rest}>
          {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Icon name="chevron-down" size={20} color="var(--yong-ink-500)" /></span>
      </span>
      {error || hint ? <span style={{ display: "block", fontSize: "var(--fs-caption)", color: error ? "var(--state-danger)" : "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>{error || hint}</span> : null}
    </label>
  );
}
