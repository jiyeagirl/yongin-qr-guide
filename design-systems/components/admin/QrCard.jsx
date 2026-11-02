import React from "react";

/* QR 카드 · QR 카드 그리드 (2026-11-02) — 관리자 QR 지점 관리의 [QR] 보기.
 *
 *   ┌──────────────┐
 *   │   ▣ QR 그림   │
 *   │ 지점명        │
 *   │ m-1          │
 *   │ [종류][설치]  │
 *   └──────────────┘
 *
 * 표(DataTable)와 **같은 행을 다른 모양으로** 보여주는 자리다. 그래서 카드가 들고 있는
 * 것은 표의 열에서 고른 넷뿐이고(지점명 · QR ID · 종류 · 설치 상태), 배지는 화면이
 * 표와 같은 Badge 로 만들어 `badges` 에 넘긴다 — 카드가 색을 따로 정하면 같은 값이
 * 두 보기에서 다른 색이 된다.
 *
 * 누르면 표의 줄을 누른 것과 같은 일이 일어난다(`onClick`) — 보기가 바뀌어도 할 수 있는
 * 일은 같다.
 *
 * 그리드는 `auto-fill` 이라 화면 폭에 따라 한 줄의 장수가 저절로 바뀐다. 카드 높이는
 * 고정하지 않는다 (지점명이 두 줄이 되면 카드가 늘어난다 — 화면 공통 규칙).
 */
export function QrCardGrid({ children, min = 200, style, ...rest }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`,
      gap: "var(--space-4)", ...style }} {...rest}>
      {children}
    </div>
  );
}

export function QrCard({ image, title, code, badges, onClick, style, ...rest }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick}
      style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: "var(--space-2)",
        padding: "var(--space-4)", textAlign: "left", font: "inherit", color: "inherit",
        background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)",
        borderRadius: "var(--radius-lg)", cursor: onClick ? "pointer" : "default", ...style }} {...rest}>
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-3)",
        background: "var(--surface-sunken)", borderRadius: "var(--radius-md)" }}>
        <img src={image} alt={`${code} QR 코드`} style={{ width: "100%", maxWidth: 140, aspectRatio: "1 / 1", display: "block" }} />
      </div>
      <strong style={{ fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)",
        lineHeight: 1.4, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
        {title}
      </strong>
      <span style={{ fontSize: "var(--fs-label)", color: "var(--brand-primary)", fontVariantNumeric: "tabular-nums" }}>
        {code}
      </span>
      {badges ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>{badges}</div>
      ) : null}
    </Tag>
  );
}

export default QrCard;
