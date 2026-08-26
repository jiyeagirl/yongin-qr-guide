import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, Button, Select, Pagination,
  Badge, Switch,
} from "../../design-systems/admin.js";
import { GU_ORDER } from "../../screens/main/data/districts.js";
import { DISTRICT_ROWS, STORE_ROWS } from "../data/sources.js";
import { DISTRICT_FIELDS } from "../data/fields.js";
import { useCollection, readCollection } from "../data/store.js";
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
 * ── 점포수는 읽기만 한다 (2026-08-25 오후, 사용자 요청으로 되돌아왔다) ──────
 * 하루 사이에 열렸다가 다시 닫혔다. 두 수의 출처는 **점포 정보 하나**이고, 같은 사실을
 * 두 곳에서 받으면 반드시 어긋난다 (fields.js 의 그 자리에 이유가 적혀 있다).
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

/* 등록 창에서 두 칸을 빼던 `COUNT_KEYS` 가 여기 있었다 (2026-08-25 오후) —
   등록 창 자체가 없어졌다 */

/* QR 원본을 관리자 쪽 모양으로 바꾸던 한 줄이 여기 있었다 (2026-08-25 에 `data/sources.js`
   로 옮겼다) — QrPoints.jsx 가 같은 줄을 따로 갖고 있었다. 원천 표를 관리자 쪽 모양으로
   맞추는 일은 화면이 아니라 자료가 할 일이고, **모듈 밖에서 한 번만** 만들어야 한다:
   렌더마다 새 배열이면 `readCollection` 이 매번 새로 겹친다. */

/* ── 지우는 자리가 없어졌다 (2026-08-25 오후, 사용자 요청) ───────────────────
   [골목형 상점가 등록]과 [삭제]가 함께 없어졌다. 32개소는 **지정 제도가 정하는 목록**이라
   한 곳이 늘고 주는 일은 지정·해제의 결과이지 이 화면에서 만들고 지우는 일이 아니고,
   지우면 거기 걸린 축제·QR 지점·점포가 통째로 따라갔다 — 되돌릴 수 없는 일 중 가장 큰
   것이었다. 목록에서 내리는 일은 [노출 여부]가 그대로 한다.

   그래서 아래 셋이 함께 나갔다: 연쇄 삭제(`removeWithLinked`), 함께 지워지는 것을 늘어놓던
   확인 창, 그리고 그 목록을 만들던 `linkedOf`. 그 코드가 답하던 물음(「이 상점가에 무엇이
   걸려 있나」)은 이제 각 화면의 소속 필터가 답한다.

   ── 아래는 그 자리가 있던 동안의 기록이다 ────────────────────────────────────
   ── 막지 않고, 함께 지운다 (2026-08-24, 사용자 요청으로 뒤집음) ──────────────
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

export function Districts({ onToast }) {
  const { rows, upsert, patch, patchMany } = useCollection("districts", DISTRICT_ROWS, null, "골목형 상점가");
  const storeRows = readCollection("stores", STORE_ROWS);
  const [gu, setGu] = React.useState("");
  const list0 = useListState([gu]);

  /* 노출 상태인 점포를 상점가별로 센다. 점포 자료가 없는 곳은 키가 아예 없다 —
     그때는 상점가 레코드에 적힌 값을 그대로 쓴다 (아래 countOf). */
  const counts = React.useMemo(() => {
    const o = {};
    for (const s of storeRows) {
      const id = s.districtId;
      if (!o[id]) o[id] = { stores: 0, onnuri: 0 };
      if (!s.visible) continue;
      o[id].stores += 1;
      if (s.onnuri) o[id].onnuri += 1;
    }
    return o;
  }, [storeRows]);

  /* 화면에 적을 점포수 — 센 값, 셀 것이 없으면(점포 자료가 없는 31곳) 레코드에 적힌 값.

     「손으로 고쳤으면 그 값」이라는 갈래가 여기 있었다 (`countManual`. 2026-08-25 오후에
     없어졌다) — 두 칸이 ⚙ 로 돌아가면서 손으로 고치는 길 자체가 사라졌다. 옛 자료에
     `countManual` 이 남아 있어도 이제 아무도 보지 않는다. */
  const countOf = d => {
    const c = counts[d.id];
    return c ? { stores: c.stores, onnuri: c.onnuri }
      : { stores: Number(d.stores || 0), onnuri: Number(d.onnuri || 0) };
  };

  const ed = useRecordEditor({
    /* 등록 창이 없어지면서 점포수 두 칸을 빼던 갈래도 함께 없어졌다 (2026-08-25 오후) —
       이 폼은 늘 수정 창이고, 두 칸은 늘 ⚙ 로 서 있다 */
    fieldsFor: () => DISTRICT_FIELDS,
    /* 폼의 두 칸(`storeCount` · `onnuriCount`)은 **보여주기만 하는 값**이라 저장할 때
       버린다. 레코드가 갖는 `stores` · `onnuri` 는 열 때 들고 온 그대로 지나간다 —
       점포 자료가 없는 31곳의 게시값이 그 자리에 있다.
       손으로 고친 기억(`countManual`)도 함께 버린다: 고치는 길이 없어졌으므로 옛 값이
       남아 있으면 목록의 수를 영영 굳혀 놓는 플래그가 된다 */
    onSave: ({ storeCount, onnuriCount, countManual, ...values }) => upsert(values),
    /* 「온누리 가맹 점포수가 점포수보다 많을 수 없습니다」 검사가 여기 있었다
       (2026-08-25 오후 삭제) — 두 수를 따로 받을 때만 생기는 어긋남이고, 세는 쪽에서는
       가맹이 점포의 부분집합인 것이 셈 자체로 보장된다 */
    /* `initial`(새 상점가의 기본값)과 `onRemove`(연쇄 삭제)가 여기 있었다 —
       여는 자리가 둘 다 없어졌다 (머리말) */
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
    /* **이름만 본다** (2026-08-26, 사용자 요청). 「이름 + 구 + 소재지 + 주소」 넉 줄을
       한 문자열로 이어 담고 있었는데, 그중 구는 **바로 왼쪽 고르개가 하는 일**이고
       (「처인구」를 치면 고르개를 쓴 것과 같은 결과가 나온다) 소재지·주소는 서로 겹치는
       값이다. 검색으로 걸리는 범위가 화면의 다른 장치와 겹치면 담당자는 같은 일을 두
       가지 방법으로 하게 되고, 그때 두 결과가 미묘하게 다르면(고르개는 정확히, 검색은
       부분 문자열로) 어느 쪽이 맞는지 알 수 없다. 여기서 찾는 것은 상점가 한 곳이다. */
    return d.name.includes(list0.term);
  });
  const paged = list0.paginate(filtered);

  /* 연쇄 삭제(`removeWithLinked`)와 그 목록(`linked`)이 여기 있었다 (2026-08-25 오후 삭제 —
     머리말). 축제·QR 지점·점포를 한 번에 지우던 자리다 */

  /* ── 고르기와 일괄 처리 (2026-08-24 추가, 사용자 요청) ─────────────────────
     점포·공공시설에만 있던 것을 목록 화면 전부로 넓혔다. **삭제는 일괄로 두지 않는다** —
     되돌릴 수 없는 일을 한 번에 여러 건 하게 만들지 않는다 (그쪽 화면과 같은 규칙).
     여기서 실제로 쓰이는 자리는 「구 하나를 통째로 내렸다 올리는」 일이다. */
  const bulkVisible = on => {
    patchMany(list0.selected.map(id => [id, { visible: on }]), `골목형 상점가 ${on ? "노출" : "숨김"}`);
    onToast(`${list0.selected.length}건을 ${on ? "노출" : "숨김"}으로 바꿨습니다.`);
    list0.setSelected([]);
  };

  return (
    <>
      {/* 머리에 [골목형 상점가 등록]이 있었다 (2026-08-25 오후 삭제 — 머리말) */}
      <PageHeader title="골목형 상점가 정보 관리" count={`${filtered.length}곳`} />

      <Toolbar actions={list0.selected.length ? (
        <>
          <span style={{ fontSize: "var(--fs-label)", color: "var(--text-body)", whiteSpace: "nowrap" }}>
            {list0.selected.length}건 선택
          </span>
          <Button variant="outline" size="sm" icon="eye" onClick={() => bulkVisible(true)}>노출</Button>
          <Button variant="outline" size="sm" icon="eye-off" onClick={() => bulkVisible(false)}>숨김</Button>
        </>
      ) : null}>
        <Select value={gu} options={GU_OPTIONS} onChange={e => setGu(e.target.value)} />
        <ListSearch state={list0} placeholder="골목형 상점가명 검색" />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="등록된 골목형 상점가 목록"
        rows={paged.rows} rowKey="id"
        onRowClick={openEdit}
        selectable selected={list0.selected} onSelectedChange={list0.setSelected}
        empty={{ title: "조건에 맞는 골목형 상점가가 없습니다." }}
        columns={[
          { key: "name", label: "골목형 상점가명", sortable: true,
            render: d => (
              <Cell>
                {d.name}
                {/* 「현재」 배지를 두지 않는다 — 그것은 QR 을 찍은 시민이 서 있는 곳이라는
                    뜻이라 관리자 표에서는 가리키는 대상이 없다. 이 상점가에 QR 지점이
                    걸려 있다는 사실은 QR 지점 관리와 삭제 차단 안내가 이미 말한다. */}
                {d.visible ? null : <Badge tone="neutral" size="sm">숨김</Badge>}
              </Cell>
            ) },
          { key: "gu", label: "구", width: 80, sortable: true },
          { key: "area", label: "소재지", sortable: true },
          /* 「노출 상태 기준」이라고 적어 두었던 열 밑 설명을 뺐다 (2026-08-20) —
             머리줄은 어느 칸이 무엇인지만 가리킨다. 세는 규칙은 명세서 2-1 이 갖는다. */
          /* 「수기」 배지가 여기 있었다 (2026-08-25 오후 삭제) — 손으로 고친 줄에 붙던
             표시다. 고치는 길이 없어졌으니 붙을 줄도 없다. 배지가 나란히 서던 자리를
             비우면서 폭도 150 에서 110 으로 돌아간다 (「1,234곳」이 드는 폭이다) */
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
              <Switch checked={d.visible} aria-label={`${d.name} 노출 여부`}
                onChange={() => patch(d.id, { visible: !d.visible }, d.name)} />
            ) },
          /* 「관리」 열이 여기 있었다 — 안에 [삭제] 하나뿐이라 열째 없앴다
             (2026-08-25 오후, 사용자 요청. 머리말) */
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      {/* 「구역 주소 매칭은 개발 쪽에서 처리합니다」 안내를 뺐다 (2026-08-20, 사용자 요청).
          담당자는 이 사업이 어떻게 굴러가는지 이미 알고 있다 — 화면이 할 말은 여기서
          무엇을 할 수 있는가이지, 무엇이 우리 쪽 사정으로 여기에 없는가가 아니다.
          점포수가 읽기 전용이라는 사실은 열 머리말의 「노출 상태 기준」이 이미 말한다. */}

      <EditorModal ed={ed} size="lg"
        title="골목형 상점가 수정"
        description={ed.draft ? ed.draft.values.name : undefined}>
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

      {/* 함께 지워지는 것을 이름과 곳수로 늘어놓던 삭제 확인 창이 여기 있었다
          (2026-08-25 오후 삭제 — 머리말). 상점가를 지우면 축제·QR 지점·점포가 따라가던
          자리다: 지우는 길이 없어지면서 그 앞에 세워 두던 안전장치도 함께 나갔다 */}
    </>
  );
}

export default Districts;
