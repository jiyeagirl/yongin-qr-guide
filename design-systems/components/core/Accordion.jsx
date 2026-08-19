import React from "react";
import { Icon } from "./Icon.jsx";

/* 접었다 펴는 목록. S09 축제 상세의 프로그램 표가 처음 쓴다 (U-FT-02).
 *
 * ── 왜 아코디언인가 ────────────────────────────────────────────────────
 * 축제 프로그램은 3~4개인데 각각 설명이 두 줄씩 붙는다. 전부 펼쳐 두면 상세 화면이
 * 프로그램 설명으로만 한 화면을 넘겨, 그 아래 장소·부스·고지가 스크롤 밖으로 밀린다.
 * 반대로 요약만 적으면 "몇 시에 뭘 하나"를 알 수 없다. 시간과 제목은 늘 보이고
 * 설명만 접는다.
 *
 * ── 처음에는 **전부 닫혀 있다** (2026-08-19 변경) ────────────────────────────
 * 전에는 첫 항목이 펼쳐진 채로 시작했다(defaultOpen=0). "전부 접혀 있으면 눌러서 펴는
 * 것이 있다는 사실 자체가 전달되지 않는다"는 이유였는데, 대신 **목록의 첫 줄만 다른
 * 물건처럼** 보였다 — 나머지는 접힌 제목 한 줄인데 첫 줄만 본문을 달고 있어서, 훑는 눈이
 * "이 항목이 특별한가" 하고 한 번 걸린다. 실제로는 그냥 첫 번째일 뿐이다.
 *
 * 펼 수 있다는 신호는 줄마다 붙은 꺾쇠가 준다. 그것으로 부족하다면 고쳐야 할 것은
 * 열린 항목 하나가 아니라 꺾쇠다. 특정 항목을 펴야 할 이유가 생기면(진행 중인 시간대
 * 등) 그때 `defaultOpen` 으로 지정한다 — 기본값이 아니라 결정으로.
 *
 * <details>/<summary> 를 쓰지 않은 이유: 열림 상태를 부모가 알아야 하는 경우가 곧 온다
 * (S09 에서 진행 중인 시간대를 자동으로 펴는 것). 지금은 내부 상태로 두되
 * defaultOpen 으로 초기값만 받는다.
 *
 * 고정 높이를 주지 않는다 — 2차 글자 확대에서 설명이 길어지면 그만큼 늘어난다 (U-CM-14).
 */
export function Accordion({ items = [], defaultOpen = null, style, ...rest }) {
  const [open, setOpen] = React.useState(() => new Set(defaultOpen == null ? [] : [defaultOpen]));
  if (!items.length) return null;

  const toggle = i => setOpen(prev => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  return (
    <div style={{ background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)",
      borderRadius: "var(--radius-card)", overflow: "hidden", ...style }} {...rest}>
      {items.map((it, i) => {
        const isOpen = open.has(i);
        return (
          <div key={it.title + i} style={{ borderTop: i ? "var(--stroke-hairline) solid var(--border-default)" : "none" }}>
            <button type="button" onClick={() => toggle(i)} aria-expanded={isOpen}
              style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)", width: "100%",
                minHeight: "var(--tap-comfortable)", padding: "var(--space-3) var(--space-4)",
                background: "none", border: "none", cursor: "pointer", textAlign: "left",
                fontFamily: "var(--font-sans)" }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                {/* 시간(meta)은 제목 위에 둔다 — 축제에서 먼저 훑는 축이 시간이다 */}
                {it.meta ? (
                  <span style={{ display: "block", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-semibold)",
                    color: "var(--brand-primary)", lineHeight: "var(--lh-caption)" }}>{it.meta}</span>
                ) : null}
                <span style={{ display: "block", fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)",
                  color: "var(--text-heading)", lineHeight: 1.4, wordBreak: "keep-all" }}>{it.title}</span>
              </span>
              <Icon name="chevron-down" size={20} color="var(--yong-ink-300)"
                style={{ marginTop: 2, transform: isOpen ? "rotate(180deg)" : "none",
                  transition: "transform var(--dur-fast) var(--ease-standard)" }} />
            </button>
            {isOpen && it.body ? (
              <div style={{ padding: "0 var(--space-4) var(--space-4)", fontSize: "var(--fs-body)",
                color: "var(--text-body)", lineHeight: "var(--lh-body)", wordBreak: "keep-all" }}>
                {it.body}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
