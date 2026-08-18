import React from "react";

export const MASCOT_POSES = ["front","hello","thumbsup","excited","curious","surprised","shy","back","glance","sorry","balloon","thanks","answer","angry"];

/* 아트워크가 두 종류다. **한 자리에서 포즈를 갈아끼울 때는 같은 쪽끼리만 바꾼다.**
   size 는 정사각형 상자의 한 변이고 objectFit 이 contain 이라, 1.5:1 그림을 넣으면
   높이가 size 의 3분의 2로 줄면서 얼굴만 확대된 것처럼 보인다. 전신 그림과 나란히 두거나
   상태에 따라 번갈아 쓰면 캐릭터가 커졌다 작아졌다 한다 (2026-08-18 S08 진행률에서 발견). */
export const MASCOT_FULL = ["front","thumbsup","excited","curious","surprised","shy","back","glance","sorry"]; /* 1:1 전신 */
export const MASCOT_BUST = ["hello","thanks","answer","balloon","angry"];                                     /* 1.5:1 상반신 */

/* 조아용 — the Yongin city mascot. Always PNG artwork, never redrawn. */
export function Mascot({ pose = "front", size = 96, bob = false, base = "", alt = "조아용", style, ...rest }) {
  return (
    <img src={`${base}assets/character/joayong-${pose}.png`} alt={alt} width={size} height={size} style={{ width: size, height: size, objectFit: "contain", animation: bob ? "yong-bob 2.6s var(--ease-standard) infinite" : "none", ...style }} {...rest} />
  );
}
