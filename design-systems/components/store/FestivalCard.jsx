import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Mascot } from "../brand/Mascot.jsx";
import { Badge } from "../core/Badge.jsx";
import { festivalPalette, festivalBadge } from "./festivalState.js";

/* 축제 홍보 카드 (U-FT-01 · U-DC-01). 축제 전체보기(S12)와 둘러보기 탭(S04)이 한 열로 쓴다.
 *
 *   ┌──────────────────────────────────────────┐
 *   │ [진행중] 10.17 (금) 15:00~21:00      ╭──╮ │
 *   │ 둔전 골목축제                        │🐉│ │
 *   │ 먹거리 부스 20여 곳, 시장통 잔치      ╰──╯ │
 *   │ ────────────────────────────────           │
 *   │ 둔전골목형상점가 · 지금 계신 곳             │
 *   └──────────────────────────────────────────┘
 *
 * ── 왜 `FestivalRow` 로 안 되나 ─────────────────────────────────────────────
 * 행은 **고르는 자리**의 생김새다. 이름·날짜·거리를 나란히 세워 여섯을 빠르게 견주게 한다.
 * 그런데 축제 목록은 고르러 오는 자리가 아니라 **알리는 자리**다 — 어느 축제가 있는지
 * 모르는 사람에게 여섯 줄을 똑같이 보여주면 여섯 개 다 안 읽고 나간다. 카드는 한 건에
 * 화면 한 뼘을 내주고, 그 자리에 "무엇이 재미있는가"(`hook`)를 적는다.
 *
 * ── 색은 상태다 (2026-08-19 개편) ───────────────────────────────────────────
 * 전에는 상태와 **무관한** 여섯 파스텔을 축제마다 하나씩 깔았다(`tone` prop). 카드끼리
 * 구별하려는 것이었는데, 배지는 그와 별개로 상태 색을 써서 **한 화면에 축제를 가리키는
 * 색이 아홉 가지**가 됐다. 게다가 뜻이 없는 여섯 색은 보는 사람에게 있지도 않은 규칙을
 * 찾게 만든다 — 붉은 카드가 급한 축제인가?
 *
 * 지금은 바탕이 상태를 말한다 (진행중 초록 · 예정 크림 · 종료 회색). 세 값은 목록 행과
 * 배너가 쓰는 Badge 톤의 바탕색과 **같은 값**이라, 같은 축제가 어느 화면에서든 같은 색이다
 * (`festivalState.js`). 카드끼리 구별하는 일은 축제명·날짜·홍보 문구가 맡는다 — 원래
 * 그 일을 하는 자리이고, 색을 못 보는 사람에게도 남는다.
 *
 * 색만으로 상태를 말하지는 않는다. 바탕이 무슨 색이든 "진행중"·"예정"·"종료"가 카드 안에
 * 글자로 함께 나간다.
 *
 * 크기는 한 단계씩 줄인 값 그대로다 (제목 19→17, 홍보 문구 16→14, 조아용 92→72).
 * 한 화면에 카드가 한 장 반밖에 안 들어가면 목록을 훑는다는 느낌이 사라진다.
 *
 * ── 조아용을 카드마다 다른 포즈로 ───────────────────────────────────────────
 * 포즈는 `MASCOT_FULL`(1:1 전신)에서만 고른다. 상반신 아트워크를 섞으면 정사각 상자에서
 * 높이가 3분의 2로 줄어 카드마다 캐릭터가 커졌다 작아졌다 한다 (Mascot.jsx 주석).
 *
 * 발치에 붙던 **성격 아이콘 스티커는 뺐다** (2026-08-19). 캐릭터 오른쪽 아래 모서리에
 * 걸린 원형 배지였는데, 카드가 알리려는 것(무슨 축제이고 언제인가)에 아무것도 보태지
 * 못하면서 조아용 위에 올라타 그림을 가렸다. 축제의 성격은 바로 왼쪽의 홍보 문구가
 * 한 문장으로 말한다 — 아이콘 하나가 그보다 잘 말할 수 있는 것이 없었다.
 */

/* 종료된 축제의 조아용은 흐리게 낮춘다. 아주 빼지 않는 이유는 카드 오른쪽이 통째로
   비면 종료 카드만 다른 짜임이 되어, 목록을 훑을 때 리듬이 끊기기 때문이다. */
const DONE_MASCOT_OPACITY = 0.45;

const MASCOT_SIZE = 72;

/* ── compact 에는 조아용을 두지 않는다 (2026-08-19 확정) ─────────────────────
   44 로 뒀다가 글 기둥 옆에서 혼자 작아 64 로 키웠는데, 이번에는 시트 헤더에 캐릭터가
   너무 크게 앉았다. 어느 크기로도 맞지 않은 이유는 크기 문제가 아니었다 —
   **조아용은 한 뼘을 받아야 사는 그림**이고, 점포 목록 위에 얹히는 두세 줄짜리 띠에는
   그만한 자리가 없다. 억지로 넣으면 캐릭터가 작아 초라하거나 띠가 두꺼워진다.

   대신 축제 아이콘(party-popper) 한 점을 왼쪽에 둔다. 원래 배너가 쓰던 방식이고,
   22px 한 점은 두 줄짜리 띠에 정확히 맞는 무게다.

   그러면 두 화면이 "완전히 같은 카드"는 아니게 된다. 그래도 **색·상태 알약·글의 차례가
   같으므로** 같은 축제라는 것은 그대로 읽힌다 — 갈리는 것은 왼쪽에 그림이 오느냐 아이콘이
   오느냐 하나뿐이고, 그것은 자리의 크기가 정하는 문제다. */
const COMPACT_ICON = 22;

export function FestivalCard({
  festival, onClick,
  pose = "excited",       /* MASCOT_FULL 안에서만 고른다 */
  hook,                   /* "먹거리 부스 20여 곳, 골라 먹는 재미가 있어요" */
  base = "",              /* 조아용 PNG 경로 기준 (화면마다 깊이가 다르다) */
  compact = false,        /* 시트 헤더용 한 줄짜리 (FestivalBanner 가 쓴다) */
  onDismiss,              /* 주면 오른쪽 위에 [X] 가 붙는다 */
  dismissLabel = "축제 안내 닫기",
  style, ...rest
}) {
  const f = festival;
  const done = f.state === "종료";
  /* 색 한 벌은 상태가 정한다. 카드가 고를 것이 없다 — 고를 수 있게 두면 같은 상태의
     축제가 화면마다 다른 색으로 나오던 예전으로 돌아간다 */
  const { bg, border, ink, veil } = festivalPalette(f.state);

  /* compact 에서는 홍보 문구와 상점가·거리 줄을 뺀다. 시트 헤더의 그 자리는 "우리 상점가
     축제 1건"이라 상점가명이 바로 위 줄에 이미 있고, 홍보 문구까지 넣으면 점포 목록이
     화면 밖으로 밀린다. 상태 알약·날짜·축제명·조아용은 그대로 둔다 — 둘러보기 탭의
     카드와 **같은 것을 같은 생김새로** 보여주는 것이 이 prop 의 요점이다. */
  const showBody = !compact;

  const km = f.dist >= 1000 ? `${(f.dist / 1000).toFixed(1)}km` : `${f.dist}m`;

  /* 카드가 버튼이 되면 보조기기는 안의 글자를 한 덩어리로 읽어버린다 — 배지·제목·문구·
     거리가 순서 없이 이어 붙는다. 읽을 문장을 여기서 직접 정해 준다 */
  const label = `${f.state} · ${f.name}. ${f.date}. ${f.districtName} ${f.dist === 0 ? "지금 계신 곳" : km}.${showBody && hook ? ` ${hook}` : ""}`;

  /* [X] 가 없으면 카드 전체가 곧 버튼이다 — [자세히 보기] 같은 버튼을 따로 붙이면
     카드마다 같은 말이 한 번씩 더 늘어난다.
     [X] 가 있으면 겉을 그릇으로 두고 **본문과 [X] 를 형제 버튼**으로 나란히 놓는다.
     누를 수 있는 것 안에 누를 수 있는 것을 넣으면 브라우저마다 안쪽 클릭이 바깥으로
     새거나 삼켜진다 (예전 FestivalBanner 가 같은 이유로 이 짜임이었다). */
  const wholeCardIsButton = onClick && !onDismiss;

  const inner = (
    <>
      {/* compact 의 왼쪽 한 점. 색은 상태 틴트의 -fg 를 따라가므로 종료 축제에서는 함께 빠진다 */}
      {compact ? (
        <span style={{ flex: "0 0 auto", alignSelf: "center", display: "inline-flex" }}>
          <Icon name="party-popper" size={COMPACT_ICON} color={ink} />
        </span>
      ) : null}

      {/* ── 왼쪽: 읽는 자리 ───────────────────────────────────────────── */}
      {/* compact 에서는 글을 세로 가운데로 모은다. 조아용은 alignSelf:center 인데 글 기둥만
          위에 붙어 있으면 둘의 중심이 어긋나 — 아래쪽에만 빈 자리가 남는다. full 에서는
          맨 아래 상점가·거리 줄이 marginTop:auto 로 기둥을 끝까지 늘리므로 그럴 일이 없다 */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4,
        justifyContent: compact ? "center" : "flex-start" }}>

        {/* ── 알약과 날짜는 **언제나 두 줄**이다 (2026-08-19 수정) ──────────────────
               전에는 한 줄에 나란히 두고 flexWrap 으로 넘겼다. 그런데 날짜 길이가 축제마다
               다르다 — "10.17 (금) 15:00~21:00" 은 넘어가고 "11.07 (토) 16:00~21:00" 은
               자리가 남아 그대로 붙는다. 그래서 목록을 훑으면 카드마다 날짜가 오른쪽에
               있다가 아래에 있다가 했다. 줄이 바뀌는 자리가 데이터에 따라 정해지면
               그것은 배치가 아니라 우연이다.

               폭에 기대지 않고 항상 내린다. 카드 높이가 한 줄만큼 늘지만, 대신 여섯 장이
               같은 자리에 같은 것을 놓는다 — 훑는 눈이 날짜를 찾아다니지 않아도 된다. */}
        <div style={{ display: "flex" }}>
          {/* 목록 행·상세·관리자 표와 **같은 Badge** 다. 전에는 여기만 손수 만든 알약이었는데,
              그러면 같은 "진행중"이 자리마다 다르게 생긴다. 색은 바탕 틴트가 아니라
              festivalBadge 가 정한다 — 크림 카드 위의 크림 알약은 알약으로 보이지 않았다.
              상태는 색과 함께 **글자로도** 나간다 — 색을 못 보는 사람에게 남는 것이 그것이다 */}
          <Badge size="sm" {...festivalBadge(f.state)}>{f.state}</Badge>
        </div>
        {/* 투명도를 낮추지 않는다 (2026-08-19). 틴트 배경 위의 12~16px 글자를 0.8 로 흐리면
            sand·neutral 카드에서 4.0~4.2:1 로 AA 에 못 미친다 — 불투명이면 5.97 / 8.80 이다
            (tokens/surfaces.css 머리말). 감쇠는 20px 이상이나 볼드에만 준다.
            대신 -fg 를 그대로 써서 제목(잉크)과는 굵기·크기로 갈린다 */}
        <span style={{ font: "var(--type-micro)", fontWeight: "var(--fw-medium)" }}>{f.date}</span>

        <h3 style={{
          /* compact 는 시트 헤더라 제목 단계를 한 칸 낮춘다 — 바로 아래 점포 목록의
             상호명(body)보다 크되 둘러보기 탭의 카드 제목만큼 크지는 않게 */
          font: compact ? "var(--type-body)" : "var(--type-title-3)",
          fontWeight: "var(--fw-bold)",
          letterSpacing: "var(--ls-snug)", wordBreak: "keep-all", color: ink,
        }}>{f.name}</h3>

        {/* 홍보 문구. 프로그램 표를 요약한 한 문장이라, 카드에서 유일하게
            "가면 무엇을 하나"에 답하는 줄이다 */}
        {showBody && hook ? (
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)",
            lineHeight: 1.5, fontWeight: "var(--fw-medium)",
            letterSpacing: "var(--ls-normal)", wordBreak: "keep-all",
          }}>{hook}</p>
        ) : null}

        {showBody ? (
          <div style={{
            marginTop: "auto", paddingTop: "var(--space-2)",
            borderTop: `var(--stroke-hairline) solid ${veil}`,
            display: "flex", alignItems: "center", gap: 4,
            font: "var(--type-micro)", fontWeight: "var(--fw-medium)",
          }}>
            <Icon name="map-pin" size={13} />
            {/* U-DC-01 — 상점가명과 거리를 반드시 병기한다. 거리 0 은 숫자로 적을 수 없어
                "지금 계신 곳"이라고 쓴다 (FestivalRow 와 같은 말을 쓴다) */}
            {f.districtName} · {f.dist === 0 ? "지금 계신 곳" : km}
          </div>
        ) : null}
      </div>

      {/* ── 오른쪽: 보는 자리 ───────────────────────────────────────────
             조아용 하나뿐이다. 발치에 붙던 성격 아이콘 스티커는 뺐다 (머리말 참조).
             compact 에는 두지 않는다 — 왼쪽 아이콘 한 점이 그 일을 한다 (MASCOT_SIZE 위 주석) */}
      {compact ? null : (
        <div style={{ flex: "0 0 auto", width: MASCOT_SIZE, alignSelf: "center" }}>
          <Mascot pose={pose} size={MASCOT_SIZE} base={base} alt=""
            style={{ display: "block", opacity: done ? DONE_MASCOT_OPACITY : 1 }} />
        </div>
      )}
    </>
  );

  /* 본문을 감싸는 버튼. 카드 전체가 버튼일 때는 쓰지 않는다 */
  const clickable = onClick ? (
    <button type="button" onClick={onClick} aria-label={label}
      style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "stretch", gap: "var(--space-3)",
        background: "none", border: "none", padding: 0, margin: 0, textAlign: "left",
        font: "inherit", color: "inherit", cursor: "pointer" }}>
      {inner}
    </button>
  ) : inner;

  return (
    <article
      {...(wholeCardIsButton ? {
        onClick,
        role: "button",
        tabIndex: 0,
        "aria-label": label,
        onKeyDown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e); } },
      } : null)}
      style={{
        display: "flex", alignItems: "stretch", gap: "var(--space-3)",
        background: bg, color: ink,
        /* 틴트 테두리를 두른다. sand·neutral 처럼 옅은 틴트는 흰 시트 위에서 바탕만으로는
           카드의 끝이 어디인지 보이지 않는다 (surfaces.css 의 -border 가 그 자리다) */
        border: `var(--stroke-hairline) solid ${border}`,
        borderRadius: "var(--radius-card)",
        padding: compact
          ? "var(--space-3) var(--space-2) var(--space-3) var(--space-3)"
          : "var(--space-3) var(--space-3) var(--space-3) var(--space-4)",
        cursor: wholeCardIsButton ? "pointer" : "default",
        /* 고정 높이를 주지 않는다 (U-CM-14) — 글자를 키우면 카드가 함께 자란다 */
        minHeight: compact ? "var(--tap-comfortable)" : 112,
        ...style,
      }}
      {...rest}>

      {wholeCardIsButton ? inner : clickable}

      {onDismiss ? (
        <button type="button" onClick={onDismiss} aria-label={dismissLabel} title={dismissLabel}
          style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "flex-start", justifyContent: "center",
            minWidth: "var(--tap-min)", padding: "2px 0 0", margin: 0,
            background: "none", border: "none", cursor: "pointer", color: ink, opacity: 0.7 }}>
          <Icon name="x" size={18} />
        </button>
      ) : null}
    </article>
  );
}

export default FestivalCard;
