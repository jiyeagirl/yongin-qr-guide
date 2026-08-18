import React from "react";

export const MASCOT_POSES = ["front","hello","thumbsup","excited","curious","surprised","shy","back","glance","sorry","balloon","thanks","answer","angry"];

/* 조아용 — the Yongin city mascot. Always PNG artwork, never redrawn. */
export function Mascot({ pose = "front", size = 96, bob = false, base = "", alt = "조아용", style, ...rest }) {
  return (
    <img src={`${base}assets/character/joayong-${pose}.png`} alt={alt} width={size} height={size} style={{ width: size, height: size, objectFit: "contain", animation: bob ? "yong-bob 2.6s var(--ease-standard) infinite" : "none", ...style }} {...rest} />
  );
}
