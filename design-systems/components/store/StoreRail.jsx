import React from "react";
import { CategoryIcon } from "../core/CategoryIcon.jsx";
import { OnnuriBadge } from "../core/OnnuriBadge.jsx";

/* 신규 및 인기 매장 가로 스크롤 (U-ST-09). 수백 개 목록 탐색을 우회하는 지름길이므로
   상점가 상세 상단(목록보다 위)에 둔다. S02 홈의 "신규 및 인기 매장" 영역도 같은 컴포넌트를 쓴다.
   카드에 고정 높이를 주지 않는다 — 가장 긴 카드에 맞춰 stretch 된다.

   흰 카드였을 때는 흰 시트 위에서 테두리만 남아 지름길로 읽히지 않았다.
   브랜드 초록 계열로 옅게 깔아 목록의 흰 행들과 구분한다.
   바로 위 축제 배너는 크림(accent) 계열이라 두 블록이 서로 섞이지 않는다.
   온누리 배지의 청록과도 계열이 달라 가맹 표시가 묻히지 않는다. */
export function StoreRail({ items = [], onPick, label = "신규 및 인기 매장", style, ...rest }) {
  return (
    <div role="list" aria-label={label}
      style={{ display: "flex", alignItems: "stretch", gap: "var(--space-2)", overflowX: "auto",
        padding: "2px 0 var(--space-2)", scrollbarWidth: "none", ...style }} {...rest}>
      {items.map(s => (
        <button key={s.name} role="listitem" onClick={() => onPick && onPick(s)}
          style={{ flex: "0 0 auto", width: 152, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5,
            padding: "var(--space-3)", textAlign: "left", background: "var(--brand-primary-soft)",
            border: "var(--stroke-hairline) solid var(--yong-green-200)", borderRadius: "var(--radius-md)",
            cursor: "pointer" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--brand-primary)" }}>
            <CategoryIcon type={s.cat} size={18} />
            {s.onnuri ? <OnnuriBadge size="sm" /> : null}
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)", lineHeight: 1.35 }}>{s.name}</span>
          {/* note 는 이 카드가 여기 있는 이유다("이번 주 조회 1위"). 회색으로 묻히면 지름길의 근거가 사라진다 */}
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)", fontWeight: "var(--fw-bold)", color: "var(--yong-green-800)", lineHeight: 1.35 }}>{s.note}</span>
        </button>
      ))}
    </div>
  );
}
