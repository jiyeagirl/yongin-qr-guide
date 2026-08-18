import React from "react";
import { Icon } from "../core/Icon.jsx";

/* Placeholder for the 카카오맵 SDK surface. Renders the anchor marker, clusters and
   pins at fake positions so overlay geometry can be judged; it is not a real map.
   bottomPad mirrors the sheet snap so a tapped marker is never hidden (spec 5-3 #2). */
export function MapCanvas({ anchorLabel = "QR 지점", clusters = [], pins = [], bottomPad = "var(--map-pad-half)", note = "지도 영역 · 카카오맵 SDK 연동 예정", style, ...rest }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: "var(--z-map)", overflow: "hidden",
      background: "repeating-linear-gradient(0deg,#e9efe9 0 1px,transparent 1px 42px),repeating-linear-gradient(90deg,#e9efe9 0 1px,transparent 1px 42px),var(--surface-sunken)", ...style }} {...rest}>
      <div style={{ position: "absolute", inset: 0, bottom: bottomPad, transition: "bottom var(--dur-slow) var(--ease-out)" }}>
        {clusters.map(c => (
          <div key={c.label} style={{ position: "absolute", left: c.x, top: c.y, transform: "translate(-50%,-50%)", zIndex: "var(--z-marker)",
            minWidth: 44, minHeight: 44, padding: "0 10px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999,
            background: "rgba(47,146,96,.92)", color: "#fff", fontSize: "var(--fs-label)", fontWeight: "var(--fw-bold)", boxShadow: "var(--shadow-raised)" }}>{c.label}</div>
        ))}
        {pins.map(p => (
          <div key={p.label} style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%,-100%)", zIndex: "var(--z-marker)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ width: 34, height: 34, borderRadius: "999px 999px 999px 2px", transform: "rotate(-45deg)", display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--surface-card)", border: `2px solid ${p.emergency ? "var(--pin-emergency)" : "var(--pin-neutral)"}`, boxShadow: "var(--shadow-card)" }}>
              <span style={{ transform: "rotate(45deg)", color: p.emergency ? "var(--pin-emergency)" : "var(--pin-neutral)", display: "flex" }}><Icon name={p.icon} size={17} /></span>
            </span>
          </div>
        ))}
        {/* QR 스캔 지점 — KakaoMap 의 앵커와 같은 형태를 쓴다 (파란 점 + 꼬리 달린 흰 말풍선).
            목업과 실지도가 다르게 생기면 목업으로 화면을 검증하는 의미가 없다 */}
        <div style={{ position: "absolute", left: "50%", top: "46%", transform: "translate(-50%,-50%)", zIndex: "var(--z-marker)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ position: "relative", padding: "5px 10px", marginBottom: 6, borderRadius: "var(--radius-sm)",
            background: "var(--surface-card)", color: "var(--text-heading)",
            border: "var(--stroke-hairline) solid var(--border-default)", boxShadow: "var(--shadow-raised)",
            fontSize: "var(--fs-micro)", fontWeight: "var(--fw-medium)", lineHeight: 1.35, whiteSpace: "nowrap" }}>
            {anchorLabel}
            <span style={{ position: "absolute", left: "50%", bottom: -5, width: 9, height: 9, marginLeft: -4.5,
              background: "var(--surface-card)",
              borderRight: "var(--stroke-hairline) solid var(--border-default)",
              borderBottom: "var(--stroke-hairline) solid var(--border-default)",
              transform: "rotate(45deg)" }} />
          </span>
          <span style={{ width: 18, height: 18, borderRadius: 999, background: "var(--pin-anchor)", border: "var(--stroke-bold) solid var(--pin-stroke)", boxShadow: "0 0 0 6px var(--pin-anchor-halo)" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: "var(--space-3)", top: "var(--space-3)", padding: "5px 10px", borderRadius: "var(--radius-xs)", background: "rgba(255,255,255,.86)", fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>{note}</div>
    </div>
  );
}
