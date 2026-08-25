import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";
import { CategoryIcon } from "../core/CategoryIcon.jsx";
import { OnnuriBadge } from "../core/OnnuriBadge.jsx";

/* 마커를 탭했을 때 시트 위에 뜨는 미리보기 카드.
   기능명세서 5-3 #2 의 나머지 절반이다 — 지도를 위로 올려 잡는 것만으로는 부족하고,
   탭한 마커가 "무엇이었는지"가 그 자리에서 읽혀야 탭이 반응한 것으로 느껴진다.

   시트 상단에 앵커링되며(플로팅 컨트롤과 같은 규칙), 이 카드가 떠 있는 동안에는
   카드 높이까지 지도 가림 높이에 포함되어야 한다. 그래서 onHeightChange 로 실제 높이를 알린다.

   ── bottom 에 트랜지션을 걸지 않는다 (2026-08-25) ────────────────────────────
   앵커(bottom)로 받는 시트 높이는 이미 **프레임마다 갱신되는 값**이다 (Sheet 의 report_
   루프가 스냅 트랜지션이 도는 내내 실측을 올려보낸다). 그 위에 같은 길이의 트랜지션을
   한 번 더 걸면 카드가 시트를 320ms 뒤에서 쫓아가, 시트가 멈춘 뒤에도 혼자 미끄러진다.
   손으로 끄는 동안에는 손가락과 카드 사이가 눈에 띄게 벌어졌다. 지금은 앵커가 시트의
   윗변을 그대로 따라가므로, 카드는 붙어 있는 것처럼 움직인다.

   ── compact ────────────────────────────────────────────────────────────────
   지도가 작은 화면(S08 코스 상세는 지도가 화면의 절반 이하다)에서는 이 카드가 지도를
   거의 다 덮는다. compact 는 **덮는 높이를 줄이는 변형**이다:

     · 주소 줄을 뺀다 — 지도 위에서 좌표를 이미 보고 있는데 주소까지 읽을 일은 드물고,
       주소가 필요하면 [상세 보기]가 바로 옆에 있다. 두 줄이 한 줄이 된다.
     · 여백을 한 단계 조인다.

   버튼 크기는 compact 와 무관하다 — 기본 카드도 xs 를 쓴다. 그 판단의 근거는 아래
   버튼 자리의 주석에 있다.

   화면이 제 스타일을 따로 만들지 않고 이 변형을 쓰게 한 이유는, 지도 위에서 무언가를
   눌렀을 때 뜨는 것이 화면마다 다르면 사용자가 화면마다 다시 배워야 하기 때문이다. */
export function MapPreviewCard({ item, icon, bottom = 0, compact = false, onClose, onDetail, onRoute, routeLabel = "길찾기", detailLabel = "상세 보기", onHeightChange, style, ...rest }) {
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
        display: "flex", alignItems: "flex-start", gap: compact ? "var(--space-2)" : "var(--space-3)",
        padding: compact ? "var(--space-3)" : "var(--space-4)", background: "var(--surface-card)",
        border: "var(--stroke-hairline) solid var(--border-default)", borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-raised)", ...style }} {...rest}>
      {/* 아이콘은 호출하는 쪽이 넘길 수 있다 — 점포는 CategoryIcon, 편의시설은 FacilityIcon 이어야 하고
          둘을 한 아이콘 체계로 뭉뚱그리면 5-2 의 아이콘 규칙이 깨진다 */}
      <span style={{ flex: "0 0 auto", paddingTop: 2, color: "var(--text-muted)" }}>
        {icon || <CategoryIcon type={item.cat} size={compact ? 20 : 22} />}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
        gap: compact ? 4 : "var(--space-2)" }}>
        <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)", lineHeight: 1.35 }}>{item.name}</span>
          {item.onnuri ? <OnnuriBadge size="sm" /> : null}
        </span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.45 }}>
          {item.biz}{walk != null ? ` · 약 ${item.dist}m, 도보 ${walk}분` : ""}
          {compact ? null : <span style={{ display: "block" }}>{item.addr}</span>}
        </span>
        {/* 버튼은 xs 다 (2026-08-18. compact 여부와 무관하게 S02·S03 의 카드도 같다).
            sm(40px)으로는 카드 안에서 버튼이 내용보다 커 보였다 — 이 카드는 지도 위에
            떠서 지도를 가리므로, 카드에서 줄일 수 있는 높이는 전부 줄이는 편이 맞다.
            xs 는 터치 타겟 44px 을 지키지 않는 크기라 아무 데나 쓸 수 없는데(Button 의
            SIZES 주석), 이 자리는 그 조건을 만족한다: 버튼이 둘뿐이고, 사이가 벌어져
            있으며, 두 동작 모두 다른 길이 있다([상세 보기]는 목록에도, [길찾기]는
            상세 화면에도 있다). */}
        <span style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap",
          marginTop: compact ? 2 : 0 }}>
          <Button size="xs" variant="primary" icon="footprints" onClick={onRoute}>{routeLabel}</Button>
          <Button size="xs" variant="outline" onClick={onDetail}>{detailLabel}</Button>
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
