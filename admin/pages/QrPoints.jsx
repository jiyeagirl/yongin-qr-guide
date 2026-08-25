import React from "react";
import {
  PageHeader, Toolbar, DataTable, Select, Badge, Notice, Pagination, Button,
  ConfirmDialog, CoordField, fixCoord, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { KAKAO_APP_KEY } from "../../screens/main/config.js";
import { QR_POINTS } from "../../screens/main/data/qr.js";
import { DISTRICTS } from "../../screens/main/data/districts.js";
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
 * 만드는 길은 여전히 없다 ([지점 등록] 없음). 지점이 새로 생기는 일은 화면에서 값을 하나
 * 만드는 일이 아니라 **안내판을 제작해 현장에 붙이는 일**이고 그 코드는 종이에 인쇄되어
 * 나간다 — 고치는 것과 달리, 없던 코드를 화면이 지어내면 인쇄물 없는 코드가 표에 남는다.
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
   (대신 「활성 여부」다), 무엇보다 **지우면 안 되는 이유가 이 화면에만 있다**: 안내판은
   현장에 그대로 붙어 있다. 첫 줄은 다른 화면과 같다 — 되돌릴 수 없다는 사실은 화면마다
   다르게 적을 여지가 없고 이 상자에서 가장 먼저 읽혀야 한다 (ConfirmDialog 머리말). */
const DELETE_NOTE_QR = "삭제한 항목은 영구적으로 지워지며 되돌릴 수 없습니다. "
  + "안내판은 현장에 그대로 남아 있어, 지운 코드를 찍은 사용자는 「등록되지 않은 QR 코드」 안내를 받습니다. "
  + "안내판을 교체했다면 삭제 대신 설치 상태를 [철거]로 두고 [활성 여부]를 꺼 주세요.";

const DISTRICT_NAME = DISTRICTS.reduce((o, d) => { o[d.id] = d.name; return o; }, {});

/* qr.js 의 표는 code 를 열쇠로 쓴다. 덮개 저장소는 id 를 쓰므로 여기서 맞춰 준다 —
   저쪽 데이터의 모양을 바꾸지 않는다. 시민 화면이 그것을 그대로 읽고 있다. */
const SOURCE = QR_POINTS.map(p => ({ ...p, id: p.code }));

const STATUS_OPTIONS = [{ value: "", label: "전체 설치 상태" }]
  .concat(INSTALL_STATUS.map(v => ({ value: v, label: v })));

const ACTIVE_OPTIONS = [
  { value: "", label: "활성 전체" },
  { value: "y", label: "활성" },
  { value: "n", label: "비활성" },
];

const STATUS_TONE = { 설치예정: "warning", 설치완료: "success", 훼손: "danger", 철거: "neutral" };

export function QrPoints({ onToast }) {
  const { rows, upsert, remove, patchMany } = useCollection("qr", SOURCE, null, "QR 지점");
  const [status, setStatus] = React.useState("");
  const [active, setActive] = React.useState("");
  const list0 = useListState([status, active]);

  /* 고르개에 오르는 상점가 — 항목표의 붙박이 목록(QR_FIELDS 의 options)이 아니라 **지금
     살아 있는 것**을 쓴다. 지워진 상점가가 고르개에 남아 있으면, 지점을 옮겨 살려 두려던
     담당자가 방금 지운 상점가를 다시 고르게 되고 그 지점은 그대로 다시 사라진다.
     32개짜리 배열이라 렌더마다 다시 만들어도 값이 나가지 않는다. */
  const districtOptions = [{ value: "", label: "— 지정 안 함 —" }]
    .concat(readCollection("districts", DISTRICTS).map(d => ({ value: d.id, label: d.name })));

  /* **열 항목 전부** 폼에 선다 (2026-08-24. 머리말). 종전에는 여기서 여섯 개만 골라
     냈다 (`EDIT_KEYS`). 고르개 하나만 갈아끼운다 — 소속 상점가는 항목표의 붙박이 목록이
     아니라 지금 살아 있는 상점가를 봐야 한다 */
  const fields = QR_FIELDS
    .map(f => (f.key === "districtId" ? { ...f, options: districtOptions } : f));

  const ed = useRecordEditor({
    fieldsFor: () => fields,
    /* 덮개의 열쇠는 `id` 이고 이 표의 열쇠는 `code` 다 (SOURCE 주석). 식별자를 고쳐도
       **행의 id 는 그대로 둔다** — id 까지 따라 바꾸면 덮개가 그 행을 새 행으로 보고
       옛 id 짜리 원본이 목록에 하나 더 남는다. 화면과 시민 화면이 보는 것은 `code` 다 */
    onSave: values => upsert({ ...values, id: values.id || values.code }),
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

  return (
    <>
      {/* ── 제목 아래 설명을 없앴다 (2026-08-24, 사용자 요청) ────────────────────
          다섯 문장이었다: 무엇을 하는 화면인지 · 지점을 만들거나 지우지 않는다는 것 ·
          상점가를 지우면 함께 사라진다는 것 · 그것을 피하는 방법 · 되돌리는 자리.
          앞의 둘은 **화면이 이미 보여준다** — 목록에 [등록] 단추도 [삭제] 열도 없다.

          뒤의 셋은 **여기서 읽어도 지금 할 일이 아니다.** 그 일이 일어나는 자리는
          골목형 상점가 목록의 삭제 확인 창이고, 거기가 함께 지워질 것을 이름과 곳수로
          적으며 빠져나갈 방법까지 말한다 (Districts.jsx). 결정을 내리는 순간에 그 앞에
          서 있는 문장이 맞고, 날마다 여는 이 화면 맨 위에서 매번 읽는 문장은 아니다.
          명세서 10장의 「QR 지점 관리 화면의 안내 줄」 조항도 그렇게 고쳤다. */}
      <PageHeader title="QR 지점 관리" count={`${filtered.length}곳`} />

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
        <ListSearch state={list0} placeholder="식별자 · 지점명 · 주소 검색" />
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
        title="QR 지점 수정"
        description={ed.draft ? ed.draft.values.name : undefined}>
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
                 남는 것은 **경고 둘**이고, 자리는 그대로 폼 **위**다 (2026-08-20) —
                 폼이 「관리 메모」로 끝나야 하고(마지막 칸이 마지막에 보인다), 무엇보다
                 경고는 값을 고치기 **전에** 읽어야 한다. */
              (ed.draft.values.installStatus === "설치완료" && !ed.draft.values.active)
                || !ed.draft.values.districtId ? (
                /* 둘 다 안 걸리면 자리째 비운다 — 빈 상자가 여백만 만들면 폼 첫 칸이
                   까닭 없이 내려앉는다 */
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column",
                  gap: "var(--space-3)", paddingBottom: "var(--space-4)" }}>
                  {ed.draft.values.installStatus === "설치완료" && !ed.draft.values.active ? (
                    /* 사용자 쪽 문구가 바뀌면 이 줄도 함께 고친다 (2026-08-24) — 종전에는
                       「지금은 쓰지 않는 코드」라고 적었는데, 시민 화면이 훼손·철거와 준비
                       중을 가르면서 이 조합에서 뜨는 것은 S11-A 가 되었다. 담당자가 여기서
                       읽은 문구와 현장에서 뜨는 문구가 다르면 이 경고를 못 믿게 된다 */
                    <Notice tone="warning" size="sm">
                      설치는 완료인데 활성이 꺼져 있습니다. 지금 이 안내판을 찍으면 사용자에게
                      「아직 준비 중인 QR 코드입니다」 안내가 뜹니다. 열 준비가 되었으면 활성을 켜 주세요.
                    </Notice>
                  ) : null}

                  {!ed.draft.values.districtId ? (
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
