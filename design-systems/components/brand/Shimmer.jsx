import React from "react";

/* 반짝임 (2026-10-30, 사용자 요청) — 감싼 것 위로 비스듬한 빛줄기가 이따금 지나간다. 상인회 정회원 배지
   「이음길 함께가게」의 금테에 「이펙트」 포인트를 주려고 만들었다. 빛줄기는 `radius` 모양 안에서만 보인다(배지는 원).
   움직임은 motion.css 의 yong-shimmer — 움직임 최소화 기기에서는 한 번에 끝난다. 장식이라 눌리지 않고 읽히지 않는다. */
export function Shimmer({ children, radius = "999px", style, ...rest }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", overflow: "hidden", borderRadius: radius,
      isolation: "isolate", ...style }} {...rest}>
      {children}
      <span aria-hidden="true" style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "45%",
        pointerEvents: "none", mixBlendMode: "screen",
        background: "linear-gradient(90deg, transparent 0%, var(--member-shine) 50%, transparent 100%)",
        animation: "yong-shimmer 3.6s var(--ease-standard) infinite", transform: "translateX(-160%) skewX(-20deg)" }} />
    </span>
  );
}
