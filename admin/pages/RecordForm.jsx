import React from "react";
import { FormGrid, FormField } from "../../design-systems/admin.js";
import { EMPTY_NOTE } from "../data/fields.js";

/* 항목표 한 줄 → 입력 칸 하나. 여섯 화면의 폼이 전부 이 세 줄로 끝난다.
 *
 * 폼을 JSX 로 손수 적지 않는 이유는 정의서와 어긋나는 것을 막기 위해서다. 항목의
 * 이름·차례·필수 여부·예시가 전부 data/fields.js 에 있고, 여기서는 그것을 그대로 그린다.
 * 화면이 항목을 하나 더 넣고 싶어도 넣을 자리가 없다 — 그게 이 구조의 요점이다.
 *
 * `before` 와 `extra` 는 정의서 항목이 **아닌** 것을 붙이는 자리다 — 앞은 어느 항목표를
 * 쓸지 정하는 선택(시설 유형), 뒤는 보조 화면(좌표 지도 미리보기). 둘 다 항목표 밖에
 * 두므로 입력 항목과 섞이지 않고, 담당자가 "이것도 공공데이터 항목인가"를 묻지 않는다.
 */
export function RecordForm({ fields = [], values = {}, errors = {}, onChange, before, extra, note = EMPTY_NOTE }) {
  return (
    <FormGrid note={note}>
      {before}
      {fields.map(f => (
        <FormField key={f.key}
          label={f.label} required={f.required} example={f.example} error={errors[f.key]}
          type={f.type} options={f.options} rows={f.rows} span={f.span}
          value={values[f.key]}
          onChange={v => onChange(f.key, v)} />
      ))}
      {extra}
    </FormGrid>
  );
}

export default RecordForm;
