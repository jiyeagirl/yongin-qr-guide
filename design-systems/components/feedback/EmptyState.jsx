import React from "react";
import { Mascot } from "../brand/Mascot.jsx";

export function EmptyState({ title, description, action, pose = "curious", base = "", style, ...rest }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "var(--space-2)", padding: "var(--space-8) var(--space-5)", ...style }} {...rest}>
      <Mascot pose={pose} size={110} base={base} />
      <h3 style={{ font: "var(--type-title-3)", marginTop: "var(--space-2)" }}>{title}</h3>
      {description ? <p style={{ font: "var(--type-body)", color: "var(--text-muted)", maxWidth: 280 }}>{description}</p> : null}
      {action ? <div style={{ marginTop: "var(--space-3)" }}>{action}</div> : null}
    </div>
  );
}
