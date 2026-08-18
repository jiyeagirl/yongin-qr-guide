import React from "react";
import { Icon } from "./Icon.jsx";

export function Input({ label, hint, error, required, icon, value, onChange, placeholder, type = "text", disabled, clearable = false, onClear, elevated = false, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? "var(--state-danger)" : focus ? "var(--brand-secondary)" : "var(--border-strong)";
  /* elevated: 지도 위에 떠 있을 때. 그림자는 바깥 label 이 아니라 실제 테두리를 가진 안쪽 상자에 준다 */
  const shadow = focus ? "var(--shadow-focus)" : elevated ? "var(--shadow-raised)" : "none";
  const showClear = clearable && !disabled && value != null && String(value).length > 0;
  return (
    <label style={{ display: "block", ...style }}>
      {label ? <span style={{ display: "block", fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)", marginBottom: 6 }}>
          {label}
          {required ? <span aria-hidden="true" style={{ color: "var(--state-danger)", marginLeft: 3 }}>*</span> : null}
          {required ? <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>필수</span> : null}
        </span> : null}
      {/* 높이는 tap-min(44px) 까지만 줄인다. 입력창은 그 자체가 터치 타겟이라
          여기서 더 낮추면 접근성 규칙(U-CM-13)을 깨는 것이지 디자인이 아니다.
          시각적 부피는 좌우 여백과 아이콘 크기로 덜어낸다 */}
      <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minHeight: "var(--tap-min)", padding: "8px 12px",
        background: disabled ? "var(--surface-sunken)" : "var(--surface-card)", border: `var(--stroke-hairline) solid ${borderColor}`,
        borderRadius: "var(--radius-control)", boxShadow: shadow, transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)" }}>
        {icon ? <Icon name={icon} size={18} color="var(--yong-ink-300)" /> : null}
        {/* 16px keeps iOS Safari from auto-zooming on focus */}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} required={required} aria-invalid={error ? "true" : undefined}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 16, color: "var(--text-heading)", letterSpacing: "var(--ls-normal)" }} {...rest} />
        {/* 지우기 — 44px 최소 타겟을 지키되 입력창 높이를 늘리지 않도록 음수 마진으로 상쇄한다 */}
        {showClear ? (
          <button type="button" onClick={onClear} aria-label="입력 지우기"
            style={{ flex: "0 0 auto", width: "var(--tap-min)", height: "var(--tap-min)", margin: "-8px -8px -8px 0",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <Icon name="circle-x" size={18} />
          </button>
        ) : null}
      </span>
      {error || hint ? <span style={{ display: "block", fontSize: "var(--fs-caption)", color: error ? "var(--state-danger)" : "var(--text-muted)", marginTop: 6 }}>{error || hint}</span> : null}
    </label>
  );
}
