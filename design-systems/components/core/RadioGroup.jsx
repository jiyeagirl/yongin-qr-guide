import React from "react";
import { Radio } from "./Radio.jsx";

/* 라디오 묶음 — S10 오류신고의 "신고 유형"이 첫 사용처다.
 *
 * Radio 를 화면에서 그냥 여러 개 늘어놓지 않고 이 컴포넌트를 쓰는 이유는 두 가지다.
 *
 *  1. 접근성. 낱개 라디오에는 "무엇을 고르는 중인지"가 없다. fieldset/legend 로 묶어야
 *     스크린리더가 "신고 유형, 5개 중 2번째"처럼 읽는다. 낱개로 두면 선택지 이름만 읽힌다.
 *  2. 오류 표시. 폼 검증에서 "유형을 골라주세요"는 특정 라디오가 아니라 묶음 전체에 붙는다.
 *     Radio 에 error prop 을 달면 다섯 줄 중 어디에 붙일지가 화면마다 달라진다.
 *
 * 선택지는 세로로만 쌓는다. 가로로 늘어놓으면 글자를 키웠을 때(2차) 줄이 깨지는데,
 * 라디오는 줄이 깨지면 어느 글자가 어느 동그라미의 것인지 알 수 없게 된다.
 */
export function RadioGroup({ label, name, options = [], value, onChange, hint, error, required, style, ...rest }) {
  return (
    <fieldset style={{ border: "none", padding: 0, margin: 0, minWidth: 0, ...style }}
      aria-invalid={error ? "true" : undefined} {...rest}>
      {label ? (
        <legend style={{ padding: 0, fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)",
          color: "var(--text-heading)", marginBottom: 2 }}>
          {label}
          {required ? <span aria-hidden="true" style={{ color: "var(--state-danger)", marginLeft: 3 }}>*</span> : null}
          {required ? <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>필수</span> : null}
        </legend>
      ) : null}

      {/* 오류가 있으면 묶음 왼쪽에 붉은 띠를 세운다. 문구만으로는 어느 항목의 오류인지
          한눈에 안 잡힌다 — 폼이 길어질수록 그렇다 */}
      <div style={{ display: "flex", flexDirection: "column",
        marginTop: "var(--space-2)", paddingLeft: error ? "var(--space-3)" : 0,
        borderLeft: error ? "var(--stroke-outline) solid var(--state-danger)" : "none" }}>
        {options.map(o => {
          const v = o.value ?? o;
          return (
            <Radio key={v} name={name} label={o.label ?? o}
              checked={value === v} onChange={() => onChange && onChange(v)} />
          );
        })}
      </div>

      {error || hint ? (
        <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", lineHeight: 1.5,
          color: error ? "var(--state-danger)" : "var(--text-muted)" }}>
          {error || hint}
        </p>
      ) : null}
    </fieldset>
  );
}

export default RadioGroup;
