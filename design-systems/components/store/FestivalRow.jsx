import React from "react";
import { ListRow } from "../core/ListRow.jsx";
import { Icon } from "../core/Icon.jsx";
import { Badge } from "../core/Badge.jsx";

/* 축제 목록의 한 행 (U-DC-01, U-FT-01). 둘러보기 탭 최상단 섹션이 쓴다.
   `FestivalBanner` 와 짝을 이룬다 — 배너는 "우리 상점가 축제 1건"(U-FT-03),
   이 행은 "32개소 전체 축제 목록"이다. 범위가 다르므로 생김새도 달라야 한다.

   상점가명과 거리를 반드시 병기한다 (U-DC-01). 둘러보기 탭에서 축제만 범위가 32개소 전체라,
   이 두 가지가 없으면 바로 아래 "우리 상점가" 섹션들과 같은 범위로 읽힌다.
   명세서 0장의 예시 표기가 그대로 여기 들어간다: "10월 24일 남사한숲 상점가, 12km".

   종료된 축제도 숨기지 않는다 (U-FT-01 이 세 상태 구분을 요구한다). 대신 흐리게 낮춘다 —
   목록에서 지워버리면 "그 축제 언제였지"를 확인할 방법이 없어진다. */

const STATE_TONE = { 진행중: "success", 예정: "accent", 종료: "neutral" };

export function FestivalRow({ festival, onClick, divider = true, style, ...rest }) {
  const f = festival;
  const done = f.state === "종료";
  const km = f.dist >= 1000 ? `${(f.dist / 1000).toFixed(1)}km` : `${f.dist}m`;

  return (
    <ListRow
      onClick={onClick}
      divider={divider}
      icon={<Icon name="party-popper" size={22} color={done ? "var(--text-disabled)" : "var(--yong-cream-900)"} />}
      title={f.name}
      tag={<Badge tone={STATE_TONE[f.state] || "neutral"}>{f.state}</Badge>}
      meta={<>
        {f.date}
        {/* 상점가명과 거리는 한 줄로 내린다 — 날짜와 같은 줄에 넣으면 넷이 붙어 읽히지 않는다 */}
        <span style={{ display: "block" }}>{f.districtName} · {f.dist === 0 ? "우리 상점가" : km}</span>
      </>}
      style={done ? { opacity: 0.62, ...style } : style}
      {...rest} />
  );
}
