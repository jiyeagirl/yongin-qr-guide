import React from "react";
import {
  AppBar, EmptyState, Button, Notice, SectionHeader, ListRow, OnnuriBadge, Icon,
} from "../../design-systems/index.js";
import { DISTRICTS } from "../main/data/districts.js";

/* S11 빈 상태 · 오류 · 잘못된 QR (U-CM-02).
 *
 * QR 을 찍었는데 그 코드로 지점을 만들 수 없을 때 나오는 화면이다. 세 갈래다.
 *
 *   unknown   표에 없는 코드      안내판이 손상됐거나 아직 등록 전
 *   inactive  표에 있으나 비활성   교체된 안내판 (새 안내판을 찍게 안내)
 *   error     조회 자체가 실패     망 문제 등 — 여기만 [다시 시도]가 있다
 *
 * 셋을 한 화면으로 두는 이유는 사용자가 할 일이 같기 때문이다 — **여기서 막히지 않게 하는 것**.
 * 다른 것은 왜 막혔는지 한 줄뿐이라 화면을 셋으로 나누면 같은 폴백을 세 번 만들게 된다.
 *
 * ── 폴백을 지도가 아니라 목록으로 둔 이유 (명세서와 다른 지점) ──────────────
 * 명세서 S11 행은 "전체 지도 폴백 진입"이라고 적고 있다. 여기서는 목록으로 냈다.
 *
 * 32개소를 한 화면에 담으려면 시 전역(약 25km)까지 줌아웃해야 하는데, 그 축척의 핀은
 * "용인시 어딘가"로만 읽힌다 — 2026-08-18 에 S04 둘러보기에서 지도를 걷어낸 것과 같은
 * 이유다. 게다가 이 화면에는 **QR 지점이 없다.** 지도의 "내 위치" 점을 찍을 좌표가 없고,
 * 임의의 중심에 점을 찍으면 없는 위치를 있다고 말하는 셈이 된다. 같은 이유로 이 목록에는
 * 거리를 적지 않는다 (DistrictRow 를 쓰지 않고 ListRow 로 직접 그리는 이유다 —
 * 그 컴포넌트는 거리 표기가 전제다).
 *
 * 구별로 묶어 그리므로 "우리 동네가 있나"를 훑는 데는 오히려 목록이 빠르다.
 * 지도 폴백이 필요하다고 판단되면 KakaoMap 에 앵커를 끄는 prop 을 먼저 만들어야 한다.
 */

const COPY = {
  unknown: {
    pose: "curious",
    title: "등록되지 않은 QR 코드입니다",
    desc: "안내판의 QR 이 손상되었거나 아직 등록 전일 수 있습니다. 안내판에 적힌 주소로 직접 접속하셔도 됩니다.",
  },
  inactive: {
    pose: "sorry",
    title: "지금은 쓰지 않는 안내판입니다",
    desc: "이 자리의 안내판은 새것으로 교체되었습니다. 가까이에 있는 새 안내판의 QR 을 찍어 주세요.",
  },
  error: {
    pose: "sorry",
    title: "정보를 불러오지 못했습니다",
    desc: "통신 상태를 확인한 뒤 다시 시도해 주세요.",
  },
};

/* 구 순서를 이름 가나다로 두지 않는다 — 처인구가 대상 32개소의 대부분이라 맨 앞이 맞다 */
const GU_ORDER = ["처인구", "기흥구", "수지구"];

export function EntryFallback({
  status = "unknown", code, point, onRetry, onPickDistrict,
  base = "../../design-systems/",
}) {
  const copy = COPY[status] || COPY.unknown;

  /* 목록에서 고른 상점가. 지금 갈 곳은 없다 — 상점가 상세는 별도 화면이 아니라 셸의 탭이고
     (확정 결정사항 6) 셸은 QR 지점이 있어야 선다. 그렇다고 아무 반응이 없으면 목록이 고장 난
     것으로 읽히므로, 가진 정보(구역·점포·온누리·축제)를 그 자리에서 펼쳐 보인다.
     이것만으로도 "우리 동네에 뭐가 있나"라는 이 화면의 질문에는 답이 된다. */
  const [picked, setPicked] = React.useState(null);
  const pick = d => {
    setPicked(prev => (prev && prev.id === d.id ? null : d));
    if (onPickDistrict) onPickDistrict(d);
  };

  const groups = React.useMemo(() => {
    const by = new Map();
    for (const d of DISTRICTS) {
      if (!by.has(d.gu)) by.set(d.gu, []);
      by.get(d.gu).push(d);
    }
    return [...by.entries()]
      .sort((a, b) => GU_ORDER.indexOf(a[0]) - GU_ORDER.indexOf(b[0]))
      .map(([gu, list]) => [gu, [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"))]);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "var(--screen-max)", height: "100%",
      margin: "0 auto", overflow: "hidden", background: "var(--surface-page)",
      display: "flex", flexDirection: "column" }}>

      {/* 뒤로가기가 없다 — 여기가 진입점이다. 되돌아갈 화면이 없는 자리에 버튼을 두면
          누른 사람이 서비스 밖으로 나간다 */}
      <AppBar title="용인시 위치안내" style={{ flex: "0 0 auto" }} />

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch" }}>

        <EmptyState pose={copy.pose} base={base} title={copy.title} description={copy.desc}
          action={status === "error" && onRetry
            ? <Button icon="rotate-ccw" onClick={onRetry}>다시 시도</Button>
            : null} />

        <div style={{ padding: "0 var(--gutter-screen) var(--space-9)",
          display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

          {/* 찍은 코드를 그대로 보여준다. 안내판 번호와 대조하거나 문의할 때 이것이 유일한 단서다.
              비활성 코드는 표에 이름이 남아 있으므로 어느 안내판이었는지까지 말해줄 수 있다. */}
          {code ? (
            <Notice tone={status === "error" ? "warning" : "info"} title="찍으신 QR">
              <span style={{ display: "block", fontFamily: "var(--font-mono, monospace)",
                wordBreak: "break-all" }}>{code}</span>
              {point && point.name
                ? <span style={{ display: "block", marginTop: 4 }}>{point.name}</span>
                : null}
            </Notice>
          ) : null}

          {/* 고른 곳의 요약. 목록 위에 고정해 둔다 — 목록 안에 끼워 넣으면
              32줄 중 어디가 펼쳐졌는지 찾느라 다시 스크롤하게 된다 */}
          {picked ? (
            <Notice tone="success" title={picked.name}>
              {picked.gu} {picked.area}
              <span style={{ display: "block", marginTop: 4 }}>
                점포 {picked.stores}곳 · 온누리 가맹 {picked.onnuri}곳
                {picked.festival ? <> · {picked.festival.name}</> : null}
              </span>
              <span style={{ display: "block", marginTop: "var(--space-2)", color: "var(--text-muted)" }}>
                이 상점가로 들어가려면 그곳 안내판의 QR 을 찍어 주세요.
              </span>
            </Notice>
          ) : null}

          {/* ── 폴백 (U-CM-02) ─────────────────────────────────────────────
                 막힌 채로 두지 않는다. 지금 어디인지 모르더라도 무엇이 있는지는 보여준다. */}
          <section>
            <SectionHeader title="용인시 골목형 상점가" note={`${DISTRICTS.length}곳`} />
            <p style={{ marginBottom: "var(--space-3)", fontSize: "var(--fs-caption)",
              color: "var(--text-muted)", lineHeight: 1.55 }}>
              QR 지점을 알 수 없어 거리 대신 구별로 정리했습니다.
            </p>

            {groups.map(([gu, list]) => (
              <div key={gu} style={{ marginBottom: "var(--space-5)" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
                  marginBottom: "var(--space-1)", fontSize: "var(--fs-label)",
                  fontWeight: "var(--fw-bold)", color: "var(--brand-primary-strong)" }}>
                  <Icon name="map-pin" size={16} />
                  {gu}
                  <span style={{ fontWeight: "var(--fw-regular)", color: "var(--text-muted)" }}>
                    {list.length}곳
                  </span>
                </h3>
                <div role="list">
                  {list.map((d, i) => (
                    <ListRow key={d.id}
                      divider={i < list.length - 1}
                      onClick={() => pick(d)}
                      style={picked && picked.id === d.id
                        ? { background: "var(--surface-brand-soft)", borderRadius: "var(--radius-sm)" }
                        : undefined}
                      icon={<Icon name="store" size={20} />}
                      title={d.name}
                      meta={<>
                        {d.area}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginLeft: 6 }}>
                          점포 {d.stores}곳
                          <OnnuriBadge size="sm" />
                          {d.onnuri}곳
                        </span>
                      </>} />
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* U-CM-07 · U-CM-08 */}
          <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
            상점가 지정 현황 2026.07 기준<br />
            안내 정보는 참고용입니다. 응급 상황에는 119 등 공식 채널로 연락해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

export default EntryFallback;
