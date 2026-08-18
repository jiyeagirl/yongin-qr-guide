import React from "react";
import {
  DetailPage, DetailBody, DetailNotice, KakaoMap, Button, Badge, Icon,
  CategoryIcon, CATEGORY_LABELS, OnnuriBadge, SectionHeader,
} from "../../design-systems/index.js";
import { KAKAO_APP_KEY, WALK_M_PER_MIN } from "../main/config.js";

/* S08 골목 한바퀴 코스 상세 (기능명세서 v1.0 4장 S08 행).
 * 관련 기능: U-DC-03(골목 한바퀴 추천 코스) · U-CM-07 · U-CM-08
 *
 *   [AppBar]  ← 뒤로 · 코스명
 *   ─────────────────────────────────
 *   코스 지도 — 순번 핀 + 점선 경로        ← QR 지점에서 출발한다
 *   도보 n분 · n곳 · 약 nnn m
 *   ─────────────────────────────────
 *   1  가게  업종 · 거리                  ← 누르면 지도가 그 순번으로 이동
 *   2  가게                                  (U-DC-03 "순번 이동")
 *   ...
 *   ─────────────────────────────────
 *   기준일자 · 참고용 고지 · 119
 *
 * ── 지도를 여기서 새로 만드는 이유 ──────────────────────────────────────
 * 셸의 지도는 세 탭이 공유하는 한 개뿐이고 U-CM-16 이 그것의 재로딩을 막는다.
 * 이 화면은 탭이 아니라 그 위에 덮이는 페이지이고, 보여줄 것도 다르다 —
 * 탭 지도는 "QR 지점 주변에 무엇이 있나", 이 지도는 "이 네 곳을 어떤 순서로 도나".
 * 두 목적을 한 인스턴스에 겹치면 오버레이를 닫을 때 탭 지도의 카메라와 레이어를
 * 원래대로 되돌리는 일이 남는다. SDK 는 이미 로드되어 있어 인스턴스 하나가 더 붙는
 * 비용은 크지 않다.
 *
 * ── 화면에 적지 않는 것 ─────────────────────────────────────────────────
 * "반경 300~500m". 명세서 U-DC-03 이 "300~500m는 내부 로직 값이며 사용자 필터가 아니다"
 * 라고 못박았다. 사용자가 읽어야 할 것은 몇 분 걸리고 어디를 도는가다.
 */
export function CourseDetail({ course, anchor, asOf, onBack, onPickStore, onReport }) {
  const c = course;
  const stops = c.stops || [];

  /* 지도와 목록이 같은 "지금 보고 있는 곳"을 공유한다. 목록에서 누르면 지도가 옮겨가고,
     지도의 순번 핀을 눌러도 같은 상태가 바뀐다 (U-DC-03 "순번 이동"). */
  const [activeId, setActiveId] = React.useState(stops.length ? stops[0].id : null);
  const mapApi = React.useRef(null);

  const active = stops.find(s => s.id === activeId) || null;
  const activeIndex = stops.findIndex(s => s.id === activeId);

  /* 처음 열렸을 때는 코스 전체가 한눈에 들어와야 한다. 첫 지점으로 확대해 들어가면
     "네 곳을 도는 코스"라는 것이 지도에서 읽히지 않는다. QR 지점까지 함께 담는다 —
     출발점이 화면 밖이면 점선이 어디서 오는지 알 수 없다. */
  const fitAll = React.useCallback(() => {
    if (mapApi.current) mapApi.current.fitTo([anchor, ...stops], { top: 24, bottom: 24 });
  }, [anchor, stops]);

  const goTo = React.useCallback(id => {
    setActiveId(id);
    const s = stops.find(x => x.id === id);
    if (s && mapApi.current) mapApi.current.focus(s.lat, s.lng);
  }, [stops]);

  const step = dir => {
    if (!stops.length) return;
    const next = (activeIndex + dir + stops.length) % stops.length;
    goTo(stops[next].id);
  };

  return (
    <DetailPage title={c.name} onBack={onBack}
      /* 주 행동이 "이 코스로 길찾기"가 아닌 이유: 도착지가 하나가 아니라 넷이다.
         도보 경로 API 는 출발-도착 한 쌍을 받으므로(U-NV-01) 코스 전체를 한 번에
         넘길 수 없다. 각 가게에서 길찾기로 들어가는 것이 맞고, 여기서는 순번을 옮긴다. */
      footer={
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Button variant="outline" size="lg" icon="chevron-left" aria-label="이전 순번"
            onClick={() => step(-1)} style={{ flex: "0 0 auto", paddingLeft: 14, paddingRight: 14 }} />
          <Button variant="primary" size="lg" block onClick={() => active && onPickStore(active)}
            style={{ flex: 1, minWidth: 0 }}>
            {active ? `${activeIndex + 1}. ${active.name} 보기` : "가게 보기"}
          </Button>
          <Button variant="outline" size="lg" icon="chevron-right" aria-label="다음 순번"
            onClick={() => step(1)} style={{ flex: "0 0 auto", paddingLeft: 14, paddingRight: 14 }} />
        </div>
      }>

      <DetailBody style={{ paddingTop: 0 }}>
        {/* ── 코스 지도 ──────────────────────────────────────────────────
               고정 px 높이 대신 가로 비율로 잡는다. 화면 폭이 달라도 비율이 유지되고,
               2차 글자 확대에도 지도는 글자가 아니라 그림이라 영향을 받지 않는다.
               position:relative 가 필요하다 — KakaoMap 의 뿌리가 absolute inset:0 이다. */}
        <div style={{ position: "relative", width: "auto", aspectRatio: "4 / 3", maxHeight: "46vh",
          margin: "0 calc(var(--gutter-screen) * -1)",
          borderBottom: "var(--stroke-hairline) solid var(--border-default)" }}>
          <KakaoMap
            appKey={KAKAO_APP_KEY}
            center={anchor}
            anchorLabel={anchor.name}
            level={3}
            course={stops}
            selectedId={activeId}
            mapRef={mapApi}
            onReady={fitAll}
            onSelectCourseStop={s => goTo(s.id)} />
        </div>

        {/* ── 요약 ────────────────────────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "var(--space-2)" }}>
            <Badge tone="brand" dot>도보 {c.minutes}분</Badge>
            <Badge tone="neutral">{stops.length}곳</Badge>
            <Badge tone="neutral">약 {c.meters >= 1000 ? `${(c.meters / 1000).toFixed(1)}km` : `${c.meters}m`}</Badge>
          </div>
          <p style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: "var(--lh-body)",
            wordBreak: "keep-all" }}>{c.desc}</p>
          <p style={{ marginTop: 4, fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.5 }}>
            QR 지점에서 출발해 순서대로 도는 기준입니다. 지도의 점선은 실제 도보 경로가 아니라
            들르는 순서를 이은 선입니다.
          </p>
        </div>

        {/* ── 순번 목록 (U-DC-03 "순번 이동") ────────────────────────────
               고른 곳을 배경으로 표시한다 — 지도의 커진 핀과 목록의 강조가 같은 곳을
               가리켜야 "순번 이동"이 하나의 동작으로 읽힌다. */}
        <section>
          <SectionHeader title="들르는 곳" note={`${stops.length}곳 · 순서대로`} />
          <div role="list">
            {stops.map((s, i) => {
              const on = s.id === activeId;
              const walk = Math.max(1, Math.round(s.dist / WALK_M_PER_MIN));
              return (
                <div key={s.id} role="listitem" onClick={() => goTo(s.id)}
                  style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)",
                    minHeight: "var(--tap-comfortable)", padding: "var(--space-3)",
                    marginBottom: "var(--space-1)", cursor: "pointer",
                    borderRadius: "var(--radius-sm)",
                    background: on ? "var(--brand-primary-soft)" : "transparent",
                    border: "var(--stroke-hairline) solid " + (on ? "var(--border-brand)" : "transparent") }}>

                  {/* 순번 — 지도 핀과 같은 숫자, 같은 색 */}
                  <span style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 26, minHeight: 26, borderRadius: 999,
                    background: on ? "var(--brand-primary)" : "var(--brand-primary-soft)",
                    color: on ? "var(--text-on-brand)" : "var(--yong-green-800)",
                    fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-bold)" }}>
                    {i + 1}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                      <CategoryIcon type={s.cat} size={18} style={{ color: "var(--text-muted)" }} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)",
                        fontWeight: "var(--fw-semibold)", color: "var(--text-heading)", lineHeight: 1.4 }}>{s.name}</span>
                      {s.onnuri ? <OnnuriBadge size="sm" /> : null}
                    </div>
                    <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 3, lineHeight: 1.45 }}>
                      {CATEGORY_LABELS[s.cat] || "기타"} · {s.biz} · 약 {s.dist}m, 도보 {walk}분
                    </div>
                  </div>

                  {/* 가게 상세로 가는 길은 이 꺾쇠 하나뿐이다 — 행 자체를 누르면 지도가 옮겨간다.
                      두 동작이 같은 자리에 있으면 지도를 보려던 사람이 화면을 떠나게 된다 */}
                  <button onClick={e => { e.stopPropagation(); onPickStore(s); }} aria-label={`${s.name} 상세 보기`}
                    style={{ flex: "0 0 auto", minWidth: "var(--tap-min)", minHeight: "var(--tap-min)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: "none", border: "none", cursor: "pointer", color: "var(--yong-ink-300)" }}>
                    <Icon name="chevron-right" size={20} />
                  </button>
                </div>
              );
            })}
          </div>
          <Button variant="ghost" size="sm" icon="maximize" onClick={fitAll}
            style={{ alignSelf: "flex-start", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>
            코스 전체 보기
          </Button>
        </section>

        <Button variant="ghost" size="sm" icon="flag" onClick={onReport}
          style={{ alignSelf: "flex-start", color: "var(--text-muted)" }}>
          정보 오류 신고
        </Button>

        {/* 코스는 상점가 점포 데이터에서 만들어지므로 기준일자도 그쪽을 따른다 */}
        <DetailNotice asOf={`점포 정보 ${asOf}`}>
          <span style={{ display: "block" }}>
            코스는 추천이며 영업시간과 휴무는 매장마다 다릅니다. 방문 전 확인해 주세요.
          </span>
        </DetailNotice>
      </DetailBody>
    </DetailPage>
  );
}

export default CourseDetail;
