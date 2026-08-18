import React from "react";
import { Icon } from "../core/Icon.jsx";
import { CategoryIcon } from "../core/CategoryIcon.jsx";

/* 골목 한바퀴 추천 코스 카드 (U-DC-03). 둘러보기 탭에서 가로로 흐른다.
   누르면 코스 상세(S08)로 간다 — 코스 지도와 순번 이동은 거기에 있다.

   화면에 "반경 300~500m"를 적지 않는다. 명세서가 "300~500m는 내부 로직 값이며
   사용자 필터가 아니다"라고 못박았다. 사용자가 읽어야 할 것은 **몇 분 걸리고 어디를 도는가**다.

   들르는 곳은 업종 아이콘 + 이름으로만 적는다. 주소나 거리까지 넣으면 카드가 목록이 되어
   바로 위 "신규 및 인기 매장" 레일과 구분되지 않는다.
   고정 높이를 주지 않는다 — 가장 긴 카드에 맞춰 stretch 된다 (U-CM-14). */
export function CourseCard({ course, onClick, style, ...rest }) {
  const c = course;
  return (
    <button onClick={onClick}
      style={{ flex: "0 0 auto", width: 244, display: "flex", flexDirection: "column", alignItems: "stretch",
        gap: "var(--space-2)", padding: "var(--space-4)", textAlign: "left",
        background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)",
        borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", cursor: "pointer", ...style }}
      {...rest}>

      <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--brand-primary)" }}>
        <Icon name="footprints" size={18} />
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)", fontWeight: "var(--fw-bold)" }}>
          도보 {c.minutes}분 · {c.stops.length}곳
        </span>
      </span>

      <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)",
        color: "var(--text-heading)", lineHeight: 1.35 }}>{c.name}</span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.45 }}>{c.desc}</span>

      <span style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 2,
        paddingTop: "var(--space-2)", borderTop: "var(--stroke-hairline) solid var(--border-default)" }}>
        {c.stops.map((s, i) => (
          <span key={s.id} style={{ display: "flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", color: "var(--text-body)", lineHeight: 1.4 }}>
            {/* 순번을 적는다 — 코스는 목록이 아니라 순서다 */}
            <span style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center",
              minWidth: 17, minHeight: 17, borderRadius: 999, background: "var(--brand-primary-soft)",
              color: "var(--yong-green-800)", fontSize: "var(--fs-micro)", fontWeight: "var(--fw-bold)" }}>{i + 1}</span>
            <CategoryIcon type={s.cat} size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
          </span>
        ))}
      </span>
    </button>
  );
}
