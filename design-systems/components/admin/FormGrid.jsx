import React from "react";
import { Input } from "../core/Input.jsx";
import { Select } from "../core/Select.jsx";
import { Textarea } from "../core/Textarea.jsx";
import { Switch } from "../core/Switch.jsx";
import { Badge } from "../core/Badge.jsx";
import { EMPTY_MARK } from "../core/InfoList.jsx";

/* 관리자 입력 폼 — 정의서의 항목표를 그대로 화면에 옮기는 자리.
 *
 * ── 이 컴포넌트의 존재 이유는 배치가 아니라 "필수/선택" 이다 ────────────────
 * 시민용 상세 화면은 값이 없는 선택 항목을 지우지 않고 "-" 로 남긴다. 그 규칙이
 * 뜻을 가지려면 **입력하는 쪽이 그 항목을 비워도 된다는 것을 알아야 한다.**
 * 담당자가 화장실 8개 항목을 앞에 두고 "비상벨 여부를 모르는데 저장이 될까"를
 * 고민하다 아무 값이나 넣으면, 시민 화면에는 틀린 값이 뜬다 —
 * "-"(원천에 없음)와 "×"(없다고 확인됨)를 갈라놓은 일이 통째로 무너진다.
 *
 * 그래서 항목마다 배지가 붙는다. 필수는 danger, 선택은 neutral.
 * 색만으로 말하지 않는다 — 배지 안에 "필수" · "선택"이라고 글자로 적혀 있다.
 *
 * ── 예시값을 힌트로 적는다 ──────────────────────────────────────────────────
 * 정의서의 "예)" 열이 여기로 온다. 개방시간처럼 형식이 자유로운 칸은 예시가 없으면
 * 담당자마다 다르게 적고("24시간" / "상시" / "00:00~24:00"), 그 흔들림이 그대로
 * 시민 화면에 나온다. placeholder 가 아니라 칸 아래 힌트로 적는 이유는
 * placeholder 가 입력을 시작하는 순간 사라지기 때문이다.
 *
 * ── 두 열이다 ───────────────────────────────────────────────────────────────
 * 한 열로 늘어놓으면 화장실 폼이 9칸이라 스크롤이 생기고, 스크롤이 생기면 아래
 * [저장]이 보이지 않는다. 긴 값(주소·부가정보)만 span={2} 로 한 줄을 다 쓴다.
 */

/* 항목 하나. children 을 주면 그것을 쓰고, 없으면 type 에 맞는 컨트롤을 만든다.
   타입 스위치를 여기에 두는 이유: 화면 여덟 개가 저마다 switch 문을 갖게 하면
   "select 는 어떻게 그리더라"가 여덟 벌이 되고, 그중 하나는 반드시 달라진다. */
export function FormField({
  label, required = false, example, error,
  type = "text", value, onChange, options, placeholder, rows, min, max, disabled,
  span = 1, children, style, ...rest
}) {
  const set = v => { if (onChange) onChange(v); };

  let control = children;
  if (!control) {
    if (type === "select") {
      control = <Select options={options} value={value == null ? "" : value}
        onChange={e => set(e.target.value)} />;
    } else if (type === "textarea") {
      control = <Textarea value={value == null ? "" : value} rows={rows || 3} placeholder={placeholder}
        disabled={disabled} onChange={e => set(e.target.value)} />;
    } else if (type === "switch") {
      /* 가부 항목. 저장되는 값은 불리언이고 표시(○·×)는 읽는 쪽이 정한다 —
         여기서 글자로 굳히면 시민 화면과 표기가 갈린다 */
      control = (
        <div style={{ minHeight: "var(--tap-min)", display: "flex", alignItems: "center" }}>
          <Switch checked={!!value} disabled={disabled}
            label={value ? "있음 · 예" : "없음 · 아니오"} onChange={() => set(!value)} />
        </div>
      );
    } else if (type === "readonly") {
      /* 규칙으로 만들어지는 값(AED·대피소 명칭 등). 입력칸처럼 생겼는데 못 고치면
         고장으로 읽히므로, 아예 다른 모양으로 둔다 */
      control = (
        <div style={{ minHeight: "var(--tap-min)", display: "flex", alignItems: "center",
          padding: "8px 12px", background: "var(--surface-sunken)",
          border: "var(--stroke-hairline) dashed var(--border-strong)", borderRadius: "var(--radius-control)",
          fontSize: "var(--fs-body)", color: value ? "var(--text-body)" : "var(--text-muted)" }}>
          {value || EMPTY_MARK}
        </div>
      );
    } else {
      control = <Input type={type} value={value == null ? "" : value} placeholder={placeholder}
        disabled={disabled} onChange={e => set(type === "number" ? e.target.value : e.target.value)}
        min={min} max={max} />;
    }
  }

  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : "auto", minWidth: 0, ...style }} {...rest}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: 6 }}>
        <span style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>
          {label}
        </span>
        <Badge tone={required ? "danger" : "neutral"} size="sm">{required ? "필수" : "선택"}</Badge>
      </div>
      {control}
      {error || example ? (
        <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", lineHeight: 1.5,
          color: error ? "var(--state-danger)" : "var(--text-muted)" }}>
          {error || `예) ${example}`}
        </p>
      ) : null}
    </div>
  );
}

/* 폼 전체. note 는 폼 아래 한 줄 — 선택 항목을 비웠을 때 시민 화면이 어떻게 되는지를
   적는 자리다. 담당자에게는 그 결과를 볼 방법이 지금 없다. */
export function FormGrid({ children, note, columns = 2, style, ...rest }) {
  return (
    <div style={style} {...rest}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: "var(--space-4) var(--space-5)" }}>
        {children}
      </div>
      {note ? (
        <p style={{ marginTop: "var(--space-5)", paddingTop: "var(--space-4)",
          borderTop: "var(--stroke-hairline) solid var(--border-default)",
          fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.6 }}>
          {note}
        </p>
      ) : null}
    </div>
  );
}

export default FormGrid;
