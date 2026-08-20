import React from "react";
import { Icon } from "../core/Icon.jsx";

/* 하단 탭바 (U-CM-03) — 이 서비스의 유일한 전역 내비게이션.
   공공시설 `shield-plus` / 상점가 `store` / 둘러보기 `compass`.

   기능명세서 5-3 #5 (탭바와 바텀시트의 공존)의 답:
   **탭바는 시트의 형제 요소이며 항상 보인다.** 시트는 탭바 위의 "지도 영역" 안에서만 움직이므로
   전체 스냅(100%)에서도 탭바를 덮지 않는다. 지도 영역이 64px 줄어드는 대가로
   목록을 끝까지 올린 상태에서도 탭을 바꿀 수 있다 —
   전역 내비게이션이 사라지는 상태를 만들지 않는 쪽이 64px 보다 중요하다.
   (z 450 은 시트가 뷰포트 오버레이인 화면에서 필요할 때를 위해 유지한다)

   items: [{ id, label, icon }]

   **알림 점(badge)은 없다** (2026-08-20). 진행 중 축제가 있으면 둘러보기 아이콘 오른쪽 위에
   빨간 점을 찍었으나(U-CM-18) 걷어냈다 — 이유는 CHANGELOG 같은 날짜 항목. */
export function TabBar({ items = [], value, onChange, style, ...rest }) {
  return (
    <nav aria-label="주요 메뉴"
      style={{ position: "relative", zIndex: "var(--z-tabbar)", flex: "0 0 auto",
        display: "grid", gridTemplateColumns: `repeat(${items.length || 1}, 1fr)`, minHeight: "var(--tabbar-h)",
        background: "var(--surface-card)", borderTop: "var(--stroke-hairline) solid var(--border-default)",
        paddingBottom: "env(safe-area-inset-bottom)", ...style }} {...rest}>
      {items.map(it => {
        const on = it.id === value;
        return (
          <button key={it.id} onClick={() => onChange && onChange(it.id)}
            aria-current={on ? "page" : undefined}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
              minHeight: "var(--tap-min)", padding: "8px 4px", background: "none", border: "none", cursor: "pointer",
              color: on ? "var(--brand-primary)" : "var(--text-muted)" }}>
            <Icon name={it.icon} size={23} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)",
              fontWeight: on ? "var(--fw-bold)" : "var(--fw-medium)" }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
