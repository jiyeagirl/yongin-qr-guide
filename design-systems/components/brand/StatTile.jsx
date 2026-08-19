import React from "react";
import { Icon } from "../core/Icon.jsx";

/* A single number told plainly — used on dashboards and program status screens.
 *
 * ── deltaTone (2026-08-19) ──────────────────────────────────────────────────
 * 증감 줄이 언제나 초록이었다. 첫 실사용처인 관리자 대시보드(A-DB-01)에서 그것이
 * 문제가 됐다 — 스캔 수가 줄어든 날에도 초록으로 "잘 되고 있다"고 말하게 된다.
 * 색이 방향을 말하는 유일한 수단이면 안 되므로(색만으로 정보를 전하지 않는다),
 * delta 문자열에는 부호나 낱말이 함께 들어가야 하고 색은 그것을 거들 뿐이다.
 *
 * 문자열에서 부호를 짐작하지 않는다. "어제 대비 +12%" 처럼 앞에 말이 붙는 경우가
 * 흔해서 규칙이 금방 어긋난다 — 부르는 쪽이 명시한다.
 */
export function StatTile({ label, value, unit, icon, tone = "plain", delta, deltaTone = "up", style, ...rest }) {
  const dark = tone === "dark";
  const deltaColor = deltaTone === "down"
    ? (dark ? "var(--yong-red-100)" : "var(--state-danger)")
    : deltaTone === "flat"
      ? (dark ? "rgba(255,255,255,.72)" : "var(--text-muted)")
      : (dark ? "var(--yong-green-300)" : "var(--yong-green-700)");
  return (
    <div style={{ padding: "var(--space-4)", borderRadius: "var(--radius-card)", background: dark ? "var(--surface-dark)" : tone === "brand" ? "var(--surface-brand-soft)" : "var(--surface-card)", border: dark ? "none" : "var(--stroke-hairline) solid var(--border-default)", boxShadow: dark ? "none" : "var(--shadow-card)", ...style }} {...rest}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {icon ? <Icon name={icon} size={18} color={dark ? "var(--yong-green-300)" : "var(--brand-secondary)"} /> : null}
        <span style={{ font: "var(--type-caption)", color: dark ? "rgba(255,255,255,.72)" : "var(--text-muted)" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: "var(--fw-semibold)", fontSize: 24, lineHeight: 1.15, letterSpacing: "var(--ls-tight)", color: dark ? "var(--yong-white)" : "var(--text-heading)" }}>{value}</span>
        {unit ? <span style={{ font: "var(--type-caption)", color: dark ? "rgba(255,255,255,.72)" : "var(--text-muted)" }}>{unit}</span> : null}
      </div>
      {delta ? <div style={{ marginTop: 6, font: "var(--type-micro)", color: deltaColor }}>{delta}</div> : null}
    </div>
  );
}
