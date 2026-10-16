import React from "react";
import { Icon } from "../core/Icon.jsx";

/* 옆으로 밀어 넘기는 사진 줄 (2026-10-16). 점포 상세의 가게 이미지에서 시작했고 축제 상세도 같은 것을
   쓴다 — 두 화면의 사진 자리가 다르게 생기면 안 된다. 사진 자료가 없으면(`images` 가 비어 있다)
   자리표시 카드 셋을 그린다. 한 장씩 맞춰 멈추고(scroll-snap) 다음 장이 오른쪽에 살짝 보여 더
   있다는 것을 알린다. 높이는 상수가 아니라 가로세로 비율로 잡는다(고정 높이 금지).
   본문 좌우 여백(--gutter-screen)을 음수로 풀어 화면 가장자리까지 밀린다. */
const PHOTO_SLOTS = 3;

export function PhotoStrip({ images, name = "", label = "이미지" }) {
  const list = images && images.length ? images : Array.from({ length: PHOTO_SLOTS }, () => null);
  return (
    <div role="group" aria-label={`${name} ${label}`.trim()}
      style={{ display: "flex", gap: "var(--space-2)", overflowX: "auto", scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain",
        margin: "0 calc(-1 * var(--gutter-screen))", padding: "0 var(--gutter-screen)",
        scrollPaddingLeft: "var(--gutter-screen)" }}>
      {list.map((src, i) => (
        <div key={i} style={{ flex: "0 0 78%", maxWidth: 320, aspectRatio: "4 / 3", scrollSnapAlign: "start",
          borderRadius: "var(--radius-card)", overflow: "hidden", background: "var(--surface-sunken)",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          {src ? <img src={src} alt={`${name} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                color: "var(--text-muted)", fontSize: "var(--fs-caption)" }}>
                <Icon name="image" size={28} />
                {label}
              </span>
            )}
        </div>
      ))}
    </div>
  );
}
