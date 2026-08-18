import React from "react";
import { Icon } from "../core/Icon.jsx";

/* 상단 바. 2차의 언어·음성·글자크기 버튼 자리는 코드에서만 비워둔다 — 화면에 노출하지 않는다.

   제목은 3열 그리드로 정중앙에 놓는다. 좌우 열이 모두 1fr 이라 뒤로가기 버튼만 있고
   오른쪽이 비어 있어도(또는 그 반대여도) 제목 열의 중심이 바 전체의 중심과 일치한다.
   flex + paddingRight 보정 방식은 양쪽 폭이 다를 때 제목이 한쪽으로 밀린다.

   제목이 길면 자르지 않고 줄바꿈한다 — 헤더는 min-height 만 가지므로 함께 늘어난다
   (U-CM-14 고정 높이 금지). */
export function AppBar({ title, back = false, onBack, actions, tone = "plain", style, ...rest }) {
  const brand = tone === "brand";
  return (
    <header style={{ position: "sticky", top: 0, zIndex: "var(--z-filter)",
      display: "grid", gridTemplateColumns: "minmax(var(--tap-min), 1fr) auto minmax(var(--tap-min), 1fr)",
      alignItems: "center", gap: "var(--space-2)", minHeight: "var(--appbar-h)",
      padding: "6px var(--space-2)", background: brand ? "var(--brand-primary)" : "rgba(255,255,255,.94)",
      backdropFilter: brand ? "none" : "var(--blur-glass)",
      borderBottom: brand ? "none" : "var(--stroke-hairline) solid var(--border-default)",
      color: brand ? "var(--text-on-brand)" : "var(--text-heading)", ...style }} {...rest}>

      <span style={{ justifySelf: "start", display: "inline-flex" }}>
        {back ? (
          <button onClick={onBack} aria-label="뒤로"
            style={{ width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", color: "inherit", cursor: "pointer" }}>
            <Icon name="chevron-left" size={24} />
          </button>
        ) : null}
      </span>

      <h1 style={{ minWidth: 0, textAlign: "center", fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-bold)",
        color: "inherit", letterSpacing: "var(--ls-snug)", lineHeight: 1.35 }}>{title}</h1>

      <span style={{ justifySelf: "end", display: "inline-flex", alignItems: "center", gap: 2 }}>{actions}</span>
    </header>
  );
}
