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

   > **표는 지금 비어 있다.** 두 번 찼다가 두 번 비었고, 두 번 다 같은 결말이다 —
   > 그림 대신 **글자**이거나, 그 그림을 쓰던 모양 자체가 없어졌다.
   >
   >   `qr-pin`      2026-08-25 → 하루 만에 lucide `qr-code` + 「스캔 위치로」로 바뀌었다.
   >                 핀 윤곽 안의 QR 모듈 넷이 20px 에서 점으로 뭉개졌고, 무엇보다
   >                 **그림으로 가르쳐야 아는 것이면 글자로 적는 편이 빠르다**
   >   `caret-down`  2026-08-26 낮 → 같은 날 저녁. 채운 아래 삼각형이고, 지도 위에 뜨는
   >                 고르개(`InlineSelect.floating`)에서 2px 짜리 꺾쇠 획이 지도의 길·
   >                 구획선과 굵기가 같아 섞이던 것을 고친 그림이다. **그 고르개가 지도에서
   >                 내려와 흰 시트 헤더에 서면서** 섞일 배경이 없어졌고, 줄 안에 서는
   >                 쪽은 처음부터 lucide `chevron-down` 이었다 — 그림이 틀려서가 아니라
   >                 **그 그림이 풀던 문제가 없어졌다** */
const LOCAL = {};

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
