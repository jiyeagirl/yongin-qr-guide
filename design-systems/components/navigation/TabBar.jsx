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
   빨간 점을 찍었으나(U-CM-18) 걷어냈다 — 이유는 CHANGELOG 같은 날짜 항목.

   ── `itemRefs` — 탭 한 칸의 DOM 을 밖으로 내준다 (2026-08-28 추가) ────────────
   `React.useRef({})` 를 넘기면 `{ [id]: element }` 로 채워진다. 손님은 코치마크
   (`CoachMarks`)다 — 탭 한 칸을 밝히려면 그 칸이 화면 어디에 얼마만 한 크기로 서 있는지를
   **재야** 하는데, 폭은 화면 폭을 탭 수로 나눈 값이고 높이는 글자 확대에 따라 늘어난다.

   자리를 셈으로 짐작하는 길(탭바를 재서 n 등분)도 있었지만, 그것은 이 부품이 grid 로
   같은 폭 칸을 만든다는 **속사정을 밖에서 베껴 적는 일**이다. 여기가 배치를 바꾸면
   조용히 어긋난다. 실제 요소를 내주면 어긋날 자리가 없다.

   `spotlight` 같은 이름으로 받지 않는 것은 이 부품이 코치마크를 알 이유가 없어서다 —
   내주는 것은 자리이고 그 자리로 무엇을 할지는 받는 쪽이 정한다. */
export function TabBar({ items = [], value, onChange, itemRefs, style, ...rest }) {
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
            /* 언마운트될 때 지운다 — 남겨두면 없는 요소를 재려다 0×0 이 나온다 */
            ref={el => { if (itemRefs && itemRefs.current) { if (el) itemRefs.current[it.id] = el; else delete itemRefs.current[it.id]; } }}
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
