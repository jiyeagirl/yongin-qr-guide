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
   목록에서 지워버리면 "그 축제 언제였지"를 확인할 방법이 없어진다.

   ── 거리 0 일 때 "우리 상점가"라고 쓰지 않는다 (2026-08-18) ─────────────────
   QR 지점이 그 구역 안이면 거리가 0 이라 숫자를 적을 수 없다. 전에는 그 자리에
   "우리 상점가"라고 적었는데, **"우리"가 누구인지 화면 어디에도 없다.** 이 서비스는
   회원가입이 없고 소속도 없다 — 안내판을 찍고 들어온 사람에게 상인회 쪽 말버릇이
   그대로 나간 셈이었다 (코드 주석과 명세서의 U-FT-03 에서 쓰는 말이다).

   대신 "지금 계신 곳"이라고 쓴다. 설명이 필요 없는 말이고, 상단 띠가 말하는 QR 지점과
   같은 것을 가리킨다. 그 줄을 읽은 사람은 여기서 한 번 더 배울 것이 없다. */

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
      tag={<Badge size="sm" tone={STATE_TONE[f.state] || "neutral"}>{f.state}</Badge>}
      meta={<>
        {f.date}
        {/* 상점가명과 거리는 한 줄로 내린다 — 날짜와 같은 줄에 넣으면 넷이 붙어 읽히지 않는다 */}
        <span style={{ display: "block" }}>{f.districtName} · {f.dist === 0 ? "지금 계신 곳" : km}</span>
      </>}
      style={done ? { opacity: 0.62, ...style } : style}
      {...rest} />
  );
}
