import React from "react";
import { Icon } from "../core/Icon.jsx";

/* 잠깐 떴다 사라지는 알림.
 *
 * ── 한 줄에 들어가는 크기로 (2026-08-18 개정) ─────────────────────────────
 * 상하 여백 12px · 글자 16px 로 48px 가까이 됐던 것을 두 번에 걸쳐 줄였다.
 * 지금은 여백 6px · 글자 14px(--fs-label) · 아이콘 16 으로 31px 남짓이다.
 *
 * **글자를 16px 로 지켰다가 내렸다.** 처음에는 "세로를 줄이자고 글자를 건드리면 가장
 * 급하게 읽어야 할 문장이 가장 작아진다"고 봤는데, 실제로 일어난 일은 그 반대였다 —
 * 16px 로는 두 줄짜리 토스트가 흔했고, **두 줄이 되는 순간 아래 탭바까지 덮었다.**
 * 2.2초 뒤에 사라지는 알림이 화면 아래 3분의 1을 가리면 읽히기 전에 방해가 먼저 된다.
 * 14px 은 이 시스템에서 배지(12px)보다 크고 본문(16px)보다 한 단계 작은 값이라,
 * 흘려보내는 알림이 앉기에 맞는 자리다. 대신 **문구를 짧게 쓰는 것**이 화면 쪽 책임이다.
 *
 * 줄바꿈은 막지 않는다 (nowrap 금지). 긴 오류 문장이나 2차 글자 확대에서는 두 줄이 되며
 * 늘어나야 한다 — 여기서 잘라내면 읽을 수 없는 알림이 된다 (U-CM-14).
 *
 * 바탕은 rgba(22,34,28,.82) — 이전 .92 보다 조금 더 비친다. 완전히 불투명하면 아래
 * 지도와 목록이 통째로 가려져 "화면이 바뀌었나" 싶고, 너무 비치면 글자가 배경에 묻는다.
 */
export function Toast({ children, tone = "dark", icon = "circle-check", style, ...rest }) {
  const dark = tone === "dark";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: "var(--radius-pill)", zIndex: "var(--z-toast)",
      background: dark ? "rgba(22,34,28,.82)" : "var(--brand-primary)", color: dark ? "var(--text-on-dark)" : "var(--text-on-brand)",
      fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", lineHeight: 1.35,
      boxShadow: "var(--shadow-raised)", animation: "yong-pop var(--dur-base) var(--ease-bounce)", ...style }} {...rest}>
      <Icon name={icon} size={16} style={{ flex: "0 0 auto" }} />
      {children}
    </div>
  );
}
