import React from "react";
import {
  PageHeader, Toolbar, DataTable, ConfirmDialog, Button, Select, Badge, Notice, Switch,
  Pagination, AssetPicker, Repeater, ConditionalBadge, Mascot,
  FESTIVAL_STATES, festivalBadge, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { FESTIVALS, DISTRICTS } from "../../screens/main/data/districts.js";
import { TODAY } from "../../screens/main/config.js";
import { FESTIVAL_FIELDS, PROGRAM_COLUMNS, BOOTH_COLUMNS } from "../data/fields.js";
import { CHARACTER_ASSETS, CHARACTER_DEFAULT, ASSET_BASE } from "../data/assets.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, PageSizeSelect, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";
import { ImageField } from "./ImageField.jsx";

/* M07 축제 목록 · M08 축제 등록·수정 — 6건.
 *
 * ── 상태를 입력받지 않는다 (명세서 2-3) ────────────────────────────────────
 * 진행 예정 · 진행 중 · 완료는 시작일·종료일에서 나오는 값이다. 담당자가 고르게 하면
 * 축제가 끝나도 "진행 중"이 남고, 그것을 내리는 일이 또 하나의 할 일이 된다.
 * **종료일이 지나도 삭제하거나 숨기지 않고 완료 카테고리로 옮겨** 계속 노출한다.
 *
 * 상태 이름이 명세서와 시민 화면에서 조금 다르다 — 명세서는 "진행 예정 · 진행 중 · 완료",
 * 시민 화면은 "예정 · 진행중 · 종료"다. **가리키는 것은 같은 셋**이고, 이름표는 시민 화면의
 * 것을 쓴다: 담당자가 관리자에서 본 낱말과 실제 화면의 낱말이 다르면 같은 축제를 두 이름으로
 * 말하게 된다. 대신 명세서가 정한 **노출 카테고리**(진행 / 완료)를 열로 따로 보여준다 —
 * 그것은 이름이 아니라 이 축제가 시민 화면 어디에 실리는지의 문제라 감출 수 없다.
 *
 * ── 조아용 이미지가 필수인 이유 ─────────────────────────────────────────────
 * 축제 자료가 이미지 파일로 제공되고 수기 입력이 전제라 카드에 넣을 사진이 없다.
 * 조아용 에셋이 그 자리를 대신하고, 그래서 비워둘 수 없다 (명세서 2-3).
 * 다른 축제가 이미 쓰는 그림에는 표시가 붙는다 — 6건이 모두 같은 그림이면 둘러보기 탭이
 * 단조로워지는데, 등록하는 사람은 자기 축제 하나만 보고 있어 그 사실을 알 방법이 없다.
 *
 * ── 프로그램·부스는 조건부다 (명세서 2-4 · 2-5, 우선순위 `C`) ───────────────
 * "용인시 자료 제공 범위 확정 후 반영 여부 결정". 칸은 만들되 **조건부라고 적어 둔다** —
 * 표시가 없으면 담당자는 반드시 채워야 하는 것으로 읽고, 채운 값의 출처는 아무도 모른다.
 * 부스가 두 가지 위치 지정 방식을 다 받는 것도 같은 이유다. 제공 자료가 좌표 목록일지
 * 배치도 이미지일지 확정되지 않았다.
 */

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

/* 명세서 2-3 의 노출 카테고리. 예정과 진행중이 한 덩이고 종료만 따로다 */
const categoryOf = f => (stateOf(f) === "종료" ? "완료" : "진행");

function periodOf(f) {
  if (!f.start) return EMPTY_MARK;
  const short = s => s.slice(5).replace("-", ".");
  return f.end && f.end !== f.start ? `${short(f.start)} ~ ${short(f.end)}` : short(f.start);
}

export function Festivals({ onToast }) {
  const { rows, upsert, remove, patch } = useCollection("festivals", FESTIVALS, null, "축제");
  const [state, setState] = React.useState("");
  const list0 = useListState([state]);

  const ed = useRecordEditor({
    fieldsFor: () => FESTIVAL_FIELDS,
    initial: () => ({
      districtId: DISTRICTS[0] ? DISTRICTS[0].id : "",
      pose: CHARACTER_DEFAULT, visible: true, programs: [], booths: [],
    }),
    onSave: values => upsert(values),
    onRemove: remove,
    onToast, label: "축제",
    /* 항목 하나만 봐서는 알 수 없는 검사들 */
    extraValidate: v => {
      const bad = {};
      /* V-07 — 종료일 ≥ 시작일 (같은 날 허용) */
      if (v.start && v.end && v.end < v.start) bad.end = "종료일은 시작일과 같거나 뒤여야 합니다 (V-07).";
      if (!v.pose) bad.pose = "조아용 이미지를 골라 주세요.";
      /* 배치도 방식 부스가 하나라도 있으면 배치도 이미지가 필수다 (명세서 2-5) */
      const needsMap = (v.booths || []).some(b => b.posType === "plan");
      if (needsMap && !v.boothMap) bad.boothMap = "배치도 상대좌표를 쓰는 부스가 있어 배치도 이미지가 필요합니다.";
      /* 부스 번호는 축제 안에서 유일해야 한다 */
      const nos = (v.booths || []).map(b => b.no).filter(Boolean);
      if (new Set(nos).size !== nos.length) bad.booths = "부스 번호가 겹칩니다. 축제 안에서 유일해야 합니다.";
      return bad;
    },
  });

  /* 어느 그림을 어느 축제가 쓰고 있나 — 지금 고치는 축제는 뺀다 (자기 자신은 겹침이 아니다) */
  const usedBy = React.useMemo(() => {
    const o = {};
    rows.forEach(f => {
      if (ed.draft && f.id === ed.draft.values.id) return;
      if (!f.pose) return;
      o[f.pose] = (o[f.pose] || []).concat(f.name);
    });
    return o;
  }, [rows, ed.draft]);

  const filtered = rows.filter(f => {
    if (state && stateOf(f) !== state) return false;
    if (!list0.term) return true;
    return `${f.name} ${DISTRICT_NAME[f.districtId] || ""} ${f.program || ""}`.includes(list0.term);
  });
  const paged = list0.paginate(filtered);

  return (
    <>
      <PageHeader title="축제 정보 관리" count={`${filtered.length}건`}
        note={`상태는 오늘(${TODAY}) 기준으로 자동 판정되며 직접 고를 수 없습니다.`}
        action={<Button variant="primary" icon="plus" onClick={ed.openNew}>축제 등록</Button>} />

      <Toolbar>
        <ListSearch state={list0} placeholder="축제명 · 상점가 검색" />
        <Select value={state} options={STATE_OPTIONS} onChange={e => setState(e.target.value)} />
        <PageSizeSelect state={list0} />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="등록된 축제 목록"
        rows={paged.rows} rowKey="id" onRowClick={ed.openEdit}
        empty={{ title: "해당 상태의 축제가 없습니다." }}
        columns={[
          { key: "name", label: "축제명", sortable: true },
          { key: "pose", label: "조아용", width: 88, align: "center", hint: "카드 그림",
            render: f => (f.pose
              ? <Mascot pose={f.pose} size={32} base={ASSET_BASE} alt="" />
              : <Badge tone="danger" size="sm">없음</Badge>) },
          { key: "districtId", label: "상권명", width: 190, sortable: true,
            render: f => DISTRICT_NAME[f.districtId] || EMPTY_MARK },
          { key: "period", label: "기간", width: 150, render: periodOf, sortValue: f => f.start || "" },
          { key: "time", label: "시간", width: 120, render: f => f.time || EMPTY_MARK },
          { key: "state", label: "상태", width: 90, align: "center", hint: "자동 판정",
            render: f => <Badge size="sm" {...festivalBadge(stateOf(f))}>{stateOf(f)}</Badge>,
            sortValue: f => FESTIVAL_STATES.indexOf(stateOf(f)) },
          { key: "category", label: "노출 카테고리", width: 120, align: "center", hint: "시민 화면",
            render: f => <Badge tone="neutral" size="sm">{categoryOf(f)}</Badge> },
          { key: "visible", label: "노출 여부", width: 104, align: "center",
            render: f => (
              <Switch checked={f.visible !== false} aria-label={`${f.name} 노출 여부`}
                onChange={() => patch(f.id, { visible: f.visible === false }, f.name)} />
            ) },
          { key: "manage", label: "관리", width: 96, align: "center",
            render: f => (
              <Button variant="ghost" size="sm" icon="trash-2"
                onClick={() => ed.askRemove(f)} style={{ color: "var(--state-danger)" }}>삭제</Button>
            ) },
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      <EditorModal ed={ed} size="xl"
        title={ed.draft && ed.draft.isNew ? "축제 등록" : "축제 수정"}
        description={ed.draft && !ed.draft.isNew
          ? `${ed.draft.values.name} · ${stateOf(ed.draft.values)} (${categoryOf(ed.draft.values)} 카테고리)` : undefined}>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors} onChange={ed.set}
            extra={
              <>
                <AssetPicker value={ed.draft.values.pose} onChange={v => ed.set("pose", v)}
                  assets={CHARACTER_ASSETS} usedBy={usedBy} base={ASSET_BASE} error={ed.errors.pose} />

                <div style={{ gridColumn: "1 / -1", paddingTop: "var(--space-4)",
                  borderTop: "var(--stroke-hairline) solid var(--border-default)" }}>
                  <Notice tone="warning" size="sm" title="아래 두 항목은 조건부입니다">
                    용인시가 제공하는 자료의 범위가 확정되지 않아 반영 여부가 정해지지 않았습니다.
                    자료를 받기 전에는 비워 두세요 — 지금 채운 값의 출처를 나중에 아무도 알 수 없습니다.
                  </Notice>
                </div>

                <Repeater
                  title="프로그램 일정"
                  badge={<ConditionalBadge />}
                  columns={PROGRAM_COLUMNS} rows={ed.draft.values.programs || []}
                  onChange={p => ed.set("programs", p)}
                  addLabel="프로그램 추가"
                  empty="프로그램 일정이 없으면 시민 화면의 축제 상세에 그 구획이 그려지지 않습니다."
                  note="시작 일시는 축제 기간 안이어야 합니다. 노출 순서는 적은 차례를 따릅니다." />

                <Repeater
                  title="부스 위치"
                  badge={<ConditionalBadge />}
                  columns={BOOTH_COLUMNS} rows={ed.draft.values.booths || []}
                  onChange={b => ed.set("booths", b)}
                  addLabel="부스 추가" error={ed.errors.booths}
                  newRow={() => ({ posType: "coord", type: "먹거리" })}
                  empty="부스 목록이 없으면 시민 화면에 부스 안내가 나오지 않습니다."
                  note={"위치 지정이 「실제 좌표」면 위도, 경도를 쉼표로 적습니다 (37.2887, 127.1993). "
                    + "「배치도 상대좌표」면 배치도 안에서의 위치를 백분율로 적습니다 (48, 62). "
                    + "부스 번호는 이 축제 안에서 유일해야 합니다."} />

                <ImageField label="부스 배치도" value={ed.draft.values.boothMap}
                  onChange={v => ed.set("boothMap", v)} error={ed.errors.boothMap}
                  badge={<ConditionalBadge />}
                  note="배치도 상대좌표를 쓰는 부스가 하나라도 있으면 필수입니다." />
              </>
            } />
        ) : null}
      </EditorModal>

      <ConfirmDialog open={!!ed.pending} name={ed.pending && ed.pending.name}
        description="축제를 삭제합니다."
        footnote="종료된 축제는 삭제하지 않고 그대로 두는 것이 원칙입니다 — 완료 카테고리로 옮겨 계속 노출됩니다. 잘못 등록한 건만 지웁니다."
        onClose={ed.cancelRemove} onConfirm={ed.confirmRemove} />
    </>
  );
}

export default Festivals;
