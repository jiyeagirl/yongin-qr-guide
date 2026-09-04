import React from "react";
import {
  PageHeader, Toolbar, DataTable, Cell, Button, Select, Switch, Badge, Pagination,
  FacilityIcon, FACILITY_LABELS, FACILITY_TYPES, CoordField, fixCoord, EMPTY_MARK, FormField,
} from "../../design-systems/admin.js";
import { facilityName } from "../../screens/main/data/facilities.js";
import { GU_ORDER, guOf } from "../../screens/main/data/districts.js";
import { FACILITY_ROWS } from "../data/sources.js";
import { KAKAO_APP_KEY } from "../../screens/main/config.js";
import { FACILITY_FIELDS } from "../data/fields.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";
import { BulkUploadModal } from "./BulkUploadModal.jsx";
/* 여기서 `./RemovedItems.jsx` 의 「삭제된 항목 n」 탭 한 칸을 가져와 유형 탭 줄 끝에
   이어 붙였다 (2026-08-24 삭제) — `data/store.js` 머리말 참조 */

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

/* ── 유형 고르기는 **탭이 아니라 고르개**다 (2026-08-24 바꿈, 사용자 요청) ──────
   제목 아래 `SegmentedTabs` 한 줄이었다. 이 화면만 그 모양이었던 것이 문제였다 —
   점포는 상점가·대분류·온누리를, 축제는 상태를, QR 지점은 설치 상태·활성을 전부 필터 줄의
   고르개로 좁히는데 공공시설만 유형을 탭으로 갈랐다. 같은 일(목록 좁히기)이 화면마다 다른
   모양이면 담당자가 화면마다 어디를 봐야 하는지 다시 찾는다.

   자리도 **검색창 왼쪽**, 다른 화면의 고르개가 서는 그 자리다. 탭 줄이 빠지면서 제목과
   필터 줄 사이의 한 단도 없어진다. */
const TYPE_OPTIONS = [{ value: "", label: "전체 유형" }]
  .concat(FACILITY_TYPES.map(t => ({ value: t, label: FACILITY_LABELS[t] })));

/* 일괄 등록 창의 고르개. 필터의 것과 **첫 줄만 다르다** — 저쪽의 빈 값은 「전체」라는
   답이고 이쪽의 빈 값은 **아직 답하지 않았다**는 뜻이라, 같은 글자를 쓰면 고르지 않은
   채로 올린 사람에게 「네 유형에 다 넣었다」로 읽힌다 (점포 창과 같은 규칙) */
const BULK_TYPE_OPTIONS = [{ value: "", label: "— 선택 —" }]
  .concat(FACILITY_TYPES.map(t => ({ value: t, label: FACILITY_LABELS[t] })));

/* ── 소속 구 고르개 (2026-08-26 신설, 사용자 요청) ──────────────────────────────
   유형 하나로는 목록이 좁혀지지 않는다. 지금 더미가 18곳이라 티가 나지 않을 뿐,
   공공데이터가 들어오면 AED 하나만으로도 시 전역에서 수백 건이고 그때 담당자에게
   남는 좁히기 수단은 이름 검색뿐이다 — **찾는 이름을 이미 알 때만 쓸 수 있는 수단**이라,
   「우리 구 화장실을 훑어보려는」 일이 통째로 막힌다.

   값은 `GU_ORDER` 셋을 그대로 세운다. 자료에 있는 구만 세우지 않는 이유는 상점가
   화면과 같아야 하기 때문이다 — 같은 고르개가 화면마다 다른 길이면 「우리 구가
   없어졌다」로 읽힌다. 지금 더미는 전부 처인구라 나머지 둘은 0건이 나온다.

   구는 시설의 항목이 아니라 **주소에서 읽는 값**이다 (districts.js 의 `guOf`). */
const GU_OPTIONS = [{ value: "", label: "전체 구" }].concat(GU_ORDER.map(g => ({ value: g, label: g })));

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

/* ── [공공시설 등록]이 돌아왔다 — 엑셀 일괄 등록이다 (2026-09-04, 사용자 요청) ─────
   점포 화면과 같은 창을 쓴다 (`BulkUploadModal.jsx`). 아래 「고치기만 한다」의 근거는
   **한 곳이 새로 생기는 일**에 대한 것이었는데, 원천이 알려준다는 것과 **그 자료가 화면에
   닿을 길이 없다**는 것은 다른 이야기다 — 길이 없으면 담당자는 개발 쪽에 요청하고
   기다린다. 공공시설은 넷을 합쳐 수백 줄로 들어오므로 폼이 아니라 파일로 받는다
   (골목형 상점가는 반대라 그쪽만 폼이다 — 한 달에 두세 곳이다).

   **창에서 시설 유형을 먼저 고른다.** 이 화면에서 유형은 필터가 아니라 **어느 항목표를
   쓰느냐**이고(AED 2항목 · 화장실 10항목 — fields.js 3장), 그래서 수정 창에서도 유형만은
   바꿀 수 없다. 유형이 정해지지 않은 파일은 **어느 표로 읽어야 하는지가 정해지지 않은
   파일**이라, 고르기 전에는 파일 칸이 잠긴다.

   **[삭제]는 돌아오지 않는다** — 잘못 들어온 줄은 [노출 여부]로 내린다.

   ── 아래는 그 자리가 없던 동안의 기록이다 ───────────────────────────────────
   ── 이 화면은 **고치기만 한다** (2026-08-25 오후, 사용자 요청) ─────────────────
   [시설 등록]과 [삭제]가 함께 없어졌다. 공공시설 넷은 **공공데이터에서 들어오는 자료**라
   (fields.js 3장의 머리말) 한 곳이 새로 생기거나 없어지는 일은 원천이 알려주는 일이지
   담당자가 이 화면에서 만들고 지우는 일이 아니다. 담당자가 여기서 하는 일은 **틀린 값을
   바로잡고**(오류신고가 그 입구다) 잘못 들어온 줄을 **[노출 여부]로 내리는** 것이다.

   내리는 것과 지우는 것의 차이가 요점이다 — 숨긴 줄은 원천이 다음에 갱신할 때 그 자리에
   그대로 있고, 지운 줄은 다음 갱신에서 **되살아난다**(또는 영영 사라진다). 어느 쪽이든
   담당자가 한 일이 남지 않는다. 점포·골목형 상점가도 같은 이유로 함께 닫혔다. */
export function Facilities({ onToast }) {
  const { rows, upsert, patch, patchMany } = useCollection("facilities", FACILITY_ROWS, derive, "공공시설");
  const [type, setType] = React.useState("");
  const [gu, setGu] = React.useState("");
  const list0 = useListState([type, gu]);

  /* 일괄 등록 창 — 열림과 고른 유형. 파일은 창이 갖는다 (BulkUploadModal).
     **열 때 목록의 유형 필터를 기본값으로 넣는다** (점포 창이 소속 필터를 그렇게 받는
     것과 같다). 필터가 「전체 유형」이면 빈 값으로 연다 — 넷 중 하나가 미리 골라져
     있으면 확인 없이 [업로드]가 눌리고, 그때 잘못 들어간 줄은 **다른 항목표로 읽힌 줄**이다 */
  const [bulk, setBulk] = React.useState(false);
  const [bulkType, setBulkType] = React.useState("");

  const openBulk = () => {
    setBulkType(type);
    setBulk(true);
  };

  const fieldsFor = React.useCallback(v => FACILITY_FIELDS[v.type] || FACILITY_FIELDS.aed, []);
  /* `initial`(새 시설의 유형 기본값)과 `onRemove` 가 여기 있었다 — 여는 자리가 없어졌다 */
  const ed = useRecordEditor({
    fieldsFor,
    onSave: values => upsert(values),
    onToast, label: "공공시설",
  });

  /* 탭 줄 끝에 「삭제된 항목 n」이 붙어 있었다 (2026-08-24 삭제) — 삭제가 영구가 되면서
     되돌리는 자리가 없어졌다 (`data/store.js` 머리말). 이 줄은 다시 유형만 고른다. */
  const filtered = rows.filter(f => {
    if (type && f.type !== type) return false;
    if (gu && guOf(f.addr) !== gu) return false;
    if (!list0.term) return true;
    /* ── **명칭만 본다** (2026-08-26, 사용자 요청) ────────────────────────────
       「명칭 + 주소 + 설치 위치 + 운영시간」 넷을 한 문자열로 이어 담고 있었다.
       운영시간까지 걸리는 검색은 「09」를 친 담당자에게 아홉 시에 여는 시설을 전부
       내놓는다 — 이름을 찾으려던 사람에게 그 목록은 고장으로 보인다. 주소는 이제
       왼쪽 구 고르개가 그 일의 실질을 하고, 설치 위치는 표에서 「주요 항목」 열이
       적기는 하지만 **그 글자로 시설을 찾아오는 일은 없다**(「1층 로비」로 찾는
       담당자는 없다).

       AED·대피소는 명칭이 원천에 없어 주소에서 만든 이름을 쓰므로(`facilityName` —
       「둔전로 42 AED」) 도로명으로 찾는 길은 그 이름 안에 그대로 남는다. */
    return f.name.includes(list0.term);
  });
  const paged = list0.paginate(filtered);

  /* 일괄 처리 (명세서 1장) — 선택한 것을 한꺼번에 내리거나 올린다. 여기서 실제로
     쓰이는 자리는 "한 골목의 시설 여럿이 공사로 막혔을 때"다. 삭제를 일괄로 두지
     않은 것은 의도다 — 되돌리기 어려운 일을 한 번에 여러 건 하게 만들지 않는다. */
  const bulkVisible = on => {
    patchMany(list0.selected.map(id => [id, { visible: on }]), `공공시설 ${on ? "노출" : "숨김"}`);
    onToast(`${list0.selected.length}건을 ${on ? "노출" : "숨김"}으로 바꿨습니다.`);
    list0.setSelected([]);
  };

  /* 등록 다이얼로그에서 유형을 고르던 고르개가 여기 있었다 (2026-08-25 오후 삭제) —
     등록 창이 없어지면서 그 고르개가 설 자리도 없어졌다. 수정 창에서는 처음부터 고를 수
     없었다(유형이 곧 어느 항목표를 쓰느냐라, 바꾸면 채워 둔 값이 갈 곳을 잃는다) */

  return (
    <>
      {/* 제목 아래 설명을 두지 않는다 (2026-08-20, 사용자 요청) — 명세서 장 번호와
          시민 화면 기준일 고지가 적혀 있었다. 기준일은 [데이터 갱신 현황]이 보여주는
          값이고, 다루는 네 유형은 아래 고르개가 늘어놓는다.
          유형 탭 줄이 여기 있었다 (2026-08-24 삭제) — 필터 줄로 내려갔다. TYPE_OPTIONS 머리말 */}
      {/* 이름은 [공공시설 등록]이고 여는 것은 일괄 등록 창이다 (2026-09-04) — 점포 화면과
          같은 규칙이다. 「일괄」을 이름에 넣지 않는 이유는 담당자가 하려는 일이 「등록하는
          것」 하나이고, 이 화면에 한 건짜리 등록이 따로 있는 것도 아니라 가를 것이 없어서다 */}
      <PageHeader title="공공시설 정보 관리" count={`${filtered.length}곳`}
        action={<Button variant="primary" icon="upload" onClick={openBulk}>공공시설 등록</Button>} />

      <Toolbar actions={list0.selected.length ? (
        <>
          <span style={{ fontSize: "var(--fs-label)", color: "var(--text-body)", whiteSpace: "nowrap" }}>
            {list0.selected.length}건 선택
          </span>
          <Button variant="outline" size="sm" icon="eye" onClick={() => bulkVisible(true)}>노출</Button>
          <Button variant="outline" size="sm" icon="eye-off" onClick={() => bulkVisible(false)}>숨김</Button>
        </>
      ) : null}>
        {/* 검색창 **왼쪽**이다 — 점포·축제·QR 지점의 고르개가 서는 자리와 같다.
            **구가 유형보다 앞이다** (2026-08-26): 점포 줄이 「소속 상점가 → 업종」인
            것과 같은 차례다. 넓은 데서 좁은 데로 — 어디를 볼지가 먼저이고 무엇을
            볼지가 그다음이다 */}
        <Select value={gu} options={GU_OPTIONS} onChange={e => setGu(e.target.value)} />
        <Select value={type} options={TYPE_OPTIONS} onChange={e => setType(e.target.value)} />
        <ListSearch state={list0} placeholder="명칭 검색" />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="등록된 공공시설 목록"
        rows={paged.rows} rowKey="id"
        onRowClick={ed.openEdit}
        selectable selected={list0.selected} onSelectedChange={list0.setSelected}
        /* 좌표가 없으면 지도에 찍히지 않고 거리 계산도 안 된다 — 목록에서 바로 보여야
           그 줄을 열어 지도에서 찍게 된다 */
        rowTone={f => (f.lat == null || f.lng == null ? "warning" : null)}
        /* 제목 한 줄이다 (2026-08-24, 사용자 요청. Stores 와 같은 이유) */
        empty={{ title: "조건에 맞는 공공시설이 없습니다." }}
        columns={[
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
              <Switch checked={f.visible} aria-label={`${f.name} 노출 여부`}
                onChange={() => patch(f.id, { visible: !f.visible }, f.name)} />
            ) },
          /* 「관리」 열이 여기 있었다 — 안에 [삭제] 하나뿐이라 열째 없앴다
             (2026-08-25 오후, 사용자 요청. 위 머리말) */
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      {/* ── 시설 유형은 **창이 정한다** (2026-09-04, 사용자 요청) ────────────────────
          이 화면에서 유형은 목록을 좁히는 조건이기 전에 **어느 항목표를 쓰느냐**다 —
          AED 는 두 항목, 화장실은 열 항목이고(fields.js 3장) 수정 창에서도 유형만은 바꿀
          수 없다(채워 둔 값이 갈 곳을 잃는다). 그러니 **유형이 정해지지 않은 파일은 어느
          표로 읽어야 하는지가 정해지지 않은 파일**이라, 고르기 전에는 파일 칸이 잠긴다.

          받은 파일로 무엇을 하는지는 아직 이 화면에 없다 — 읽고 넣는 일이 서버 쪽이라
          [업로드]는 받았다는 사실만 적는다. 여기서 「120곳을 등록했습니다」처럼 그럴듯한
          결과를 지어내면 담당자는 목록이 그대로인 것을 보고 화면이 고장난 것으로 읽는다 */}
      <BulkUploadModal open={bulk}
        title="공공시설 일괄 등록"
        description="엑셀 파일을 통해 일괄 등록 가능합니다."
        onClose={() => setBulk(false)}
        blocked={bulkType ? "" : "시설 유형을 먼저 선택해주세요."}
        onUpload={file => {
          setBulk(false);
          onToast(`${FACILITY_LABELS[bulkType] || ""} · ${file.name} 파일을 받았습니다. 일괄 등록은 서버 연동 후 동작합니다.`);
        }}>
        {/* 이 칸에는 오류가 붙지 않는다 — 고르지 않아서 생기는 일은 **아래 칸이 잠기는
            것**이고, 그 말은 잠긴 칸이 자기 자리에서 한다 */}
        <FormField label="시설 유형" required type="select"
          value={bulkType} options={BULK_TYPE_OPTIONS} onChange={setBulkType}
          hint="업로드한 파일의 모든 시설이 현재 선택한 유형으로 등록됩니다." />
      </BulkUploadModal>

      <EditorModal ed={ed} size="lg"
        title="공공시설 수정"
        description={ed.draft
          ? `${FACILITY_LABELS[ed.draft.values.type] || ""} · ${ed.draft.values.name || ""}` : undefined}>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors}
            onChange={ed.set}
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
      {/* 삭제 확인 창이 여기 있었다 (2026-08-25 오후 삭제 — 지우는 자리가 없어졌다) */}
    </>
  );
}

export default Facilities;
