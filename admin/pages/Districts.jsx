import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, Modal, ConfirmDialog, Button, Select, Pagination,
  Badge, Switch,
} from "../../design-systems/admin.js";
import { DISTRICTS, GU_ORDER, FESTIVALS, CURRENT_DISTRICT_ID } from "../../screens/main/data/districts.js";
import { STORES } from "../../screens/main/data/dunjeon.js";
import { QR_POINTS } from "../../screens/main/data/qr.js";
import { DISTRICT_FIELDS, govLink } from "../data/fields.js";
import { useCollection, readCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";

/* M03 상점가 목록 · M04 상점가 등록·수정 — 32개소.
 *
 * ── 이 화면이 가벼워졌다 (2026-08-20, 명세서 개정) ──────────────────────────
 * 전에는 여기서 네 가지를 더 했다. 넷 다 빠졌고, 이유가 각각 다르다:
 *
 *   구역 주소 목록 편집 (1:N)   구역 주소를 손보는 일은 곧 **매칭을 다시 돌리는 일**이라
 *                               개발 쪽으로 갔다 (명세서 범위 문단)
 *   재매칭 실행                 위와 같다
 *   게시값 대비 산출값 비교      명세서가 검사를 없앴다 — "340 대 335처럼 차이를 알아도
 *                               **어느 5곳인지 모르면 고칠 수 없기 때문**이다"
 *   노출 순서 ▲▼               항목표에서 `sort_order` 가 빠졌다. 32곳의 차례는 시민
 *                               화면이 거리로 정한다 (districts.js 의 byDistrictNear)
 *
 * 남은 것은 상점가 한 곳의 기본 정보를 고치는 일이다. 명세서 M04 의 기능란도
 * "기본 정보 입력" 한 줄로 줄었다.
 *
 * ── 점포수는 읽기만 한다 ────────────────────────────────────────────────────
 * `store_count` · `onnuri_count` 는 ⚙ 다. 관리자가 32개소 숫자를 옮겨 적을 일이 없다.
 * 점포 자료가 있는 상점가(지금은 둔전 하나)는 **노출 상태인 점포를 실제로 세어** 보여준다 —
 * 명세서가 정의한 그대로("구역 주소 매칭 결과 중 노출 상태인 건수")이고, 점포 관리에서
 * 한 곳을 숨기면 이 숫자가 줄어드는 것으로 그 정의가 화면에서 확인된다.
 * 점포 자료가 없는 31곳은 세지 못하므로 상점가 레코드의 값을 그대로 보여준다.
 * 그 사실을 「점포 미등록」 배지로 적었었는데 뺐다 (2026-08-20, 사용자 요청) —
 * 더미 데이터에서는 31곳이 전부 그 상태라 배지가 목록의 거의 모든 줄에 붙었고,
 * 늘 붙어 있는 표시는 아무것도 가려내지 못한다. 실제 데이터가 들어오면 이 구분
 * 자체가 사라진다 (모든 상점가에 점포 자료가 있다).
 */

const GU_OPTIONS = [{ value: "", label: "전체 구" }].concat(GU_ORDER.map(g => ({ value: g, label: g })));

/* 삭제 차단 (명세서 10장) — 진행 중 축제 또는 활성 QR 이 걸린 상점가는 지울 수 없다.
   지우면 시민 화면에서 그 축제와 QR 지점이 갈 곳을 잃는다. */
function blockReason(d, festivals, qrPoints) {
  const live = festivals.find(f => f.districtId === d.id && f.state !== "종료");
  if (live) return `진행 중이거나 예정인 축제(${live.name})가 연결되어 있습니다.`;
  const qr = qrPoints.find(p => p.districtId === d.id && p.active);
  if (qr) return `활성 QR 지점(${qr.code})이 이 상점가를 가리키고 있습니다.`;
  return null;
}

export function Districts({ onToast }) {
  const { rows, upsert, remove, patch } = useCollection("districts", DISTRICTS, null, "상점가");
  const storeRows = readCollection("stores", STORES);
  const qrRows = readCollection("qr", QR_POINTS.map(p => ({ ...p, id: p.code })));
  const [gu, setGu] = React.useState("");
  const list0 = useListState([gu]);
  const [blocked, setBlocked] = React.useState(null);

  /* 노출 상태인 점포를 상점가별로 센다. 점포 자료가 없는 곳은 키가 아예 없다 —
     그때는 상점가 레코드에 적힌 값을 그대로 쓴다 (아래 countOf). */
  const counts = React.useMemo(() => {
    const o = {};
    for (const s of storeRows) {
      const id = s.districtId || CURRENT_DISTRICT_ID;
      if (!o[id]) o[id] = { stores: 0, onnuri: 0 };
      if (s.visible === false) continue;
      o[id].stores += 1;
      if (s.onnuri) o[id].onnuri += 1;
    }
    return o;
  }, [storeRows]);

  /* 화면에 적을 점포수 — 센 값이 있으면 그것, 없으면 레코드의 값 */
  const countOf = d => {
    const c = counts[d.id];
    return {
      stores: c ? c.stores : Number(d.stores || 0),
      onnuri: c ? c.onnuri : Number(d.onnuri || 0),
    };
  };

  const ed = useRecordEditor({
    fieldsFor: () => DISTRICT_FIELDS,
    initial: () => ({ gu: GU_ORDER[0], visible: true }),
    /* 산출값(⚙)은 저장하지 않는다. 폼에 보이라고 얹어 둔 값이라 그대로 저장하면
       덮개에 계산 결과가 굳고, 변경 이력에도 고치지 않은 필드가 매번 올라온다. */
    onSave: ({ storeCount, onnuriCount, ...values }) => upsert(values),
    onRemove: remove,
    onToast, label: "상점가",
  });

  /* 다이얼로그를 열 때 산출값을 채워 넣는다. ⚙ 라 저장되지 않고 화면에만 보이면 되지만,
     폼이 values 에서 읽으므로 여기서 얹는다 */
  const openEdit = row => {
    const c = countOf(row);
    ed.openEdit({ ...row, storeCount: c.stores, onnuriCount: c.onnuri });
  };

  const filtered = rows.filter(d => {
    if (gu && d.gu !== gu) return false;
    if (!list0.term) return true;
    return `${d.name} ${d.gu} ${d.area} ${d.addr}`.includes(list0.term);
  });
  const paged = list0.paginate(filtered);

  const askRemove = d => {
    const why = blockReason(d, FESTIVALS, qrRows);
    if (why) { setBlocked({ name: d.name, why }); return; }
    ed.askRemove(d);
  };

  return (
    <>
      <PageHeader title="상점가 정보 관리" count={`${filtered.length}곳`}
        action={<Button variant="primary" icon="plus" onClick={ed.openNew}>상점가 등록</Button>} />

      <Toolbar>
        <Select value={gu} options={GU_OPTIONS} onChange={e => setGu(e.target.value)} />
        <ListSearch state={list0} placeholder="상점가명 · 소재지 검색" />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="등록된 골목형 상점가 목록"
        rows={paged.rows} rowKey="id" onRowClick={openEdit}
        empty={{ title: "조건에 맞는 상점가가 없습니다." }}
        columns={[
          { key: "name", label: "상점가명", sortable: true,
            render: d => (
              <Cell>
                {d.name}
                {/* 「현재」 배지를 두지 않는다 — 그것은 QR 을 찍은 시민이 서 있는 곳이라는
                    뜻이라 관리자 표에서는 가리키는 대상이 없다. 이 상점가에 QR 지점이
                    걸려 있다는 사실은 QR 지점 관리와 삭제 차단 안내가 이미 말한다. */}
                {d.visible === false ? <Badge tone="neutral" size="sm">숨김</Badge> : null}
              </Cell>
            ) },
          { key: "gu", label: "구", width: 80, sortable: true },
          { key: "area", label: "소재지", sortable: true },
          /* 「노출 상태 기준」이라고 적어 두었던 열 밑 설명을 뺐다 (2026-08-20) —
             머리줄은 어느 칸이 무엇인지만 가리킨다. 세는 규칙은 명세서 2-1 이 갖는다. */
          { key: "stores", label: "점포수", width: 110, align: "right", sortable: true,
            sortValue: d => countOf(d).stores,
            render: d => (
              <span style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {countOf(d).stores.toLocaleString("ko-KR")}곳
              </span>
            ) },
          { key: "onnuri", label: "온누리", width: 100, align: "right", sortable: true,
            sortValue: d => countOf(d).onnuri,
            render: d => (
              <span style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {countOf(d).onnuri.toLocaleString("ko-KR")}곳
              </span>
            ) },
          /* 「온누리 원본 표기명」은 목록에도 폼에도 없다 (2026-08-20, 사용자 요청) —
             온누리 자료와 상점가를 잇는 매칭 키라 담당자가 훑을 값도, 고칠 값도 아니다.
             왜 폼에서 뺐는지는 data/fields.js 의 DISTRICT_FIELDS 주석에 적혀 있다. */
          { key: "visible", label: "노출 여부", width: 104, align: "center",
            render: d => (
              <Switch checked={d.visible !== false} aria-label={`${d.name} 노출 여부`}
                onChange={() => patch(d.id, { visible: d.visible === false }, d.name)} />
            ) },
          { key: "manage", label: "관리", width: 96, align: "center",
            render: d => (
              <Button variant="ghost" size="sm" icon="trash-2"
                onClick={() => askRemove(d)} style={{ color: "var(--state-danger)" }}>삭제</Button>
            ) },
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      {/* 「구역 주소 매칭은 개발 쪽에서 처리합니다」 안내를 뺐다 (2026-08-20, 사용자 요청).
          담당자는 이 사업이 어떻게 굴러가는지 이미 알고 있다 — 화면이 할 말은 여기서
          무엇을 할 수 있는가이지, 무엇이 우리 쪽 사정으로 여기에 없는가가 아니다.
          점포수가 읽기 전용이라는 사실은 열 머리말의 「노출 상태 기준」이 이미 말한다. */}

      <EditorModal ed={ed} size="lg"
        title={ed.draft && ed.draft.isNew ? "상점가 등록" : "상점가 수정"}
        description={ed.draft && !ed.draft.isNew ? ed.draft.values.name : undefined}>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors} onChange={ed.set}
            extra={
              ed.draft.values.govSeq ? (
                <div style={{ gridColumn: "1 / -1" }}>
                  <p style={{ marginBottom: 6, fontSize: "var(--fs-label)",
                    fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>
                    상권센터 링크 미리보기
                  </p>
                  <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)",
                    lineHeight: 1.6, wordBreak: "break-all" }}>
                    {govLink(ed.draft.values)}
                  </p>
                  <p style={{ marginTop: 4, fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
                    사용자 화면의 상점가 카드 바로가기 화살표가 이 주소로 갑니다. 비우면 화살표가 사라집니다.
                  </p>
                </div>
              ) : null
            } />
        ) : null}
      </EditorModal>

      <ConfirmDialog open={!!ed.pending} name={ed.pending && ed.pending.name}
        description="상점가를 삭제합니다."
        footnote="소속 점포는 함께 지워지지 않습니다. 당장 목록에서 내리려면 삭제 대신 [노출 여부] 토글을 꺼 주세요 — 사용자 화면에서는 사라지고 연결은 그대로 남습니다."
        onClose={ed.cancelRemove} onConfirm={ed.confirmRemove} />

      {/* 삭제 차단 (명세서 10장). 버튼을 감추지 않고 눌렀을 때 이유를 말한다 —
          감추면 왜 이 줄만 삭제 버튼이 없는지 알 수 없다 */}
      <Modal open={!!blocked} size="md" title="삭제할 수 없습니다"
        description={blocked ? blocked.name : undefined}
        onClose={() => setBlocked(null)}
        footer={<Button variant="primary" onClick={() => setBlocked(null)}>확인</Button>}>
        {blocked ? (
          <>
            <p style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.65 }}>
              {blocked.why}
            </p>
            <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-label)",
              color: "var(--text-muted)", lineHeight: 1.6 }}>
              연결을 먼저 정리한 뒤에 삭제할 수 있습니다. 당장 목록에서 내리려면
              삭제 대신 [노출 여부] 토글을 꺼 주세요.
            </p>
          </>
        ) : null}
      </Modal>
    </>
  );
}

export default Districts;
