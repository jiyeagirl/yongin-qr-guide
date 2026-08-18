import React from "react";
import { Icon } from "../core/Icon.jsx";
import { OnnuriBadge } from "../core/OnnuriBadge.jsx";

/* 상점가 구역 안내 (U-ST-02) + 상세 헤더의 수치 (U-ST-03).
   구역 경계는 폴리곤이 아니라 도로명주소 목록으로 판정하므로 (기능명세서 3-2)
   화면에는 "소속 구·동 + 주요 업종"을 글로 적고 지도에는 점포 마커만 찍는다.

   주의: 구역도 xlsx 의 "밀집도에 따른 기준 점포수 108개"는 지정 요건 산정용 수치이며
   실제 점포 수가 아니다. 화면에 노출하면 안 된다 (기능명세서 3-5). */
export function DistrictSummary({ district, style, ...rest }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", ...style }} {...rest}>
      {/* 소재지 한 줄만 둔다. 주요 업종은 바로 아래 업종 칩이 개수까지 붙여 더 정확하게 보여주므로
          같은 정보를 문장으로 한 번 더 적으면 헤더만 길어진다 */}
      <p style={{ display: "flex", alignItems: "center", gap: 6,
        fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.45 }}>
        <Icon name="map-pin" size={15} color="var(--text-muted)" />
        {district.area}
      </p>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2) var(--space-4)" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", color: "var(--text-body)" }}>
          점포 <b style={{ color: "var(--text-heading)", fontWeight: "var(--fw-bold)" }}>{district.stores}</b>곳
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", color: "var(--text-body)" }}>
          <OnnuriBadge size="sm" />
          <span><b style={{ color: "var(--text-heading)", fontWeight: "var(--fw-bold)" }}>{district.onnuri}</b>곳</span>
        </span>
      </div>
    </div>
  );
}
