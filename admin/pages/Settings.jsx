import React from "react";
import {
  PageHeader, Card, Button, Badge, Notice, Modal, DataTable, FormGrid, FormField, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { OPERATION_FIELDS, validate } from "../data/fields.js";
import { OPERATION_DEFAULTS, OPERATION_FROM_CONFIG } from "../data/settings.js";
import { useSettings, readHistory } from "../data/store.js";

/* M15 설정 — 운영 설정 · 변경 이력.
 *
 * ── API 쿼터 구획이 빠졌다 (2026-08-20) ────────────────────────────────────
 * 하루 한도와 경고 임계치를 여기서 고칠 수 있었고 개발자 계정에만 보였다. 그 값은
 * 카카오 쪽 계약과 서버가 정하는 것이라 관리자 화면에서 손댈 자리가 아니고, 덕분에
 * 이 화면은 이제 **권한에 따라 모습이 갈리지 않는다** — 시청 담당자와 개발자가 같은
 * 화면을 본다. 오늘 사용량은 대시보드가 그대로 보여준다.
 *
 * ── 여기서 고쳐도 시민 화면은 바뀌지 않는다 ─────────────────────────────────
 * config.js 는 모듈 상수라 관리자가 밀어 넣을 수 없고, 애초에 두 화면이 다른 탭에서 뜬다.
 * 실연동 때는 이 값이 서버에 저장되고 시민 화면이 받아 쓴다. **그때까지 어느 값이
 * 이미 시민 화면에 연결되어 있고 어느 값이 아닌지**를 화면이 표시한다 —
 * 표시가 없으면 담당자는 줌을 바꿔놓고 시민 화면에서 확인하려다 시간을 쓴다.
 *
 * ── 변경 이력을 여기 둔다 (명세서 10장) ────────────────────────────────────
 * "모든 등록·수정·삭제에 변경 이력을 기록한다 (대상, 변경 필드, 주체, 일시)."
 * 별도 화면을 만들지 않은 것은 이력이 **보러 오는 화면이 아니라 확인하러 오는 화면**이기
 * 때문이다. 담당자가 이력을 찾는 때는 "누가 이걸 바꿨지"를 물을 때이고, 그 물음은
 * 대개 설정을 확인하러 온 김에 나온다. 내비에 열한 번째 항목을 더할 만한 무게가 아니다.
 */

function Section({ title, note, action, children }) {
  return (
    <Card style={{ marginBottom: "var(--space-6)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)",
        marginBottom: "var(--space-4)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
            font: "var(--type-title-3)", color: "var(--text-heading)", letterSpacing: "var(--ls-snug)" }}>
            {title}
          </h2>
          {note ? (
            <p style={{ marginTop: 4, fontSize: "var(--fs-label)", color: "var(--text-muted)", lineHeight: 1.55 }}>
              {note}
            </p>
          ) : null}
        </div>
        {action ? <div style={{ flex: "0 0 auto" }}>{action}</div> : null}
      </div>
      {children}
    </Card>
  );
}

/* 고를 수 있는 항목이면 저장값이 아니라 **보이는 이름**으로 적는다 (`straight` 가 아니라
   「직선거리 안내로 폴백」). 지금은 select 항목이 없지만, 값과 이름이 다른 항목이 하나라도
   생기면 확인 화면이 저장값을 그대로 보여주는 순간 무슨 말인지 알 수 없게 된다. */
function shownValue(f, v) {
  if (f.options) {
    const hit = f.options.find(o => String(o.value == null ? o : o.value) === String(v));
    if (hit) return hit.label == null ? String(v) : hit.label;
  }
  return v == null || v === "" ? EMPTY_MARK : String(v);
}

/* 읽기 상태의 값 한 칸. 입력칸 모양을 흉내내지 않는다 —
   못 고치는 입력칸은 고장으로 읽힌다 (FormGrid 의 readonly 주석과 같은 이유다). */
function ReadValue({ field, value }) {
  return (
    <div style={{ minHeight: 36, display: "flex", alignItems: "baseline", gap: 6,
      fontSize: "var(--fs-body-lg)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)",
      fontVariantNumeric: "tabular-nums" }}>
      {shownValue(field, value)}
      {field.unit ? (
        <span style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-regular)",
          color: "var(--text-muted)" }}>{field.unit}</span>
      ) : null}
    </div>
  );
}

/* 설정 한 벌 — **기본은 잠겨 있다** (2026-08-20).
 *
 * 전에는 화면을 열면 입력칸이 바로 서 있었고 [저장]을 눌러야 반영됐다. 저장을 눌러야 하는
 * 것과 **고칠 수 있는 상태로 열려 있는 것**은 다른 문제다 — 여기 있는 값은 시민 화면의
 * 목록 범위와 안내 문구를 바꾸는 값이라, 지나가다 숫자 한 칸이 바뀌어도 담당자는 그것을
 * 알아차릴 방법이 없다 (틀린 반경은 화면 어디에도 빨갛게 뜨지 않는다).
 *
 * 그래서 데이터 기준일 관리(M14)와 **같은 세 걸음**을 쓴다: 읽기 → [설정 수정] → [제출].
 * 제출은 바뀐 줄만 모아 「무엇이 무엇으로」를 보여주고 한 번 더 묻는다. 두 화면이 같은
 * 방식으로 움직여야 담당자가 "여기는 어떻게 저장하더라"를 화면마다 다시 익히지 않는다.
 */
function SettingsBlock({ fields, store, label, onToast, extra, tag }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(store.value);
  const [errors, setErrors] = React.useState({});
  const [asking, setAsking] = React.useState(null);   /* 제출 확인 — 바뀐 줄의 목록 */

  /* 저장값이 밖에서 바뀌면(데모 데이터 초기화) 따라가고, 고치던 중이었다면 그 상태도 끝낸다 */
  React.useEffect(() => { setDraft(store.value); setErrors({}); setEditing(false); setAsking(null); },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [JSON.stringify(store.value)]);

  const changes = fields
    .map(f => ({ field: f, from: store.value[f.key], to: draft[f.key] }))
    .filter(x => String(x.from == null ? "" : x.from) !== String(x.to == null ? "" : x.to));

  const startEdit = () => { setDraft(store.value); setErrors({}); setEditing(true); };
  const cancel = () => { setDraft(store.value); setErrors({}); setEditing(false); };

  const submit = () => {
    const bad = validate(fields, draft);
    if (Object.keys(bad).length) { setErrors(bad); onToast("입력 범위를 확인해 주세요."); return; }
    if (!changes.length) { setEditing(false); return; }   /* 고친 것이 없으면 조용히 닫는다 */
    setAsking(changes);
  };

  const confirmSubmit = () => {
    store.save(draft);
    setAsking(null);
    setEditing(false);
    setErrors({});
    onToast(`${label}을(를) 바꿨습니다.`);
  };

  const set = (key, value) => {
    setDraft(d => ({ ...d, [key]: value }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  return (
    <>
      <FormGrid columns={3} note={null}>
        {fields.map(f => (
          <FormField key={f.key} label={f.label} required={f.required}
            /* 범위(`500~5000`)는 고칠 때만 적는다 — 읽을 때는 지금 값이 답이다 */
            range={editing ? f.range : undefined}
            hint={tag ? tag(f) : f.hint} error={editing ? errors[f.key] : undefined}
            type={f.type} options={f.options} unit={f.unit} span={f.span}
            min={f.min} max={f.max} maxLength={f.maxLength}
            value={draft[f.key]} onChange={v => set(f.key, v)}>
            {editing ? undefined : <ReadValue field={f} value={store.value[f.key]} />}
          </FormField>
        ))}
      </FormGrid>

      {/* 긴 설명은 고르는 동안에만 세운다 */}
      {editing ? extra : null}

      <div style={{ marginTop: "var(--space-5)", display: "flex", gap: "var(--space-2)" }}>
        {editing ? (
          <>
            <Button variant="primary" size="sm" icon="check" onClick={submit}>제출</Button>
            <Button variant="ghost" size="sm" onClick={cancel}>취소</Button>
          </>
        ) : (
          <Button variant="outline" size="sm" icon="pencil" onClick={startEdit}>설정 수정</Button>
        )}
      </div>

      {/* 제출 확인 — 바뀐 줄만, 「무엇이 무엇으로」 */}
      <Modal open={!!asking} size="md" title={`${label}을(를) 바꿉니다`}
        description="아래 값이 시민용 화면의 안내 범위와 문구를 바꿉니다."
        onClose={() => setAsking(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAsking(null)}>취소</Button>
            <Button variant="primary" icon="check" onClick={confirmSubmit}>제출</Button>
          </>
        }>
        {asking ? (
          <ul style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {asking.map(x => (
              <li key={x.field.key} style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)",
                fontSize: "var(--fs-body)", color: "var(--text-body)" }}>
                <span style={{ minWidth: 170, fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>
                  {x.field.label}
                </span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-muted)",
                  textDecorationLine: "line-through" }}>
                  {shownValue(x.field, x.from)}{x.field.unit || ""}
                </span>
                <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>→</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: "var(--fw-bold)",
                  color: "var(--brand-primary)" }}>
                  {shownValue(x.field, x.to)}{x.field.unit || ""}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </Modal>
    </>
  );
}

export function Settings({ onToast }) {
  const ops = useSettings("operation", OPERATION_DEFAULTS, "운영 설정");
  const history = readHistory();

  return (
    <>
      <PageHeader title="환경 설정" note="시민용 화면에 적용되는 운영 값을 정합니다." />

      {/* 구획 배지에 명세서 절 번호(8-1 · 8-2 · 10장)를 달아 두었는데 뺐다
          (2026-08-20, 사용자 요청) — 화면을 쓰는 사람에게 그 번호는 아무것도 가리키지 않는다. */}
      <Section title="서비스 운영 설정"
        note="시민용 화면의 거리 임계값과 기본 줌입니다. 여기서 정한 값이 화면의 안내 문구와 목록 범위를 바꿉니다.">
        <SettingsBlock fields={OPERATION_FIELDS} store={ops} label="운영 설정" onToast={onToast}
          /* 어느 값이 이미 시민 화면에 연결되어 있는지 항목마다 적는다 */
          tag={f => (OPERATION_FROM_CONFIG.includes(f.key)
            ? `${f.hint ? `${f.hint} · ` : ""}지금 시민 화면이 쓰는 값입니다`
            : f.hint)}
          extra={
            <Notice tone="neutral" size="sm" style={{ marginTop: "var(--space-4)" }}>
              <b>위 두 거리는 역할이 다릅니다.</b> 안내 범위는 <b>목록에 담는</b> 선이고(도보 약 30분),
              배너 기준은 <b>「가깝다」고 말할 수 있는</b> 선입니다(도보 약 12~15분).
              1.4km 대피소는 목록에 나오되 「가까운 곳에 대피소가 없습니다」 배너와 함께 뜹니다.
              배너는 <b>안전시설(AED · 대피소 · 쉼터)에만</b> 붙습니다 — 근거가 긴급 상황의 접근성이라
              화장실에는 성립하지 않습니다. 시설 유형별 검색 상한은 두지 않고 안내 범위 하나로 4종을 처리합니다.
            </Notice>
          } />
      </Section>

      {/* API 쿼터 설정 구획을 뺐다 (2026-08-20, 사용자 요청). 하루 한도와 경고 임계치는
          카카오 쪽 계약과 서버가 정하는 값이라 화면에서 손댈 자리가 아니고, 담당자가
          이 화면에서 할 일도 아니었다 (개발자 계정에만 보이던 유일한 구획이기도 했다).
          오늘 얼마나 썼는지는 대시보드의 「카카오맵 API 일일 사용량」이 그대로 보여준다. */}

      {/* ── 변경 이력 ──────────────────────────────────────────────────── */}
      <Section title="변경 이력"
        note="이 브라우저 탭에서 일어난 등록·수정·삭제입니다. 실서비스에서는 서버가 영구 보관합니다.">
        <DataTable
          caption="변경 이력"
          rows={history.slice(0, 50)} rowKey={(r) => `${r.at}-${r.id}`}
          empty={{ title: "아직 고친 것이 없습니다.",
            description: "어느 화면에서든 저장·삭제하면 여기에 한 줄씩 쌓입니다." }}
          columns={[
            { key: "at", label: "일시", width: 170,
              render: r => String(r.at).replace("T", " ").slice(0, 19) },
            { key: "by", label: "주체", width: 150 },
            { key: "target", label: "대상", width: 120 },
            { key: "action", label: "동작", width: 96, align: "center",
              render: r => (
                <Badge size="sm" tone={r.action === "삭제" ? "danger" : r.action === "등록" ? "success" : "neutral"}>
                  {r.action}
                </Badge>
              ) },
            { key: "name", label: "항목" },
            { key: "fields", label: "변경 필드",
              render: r => ((r.fields || []).length ? r.fields.join(" · ") : EMPTY_MARK) },
          ]} />
        {history.length > 50 ? (
          <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
            최근 50건만 보여줍니다 (전체 {history.length}건 보관 중).
          </p>
        ) : null}
      </Section>
    </>
  );
}

export default Settings;
