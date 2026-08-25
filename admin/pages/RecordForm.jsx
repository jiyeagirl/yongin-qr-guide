import React from "react";
import { FormGrid, FormField, AddressField } from "../../design-systems/admin.js";
import { KAKAO_APP_KEY } from "../../screens/main/config.js";

/* 항목표 한 줄 → 입력 칸 하나. 열두 화면의 폼이 전부 이 몇 줄로 끝난다.
 *
 * 폼을 JSX 로 손수 적지 않는 이유는 명세서와 어긋나는 것을 막기 위해서다. 항목의
 * 이름·차례·필수 여부·범위·예시가 전부 data/fields.js 에 있고, 여기서는 그것을 그대로 그린다.
 * 화면이 항목을 하나 더 넣고 싶어도 넣을 자리가 없다 — 그게 이 구조의 요점이다.
 *
 * ── 붙일 자리가 셋 있다 ─────────────────────────────────────────────────────
 *   before  어느 항목표를 쓸지 정하는 선택 (공공시설의 시설 유형)
 *   slots   항목표의 **한 칸을 통째로 갈아끼운다** (조아용 그리드, 좌표 지도)
 *   extra   항목표 뒤에 붙는 것 (1:N 목록, 안내)
 *
 * ── 폼 아래 설명 문단을 기본으로 달지 않는다 (2026-08-20) ───────────────────
 * 여섯 폼이 전부 같은 세 문장을 밑에 달고 있었다 ("선택 항목을 비워두면 …"). 담당자는
 * 그 문장을 첫날 한 번 읽고 그 뒤로는 매번 넘긴다 — 폼을 여는 이유는 값을 넣는 것이지
 * 원칙을 다시 읽는 것이 아니다. 그 자리에 **이 폼에서만 필요한 말**이 있을 때는 화면이
 * `note` 로 직접 넘긴다 (계정 폼의 비밀번호 규칙처럼).
 *
 * slots 가 필요한 이유: 조아용 이미지(character_id)와 좌표는 명세서의 **항목표에 있는
 * 항목**이라 뒤에 따로 붙이면 차례가 어긋난다. 그렇다고 FormField 에 그 그림들을
 * 넣으면 디자인 시스템이 축제 에셋 목록을 알게 된다. 표의 자리는 그대로 두고
 * 그 칸에 들어갈 것만 화면이 넘긴다.
 *
 * ── 주소는 특별하다 (V-02) ──────────────────────────────────────────────────
 * `type: "address"` 는 칸 하나를 고치는 것이 아니라 **셋을 한꺼번에** 고친다 —
 * 주소·위도·경도. 검색 결과가 좌표를 함께 들고 오기 때문이고, 그것이 명세서 입력 원칙
 * 3번("좌표는 주소 입력 시 자동 변환")이 실제로 동작하는 방식이다. 그래서 onChange 가
 * 아니라 onAddress 로 따로 받는다.
 */
export function RecordForm({
  fields = [], values = {}, errors = {}, onChange, onAddress,
  before, extra, slots = {}, note, columns = 2,
}) {
  return (
    <FormGrid note={note} columns={columns}>
      {before}
      {fields.map(f => {
        if (slots[f.key] !== undefined) {
          /* ── 좌표 칸에는 표의 값을 얹어 준다 (2026-08-25) ──────────────────────
             슬롯은 화면이 통째로 만들어 넘기는 물건이라 보통은 손대지 않는다. 좌표만
             예외인 이유: **필수 여부와 오류는 항목표가 정하는 것**인데(2026-08-25 부터
             ● 이다) 슬롯을 세 화면이 각자 만들고 있어, 그대로 두면 세 곳이 같은 값을
             베껴 적게 된다 — 표를 고쳐도 화면이 따라오지 않는 구조가 그것이다.
             `type: "coord"` 로 좁혀 두어 다른 슬롯(축제의 조아용 그리드)은 지나간다. */
          const slot = slots[f.key];
          const filled = f.type === "coord" && React.isValidElement(slot)
            ? React.cloneElement(slot, { required: f.required, error: errors[f.key] })
            : slot;
          return <React.Fragment key={f.key}>{filled}</React.Fragment>;
        }

        if (f.type === "address") {
          return (
            <AddressField key={f.key} label={f.label} required={f.required} example={f.example}
              range={f.range} error={errors[f.key]} span={f.span || 2} appKey={KAKAO_APP_KEY}
              value={values[f.key]}
              onSelect={picked => (onAddress ? onAddress(f.key, picked) : onChange(f.key, picked.addr))} />
          );
        }

        return (
          <FormField key={f.key}
            label={f.label} required={f.required} example={f.example} range={f.range} hint={f.hint}
            error={errors[f.key]}
            type={f.type} options={f.options} rows={f.rows} span={f.span} unit={f.unit}
            min={f.min} max={f.max} maxLength={f.maxLength} disabled={f.disabled}
            reveal={f.reveal}
            value={values[f.key]}
            onChange={v => onChange(f.key, v)} />
        );
      })}
      {extra}
    </FormGrid>
  );
}

export default RecordForm;
