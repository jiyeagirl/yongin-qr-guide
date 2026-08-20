import React from "react";
import { Input } from "../core/Input.jsx";
import { Select } from "../core/Select.jsx";
import { Textarea } from "../core/Textarea.jsx";
import { Switch } from "../core/Switch.jsx";
import { Checkbox } from "../core/Checkbox.jsx";
import { Badge } from "../core/Badge.jsx";
import { EMPTY_MARK } from "../core/InfoList.jsx";

/* 관리자 입력 폼 — 기능명세서의 항목표를 그대로 화면에 옮기는 자리.
 *
 * ── 이 컴포넌트의 존재 이유는 배치가 아니라 "필수 열" 이다 ──────────────────
 * 명세서의 항목표에는 **필수** 열이 있고 값이 넷이다 (표기 규칙, 명세서 머리말):
 *
 *   ● 필수    비우면 저장되지 않는다
 *   ○ 선택    비워도 된다. 시민 화면에 "-" 가 뜬다
 *   ◐ 조건부  다른 칸의 값에 따라 필수가 된다 (설치완료면 설치일자, …)
 *   ⚙ 자동    사람이 넣지 않는다. 규칙이나 집계가 만든다
 *
 * 이 넷이 **화면에서 서로 다르게 보여야** 한다. 하나로 뭉개면 담당자는 ⚙ 칸을
 * 비어 있는 필수 칸으로 읽고 아무 값이나 채운다 — 그 순간 집계값이 수기값이 되고,
 * 다음 동기화에서 그것이 되살아나 어느 쪽이 맞는지 아무도 모르게 된다.
 *
 * 그래서 항목마다 배지가 붙는다. 색만으로 말하지 않는다 — 배지 안에
 * "필수" · "선택" · "조건부" · "자동" 이라고 글자로 적혀 있다.
 *
 * ── 범위를 화면에 적는다 ────────────────────────────────────────────────────
 * 명세서의 **범위** 열(`2~40자`, `0~9999`)이 칸 아래에 그대로 온다. maxlength 로 막기만
 * 하면 담당자는 글자가 더 안 써지는 이유를 모른 채 지우게 된다. 명세서가
 * "DB 컬럼 길이와 프론트 maxlength 를 동일하게 맞춘다"고 적은 그 값이다.
 *
 * ── 예시값을 힌트로 적는다 ──────────────────────────────────────────────────
 * 명세서의 "예)" 열이 여기로 온다. 개방시간처럼 형식이 자유로운 칸은 예시가 없으면
 * 담당자마다 다르게 적고("24시간" / "상시" / "00:00~24:00"), 그 흔들림이 그대로
 * 시민 화면에 나온다. placeholder 가 아니라 칸 아래 힌트로 적는 이유는
 * placeholder 가 입력을 시작하는 순간 사라지기 때문이다.
 *
 * ── 두 열이다 ───────────────────────────────────────────────────────────────
 * 한 열로 늘어놓으면 화장실 폼이 10칸이라 스크롤이 생기고, 스크롤이 생기면 아래
 * [저장]이 보이지 않는다. 긴 값(주소·부가정보)만 span={2} 로 한 줄을 다 쓴다.
 */

/* 필수 열의 네 값. 문자열 키로 두는 이유는 항목표(fields.js)가 명세서의 기호를
   그대로 옮겨 적기 위해서다 — required: true / false / "cond" / "auto" */
const REQUIRED_BADGE = {
  true: { label: "필수", tone: "danger" },
  false: { label: "선택", tone: "neutral" },
  cond: { label: "조건부", tone: "warning" },
  auto: { label: "자동", tone: "info" },
};

export function requiredKey(required) {
  if (required === "cond" || required === "auto") return required;
  return required ? "true" : "false";
}

/* 항목 하나. children 을 주면 그것을 쓰고, 없으면 type 에 맞는 컨트롤을 만든다.
   타입 스위치를 여기에 두는 이유: 화면 열넷이 저마다 switch 문을 갖게 하면
   "select 는 어떻게 그리더라"가 열네 벌이 되고, 그중 하나는 반드시 달라진다. */
export function FormField({
  label, required = false, example, range, hint, error,
  type = "text", value, onChange, options, placeholder, rows, min, max, maxLength, unit, disabled,
  span = 1, children, style, ...rest
}) {
  const set = v => { if (onChange) onChange(v); };
  const badge = REQUIRED_BADGE[requiredKey(required)];
  const readOnly = type === "readonly" || required === "auto";

  let control = children;
  if (!control) {
    if (readOnly) {
      /* 규칙이나 집계가 만드는 값(노출 점포수 · AED 명칭 · 조회수 …). 입력칸처럼 생겼는데
         못 고치면 고장으로 읽히므로, 아예 다른 모양으로 둔다 — 점선 테두리에 가라앉은 바탕 */
      control = (
        <div style={{ minHeight: "var(--tap-min)", display: "flex", alignItems: "center", gap: 6,
          padding: "8px 12px", background: "var(--surface-sunken)",
          border: "var(--stroke-hairline) dashed var(--border-strong)", borderRadius: "var(--radius-control)",
          fontSize: "var(--fs-body)", color: value == null || value === "" ? "var(--text-muted)" : "var(--text-body)" }}>
          {value == null || value === "" ? EMPTY_MARK : String(value)}
          {unit && value != null && value !== "" ? (
            <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>{unit}</span>
          ) : null}
        </div>
      );
    } else if (type === "select") {
      control = <Select options={options} value={value == null ? "" : value} disabled={disabled}
        onChange={e => set(e.target.value)} />;
    } else if (type === "multiselect") {
      /* 온누리 상품권 종류(지류 · 디지털)처럼 **여럿을 고를 수 있고 아무것도 안 고를 수도**
         있는 항목. Select 로는 "둘 다"를 말할 수 없고, Switch 를 종류마다 두면 그것들이
         서로 무관한 항목처럼 흩어진다. 한 줄에 체크박스로 묶어 하나의 항목으로 남긴다. */
      const picked = Array.isArray(value) ? value : [];
      control = (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", minHeight: "var(--tap-min)",
          alignItems: "center" }}>
          {(options || []).map(o => {
            const v = o.value == null ? o : o.value;
            const on = picked.includes(v);
            return (
              <Checkbox key={v} label={o.label == null ? v : o.label} checked={on} disabled={disabled}
                style={{ minHeight: 0, padding: 0 }}
                onChange={() => set(on ? picked.filter(x => x !== v) : picked.concat(v))} />
            );
          })}
        </div>
      );
    } else if (type === "textarea") {
      control = <Textarea value={value == null ? "" : value} rows={rows || 3} placeholder={placeholder}
        maxLength={maxLength} disabled={disabled} onChange={e => set(e.target.value)} />;
    } else if (type === "switch") {
      /* 가부 항목. 저장되는 값은 불리언이고 표시(○·×)는 읽는 쪽이 정한다 —
         여기서 글자로 굳히면 시민 화면과 표기가 갈린다 */
      control = (
        <div style={{ minHeight: "var(--tap-min)", display: "flex", alignItems: "center" }}>
          <Switch checked={!!value} disabled={disabled}
            label={value ? "있음 · 예" : "없음 · 아니오"} onChange={() => set(!value)} />
        </div>
      );
    } else {
      const input = (
        <Input type={type === "number" ? "number" : type} value={value == null ? "" : value}
          placeholder={placeholder} disabled={disabled}
          onChange={e => set(e.target.value)}
          min={min} max={max} maxLength={maxLength} />
      );
      /* 단위는 입력값의 일부가 아니다. 칸 안에 "명"을 적게 하면 "40명"이 저장되고,
         그 문자열은 정렬도 합산도 되지 않는다 — 칸 밖에 글자로 붙인다 */
      control = unit ? (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>{input}</div>
          <span style={{ flex: "0 0 auto", fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>{unit}</span>
        </div>
      ) : input;
    }
  }

  /* 아래 한 줄에 무엇을 적는가 — 오류가 있으면 오류만, 없으면 범위와 예시를 이어 붙인다.
     오류가 났을 때 예시까지 함께 남기면 빨간 줄과 회색 줄이 나란히 서서 어느 쪽이
     지금 일어난 일인지 알 수 없다. */
  const foot = error || [range, example ? `예) ${example}` : null, hint].filter(Boolean).join(" · ");

  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : "auto", minWidth: 0, ...style }} {...rest}>
      {/* flexWrap 이 있어야 한다. 배지는 통째로만 서므로(Badge 가 nowrap 이다), 두 열
          그리드의 좁은 칸에서 이름이 긴 항목("온누리 원본 표기명" · "상권업종소분류명")은
          이름과 배지의 합이 칸을 넘는다. 감싸지 않으면 배지가 칸 밖으로 삐져나가 옆
          항목 위에 얹힌다 — 줄을 하나 더 쓰는 편이 낫다 */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center",
        gap: "var(--space-2)", rowGap: 4, marginBottom: 6 }}>
        <span style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>
          {label}
        </span>
        <Badge tone={badge.tone} size="sm">{badge.label}</Badge>
      </div>
      {control}
      {foot ? (
        <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", lineHeight: 1.5,
          color: error ? "var(--state-danger)" : "var(--text-muted)" }}>
          {foot}
        </p>
      ) : null}
    </div>
  );
}

/* 항목표 안의 소제목. 공공시설처럼 "공통 필드 + 유형별 필드"로 나뉘는 폼에서
   어디까지가 어느 표인지 선을 긋는다 — 선이 없으면 담당자는 화장실 칸수 넷이
   모든 시설에 있는 항목인 줄 안다. */
export function FormSection({ title, note, badge, children }) {
  return (
    <div style={{ gridColumn: "1 / -1", paddingTop: children ? 0 : "var(--space-2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
        paddingTop: "var(--space-3)", borderTop: "var(--stroke-hairline) solid var(--border-default)" }}>
        <span style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)" }}>
          {title}
        </span>
        {badge}
      </div>
      {note ? (
        <p style={{ marginTop: 4, fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
          {note}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/* 폼 전체. note 는 폼 아래 한 줄 — 선택 항목을 비웠을 때 시민 화면이 어떻게 되는지를
   적는 자리다. 담당자에게는 그 결과를 볼 방법이 지금 없다. */
export function FormGrid({ children, note, columns = 2, style, ...rest }) {
  return (
    <div style={style} {...rest}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: "var(--space-4) var(--space-5)", alignItems: "start" }}>
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
