import React from "react";

/* 여러 줄 입력 — S10 오류신고의 "내용" 칸이 첫 사용처다.
 *
 * rows 로 초기 줄 수만 정하고 **고정 높이를 주지 않는다** (U-CM-14). 대신 입력이 길어지면
 * 스스로 늘어난다. 2차의 글자 확대에서 scrollHeight 가 커지면 상자도 같이 커져야
 * 쓴 글이 상자 안에서 잘리지 않는다.
 *
 * 글자 수는 maxLength 가 있을 때만 센다. 없는데 세면 "얼마나 써야 하지"라는
 * 있지도 않은 요구로 읽힌다.
 */
export function Textarea({
  label, hint, error, required, value = "", onChange, placeholder, rows = 4,
  maxLength, disabled, id, style, ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const ref = React.useRef(null);
  const auto = React.useCallback(el => {
    if (!el) return;
    el.style.height = "auto";                       /* 줄이 줄었을 때도 따라 줄게 한다 */
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  /* 값이 밖에서 바뀌어도(초기화 등) 높이를 맞춘다 */
  React.useEffect(() => { auto(ref.current); }, [value, auto]);

  const borderColor = error ? "var(--state-danger)" : focus ? "var(--brand-secondary)" : "var(--border-strong)";
  const count = String(value).length;

  return (
    <label style={{ display: "block", ...style }}>
      {label ? (
        <span style={{ display: "block", fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)",
          color: "var(--text-heading)", marginBottom: 6 }}>
          {label}
          {required ? <span aria-hidden="true" style={{ color: "var(--state-danger)", marginLeft: 3 }}>*</span> : null}
          {required ? <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>필수</span> : null}
        </span>
      ) : null}

      <textarea
        ref={el => { ref.current = el; auto(el); }}
        id={id} value={value} rows={rows} placeholder={placeholder} disabled={disabled}
        maxLength={maxLength} required={required}
        aria-invalid={error ? "true" : undefined}
        onChange={e => { auto(e.target); if (onChange) onChange(e); }}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ display: "block", width: "100%", boxSizing: "border-box", resize: "none", overflow: "hidden",
          minHeight: `calc(${rows} * 1.6em + 20px)`, padding: "10px 12px",
          background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
          border: `var(--stroke-hairline) solid ${borderColor}`, borderRadius: "var(--radius-control)",
          boxShadow: focus ? "var(--shadow-focus)" : "none", outline: "none",
          /* 16px 미만이면 iOS Safari 가 포커스 때 화면을 확대한다 */
          fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.6, color: "var(--text-heading)",
          letterSpacing: "var(--ls-normal)",
          transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)" }}
        {...rest} />

      {error || hint || maxLength ? (
        <span style={{ display: "flex", gap: "var(--space-3)", alignItems: "baseline", marginTop: 6,
          fontSize: "var(--fs-caption)" }}>
          <span style={{ flex: 1, color: error ? "var(--state-danger)" : "var(--text-muted)", lineHeight: 1.5 }}>
            {error || hint}
          </span>
          {maxLength ? (
            <span style={{ flex: "0 0 auto", color: count >= maxLength ? "var(--state-danger)" : "var(--text-muted)",
              fontVariantNumeric: "tabular-nums" }}>
              {count} / {maxLength}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
}

export default Textarea;
