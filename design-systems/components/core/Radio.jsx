import React from "react";

export function Radio({ label, checked, onChange, name, disabled, style, ...rest }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minHeight: "var(--tap-min)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, ...style }} {...rest}>
      <input type="radio" name={name} checked={!!checked} onChange={onChange} disabled={disabled} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span style={{ width: 24, height: 24, flex: "0 0 auto", borderRadius: 999, background: "var(--surface-card)", border: checked ? "7px solid var(--brand-primary)" : "var(--stroke-hairline) solid var(--border-strong)", boxShadow: "none", transition: "all var(--dur-fast) var(--ease-standard)" }} />
      <span style={{ font: "var(--type-body)", color: "var(--text-body)" }}>{label}</span>
    </label>
  );
}
