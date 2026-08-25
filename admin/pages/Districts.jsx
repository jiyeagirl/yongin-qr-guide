import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, ConfirmDialog, DELETE_NOTE, Button, Select, Pagination,
  Badge, Switch, Icon,
} from "../../design-systems/admin.js";
import { DISTRICTS, GU_ORDER, FESTIVALS, CURRENT_DISTRICT_ID } from "../../screens/main/data/districts.js";
import { STORES } from "../../screens/main/data/dunjeon.js";
import { QR_POINTS } from "../../screens/main/data/qr.js";
import { DISTRICT_FIELDS } from "../data/fields.js";
import { useCollection, readCollection, removeRows } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";
/* 여기서 `./RemovedItems.jsx` 의 「전체 | 삭제된 항목」 탭과 되돌리기 짝(`restoreRows` ·
   `readRemoved` · `linkRemoval` · `takeRemovalLinks`)을 가져왔다 (2026-08-24 삭제).
   삭제가 영구가 되면서 통째로 없어졌다 — `data/store.js` 머리말 참조 */

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

/* QR 원본을 관리자 쪽 모양으로 바꾼 것 — 코드가 곧 id 다 (QrPoints.jsx 와 같은 한 줄).
   **모듈 밖에서 한 번만 만든다.** 렌더마다 새 배열이면 `readCollection` 이 매번 새로
   겹치고, 아래 `removedQr` 의 결과도 매 렌더 새 객체가 된다. */
const QR_ROWS = QR_POINTS.map(p => ({ ...p, id: p.code }));

/* ── 막지 않고, 함께 지운다 (2026-08-24, 사용자 요청으로 뒤집음) ──────────────
   전에는 진행 중 축제나 활성 QR 이 걸린 상점가를 **지우지 못하게 막았다**. 명세서 10장의
   "삭제를 차단한다"를 그대로 옮긴 것이었는데, 담당자 쪽에서 보면 막다른 길이었다 —
   상점가 하나를 정리하려면 축제 화면에서 축제를 지우고, QR 화면에서 지점을 지우고,
   다시 돌아와야 했다. 세 화면을 오가는 동안 무엇을 지웠는지 스스로 기억해야 하고,
   중간에 그만두면 **축제만 없어진 상태**가 남는다.

   이제 **연결된 것이 함께 간다.** 지우기 전에 무엇이 함께 지워지는지 이름과 곳수로
   보여준다 (아래 ConfirmDialog). 지우는 일이 한 번의 결정이 되므로 막을 이유가 없어진다.

   **되돌리기는 없어졌다** (2026-08-24, 사용자 요청). 처음 이 길을 열 때의 근거 절반이
   "그 결정을 통째로 되돌릴 수 있다"였는데 그 절반이 사라졌으므로, 남은 안전장치는
   **지우기 전에 보여주는 목록 하나**다. 그래서 이 화면의 확인 창은 다른 화면보다
   할 일이 많다 — 아래 `children` 이 함께 가는 셋을 이름으로 늘어놓고, QR 지점이 걸려
   있으면 빠져나갈 길(소속을 먼저 옮기기)까지 적는다.

   ── 점포도 함께 간다 (2026-08-24, 같은 날 고침) ────────────────────────────
   처음에는 점포만 빼 두었다. "335곳을 한 번에 지우는 일은 이 화면이 할 일이 아니다"라고
   적었는데, **그러면 남은 점포를 볼 수 있는 자리가 없다.** 시민 화면에서 점포에 닿는
   길은 상점가 하나뿐이고(S03 은 상점가 탭이다), 관리자 점포 목록에서는 없어진 상점가
   이름이 필터에 남는다. 지운 뒤에 어디에도 뜨지 않는 자료를 "남겼다"고 말하는 것은
   기록으로도 틀리다 — 그것은 남은 것이 아니라 **찾을 수 없게 된 것**이다.

   일괄 처리를 두 화면으로 한정한다는 규칙(명세서 1장)에도 걸리지 않는다. 그 규칙은
   담당자가 **여럿을 골라 한꺼번에 처리하는 도구**를 어디에 두느냐는 이야기이고, 여기서
   일어나는 일은 한 건을 지운 결과다. 무엇보다 되돌리기가 한 번으로 끝난다.

   함께 가는 것 셋의 성격이 다르므로 다이얼로그가 적는 방식도 다르다 —
   축제·QR 지점은 **이름으로**(많아야 한둘), 점포는 **곳수로**(둔전만 335곳이다). */
function linkedOf(d, festivals, qrPoints, stores) {
  return {
    festivals: festivals.filter(f => f.districtId === d.id),
    qr: qrPoints.filter(p => p.districtId === d.id),
    /* 점포는 `districtId` 가 비어 있으면 둔전이다 (아래 counts 와 같은 규칙) —
       더미 자료 335곳이 전부 그 상태라, 이 기본값을 빠뜨리면 아무것도 걸리지 않는다 */
    stores: stores.filter(s => (s.districtId || CURRENT_DISTRICT_ID) === d.id),
  };
}

export function Districts({ onToast }) {
  const { rows, upsert, remove, patch } = useCollection("districts", DISTRICTS, null, "골목형 상점가");
  const storeRows = readCollection("stores", STORES);
  const qrRows = readCollection("qr", QR_ROWS);
  const festivalRows = readCollection("festivals", FESTIVALS);
  const [gu, setGu] = React.useState("");
  const list0 = useListState([gu]);

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
    /* 상점가 하나가 아니라 거기 걸린 것까지 함께 지운다 (아래 removeWithLinked) */
    onRemove: (id, name) => removeWithLinked(id, name),
    onToast, label: "골목형 상점가",
  });

  /* 다이얼로그를 열 때 산출값을 채워 넣는다. ⚙ 라 저장되지 않고 화면에만 보이면 되지만,
     폼이 values 에서 읽으므로 여기서 얹는다 */
  const openEdit = row => {
    const c = countOf(row);
    ed.openEdit({ ...row, storeCount: c.stores, onnuriCount: c.onnuri });
  };

  /* 제목 아래 「전체 | 삭제된 항목 n」 탭이 있었다 (2026-08-24 삭제) — 머리말 참조 */
  const filtered = rows.filter(d => {
    if (gu && d.gu !== gu) return false;
    if (!list0.term) return true;
    return `${d.name} ${d.gu} ${d.area} ${d.addr}`.includes(list0.term);
  });
  const paged = list0.paginate(filtered);

  /* 지금 이 상점가에 걸려 있는 것들 — 다이얼로그가 늘어놓고, 확인하면 함께 지운다 */
  const linked = ed.pending ? linkedOf(ed.pending, festivalRows, qrRows, storeRows) : null;

  /* ── 함께 지운다 ─────────────────────────────────────────────────────────
     `useRecordEditor` 의 onRemove 가 상점가 하나를 지우고, 여기서 걸린 것들을 마저 지운다.
     컬렉션을 넘나드는 삭제라 훅(useCollection)이 아니라 store.js 의 removeRows 를 직접
     부른다 — 이 화면이 축제·QR·점포 컬렉션을 통째로 세울 이유가 없다 (그쪽 머리말).
     **여럿을 한 번에 넘기는 것이 중요하다** — 점포 335건을 한 건씩 지우면 이력이 그것만으로
     가득 찬다 (store.js 의 removeRows 머리말). 이력에는 상점가 이름을 적어 둔다:
     「일괄 삭제 · 점포 · 둔전 골목형상점가 삭제」가 「335건」보다 나중에 읽힌다.

     함께 지운 것을 적어 두던 `linkRemoval` 이 여기 있었다 (2026-08-24 삭제) — 그것은
     **되돌릴 때 무엇을 함께 되살릴지** 정하는 값이었고, 되돌리는 자리가 없어졌다. */
  const removeWithLinked = (id, name) => {
    const d = rows.find(x => x.id === id);
    remove(id, name);
    if (!d) return;
    const l = linkedOf(d, festivalRows, qrRows, storeRows);
    removeRows("festivals", l.festivals, "축제", `${d.name} 삭제`);
    removeRows("qr", l.qr, "QR 지점", `${d.name} 삭제`);
    removeRows("stores", l.stores, "점포", `${d.name} 삭제`);
  };

  return (
    <>
      <PageHeader title="골목형 상점가 정보 관리" count={`${filtered.length}곳`}
        action={<Button variant="primary" icon="plus" onClick={ed.openNew}>골목형 상점가 등록</Button>} />

      <Toolbar>
        <Select value={gu} options={GU_OPTIONS} onChange={e => setGu(e.target.value)} />
        <ListSearch state={list0} placeholder="골목형 상점가명 · 소재지 검색" />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="등록된 골목형 상점가 목록"
        rows={paged.rows} rowKey="id"
        onRowClick={openEdit}
        empty={{ title: "조건에 맞는 골목형 상점가가 없습니다." }}
        columns={[
          { key: "name", label: "골목형 상점가명", sortable: true,
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
                onClick={() => ed.askRemove(d)} style={{ color: "var(--state-danger)" }}>삭제</Button>
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
        title={ed.draft && ed.draft.isNew ? "골목형 상점가 등록" : "골목형 상점가 수정"}
        description={ed.draft && !ed.draft.isNew ? ed.draft.values.name : undefined}>
        {/* ── 「상권센터 링크 미리보기」를 뺐다 (2026-08-24) ────────────────────
             폼 아래에 조립된 주소를 글자로 적어 보여주던 자리다. 그 칸이 **번호**를 받던
             때에는 필요했다 — 담당자가 넣은 `114` 가 어떤 주소가 되는지는 화면이
             말해주지 않으면 알 수 없었다.

             이제 그 칸이 주소를 통째로 받는다. 미리보기에 적을 것이 방금 입력한 값과 한
             글자도 다르지 않아, 같은 값을 한 화면에 두 번 적는 자리가 된다 (명세서 화면
             문구 원칙 — 어느 쪽이 맞는지 의심하게 된다). 주소가 맞는지는 담당자가 그
             주소를 복사해 온 브라우저가 이미 답했다. */}
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors} onChange={ed.set} />
        ) : null}
      </EditorModal>

      {/* ── 함께 지워지는 것을 먼저 보여준다 (2026-08-24) ─────────────────────
             전에는 여기 오기 전에 「삭제할 수 없습니다」 창이 막았다 (위 linkedOf 주석).
             이제 막지 않는 대신 **무엇이 함께 가는지**를 적는다. 적는 방식이 둘로 갈린다:

               축제 · QR 지점   **이름으로.** "QR 지점 2곳"은 몇 건인지만 알려주고 정작
                                그것이 무엇인지는 다른 화면에 가서 확인하게 만든다.
                                길어질 일도 없다 — 상점가 하나에 많아야 한둘이다
               점포             **곳수로.** 둔전만 335곳이라 이름을 늘어놓으면 확인 창이
                                아니라 목록이 된다. 여기서 알아야 하는 것도 어느 가게인지가
                                아니라 **이만큼이 함께 간다**는 크기다

             QR 지점에는 빠져나갈 길을 함께 적는다 — 안내판은 현장에 그대로 붙어 있으므로
             지우는 것이 늘 맞는 답은 아니다 (QrPoints.jsx 머리말). */}
      <ConfirmDialog open={!!ed.pending} name={ed.pending && ed.pending.name}
        description="골목형 상점가를 삭제합니다."
        footnote={DELETE_NOTE}
        onClose={ed.cancelRemove} onConfirm={ed.confirmRemove}>
        {linked && (linked.festivals.length || linked.qr.length || linked.stores.length) ? (
          <div style={{ marginTop: "var(--space-3)", padding: "var(--space-3) var(--space-4)",
            background: "var(--surface-sunken)", borderRadius: "var(--radius-md)" }}>
            <p style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-bold)",
              color: "var(--text-heading)", lineHeight: 1.5 }}>
              연결된 아래 항목도 함께 삭제됩니다
            </p>
            <ul style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              {linked.festivals.map(f => (
                <li key={f.id} style={{ display: "flex", alignItems: "center", gap: 6,
                  fontSize: "var(--fs-label)", color: "var(--text-body)", lineHeight: 1.5 }}>
                  <Icon name="party-popper" size={14} color="var(--text-muted)" />
                  축제 · {f.name}
                </li>
              ))}
              {linked.qr.map(p => (
                <li key={p.id} style={{ display: "flex", alignItems: "center", gap: 6,
                  fontSize: "var(--fs-label)", color: "var(--text-body)", lineHeight: 1.5 }}>
                  <Icon name="qr-code" size={14} color="var(--text-muted)" />
                  QR 지점 · {p.name || p.code}
                  {p.active === false ? <Badge tone="neutral" size="sm">비활성</Badge> : null}
                </li>
              ))}
              {linked.stores.length ? (
                <li style={{ display: "flex", alignItems: "center", gap: 6,
                  fontSize: "var(--fs-label)", color: "var(--text-body)", lineHeight: 1.5 }}>
                  <Icon name="store" size={14} color="var(--text-muted)" />
                  점포 · {linked.stores.length.toLocaleString("ko-KR")}곳
                </li>
              ) : null}
            </ul>
            {/* 「되돌릴 때도 함께 돌아옵니다」가 여기 있었다 (2026-08-24) — 되돌리는 자리가
                없어졌으므로 그 말도 없어진다. 대신 **QR 지점만은 빠져나갈 길을 적는다**:
                안내판은 현장에 그대로 붙어 있어서, 지우면 그 코드를 찍은 시민이
                「등록되지 않은 코드」를 보게 된다 (QrPoints.jsx 머리말). 이 줄이 그 창의
                유일한 대안이라 QR 이 걸렸을 때만 서고, 그때는 반드시 선다. */}
            {linked.qr.length ? (
              <p style={{ marginTop: 8, fontSize: "var(--fs-caption)",
                color: "var(--text-muted)", lineHeight: 1.5 }}>
                안내판은 현장에 그대로 남습니다. 지점을 지우지 않으려면
                [QR 지점 관리]에서 소속 골목형 상점가를 먼저 옮겨 주세요.
              </p>
            ) : null}
          </div>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

export default Districts;
