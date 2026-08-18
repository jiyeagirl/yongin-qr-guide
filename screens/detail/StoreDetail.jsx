import React from "react";
import {
  DetailPage, DetailBody, DetailNotice, InfoList, CopyField, NearbyFacilities,
  Button, Badge, OnnuriBadge, CategoryIcon, CATEGORY_LABELS, Notice,
} from "../../design-systems/index.js";
import { WALK_M_PER_MIN } from "../main/config.js";

/* S06 점포 상세 (기능명세서 v1.0 4장 S06 행).
 * 관련 기능: U-ST-05(점포 상세) · U-ST-06(온누리 가맹 표시) · U-ST-07(인근 편의시설)
 *            U-CM-07 · U-CM-08 · U-CM-10
 *
 * S05 시설 상세와 **같은 골격**이다 (DetailPage 를 공유한다). 두 화면이 다르게 보이면
 * 목록에서 무엇을 눌렀느냐에 따라 다른 앱으로 들어간 것처럼 읽힌다.
 *
 * 다른 것은 셋뿐이다:
 *   1. 머리에 업종 아이콘과 온누리 배지가 온다 (U-ST-06)
 *   2. 온누리 가맹점이면 그 사실을 배지 하나로 끝내지 않고 한 줄로 적는다 (아래 주석)
 *   3. 인근 편의시설이 붙는다 (U-ST-07 — 상점가 상세와 점포 상세 **양쪽**에 요구된다)
 *
 * ── 화면에 적지 않는 것 ─────────────────────────────────────────────────
 * views(조회수). U-ST-05 의 항목이 아니고, 인기순 정렬(U-ST-15)을 돌리기 위한 내부 값이지
 * 사용자에게 보여줄 수치가 아니다. "조회 1,240회"는 가게를 고르는 데 도움이 되지 않으면서
 * 적은 쪽 가게에는 불리하게 작용한다. 둘러보기 탭의 "이번 주 조회 1위" 처럼 순위로 감싸
 * 노출하는 자리는 따로 있다.
 */
export function StoreDetail({ store, district, nearby = [], onBack, onRoute, onReport, onPickFacility, onCopied }) {
  const s = store;
  const walk = Math.max(1, Math.round(s.dist / WALK_M_PER_MIN));

  return (
    <DetailPage title={s.name} onBack={onBack}
      footer={<Button variant="primary" size="lg" icon="footprints" block onClick={onRoute}>길찾기</Button>}>

      <DetailBody>
        {/* ── 머리 ───────────────────────────────────────────────────────
               S05 와 같은 배치다 — 배지는 제 줄, 아이콘은 **업체명 옆**. */}
        <header>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "var(--space-2)" }}>
            <Badge tone="neutral">{CATEGORY_LABELS[s.cat] || "기타"}</Badge>
            {/* 목록·상세·지도 마커가 같은 기호를 쓴다 (U-ST-06). 배지를 화면마다
                새로 조립하지 않고 OnnuriBadge 하나만 쓴다 */}
            {s.onnuri ? <OnnuriBadge /> : null}
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
            <span style={{ flex: "0 0 auto", paddingTop: 3 }}>
              <CategoryIcon type={s.cat} size={26} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ font: "var(--type-title-2)", letterSpacing: "var(--ls-snug)",
                color: "var(--text-heading)", wordBreak: "keep-all" }}>{s.name}</h2>
              <p style={{ marginTop: 4, fontSize: "var(--fs-body)", color: "var(--text-body)" }}>
                {s.biz} · 약 {s.dist}m, 도보 {walk}분
              </p>
            </div>
          </div>
        </header>

        {/* ── 온누리 가맹 안내 (U-ST-06) ────────────────────────────────
               배지 하나로 끝내지 않고 문장으로 적는다. "온누리"라는 낱말만으로는 그것이
               상품권을 쓸 수 있다는 뜻인지 아는 사람만 알고, 이 데이터는 상점가 탭 필터 중
               신뢰도가 가장 높은 축이라 확실히 전달할 값어치가 있다 (명세서 U-ST-11).
               가맹이 아닌 곳에는 아무 것도 적지 않는다 — "사용 불가"를 적으면 그 가게에
               없는 흠을 만든다. */}
        {s.onnuri ? (
          <Notice tone="info" title="온누리상품권 사용 가능">
            지류·카드·모바일 온누리상품권 가맹점입니다. 가맹 여부는 2025.07 기준이며 방문 전
            매장에 확인해 주세요.
          </Notice>
        ) : null}

        {/* ── 주소 복사 ────────────────────────────────────────────────
               점포 데이터의 addr 은 "포곡읍 둔전로 42" 처럼 구가 빠져 있다. 목록에서는 전부
               같은 상점가라 문제가 없지만, 복사한 주소는 카카오맵·티맵 검색창으로 건너가므로
               구까지 붙여야 한 번에 찾힌다. 시설 쪽 주소 표기(처인구 포곡읍 …)와도 맞춘다. */}
        <CopyField value={`처인구 ${s.addr}`} onCopied={onCopied} />

        {/* 오류 신고는 상세 정보 박스에 바짝 붙인다 (U-CM-10) — S05 와 같은 자리, 같은 크기.
             [지도에서 보기]는 뺐다: 위에 뒤로가기, 아래에 길찾기가 이미 있다. */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <InfoList items={[
            { label: "업종", value: `${CATEGORY_LABELS[s.cat] || "기타"} · ${s.biz}` },
            { label: "상점가", value: district ? district.name : null },
          ]} />
          <Button variant="ghost" size="sm" icon="flag" onClick={onReport}
            style={{ alignSelf: "flex-start", color: "var(--text-muted)" }}>
            정보 오류 신고
          </Button>
        </div>

        {/* ── 인근 편의시설 (U-ST-07) ──────────────────────────────────
               상점가 탭 하단과 같은 컴포넌트, 같은 데이터다. 두 화면이 같은 시설을
               다른 거리로 말하면 안 된다 (data/facilities.js 의 NEARBY 주석). */}
        <NearbyFacilities items={nearby} note="QR 지점 기준" onPick={onPickFacility} />

        {/* ── 고지 (U-CM-07 · U-CM-08) ────────────────────────────────
               점포 정보는 분기 단위 갱신이라 폐업이 남아 있을 수 있다 (명세서 3-5).
               기준일자를 적는 것이 이 화면에서는 형식이 아니라 실질적인 경고다. */}
        <DetailNotice asOf={`점포 정보 ${district ? district.asOf : ""} · 온누리 가맹 정보 2025.07 기준`}>
          <span style={{ display: "block" }}>
            상가정보는 분기 단위로 갱신되어 폐업한 매장이 남아 있을 수 있습니다.
          </span>
        </DetailNotice>
      </DetailBody>
    </DetailPage>
  );
}

export default StoreDetail;
