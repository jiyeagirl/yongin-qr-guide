import React from "react";
import { ListRow } from "../core/ListRow.jsx";
import { Icon } from "../core/Icon.jsx";
import { Badge } from "../core/Badge.jsx";
import { OnnuriBadge } from "../core/OnnuriBadge.jsx";

/* 다른 상점가 목록의 한 행 (U-DC-04, U-ST-14). 둘러보기 탭 최하단이 쓴다.
   `StoreRow`(점포) · `FacilityRow`(시설) 와 같은 `ListRow` 위에 올라간다 —
   세 목록이 서로 다른 물건처럼 보이면 탭을 옮길 때마다 읽는 법을 새로 배워야 한다.

   상점가는 점이 아니라 구역이므로(확정 결정사항 6) 거리는 "구역까지"의 근사값이다.
   점포 수와 온누리 가맹 수를 함께 적는 이유: 상점가를 고르는 기준이 이름이 아니라 규모와
   온누리 사용 가능 여부이기 때문이다.

   ── festivalTag ────────────────────────────────────────────────────────────
   축제가 걸린 곳에 [축제] 배지를 달지 여부다. 기본은 단다 — S03-E 의 "가볼 만한 상점가"
   처럼 **축제 정보가 그 화면에 따로 없는 자리**에서는 그것이 갈 이유가 되기 때문이다.

   반대로 둘러보기 탭에서는 끈다 (2026-08-18). 그 탭은 맨 위 섹션이 통째로 축제이고
   [전체보기]까지 붙어 있어서, 맨 아래 목록의 배지는 같은 사실을 세 번째로 말한다.
   배지가 눌리는 것도 아닌데 알약 모양이라 필터처럼 읽히기까지 했다.

   ── external ───────────────────────────────────────────────────────────────
   줄을 누르면 용인시 누리집의 그 상점가 안내 페이지로 나간다 (2026-08-18).
   우리에게는 다른 상점가의 점포 목록도 지도도 없다 — 있는 것은 이름·규모·거리뿐이라
   앱 안에서 열어봐야 이 줄에 이미 적힌 것을 한 번 더 보게 된다. 상점가 소개·연혁·연락처는
   시가 이미 관리하고 있으므로 그리로 보낸다 (축제 상세의 "주최 상점가" 줄과 같은 판단).

   **바깥으로 나간다는 것을 숨기지 않는다** — 새 창으로 열고, 꺾쇠 앞에 "상세 페이지"라고
   작게 적고, 보조기기에는 aria-label 로 한 번 더 말한다. 같은 앱 안의 화면인 줄 알고
   눌렀다가 브라우저가 바뀌면 되돌아오는 길을 스스로 찾아야 한다. */
export function DistrictRow({ district, onClick, selected = false, divider = true,
  festivalTag = true, external = false, style, ...rest }) {
  const d = district;
  const km = d.dist >= 1000 ? `${(d.dist / 1000).toFixed(1)}km` : `${d.dist}m`;
  const flag = festivalTag && d.festival;
  const href = external && d.homepage ? d.homepage : null;

  return (
    <ListRow
      onClick={onClick}
      href={href}
      aria-label={href ? `${d.name} 상세 페이지 — 용인시 누리집에서 새 창으로 열림` : undefined}
      divider={divider}
      /* 배지를 끄면 아이콘 색도 함께 되돌린다 — 배지 없이 색만 남기면 이름표 없는
         색 신호가 되어 색으로만 뜻을 전하는 꼴이 된다 */
      icon={<Icon name="store" size={22} color={flag ? "var(--yong-cream-900)" : "var(--text-muted)"} />}
      title={d.name}
      tag={flag ? <Badge tone="accent" dot>축제</Badge> : null}
      meta={<>
        {d.gu} {d.area} · {km}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginLeft: 6 }}>
          점포 {d.stores}곳
          {/* 온누리 가맹수를 모르는 곳이 있다 (시 안내에 그 수가 없다). 0 곳으로 적으면
              "가맹점이 없다"는 다른 말이 되므로, 모를 때는 배지째 내린다 */}
          {d.onnuri != null ? <>
            <OnnuriBadge size="sm" />
            {d.onnuri}곳
          </> : null}
        </span>
      </>}
      /* 바깥 링크일 때만 꺾쇠 앞에 이름표를 붙인다. 꺾쇠 하나로는 앱 안의 다른 줄들과
         구분되지 않아, 새 창이 뜨고 나서야 나갔다는 것을 알게 된다 */
      trailing={href ? (
        <span style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 2, marginTop: 3 }}>
          <span style={{ fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>상세 페이지</span>
          <Icon name="chevron-right" size={20} color="var(--yong-ink-300)" />
        </span>
      ) : "chevron"}
      /* 지도에서 상점가 마커를 탭했을 때 목록의 같은 줄이 함께 켜진다 (점포·시설과 같은 규칙) */
      style={selected
        ? { background: "var(--brand-primary-soft)", borderRadius: "var(--radius-sm)",
            paddingLeft: "var(--space-2)", paddingRight: "var(--space-2)", ...style }
        : style}
      {...rest} />
  );
}
