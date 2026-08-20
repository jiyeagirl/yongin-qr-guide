import React from "react";
import {
  PageHeader, StatTile, MiniChart, DataTable, Cell, Card, Badge, Notice, SegmentedTabs,
  FacilityIcon, FACILITY_LABELS, CategoryIcon, CATEGORY_LABELS,
} from "../../design-systems/admin.js";
import {
  PERIODS, DEFAULT_PERIOD, statsFor, TOTAL_SCANS, TAB_SHARE, FACILITY_SHARE,
  TOP_STORES, TOP_FACILITIES, SCANS_BY_POINT, API_USED_TODAY, TOP_N,
} from "../data/stats.js";
import { REPORTS, isOpen } from "../data/reports.js";
import { QR_POINTS } from "../../screens/main/data/qr.js";
import { STORES } from "../../screens/main/data/dunjeon.js";
import { FACILITIES } from "../../screens/main/data/facilities.js";
import { QUOTA_DEFAULTS } from "../data/settings.js";
import { readCollection, useSettings } from "../data/store.js";

/* M02 대시보드 (명세서 6장).
 *
 * ── 조회 전용이다 ───────────────────────────────────────────────────────────
 * 명세서: "조회 전용이며 내보내기 기능은 두지 않는다." 인기 점포 표에서 바로 수정으로
 * 들어가게 할 수도 있지만, 그러면 "인기 목록"이 점포 관리의 두 번째 입구가 되어 어느 쪽이
 * 진짜인지 흐려진다. **딱 하나 예외가 처리 대기 배지다** — 그것은 수치가 아니라 할 일이라
 * 눌러서 그 화면으로 간다.
 *
 * ── 기간이 기본 7일인 이유 ──────────────────────────────────────────────────
 * 오늘 하루는 표본이 너무 작아 요일 하나에 통째로 휘둘리고(주말이 평일의 1.6배다),
 * 30일은 최근 변화가 묻힌다. 명세서가 7일을 기본으로 둔 것과 같은 판단이다.
 *
 * ── 증감률이 무엇 대비인지 적는다 ───────────────────────────────────────────
 * "+18%" 만 있으면 누적이 그만큼 늘었다는 뜻으로 읽히는데, 실제로는 **직전 같은 기간**과
 * 견준 값이다. 최근 7일이면 그 앞 7일과 견준다. 카드 안에 그 말을 적어 둔다.
 *
 * ── 처리 대기 배지는 0 이면 뜨지 않는다 ─────────────────────────────────────
 * 명세서: "배지는 0건이 아닐 때만 노출하고 클릭 시 해당 화면으로 이동한다."
 * 없는 일에 표시를 붙이면 신호가 죽는다 — 늘 켜져 있는 빨간 점은 며칠 뒤 아무도 안 본다.
 *
 * ── 수치의 출처를 아래에 적는다 ─────────────────────────────────────────────
 * 시민 화면이 하단 고지로 기준일을 밝히는 것과 같은 이유인데, 여기서는 더 중요하다 —
 * 이 숫자가 대외 보고로 나가기 때문이다. 어느 값이 실제 자료의 건수이고 어느 값이
 * 서버 연동 전 예시인지 구분되어야 한다.
 */

function Section({ title, note, children, style }) {
  return (
    <section style={style}>
      <h2 style={{ marginBottom: note ? 2 : "var(--space-3)", font: "var(--type-title-3)",
        color: "var(--text-heading)", letterSpacing: "var(--ls-snug)" }}>{title}</h2>
      {note ? (
        <p style={{ marginBottom: "var(--space-3)", fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
          {note}
        </p>
      ) : null}
      {children}
    </section>
  );
}

/* 비중 막대. 탭 비중과 시설 유형 비중이 같은 모양이어야 둘을 나란히 읽을 수 있다 */
function ShareList({ items }) {
  return (
    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {items.map(t => (
        <li key={t.key}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)",
              color: "var(--text-heading)" }}>{t.label}</span>
            <span style={{ fontSize: "var(--fs-label)", color: "var(--text-body)",
              fontVariantNumeric: "tabular-nums" }}>{t.value}%</span>
          </div>
          {/* 막대는 장식이 아니라 비교 수단이다 — 숫자를 지우지 않고 함께 둔다 */}
          <div aria-hidden="true" style={{ height: 8, borderRadius: "var(--radius-pill)",
            background: "var(--surface-sunken)", overflow: "hidden" }}>
            <div style={{ width: `${t.value}%`, height: "100%", background: "var(--brand-primary)" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Dashboard({ onNavigate }) {
  const [periodKey, setPeriodKey] = React.useState(DEFAULT_PERIOD);
  const quota = useSettings("quota", QUOTA_DEFAULTS, "API 쿼터 설정");
  const s = statsFor(periodKey);
  const n = v => Number(v || 0).toLocaleString("ko-KR");

  /* 처리 대기 — 원본이 아니라 **덮개를 거친 지금 값**을 센다. 원본을 세면 검수 중에
     신고 하나를 처리해도 숫자가 그대로 남아, 눌러도 아무 일이 없는 배지가 된다 */
  const reports = readCollection("reports", REPORTS);
  const qr = readCollection("qr", QR_POINTS.map(p => ({ ...p, id: p.code })));
  const stores = readCollection("stores", STORES);
  const facilities = readCollection("facilities", FACILITIES);

  /* 기간 안에 새로 들어온 신고 (명세서 6장 요약 카드 넷째) */
  const newReports = reports.filter(r => r.at >= s.from && r.at <= s.to).length;

  /* 명세서 6장이 배지 셋을 적는다. 전에는 「매칭 검수 대기」가 넷째였는데 그 화면이
     개발 쪽으로 가면서 함께 빠졌다 — 누를 곳이 없는 배지는 숫자만 있고 할 일이 없다. */
  const pending = [
    { key: "reports", page: "reports", label: "미처리 오류신고", tone: "danger",
      count: reports.filter(isOpen).length },
    /* 설치 미완료 = 아직 안 붙었거나, 붙었는데 아직 안 켠 것. 둘 다 "열리지 않은 안내판"이다 */
    { key: "qr", page: "qr", label: "설치 미완료 QR", tone: "warning",
      count: qr.filter(p => p.installStatus !== "철거"
        && (p.installStatus !== "설치완료" || !p.active)).length },
    /* 좌표가 없으면 지도에 찍히지 않고 거리 계산도 안 된다. 자료가 온전하면 0 건이고,
       그때는 배지가 아예 뜨지 않는다 — 명세서가 "0건이 아닐 때만 노출"이라고 정했다. */
    { key: "coord", page: "stores", label: "좌표 누락 점포", tone: "warning",
      count: stores.filter(x => x.lat == null || x.lng == null).length
        + facilities.filter(x => x.lat == null || x.lng == null).length },
  ].filter(b => b.count > 0);

  const limit = Number(quota.value.dailyQuota) || 1;
  const warnAt = Number(quota.value.warnThresholdPct) || 80;
  const usedPct = Math.round(API_USED_TODAY / limit * 100);
  const overWarn = usedPct >= warnAt;

  return (
    <>
      <PageHeader title="대시보드"
        note={`${s.period.label} · ${s.from} ~ ${s.to} · 스캔 로그 기준`}
        action={
          <SegmentedTabs variant="pill"
            items={PERIODS.map(p => ({ id: p.key, label: p.label }))}
            value={periodKey} onChange={setPeriodKey} />
        } />

      {/* ── 처리 대기 배지 (명세서 6장) ─────────────────────────────────
             수치가 아니라 **할 일**이라 맨 위다. 0 건이면 아예 뜨지 않는다 */}
      {pending.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)",
          marginBottom: "var(--space-6)" }}>
          {pending.map(b => (
            <button key={b.key} type="button" onClick={() => onNavigate && onNavigate(b.page)}
              style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
                minHeight: "var(--tap-min)", padding: "0 var(--space-4)", cursor: "pointer",
                background: "var(--surface-card)", borderRadius: "var(--radius-pill)",
                border: `var(--stroke-hairline) solid var(--state-${b.tone})`,
                fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)",
                fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>
              {b.label}
              <Badge tone={b.tone} size="sm">{n(b.count)}</Badge>
            </button>
          ))}
        </div>
      ) : (
        <Notice tone="success" size="sm" style={{ marginBottom: "var(--space-6)" }}>
          처리 대기 중인 일이 없습니다.
        </Notice>
      )}

      {/* ── 요약 카드 4종 (명세서 6장) ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "var(--space-4)", marginBottom: "var(--space-7)" }}>
        <StatTile label="누적 QR 스캔" value={n(TOTAL_SCANS)} unit="회" icon="qr-code" tone="brand" />
        <StatTile label={`${s.period.label} 스캔`} value={n(s.scans)} unit="회" icon="scan-line"
          delta={s.delta == null ? undefined : `직전 ${s.period.label} 대비 ${s.delta > 0 ? "+" : ""}${s.delta}%`}
          deltaTone={s.delta > 0 ? "up" : s.delta < 0 ? "down" : "flat"} />
        <StatTile label={`${s.period.label} 길찾기 실행`} value={n(s.routes)} unit="회" icon="route" />
        <StatTile label={`${s.period.label} 신규 오류신고`} value={n(newReports)} unit="건" icon="inbox"
          tone={newReports ? "dark" : "plain"} />
      </div>

      {/* ── 차트 3종 ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)",
        gap: "var(--space-4)", marginBottom: "var(--space-7)" }}>
        <Card>
          <Section title="일별 스캔 추이">
            <MiniChart data={s.daily} type="bar" height={180}
              label={`${s.period.label} 일별 QR 스캔 수`} />
            <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-caption)",
              color: "var(--text-muted)", lineHeight: 1.55 }}>
              주말이 평일보다 높고, 둔전 골목축제일(10.17)에 크게 늘었습니다.
            </p>
          </Section>
        </Card>

        <Card>
          <Section title="탭별 조회 비중" note="스캔 뒤 처음 간 탭">
            <ShareList items={TAB_SHARE} />
          </Section>
        </Card>

        <Card>
          <Section title="시설 유형별 조회 비중" note="공공시설 탭 안에서">
            <ShareList items={FACILITY_SHARE} />
          </Section>
        </Card>
      </div>

      {/* ── 운영: 카카오맵 API 사용량 (명세서 6장) ──────────────────────── */}
      <Card style={{ marginBottom: "var(--space-7)" }}>
        <Section title="카카오맵 API 일일 사용량"
          note={`한도와 경고 임계치는 [설정 > API 쿼터]에서 정합니다 (지금 ${warnAt}% 초과 시 경고).`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
            marginBottom: 6 }}>
            <span style={{ fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)",
              color: overWarn ? "var(--state-danger)" : "var(--text-heading)" }}>
              {n(API_USED_TODAY)} / {n(limit)}건
            </span>
            <span style={{ fontSize: "var(--fs-label)", fontVariantNumeric: "tabular-nums",
              color: overWarn ? "var(--state-danger)" : "var(--text-muted)" }}>{usedPct}%</span>
          </div>
          <div aria-hidden="true" style={{ height: 10, borderRadius: "var(--radius-pill)",
            background: "var(--surface-sunken)", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, usedPct)}%`, height: "100%",
              background: overWarn ? "var(--state-danger)" : "var(--brand-primary)" }} />
          </div>
          {overWarn ? (
            <Notice tone="danger" size="sm" style={{ marginTop: "var(--space-3)" }}>
              경고 임계치({warnAt}%)를 넘었습니다. 한도를 넘기면 길찾기가
              「{quota.value.fallbackOnExceed === "external" ? "외부 지도앱 연결" : "직선거리 안내"}」로 폴백합니다.
            </Notice>
          ) : null}
        </Section>
      </Card>

      {/* ── 순위 3종, 각 상위 10 (명세서 6장) ───────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
        <Section title={`조회 상위 점포 ${TOP_N}`}>
          <DataTable
            caption={`조회수 상위 점포 ${TOP_N}곳`}
            rows={TOP_STORES} rowKey="id"
            columns={[
              { key: "rank", label: "순위", width: 60, align: "center",
                render: r => <Badge tone={r.rank === 1 ? "brand" : "neutral"} size="sm">{r.rank}</Badge> },
              { key: "name", label: "상호명",
                render: r => (
                  <Cell>
                    <CategoryIcon type={r.cat} size={16} />{r.name}
                  </Cell>
                ) },
              { key: "biz", label: "업종", render: r => r.biz || CATEGORY_LABELS[r.cat] },
              { key: "views", label: "조회", align: "right",
                render: r => <span style={{ fontVariantNumeric: "tabular-nums" }}>{n(r.views)}</span> },
            ]} />
        </Section>

        <Section title={`조회 상위 공공시설 ${TOP_N}`}>
          <DataTable
            caption={`조회수 상위 공공시설 ${TOP_N}곳`}
            rows={TOP_FACILITIES} rowKey="id"
            columns={[
              { key: "rank", label: "순위", width: 60, align: "center",
                render: r => <Badge tone={r.rank === 1 ? "brand" : "neutral"} size="sm">{r.rank}</Badge> },
              { key: "name", label: "명칭",
                render: r => (
                  <Cell>
                    <FacilityIcon type={r.type} size={16} />{r.name}
                  </Cell>
                ) },
              { key: "type", label: "유형", width: 90, render: r => FACILITY_LABELS[r.type] || "공공시설" },
              { key: "views", label: "조회", align: "right",
                render: r => <span style={{ fontVariantNumeric: "tabular-nums" }}>{n(r.views)}</span> },
            ]} />
        </Section>
      </div>

      <Section title="지점별 스캔"
        note="끈 지점에도 스캔이 남습니다 — 옛 안내판을 아직 찍는 사람이 있다는 뜻이라, 코드를 지우면 그 사람들이 「등록되지 않은 코드」를 만납니다.">
        <DataTable
          caption="QR 지점별 스캔 수"
          rows={SCANS_BY_POINT} rowKey="code"
          columns={[
            { key: "code", label: "QR 식별자", width: 190 },
            { key: "name", label: "지점명" },
            { key: "active", label: "활성", width: 90, align: "center",
              render: r => <Badge tone={r.active ? "success" : "neutral"} size="sm">{r.active ? "활성" : "비활성"}</Badge> },
            { key: "scans", label: "누적 스캔", width: 130, align: "right",
              render: r => <span style={{ fontVariantNumeric: "tabular-nums" }}>{n(r.scans)}</span> },
          ]} />
      </Section>

      <p style={{ marginTop: "var(--space-6)", fontSize: "var(--fs-caption)",
        color: "var(--text-muted)", lineHeight: 1.6 }}>
        스캔 수 · 길찾기 실행 수 · 조회 비중 · API 사용량은 서버 로그에서 나오는 값이라
        서버 연동 전 예시입니다. <b>처리 대기 배지와 오류신고 건수는 실제 자료를 센 값</b>이며,
        이 브라우저 탭에서 고친 내용이 바로 반영됩니다.
        이 화면은 조회 전용이며 내보내기 기능을 두지 않습니다 (명세서 6장).
      </p>
    </>
  );
}

export default Dashboard;
