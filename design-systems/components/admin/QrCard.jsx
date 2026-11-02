import React from "react";
import { CopyField } from "../core/CopyField.jsx";

/* QR 카드 · QR 카드 그리드 · QR 코드 판 (2026-11-02) — 관리자 QR 지점 관리.
 *
 *   ┌──────────────┐
 *   │☐  ▣ QR 그림   │
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
 * `onSelectChange` 를 주면 왼쪽 위에 체크박스가 선다 — 표의 체크박스와 같은 모양
 * (18px 네이티브, 브랜드 색)이고, 같은 선택 목록을 공유한다. 체크박스는 카드 단추
 * **바깥**의 형제다: 단추 안에 입력을 넣으면 누를 때 둘 다 반응한다.
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

export function QrCard({ image, title, code, badges, onClick, selected = false, onSelectChange, style, ...rest }) {
  const Tag = onClick ? "button" : "div";
  return (
    <div style={{ position: "relative", ...style }} {...rest}>
      <Tag type={onClick ? "button" : undefined} onClick={onClick}
        style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch",
          gap: "var(--space-2)", padding: "var(--space-4)", textAlign: "left", font: "inherit", color: "inherit",
          background: "var(--surface-card)",
          border: selected ? "var(--stroke-hairline) solid var(--brand-primary)"
            : "var(--stroke-hairline) solid var(--border-default)",
          boxShadow: selected ? "0 0 0 1px var(--brand-primary)" : "none",
          borderRadius: "var(--radius-lg)", cursor: onClick ? "pointer" : "default" }}>
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
      {onSelectChange ? (
        <input type="checkbox" checked={selected} onChange={() => onSelectChange(!selected)}
          aria-label={`${code} 선택`}
          style={{ position: "absolute", top: "var(--space-3)", left: "var(--space-3)", width: 18, height: 18,
            margin: 0, accentColor: "var(--brand-primary)", cursor: "pointer" }} />
      ) : null}
    </div>
  );
}

/* QR 코드 판 — 한 지점의 QR 을 **출력하는 자리**다 (2026-11-02, 사용자 요청).
 *
 *   ┌───────────────────────────────────────────────┐
 *   │ ┌─────┐  QR 코드  m-1                          │
 *   │ │ ▣▣▣ │  ┌ QR 주소 ─────────────────── [복사] ┐ │
 *   │ │ ▣▣▣ │  └ https://…/?qr=m-1               ┘ │
 *   │ └─────┘  [SVG 내려받기] [인쇄]                 │
 *   └───────────────────────────────────────────────┘
 *
 * 단추는 화면이 `actions` 로 넘긴다 — 자리마다 단추 차례가 다를 수 있다.
 * 복사 결과는 `onCopied` 로 올린다 (CopyField 와 같다). */
export function QrCodePanel({ image, code, url, actions, onCopied, style, ...rest }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-5)", flexWrap: "wrap",
      padding: "var(--space-4)", background: "var(--surface-sunken)",
      border: "var(--stroke-hairline) solid var(--border-default)", borderRadius: "var(--radius-lg)", ...style }} {...rest}>
      <div style={{ flex: "0 0 auto", padding: "var(--space-3)", background: "var(--surface-card)",
        borderRadius: "var(--radius-md)" }}>
        <img src={image} alt={`${code} QR 코드`} style={{ width: 120, height: 120, display: "block" }} />
      </div>
      <div style={{ flex: "1 1 280px", minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <p style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", fontSize: "var(--fs-label)",
          fontWeight: "var(--fw-bold)", color: "var(--text-heading)" }}>
          QR 코드
          <span style={{ fontWeight: "var(--fw-regular)", color: "var(--text-body)", fontVariantNumeric: "tabular-nums" }}>{code}</span>
        </p>
        <CopyField label="QR 주소" value={url} onCopied={onCopied} />
        {actions ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

export default QrCard;
