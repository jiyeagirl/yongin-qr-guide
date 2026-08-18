import React from "react";
import { Icon } from "../core/Icon.jsx";

/* 지도 위 바텀시트 — 3단 스냅 (기능명세서 5-3 #1).
   높이는 뷰포트가 아니라 부모(지도 영역) 기준이다. 값과 근거는 tokens/layers.css 참조.

     접힘 18% / 절반 37% / 전체 100%   →  지도 노출 82% / 63% / 0%

   %는 지도 영역 기준이라 눈으로 보는 "화면의 몇 %"와 다르다. 절반 37% ≈ 화면의 30% 다.

   핸들을 끌면 손가락을 따라오고, 놓으면 가장 가까운 스냅으로 붙는다. 짧게 탭하면 다음 단계로 순환한다.
   전체 스냅은 지도를 완전히 덮으므로 스크림을 쓰지 않는다 — 뒤에 비칠 것이 없다.
   대신 지도로 돌아갈 버튼(onClose)이 헤더에 있어야 한다.

   onHeightChange 는 시트의 실제 픽셀 높이를 알려준다. 지도 패딩(5-3 #2)과
   플로팅 컨트롤 앵커(5-3 #3)가 이 값을 쓰며, 2차 글자 확대로 내용이 커져도 measure 값이라 어긋나지 않는다. */

/* topInset — 부모(지도 영역) 위쪽에 시트가 **절대 덮으면 안 되는** 높이(px).
   상단 필터 바가 그 자리다. 이 값이 없으면 시트를 끌어올릴 때 시트가 필터 바 위로 올라가
   검색창과 칩이 위에서부터 잘려 나간다 (시트 z 500 > 필터 z 300).
   전체 스냅의 높이와 드래그 상한이 함께 이 값만큼 줄어든다. */
export const SNAP_ORDER = ["collapsed", "half", "full"];
export const SNAP_HEIGHT = { collapsed: "var(--sheet-collapsed)", half: "var(--sheet-half)", full: "var(--sheet-full)" };
/* tokens/layers.css 의 --sheet-* 와 같은 값이어야 한다. CSS 는 높이를, 이 표는 드래그 스냅 경계를
   맡는데 둘이 어긋나면 절반에 붙여둔 시트를 조금만 끌어도 다른 단계로 튄다.
   (탭바가 들어오며 절반이 55% → 62% 로 바뀌었을 때 이 표가 따라오지 않았다. 2026-08-14 정정) */
const SNAP_RATIO = { collapsed: 0.18, half: 0.37, full: 1 };

export function Sheet({ open = true, title, subtitle, headerExtra, children, snap = "half", onSnapChange, onHeightChange,
  onClose, closeIcon = "x", closeLabel = "닫기", scrim = false, topInset = 0, style, ...rest }) {
  const el = React.useRef(null);
  const drag = React.useRef(null);
  const [dragH, setDragH] = React.useState(null); /* 드래그 중에만 px 높이로 대체된다 */

  /* 실제 높이를 부모에게 보고한다. 스냅 트랜지션(--dur-slow) 중에도 계속 갱신해야
     지도 패딩이 시트를 뒤늦게 따라가지 않는다.
     콜백은 ref 에 담아둔다 — 부모가 인라인 함수를 넘겨도 effect 가 매 렌더 재실행되지 않게. */
  const report = React.useRef(onHeightChange);
  report.current = onHeightChange;

  React.useEffect(() => {
    const node = el.current;
    if (!node || !report.current) return;
    const report_ = () => report.current && report.current(node.getBoundingClientRect().height);
    report_();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(report_) : null;
    if (ro) ro.observe(node);
    /* 높이 트랜지션이 도는 동안(--dur-slow 320ms)에는 ResizeObserver 만으로 부족한 브라우저가 있어
       한 프레임씩 따라 읽는다. 트랜지션이 끝나면 멈춘다. */
    let raf, until = 0;
    const tick = t => { if (!until) until = t + 420; report_(); if (t < until) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { if (ro) ro.disconnect(); cancelAnimationFrame(raf); };
  }, [snap, open]);

  if (!open) return null;

  const move = to => onSnapChange && onSnapChange(to);
  const cycle = () => move(SNAP_ORDER[(SNAP_ORDER.indexOf(snap) + 1) % SNAP_ORDER.length]);

  const parentH = () => (el.current && el.current.parentElement ? el.current.parentElement.getBoundingClientRect().height : 0);

  /* 전체 스냅은 "부모 전체"가 아니라 "부모 - topInset" 이다. 상단 필터 바는 시트가 덮지 않는다.
     드래그 상한과 스냅 판정 비율도 같은 값을 봐야 한다 — 셋 중 하나만 놓쳐도
     끌어올린 시트가 필터를 덮거나, 놓았을 때 엉뚱한 단계로 붙는다. */
  const fullHeight = topInset ? `calc(${SNAP_HEIGHT.full} - ${topInset}px)` : SNAP_HEIGHT.full;
  const heightFor = s => (s === "full" ? fullHeight : SNAP_HEIGHT[s] || SNAP_HEIGHT.half);
  const ratios = ph => ({ ...SNAP_RATIO, full: ph ? Math.max(0, (ph - topInset) / ph) : 1 });

  const onDown = e => {
    const h = el.current ? el.current.getBoundingClientRect().height : 0;
    drag.current = { y: e.clientY, h, moved: false };
    setDragH(h);
    e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = e => {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.y;
    if (Math.abs(dy) > 4) drag.current.moved = true;
    const ph = parentH();
    const max = ph - topInset;
    const min = ph * SNAP_RATIO.collapsed * 0.6; /* 접힘보다 조금 더 내려가는 여지 — 놓으면 접힘으로 붙는다 */
    setDragH(Math.max(min, Math.min(max, drag.current.h - dy)));
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const h = dragH;
    setDragH(null);
    if (!d.moved) return cycle(); /* 탭 = 다음 단계 */
    const ph = parentH() || 1;
    const ratio = (h == null ? d.h : h) / ph;
    /* 가장 가까운 스냅으로 붙인다 */
    const R = ratios(ph);
    const nearest = SNAP_ORDER.reduce((best, k) =>
      Math.abs(R[k] - ratio) < Math.abs(R[best] - ratio) ? k : best, SNAP_ORDER[0]);
    move(nearest);
  };
  const onKey = e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); return cycle(); }
    const i = SNAP_ORDER.indexOf(snap);
    if (e.key === "ArrowUp") { e.preventDefault(); move(SNAP_ORDER[Math.min(i + 1, 2)]); }
    if (e.key === "ArrowDown") { e.preventDefault(); move(SNAP_ORDER[Math.max(i - 1, 0)]); }
  };

  return (
    <>
      {/* 스크림은 명시적으로 요청했을 때만. 전체 스냅은 지도를 100% 덮으므로
          스크림을 깔면 회색 띠만 보이고 아무 것도 가리지 못한다 */}
      {scrim ? (
        <div onClick={() => move("half")} aria-hidden="true"
          style={{ position: "absolute", inset: 0, zIndex: "var(--z-modal)", background: "var(--overlay-scrim)",
            transition: "opacity var(--dur-slow) var(--ease-standard)" }} />
      ) : null}
      <section ref={el} role="dialog" aria-label={title}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0,
          height: dragH != null ? `${dragH}px` : heightFor(snap),
          zIndex: "var(--z-sheet)", display: "flex", flexDirection: "column",
          background: "var(--surface-card)",
          /* 전체 스냅이 부모를 정말 100% 덮을 때만 위쪽을 각지게 한다. 모서리만 둥글면
             그 틈으로 뒤가 조각처럼 비쳐 흠집처럼 보이기 때문인데, topInset 이 있으면
             시트 위에 필터 바가 얹히는 정상적인 구조이므로 둥근 모서리를 유지해야 한다 */
          borderRadius: snap === "full" && dragH == null && !topInset ? 0 : "var(--radius-sheet) var(--radius-sheet) 0 0",
          boxShadow: "var(--shadow-sheet)",
          transition: dragH != null ? "none" : "height var(--dur-slow) var(--ease-out)", ...style }} {...rest}>
        <div role="button" tabIndex={0} aria-label={`목록 시트 — 현재 ${{ collapsed: "접힘", half: "절반", full: "전체" }[snap]}. 위아래 화살표로 조절`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}
          style={{ flex: "0 0 auto", padding: "10px 0 6px", cursor: "grab", touchAction: "none" }}>
          <span style={{ display: "block", width: 44, height: 5, borderRadius: 999, background: "var(--border-strong)", margin: "0 auto" }} />
        </div>
        {title ? (
          <div style={{ flex: "0 0 auto", padding: "0 var(--gutter-screen) var(--space-3)" }}>
            {/* 제목 줄만 닫기 버튼과 폭을 나눈다 */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: "var(--fs-title-2)", fontWeight: "var(--fw-bold)", letterSpacing: "var(--ls-snug)" }}>{title}</h2>
                {subtitle ? <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 4 }}>{subtitle}</div> : null}
              </div>
              {onClose ? (
                <button onClick={onClose} aria-label={closeLabel} title={closeLabel}
                  style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 4,
                    minWidth: "var(--tap-min)", minHeight: "var(--tap-min)", padding: "0 var(--space-2)",
                    justifyContent: "center", background: "none", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-bold)",
                    color: "var(--brand-primary)" }}>
                  <Icon name={closeIcon} size={20} />{closeLabel}
                </button>
              ) : null}
            </div>
            {/* headerExtra 는 제목 줄 **아래 전체 폭**이다. 제목과 같은 열에 넣으면
                닫기 버튼 폭만큼 좁아져, 요약 줄이 두 줄로 접히거나 가로 스크롤 영역이 버튼 밑으로 깔린다 */}
            {headerExtra}
          </div>
        ) : null}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}>{children}</div>
      </section>
    </>
  );
}
