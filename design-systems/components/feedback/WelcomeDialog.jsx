import React from "react";
import { EmptyState } from "./EmptyState.jsx";
import { Button } from "../core/Button.jsx";

/* 화면 한가운데 서서 **지금 무슨 일인지 한 마디 하고 갈 길을 내주는** 대화상자.
 *
 * 조아용 · 제목 · 한 줄 · 아래에 세로로 쌓은 단추들. 시민용 화면의 첫 모달 부품이다
 * (관리자 쪽 `Modal` 은 폼을 담는 창이라 머리·본문·바닥이 나뉘고 데스크톱 폭을 전제한다 —
 * 여기서 하는 일은 그것과 다르다).
 *
 * ── `CoachMarks` 와 무엇이 다른가 ───────────────────────────────────────────
 * 저쪽은 **화면의 한 자리를 밝히고** 그 위에 말을 얹는다. 그래서 카드가 밝힌 자리를 따라
 * 움직이고, 걸음이 여럿이며, 끝까지 읽는 것이 목적이다.
 *
 * 이쪽은 밝힐 자리가 없다. 하는 말이 **화면 안의 어느 한 곳을 가리키지 않기 때문**이다 —
 * "지금 이 축제가 열리고 있다"는 화면 밖의 사실이고, 읽은 사람이 할 일은 갈림길에서
 * 한쪽을 고르는 것이다. 가리킬 곳이 없으면 스포트라이트는 뚫을 구멍이 없고, 그때 카드는
 * 가운데 서는 것이 맞다.
 *
 * ── 닫는 길은 단추뿐이다 ───────────────────────────────────────────────────
 * [×] 를 두지 않는다. **단추 하나하나가 이미 나가는 길**이라(어느 것을 눌러도 이 상자는
 * 닫힌다), [×] 는 그중 하나와 같은 일을 하는 세 번째 단추가 된다 — 그러면 "닫기와
 * [주변 안내보기]는 뭐가 다른가"를 묻게 만든다. 같은 이유로 **막을 눌러도 닫히지 않는다.**
 * 무엇을 골랐는지가 다음 화면을 정하는 자리에서 손끝이 스쳐 닫히면, 고른 적 없는 쪽으로
 * 간 것이 된다.
 *
 * Esc 만 예외다 — `onDismiss` 를 받으면 그것을 부른다. 부르는 쪽이 **가장 소극적인 선택**
 * (대개 "그냥 원래 화면으로")을 넘긴다. 모바일 웹에는 Esc 가 없으므로 이것은 검수와
 * 키보드 사용자를 위한 자리다.
 *
 * actions: [{ label, onClick, variant }]
 *   맨 위가 primary, 나머지는 outline 이 기본이다 — 권하는 것이 하나여야 갈림길이 갈림길로
 *   보인다. `variant` 로 뒤집을 수 있게 열어두되, 그것을 정하는 것은 부르는 쪽의 판단이다.
 */

export function WelcomeDialog({
  pose = "hello",
  title,
  description,
  actions = [],
  onDismiss,
  base = "",
  style,
  ...rest
}) {
  const card = React.useRef(null);

  /* 열리는 순간 초점을 카드로. 보조기기에는 제목과 설명이 읽히고, 키보드로 들어온 사람은
     Tab 한 번에 첫 단추에 닿는다 */
  React.useEffect(() => {
    if (card.current) card.current.focus({ preventScroll: true });
  }, []);

  React.useEffect(() => {
    if (!onDismiss) return undefined;
    const onKey = e => { if (e.key === "Escape") onDismiss(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  /* Tab 을 카드 안에 가둔다. 손끝은 막이 이미 막고 있는데 초점만 뒤 화면으로 빠져나가면
     키보드로 읽는 사람에게는 막이 없는 것과 같다 (`CoachMarks` 와 같은 처리다). */
  const trap = e => {
    if (e.key !== "Tab" || !card.current) return;
    const stops = card.current.querySelectorAll("button");
    if (!stops.length) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    const at = document.activeElement;
    if (e.shiftKey && (at === first || at === card.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: "var(--z-modal)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "var(--gutter-screen)", ...style }} {...rest}>

      {/* 손끝을 받는 막. 뚫을 구멍이 없으므로 여기서 통째로 칠한다 */}
      <div style={{ position: "absolute", inset: 0, background: "var(--overlay-scrim)" }} />

      <div ref={card} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onKeyDown={trap}
        style={{ position: "relative", width: "100%", maxWidth: 340,
          /* 2차 글자 확대에서 카드가 화면보다 커질 수 있다. 그때 넘치는 쪽은 잘리지 않고
             카드 안에서 스크롤된다 — 잘리면 아래 단추에 닿을 방법이 없어진다 */
          maxHeight: "100%", overflowY: "auto", overscrollBehavior: "contain",
          background: "var(--surface-card)", borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-raised)", outline: "none" }}>

        {/* 조아용 · 제목 · 설명은 `EmptyState` 그대로다 — 같은 짜임을 두 번 적으면 한쪽만
            고쳐지는 날이 온다. 단추만 밖으로 낸다: 저쪽의 action 자리는 가운데 정렬된
            흐름 안이라 폭이 글자 수를 따라가는데, 대화상자의 단추는 카드 폭을 다 써야
            둘 중 어느 쪽도 작아 보이지 않는다 */}
        <EmptyState pose={pose} base={base} title={title} description={description}
          style={{ padding: `var(--space-6) var(--space-5) ${actions.length ? 0 : "var(--space-6)"}` }} />

        {actions.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)",
            padding: "var(--space-5)" }}>
            {actions.map((a, n) => (
              <Button key={a.label || n} block onClick={a.onClick}
                variant={a.variant || (n === 0 ? "primary" : "outline")}>{a.label}</Button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default WelcomeDialog;
