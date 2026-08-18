import React from "react";
import { Icon } from "./Icon.jsx";

/* 정렬 기준 고르기 — 글자 + ⇅ 아이콘, 누르면 목록이 열린다 (2026-08-18).
 *
 *   [⇅ 거리순]        ← 눌리는 것은 이 한 덩어리
 *        ↓
 *   ┌──────────────┐
 *   │ ✓ 거리순      │
 *   │   인기순      │
 *   └──────────────┘
 *
 * ── 왜 분절 토글(SegmentedTabs)을 걷어냈나 ──────────────────────────────────
 * 전에는 [거리순|인기순] 두 칸짜리 알약이었다. 두 칸이 나란히 있으면 **둘 다 켤 수 있는
 * 것처럼** 보이는데(바로 옆줄의 온누리 토글이 실제로 그렇다) 정렬은 하나만 고르는 축이다.
 * 게다가 칸이 늘 때마다 가로가 늘어 결과 수("전체 335곳")를 밀어낸다 — 축제 목록(S12)은
 * 벌써 [임박순|가까운 순]으로 두 낱말이 길다.
 *
 * 지금 고른 것 하나만 적으면 줄이 짧아지고, ⇅ 가 "바꿀 수 있다"를 말한다. 고를 수 있는
 * 값은 눌러야 보이지만, 정렬은 **결과를 보고 나서** 바꾸는 축이라 미리 늘어놓을 이유가 없다.
 *
 * ── 왜 눌러서 순환(cycle)하지 않나 ─────────────────────────────────────────
 * 지금이 둘뿐이라 한 번 누르면 다른 쪽으로 넘어가게 짤 수도 있다. 그런데 그러면 무엇으로
 * 바뀌는지 눌러봐야 알고, 셋이 되는 순간 원하는 값까지 두 번 눌러야 한다. 목록을 열면
 * 후보와 지금 값이 한 번에 보인다.
 *
 * ── 접근성 ──────────────────────────────────────────────────────────────────
 * 라디오 묶음(menuitemradio)으로 읽힌다 — 하나만 골라지는 축이라는 것이 소리로도 전해진다.
 * 바깥을 누르거나 Esc 로 닫히고, 고르면 초점이 단추로 돌아온다 (열기 전 자리로 되돌린다).
 */
export function SortSelect({
  value, options = [], onChange,
  label = "정렬 기준",
  align = "right",     /* 단추가 줄 오른쪽 끝이라 목록도 오른쪽에 맞춘다 */
  style, ...rest
}) {
  const [open, setOpen] = React.useState(false);
  const wrap = React.useRef(null);
  const btn = React.useRef(null);
  const current = options.find(o => o.id === value) || options[0];

  React.useEffect(() => {
    if (!open) return undefined;
    /* pointerdown 으로 듣는다 — click 까지 기다리면 바깥의 다른 단추가 먼저 눌린다 */
    const onDown = e => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    const onKey = e => {
      if (e.key !== "Escape") return;
      setOpen(false);
      if (btn.current) btn.current.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = id => {
    setOpen(false);
    if (btn.current) btn.current.focus();
    if (id !== value && onChange) onChange(id);
  };

  if (!options.length) return null;

  return (
    <div ref={wrap} style={{ position: "relative", flex: "0 0 auto", ...style }} {...rest}>
      <button ref={btn} type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu" aria-expanded={open}
        /* 단추 글자만으로는 "거리순"이 무엇인지 알 수 없다 — 무엇을 고르는 자리인지 붙인다 */
        aria-label={`${label}: ${current ? current.label : ""}`}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          minHeight: "var(--tap-min)", padding: "0 var(--space-1) 0 var(--space-2)",
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)",
          fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-normal)",
          color: "var(--text-body)", whiteSpace: "nowrap",
        }}>
        <Icon name="arrow-up-down" size={15} color="var(--text-muted)" />
        {current ? current.label : ""}
      </button>

      {open ? (
        <div role="menu" aria-label={label}
          style={{
            position: "absolute", top: "100%", [align]: 0, marginTop: 2,
            /* 상자를 글자에 맞춘다 (2026-08-18). 140px 는 "거리순" 세 글자에 비해 헐렁해
               빈 칸이 내용처럼 보였다. 체크 자리 + 글자 + 좌우 여백이 들어갈 만큼만 준다.
               높이는 줄이지 않는다 — 한 줄이 44px(--tap-min)인 것은 손가락 자리다. */
            minWidth: 104, padding: 3,
            background: "var(--surface-card)",
            border: "var(--stroke-hairline) solid var(--border-default)",
            borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-raised)",
            /* ListControls 가 sticky(z 2)로 쌓임 맥락을 만드므로 그 안에서만 겨루면 된다.
               7단계 z 토큰은 화면 전체를 나누는 값이라 여기에 쓰지 않는다 */
            zIndex: 3,
          }}>
          {options.map(o => {
            const on = o.id === value;
            return (
              <button key={o.id} type="button" role="menuitemradio" aria-checked={on}
                onClick={() => pick(o.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, width: "100%",
                  minHeight: "var(--tap-min)", padding: "0 var(--space-2)",
                  background: on ? "var(--brand-primary-soft)" : "none",
                  border: "none", borderRadius: "var(--radius-xs)", cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)",
                  fontWeight: on ? "var(--fw-bold)" : "var(--fw-medium)",
                  color: on ? "var(--brand-primary-strong)" : "var(--text-body)",
                }}>
                {/* 체크 자리는 꺼진 줄에도 비워 둔다 — 없으면 글자가 좌우로 흔들린다.
                    고른 것을 색으로만 알리지 않는다 (색을 못 보면 어느 쪽인지 알 수 없다) */}
                <span style={{ flex: "0 0 auto", width: 15, display: "inline-flex" }}>
                  {on ? <Icon name="check" size={15} /> : null}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default SortSelect;
