import React from "react";
import { ListRow } from "../core/ListRow.jsx";
import { SectionHeader } from "../core/SectionHeader.jsx";
import { FacilityIcon } from "../core/FacilityIcon.jsx";

/* 인근 편의시설 (U-ST-07). 명세는 이것을 **상점가 상세와 점포 상세 양쪽 하단**에 요구한다.
   S03 상점가 탭 시트(DistrictSheet)에 인라인으로 있던 블록을 여기로 옮겼다 — 같은 것이
   두 벌 있으면 한쪽만 고쳐지고, 두 화면이 같은 시설을 다르게 말하게 된다.

   목록에 넣는 시설은 화면이 고른다. 지금은 유형별 최근접 1건씩(data/facilities.js 의 NEARBY)
   이며, 공공시설 탭과 같은 원본에서 뽑으므로 두 탭이 같은 시설을 다른 거리로 말하지 않는다.

   행을 FacilityRow 가 아니라 ListRow 로 짜는 이유: 여기는 "가는 곳"이 아니라 "곁에 뭐가 있는지"를
   알리는 자리다. FacilityRow 의 거리·유형 배지·개방시간까지 붙이면 네 줄짜리 보조 정보가
   본문보다 무거워진다. 상세 위치 한 줄이면 충분하고, 누르면 그 시설의 상세로 간다. */
export function NearbyFacilities({ items = [], title = "인근 편의시설", note, onPick, style, ...rest }) {
  if (!items.length) return null;

  return (
    <section style={style} {...rest}>
      <SectionHeader title={title} note={note} />
      <div style={{ background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)",
        borderRadius: "var(--radius-card)", padding: "var(--space-2) var(--space-4)" }}>
        {items.map((n, i) => (
          <ListRow key={n.id} icon={<FacilityIcon type={n.type} size={22} />} title={n.name} meta={n.detail}
            divider={i < items.length - 1} onClick={onPick ? () => onPick(n) : undefined} />
        ))}
      </div>
    </section>
  );
}
