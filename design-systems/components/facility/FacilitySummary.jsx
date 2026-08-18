import React from "react";
import { Icon } from "../core/Icon.jsx";
import { FacilityIcon, FACILITY_LABELS, SAFETY } from "../core/FacilityIcon.jsx";

/* 공공시설 탭 시트 헤더 (U-FC-02 / U-FC-04). 상점가 쪽 DistrictSummary 와 짝을 이룬다.
   시트를 접어도(25% 스냅) 이 줄까지는 보이므로, 접힌 상태에서 답해야 할 두 가지만 담는다.

     1) 이 목록이 무엇을 기준으로 줄 세워졌는가  → QR 지점 기준 직선거리, 가까운 순
     2) 안전시설이 몇 곳 있는가                 → AED · 대피소 · 쉼터(무더위쉼터)

   유형별 개수는 지도 위 칩 줄에도 있지만 거기엔 5종이 나란히 있어 안전시설이 묻힌다.
   U-FC-04 의 "안전시설 우선 노출"은 목록 순서만이 아니라 이 헤더에서도 지켜야 한다.
   반대로 화장실 개수는 여기서 반복하지 않는다 — 칩에 이미 있고, 급한 정보가 아니다.
   센다는 대상은 목록 섹션과 반드시 같아야 한다(SAFETY). 헤더와 섹션이 다른 것을 세면
   "안전시설 8곳"이라 적혀 있는데 그 아래 섹션에는 11줄이 있는 상태가 된다. */
export function FacilitySummary({ counts = {}, basis = "QR 스캔 지점 기준 직선거리 · 가까운 순", style, ...rest }) {
  const safety = SAFETY.filter(t => counts[t] > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", ...style }} {...rest}>
      <p style={{ display: "flex", alignItems: "center", gap: 6,
        fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.45 }}>
        <Icon name="map-pin" size={15} color="var(--text-muted)" />
        {basis}
      </p>
      {safety.length ? (
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2) var(--space-4)" }}>
          {safety.map(t => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
              fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", color: "var(--text-body)" }}>
              <FacilityIcon type={t} size={18} />
              {FACILITY_LABELS[t]}
              <b style={{ color: "var(--text-heading)", fontWeight: "var(--fw-bold)" }}>{counts[t]}</b>곳
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
