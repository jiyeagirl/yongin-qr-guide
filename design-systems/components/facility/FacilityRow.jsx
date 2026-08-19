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
      /* 꺾쇠를 뗀다 (2026-08-18). 꺾쇠는 "이 줄을 누르면 다른 화면으로 간다"는 뜻인데,
         이제 줄을 누르면 **보고 있던 지도**에서 그 핀이 켜지고 카드가 뜬다 — 화면이
         바뀌지 않는다. 다른 곳으로 갈 것처럼 말해놓고 제자리에 두면 그 다음에 무엇을
         눌러야 할지 알 수 없다. 상세로 가는 길은 그 카드의 [상세 보기]가 맡고, 꺾쇠도
         거기 붙어 있다. (바깥 링크인 DistrictRow 는 그대로 꺾쇠를 단다 — 거기는
         정말로 나간다.) */
      trailing={null}
      icon={<FacilityIcon type={f.type} size={22} />}
      title={f.name}
      /* size="sm" — 점포 목록의 온누리 배지와 같은 자리, 같은 높이다 (Badge 주석 참조) */
      tag={<Badge size="sm" tone={urgent ? "danger" : "info"}>{FACILITY_LABELS[f.type] || "공공시설"}</Badge>}
      /* 첫 줄은 거리, 둘째 줄은 "어디로 가면 되는가".
         둘째 줄의 출처가 유형마다 다르다 (입력 항목 정의서 2-1~2-4). AED 는 설치 위치,
         대피소는 실제 위치(시설명)가 필수 항목이라 그것을 쓰고, 화장실·쉼터는 그런 항목이
         없어 도로명주소로 내려간다. 예전에는 네 유형 모두 `detail`(상세 위치)이라는 한
         필드를 썼는데 그것은 원천에 없는 항목이었다.
         운영시간은 쉼터에만 있다 — 있을 때만 뒤에 붙인다. */
      meta={<>
        {distance}, 도보 {walk}분
        <span style={{ display: "block" }}>
          {f.place || f.addr}{f.hours ? ` · ${f.hours}` : ""}
        </span>
      </>}
      style={selected
        ? { background: "var(--surface-selected)", borderRadius: "var(--radius-sm)",
            paddingLeft: "var(--space-2)", paddingRight: "var(--space-2)", ...style }
        : style}
      {...rest} />
  );
}
