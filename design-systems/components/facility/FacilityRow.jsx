import React from "react";
import { ListRow } from "../core/ListRow.jsx";
import { Badge } from "../core/Badge.jsx";
import { FacilityIcon, FACILITY_LABELS, EMERGENCY } from "../core/FacilityIcon.jsx";

/* 공공시설 목록의 한 행 (U-FC-02 / U-FC-04 / U-FC-06). 점포 쪽 StoreRow 와 짝을 이룬다.
   같은 ListRow 위에 올라가므로 두 탭의 목록이 서로 다른 물건처럼 보이지 않는다.

   유형 배지를 다는 이유: 지도 핀은 색으로만 4종을 구분하는데(5-2 스타일 규칙),
   색만으로는 색약 사용자가 AED 와 대피소를 가르지 못한다. 목록에서는 글자로 한 번 더 적는다
   (기능명세서 6장 남은 확인사항 #1 의 "핀 색상 외 보조 구분").

   거리는 QR 지점 기준 직선거리다. 목록 단계에서 경로 API 를 호출하지 않는다 (U-FC-06).
   고정 높이를 주지 않는다 — 시설명이나 상세 위치가 두 줄이 되면 행이 늘어난다 (U-CM-14). */
export function FacilityRow({ facility, onClick, selected = false, divider = true, walkMPerMin = 67, style, ...rest }) {
  const f = facility;
  const walk = Math.max(1, Math.round(f.dist / walkMPerMin));
  const urgent = EMERGENCY.includes(f.type);

  /* 1,000m 를 넘으면 m 대신 km 로 적는다. "약 1400m"는 읽는 순간 크기 감이 오지 않는다 */
  const distance = f.dist >= 1000 ? `약 ${(f.dist / 1000).toFixed(1)}km` : `약 ${f.dist}m`;

  return (
    <ListRow
      onClick={onClick}
      divider={divider}
      icon={<FacilityIcon type={f.type} size={22} />}
      title={f.name}
      tag={<Badge tone={urgent ? "danger" : "info"}>{FACILITY_LABELS[f.type] || "공공시설"}</Badge>}
      /* 첫 줄은 거리, 둘째 줄은 "가서 실제로 쓸 수 있는가" — 상세 위치와 개방 시간.
         AED 가 잠긴 건물 안에 있으면 거리보다 그게 먼저 필요한 정보다 (U-FC-05 의 개방 여부) */
      meta={<>
        {distance}, 도보 {walk}분
        <span style={{ display: "block" }}>{f.detail}{f.hours ? ` · ${f.hours}` : ""}</span>
      </>}
      style={selected
        ? { background: "var(--surface-selected)", borderRadius: "var(--radius-sm)",
            paddingLeft: "var(--space-2)", paddingRight: "var(--space-2)", ...style }
        : style}
      {...rest} />
  );
}
