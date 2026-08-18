import React from "react";
import { Icon } from "./Icon.jsx";

export function Select({ label, options = [], value, onChange, hint, error, required, style, ...rest }) {
  const borderColor = error ? "var(--state-danger)" : "var(--border-strong)";
  return (
    <label style={{ display: "block", ...style }}>
      {label ? <span style={{ display: "block", fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)", marginBottom: 6 }}>
          {label}
          {required ? <span aria-hidden="true" style={{ color: "var(--state-danger)", marginLeft: 3 }}>*</span> : null}
          {required ? <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>필수</span> : null}
        </span> : null}
      <span style={{ position: "relative", display: "block" }}>
        <select value={value} onChange={onChange} required={required} aria-invalid={error ? "true" : undefined} style={{ appearance: "none", width: "100%", minHeight: "var(--tap-comfortable)", padding: "10px 40px 10px 14px",
          background: "var(--surface-card)", border: `var(--stroke-hairline) solid ${borderColor}`, borderRadius: "var(--radius-control)",
          fontFamily: "var(--font-sans)", fontSize: 16, color: "var(--text-heading)" }} {...rest}>
          {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Icon name="chevron-down" size={20} color="var(--yong-ink-500)" /></span>
      </span>
      {error || hint ? <span style={{ display: "block", fontSize: "var(--fs-caption)", color: error ? "var(--state-danger)" : "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>{error || hint}</span> : null}
    </label>
  );
}
