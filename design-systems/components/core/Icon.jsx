import React from "react";

const pascal = n => String(n).split(/[-_ ]/).filter(Boolean).map(s => s[0].toUpperCase() + s.slice(1)).join("");

/* This Lucide build ships icons as a flat array of [tag, attrs] child pairs;
   older builds wrap them as ["svg", attrs, children]. Accept both. */
function children(data) {
  if (!Array.isArray(data)) return [];
  if (data[0] === "svg") return Array.isArray(data[2]) ? data[2] : [];
  return data;
}

/* ── 이 시스템에만 있는 아이콘 ────────────────────────────────────────────────
   lucide 에 없는 그림만 여기 둔다.

   쓰는 법: `"이름": [["path", {…}], …]` — lucide 와 같은 24×24 뷰박스, 이름이 겹치지
   않게 두면 lucide 보다 먼저 걸린다. 채우기를 쓰면 `fill: "currentColor",
   stroke: "none"` 이라 **`color` prop 은 윤곽선에만 걸린다** (색은 부모의 CSS `color`
   — 부르는 쪽이 `style={{ color }}` 로 준다). 빌드의 아이콘 추리기(`pickIcons`)는
   lucide 이름만 보므로 여기 것은 늘 번들에 실린다.

   > 한 번 비었던 표다. `qr-pin`(2026-08-25 — 핀 윤곽 안의 QR 모듈 넷)이 하루 만에
   > lucide `qr-code` + 「스캔 위치로」라는 **글자**로 바뀌면서 나갔다: 모듈 넷은 20px
   > 에서 점으로 뭉개졌고, 무엇보다 **그림으로 가르쳐야 아는 것이면 글자로 적는 편이
   > 빠르다.** 그 교훈은 지금 든 것에 걸리지 않는다 — 아래는 **처음 보는 그림이 아니다.** */
const LOCAL = {
  /* 채워진 아래 삼각형 (2026-08-26, 사용자 요청). lucide 에 없다 — `chevron-down` 은
     윤곽선 꺾쇠이고 `triangle` 은 속이 빈 정삼각형이다.

     쓰는 자리는 `InlineSelect` 의 `floating`, 즉 **지도 위에 바탕 없이 놓인 고르개**다.
     2px 짜리 꺾쇠 획은 그 자리에서 지도의 선(길·구획선)과 굵기가 같아 **그림이 배경에
     섞인다.** 채워진 덩어리는 같은 크기에서도 배경과 갈린다. 배운 적이 없어도 아는
     그림이라는 것이 `qr-pin` 과 다른 점이다 — 아래를 가리키는 채운 삼각형은 화면에서
     **펼쳐지는 목록**을 뜻하는 가장 오래된 표시다.

     모서리를 둥글린다(반지름 1.1). 각진 삼각형은 12~14px 에서 꼭짓점 셋이 바늘처럼
     날카롭게 서서 옆 글자보다 눈에 먼저 든다 — 이 그림은 값이 아니라 **딸린 표시**다. */
  "caret-down": [["path", {
    d: "M5.1 9 H18.9 Q20 9 19.27 9.82 L12.73 17.18 Q12 18 11.27 17.18 L4.73 9.82 Q4 9 5.1 9 Z",
    fill: "currentColor", stroke: "none",
  }]],
};

/* Lucide line icon. name is the kebab-case Lucide id, e.g. "heart-pulse".
   위 `LOCAL` 에 있는 이름이면 그것이 먼저다 (lucide 와 이름이 겹치지 않게 둔다). */
export function Icon({ name, size = 24, strokeWidth, color, style, ...rest }) {
  const lib = (typeof window !== "undefined" && window.lucide && window.lucide.icons) || {};
  const data = LOCAL[name] || lib[pascal(name)] || lib[name];
  const kids = children(data);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || "currentColor"} strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ flex: "0 0 auto", ...style }} {...rest}>
      {kids.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}
