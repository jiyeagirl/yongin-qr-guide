import React from "react";
import { PageHeader, StatTile, MiniChart, DataTable, Card, Badge,
  FacilityIcon, FACILITY_LABELS } from "../../design-systems/admin.js";
import { DAILY_SCANS, TOTAL_SCANS, SCAN_DELTA, TAB_SHARE, TOP_STORES, TOP_FACILITIES } from "../data/stats.js";
import { DISTRICT } from "../../screens/main/data/dunjeon.js";
import { FACILITIES } from "../../screens/main/data/facilities.js";
import { OPEN_COUNT } from "../data/inquiries.js";

/* A-DB-01 대시보드.
 *
 * ── 무엇을 맨 위에 두는가 ───────────────────────────────────────────────────
 * 지표 카드 넷은 "이 서비스가 쓰이고 있나"에 답한다. 누적 스캔이 첫 자리인 이유는
 * 이 사업의 성과 지표가 그것이기 때문이고(제안서), 미처리 문의가 넷째 자리에 있는 이유는
 * 그것만이 **담당자가 오늘 해야 할 일**이라서다. 나머지 셋은 보고용 수치고 이것은 할 일이다.
 * 그래서 이 카드만 눌러서 넘어갈 수 있게 두었다.
 *
 * ── 그래프는 하나뿐이다 ─────────────────────────────────────────────────────
 * 30일 추이 하나. 시간대별·연령별 같은 것을 늘어놓을 수 있지만, 우리에게 그 자료가 없고
 * (비회원 서비스라 연령은 애초에 알 수 없다) 없는 자료의 자리를 만들어 두면 언젠가
 * 아무 숫자나 채워진다.
 *
 * ── 여기서 아무 것도 고치지 못한다 ──────────────────────────────────────────
 * 대시보드는 읽는 화면이다. 인기 점포 표에서 바로 수정으로 들어가게 할 수도 있지만,
 * 그러면 "인기 목록"이 점포 관리의 두 번째 입구가 되어 어느 쪽이 진짜인지 흐려진다.
 */

function Section({ title, children, style }) {
  return (
    <section style={style}>
      <h2 style={{ marginBottom: "var(--space-3)", font: "var(--type-title-3)",
        color: "var(--text-heading)", letterSpacing: "var(--ls-snug)" }}>{title}</h2>
      {children}
    </section>
  );
}

export function Dashboard() {
  const n = (v) => v.toLocaleString("ko-KR");

  return (
    <>
      <PageHeader title="대시보드"
        note={`최근 30일 · ${DAILY_SCANS[0].label} ~ ${DAILY_SCANS[DAILY_SCANS.length - 1].label} · 스캔 로그 기준`} />

      {/* ── 지표 4종 ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "var(--space-4)", marginBottom: "var(--space-7)" }}>
        {/* 증감이 무엇 대비인지 줄에 적는다. "+353%" 만 있으면 누적이 그만큼 늘었다는 뜻으로
             읽히는데, 실제로는 어제 하루와 오늘 하루를 견준 값이다 (오늘이 축제일이라 크게 튄다).
             색은 방향을 거들 뿐이라 deltaTone 을 함께 넘긴다 */}
        <StatTile label="누적 QR 스캔" value={n(TOTAL_SCANS)} unit="회" icon="qr-code" tone="brand"
          delta={SCAN_DELTA ? `어제 대비 ${SCAN_DELTA > 0 ? "+" : ""}${SCAN_DELTA}%` : undefined}
          deltaTone={SCAN_DELTA > 0 ? "up" : SCAN_DELTA < 0 ? "down" : "flat"} />
        <StatTile label="등록 점포" value={n(DISTRICT.stores)} unit="곳" icon="shopping-bag" />
        <StatTile label="등록 공공시설" value={n(FACILITIES.length)} unit="곳" icon="life-buoy" />
        <StatTile label="미처리 문의" value={n(OPEN_COUNT)} unit="건" icon="inbox"
          tone={OPEN_COUNT ? "dark" : "plain"} />
      </div>

      {/* ── 일별 추이 + 탭 비중 ───────────────────────────────────────────
             그래프와 비중을 나란히 두는 이유: "얼마나 왔나"와 "와서 무엇을 봤나"는
             같은 질문의 앞뒤다. 위아래로 쌓으면 아래쪽이 첫 화면 밖으로 나간다. */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
        gap: "var(--space-4)", marginBottom: "var(--space-7)" }}>
        <Card>
          <Section title="일별 스캔 추이">
            <MiniChart data={DAILY_SCANS} type="bar" height={180} label="최근 30일 일별 QR 스캔 수" />
            <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-caption)",
              color: "var(--text-muted)", lineHeight: 1.55 }}>
              주말이 평일보다 높고, 둔전 골목축제일(10.17)에 크게 늘었습니다.
            </p>
          </Section>
        </Card>

        <Card>
          <Section title="스캔 후 이동한 탭">
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {TAB_SHARE.map(t => (
                <li key={t.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    marginBottom: 6 }}>
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
          </Section>
        </Card>
      </div>

      {/* ── 인기 상위 ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--space-4)" }}>
        <Section title="조회 상위 점포">
          <DataTable
            caption="조회수 상위 점포 5곳"
            rows={TOP_STORES} rowKey="id"
            columns={[
              { key: "rank", label: "순위", width: 60, align: "center",
                render: r => <Badge tone={r.rank === 1 ? "brand" : "neutral"} size="sm">{r.rank}</Badge> },
              { key: "name", label: "상호명" },
              { key: "biz", label: "업종" },
              { key: "views", label: "조회", align: "right",
                render: r => <span style={{ fontVariantNumeric: "tabular-nums" }}>{n(r.views)}</span> },
            ]} />
        </Section>

        <Section title="조회 상위 공공시설">
          <DataTable
            caption="조회수 상위 공공시설 5곳"
            rows={TOP_FACILITIES} rowKey="id"
            columns={[
              { key: "rank", label: "순위", width: 60, align: "center",
                render: r => <Badge tone={r.rank === 1 ? "brand" : "neutral"} size="sm">{r.rank}</Badge> },
              { key: "name", label: "명칭",
                render: r => (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <FacilityIcon type={r.type} size={16} />{r.name}
                  </span>
                ) },
              { key: "type", label: "유형", render: r => FACILITY_LABELS[r.type] || "공공시설" },
              { key: "views", label: "조회", align: "right",
                render: r => <span style={{ fontVariantNumeric: "tabular-nums" }}>{n(r.views)}</span> },
            ]} />
        </Section>
      </div>

      {/* 수치의 출처를 적는다. 시민 화면이 하단 고지로 기준일을 밝히는 것과 같은 이유인데,
           여기서는 더 중요하다 — 이 숫자가 대외 보고로 나가기 때문이다 */}
      <p style={{ marginTop: "var(--space-6)", fontSize: "var(--fs-caption)",
        color: "var(--text-muted)", lineHeight: 1.6 }}>
        스캔 수와 조회 비중은 서버 연동 전 예시 값입니다. 등록 점포·공공시설 수는 실제 등록 자료의 건수입니다.
      </p>
    </>
  );
}

export default Dashboard;
