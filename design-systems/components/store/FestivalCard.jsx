import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Mascot } from "../brand/Mascot.jsx";

/* 축제 홍보 카드 (U-FT-01 · U-DC-01). 축제 전체보기(S12)가 한 열로 쌓아 쓴다.
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ [진행중] 10.17 (금) 15:00~21:00        ╭────╮ │
 *   │ 둔전 골목축제                          │조아용│ │
 *   │ 먹거리 부스 20여 곳,                    ╰────╯ │
 *   │ 골라 먹는 재미가 있어요                   ⌾아이콘 │
 *   │ ─────────────────────────────────────────── │
 *   │ 둔전골목형상점가 · 지금 계신 곳                 │
 *   └──────────────────────────────────────────────┘
 *
 * ── 왜 `FestivalRow` 로 안 되나 ─────────────────────────────────────────────
 * 행은 **고르는 자리**의 생김새다. 이름·날짜·거리를 나란히 세워 여섯을 빠르게 견주게 한다.
 * 그런데 축제 목록은 고르러 오는 자리가 아니라 **알리는 자리**다 — 어느 축제가 있는지
 * 모르는 사람에게 여섯 줄을 똑같이 보여주면 여섯 개 다 안 읽고 나간다. 카드는 한 건에
 * 화면 한 뼘을 내주고, 그 자리에 "무엇이 재미있는가"(`hook`)를 적는다.
 *
 * 둘러보기 탭(S04)의 축제 섹션은 그대로 `FestivalRow` 다. 거기서는 축제가 네 섹션 중
 * 하나라 한 건이 한 뼘을 차지하면 아래 세 섹션이 첫 화면에서 사라진다.
 *
 * ── 색은 구별일 뿐 뜻이 아니다 ──────────────────────────────────────────────
 * `tone` 여섯 색은 카드끼리 구별되라고 있다. 상태(진행중·예정·종료)는 **배지가 글자로**
 * 말한다. 색만으로 상태를 읽게 하면 색을 못 보는 사람에게 목록이 통째로 무너진다.
 * 종료만 예외로 색을 거두는데(`--fest-done-*`), 그때도 배지의 "종료"가 먼저다.
 *
 * ── 조아용을 카드마다 다른 포즈로 ───────────────────────────────────────────
 * 포즈는 `MASCOT_FULL`(1:1 전신)에서만 고른다. 상반신 아트워크를 섞으면 정사각 상자에서
 * 높이가 3분의 2로 줄어 카드마다 캐릭터가 커졌다 작아졌다 한다 (Mascot.jsx 주석).
 */

const TONES = ["teal", "ink", "berry", "blue", "amber", "cream"];

/* 종료된 축제의 조아용은 흐리게 낮춘다. 아주 빼지 않는 이유는 카드 오른쪽이 통째로
   비면 종료 카드만 다른 짜임이 되어, 목록을 훑을 때 리듬이 끊기기 때문이다. */
const DONE_MASCOT_OPACITY = 0.45;

export function FestivalCard({
  festival, onClick,
  tone = "teal",          /* TONES 중 하나. 축제마다 다르게 준다 (데이터가 정한다) */
  icon = "party-popper",  /* 축제 성격을 한 눈에 — 먹거리는 utensils, 야시장은 sparkles … */
  pose = "excited",       /* MASCOT_FULL 안에서만 고른다 */
  hook,                   /* "먹거리 부스 20여 곳, 골라 먹는 재미가 있어요" */
  base = "",              /* 조아용 PNG 경로 기준 (화면마다 깊이가 다르다) */
  style, ...rest
}) {
  const f = festival;
  const done = f.state === "종료";
  const t = done ? "done" : (TONES.includes(tone) ? tone : "teal");
  const bg = `var(--fest-${t}-bg)`;
  const ink = `var(--fest-${t}-ink)`;
  const veil = `var(--fest-${t}-veil)`;

  const km = f.dist >= 1000 ? `${(f.dist / 1000).toFixed(1)}km` : `${f.dist}m`;

  return (
    <article
      onClick={onClick}
      /* 카드 전체가 눌린다. 안에 버튼을 따로 두지 않는 이유는 [자세히 보기] 같은 버튼이
         카드마다 붙으면 여섯 번 같은 말을 하기 때문이다 — 카드가 곧 그 버튼이다. */
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      /* 카드가 버튼이 되면 보조기기는 안의 글자를 한 덩어리로 읽어버린다 — 배지·제목·문구·
         거리가 순서 없이 이어 붙는다. 읽을 문장을 여기서 직접 정해 준다 */
      aria-label={onClick
        ? `${f.state} · ${f.name}. ${f.date}. ${f.districtName} ${f.dist === 0 ? "지금 계신 곳" : km}.${hook ? ` ${hook}` : ""}`
        : undefined}
      onKeyDown={onClick ? e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e); }
      } : undefined}
      style={{
        display: "flex", alignItems: "stretch", gap: "var(--space-3)",
        background: bg, color: ink,
        borderRadius: "var(--radius-card)",
        padding: "var(--space-4) var(--space-4) var(--space-4) var(--space-5)",
        cursor: onClick ? "pointer" : "default",
        /* 고정 높이를 주지 않는다 (U-CM-14) — 글자를 키우면 카드가 함께 자란다 */
        minHeight: 148,
        ...style,
      }}
      {...rest}>

      {/* ── 왼쪽: 읽는 자리 ───────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>

        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {/* 상태는 여기서만 말한다. 카드 색은 축제를 구별할 뿐이다 */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: veil, color: ink,
            font: "var(--type-micro)", letterSpacing: "var(--ls-normal)",
            padding: "4px 10px", borderRadius: "var(--radius-pill)",
          }}>
            {f.state === "진행중"
              ? <span style={{ width: 6, height: 6, borderRadius: 999, background: ink }} />
              : null}
            {f.state}
          </span>
          <span style={{ font: "var(--type-caption)", opacity: 0.85 }}>{f.date}</span>
        </div>

        <h3 style={{
          font: "var(--type-title-2)", letterSpacing: "var(--ls-snug)",
          wordBreak: "keep-all", color: ink,
        }}>{f.name}</h3>

        {/* 홍보 문구. 프로그램 표를 요약한 한 문장이라, 카드에서 유일하게
            "가면 무엇을 하나"에 답하는 줄이다 */}
        {hook ? (
          <p style={{
            font: "var(--type-body)", fontWeight: "var(--fw-medium)",
            letterSpacing: "var(--ls-normal)", wordBreak: "keep-all",
            opacity: done ? 1 : 0.92,
          }}>{hook}</p>
        ) : null}

        <div style={{
          marginTop: "auto", paddingTop: "var(--space-3)",
          borderTop: `var(--stroke-hairline) solid ${veil}`,
          display: "flex", alignItems: "center", gap: 5,
          font: "var(--type-caption)", opacity: 0.85,
        }}>
          <Icon name="map-pin" size={14} />
          {/* U-DC-01 — 상점가명과 거리를 반드시 병기한다. 거리 0 은 숫자로 적을 수 없어
              "지금 계신 곳"이라고 쓴다 (FestivalRow 와 같은 말을 쓴다) */}
          {f.districtName} · {f.dist === 0 ? "지금 계신 곳" : km}
        </div>
      </div>

      {/* ── 오른쪽: 보는 자리 ─────────────────────────────────────────── */}
      <div style={{ flex: "0 0 auto", width: 92, position: "relative", alignSelf: "center" }}>
        <Mascot pose={pose} size={92} base={base} alt=""
          style={{ display: "block", opacity: done ? DONE_MASCOT_OPACITY : 1 }} />
        {/* 축제 성격 아이콘을 캐릭터 발치에 스티커처럼 붙인다. 캐릭터와 겹쳐 두면
            둘이 한 그림으로 읽혀, 카드마다 다른 삽화를 그린 것과 같은 효과가 난다 */}
        <span style={{
          position: "absolute", right: -2, bottom: -2,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 36, height: 36, borderRadius: 999,
          background: ink, color: bg,
        }}>
          <Icon name={icon} size={20} />
        </span>
      </div>
    </article>
  );
}

export default FestivalCard;
