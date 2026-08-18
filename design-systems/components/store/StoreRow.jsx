import React from "react";
import { ListRow } from "../core/ListRow.jsx";
import { CategoryIcon } from "../core/CategoryIcon.jsx";
import { OnnuriBadge } from "../core/OnnuriBadge.jsx";

/* 개별 점포 목록의 한 행 (U-ST-04, U-ST-06). S07 목록과 S09 코스 목록이 같은 행을 쓴다.
   거리는 QR 지점 기준 직선거리다. 목록 단계에서 경로 API 를 호출하지 않는다 (U-FC-06 과 같은 규칙).
   고정 높이를 주지 않는다 — 업체명이 두 줄이 되면 행이 늘어난다. */
export function StoreRow({ store, onClick, selected = false, divider = true, style, ...rest }) {
  const walk = Math.max(1, Math.round(store.dist / 67)); /* 도보 67m/분 */
  return (
    <ListRow
      onClick={onClick}
      divider={divider}
      icon={<CategoryIcon type={store.cat} size={22} />}
      title={store.name}
      tag={store.onnuri ? <OnnuriBadge size="sm" /> : null}
      meta={`${store.biz} · 약 ${store.dist}m, 도보 ${walk}분 · ${store.addr}`}
      style={selected ? { background: "var(--brand-primary-soft)", borderRadius: "var(--radius-sm)", paddingLeft: "var(--space-2)", paddingRight: "var(--space-2)", ...style } : style}
      {...rest} />
  );
}
