import React from "react";

/* 뜻으로 부르는 톤. 화면이 "성공"·"위험"을 말할 때 쓴다 */
const TONES = {
  neutral: ["var(--surface-sunken)", "var(--text-body)"],
  brand: ["var(--brand-primary-soft)", "var(--yong-green-800)"],
  info: ["var(--state-info-soft)", "var(--yong-teal-700)"],
  success: ["var(--state-success-soft)", "var(--yong-green-800)"],
  warning: ["var(--state-warning-soft)", "var(--yong-amber-800)"],
  /* 값을 직접 적어두었던 자리다. 램프에 red-800 을 세우면서 토큰으로 바꿨다 (2026-08-19) */
  danger: ["var(--state-danger-soft)", "var(--yong-red-800)"],
  accent: ["var(--brand-accent)", "var(--yong-ink-900)"],
  onnuri: ["var(--state-info-soft)", "var(--yong-teal-900)"],

  /* ── 축제 상태 3종 (2026-08-19. Design 프로젝트의 Badge 스펙) ────────────────
     카드 색과 **한 세트**다 (tokens/surfaces.css 의 --status-*). 카드는 옅은 바탕을
     깔고 배지는 그 위로 진한 단이 올라온다 — 흰 글자로 대비를 낸다.

       ongoing   짙은 초록  green-50 카드 위 (2026-08-19. 그 전에는 딥앰버 / cream)
       upcoming  코코아     sand 카드 위
       ended     잉크       neutral 카드 위

     **셋 다 언제나 점(dot)과 함께 쓴다.** 형태가 같아야 세 상태를 서로 견줄 수 있다.
     쓰는 쪽은 festivalState.js 의 festivalBadge() 를 거치므로 이 규칙을 빠뜨릴 수 없다. */
  ongoing: ["var(--status-ongoing-badge)", "var(--yong-white)"],
  upcoming: ["var(--status-upcoming-badge)", "var(--yong-white)"],
  ended: ["var(--status-ended-badge)", "var(--yong-white)"],
};

/* 갈래로 부르는 톤 — `tokens/surfaces.css` 의 10틴트 (2026-08-19 추가).
   카드·칩과 **같은 이름을 받는다.** 축제 상태를 `tone="cream"` 으로 적으면 배지와 카드가
   같은 색표를 보게 되고, 한쪽만 고쳐지는 일이 없어진다.

   이름이 겹치는 것은 neutral 하나뿐이고 위의 것이 이긴다 — 둘 다 회색이라 결과가 같고,
   기존 배지 16곳의 바탕(surface-sunken)을 건드릴 이유가 없다. */
const TINTS = ["green", "teal", "cream", "amber", "red", "blue", "violet", "sand", "rose", "neutral"];

/* 한때 `fill`(soft·medium·strong) 3단계를 두었다가 걷어냈다 (2026-08-19).
   "틴트 카드 위에 얹은 옅은 알약이 묻힌다"를 알약 쪽 농도로 풀려던 것이었는데, 그 문제는
   **바탕과 배지를 짝으로 정하면** 풀린다 — 그것이 위 `--status-*` 세 톤이 하는 일이다.
   농도 손잡이를 열어두면 같은 상태가 화면마다 다른 농도로 나올 길이 열린다. */

/* 크기는 둘뿐이고 글자 크기는 건드리지 않는다 — 달라지는 것은 여백뿐이다 (2026-08-18).
   sm 은 **ListRow 의 tag 자리**를 위한 값이다. 그 자리에는 온누리 배지(OnnuriBadge)가
   이미 sm 으로 앉아 있는데, 같은 자리에 md 배지가 오면 목록을 훑을 때 알약 높이가
   행마다 들쭉날쭉해진다. 공공시설 목록(쉼터·AED)과 점포 목록(온누리)이 나란히 놓이는
   S02/S03 시트에서 특히 눈에 띈다. 글자는 그대로인데 알약만 커 보이는 것도 그래서다.
   md 는 상세 화면처럼 배지가 홀로 서는 자리에 남긴다. */
const SIZES = { md: "4px 9px", sm: "2px 7px" };

/* 알약은 **낱말 하나처럼** 다룬다 (2026-08-20).
   keep-all 은 한글 사이의 줄바꿈만 막지 띄어쓰기에서의 줄바꿈은 막지 않는다. 그래서
   "3건 누적" · "좌표 없음" 처럼 띄어쓰기가 든 배지는 좁은 열에서 여전히 두 줄이 되는데,
   알약이 두 줄이 되면 둥근 테두리가 글자를 감싸 놓은 모양이 무너져 **얼룩처럼 보인다.**
   글자가 잘리는 것과 달리 이것은 읽는 문제가 아니라 그것이 하나의 표시라는 사실이
   보이지 않게 되는 문제다.

   대신 넘칠 위험을 배지가 아니라 **놓는 쪽**이 진다 — 배지를 곁들이는 자리(표의 이름 칸,
   폼의 라벨 줄)는 flexWrap 으로 배지를 통째로 아랫줄에 내린다. 알약은 온전한 채로
   줄만 바뀐다. */

export function Badge({ children, tone = "neutral", size = "md", dot = false, style, ...rest }) {
  /* 이름표(success·ongoing·onnuri…)가 먼저고, 없으면 틴트 이름으로 떨어진다 */
  const [bg, fg] = TONES[tone]
    || (TINTS.includes(tone) ? [`var(--tint-${tone}-bg)`, `var(--tint-${tone}-fg)`] : TONES.neutral);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: bg, color: fg, fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)", fontWeight: "var(--fw-semibold)", lineHeight: 1.4, letterSpacing: "var(--ls-normal)", whiteSpace: "nowrap", padding: SIZES[size] || SIZES.md, borderRadius: "var(--radius-pill)", ...style }} {...rest}>
      {/* 점은 글자색을 따라간다 — 톤이 무엇이든 알약 안에서 저절로 맞는다 (Design 프로젝트와 같다) */}
      {dot ? <span style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor", opacity: 0.9 }} /> : null}
      {children}
    </span>
  );
}
