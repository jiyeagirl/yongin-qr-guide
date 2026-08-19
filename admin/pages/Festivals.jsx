import React from "react";
import {
  PageHeader, Toolbar, DataTable, Modal, ConfirmDialog, Button, Select, Badge, EMPTY_MARK, Notice,
  FESTIVAL_STATES, festivalBadge,
} from "../../design-systems/admin.js";
import { FESTIVALS, DISTRICTS } from "../../screens/main/data/districts.js";
import { TODAY } from "../../screens/main/config.js";
import { FESTIVAL_FIELDS } from "../data/fields.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { RecordForm } from "./RecordForm.jsx";

/* A-FT-01 축제 관리 — 6건.
 *
 * ── 상태를 입력받지 않는다 ──────────────────────────────────────────────────
 * 진행중 · 예정 · 종료는 시작일·종료일에서 나오는 값이다 (U-FT-01). 담당자가 고르게 하면
 * 축제가 끝나도 "진행중"이 남고, 그것을 내리는 일이 또 하나의 할 일이 된다.
 * 표에는 계산된 상태를 보여주되 **고칠 수 없는 값**으로 둔다.
 *
 * ── 부스와 임시시설 칸이 없다 ───────────────────────────────────────────────
 * 정의서 1-3 에 없다. 명세서에서도 U-FT-04(부스 위치 안내)는 `C` — 상인회 자료가
 * 확보돼야 하는 조건부 항목이다. 여기에 빈 칸을 만들어 두면 담당자는 채워야 하는 것으로
 * 읽고, 채운 값의 출처는 아무도 모른다. 자료가 확보되면 정의서에 항목을 더하고 그 다음에
 * 이 폼에 온다 — 순서가 반대가 되면 안 된다.
 *
 * ── 6건짜리 목록에 필터를 셋 두지 않는다 ────────────────────────────────────
 * S12(시민용 축제 전체보기)에서 배운 것이다. 결과 수 · 정렬 · 상점가 Select 를 뒀다가
 * 걷어냈다 — 6건에서는 어느 차례든 한 화면에 다 들어와 정렬이 결과를 바꾸지 못했다.
 * 여기에도 상태 필터 하나만 둔다.
 */

/* 상태 색과 차례는 디자인 시스템의 표를 그대로 쓴다 (festivalState.js. 2026-08-19).
   여기에 따로 적어 두었더니 예정이 청록(info)이 되어, 담당자가 이 표에서 본 색과
   시민 화면의 색(크림)이 달랐다. 같은 축제를 두 색으로 말한 셈이다. */
const STATE_OPTIONS = [{ value: "", label: "전체 상태" }]
  .concat(FESTIVAL_STATES.map(v => ({ value: v, label: v })));

const DISTRICT_NAME = DISTRICTS.reduce((o, d) => { o[d.id] = d.name; return o; }, {});

/* 날짜에서 상태를 낸다. ISO 문자열이라 사전 순 비교가 곧 날짜 비교다.
   기준은 config.TODAY — 검수용 상수이며 실서비스에서는 서버 시각이 이 자리를 대신한다. */
function stateOf(f) {
  if (!f.start || !f.end) return "예정";
  if (f.end < TODAY) return "종료";
  if (f.start > TODAY) return "예정";
  return "진행중";
}

function periodOf(f) {
  if (!f.start) return EMPTY_MARK;
  const short = s => s.slice(5).replace("-", ".");
  return f.end && f.end !== f.start ? `${short(f.start)} ~ ${short(f.end)}` : short(f.start);
}

export function Festivals({ onToast }) {
  const { rows, upsert, remove } = useCollection("festivals", FESTIVALS);
  const [state, setState] = React.useState("");

  const ed = useRecordEditor({
    fieldsFor: () => FESTIVAL_FIELDS,
    initial: () => ({ districtId: DISTRICTS[0] ? DISTRICTS[0].id : "" }),
    onSave: values => upsert(values),
    onRemove: remove,
    onToast, label: "축제",
  });

  const list = rows.filter(f => !state || stateOf(f) === state);

  return (
    <>
      <PageHeader title="축제 관리" count={`${list.length}건`}
        note={`입력 항목은 정의서 1-3 을 따릅니다. 상태는 오늘(${TODAY}) 기준으로 자동 계산됩니다.`}
        action={<Button variant="primary" icon="plus" onClick={ed.openNew}>축제 등록</Button>} />

      <Toolbar>
        <Select value={state} options={STATE_OPTIONS} onChange={e => setState(e.target.value)} />
      </Toolbar>

      <DataTable
        caption="등록된 축제 목록"
        rows={list} rowKey="id" onRowClick={ed.openEdit}
        empty={{ title: "해당 상태의 축제가 없습니다." }}
        columns={[
          { key: "name", label: "축제명", sortable: true },
          { key: "districtId", label: "주최 상점가", width: 200, sortable: true,
            render: f => DISTRICT_NAME[f.districtId] || EMPTY_MARK },
          { key: "period", label: "기간", width: 150, render: periodOf,
            sortValue: f => f.start || "" },
          { key: "time", label: "시간", width: 130, render: f => f.time || EMPTY_MARK },
          { key: "state", label: "상태", width: 90, align: "center", hint: "자동 계산",
            render: f => <Badge size="sm" {...festivalBadge(stateOf(f))}>{stateOf(f)}</Badge>,
            sortValue: f => FESTIVAL_STATES.indexOf(stateOf(f)) },
          { key: "manage", label: "관리", width: 96, align: "right",
            render: f => (
              <Button variant="ghost" size="sm" icon="trash-2"
                onClick={() => ed.askRemove(f)} style={{ color: "var(--state-danger)" }}>삭제</Button>
            ) },
        ]} />

      <Modal open={!!ed.draft} size="md" onClose={ed.close}
        title={ed.draft && ed.draft.isNew ? "축제 등록" : "축제 수정"}
        description={ed.draft && !ed.draft.isNew ? ed.draft.values.name : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={ed.close}>취소</Button>
            <Button variant="primary" onClick={ed.save}>저장</Button>
          </>
        }>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors} onChange={ed.set}
            extra={
              <div style={{ gridColumn: "1 / -1" }}>
                <Notice tone="neutral" size="sm">
                  프로그램 일정표와 부스·임시시설 위치는 정의서 1-3 에 없어 입력받지 않습니다.
                  상인회 자료가 확보되면 정의서에 항목을 추가한 뒤 이 폼에 반영합니다 (명세서 U-FT-04).
                </Notice>
              </div>
            } />
        ) : null}
      </Modal>

      <ConfirmDialog open={!!ed.pending} name={ed.pending && ed.pending.name}
        description="축제를 삭제합니다." onClose={ed.cancelRemove} onConfirm={ed.confirmRemove} />
    </>
  );
}

export default Festivals;
