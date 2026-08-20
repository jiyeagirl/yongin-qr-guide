import React from "react";
import {
  PageHeader, Toolbar, DataTable, Select, Badge, Notice, Pagination,
  CopyField, InfoList, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { QR_POINTS } from "../../screens/main/data/qr.js";
import { DISTRICTS } from "../../screens/main/data/districts.js";
import { QR_FIELDS, INSTALL_STATUS, qrEntryUrl } from "../data/fields.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { useListState, ListSearch, PageSizeSelect, SearchHint } from "./useListState.js";
import { RecordForm } from "./RecordForm.jsx";
import { EditorModal } from "./EditorModal.jsx";

/* M11 QR 지점 목록 · M12 QR 지점 현황 수정.
 *
 * ── 지점을 만들지도 지우지도 않는다 (2026-08-20, 사용자 요청) ───────────────
 * 이 화면은 **말 그대로 지점 관리**다 — 어디에 무엇이 붙어 있고 지금 어떤 상태인지를 보고,
 * 그 현황을 갱신한다. QR 지점이 새로 생기는 일은 화면에서 값을 하나 만드는 일이 아니라
 * **안내판을 제작해 현장에 붙이는 일**이고, 그 코드는 종이에 인쇄되어 나간다.
 * 화면에서 코드를 만들 수 있게 두면 인쇄물 없는 코드가 표에 남는다.
 *
 * 그래서 고칠 수 있는 것은 현장에서 달라지는 값뿐이다:
 *   설치 상태 · 설치일자 · 활성 여부 · 설치 상세 위치 · 관리 메모
 * 지점을 가리키는 값(QR 식별자 · 지점명 · 주소 · 좌표 · 소속 상점가)은 **읽기 전용**으로
 * 다이얼로그 위쪽에 적기만 한다. 삭제도 없다 — 아래 「끄는 것과 지우는 것은 다르다」 참조.
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
 * ── 끄는 것과 지우는 것은 다르다 ────────────────────────────────────────────
 * 안내판을 교체했을 때 옛 코드는 **남겨두고 끈다**. 지우면 그 코드로 들어온 시민이
 * "등록된 적 없는 코드"로 안내받는데, 실제로는 예전에 우리가 붙였던 코드다. 그 둘은
 * 할 말이 다르다 (U-CM-02 · S11 의 두 갈래). 대시보드의 지점별 스캔을 보면 철거한
 * 2019년 안내판을 아직 찍는 사람이 있다 — 그것이 지우면 안 되는 이유의 증거다.
 * 삭제 버튼을 아예 두지 않는 것이 이 원칙을 지키는 가장 짧은 방법이다.
 */

/* 현장에서 달라지는 값만 고친다. 나머지는 위쪽에 읽기 전용으로 적는다 */
const STATUS_KEYS = ["installStatus", "installedAt", "active", "locationDetail", "memo"];

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
  const { rows, upsert } = useCollection("qr", SOURCE, null, "QR 지점");
  const [status, setStatus] = React.useState("");
  const [active, setActive] = React.useState("");
  const list0 = useListState([status, active]);

  const ed = useRecordEditor({
    /* 현황 항목만 폼에 세운다. 지점을 가리키는 값은 폼 위 요약에 읽기 전용으로 적는다 */
    fieldsFor: () => QR_FIELDS.filter(f => STATUS_KEYS.includes(f.key)),
    /* 넘어온 행에 고친 값만 덮는다 — 폼에 없는 값(코드 · 좌표 …)은 그대로 간다 */
    onSave: values => upsert({ ...values, id: values.id || values.code }),
    onToast, label: "QR 지점",
  });

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
      <PageHeader title="QR 지점 관리" count={`${filtered.length}곳`}
        note="설치된 지점의 현황을 보고 설치 상태와 활성 여부를 갱신합니다. 지점을 새로 만들거나 지우지는 않습니다." />

      <Toolbar>
        <ListSearch state={list0} placeholder="식별자 · 지점명 · 주소 검색" />
        <Select value={status} options={STATUS_OPTIONS} onChange={e => setStatus(e.target.value)} />
        <Select value={active} options={ACTIVE_OPTIONS} onChange={e => setActive(e.target.value)} />
        <PageSizeSelect state={list0} />
        <SearchHint state={list0} />
      </Toolbar>

      <DataTable
        caption="등록된 QR 설치 지점 목록"
        rows={paged.rows} rowKey="id" onRowClick={ed.openEdit}
        empty={{ title: "조건에 맞는 지점이 없습니다." }}
        /* 설치는 끝났는데 아직 안 켠 지점 — 안내판은 붙어 있고 찍으면 오류가 뜬다.
           남은 일 중 가장 급한 것이라 줄째로 세운다 */
        rowTone={p => (p.installStatus === "설치완료" && !p.active ? "warning"
          : p.installStatus === "훼손" ? "danger" : null)}
        columns={[
          { key: "code", label: "QR 식별자", width: 160, sortable: true },
          { key: "name", label: "지점명", sortable: true },
          { key: "addr", label: "도로명주소", render: p => p.addr || p.dong || EMPTY_MARK },
          { key: "districtId", label: "소속 상점가", width: 180,
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
          /* 「관리」 열(삭제 버튼)이 없다 — 옛 코드는 지우지 않고 끈다 (머리말 참조) */
        ]} />

      <div style={{ marginTop: "var(--space-5)" }}>
        <Pagination page={paged.page} pageCount={paged.pageCount} onChange={list0.setPage} />
      </div>

      <EditorModal ed={ed} size="lg"
        title="QR 지점 현황 수정"
        description={ed.draft ? ed.draft.values.name : undefined}>
        {ed.draft ? (
          <RecordForm fields={ed.fields} values={ed.draft.values} errors={ed.errors} onChange={ed.set}
            before={
              /* 지점을 가리키는 값 — 여기서 고치지 않으므로 입력칸 대신 글로 적는다.
                 그래도 보여는 준다: 지금 어느 지점의 현황을 고치는 중인지 알아야 한다 */
              <div style={{ gridColumn: "1 / -1", paddingBottom: "var(--space-4)",
                borderBottom: "var(--stroke-hairline) solid var(--border-default)" }}>
                <InfoList items={[
                  { label: "QR 식별자", value: ed.draft.values.code },
                  { label: "지점명", value: ed.draft.values.name },
                  { label: "도로명주소", value: ed.draft.values.addr || ed.draft.values.dong },
                  { label: "좌표", value: ed.draft.values.lat != null && ed.draft.values.lng != null
                    ? `${ed.draft.values.lat}, ${ed.draft.values.lng}` : null },
                  { label: "소속 상점가", value: DISTRICT_NAME[ed.draft.values.districtId] || "지정 안 함" },
                ]} />
                <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-caption)",
                  color: "var(--text-muted)", lineHeight: 1.55 }}>
                  위 다섯 값은 안내판에 인쇄되어 현장에 붙은 것이라 이 화면에서 바꾸지 않습니다.
                  아래 현황만 고칠 수 있습니다.
                </p>
              </div>
            }
            extra={
              <div style={{ gridColumn: "1 / -1" }}>
                {/* 진입 URL (명세서 4장) — QR 이미지는 이 값으로 외부 도구에서 만든다 */}
                <p style={{ marginBottom: 6, fontSize: "var(--fs-label)",
                  fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>
                  진입 URL
                </p>
                <CopyField label="이 주소로 QR 이미지를 만듭니다" value={qrEntryUrl(ed.draft.values.code)}
                  onCopied={ok => onToast(ok ? "진입 URL 을 복사했습니다." : "복사하지 못했습니다.")} />
                <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
                  QR 이미지 생성은 이 화면에서 하지 않습니다. 인쇄 규격(크기 · 여백 · 오류정정 수준)이
                  안내판 제작처마다 달라, 주소만 정확히 넘기고 이미지는 그쪽 도구로 만드는 편이 낫습니다.
                </p>

                {ed.draft.values.installStatus === "설치완료" && !ed.draft.values.active ? (
                  <Notice tone="warning" size="sm" style={{ marginTop: "var(--space-4)" }}>
                    설치는 완료인데 활성이 꺼져 있습니다. 지금 이 안내판을 찍으면 시민에게
                    「지금은 쓰지 않는 코드」 안내가 뜹니다. 열 준비가 되었으면 활성을 켜 주세요.
                  </Notice>
                ) : null}

                {!ed.draft.values.districtId ? (
                  <Notice tone="neutral" size="sm" style={{ marginTop: "var(--space-3)" }}>
                    소속 상점가를 비워 두면 이 지점으로 들어온 시민의 상점가 탭이 안내 상태(S03-E)로 뜹니다.
                    근처에 상점가가 없는 자리(공원 · 관공서 앞)에서는 그것이 맞는 화면입니다.
                  </Notice>
                ) : null}
              </div>
            } />
        ) : null}
      </EditorModal>

      {/* 삭제 확인 다이얼로그가 없다 — 삭제하는 길 자체를 두지 않았다.
          안내판을 교체했으면 설치 상태를 「철거」로 두고 활성을 끈다. */}
    </>
  );
}

export default QrPoints;
