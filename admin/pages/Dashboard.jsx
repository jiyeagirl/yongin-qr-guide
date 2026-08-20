import React from "react";
import {
  PageHeader, StatTile, MiniChart, DataTable, Cell, Card, Badge, Notice, SegmentedTabs,
  Select, CategoryIcon, CATEGORY_LABELS, OnnuriBadge,
} from "../../design-systems/admin.js";
import {
  PERIODS, DEFAULT_PERIOD, statsFor, TOTAL_SCANS, TAB_SHARE, FACILITY_SHARE,
  SCANS_BY_POINT, API_USED_TODAY,
} from "../data/stats.js";
import { REPORTS } from "../data/reports.js";
import { QR_POINTS } from "../../screens/main/data/qr.js";
import { STORES, discoverPicks, DISCOVER_PICK } from "../../screens/main/data/dunjeon.js";
import { DISTRICTS, CURRENT_DISTRICT_ID, GU_ORDER } from "../../screens/main/data/districts.js";
import { FACILITIES } from "../../screens/main/data/facilities.js";
import { QUOTA_DEFAULTS } from "../data/settings.js";
import { readCollection } from "../data/store.js";

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
 * ── 순위표 대신 시민 화면을 그대로 미리 본다 (2026-08-20) ───────────────────
 * 전에는 「조회수 상위 점포 10 · 조회수 상위 공공시설 10」 두 표가 있었다. 그런데 시민
 * 화면에는 그런 목록이 없다 — 둘러보기 탭이 실제로 보여주는 것은 상점가마다 「신규 매장
 * 6곳 · 인기 매장 6곳」이고, 공공시설에는 순위 화면 자체가 없다. 관리자만 보는 순위표는
 * 보고 나서 할 일이 없다: 3위 가게를 알아도 그 사실이 닿는 시민 화면이 없다.
 *
 * 지금은 **상점가를 고르면 그 상점가의 둘러보기 두 레일이 그대로 나온다.** 담당자가 보는
 * 여섯 곳이 시민이 보는 여섯 곳이고, 점포 관리에서 한 곳을 숨기면 여기서도 빠진다.
 * 뽑는 규칙은 시민 화면과 한 곳(`discoverPicks`)에서 가져온다.
 *
 * ── 수치의 출처를 아래에 적는다 ─────────────────────────────────────────────
 * 시민 화면이 하단 고지로 기준일을 밝히는 것과 같은 이유인데, 여기서는 더 중요하다 —
 * 이 숫자가 대외 보고로 나가기 때문이다. 어느 값이 실제 자료의 건수이고 어느 값이
 * 서버 연동 전 예시인지 구분되어야 한다.
 */

/* 절 제목. `variant` 는 **품는 절**과 **품긴 절**을 가른다 —
     lead  다른 절들을 안에 두는 절 (상점가별 둘러보기 매장). 한 단 크게 적는다
     sub   그 안에 든 절. 크기는 그대로 두고 제목 단계만 h3 으로 내린다
   둘이 같은 크기면 무엇이 무엇을 품는지가 화면에서 사라진다. */
function Section({ title, note, children, style, variant }) {
  const H = variant === "sub" ? "h3" : "h2";
  return (
    <section style={style}>
      <H style={{ marginBottom: note ? 2 : "var(--space-3)",
        font: variant === "lead" ? "var(--type-title-2)" : "var(--type-title-3)",
        color: "var(--text-heading)", letterSpacing: "var(--ls-snug)" }}>{title}</H>
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

/* 점포 한 줄. 업종 아이콘 · 상호명 · 지점명 · 온누리 — **시민 카드에 적히는 것과 같은 것들**이다.
   담당자가 두 화면을 나란히 놓고 "이 가게가 맞나"를 확인하는 자리라 표기가 갈리면 안 된다. */
function StoreName({ store }) {
  return (
    <Cell>
      <CategoryIcon type={store.cat} size={16} />
      <span style={{ fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>{store.name}</span>
      {store.branch ? <span style={{ color: "var(--text-muted)" }}>{store.branch}</span> : null}
      {store.onnuri ? <OnnuriBadge size="sm" /> : null}
    </Cell>
  );
}

export function Dashboard({ onNavigate }) {
  const [periodKey, setPeriodKey] = React.useState(DEFAULT_PERIOD);
  const s = statsFor(periodKey);
  const n = v => Number(v || 0).toLocaleString("ko-KR");

  /* 처리 대기 — 원본이 아니라 **덮개를 거친 지금 값**을 센다. 원본을 세면 검수 중에
     신고 하나를 처리해도 숫자가 그대로 남아, 눌러도 아무 일이 없는 배지가 된다 */
  const reports = readCollection("reports", REPORTS);
  const qr = readCollection("qr", QR_POINTS.map(p => ({ ...p, id: p.code })));
  const stores = readCollection("stores", STORES);
  const facilities = readCollection("facilities", FACILITIES);
  const districtRows = readCollection("districts", DISTRICTS);

  /* 기간 안에 새로 들어온 신고 (명세서 6장 요약 카드 넷째) */
  const newReports = reports.filter(r => r.at >= s.from && r.at <= s.to).length;

  /* 명세서 6장이 배지 셋을 적는다. 전에는 「매칭 검수 대기」가 넷째였는데 그 화면이
     개발 쪽으로 가면서 함께 빠졌다 — 누를 곳이 없는 배지는 숫자만 있고 할 일이 없다.

     「미처리 오류신고」도 뺐다 (2026-08-20, 사용자 요청). 같은 숫자가 **좌측 메뉴의
     [오류신고 관리] 옆에 늘 붙어 있고**, 그쪽은 어느 화면에 있든 보인다. 같은 수를 한
     화면에 두 번 적으면 둘이 다를 때(한쪽만 늦게 갱신될 때)를 의심하게 되고, 대시보드를
     떠나면 사라지는 쪽이 아니라 늘 보이는 쪽이 남는 것이 맞다.
     **명세서 6장은 이 배지를 셋으로 적고 있다** — 그 목록에서 하나를 뺀 것이라
     명세서를 고칠 때 함께 반영해야 한다 (숫자가 사라진 것이 아니라 자리를 옮긴 것이다). */
  const pending = [
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

  /* ── 상점가별 둘러보기 미리보기 ───────────────────────────────────────────
     씨앗 점포에는 `districtId` 가 없다. 둔전 소속으로 읽는 것은 상점가 관리와 같은
     규칙이다 (Districts.jsx) — 더미 세계의 점포 335곳이 전부 둔전 것이라서다. */
  const [districtId, setDistrictId] = React.useState(CURRENT_DISTRICT_ID);

  const storesByDistrict = React.useMemo(() => {
    const o = {};
    for (const s of stores) {
      const id = s.districtId || CURRENT_DISTRICT_ID;
      (o[id] = o[id] || []).push(s);
    }
    return o;
  }, [stores]);

  /* 고르는 차례는 거리순이 아니라 **구 → 이름**이다. 거리순(DISTRICTS 의 기본)은 시민
     화면의 축이고, 여기서 상점가를 찾는 사람은 QR 지점에서 몇 km 인지로 찾지 않는다.

     점포 자료가 없는 곳을 목록에서 빼지 않는다. 32곳이 다 있어야 어디가 비어 있는지
     보이고, 지금 31곳이 비어 있다는 사실 자체가 담당자가 알아야 할 상태다. */
  const districtOptions = React.useMemo(() =>
    [...districtRows]
      .sort((a, b) => GU_ORDER.indexOf(a.gu) - GU_ORDER.indexOf(b.gu)
        || a.name.localeCompare(b.name, "ko"))
      .map(d => {
        const cnt = (storesByDistrict[d.id] || []).filter(s => s.visible !== false).length;
        return { value: d.id, label: `${d.gu} · ${d.name} ${cnt ? `(점포 ${n(cnt)}곳)` : "(점포 자료 없음)"}` };
      }), [districtRows, storesByDistrict]);

  const district = districtRows.find(d => d.id === districtId) || null;
  const districtStores = storesByDistrict[districtId] || [];
  const picks = discoverPicks(districtStores);

  /* 한도와 경고 임계치는 화면에서 정하지 않는다 — 카카오 쪽 계약과 서버가 정하는 값이라
     관리자 화면의 [환경 설정]에서 쿼터 구획을 뺐다 (2026-08-20). 여기서는 읽기만 한다. */
  const limit = Number(QUOTA_DEFAULTS.dailyQuota) || 1;
  const warnAt = Number(QUOTA_DEFAULTS.warnThresholdPct) || 80;
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
             수치가 아니라 **할 일**이라 맨 위다. 0 건이면 아예 뜨지 않는다.

             할 일이 없을 때 「처리 대기 중인 일이 없습니다」 띠를 세우던 것도 뺐다
             (2026-08-20, 사용자 요청). 없는 일을 굳이 적으면 대시보드를 열 때마다
             통계보다 먼저 읽히는 줄이 하나 생기는데, 이 화면을 여는 이유는 수치를
             보려는 것이다. 할 일이 생기면 그때 배지가 서서 스스로를 알린다. */}
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
      ) : null}

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
          <Section title="탭별 조회 비중" note="QR 스캔 이후 처음으로 진입한 탭">
            <ShareList items={TAB_SHARE} />
          </Section>
        </Card>

        <Card>
          <Section title="시설 유형별 조회 비중" note="공공시설 탭에서 열어 본 시설의 유형">
            <ShareList items={FACILITY_SHARE} />
          </Section>
        </Card>
      </div>

      {/* ── 운영: 카카오맵 API 사용량 ───────────────────────────────────── */}
      <Card style={{ marginBottom: "var(--space-7)" }}>
        <Section title="카카오맵 API 일일 사용량"
          note={`길찾기 호출의 하루 한도 ${n(limit)}건 대비 사용량입니다.`}>
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
              「{QUOTA_DEFAULTS.fallbackOnExceed === "external" ? "외부 지도앱 연결" : "직선거리 안내"}」로 폴백합니다.
            </Notice>
          ) : null}
        </Section>
      </Card>

      {/* ── 상점가별 둘러보기 매장 (명세서 6장) ─────────────────────────
             시민 화면의 둘러보기 탭을 그대로 미리 보는 자리다. 머리말 참조. */}
      <Section title="상점가별 둘러보기 매장" variant="lead"
        note="둘러보기 탭에서 노출되는 상점가별 매장 목록을 확인할 수 있습니다. 상점가를 선택하면 사용자 화면에 노출되는 해당 상점가의 매장 정보를 확인할 수 있습니다."
        style={{ marginBottom: "var(--space-4)" }}>
        {/* 고르개 옆에 「처인구 포곡읍 · 노출 점포 335곳」을 적었었는데 뺐다 (2026-08-20) —
            고르개의 각 줄이 이미 「처인구 · 둔전골목형상점가 (점포 335곳)」이라 같은 말이
            바로 옆에서 두 번 읽혔다. */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Select label="상점가" options={districtOptions} value={districtId}
            onChange={e => setDistrictId(e.target.value)} style={{ width: 420 }} />
        </div>

        {picks.popular.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "var(--space-4)" }}>
            <Card>
              <Section title="조회수 상위 점포" variant="sub"
                note={`둘러보기 탭의 「인기 매장」 ${DISCOVER_PICK}곳`}>
                <DataTable
                  caption={`${district ? district.name : ""} 인기 매장 ${DISCOVER_PICK}곳`}
                  rows={picks.popular.map((s, i) => ({ ...s, rank: i + 1 }))} rowKey="id"
                  columns={[
                    /* 두 표는 **같은 뼈대**를 쓴다 — 번호 60 · 상호명 · 업종 110 · 값 90.
                       나란히 선 표라 열 폭이 어긋나면 여섯 줄이 서로 밀려 보인다 */
                    { key: "rank", label: "순위", width: 60, align: "center",
                      render: r => <Badge tone={r.rank === 1 ? "brand" : "neutral"} size="sm">{r.rank}</Badge> },
                    { key: "name", label: "상호명", render: r => <StoreName store={r} /> },
                    { key: "biz", label: "업종", width: 110, render: r => r.biz || CATEGORY_LABELS[r.cat] },
                    { key: "views", label: "조회", width: 90, align: "right",
                      render: r => <span style={{ fontVariantNumeric: "tabular-nums" }}>{n(r.views)}</span> },
                  ]} />
              </Section>
            </Card>

            <Card>
              <Section title="신규 점포" variant="sub"
                note={`둘러보기 탭의 「신규 매장」 ${DISCOVER_PICK}곳`}>
                <DataTable
                  caption={`${district ? district.name : ""} 신규 매장 ${DISCOVER_PICK}곳`}
                  rows={picks.fresh.map((s, i) => ({ ...s, order: i + 1 }))} rowKey="id"
                  columns={[
                    /* 옆 표와 같은 뼈대다. 번호 칸이 없으면 배지가 든 줄과 글자만 든 줄의
                       높이가 갈려 나란히 선 두 표의 여섯 줄이 서로 밀린다.

                       색은 배지 하나만 다르다 — 여기 1번은 **가장 최근에 등록된 곳**이지
                       1위가 아니다. 브랜드색을 주면 순위표로 읽힌다. */
                    { key: "order", label: "순서", width: 60, align: "center",
                      render: r => <Badge tone="neutral" size="sm">{r.order}</Badge> },
                    { key: "name", label: "상호명", render: r => <StoreName store={r} /> },
                    { key: "biz", label: "업종", width: 110, render: r => r.biz || CATEGORY_LABELS[r.cat] },
                    /* 열 이름이 「등록」이라 값은 연월만 적는다 ("2026.04").
                       카드 쪽은 이름표가 없어 "2026.04 등록"을 그대로 쓴다 (dunjeon.js) */
                    { key: "opened", label: "등록", width: 90, align: "right",
                      render: r => <span style={{ fontVariantNumeric: "tabular-nums" }}>{r.opened}</span> },
                  ]} />
              </Section>
            </Card>
          </div>
        ) : (
          /* 점포 자료가 없는 31곳. 빈 표를 세우는 대신 왜 비었는지 적는다 —
             시 안내의 점포수는 알고 있으므로 그 수도 함께 적어 "0곳"과 구별한다 */
          <Notice tone="info" title="점포 목록이 아직 들어오지 않았습니다">
            {district ? `${district.name}${district.stores ? `는 시 안내 기준 점포 ${n(district.stores)}곳이지만,` : "는"}` : ""}
            점포 목록이 아직 적재되지 않아 신규·인기 매장을 뽑을 수 없습니다.
            사용자 화면에서도 이 상점가에서는 두 레일이 나오지 않습니다.
          </Notice>
        )}
      </Section>

      <Section title="지점별 스캔 횟수">
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

      {/* 맨 아래 고지를 뺐다 (2026-08-20, 사용자 요청). 어느 수치가 서버 연동 전 예시이고
          어느 것이 실제 자료를 센 값인지 적어 두었던 다섯 줄이다. 그 구분이 필요한 것은
          **지금 검수하는 우리**이지 이 화면을 쓰는 담당자가 아니고, 서버가 붙으면 문단
          자체가 틀린 말이 된다. 화면 맨 위 띠가 「서버 연동 전」이라는 사실은 늘 적고 있다.
          어느 값이 예시인지는 admin/README.md 와 data/stats.js 머리말에 남아 있다. */}
    </>
  );
}

export default Dashboard;
