import React from "react";
import { Icon } from "./Icon.jsx";

/* action 은 누를 수 있는 것(더보기 등)이고 note 는 누를 수 없는 설명이다.
   설명을 action 자리에 넣으면 꺾쇠가 붙어 링크처럼 보인다.

   note 가 실제로 필요해진 자리: 둘러보기 탭(S04)은 섹션마다 **데이터 범위가 다르다** —
   축제와 다른 상점가는 32개소 전체, 신규·인기 매장과 코스는 현재 상점가뿐이다.
   그 범위를 머리말 오른쪽에 글자로 적지 않으면 네 섹션이 모두 한 상점가 이야기로 읽힌다. */
export function SectionHeader({ title, note, action, onAction, style, ...rest }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", marginBottom: "var(--space-3)", ...style }} {...rest}>
      <h3 style={{ font: "var(--type-title-3)", letterSpacing: "var(--ls-snug)", minWidth: 0 }}>{title}</h3>
      {action ? (
        <button onClick={onAction} style={{ display: "inline-flex", alignItems: "center", gap: 2, background: "none", border: "none", padding: 0, font: "var(--type-caption)", color: "var(--text-muted)", cursor: "pointer" }}>
          {action}
          {/* Lucide 는 kebab-case 다. chevron_right 로 적혀 있어 아이콘이 비어 있었다 */}
          <Icon name="chevron-right" size={16} />
        </button>
      ) : note ? (
        <span style={{ flex: "0 1 auto", minWidth: 0, textAlign: "right", font: "var(--type-caption)",
          color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note}</span>
      ) : null}
    </div>
  );
}
