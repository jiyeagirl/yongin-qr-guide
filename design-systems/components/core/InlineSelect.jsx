import React from "react";
import { Icon } from "./Icon.jsx";

/* 줄 안에 서는 **하나만 고르는** 드롭다운 (2026-08-19. SortSelect 에서 끌어냈다).
 *
 *   [⇅ 거리순]   [⌗ QR 지점]        ← 눌리는 것은 이 한 덩어리
 *        ↓
 *   ┌──────────────┐
 *   │ ✓ 거리순      │
 *   │   인기순      │
 *   └──────────────┘
 *
 * ── 왜 Select(폼 컨트롤)가 아닌가 ───────────────────────────────────────────
 * `Select` 는 **폼의 칸**이다. 라벨이 위에 붙고 테두리가 둘리고 폭을 가득 채운다 — 신고
 * 폼처럼 여러 칸이 세로로 쌓이는 자리를 위한 모양이다. 여기가 다루는 것은 목록 위에 한
 * 줄로 얹히는 조작이라, 같은 모양을 쓰면 목록 앞에 폼이 하나 서 있는 화면이 된다.
 *
 * ── 왜 눌러서 순환(cycle)하지 않나 ─────────────────────────────────────────
 * 값이 둘뿐일 때는 한 번 누르면 다른 쪽으로 넘어가게 짤 수도 있다. 그런데 그러면 무엇으로
 * 바뀌는지 눌러봐야 알고, 셋이 되는 순간 원하는 값까지 두 번 눌러야 한다. 목록을 열면
 * 후보와 지금 값이 한 번에 보인다.
 *
 * ── 접근성 ──────────────────────────────────────────────────────────────────
 * 라디오 묶음(menuitemradio)으로 읽힌다 — 하나만 골라지는 축이라는 것이 소리로도 전해진다.
 * 바깥을 누르거나 Esc 로 닫히고, 고르면 초점이 단추로 돌아온다 (열기 전 자리로 되돌린다).
 *
 * `icon` 은 무엇을 고르는 축인지 그림으로 말한다 — 정렬은 ⇅, 출발지는 핀이다. 단추 글자가
 * 값("거리순"·"QR 지점")만 적기 때문에, 아이콘이 없으면 그 낱말이 무엇에 관한 것인지
 * 화면에서 사라진다 (보조기기에는 aria-label 이 같은 일을 한다).
 */
export function InlineSelect({
  value, options = [], onChange,
  label,
  /* 단추에 값 대신 적을 글자 (2026-08-19). 지금 값이 **바로 옆에 이미 적혀 있는** 자리를
     위한 것이다 — S07 길찾기의 출발지가 그렇다. 거기서는 출발지 이름이 아래 줄에
     본문 크기로 서 있어서, 단추까지 같은 이름을 적으면 한 낱말이 두 줄에 겹친다.
     그때 단추가 말할 것은 값이 아니라 **할 일**("바꾸기")이다.
     보조기기에는 그래도 지금 값을 들려준다 (아래 aria-label 은 그대로다) — 값이 옆에
     있다는 사실은 눈으로 훑을 때의 이야기이고, 소리로는 앞뒤가 붙어 오지 않는다. */
  buttonLabel,
  icon = "arrow-up-down",
  align = "right",     /* 단추가 줄 오른쪽 끝에 서는 자리가 많아 목록도 오른쪽에 맞춘다 */
  /* 상자를 글자에 맞춘다. 104 는 "거리순" 세 글자 기준이고, 더 긴 후보를 담는 자리
     (출발지의 상호명 등)는 부르는 쪽이 올려 잡는다 — 높이는 줄이지 않는다.
     한 줄이 44px(--tap-min)인 것은 손가락 자리다. */
  menuMinWidth = 104,
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
        <Icon name={icon} size={15} color="var(--text-muted)" />
        {buttonLabel || (current ? current.label : "")}
        {/* 꺾쇠를 단다 (2026-08-19). 아이콘 하나로는 "지금 값"인지 "누를 수 있는 것"인지
            갈리지 않았다 — 정렬 자리에서는 ⇅ 가 그 일까지 했지만, 출발지의 핀은 값을
            가리키는 그림이라 누를 수 있다는 말을 하지 못한다 */}
        <Icon name="chevron-down" size={15} color="var(--text-muted)" />
      </button>

      {open ? (
        <div role="menu" aria-label={label}
          style={{
            position: "absolute", top: "100%", [align]: 0, marginTop: 2,
            minWidth: menuMinWidth, maxWidth: "70vw", padding: 3,
            background: "var(--surface-card)",
            border: "var(--stroke-hairline) solid var(--border-default)",
            borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-raised)",
            /* 부르는 쪽(ListControls 등)이 이미 쌓임 맥락을 만드므로 그 안에서만 겨루면 된다.
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
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap" }}>{o.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default InlineSelect;
