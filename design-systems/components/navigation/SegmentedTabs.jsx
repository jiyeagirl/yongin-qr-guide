import React from "react";

/* In-page segmented control. Underline style for content switching. */
export function SegmentedTabs({ items = [], value, onChange, variant = "underline", style, ...rest }) {
  if (variant === "pill") {
    /* 보이는 크기와 누를 수 있는 영역을 분리한다 (Chip 과 같은 방식).
       트랙은 36px 로 작게 보이지만, 버튼의 실제 상자는 44px 이고 음수 마진으로
       트랙 위아래로 7px 씩 넘쳐 있어 터치 타겟 44px 규칙(U-CM-13)을 지킨다.
       그래서 트랙에 overflow:hidden 을 걸면 안 된다. */
    return (
      <div role="group" style={{ display: "inline-flex", alignItems: "center", padding: 3, gap: 2,
        background: "var(--surface-sunken)", borderRadius: "var(--radius-pill)", ...style }} {...rest}>
        {items.map((it) => {
          const on = it.id === value;
          return (
            <button key={it.id} onClick={() => onChange && onChange(it.id)} aria-pressed={on}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
                minHeight: "var(--tap-min)", margin: "-7px 0", padding: 0,
                background: "none", border: "none", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
              <span style={{ display: "inline-flex", alignItems: "center", minHeight: 30, padding: "0 12px",
                borderRadius: 999, whiteSpace: "nowrap",
                fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-bold)",
                background: on ? "var(--surface-card)" : "transparent",
                color: on ? "var(--text-heading)" : "var(--text-muted)",
                boxShadow: on ? "var(--shadow-card)" : "none",
                transition: "background var(--dur-fast) var(--ease-standard)" }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: "var(--space-5)", borderBottom: "var(--stroke-hairline) solid var(--border-default)", ...style }} {...rest}>
      {items.map((it) => {
        const on = it.id === value;
        return (
          <button key={it.id} onClick={() => onChange && onChange(it.id)} style={{ position: "relative", padding: "12px 2px", background: "none", border: "none", cursor: "pointer", font: on ? "var(--fw-bold) var(--fs-body-lg)/1.4 var(--font-sans)" : "var(--type-body-lg)", color: on ? "var(--text-heading)" : "var(--text-muted)" }}>
            {it.label}
            <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 3, borderRadius: 3, background: on ? "var(--brand-primary)" : "transparent" }} />
          </button>
        );
      })}
    </div>
  );
}
