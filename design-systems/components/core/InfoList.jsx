import React from "react";

/* 라벨–값 정보 표. 상세 화면에서 "운영시간 / 상세 위치 / 부가정보" 같은 항목을 늘어놓는 자리다.
   S05 시설 상세가 처음 쓰고 S06 점포 상세와 이후 S09 축제 상세가 같은 것을 쓴다.

   ── 표(table)가 아니라 행 묶음인 이유 ──────────────────────────────────
   라벨 폭을 고정하면 "부가정보" 같은 네 글자와 "운영시간" 이 맞춰지는 대신,
   2차 글자 확대에서 값이 좁은 열에 갇혀 다섯 줄로 접힌다. 라벨을 값 위에 얹고
   각 행이 내용만큼 늘어나게 둔다 (U-CM-14 고정 높이 금지).

   값이 비어 있는 항목은 렌더하지 않는다 — "부가정보: —" 는 정보가 아니라 잡음이다.
   화면에서 조건문을 쓰는 대신 여기서 걸러낸다. */

export function InfoList({ items = [], style, ...rest }) {
  const rows = items.filter(it => it && it.value != null && it.value !== "");
  if (!rows.length) return null;

  return (
    <dl style={{ background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)",
      borderRadius: "var(--radius-card)", padding: "var(--space-2) var(--space-4)", ...style }} {...rest}>
      {rows.map((it, i) => (
        <div key={it.label} style={{ display: "flex", flexDirection: "column", gap: 2,
          minHeight: "var(--tap-comfortable)", justifyContent: "center", padding: "var(--space-3) 0",
          borderBottom: i < rows.length - 1 ? "var(--stroke-hairline) solid var(--border-default)" : "none" }}>
          <dt style={{ fontSize: "var(--fs-caption)", fontWeight: "var(--fw-semibold)", color: "var(--text-muted)",
            lineHeight: "var(--lh-caption)" }}>{it.label}</dt>
          <dd style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: "var(--lh-body)" }}>
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
