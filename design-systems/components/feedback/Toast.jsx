import React from "react";
import { Icon } from "../core/Icon.jsx";

/* 잠깐 떴다 사라지는 알림.
 *
 * ── 세로를 얇게 (2026-08-18) ───────────────────────────────────────────────
 * 상하 여백이 12px 이라 48px 가까이 됐다. 토스트는 읽고 흘려보내는 것이고 바로 아래가
 * 탭바라, 두꺼우면 화면 아래쪽을 꽤 오래 덮는다. 여백을 8px 로 줄이고 아이콘도 한 단계
 * 낮춰 40px 아래로 떨어뜨렸다.
 *
 * **글자는 16px 그대로 둔다.** 세로를 줄이자고 여기를 건드리면 대상(고령층 포함)이
 * 가장 급하게 읽어야 할 문장이 가장 작아진다. 높이는 여백에서만 덜어낸다.
 *
 * 바탕은 rgba(22,34,28,.82) — 이전 .92 보다 조금 더 비친다. 완전히 불투명하면 아래
 * 지도와 목록이 통째로 가려져 "화면이 바뀌었나" 싶고, 너무 비치면 글자가 배경에 묻는다.
 */
export function Toast({ children, tone = "dark", icon = "circle-check", style, ...rest }) {
  const dark = tone === "dark";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "8px 14px", borderRadius: "var(--radius-pill)", zIndex: "var(--z-toast)",
      background: dark ? "rgba(22,34,28,.82)" : "var(--brand-primary)", color: dark ? "var(--text-on-dark)" : "var(--text-on-brand)",
      fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)", lineHeight: 1.35,
      boxShadow: "var(--shadow-raised)", animation: "yong-pop var(--dur-base) var(--ease-bounce)", ...style }} {...rest}>
      <Icon name={icon} size={18} />
      {children}
    </div>
  );
}
