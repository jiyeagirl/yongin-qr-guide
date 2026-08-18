import React from "react";
import { Icon } from "./Icon.jsx";

/* One row of a facility / store / notice list. Variable height — never a fixed px height. */
export function ListRow({ title, meta, tag, icon, trailing = "chevron", divider = true, onClick, style, ...rest }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)", minHeight: "var(--tap-comfortable)",
      padding: "var(--space-3) 0", borderBottom: divider ? "var(--stroke-hairline) solid var(--border-default)" : "none",
      cursor: onClick ? "pointer" : "default", ...style }} {...rest}>
      {icon ? <span style={{ flex: "0 0 auto", paddingTop: 2, color: "var(--text-muted)" }}>{typeof icon === "string" ? <Icon name={icon} size={22} /> : icon}</span> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)", lineHeight: 1.4 }}>{title}</span>
          {tag}
        </div>
        {meta ? <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 3, lineHeight: 1.45 }}>{meta}</div> : null}
      </div>
      {trailing === "chevron" ? <Icon name="chevron-right" size={20} color="var(--yong-ink-300)" style={{ marginTop: 3 }} /> : trailing}
    </div>
  );
}
