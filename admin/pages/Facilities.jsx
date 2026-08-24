import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, Button, Select, Switch, Badge, Pagination, ConfirmDialog,
  SegmentedTabs, FacilityIcon, FACILITY_LABELS, FACILITY_TYPES, CoordField, fixCoord, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { FACILITIES, facilityName } from "../../screens/main/data/facilities.js";
import { KAKAO_APP_KEY } from "../../screens/main/config.js";
import { FACILITY_FIELDS } from "../data/fields.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";
import {
  removedTab, removedColumns, removedEmpty, undoToast, HIDE_ON_RESTORE, VIEW_ALL, VIEW_REMOVED,
} from "./RemovedItems.jsx";

/* M09 공공시설 목록 · M10 공공시설 등록·수정 — **관리자 목록 화면의 기준이다.**
 *
 * 여기서 정한 골격(머리 → 유형 탭 → 필터 줄 → 표 → 다이얼로그 폼 → 삭제 확인)을 나머지
 * 목록 화면들이 그대로 복제한다. 시민용에서 S05 시설 상세가 상세 화면의 기준이었던 것과
 * 같은 자리다. 새 관리 화면을 만들 때 이 배치를 다시 정하지 않는다.
 *
 * ── 유형에 따라 폼이 통째로 갈린다 (명세서 3-2 ~ 3-5) ──────────────────────
 * AED 는 3개 항목, 화장실은 12개다. 한 폼에 전부 펼쳐놓고 "해당 없으면 비우세요"로 두면
 * AED 를 등록하는 담당자가 기저귀 교환대 칸을 보게 되고, 그 칸을 비운 것이 "없음"인지
 * "해당 없음"인지 데이터로는 구분되지 않는다.
 *
 * ── 유형을 나중에 바꿀 수 없다 ──────────────────────────────────────────────
 * 등록할 때만 고른다. 수정에서 유형을 바꾸면 이미 채운 항목의 절반이 갈 곳을 잃는데
 * (화장실 → AED 로 바꾸면 칸수 넷과 비상벨이 사라진다), 그것을 조용히 버릴지 물어볼지가
 * 또 하나의 결정이 된다. 잘못 등록했다면 지우고 다시 넣는 편이 짧고 분명하다.
 *
 * ── 필터를 탭으로 둔다 ──────────────────────────────────────────────────────
 * 유형이 넷뿐이고 담당자가 이 화면에 오는 이유의 대부분이 "화장실 목록을 보려고"다.
 * Select 안에 접어 두면 한 번 더 눌러야 하고, 지금 무엇으로 좁혀져 있는지도 덜 보인다.
 * 유형이 늘 다섯 이상이 되면 Select 로 돌아가야 한다.
 *
 * ── 노출 토글은 표에서 바로 누른다 ──────────────────────────────────────────
 * 다이얼로그를 열어야 끄고 켤 수 있으면, 급히 하나 내려야 할 때(잠긴 화장실 신고가
 * 들어왔을 때) 세 번을 눌러야 한다. 폼 안에도 있는 이유는 명세서 3-1 의 항목이기
 * 때문이고, 표의 토글은 그 항목으로 가는 지름길이다.
 *
 * ── 데이터 기준일이 이 화면에 없다 (명세서 7장) ────────────────────────────
 * 유형마다 다른 기준월을 갖지만 **개별 등록 화면에는 입력란을 두지 않는다.** 갱신이
 * 원천 파일 단위로 일어나므로 건별로 적으면 같은 날 받은 자료에 다른 날짜가 붙는다.
 * 대신 머리에 지금 값이 무엇인지 적는다 — 담당자가 [데이터 갱신 현황]으로 가야
 * 알 수 있게 두면, 여기서 고친 자료가 어느 달 기준으로 나가는지 모른 채 저장한다.
 */

const TYPE_TABS = [{ id: "", label: "전체" }]
  .concat(FACILITY_TYPES.map(t => ({ id: t, label: FACILITY_LABELS[t] })));

/* 목록의 "주요 항목" 열에 무엇을 적을지. 유형마다 담당자가 가장 먼저 확인하는 값이 다르다 —
   화장실은 칸수가 아니라 **개방시간**이다(잠겨 있으면 칸수는 소용없다), 대피소는 수용 인원이다. */
function summaryOf(f) {
  if (f.type === "toilet" || f.type === "rest") return f.hours || EMPTY_MARK;
  if (f.type === "aed") return f.place || EMPTY_MARK;
  if (f.type === "shelter") {
    return f.capacity != null ? `약 ${Number(f.capacity).toLocaleString("ko-KR")}명` : (f.place || EMPTY_MARK);
  }
  return EMPTY_MARK;
}

/* 명칭을 주소에서 만드는 유형 (U-FC-10) — 원천 자료에 이름 항목이 없는 둘이다 */
const DERIVED_TYPES = ["aed", "shelter"];

/* 주소에서 만들어지는 이름. `facilityName` 은 값이 있으면 그것을 그대로 돌려주므로
   이름을 지우고 넘겨야 "만들어질 이름"이 나온다 */
const autoName = row => facilityName({ ...row, name: null });

/* 저장 직전 보정 — 이름이 **비어 있을 때만** 주소에서 만든다 (2026-08-20).
   전에는 매번 다시 만들어 덮었다. 그러면 담당자가 고친 이름이 저장하는 순간 사라지는데,
   화면에서는 분명히 고쳐 놓고 목록으로 돌아오면 옛 이름이 서 있다 — 무엇이 잘못됐는지
   알 수 없는 종류의 고장이다. `facilityName` 이 이미 "값이 있으면 그것"이라 한 줄이면 된다.

   규칙은 screens/main/data/facilities.js 하나뿐이다. 여기 다시 적으면 주소를 고쳤을 때
   관리자 목록과 시민 화면의 이름이 갈린다. */
function derive(row) {
  if (!DERIVED_TYPES.includes(row.type)) return row;
  return { ...row, name: facilityName(row) };
}

export function Facilities({ onToast }) {
  const { rows, removed, upsert, remove, restore, patch, patchMany } = useCollection("facilities", FACILITIES, derive, "공공시설");
  const [type, setType] = React.useState("");
  const list0 = useListState([type]);

  const fieldsFor = React.useCallback(v => FACILITY_FIELDS[v.type] || FACILITY_FIELDS.aed, []);
  const ed = useRecordEditor({
    fieldsFor,
    /* 유형을 미리 골라 둔다 — 비워두면 폼이 어떤 항목을 보일지 정하지 못한다 */
    initial: () => ({ type: "aed", visible: true }),
    onSave: values => upsert(values),
    onRemove: remove,
    onToast, label: "공공시설",
  });

  /* ── 삭제된 항목은 **유형 탭 줄에 이어 붙인다** (2026-08-24) ─────────────────
     다른 네 화면은 「전체 | 삭제된 항목 n」 두 칸짜리 탭 줄을 새로 갖지만, 이 화면에는
     그 줄이 이미 있다 (전체 · AED · 화장실 · 쉼터 · 대피소). 탭 줄을 하나 더 얹으면
     같은 모양의 줄이 위아래로 둘이 되어, 어느 쪽이 무엇을 정하는지 눌러 봐야 안다.

     한 줄에 섞이는 것이 어색해 보이지만, 이 줄이 답하는 물음은 처음부터 하나다 —
     **"지금 무엇을 보여주는 목록인가"** (PageHeader 의 tabs 머리말). 유형도 그 답이고
     지운 목록도 그 답이다. 삭제된 항목을 고르면 유형 고르기가 풀리는데(아래 onChange),
     그것도 맞다: 지금 보는 것이 다른 목록이기 때문이다. 되돌아오면 마지막 유형이 그대로다. */
  const [view, setView] = React.useState(VIEW_ALL);
  const inRemoved = view === VIEW_REMOVED;
  const source = inRemoved ? removed : rows;

  const filtered = source.filter(f => {
    if (!inRemoved && type && f.type !== type) return false;
    if (!list0.term) return true;
    return `${f.name} ${f.addr} ${f.place || ""} ${f.hours || ""}`.includes(list0.term);
  });
  const paged = list0.paginate(filtered);

  const undo = f => { restore(f.id, f.name, HIDE_ON_RESTORE); onToast(undoToast(f.name)); };

  /* 일괄 처리 (명세서 1장) — 선택한 것을 한꺼번에 내리거나 올린다. 여기서 실제로
     쓰이는 자리는 "한 골목의 시설 여럿이 공사로 막혔을 때"다. 삭제를 일괄로 두지
     않은 것은 의도다 — 되돌리기 어려운 일을 한 번에 여러 건 하게 만들지 않는다. */
  const bulkVisible = on => {
    patchMany(list0.selected.map(id => [id, { visible: on }]), `공공시설 ${on ? "노출" : "숨김"}`);
    onToast(`${list0.selected.length}건을 ${on ? "노출" : "숨김"}으로 바꿨습니다.`);
    list0.setSelected([]);
  };

  /* 등록 다이얼로그에서만 유형을 고른다. 명세서 항목이 아니라 **어느 표를 쓸지**를
     정하는 선택이라, 항목표(RecordForm) 밖에 따로 세운다 */
  const typePicker = ed.draft && ed.draft.isNew ? (
    <div style={{ gridColumn: "1 / -1", paddingBottom: "var(--space-4)",
      borderBottom: "var(--stroke-hairline) solid var(--border-default)" }}>
      <Select label="시설 유형" value={ed.draft.values.type}
        options={FACILITY_TYPES.map(t => ({ value: t, label: FACILITY_LABELS[t] }))}
        onChange={e => ed.set("type", e.target.value)} />
      <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.5 }}>
        유형에 따라 입력 항목이 달라집니다. 등록 후에는 바꿀 수 없습니다.
      </p>
    </div>
  ) : null;

  return (
    <>
      {/* 제목 아래 설명을 두지 않는다 (2026-08-20, 사용자 요청) — 명세서 장 번호와
          시민 화면 기준일 고지가 적혀 있었다. 기준일은 [데이터 갱신 현황]이 보여주는
          값이고, 다루는 네 유형은 바로 아래 탭이 이미 늘어놓는다. */}
      {/* 유형 탭은 머리의 일부다 — 「지금 무엇을 보여주는 목록인가」를 정하는 줄이라
          제목 바로 아래 붙는다 (PageHeader 의 tabs 머리말) */}
      <PageHeader title="공공시설 정보 관리" count={`${filtered.length}곳`}
        action={<Button variant="primary" icon="plus" onClick={ed.openNew}>시설 등록</Button>}
        tabs={
          <SegmentedTabs items={TYPE_TABS.concat(removedTab(removed.length))}
            value={inRemoved ? VIEW_REMOVED : type}
            onChange={id => {
              if (id === VIEW_REMOVED) { setView(VIEW_REMOVED); return; }
              setView(VIEW_ALL); setType(id);
            }} />
        } />

      {/* 일괄 처리는 「전체」에서만 선다 — 지운 줄의 노출을 켜고 끄는 일에는 뜻이 없다
          (점포 목록과 같은 규칙. removedColumns 주석) */}
      <Toolbar actions={!inRemoved && list0.selected.length ? (
        <>
          <span style={{ fontSize: "var(--fs-label)", color: "var(--text-body)", whiteSpace: "nowrap" }}>
            {list0.selected.length}건 선택
          </span>
          <Button variant="outline" size="sm" icon="eye" onClick={() => bulkVisible(true)}>노출</Button>
          <Button variant="outline" size="sm" icon="eye-off" onClick={() => bulkVisible(false)}>숨김</Button>
        </>
      ) : null}>
        <ListSearch state={list0} placeholder="명칭 · 주소 · 설치 위치 검색" />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="등록된 공공시설 목록"
        rows={paged.rows} rowKey="id"
        onRowClick={inRemoved ? undefined : ed.openEdit}
        selectable={!inRemoved} selected={list0.selected} onSelectedChange={list0.setSelected}
        /* 좌표가 없으면 지도에 찍히지 않고 거리 계산도 안 된다 — 목록에서 바로 보여야
           그 줄을 열어 지도에서 찍게 된다. 지운 목록에서는 끈다: 고칠 수 없는 줄에
           노란 띠를 둘러 봐야 담당자가 할 수 있는 일이 없다 */
        rowTone={f => (!inRemoved && (f.lat == null || f.lng == null) ? "warning" : null)}
        /* 제목 한 줄이다 (2026-08-24, 사용자 요청. Stores 와 같은 이유) */
        empty={inRemoved ? removedEmpty("공공시설") : { title: "조건에 맞는 공공시설이 없습니다." }}
        columns={(cols => (inRemoved ? removedColumns(cols, undo) : cols))([
          { key: "name", label: "명칭", sortable: true },
          { key: "type", label: "유형", width: 110, sortable: true,
            render: f => (
              <Cell>
                <FacilityIcon type={f.type} size={16} />{FACILITY_LABELS[f.type]}
              </Cell>
            ) },
          { key: "addr", label: "도로명주소", sortable: true,
            render: f => (
              <span>
                {f.addr || EMPTY_MARK}
                {f.lat == null || f.lng == null
                  ? <Badge tone="warning" size="sm" style={{ marginLeft: 6 }}>좌표 없음</Badge> : null}
              </span>
            ) },
          { key: "summary", label: "주요 항목", render: summaryOf },
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
        ])} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      <EditorModal ed={ed} size="lg"
        title={ed.draft && ed.draft.isNew ? "공공시설 등록" : "공공시설 수정"}
        description={ed.draft && !ed.draft.isNew
          ? `${FACILITY_LABELS[ed.draft.values.type] || ""} · ${ed.draft.values.name || ""}` : undefined}>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors}
            onChange={ed.set} before={typePicker}
            /* 주소 검색이 좌표를 함께 돌려준다 (V-02 · 입력 원칙 3번).
               AED·대피소는 명칭도 여기서 채운다 — 다만 **손으로 고친 이름은 덮지 않는다.**
               지금 이름이 비었거나 옛 주소에서 나온 그 값 그대로일 때만 다시 만든다. */
            onAddress={(key, picked) => {
              const v = ed.draft.values;
              const next = { [key]: picked.addr, lat: picked.lat, lng: picked.lng };
              if (DERIVED_TYPES.includes(v.type) && (!v.name || v.name === autoName(v))) {
                next.name = autoName({ ...v, addr: picked.addr });
              }
              ed.setMany(next);
            }}
            slots={{
              coord: (
                <CoordField key="coord" lat={ed.draft.values.lat} lng={ed.draft.values.lng}
                  name={ed.draft.values.name || ed.draft.values.place} appKey={KAKAO_APP_KEY}
                  onChange={c => ed.setMany({ lat: fixCoord(c.lat), lng: fixCoord(c.lng) })} />
              ),
            }} />
        ) : null}
      </EditorModal>

      <ConfirmDialog open={!!ed.pending} name={ed.pending && ed.pending.name}
        description="시설을 삭제합니다." onClose={ed.cancelRemove} onConfirm={ed.confirmRemove} />
    </>
  );
}

export default Facilities;
