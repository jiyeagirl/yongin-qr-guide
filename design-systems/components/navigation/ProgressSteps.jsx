import React from "react";
import { Icon } from "../core/Icon.jsx";

export function ProgressSteps({ steps = [], current = 0, style, ...rest }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", ...style }} {...rest}>
      {steps.map((s, i) => {
        const done = i < current, now = i === current;
        return (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" }}>
            {i > 0 ? <span style={{ position: "absolute", top: 13, right: "50%", width: "100%", height: 2, background: done || now ? "var(--brand-primary)" : "var(--border-default)" }} /> : null}
            <span style={{ position: "relative", width: 28, height: 28, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-micro)", fontWeight: "var(--fw-bold)",
              background: done ? "var(--brand-primary)" : now ? "var(--surface-card)" : "var(--surface-sunken)", border: now ? "var(--stroke-outline) solid var(--brand-primary)" : "none",
              color: done ? "var(--yong-white)" : now ? "var(--brand-primary)" : "var(--text-disabled)" }}>
              {done ? <Icon name="check" size={16} color="var(--yong-white)" /> : i + 1}
            </span>
            <span style={{ fontSize: "var(--fs-micro)", color: now ? "var(--text-heading)" : "var(--text-muted)", textAlign: "center" }}>{s}</span>
          </div>
        );
      })}
    </div>
  );
}
