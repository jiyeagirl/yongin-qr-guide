import React from "react";
import { Icon } from "./Icon.jsx";
import { Switch } from "./Switch.jsx";

/* 온누리 가맹 토글 (U-ST-11). 업종 칩과 분리된 단독 스위치다.
   수백 개 중 가맹점만 걸러내는 핵심 동작이고 데이터 신뢰도도 가장 높으므로
   칩 목록 안에 8번째 칩으로 섞지 않는다.

   S07 기준: 이 줄은 스크롤과 함께 올라간다(고정하지 않는다). 켜진 상태로 스크롤되어
   사라지면 FilterBar 의 활성 필터 pill 이 대신 상태를 알린다. */
export function OnnuriToggle({ checked, onChange, count, label = "온누리 가맹점만", compact = false, elevated = false, style, ...rest }) {
  /* compact: 업종 칩 줄 왼쪽에 고정으로 붙는 형태. 칩과 나란히 놓이지만 여전히 칩이 아니다 —
     스위치 UI 를 유지하고, 칩 스크롤 컨테이너 바깥에 있어 함께 흐르지 않는다 (U-ST-11).
     세로 공간을 한 줄 아낀다. 개수는 시트 헤더가 이미 "온누리 139곳"으로 알려주므로 생략한다. */
  if (compact) {
    return (
      <button type="button" onClick={() => onChange && onChange(!checked)}
        aria-pressed={checked} aria-label={label}
        style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 6,
          minHeight: 34, padding: "0 8px 0 10px", borderRadius: "var(--radius-pill)", cursor: "pointer",
          background: checked ? "var(--state-info-soft)" : "var(--surface-card)",
          border: "var(--stroke-hairline) solid " + (checked ? "var(--brand-secondary)" : "var(--border-strong)"),
          boxShadow: elevated ? "var(--shadow-card)" : "none",
          fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-bold)",
          color: checked ? "var(--yong-teal-900)" : "var(--text-body)", whiteSpace: "nowrap",
          transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)", ...style }}
        {...rest}>
        <Icon name="ticket" size={15} color={checked ? "var(--brand-secondary)" : "var(--text-muted)"} />
        온누리
        {/* 축소판 스위치 — 켜짐/꺼짐이 색뿐 아니라 형태로도 드러나야 한다 (색약 대응) */}
        <span aria-hidden="true" style={{ width: 26, height: 16, borderRadius: 999, padding: 2, display: "inline-flex",
          justifyContent: checked ? "flex-end" : "flex-start",
          background: checked ? "var(--brand-secondary)" : "var(--yong-ink-200)",
          transition: "background var(--dur-base) var(--ease-standard)" }}>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: "var(--yong-white)" }} />
        </span>
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)",
      minHeight: "var(--tap-min)", padding: "var(--space-1) 0", ...style }} {...rest}>
      <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6,
        fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)", fontWeight: "var(--fw-bold)",
        color: "var(--text-heading)", lineHeight: 1.4 }}>
        <Icon name="ticket" size={17} color="var(--brand-secondary)" />
        {label}
        {count != null ? (
          <span style={{ fontSize: "var(--fs-micro)", fontWeight: "var(--fw-medium)", color: "var(--text-muted)" }}>{count}곳</span>
        ) : null}
      </span>
      <Switch checked={checked} onChange={onChange} aria-label={label} />
    </div>
  );
}
