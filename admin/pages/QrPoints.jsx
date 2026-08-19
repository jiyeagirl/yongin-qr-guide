import React from "react";
import {
  PageHeader, Toolbar, DataTable, Modal, ConfirmDialog, Button, Select, SearchField,
  Badge, KakaoMap, EMPTY_MARK, Notice,
} from "../../design-systems/admin.js";
import { QR_POINTS } from "../../screens/main/data/qr.js";
import { DISTRICTS } from "../../screens/main/data/districts.js";
import { KAKAO_APP_KEY } from "../../screens/main/config.js";
import { QR_FIELDS } from "../data/fields.js";
import { useCollection } from "../data/store.js";
import { useRecordEditor } from "./useRecordEditor.js";
import { RecordForm } from "./RecordForm.jsx";

/* A-QR-01 QR 지점 관리.
 *
 * ── 이 화면이 시민용의 시작점을 정한다 ──────────────────────────────────────
 * 시민이 보는 모든 거리("약 320m")가 여기 등록된 좌표 한 점에 매달려 있다. 좌표가 100m
 * 틀리면 화면의 모든 숫자가 100m 틀린다. 그래서 좌표 두 칸 옆에 **지도 미리보기**를 둔다 —
 * 위경도 숫자만 보고 그것이 맞는지 아는 사람은 없다.
 *
 * ── 소속 상점가를 관리자가 직접 고른다 ──────────────────────────────────────
 * U-ST-01 이 그렇게 정하고 있다. 앱은 최근접 상점가를 계산하지 않는다 — QR 지점이
 * 50개소뿐이라 사람이 정하는 편이 정확하고, 경계에 선 지점에서 계산이 엉뚱한 답을 내는
 * 일도 없다. 이 폼의 그 한 칸이 시민 화면의 상점가 탭 전체를 정한다.
 *
 * ── 활성 여부를 끄는 것과 지우는 것은 다르다 ────────────────────────────────
 * 안내판을 교체했을 때 옛 코드는 **남겨두고 끈다**. 지우면 그 코드로 들어온 시민이
 * "등록된 적 없는 코드"로 안내받는데, 실제로는 예전에 우리가 붙였던 코드다.
 * 그 둘은 할 말이 다르다 (U-CM-02 · S11 의 두 갈래). 목록에서 끈 지점을 감추지 않는
 * 이유이기도 하다.
 *
 * ── 유효한 코드가 하나뿐인 것은 더미의 사정이다 ─────────────────────────────
 * 더미 데이터가 전부 둔전 한 지점 기준이라 지점을 늘리면 이름만 바뀌고 거리는 그대로인
 * 화면이 된다 (screens/main/data/qr.js 머리말). 등록은 되지만 그 지점으로 시민 화면을
 * 열어볼 수는 없다 — 아래 안내가 그 사실을 적는다.
 */

const DISTRICT_NAME = DISTRICTS.reduce((o, d) => { o[d.id] = d.name; return o; }, {});

/* qr.js 의 표는 code 를 열쇠로 쓴다. 덮개 저장소는 id 를 쓰므로 여기서 맞춰 준다 —
   저쪽 데이터의 모양을 바꾸지 않는다. 시민 화면이 그것을 그대로 읽고 있다. */
const SOURCE = QR_POINTS.map(p => ({ ...p, id: p.code }));

const ACTIVE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "y", label: "활성" },
  { value: "n", label: "비활성" },
];

function coordOf(p) {
  if (p.lat == null || p.lng == null) return EMPTY_MARK;
  return `${Number(p.lat).toFixed(5)}, ${Number(p.lng).toFixed(5)}`;
}

export function QrPoints({ onToast }) {
  const { rows, upsert, remove } = useCollection("qr", SOURCE);
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState("");

  const ed = useRecordEditor({
    fieldsFor: () => QR_FIELDS,
    initial: () => ({ active: true, districtId: DISTRICTS[0] ? DISTRICTS[0].id : "" }),
    /* code 가 곧 id 다. 새로 등록할 때도 담당자가 적은 코드를 그대로 쓴다 —
       QR 스티커에 인쇄될 값이라 우리가 만든 일련번호로 두면 안 된다 */
    onSave: values => upsert({ ...values, id: values.id || values.code }),
    onRemove: remove,
    onToast, label: "QR 지점",
  });

  const list = rows.filter(p => {
    if (active === "y" && !p.active) return false;
    if (active === "n" && p.active) return false;
    if (!q.trim()) return true;
    return `${p.code} ${p.name} ${p.dong || ""}`.includes(q.trim());
  });

  /* 미리보기 좌표. 입력 중에는 문자열이라 숫자로 바꿔 보고, 아직 못 읽으면 지도를 띄우지 않는다 */
  const preview = (() => {
    if (!ed.draft) return null;
    const lat = Number(ed.draft.values.lat);
    const lng = Number(ed.draft.values.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 ? { lat, lng } : null;
  })();

  return (
    <>
      <PageHeader title="QR 지점 관리" count={`${list.length}곳`}
        note="설치 지점의 좌표가 시민용 화면의 모든 거리 표기의 기준점이 됩니다."
        action={<Button variant="primary" icon="plus" onClick={ed.openNew}>지점 등록</Button>} />

      <Toolbar>
        <SearchField value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ("")}
          placeholder="코드 · 지점명 · 행정동 검색" style={{ width: 320 }} />
        <Select value={active} options={ACTIVE_OPTIONS} onChange={e => setActive(e.target.value)} />
      </Toolbar>

      <DataTable
        caption="등록된 QR 설치 지점 목록"
        rows={list} rowKey="id" onRowClick={ed.openEdit}
        empty={{ title: "조건에 맞는 지점이 없습니다." }}
        columns={[
          { key: "code", label: "QR 코드", width: 170, sortable: true },
          { key: "name", label: "지점 명칭", sortable: true },
          { key: "dong", label: "행정동", render: p => p.dong || EMPTY_MARK },
          { key: "coord", label: "좌표", width: 180, render: coordOf, hint: "위도, 경도" },
          { key: "districtId", label: "소속 상점가", width: 190,
            render: p => DISTRICT_NAME[p.districtId] || EMPTY_MARK },
          { key: "active", label: "상태", width: 90, align: "center", sortable: true,
            render: p => <Badge tone={p.active ? "success" : "neutral"} size="sm">{p.active ? "활성" : "비활성"}</Badge>,
            sortValue: p => (p.active ? 0 : 1) },
          { key: "manage", label: "관리", width: 96, align: "right",
            render: p => (
              <Button variant="ghost" size="sm" icon="trash-2"
                onClick={() => ed.askRemove(p)} style={{ color: "var(--state-danger)" }}>삭제</Button>
            ) },
        ]} />

      <Modal open={!!ed.draft} size="lg" onClose={ed.close}
        title={ed.draft && ed.draft.isNew ? "QR 지점 등록" : "QR 지점 수정"}
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
                <p style={{ marginBottom: 6, fontSize: "var(--fs-label)",
                  fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>
                  좌표 미리보기
                </p>
                {/* KakaoMap 의 뿌리가 position:absolute 라 크기를 가진 relative 상자가 필요하다 */}
                <div style={{ position: "relative", height: 220, borderRadius: "var(--radius-md)",
                  overflow: "hidden", border: "var(--stroke-hairline) solid var(--border-default)" }}>
                  {preview ? (
                    /* key 를 좌표로 준다 — 값이 바뀌면 지도를 새로 만들어 중심이 따라간다.
                       시민용 셸에서는 절대 하면 안 되는 일이지만(U-CM-16 은 재로딩을 금지한다),
                       여기 지도는 폼 안의 보조 화면이고 중심이 곧 입력값이다 */
                    <KakaoMap key={`${preview.lat},${preview.lng}`} appKey={KAKAO_APP_KEY}
                      center={preview} anchorLabel={ed.draft.values.name || "QR 지점"} level={4} />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
                      justifyContent: "center", background: "var(--surface-sunken)",
                      fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>
                      위도와 경도를 입력하면 위치가 표시됩니다.
                    </div>
                  )}
                </div>
                <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
                  지도는 확인용입니다. 좌표는 숫자 칸에 직접 입력합니다.
                </p>
              </div>
            } />
        ) : null}
      </Modal>

      <ConfirmDialog open={!!ed.pending} name={ed.pending && ed.pending.name}
        title="지점을 삭제할까요?"
        description="지점을 삭제합니다. 안내판을 교체한 경우라면 삭제 대신 활성 여부를 끄세요 — 지우면 그 코드로 들어온 시민에게 「등록되지 않은 코드」로 안내됩니다."
        onClose={ed.cancelRemove} onConfirm={ed.confirmRemove} />

      <Notice tone="neutral" size="sm" style={{ marginTop: "var(--space-6)" }}>
        더미 데이터(점포 335곳 · 공공시설 18곳 · 모든 거리)가 둔전 시장 입구 한 지점을 기준으로
        계산되어 있어, 새 지점을 등록해도 그 지점으로 시민용 화면을 열어볼 수는 없습니다.
        실데이터 연동 후에 열립니다.
      </Notice>
    </>
  );
}

export default QrPoints;
