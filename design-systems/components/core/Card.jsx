import React from "react";

/* 내용 상자.
 *
 *   tone      plain(흰 카드) · dark · 틴트 10종 중 하나
 *   accent    흰 카드에 **테두리만** 틴트로. 바탕을 물들이지 않고 갈래만 표시한다
 *   outlined  흰 카드에 브랜드 테두리. 그림자를 뺀다
 *
 * ── 틴트 10종 (2026-08-19 도입) ─────────────────────────────────────────────
 * 전에는 tone 이 plain · brand · accent · dark 넷이었고, 그 넷으로 안 되는 자리마다
 * 화면이 자기 색을 만들어 썼다 (축제 카드의 파스텔 여섯, 매장 레일의 --rail-*).
 * 색이 늘어난 것이 문제가 아니라, **늘어난 색이 아무 데도 등록되지 않은 것**이 문제였다 —
 * 같은 뜻의 색이 화면마다 달라도 아무도 알아채지 못한다.
 *
 * 지금은 `tokens/surfaces.css` 의 10틴트를 그대로 받는다. 틴트에는 도메인이 붙어 있어
 * (green 상점가·점포 / cream 축제·이벤트 / red 응급 …) 카드에 색을 준다는 것이 곧
 * 그 카드가 무엇에 관한 것인지 적는 일이 된다.
 *
 * **한 화면에서 세 틴트를 넘기지 않는다.** 틴트는 장식이 아니라 분류이고, 넷을 넘기면
 * 분류가 아니라 무늬가 된다 (surfaces.css 머리말).
 *
 * 옛 tone 이름 brand · accent 는 각각 green · cream 으로 옮겼다. 둘 다 화면에서 쓰이지
 * 않았고(데모 카드와 prompt.md 뿐), 뜻이 없는 이름을 남겨두면 새로 쓰는 사람이 그것을
 * 고른다 — "brand" 가 어느 틴트인지는 이름만 봐서 알 수 없다. */
export const CARD_TINTS = ["green", "teal", "cream", "amber", "red", "blue", "violet", "sand", "rose", "neutral"];

export function Card({ children, tone = "plain", outlined = false, accent, padding = "var(--space-5)", style, ...rest }) {
  const t = CARD_TINTS.includes(tone) ? tone : null;
  const base = t
    ? { background: `var(--tint-${t}-bg)`, borderColor: `var(--tint-${t}-border)` }
    : tone === "dark"
      ? { background: "var(--surface-dark)", color: "var(--text-on-dark)", borderColor: "transparent" }
      : { background: "var(--surface-card)", borderColor: outlined ? "var(--border-brand)" : "var(--border-default)" };

  /* accent 는 바탕을 물들이지 않고 테두리만 바꾼다. 흰 카드가 줄지어 선 목록에서
     한 장이 어느 갈래인지만 말해야 할 때 쓴다 — 바탕까지 물들이면 그 카드가
     목록에서 튀어나와 "고른 줄"처럼 읽힌다 */
  const ac = accent && CARD_TINTS.includes(accent) ? accent : null;

  return (
    <div style={{
      borderRadius: "var(--radius-card)", padding,
      borderWidth: "var(--stroke-hairline)", borderStyle: "solid",
      /* 틴트 카드는 그림자를 뺀다 — 색이 이미 바탕에서 떨어뜨려 놓았는데 그림자까지 얹으면
         납작한 이 시스템에서 그 카드만 떠 보인다 */
      boxShadow: outlined || t || tone === "dark" ? "none" : "var(--shadow-card)",
      ...base,
      ...(ac ? { borderColor: `var(--tint-${ac}-border)` } : null),
      ...style,
    }} {...rest}>
      {children}
    </div>
  );
}
