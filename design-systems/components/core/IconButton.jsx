import React from "react";
import { Icon } from "./Icon.jsx";

/* 아이콘 하나로 서는 단추. 글자가 없으므로 `label` 은 장식이 아니라 **이름**이다 —
   보조기기에 그대로 읽힌다.

   ── 꺼진 상태를 그린다 (2026-08-19 추가) ──────────────────────────────────
   전에는 `disabled` 를 넘겨도 모양이 그대로였다. 브라우저가 클릭만 막고, 화면에서는
   눌리는 단추와 구별되지 않는다 — 눌러보고 나서야 안 된다는 것을 알게 된다.
   S08 코스 상세의 순서 [↑][↓] 가 이 상태를 실제로 쓴다 (첫 줄의 ↑, 끝 줄의 ↓).

   회색으로 칠하지 않고 **흐리게** 둔다. 이 단추는 대개 투명 바탕(ghost)이라 칠할 면이
   없고, 아이콘만 옅어지는 편이 "지금은 갈 곳이 없다"에 가깝다. 다만 --text-disabled 가
   아니라 opacity 를 쓴다 — brand 처럼 바탕이 있는 결에서는 글자색만 바꿔서는 흐려지지 않는다. */
const DISABLED_OPACITY = 0.35;

export function IconButton({ name, label, size = 44, variant = "ghost", disabled = false, style, ...rest }) {
  const skins = {
    ghost: { background: "transparent", border: "none", color: "var(--text-heading)" },
    soft: { background: "var(--surface-sunken)", border: "none", color: "var(--text-heading)" },
    outline: { background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-strong)", color: "var(--text-heading)" },
    brand: { background: "var(--brand-primary)", border: "none", color: "var(--text-on-brand)" },
  };
  return (
    <button aria-label={label} disabled={disabled}
      style={{ width: size, height: size, minWidth: "var(--tap-min)", minHeight: "var(--tap-min)", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-pill)", cursor: disabled ? "default" : "pointer", opacity: disabled ? DISABLED_OPACITY : 1, ...(skins[variant] || skins.ghost), ...style }} {...rest}>
      <Icon name={name} size={22} />
    </button>
  );
}
