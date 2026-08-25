import React from "react";
import {
  PageHeader, Toolbar, DataTable, Select, Badge, Notice, Pagination, Button,
  ConfirmDialog, CoordField, fixCoord, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { KAKAO_APP_KEY } from "../../screens/main/config.js";
import { DISTRICTS } from "../../screens/main/data/districts.js";
import { QR_ROWS, DISTRICT_ROWS } from "../data/sources.js";
import { QR_FIELDS, INSTALL_STATUS } from "../data/fields.js";
import { useCollection, readCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";

/* M11 QR 지점 목록 · M12 QR 지점 수정.
 *
 * ── 모든 항목을 고치고 지울 수 있다 (2026-08-24, 사용자 요청으로 뒤집음) ─────
 * 2026-08-20 부터 이 화면은 **현황만** 갱신했다. 고칠 수 있는 것이 소속 상점가 · 설치 상태 ·
 * 설치일자 · 활성 여부 · 설치 상세 위치 · 관리 메모 여섯뿐이었고, 지점을 가리키는 네 값
 * (QR 식별자 · 지점명 · 주소 · 좌표)은 다이얼로그 위쪽에 읽기 전용으로 적기만 했다.
 * 삭제 버튼도 없었다. 근거는 **안내판에 인쇄되어 현장에 붙은 값**이라는 것이었다 —
 * 화면에서 고쳐 봐야 종이와 어긋나고, 지우면 그 코드를 찍은 시민이 「등록되지 않은
 * 코드」를 보게 된다.
 *
 * **그 근거는 사실로 남지만 잠그는 방식이 아니게 됐다.** 화면이 담당자를 대신해 판단하는
 * 대신, 무슨 일이 일어나는지를 적고 결정은 담당자가 한다:
 *
 *   고치기   열 항목 전부 폼에 선다. 주소를 바꾸면 좌표가 따라오고(입력 원칙 3번),
 *            식별자를 바꾸면 **옛 코드로 들어오던 시민이 미등록 안내를 받는다**는 사실을
 *            그 칸이 적는다 (fields.js 의 `code` hint)
 *   지우기   표의 [삭제] → 확인 창. 각주가 **안내판이 현장에 그대로 남는다**는 것과
 *            「교체했다면 지우지 말고 설치 상태를 「철거」로 두고 활성을 끈다」를 적는다.
 *            삭제는 영구다 (10장) — 그래서 이 화면의 각주가 다른 화면보다 길다
 *
 * ── 만드는 길도 열었다 (2026-08-25, 사용자 요청) ────────────────────────────
 * [QR 지점 등록]이 없던 근거는 "지점이 새로 생기는 일은 화면에서 값을 하나 만드는 일이 아니라
 * **안내판을 제작해 현장에 붙이는 일**"이라는 것이었다. 그 말은 지금도 맞다. 틀린 것은
 * **거기서 끌어낸 결론**이었다 — 안내판이 현장에 서고 나면 그 코드는 **어딘가에는 반드시
 * 등록되어야 한다.** 등록하는 자리를 화면에 두지 않으면 그 일은 사라지는 것이 아니라
 * 개발 쪽 요청으로 넘어가고, 담당자는 안내판을 붙여 놓고 기다린다.
 *
 * 열면서 **등록 창 맨 위에 안내 상자를 세웠다가 같은 날 걷어냈다** (사용자 요청).
 * 「안내판은 이 화면에서 만들어지지 않습니다 · 인쇄된 코드와 한 글자라도 다르면 … ·
 * 등록 직후에는 설치예정 · 활성 꺼짐이라 …」 넉 줄이었고, 식별자 칸에도 등록 전용 안내
 * 줄이 하나 더 붙어 있었다. **여기 적힌 것이 전부 화면에 이미 서 있다** — 식별자 칸은
 * 「안내판에 인쇄된 코드입니다」를 항목표에서 그대로 받고, 기본값은 등록 창이 열릴 때
 * 설치 상태 고르개와 꺼진 스위치가 보여주며, 그 조합에서 무엇이 뜨는지는 활성을 켜지
 * 않은 채 저장한 뒤 수정 창의 경고 상자가 적는다. 새 창을 여는 사람에게 네 줄을 먼저
 * 읽히는 대신 칸이 제 자리에서 말하게 둔다.
 *
 * **덮개의 열쇠는 여기서만 code 와 갈라진다.** 원본 표(qr.js)의 행은 id 를 code 로 맞춰
 * 두었지만(SOURCE), 화면에서 등록한 행의 id 는 덮개가 매기는 일련번호(`qr-new-001`)다.
 * 식별자를 고쳐도 id 를 따라 바꾸지 않는 규칙(onSave 주석)이 등록에도 그대로 걸린 것뿐이라,
 * 화면과 시민 화면이 보는 값은 언제나 `code` 다.
 *
 * ── 소속 상점가는 원래부터 인쇄되지 않는 값이다 (2026-08-24) ────────────────
 * 위 넷이 잠겨 있던 동안에도 이 하나는 폼에 있었다. 어디에도 인쇄되지 않고, **상점가는
 * 지워질 수 있으며 지우면 거기 걸린 QR 지점이 함께 가기 때문**이다 (Districts.jsx).
 * 소속이 읽기 전용이면 담당자에게 남는 길은 둘뿐이었다 — 상점가를 지우지 않거나, 멀쩡한
 * 안내판을 함께 지우거나. 지금은 지점을 다른 상점가로 옮기거나 [지정 안 함]으로 둘 수 있고,
 * **고르개에는 지금 살아 있는 상점가만 오른다** — 지워진 상점가로 옮길 수 있으면 방금 만든
 * 길이 다시 같은 자리로 돌아온다.
 *
 * ── 이 화면이 시민용의 시작점을 정한다 ──────────────────────────────────────
 * 시민이 보는 모든 거리("약 320m")가 여기 등록된 좌표 한 점에 매달려 있다. 좌표가 100m
 * 틀리면 그 지점으로 들어온 시민이 보는 **모든 숫자**가 100m 틀린다. 그래서 좌표를 숫자로
 * 받지 않고 지도로 받는다 (명세서 입력 원칙 3번) — 37.28874 가 맞는 값인지 아는 사람은 없다.
 *
 * ── 소속 상점가가 선택 항목이 되었다 (명세서 4장) ──────────────────────────
 * 예전에는 필수였는데, 명세서가 ○ 로 두고 이유까지 적었다 — "비우면 시민용 상점가 탭이
 * 안내 상태로 진입한다". 그 상태(S03-E)는 화면이 이미 갖고 있는 정상적인 갈래다.
 * 필수로 두면 근처에 상점가가 없는 지점(공원 · 관공서 앞)에 억지로 먼 상점가를 붙이게 되고,
 * 그러면 시민 화면이 5km 떨어진 상점가를 "여기 상점가"라고 말한다.
 * **앱은 이것을 계산하지 않는다** (U-ST-01) — 사람이 정하는 편이 정확하다.
 *
 * ── 설치 상태와 활성 여부는 다른 값이다 ─────────────────────────────────────
 * 설치 상태는 **현장의 사실**(설치예정 · 설치완료 · 훼손 · 철거)이고, 활성 여부는
 * **우리가 켜고 끄는 스위치**다. 둘을 하나로 묶으면 "붙이긴 했는데 아직 열지 않은" 상태를
 * 표현할 수 없다. `is_active` 기본값이 꺼짐인 것도 그래서다 — 설치가 끝나기 전에 누군가
 * 시험 삼아 스캔하면 오류 화면이 뜬다.
 *
 * ── 끄는 것과 지우는 것은 다르다 (이제 화면이 막지 않고 적는다) ─────────────
 * 안내판을 교체했을 때 옛 코드는 **남겨두고 끄는 것**이 원칙이다. 지우면 그 코드로 들어온
 * 시민이 "등록된 적 없는 코드"로 안내받는데, 실제로는 예전에 우리가 붙였던 코드다. 그 둘은
 * 할 말이 다르다 (U-CM-02 · S11 의 두 갈래). 대시보드의 지점별 스캔을 보면 철거한
 * 2019년 안내판을 아직 찍는 사람이 있다 — 그것이 「지우지 말고 끄라」는 권고의 근거다.
 * 그 권고를 **삭제 확인 창의 각주**가 적는다 (아래 DELETE_NOTE_QR). 버튼을 없애는 대신
 * 결정하는 자리에서 말하는 쪽으로 바꿨다 — 삭제가 영구가 된 뒤로는 그 한 줄이 더 무겁다.
 */

/* 삭제 각주 — 기본 문구(DELETE_NOTE)를 쓰지 않는다. QR 지점에는 「노출 여부」가 없고
   (대신 「활성 여부」다), 무엇보다 **지우는 대신 할 일이 이 화면에만 있다**: 코드는
   남겨두고 끈다. 첫 줄은 다른 화면과 같다 — 되돌릴 수 없다는 사실은 화면마다 다르게
   적을 여지가 없고 이 상자에서 가장 먼저 읽혀야 한다 (ConfirmDialog 머리말).

   ── 두 문장이다 (2026-08-25, 사용자 요청) ─────────────────────────────────
   가운데 있던 「안내판은 현장에 그대로 남아 있어, 지운 코드를 찍은 사용자는 「등록되지
   않은 QR 코드」 안내를 받습니다」를 뺐다. **왜 그러면 안 되는지를 설명하는 문장**인데,
   담당자는 [삭제]를 누르고 들어온 참이라 이 상자를 끝까지 읽지 않을 수 있다. 남는 두
   문장이 결정에 필요한 전부다 — 되돌릴 수 없다 · 대신 이렇게 하라 (기본 각주
   DELETE_NOTE 가 v1.9 에서 같은 이유로 두 문장이 됐다).

   「안내판을 교체했다면」이 「QR 코드를 교체했다면」이 된 것도 같은 판이다 — 담당자가
   이 화면에서 다루는 것은 코드이고, 안내판은 그 코드가 인쇄되어 나간 종이다. */
const DELETE_NOTE_QR = "삭제한 항목은 복구할 수 없습니다. "
  + "QR 코드를 교체했다면 삭제 대신 설치 상태를 [철거]로 두고 [활성 여부]를 비활성으로 돌려주세요.";

/* 등록 창에만 서던 `NEW_CODE_HINT` 가 여기 있었다 (2026-08-25 삭제, 사용자 요청) —
   「안내판 제작에 넘긴 코드와 똑같이 적습니다 …」. 같은 날 등록 안내 상자와 함께 나갔다
   (아래 `before` 주석). 항목표의 `code` hint 는 그대로다. */

const DISTRICT_NAME = DISTRICTS.reduce((o, d) => { o[d.id] = d.name; return o; }, {});

/* 열쇠를 맞추던 한 줄(`code` → `id`)이 여기 있었다 — 2026-08-25 에 `data/sources.js` 의
   `QR_ROWS` 로 옮겼다. 상점가 관리가 같은 줄을 따로 갖고 있었다. */

const STATUS_OPTIONS = [{ value: "", label: "전체 설치 상태" }]
  .concat(INSTALL_STATUS.map(v => ({ value: v, label: v })));

const ACTIVE_OPTIONS = [
  { value: "", label: "활성 전체" },
  { value: "y", label: "활성" },
  { value: "n", label: "비활성" },
];

const STATUS_TONE = { 설치예정: "warning", 설치완료: "success", 훼손: "danger", 철거: "neutral" };

export function QrPoints({ onToast }) {
  const { rows, upsert, remove, patchMany } = useCollection("qr", QR_ROWS, null, "QR 지점");
  const [status, setStatus] = React.useState("");
  const [active, setActive] = React.useState("");
  const list0 = useListState([status, active]);

  /* 고르개에 오르는 상점가 — 항목표의 붙박이 목록(QR_FIELDS 의 options)이 아니라 **지금
     살아 있는 것**을 쓴다. 지워진 상점가가 고르개에 남아 있으면, 지점을 옮겨 살려 두려던
     담당자가 방금 지운 상점가를 다시 고르게 되고 그 지점은 그대로 다시 사라진다.
     32개짜리 배열이라 렌더마다 다시 만들어도 값이 나가지 않는다. */
  const districtOptions = [{ value: "", label: "— 지정 안 함 —" }]
    .concat(readCollection("districts", DISTRICT_ROWS).map(d => ({ value: d.id, label: d.name })));

  /* **열 항목 전부** 폼에 선다 (2026-08-24. 머리말). 종전에는 여기서 여섯 개만 골라
     냈다 (`EDIT_KEYS`). 항목표를 그대로 쓰되 하나만 갈아끼운다 — 소속 상점가는 항목표의
     붙박이 목록이 아니라 **지금 살아 있는** 상점가를 봐야 한다.

     식별자 칸의 안내 줄을 등록/수정에서 가르던 갈래가 여기 있었다 (2026-08-25 삭제) */
  const fieldsFor = () => QR_FIELDS
    .map(f => (f.key === "districtId" ? { ...f, options: districtOptions } : f));

  const ed = useRecordEditor({
    fieldsFor,
    /* 안내판을 붙이고 나서 등록하는 자리라 **현장 기록은 설치예정, 스위치는 꺼짐**에서
       시작한다 (명세서 4장의 `is_active` 기본값). 이 조합을 찍으면 오류가 아니라
       「곧 열립니다」다 — 여는 것은 담당자가 따로 내리는 결정이다 */
    initial: () => ({ installStatus: "설치예정", active: false }),
    /* 덮개의 열쇠는 `id` 이고 이 표의 열쇠는 `code` 다 (SOURCE 주석). 식별자를 고쳐도
       **행의 id 는 그대로 둔다** — id 까지 따라 바꾸면 덮개가 그 행을 새 행으로 보고
       옛 id 짜리 원본이 목록에 하나 더 남는다. 화면과 시민 화면이 보는 것은 `code` 다.
       **등록할 때는 id 를 지어 넣지 않는다** — 비워서 넘겨야 덮개가 `added` 에 새 행으로
       담는다. code 를 id 로 넣으면 없는 원본 행에 대한 수정으로 기록되어 사라진다 */
    onSave: values => upsert(values),
    onRemove: remove,
    /* 식별자는 **전역 유일**이다 (항목표의 range). 고칠 수 있게 된 이상 검사가 있어야
       한다 — 겹치는 코드를 저장하면 시민이 그 코드를 찍었을 때 어느 지점으로 갈지가
       표의 차례로 정해진다. 자기 자신은 빼고 견준다 */
    extraValidate: v => {
      const code = String(v.code || "").trim();
      if (code && rows.some(p => p.code === code && p.id !== v.id)) {
        return { code: "이미 쓰는 QR 식별자입니다." };
      }
      return {};
    },
    onToast, label: "QR 지점",
  });

  /* 일괄 처리 — 다른 목록 화면과 같은 규칙이되 **켜고 끄는 것이 「활성 여부」다**
     (2026-08-24 추가, 사용자 요청). 이 화면에는 「노출 여부」가 없다. 실제로 쓰이는
     자리는 「한 상점가의 안내판을 한꺼번에 여는」 일이다. 삭제는 일괄로 두지 않는다 —
     되돌릴 수 없는 일을 한 번에 여러 건 하게 만들지 않는다. */
  const bulkActive = on => {
    patchMany(list0.selected.map(id => [id, { active: on }]), `QR 지점 ${on ? "활성" : "비활성"}`);
    onToast(`${list0.selected.length}건을 ${on ? "활성" : "비활성"}으로 바꿨습니다.`);
    list0.setSelected([]);
  };

  const filtered = rows.filter(p => {
    if (status && (p.installStatus || "설치예정") !== status) return false;
    if (active === "y" && !p.active) return false;
    if (active === "n" && p.active) return false;
    if (!list0.term) return true;
    return `${p.code} ${p.name} ${p.dong || ""} ${p.addr || ""}`.includes(list0.term);
  });
  const paged = list0.paginate(filtered);

  /* 폼 **위**에 서는 상자 둘 — 여기서 한 번에 판단한다. 자리가 위인 이유는 아래
     `before` 주석 참조.

       준비 중 경고    설치완료인데 꺼져 있을 때. 등록 기본값(설치예정)에서는 걸리지 않는다
       소속 없음      **고칠 때만.** 등록 창에서는 아직 아무것도 고르지 않은 것이 당연하고,
                     비웠을 때 무슨 일이 생기는지는 그 칸 아래 한 줄이 이미 적는다

     등록 창에만 서던 안내 상자가 여기 셋째로 있었다 (2026-08-25 삭제, 사용자 요청) */
  const dv = ed.draft ? ed.draft.values : {};
  const isNew = !!(ed.draft && ed.draft.isNew);
  const warnPending = dv.installStatus === "설치완료" && !dv.active;
  const warnNoDistrict = !isNew && !dv.districtId;

  return (
    <>
      {/* ── 제목 아래 설명을 없앴다 (2026-08-24, 사용자 요청) ────────────────────
          다섯 문장이었다: 무엇을 하는 화면인지 · 지점을 만들거나 지우지 않는다는 것 ·
          상점가를 지우면 함께 사라진다는 것 · 그것을 피하는 방법 · 되돌리는 자리.
          앞의 둘은 **화면이 이미 보여준다** — 그때는 목록에 [등록] 단추도 [삭제] 열도
          없었고, 지금은 둘 다 있다. 어느 쪽이든 할 수 있는 일은 단추가 말한다.

          뒤의 셋은 **여기서 읽어도 지금 할 일이 아니다.** 그 일이 일어나는 자리는
          골목형 상점가 목록의 삭제 확인 창이고, 거기가 함께 지워질 것을 이름과 곳수로
          적으며 빠져나갈 방법까지 말한다 (Districts.jsx). 결정을 내리는 순간에 그 앞에
          서 있는 문장이 맞고, 날마다 여는 이 화면 맨 위에서 매번 읽는 문장은 아니다.
          명세서 10장의 「QR 지점 관리 화면의 안내 줄」 조항도 그렇게 고쳤다. */}
      <PageHeader title="QR 지점 관리" count={`${filtered.length}곳`}
        action={<Button variant="primary" icon="plus" onClick={ed.openNew}>QR 지점 등록</Button>} />

      <Toolbar actions={list0.selected.length ? (
        <>
          <span style={{ fontSize: "var(--fs-label)", color: "var(--text-body)", whiteSpace: "nowrap" }}>
            {list0.selected.length}건 선택
          </span>
          <Button variant="outline" size="sm" icon="eye" onClick={() => bulkActive(true)}>활성</Button>
          <Button variant="outline" size="sm" icon="eye-off" onClick={() => bulkActive(false)}>비활성</Button>
        </>
      ) : null}>
        <Select value={status} options={STATUS_OPTIONS} onChange={e => setStatus(e.target.value)} />
        <Select value={active} options={ACTIVE_OPTIONS} onChange={e => setActive(e.target.value)} />
        <ListSearch state={list0} placeholder="식별자, 지점명, 주소 검색" />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="등록된 QR 설치 지점 목록"
        rows={paged.rows} rowKey="id" onRowClick={ed.openEdit}
        selectable selected={list0.selected} onSelectedChange={list0.setSelected}
        empty={{ title: "조건에 맞는 지점이 없습니다." }}
        /* 설치는 끝났는데 아직 안 켠 지점 — 안내판은 붙어 있고 찍으면 준비 중 안내가
           뜬다 (S11-A). 남은 일 중 가장 급한 것이라 줄째로 세운다 */
        rowTone={p => (p.installStatus === "설치완료" && !p.active ? "warning"
          : p.installStatus === "훼손" ? "danger" : null)}
        columns={[
          { key: "code", label: "QR 식별자", width: 160, sortable: true },
          { key: "name", label: "지점명", sortable: true },
          { key: "addr", label: "도로명주소", render: p => p.addr || p.dong || EMPTY_MARK },
          { key: "districtId", label: "소속 골목형 상점가", width: 190,
            render: p => (p.districtId
              ? DISTRICT_NAME[p.districtId]
              : <span style={{ color: "var(--text-muted)" }}>지정 안 함</span>) },
          { key: "installStatus", label: "설치 상태", width: 110, align: "center", sortable: true,
            render: p => (
              <Badge tone={STATUS_TONE[p.installStatus] || "neutral"} size="sm">
                {p.installStatus || "설치예정"}
              </Badge>
            ) },
          { key: "installedAt", label: "설치일자", width: 110, render: p => p.installedAt || EMPTY_MARK },
          { key: "active", label: "활성", width: 90, align: "center", sortable: true,
            render: p => <Badge tone={p.active ? "success" : "neutral"} size="sm">{p.active ? "활성" : "비활성"}</Badge>,
            sortValue: p => (p.active ? 0 : 1) },
          /* 「관리」 열이 2026-08-24 에 생겼다 (사용자 요청) — 그 전에는 삭제하는 길
             자체를 두지 않았다. 다른 목록 화면과 같은 모양·같은 자리다 */
          { key: "manage", label: "관리", width: 96, align: "center",
            render: p => (
              <Button variant="ghost" size="sm" icon="trash-2"
                onClick={() => ed.askRemove(p)} style={{ color: "var(--state-danger)" }}>삭제</Button>
            ) },
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      <EditorModal ed={ed} size="lg"
        title={ed.draft && ed.draft.isNew ? "QR 지점 등록" : "QR 지점 수정"}
        /* 등록 창에는 부제를 두지 않는다 — 지점명이 아직 빈 칸이라 적을 것이 없다 */
        description={ed.draft && !ed.draft.isNew ? ed.draft.values.name : undefined}>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors} onChange={ed.set}
            /* 주소 검색이 좌표를 함께 돌려준다 (V-02 · 입력 원칙 3번). 점포·공공시설과 같은
               한 줄이다 — 이 화면에서는 그 좌표가 **시민이 보는 모든 거리의 기준점**이라
               더 중요하다 (머리말) */
            onAddress={(key, picked) => ed.setMany({ [key]: picked.addr, lat: picked.lat, lng: picked.lng })}
            slots={{
              coord: (
                <CoordField key="coord" lat={ed.draft.values.lat} lng={ed.draft.values.lng}
                  name={ed.draft.values.name} appKey={KAKAO_APP_KEY}
                  onChange={c => ed.setMany({ lat: fixCoord(c.lat), lng: fixCoord(c.lng) })} />
              ),
            }}
            before={
              /* 읽기 전용 요약(`InfoList`)이 여기 있었다 (2026-08-24 삭제) — QR 식별자 ·
                 지점명 · 도로명주소 · 좌표 넷을 글자로 적던 자리다. 그 넷이 폼으로
                 내려가면서 같은 값을 한 창에 두 번 적는 자리가 됐다 (머리말).
                 남는 것은 **상자 셋**이고(위 dv 주석), 자리는 그대로 폼 **위**다
                 (2026-08-20) — 폼이 「관리 메모」로 끝나야 하고(마지막 칸이 마지막에
                 보인다), 무엇보다 경고는 값을 고치기 **전에** 읽어야 한다. */
              warnPending || warnNoDistrict ? (
                /* 둘 다 안 걸리면 자리째 비운다 — 빈 상자가 여백만 만들면 폼 첫 칸이
                   까닭 없이 내려앉는다 */
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column",
                  gap: "var(--space-3)", paddingBottom: "var(--space-4)" }}>
                  {warnPending ? (
                    /* ── 두 문장으로 줄였다 (2026-08-25, 사용자 요청) ──────────────────
                       종전에는 가운데에 시민 화면 문구를 그대로 인용했다 (「지금 이 안내판을
                       찍으면 사용자에게 "아직 준비 중인 QR 코드입니다" 안내가 뜹니다」).
                       시민 쪽 문구가 바뀌면 여기도 함께 고쳐야 하는 줄이었고 — S11-A 가
                       생기면서 실제로 한 번 고쳤다 — 담당자가 **지금 할 일**과는 상관이
                       없었다. 켜면 그 안내는 사라지고, 켜지 않을 이유가 그 문구에 있지도 않다.

                       남긴 둘은 상태와 할 일이다 — 지금 무엇이고, 무엇을 하면 되는가.
                       각괄호는 이 화면이 켜고 끄는 것을 가리킬 때 쓰는 표시고(삭제 각주의
                       「[철거]」와 같다), 그 스위치는 폼 아래쪽 「활성 여부」 칸이다. */
                    <Notice tone="warning" size="sm">
                      설치는 완료되었으나 현재 비활성 상태입니다. 운영을 시작하려면 [활성]을 켜 주세요.
                    </Notice>
                  ) : null}

                  {warnNoDistrict ? (
                    <Notice tone="neutral" size="sm">
                      소속을 비워 두면 이 지점으로 들어온 사용자에게 가까운 골목형 상점가 3곳을 대신 안내합니다.
                      근처에 골목형 상점가가 없는 자리(공원 · 관공서 앞)에서는 그것이 맞는 화면입니다.
                    </Notice>
                  ) : null}
                </div>
              ) : null
            } />
        ) : null}
      </EditorModal>

      {/* 삭제 확인 창 (2026-08-24 신설) — 각주가 이 화면에만 있는 사정을 적는다.
          안내판은 현장에 그대로 붙어 있고, 삭제는 영구다 (DELETE_NOTE_QR 머리말) */}
      <ConfirmDialog open={!!ed.pending} name={ed.pending && ed.pending.name}
        description="QR 지점을 삭제합니다."
        footnote={DELETE_NOTE_QR}
        onClose={ed.cancelRemove} onConfirm={ed.confirmRemove} />
    </>
  );
}

export default QrPoints;
