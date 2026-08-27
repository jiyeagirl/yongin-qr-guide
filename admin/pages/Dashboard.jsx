import React from "react";
import {
  PageHeader, StatTile, MiniChart, DataTable, Cell, Card, Badge, Notice, SegmentedTabs,
  Select, CategoryIcon, CATEGORY_LABELS, OnnuriBadge,
} from "../../design-systems/admin.js";
/* 여기 `TAB_SHARE` 가 있었다 — 그 카드가 나가면서 함께 뺐다 (2026-08-24).
   `SCANS_BY_POINT` · `API_USED_TODAY` 도 2026-08-25 오후에 함께 나갔다 (아래 머리말).
   값 자체는 셋 다 stats.js 에 그대로 있다 */
import {
  PERIODS, DEFAULT_PERIOD, statsFor, TOTAL_SCANS, FACILITY_SHARE,
} from "../data/stats.js";
import { REPORTS } from "../data/reports.js";
/* `QR_POINTS` 를 여기서 읽었다 — 「설치 미완료 QR」 배지가 나가면서 함께 빠졌다
   (2026-08-24). 지점별 스캔 표가 쓰던 `SCANS_BY_POINT` 도 이제 없다 */
import { discoverPicks, DISCOVER_PICK } from "../../screens/main/data/dunjeon.js";
import { CURRENT_DISTRICT_ID, GU_ORDER } from "../../screens/main/data/districts.js";
import { STORE_ROWS, FACILITY_ROWS, DISTRICT_ROWS } from "../data/sources.js";
/* `QUOTA_DEFAULTS`(하루 한도 · 경고 임계치)를 읽었다 — API 사용량 카드와 함께 나갔다 */
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
 * 적을 때는 **견주는 기간의 이름을 그대로** 쓴다 — 「어제 대비」 · 「지난 7일 대비」 ·
 * 「지난 30일 대비」 (2026-08-25, 사용자 요청). 고른 기간 이름 앞에 「직전 」을 붙여
 * 지어내던 것을 걷어냈다: 그러면 「직전 오늘 대비」가 나오고, 「직전 최근 7일」은
 * 「최근」이 두 기간에 동시에 걸려 어느 쪽이 최근인지 흐려진다. 이름은 `PERIODS` 의
 * `vs` 가 갖는다 (`data/stats.js`).
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
  /* `qr` 컬렉션을 여기서 읽던 줄이 있었다 — 「설치 미완료 QR」 배지가 나가면서 함께
     빠졌다 (2026-08-24). 이 화면이 QR 지점에서 읽는 것은 이제 아래 지점별 스캔 표뿐이고,
     그쪽은 로그 통계(`SCANS_BY_POINT`)라 덮개를 거치지 않는다 */
  const stores = readCollection("stores", STORE_ROWS);
  const facilities = readCollection("facilities", FACILITY_ROWS);
  const districtRows = readCollection("districts", DISTRICT_ROWS);

  /* 기간 안에 새로 들어온 신고 (명세서 6장 요약 카드 넷째) */
  const newReports = reports.filter(r => r.at >= s.from && r.at <= s.to).length;

  /* 명세서 6장이 배지 셋을 적는다. 전에는 「매칭 검수 대기」가 넷째였는데 그 화면이
     개발 쪽으로 가면서 함께 빠졌다 — 누를 곳이 없는 배지는 숫자만 있고 할 일이 없다.

     「미처리 오류신고」도 뺐다 (2026-08-20, 사용자 요청). 같은 숫자가 **좌측 메뉴의
     [오류신고 관리] 옆에 늘 붙어 있고**, 그쪽은 어느 화면에 있든 보인다. 같은 수를 한
     화면에 두 번 적으면 둘이 다를 때(한쪽만 늦게 갱신될 때)를 의심하게 되고, 대시보드를
     떠나면 사라지는 쪽이 아니라 늘 보이는 쪽이 남는 것이 맞다.

     2026-08-24 에 「설치 미완료 QR」까지 빠져 **남은 배지는 「좌표 누락 점포」 하나다**
     (이유는 아래 삭제 자리에 적는다). 자료가 온전하면 그 하나도 0 이라, 이 줄은 대개
     아무것도 그리지 않는다 — 그게 맞는 모습이다. 명세서 6장이 "0건이 아닐 때만 노출"과
     "0건이라 배지가 하나도 없을 때 「처리 대기 없음」 같은 안내를 대신 세우지 않는다"를
     함께 정해 둔 것이 이 자리를 위해서다. */
  const pending = [
    /* ── 「설치 미완료 QR」이 여기 있었다 (2026-08-24 삭제, 사용자 요청) ──────────
       철거가 아니면서 설치완료가 아니거나 활성이 꺼진 지점을 세던 배지다. **그것은
       처리 대기가 아니라 정상 상태다** — 설치예정은 안내판이 아직 제작·부착 중이라는
       뜻이고(그 일은 이 화면 밖, 개발·제작 쪽이다), 설치완료인데 꺼둔 것은 열 준비가
       될 때까지 담당자가 **일부러** 꺼둔 것이다. 둘 다 지금 손대야 할 일이 아닌데
       배지는 「밀린 일 n건」이라고 말하고 있었다.

       0 이 되지도 않는다. 지점 셋 가운데 `qr-003`(설치완료 · 활성 꺼짐)이 늘 걸려
       「1」이 붙박이로 떠 있었다 — 그 지점은 S11-A 를 검수하려고 일부러 그렇게 둔 것이라
       끄면 검수할 화면이 없어진다. **없어지지 않는 배지는 읽히지 않고**, 옆의 「좌표 누락
       점포」가 진짜로 떴을 때 그것까지 같이 묻힌다.

       QR 지점의 설치 현황은 M12 가 통째로 맡는다. 거기에는 설치 상태 칩도 목록도 있고,
       설치완료인데 꺼진 조합에는 수정 창이 경고 상자까지 띄운다 (QrPoints.jsx). */
    /* 좌표가 없으면 지도에 찍히지 않고 거리 계산도 안 된다. 자료가 온전하면 0 건이고,
       그때는 배지가 아예 뜨지 않는다 — 명세서가 "0건이 아닐 때만 노출"이라고 정했다. */
    { key: "coord", page: "stores", label: "좌표 누락 점포", tone: "warning",
      count: stores.filter(x => x.lat == null || x.lng == null).length
        + facilities.filter(x => x.lat == null || x.lng == null).length },
  ].filter(b => b.count > 0);

  /* ── 상점가별 둘러보기 미리보기 ───────────────────────────────────────────
     씨앗 점포에는 `districtId` 가 없어 둔전 소속으로 읽는데, 그 기본값은 **표가 채워서
     준다** (2026-08-25, `data/sources.js`) — 전에는 이 화면과 상점가 관리가 같은 규칙을
     따로 적고 있었다. */
  const [districtId, setDistrictId] = React.useState(CURRENT_DISTRICT_ID);

  const storesByDistrict = React.useMemo(() => {
    const o = {};
    for (const s of stores) {
      (o[s.districtId] = o[s.districtId] || []).push(s);
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
        const cnt = (storesByDistrict[d.id] || []).filter(s => s.visible).length;
        /* ── 구와 이름 사이가 **줄표**다 (2026-08-26, 사용자 요청. 그전에는 가운뎃점) ──
           이 화면의 가운뎃점은 **나란한 두 값**을 잇는 부호다 (「음식 · 카페」, 「4~20자 ·
           영문 소문자+숫자」). 그런데 구와 상점가는 나란하지 않다 — 상점가가 그 구 **안에**
           있다. 「처인구 · 둔전골목형상점가」는 둘을 같은 자리에 놓아, 한 줄에서 어느 쪽이
           고르는 대상인지가 흐려진다. 줄표는 앞이 뒤를 한정하는 부호라 그 관계를 그대로
           적는다 — 「처인구 - 둔전골목형상점가 (점포 335곳)」. */
        return { value: d.id, label: `${d.gu} - ${d.name} ${cnt ? `(점포 ${n(cnt)}곳)` : "(점포 자료 없음)"}` };
      }), [districtRows, storesByDistrict]);

  const district = districtRows.find(d => d.id === districtId) || null;
  const districtStores = storesByDistrict[districtId] || [];
  const picks = discoverPicks(districtStores);

  /* API 사용량 막대가 쓰던 값 넷(한도 · 경고 임계치 · 사용률 · 초과 여부)이 여기 있었다
     (2026-08-25 오후 삭제 — 아래 그 자리의 주석) */

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
        {/* 견주는 기간의 이름은 **표가 갖는다** (`PERIODS` 의 `vs`, 2026-08-25) — 여기서
            「직전 」을 앞에 붙여 지어내던 것을 걷어냈다. 그 방식으로는 「직전 오늘 대비」가
            나오고, 「직전 최근 7일」은 「최근」이 두 기간에 걸린다 (그쪽 머리말) */}
        {/* **「QR」을 넣어 앞 카드와 이름을 맞춘다** (2026-08-26, 사용자 요청) — 왼쪽이
            「누적 QR 스캔」인데 이쪽만 「최근 7일 스캔」이었다. 같은 것을 기간만 달리 센
            수인데 이름이 갈리면 담당자는 **다른 것을 세는 두 카드**로 읽는다 (이 화면에
            스캔이라 부를 만한 다른 값이 없다는 것은 만든 쪽만 안다) */}
        <StatTile label={`${s.period.label} QR 스캔`} value={n(s.scans)} unit="회" icon="scan-line"
          delta={s.delta == null ? undefined : `${s.period.vs} 대비 ${s.delta > 0 ? "+" : ""}${s.delta}%`}
          deltaTone={s.delta > 0 ? "up" : s.delta < 0 ? "down" : "flat"} />
        <StatTile label={`${s.period.label} 길찾기 실행`} value={n(s.routes)} unit="회" icon="route" />
        <StatTile label={`${s.period.label} 신규 오류신고`} value={n(newReports)} unit="건" icon="inbox"
          tone={newReports ? "dark" : "plain"} />
      </div>

      {/* ── 차트 2종 ─────────────────────────────────────────────────────
             「탭별 조회 비중」이 여기 가운데 있었다 (2026-08-24 삭제, 사용자 요청).
             자세한 이유는 아래 삭제 자리의 주석에 적는다. 열이 셋에서 둘이 되므로
             일별 추이가 3분의 2를 쓴다 — 남은 칸을 시설 유형 카드로 늘리지 않는다.
             그 카드는 막대 넷짜리라 가로가 늘어도 알려주는 것이 늘지 않고, 추이 그래프는
             하루 막대가 넓어질수록 값이 읽힌다. */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
        gap: "var(--space-4)", marginBottom: "var(--space-7)" }}>
        <Card>
          <Section title="일별 스캔 추이">
            {/* 그래프 밑에 「주말이 평일보다 높고 축제일에 늘었습니다」 한 줄을 적어
                두었던 것을 뺐다 (2026-08-24, 사용자 요청). 막대에 값이 적히고 튄 날이
                눈에 보이는 이상 그 문장은 그래프를 소리 내어 읽는 것에 지나지 않았고,
                기간을 「오늘」이나 30일로 바꾸면 화면에 없는 날을 말하는 줄이 됐다. */}
            <MiniChart data={s.daily} type="bar" height={180}
              label={`${s.period.label} 일별 QR 스캔 수`} />
          </Section>
        </Card>

        {/* ── 「탭별 조회 비중」이 여기 있었다 (2026-08-24 삭제, 사용자 요청) ──────
               「QR 스캔 이후 처음으로 진입한 탭」을 상점가 46 · 공공시설 34 · 둘러보기 20
               으로 적던 카드다. **담당자가 그 수를 보고 할 수 있는 일이 없다** — 탭 셋은
               시민 화면의 고정 구조이고(하단 탭 3개), 비중이 어떻게 나오든 탭을 없애거나
               차례를 바꾸는 것은 관리자 화면의 권한이 아니다. 이 화면의 범위는 개별 건의
               조회·수정·등록과 오류신고 보정이다.

               옆의 「시설 유형별 조회 비중」은 남는다. 겉모습이 같은 ShareList 라 함께
               지울 것처럼 보이지만 성격이 다르다 — 화장실이 압도적인지 AED 가 실제로
               열리는지는 **안내판 문구와 등록 우선순위**를 바꾸고, 그 둘 다 담당자가
               이 화면에서 실제로 하는 일이다 (stats.js 의 FACILITY_SHARE 주석).

               자료(`TAB_SHARE`)는 stats.js 에 그대로 둔다 — 되살릴 자리가 생기면
               쓸 값이고, 지금 지우면 그때 다시 지어내야 한다. */}

        <Card>
          <Section title="시설 유형별 조회 비중" note="공공시설 탭에서 열어 본 시설의 유형">
            <ShareList items={FACILITY_SHARE} />
          </Section>
        </Card>
      </div>

      {/* ── 「카카오맵 API 일일 사용량」이 여기 있었다 (2026-08-25 오후 삭제, 사용자 요청) ──
             길찾기 호출의 하루 한도 대비 사용량을 막대와 퍼센트로 적고, 경고 임계치를
             넘으면 붉은 상자로 폴백 안내를 세우던 카드다.

             **보고 나서 담당자가 할 수 있는 일이 없다.** 한도는 카카오 쪽 계약과 서버가
             정하는 값이고(그래서 [환경 설정]의 쿼터 구획도 2026-08-20 에 나갔다), 사용량이
             한도에 다가가도 이 화면에서 늘리거나 아낄 방법이 없다 — 할 일은 개발 쪽에
             알리는 것뿐이다. [데이터 갱신 현황] 화면과 대시보드의 「탭별 조회 비중」이
             같은 기준으로 나갔다.

             값(`API_USED_TODAY` · `QUOTA_DEFAULTS`)은 stats.js · settings.js 에 그대로 둔다 —
             지금 지우면 되살릴 자리가 생겼을 때 다시 지어내야 한다. */}

      {/* ── 상점가별 둘러보기 매장 (명세서 6장) ─────────────────────────
             시민 화면의 둘러보기 탭을 그대로 미리 보는 자리다. 머리말 참조. */}
      <Section title="골목형 상점가별 둘러보기 매장" variant="lead"
        note="둘러보기 탭에서 노출되는 골목형 상점가별 매장 목록을 확인할 수 있습니다. 상점가를 선택하면 사용자 화면에 노출되는 해당 상점가의 매장 정보를 확인할 수 있습니다."
        style={{ marginBottom: "var(--space-4)" }}>
        {/* 고르개 옆에 「처인구 포곡읍 · 노출 점포 335곳」을 적었었는데 뺐다 (2026-08-20) —
            고르개의 각 줄이 이미 「처인구 - 둔전골목형상점가 (점포 335곳)」이라 같은 말이
            바로 옆에서 두 번 읽혔다. */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Select label="골목형 상점가" options={districtOptions} value={districtId}
            onChange={e => setDistrictId(e.target.value)} style={{ width: 420 }} />
        </div>

        {/* ── 「신규 점포」 표가 옆에 나란히 있었다 (2026-08-25 오후 삭제, 사용자 요청) ──
               둘러보기 탭의 「신규 매장」 여섯 곳을 등록 일자와 함께 적던 표다. 두 표가
               2열 격자로 서 있었는데, 하나가 나가면서 격자를 없애고 남은 표가 폭을
               다 쓴다 — 반쪽짜리 격자에 카드 하나만 남기면 그 옆의 빈자리가 무언가
               빠진 자리로 읽힌다.
               점포의 등록 일자는 점포 정보 관리에서 그 줄을 열면 그대로 있다. */}
        {picks.popular.length ? (
          /* ── 카드도 표도 다시 폭을 다 쓴다 (2026-08-27, 사용자 요청) ──────────────
             하루 전(2026-08-26)에 표를 내용 너비로 줄이고 카드를 함께 줄였던 자리다
             (`width: max-content`). **줄인 것이 답이 아니었다** — 화면 오른쪽 절반이
             통째로 비고, 그 빈자리는 표가 알맞게 선 것이 아니라 **무언가 빠진 자리**로
             읽힌다 (바로 위, 「신규 점포」 표를 뺄 때 격자를 함께 없앤 것과 같은 이야기가
             여기서는 반대로 걸린다).

             원인은 폭이 아니라 **열의 수**였다. 넷뿐이라 남는 자리를 상호명 열이 통째로
             먹었던 것이고, 그러면 길은 둘이다 — 자리를 없애거나(어제) **읽을 것을 채우거나**.
             이 표가 미리 보는 것은 시민 화면의 인기 매장 여섯 곳인데, 담당자가 「이 가게가
             맞나」를 확인하려면 이름 말고도 볼 것이 있다: **어느 업종이고 어디에 있는가**다
             (점포 정보 관리 목록이 그 둘을 열로 두는 이유와 같다). 그 둘을 더하면 열이
             여섯이 되고, 남는 자리는 상호명과 도로명주소가 나눠 갖는다. */
          <Card>
            <Section title="조회수 상위 점포" variant="sub"
                /* 「사용자 모바일 웹」을 앞에 세운다 (2026-08-25, 사용자 요청) — 「둘러보기 탭」은
                   관리자 화면에 없는 자리라, 그것만 적으면 이 화면 어딘가를 가리키는 말로 읽힌다 */
              note={`사용자 모바일 웹 '둘러보기' 탭의 '인기 매장' ${DISCOVER_PICK}곳`}>
              <DataTable
                caption={`${district ? district.name : ""} 인기 매장 ${DISCOVER_PICK}곳`}
                rows={picks.popular.map((s, i) => ({ ...s, rank: i + 1 }))} rowKey="id"
                columns={[
                  { key: "rank", label: "순위", width: 60, align: "center",
                    render: r => <Badge tone={r.rank === 1 ? "brand" : "neutral"} size="sm">{r.rank}</Badge> },
                  { key: "name", label: "상호명", render: r => <StoreName store={r} /> },
                  /* ── 「업종」이 **「상권업종중분류명」**이 됐다 (2026-08-27) ────────────
                     이 열이 그리던 값은 처음부터 중분류(`biz`)였는데, 옆에 대분류가 서면서
                     「업종」이라는 이름이 **어느 분류를 말하는지 답하지 못하게** 됐다 —
                     「음식」과 「한식」이 나란히 서 있고 머리글 하나만 「업종」이면 담당자는
                     둘 중 무엇이 그 이름의 값인지 매번 짐작한다. 점포 정보 관리 목록이
                     대·소분류를 원천 필드명 그대로 적는 것과 같다.
                     차례는 큰 것에서 작은 것으로 — 「음식 → 한식」이라야 한 눈에 읽힌다.
                     `cat` 으로 떨어지는 자리는 남겨 둔다: 원천에 중분류가 없는 점포가
                     들어오면 그 칸이 통째로 비고, 빈 칸은 「업종을 모르는 가게」로 읽힌다 */
                  /* ── 폭 150 → 200 (2026-08-27, 사용자 요청) ─────────────────────
                     **셋이 다닥다닥 붙어 보였다.** 값이 아니라 **머리글**이 그렇게 만들고
                     있었다: 「상권업종대분류명」은 여덟 자라 14px 굵은 글씨로 115px 남짓인데,
                     좌우 여백 16 씩을 빼면 150px 짜리 칸에 남는 자리가 **3px** 이다. 머리글이
                     칸을 꽉 채운 열 둘이 나란히 서고 그 옆에 「도로명주소」가 붙으니, 세 머리글
                     사이에 있는 것이 여백 32px 뿐이라 **한 줄로 이어진 글자 덩어리**로 읽힌다.
                     값(「음식」·「한식」)은 짧아서 처음부터 붙어 보일 일이 없었다.

                     200 은 머리글이 칸 안에서 **자기 폭만큼 숨 쉬는** 값이다(147 + 53).
                     열과 열 사이가 35px 에서 85px 이 되어 셋이 각각의 열로 갈린다.
                     늘어난 100px 은 상호명·도로명주소가 나눠 갖던 남는 자리에서 온다 —
                     그 둘은 애초에 넉넉해서 100px 을 내주어도 한 줄이 접히지 않는다. */
                  { key: "bizL", label: "상권업종대분류명", width: 200 },
                  { key: "biz", label: "상권업종중분류명", width: 200,
                    render: r => r.biz || CATEGORY_LABELS[r.cat] },
                  /* 폭을 정하지 않는다 — 상호명과 함께 남는 자리를 나눠 갖는 두 열이다.
                     `keep-all` 은 그래도 접히는 줄이 **띄어쓰기에서** 갈라지게 한다
                     (없으면 「에버랜드」와 「로」가 갈린다. 점포 목록의 같은 열과 같은 값) */
                  { key: "addr", label: "도로명주소",
                    render: r => <span style={{ wordBreak: "keep-all" }}>{r.addr}</span> },
                  /* 「조회」 → 「조회수」 (2026-08-27, 사용자 요청). 세는 값이라 이름에
                     단위가 붙어야 하고, 절 제목도 「**조회수** 상위 점포」다 */
                  { key: "views", label: "조회수", width: 90, align: "right",
                    render: r => <span style={{ fontVariantNumeric: "tabular-nums" }}>{n(r.views)}</span> },
                ]} />
            </Section>
          </Card>
        ) : (
          /* 점포 자료가 없는 31곳. 빈 표를 세우는 대신 왜 비었는지 적는다.

             **상점가 이름을 부르지 않는다** (2026-08-24) — 이 상자는 상점가 하나를 고른
             화면 안에 있고, 그 이름은 바로 위에 이미 서 있다. "이 상점가"로 받으면
             문장이 짧아지면서 정작 말하려는 것(적재 전이라는 사실)이 앞으로 나온다. */
          <Notice tone="info" title="점포 목록이 아직 들어오지 않았습니다">
            {district && district.stores
              /* 시 안내의 점포수는 알고 있으므로 그 수를 함께 적어 "0곳"과 구별한다 */
              ? `이 골목형 상점가는 시 안내 기준 점포 ${n(district.stores)}곳이 등록되어 있으나, 점포 목록 데이터가 아직 적재되지 않았습니다.`
              : "이 골목형 상점가는 점포 목록 데이터가 아직 적재되지 않았습니다."}
            <span style={{ display: "block", marginTop: 4 }}>
              이로 인해 사용자 화면의 신규 매장 / 인기 매장 리스트가 노출되지 않습니다.
            </span>
          </Notice>
        )}
      </Section>

      {/* ── 「지점별 스캔 횟수」 표가 여기 있었다 (2026-08-25 오후 삭제, 사용자 요청) ──
             QR 지점마다 식별자 · 지점명 · 활성 여부 · 누적 스캔을 적던 표다.

             **여기서 나오는 답이 이 화면의 권한 밖이다.** 어느 지점이 덜 찍히는지 알아도
             담당자가 할 수 있는 일은 안내판을 옮기거나 새로 붙이는 것인데, 그것은 화면이
             아니라 현장에서 하는 일이고 이 화면에는 그 일로 이어지는 자리가 없다. 맨 위
             요약 카드의 「누적 QR 스캔」이 규모를 말하고, 지점 자체를 다루는 일은 [QR 지점
             관리]가 맡는다.

             자료(`SCANS_BY_POINT`)는 stats.js 에 그대로 둔다. */}

      {/* 맨 아래 고지를 뺐다 (2026-08-20, 사용자 요청). 어느 수치가 서버 연동 전 예시이고
          어느 것이 실제 자료를 센 값인지 적어 두었던 다섯 줄이다. 그 구분이 필요한 것은
          **지금 검수하는 우리**이지 이 화면을 쓰는 담당자가 아니고, 서버가 붙으면 문단
          자체가 틀린 말이 된다. 화면 맨 위 띠가 「서버 연동 전」이라는 사실은 늘 적고 있다.
          어느 값이 예시인지는 admin/README.md 와 data/stats.js 머리말에 남아 있다. */}
    </>
  );
}

export default Dashboard;
