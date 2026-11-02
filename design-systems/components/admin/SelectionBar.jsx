import React from "react";
import { Icon } from "../core/Icon.jsx";

/* 선택 액션바 (2026-11-02) — 체크박스로 고른 것이 있을 때만 표 · 카드 그리드 **바로 위**에 선다.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ ✓ 12개 선택   [인쇄] [SVG 내려받기]                         선택 해제 │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * 필터 줄(Toolbar) 오른쪽 끝에 붙이던 일괄 단추와 다른 점은 **자리가 결과 쪽**이라는 것이다.
 * 고른 것을 가지고 하는 일이라 고른 것 바로 위에 선다 — 필터 줄은 무엇을 볼지 정하는 줄이다.
 * 바탕을 브랜드 틴트로 물들여 「지금 무엇인가를 고른 상태」임이 한눈에 보이게 한다.
 *
 * 단추는 화면이 `children` 으로 넘긴다. 무엇을 할 수 있는지는 화면마다 다르다. */
export function SelectionBar({ count, unit = "개", onClear, children, style, ...rest }) {
  if (!count) return null;
  return (
    <div role="region" aria-label="선택한 항목으로 할 일"
      style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap",
        marginBottom: "var(--space-3)", padding: "var(--space-2) var(--space-4)",
        background: "var(--tint-green-bg)", border: "var(--stroke-hairline) solid var(--tint-green-border)",
        borderRadius: "var(--radius-lg)", ...style }} {...rest}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--fs-label)",
        fontWeight: "var(--fw-bold)", color: "var(--text-heading)", whiteSpace: "nowrap" }}>
        <Icon name="check" size={16} color="var(--brand-primary)" />
        {count.toLocaleString("ko-KR")}{unit} 선택
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {children}
      </div>
      {onClear ? (
        <button type="button" onClick={onClear}
          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: "var(--space-2)",
            fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)", color: "var(--text-muted)",
            textDecoration: "underline" }}>
          선택 해제
        </button>
      ) : null}
    </div>
  );
}

export default SelectionBar;
