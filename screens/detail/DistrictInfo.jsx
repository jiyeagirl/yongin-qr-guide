import React from "react";
import {
  DetailPage, DetailBody, DetailNotice, InfoList, SectionHeader, FestivalCard, PhotoStrip, Icon, Button,
} from "../../design-systems/index.js";

/* 다른 골목형 상점가 안내 (2026-10-19 신설. 종전 S13-S 「준비 중」 화면을 대체한다).
 * `docs/direction_v2_rules.md` 9장 — 다른 상점가는 용인시 누리집으로 내보내지 않고 **앱 안에서** 연다.
 *
 *   [AppBar]  ← 뒤로 · 상점가 이름
 *   ─────────────────────────────────
 *   상점가 이름 (골목형상점가 앞을 띄운다)
 *   구 · 행정동 · 소재지 (한 줄 — 표에는 소재지 칸이 없다)
 *   [사진 줄]  ← 자료가 없으면 자리표시 카드
 *   점포 수 / 온누리 가맹점 / 현 위치에서의 거리
 *   ─────────────────────────────────
 *   상점가 축제  (있을 때만)          ← FestivalCard → S09
 *   ─────────────────────────────────
 *
 * ── 가진 것만 보여준다 ───────────────────────────────────────────────────
 * 더미 점포·인기 매장·코스는 전부 둔전 한 곳 기준이다. 다른 상점가에 그 섹션을 만들면 이름만 바뀐
 * 둔전 가게가 나온다 — 조용히 거짓말을 하는 화면이다. 시 자료로 받은 이름 · 소재지 · 점포 수 ·
 * 온누리 가맹 수 · 축제만 적고, 나머지는 「준비 중」이라고 한 줄로 말한다.
 *
 * 온누리 가맹 수를 모르는 곳이 있다(`onnuri == null`, 시 안내에 그 수가 없다). 0 곳으로 적지 않는다 —
 * 「가맹점이 없다」와 「수를 모른다」는 다른 말이다.
 */
/* 시 표기는 「에버랜드마을골목형상점가」처럼 붙어 있다 — 화면에서는 「골목형상점가」 앞을 띄운다 (2026-10-19) */
const spaced = name => String(name || "").replace(/(\S)골목형상점가$/, "$1 골목형상점가");

/* 「처인구 포곡읍 전대로78번길 4 일원」 — 구와 행정동 뒤에 소재지를 바로 잇는다. 소재지가 이미 읍·면·동으로
   시작하면(처인구 쪽) 행정동을 한 번 더 적지 않는다 */
const locationLine = d => (/^\S+[읍면동]\s/.test(d.addr || "") ? `${d.gu} ${d.addr}` : `${d.gu} ${d.area} ${d.addr}`);

export function DistrictInfo({ district, festival, onBack, onClose, onOpenFestival, onOpenMap,
  base = "../../design-systems/" }) {
  const d = district;
  const km = d.dist === 0 ? "현 위치"
    : d.dist >= 1000 ? `${(d.dist / 1000).toFixed(1)}km` : `${d.dist}m`;

  return (
    <DetailPage title={spaced(d.name)} onBack={onBack} onClose={onClose}
      /* [지도 보기] — 이 상점가의 점포를 지도와 목록으로 본다 (2026-10-19, 사용자 요청). 상점가 탭으로 옮기지 않고
         둘러보기 안에서 한 칸 더 들어간다(DistrictMap). 지금 서 있는 상점가는 상점가 탭이 그 지도라 단추가 없다 */
      footer={onOpenMap ? <Button variant="primary" size="lg" icon="map" block onClick={onOpenMap}>가게 둘러보기</Button> : undefined}>
      <DetailBody>
        {/* 점포 · 축제 상세와 같은 머리 — 왼쪽 아이콘 하나 + 이름 + 그 아래 작은 주소 (2026-10-19, 사용자 요청) */}
        <header>
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <span style={{ flex: "0 0 auto", display: "inline-flex" }}>
              <Icon name="store" size={26} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ font: "var(--type-title-2)", letterSpacing: "var(--ls-snug)",
                color: "var(--text-heading)", wordBreak: "keep-all" }}>{spaced(d.name)}</h2>
              <p style={{ marginTop: 2, font: "var(--type-caption)", color: "var(--text-muted)",
                wordBreak: "keep-all", overflowWrap: "anywhere" }}>{locationLine(d)}</p>
            </div>
          </div>
        </header>

        {/* 대표 사진 자리 (2026-10-19, 사용자 요청) — 점포·축제 상세와 같은 부품이다. 자료(`district.images`)가
            들어오면 같은 자리에 사진이 선다 */}
        <PhotoStrip images={d.images} name={spaced(d.name)} label="상점가 이미지" />

        {/* 진행 중인 축제 홍보 (2026-10-19, 사용자 요청) — [지도 보기]로 들어가기 전에 이 상점가가 지금 무엇을 하는지
            먼저 읽힌다. 점포 수 표보다 위다 */}
        {festival ? (
          <section>
            <SectionHeader title="축제 및 행사" />
            <FestivalCard festival={festival} base={base} pose={festival.pose}
              onClick={() => onOpenFestival(festival)} />
          </section>
        ) : null}

        {/* 정보 표 위 제목 (2026-10-19, 사용자 요청) — 축제 구역과 같은 SectionHeader. 축제 구역 제목은 축제 상태와 상관없이
            「축제 및 행사」 하나다(「진행 중인 축제」 · 「상점가 축제」로 바뀌지 않는다) */}
        <section>
          <SectionHeader title="상점가 현황" />
        <InfoList items={[
          { label: "가게 수", value: `${d.stores}곳` },
          ...(d.mainBiz ? [{ label: "주요 업종", value: d.mainBiz.join(", ") }] : []),
          { label: "온누리 가맹점", value: d.onnuri != null ? `${d.onnuri}곳` : "-" },
          { label: "거리", value: km },
        ]} />
        </section>


        <DetailNotice emergency={false}>
          가게 수와 온누리 가맹 수는 시 안내 기준이라 실제와 다를 수 있습니다. 안내 정보는 참고용입니다.
        </DetailNotice>
      </DetailBody>
    </DetailPage>
  );
}

export default DistrictInfo;
