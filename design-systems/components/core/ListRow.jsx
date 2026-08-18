import React from "react";
import { Icon } from "./Icon.jsx";

/* One row of a facility / store / notice list. Variable height — never a fixed px height.
 *
 * ── href ─────────────────────────────────────────────────────────────────────
 * 줄 전체가 바깥 주소로 나가는 링크일 때만 쓴다 (둘러보기 탭의 상점가 목록 → 용인시
 * 누리집). `<div onClick>` 으로 흉내내지 않는다 — 앵커라야 길게 누르기·새 탭으로 열기가
 * 살아 있고, 보조기기가 "링크"라고 읽어준다. 앱 안의 다른 화면으로 가는 줄은 지금까지처럼
 * `onClick` 을 쓴다: 해시 라우터가 받는 이동이라 주소가 없다. */
export function ListRow({ title, meta, tag, icon, trailing = "chevron", divider = true, onClick, href, style, ...rest }) {
  const Tag = href ? "a" : "div";
  const link = href ? { href, target: "_blank", rel: "noopener noreferrer" } : null;
  return (
    <Tag onClick={onClick} {...link} style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)", minHeight: "var(--tap-comfortable)",
      padding: "var(--space-3) 0", borderBottom: divider ? "var(--stroke-hairline) solid var(--border-default)" : "none",
      /* 앵커의 기본 밑줄·파란색을 걷어낸다. 줄 안의 제목·보조문이 저마다 색을 갖고 있어
         전체를 링크색으로 칠하면 목록이 다른 물건처럼 보인다 (링크라는 신호는 꺾쇠가 맡는다) */
      color: "inherit", textDecoration: "none",
      cursor: onClick || href ? "pointer" : "default", ...style }} {...rest}>
      {icon ? <span style={{ flex: "0 0 auto", paddingTop: 2, color: "var(--text-muted)" }}>{typeof icon === "string" ? <Icon name={icon} size={22} /> : icon}</span> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)", lineHeight: 1.4 }}>{title}</span>
          {tag}
        </div>
        {meta ? <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 3, lineHeight: 1.45 }}>{meta}</div> : null}
      </div>
      {trailing === "chevron" ? <Icon name="chevron-right" size={20} color="var(--yong-ink-300)" style={{ marginTop: 3 }} /> : trailing}
    </Tag>
  );
}
