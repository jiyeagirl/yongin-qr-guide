import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";
import { CategoryIcon } from "../core/CategoryIcon.jsx";
import { OnnuriBadge } from "../core/OnnuriBadge.jsx";

/* 마커를 탭했을 때 시트 위에 뜨는 미리보기 카드.
   기능명세서 5-3 #2 의 나머지 절반이다 — 지도를 위로 올려 잡는 것만으로는 부족하고,
   탭한 마커가 "무엇이었는지"가 그 자리에서 읽혀야 탭이 반응한 것으로 느껴진다.

   시트 상단에 앵커링되며(플로팅 컨트롤과 같은 규칙), 이 카드가 떠 있는 동안에는
   카드 높이까지 지도 가림 높이에 포함되어야 한다. 그래서 onHeightChange 로 실제 높이를 알린다. */
export function MapPreviewCard({ item, icon, bottom = 0, onClose, onDetail, onRoute, routeLabel = "길찾기", detailLabel = "상세 보기", onHeightChange, style, ...rest }) {
  const el = React.useRef(null);
  const report = React.useRef(onHeightChange);
  report.current = onHeightChange;

  React.useEffect(() => {
    const node = el.current;
    if (!node) return;
    const send = () => report.current && report.current(node ? node.getBoundingClientRect().height : 0);
    send();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(send) : null;
    if (ro) ro.observe(node);
    return () => { if (ro) ro.disconnect(); report.current && report.current(0); };
  }, [item]);

  if (!item) return null;
  const anchor = typeof bottom === "number" ? `${bottom}px` : bottom;
  const walk = item.dist != null ? Math.max(1, Math.round(item.dist / 67)) : null;

  return (
    <div ref={el} role="dialog" aria-label={`${item.name} 미리보기`}
      style={{ position: "absolute", left: "var(--gutter-screen)", right: "var(--gutter-screen)",
        bottom: `calc(${anchor} + var(--float-gap))`, zIndex: "var(--z-float)",
        display: "flex", alignItems: "flex-start", gap: "var(--space-3)",
        padding: "var(--space-4)", background: "var(--surface-card)",
        border: "var(--stroke-hairline) solid var(--border-default)", borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-raised)",
        transition: "bottom var(--dur-slow) var(--ease-out)", ...style }} {...rest}>
      {/* 아이콘은 호출하는 쪽이 넘길 수 있다 — 점포는 CategoryIcon, 편의시설은 FacilityIcon 이어야 하고
          둘을 한 아이콘 체계로 뭉뚱그리면 5-2 의 아이콘 규칙이 깨진다 */}
      <span style={{ flex: "0 0 auto", paddingTop: 2, color: "var(--text-muted)" }}>
        {icon || <CategoryIcon type={item.cat} size={22} />}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)", lineHeight: 1.35 }}>{item.name}</span>
          {item.onnuri ? <OnnuriBadge size="sm" /> : null}
        </span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.45 }}>
          {item.biz}{walk != null ? ` · 약 ${item.dist}m, 도보 ${walk}분` : ""}
          <span style={{ display: "block" }}>{item.addr}</span>
        </span>
        <span style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <Button size="sm" variant="primary" icon="footprints" onClick={onRoute}>{routeLabel}</Button>
          <Button size="sm" variant="outline" onClick={onDetail}>{detailLabel}</Button>
        </span>
      </div>
      <button onClick={onClose} aria-label="미리보기 닫기"
        style={{ flex: "0 0 auto", width: "var(--tap-min)", height: "var(--tap-min)", margin: "-10px -10px 0 0",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
        <Icon name="x" size={20} />
      </button>
    </div>
  );
}
