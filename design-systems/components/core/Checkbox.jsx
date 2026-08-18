import React from "react";
import { Icon } from "./Icon.jsx";

export function Checkbox({ label, checked, onChange, disabled, style, ...rest }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)", minHeight: "var(--tap-min)", padding: "10px 0", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, ...style }} {...rest}>
      <input type="checkbox" checked={!!checked} onChange={onChange} disabled={disabled} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span style={{ width: 24, height: 24, flex: "0 0 auto", borderRadius: "var(--radius-xs)", display: "flex", alignItems: "center", justifyContent: "center",
        background: checked ? "var(--brand-primary)" : "var(--surface-card)", border: checked ? "var(--stroke-hairline) solid var(--brand-primary)" : "var(--stroke-hairline) solid var(--border-strong)", transition: "all var(--dur-fast) var(--ease-standard)" }}>
        {checked ? <Icon name="check" size={16} color="var(--yong-white)" /> : null}
      </span>
      <span style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}
