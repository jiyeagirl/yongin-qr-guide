import React from "react";
import {
  PageHeader, Card, Button, Badge, Notice, DataTable, FormGrid, FormField, EMPTY_MARK,
} from "../../design-systems/admin.js";
import { OPERATION_FIELDS, QUOTA_FIELDS, validate } from "../data/fields.js";
import { OPERATION_DEFAULTS, QUOTA_DEFAULTS, OPERATION_FROM_CONFIG } from "../data/settings.js";
import { canQuota } from "../data/account.js";
import { useSettings, readHistory } from "../data/store.js";
import { API_USED_TODAY } from "../data/stats.js";

/* M15 설정 (명세서 8장) — 운영 설정 · API 쿼터 · 변경 이력.
 *
 * ── 한 화면인데 권한이 둘이다 ───────────────────────────────────────────────
 * 8-1 운영 설정은 시청 담당자의 일이고, 8-2 API 쿼터는 **개발자 전용**이다 (명세서 9장).
 * 화면 단위로 나누면 시청 담당자에게 [설정]이 아예 안 보이는데, 그건 틀렸다 —
 * 임계 거리와 신규 매장 판정 기간은 서비스 운영의 핵심 값이고 그것을 정하는 사람이 시청이다.
 * 그래서 화면은 열되 **쿼터 구획만 구획째 사라진다.**
 *
 * 쿼터가 개발자 전용인 이유는 권한의 크기가 아니라 **잘못 건드렸을 때 벌어지는 일**이다 —
 * 한도를 잘못 올리면 비용이 나가고, 잘못 내리면 길찾기가 하루 종일 폴백으로 돈다.
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

function Section({ title, badge, note, action, children }) {
  return (
    <Card style={{ marginBottom: "var(--space-6)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)",
        marginBottom: "var(--space-4)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
            font: "var(--type-title-3)", color: "var(--text-heading)", letterSpacing: "var(--ls-snug)" }}>
            {title}{badge}
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

/* 설정 한 벌을 편집하는 공통 껍데기. 두 구획이 같은 방식으로 동작해야
   담당자가 "여기는 자동 저장인가"를 두 번 묻지 않는다 — 둘 다 [저장]을 눌러야 반영된다. */
function SettingsBlock({ fields, store, label, onToast, extra, tag }) {
  const [draft, setDraft] = React.useState(store.value);
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => { setDraft(store.value); setErrors({}); },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [JSON.stringify(store.value)]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(store.value);

  const save = () => {
    const bad = validate(fields, draft);
    if (Object.keys(bad).length) { setErrors(bad); onToast("입력 범위를 확인해 주세요."); return; }
    store.save(draft);
    setErrors({});
    onToast(`${label}을(를) 저장했습니다.`);
  };

  const set = (key, value) => {
    setDraft(d => ({ ...d, [key]: value }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  return (
    <>
      <FormGrid columns={3} note={null}>
        {fields.map(f => (
          <FormField key={f.key} label={f.label} required={f.required} range={f.range}
            hint={tag ? tag(f) : f.hint} error={errors[f.key]}
            type={f.type} options={f.options} unit={f.unit} span={f.span}
            min={f.min} max={f.max} maxLength={f.maxLength}
            value={draft[f.key]} onChange={v => set(f.key, v)} />
        ))}
      </FormGrid>
      {extra}
      <div style={{ marginTop: "var(--space-5)", display: "flex", gap: "var(--space-2)" }}>
        <Button variant="primary" icon="check" onClick={save} disabled={!dirty}>
          {dirty ? "저장" : "저장됨"}
        </Button>
        {dirty ? (
          <Button variant="ghost" onClick={() => { setDraft(store.value); setErrors({}); }}>되돌리기</Button>
        ) : null}
      </div>
    </>
  );
}

export function Settings({ account, onToast }) {
  const ops = useSettings("operation", OPERATION_DEFAULTS, "운영 설정");
  const quota = useSettings("quota", QUOTA_DEFAULTS, "API 쿼터 설정");
  const history = readHistory();

  const usedPct = Math.round(API_USED_TODAY / (Number(quota.value.dailyQuota) || 1) * 100);
  const overWarn = usedPct >= Number(quota.value.warnThresholdPct || 80);

  return (
    <>
      <PageHeader title="설정"
        note="서비스 운영 값과 API 쿼터. 입력 항목은 명세서 8장을 따릅니다." />

      <Section title="서비스 운영 설정"
        badge={<Badge tone="neutral" size="sm">8-1</Badge>}
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
              화장실에는 성립하지 않습니다. 시설 유형별 검색 상한은 두지 않고 안내 범위 하나로 4종을 처리합니다 (명세서 8-1).
            </Notice>
          } />
      </Section>

      {/* ── 8-2 API 쿼터 — 개발자 전용 (명세서 9장) ────────────────────── */}
      {canQuota(account) ? (
        <Section title="API 쿼터 설정"
          badge={<Badge tone="warning" size="sm">8-2 · 개발자 전용</Badge>}
          note="카카오맵 길찾기 호출의 하루 한도입니다. 잘못 올리면 비용이 나가고, 잘못 내리면 길찾기가 하루 종일 폴백으로 돕니다.">
          <SettingsBlock fields={QUOTA_FIELDS} store={quota} label="API 쿼터 설정" onToast={onToast}
            extra={
              <div style={{ marginTop: "var(--space-5)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
                  marginBottom: 6 }}>
                  <span style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)",
                    color: "var(--text-heading)" }}>오늘 사용량</span>
                  <span style={{ fontSize: "var(--fs-label)", fontVariantNumeric: "tabular-nums",
                    color: overWarn ? "var(--state-danger)" : "var(--text-body)" }}>
                    {API_USED_TODAY.toLocaleString("ko-KR")} / {Number(quota.value.dailyQuota).toLocaleString("ko-KR")}건 ({usedPct}%)
                  </span>
                </div>
                <div aria-hidden="true" style={{ height: 8, borderRadius: "var(--radius-pill)",
                  background: "var(--surface-sunken)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, usedPct)}%`, height: "100%",
                    background: overWarn ? "var(--state-danger)" : "var(--brand-primary)" }} />
                </div>
              </div>
            } />
        </Section>
      ) : (
        <Notice tone="neutral" size="sm" style={{ marginBottom: "var(--space-6)" }}>
          API 쿼터 설정(8-2)은 개발자 계정만 볼 수 있습니다. 잘못 건드리면 비용이 발생하거나
          길찾기가 멈추는 항목이라 분리했습니다 (명세서 9장). 8-1 운영 설정은 시청 담당자의 일이라
          이 화면 자체는 열려 있습니다.
        </Notice>
      )}

      {/* ── 변경 이력 (명세서 10장) ─────────────────────────────────────── */}
      <Section title="변경 이력"
        badge={<Badge tone="neutral" size="sm">10장</Badge>}
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
