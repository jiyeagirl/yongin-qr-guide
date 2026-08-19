import React from "react";
import {
  DetailPage, DetailBody, DetailNotice, InfoList, yesNoMark, CopyField, NearbyFacilities,
  Button, Badge, OnnuriBadge, CategoryIcon, CATEGORY_LABELS, Notice,
} from "../../design-systems/index.js";
import { WALK_M_PER_MIN, STORE_AS_OF } from "../main/config.js";

/* S06 점포 상세 (기능명세서 v1.0 4장 S06 행).
 * 관련 기능: U-ST-05(점포 상세) · U-ST-06(온누리 가맹 표시) · U-ST-07(주변 공공시설)
 *            U-CM-07 · U-CM-08 · U-CM-10
 *
 * S05 시설 상세와 **같은 골격**이다 (DetailPage 를 공유한다). 두 화면이 다르게 보이면
 * 목록에서 무엇을 눌렀느냐에 따라 다른 앱으로 들어간 것처럼 읽힌다.
 *
 * 다른 것은 셋뿐이다:
 *   1. 머리에 업종 아이콘과 온누리 배지가 온다 (U-ST-06)
 *   2. 온누리 가맹점이면 그 사실을 배지 하나로 끝내지 않고 한 줄로 적는다 (아래 주석)
 *   3. 주변 공공시설이 붙는다 (U-ST-07 — 상점가 상세와 점포 상세 **양쪽**에 요구된다)
 *
 * ── 항목은 우리가 정하지 않는다 (2026-08-19) ────────────────────────────
 * 점포 정보는 공공데이터 상가업소정보에서 온다. 상세가 보여줄 수 있는 항목은
 * **입력 항목 정의서 1-2 에 적힌 여덟 개뿐**이다:
 *
 *   상호명 · 도로명주소 · 상권업종대분류명                              (필수)
 *   지점명 · 상권업종소분류명 · 표준산업분류명 · 온누리상품권 가맹 여부   (선택)
 *
 * **중분류를 적지 않는다** (2026-08-19). 소분류와 겹치는 자리가 너무 많다 — 중분류 45종 중
 * 13종이 소분류와 글자까지 같고(동물병원·제과점·세탁소·의원·안경·분식·신발·이용원·
 * 슈퍼마켓·약국·화훼·당구장·서점), 점포로 세면 335곳 중 88곳(26%)이 두 줄에 같은 값을
 * 적게 된다. 같은 말이 연달아 두 번 나오면 읽는 사람은 둘이 다른 것인 줄 알고 차이를 찾는다.
 * 대분류가 큰 갈래를, 소분류가 실제 업태를 말하므로 둘이면 충분하다.
 * (데이터에는 `biz` 로 남아 있다 — 목록 한 줄과 머리말이 쓰고 검색도 걸린다.)
 *
 * 상호명은 제목, 도로명주소는 복사 카드가 맡고 나머지가 정보 표에 온다.
 * 선택 항목은 비어 있어도 줄을 지우지 않고 "-" 로 남긴다 (InfoList 머리말).
 *
 * 화면의 업종 칩(음식·쇼핑…)을 정보 표에 적지 않는다. 그것은 시민이 훑기 좋게 우리가 묶은
 * 분류이고 원천 항목이 아니다 — 원천 대분류와 어긋나는 자리도 있다(서점의 칩은 "여가/문화",
 * 대분류는 "소매"). 칩은 머리의 배지로만 남긴다.
 *
 * **"상점가" 줄을 뺐다.** 정의서 1-2 에 없는 항목이고, 이 화면은 언제나 지금 서 있는
 * 상점가 안에서 열린다 — 앱바 위 컨텍스트가 이미 그것을 말하고 있다.
 *
 * ── 정의서에 없지만 남긴 것 ─────────────────────────────────────────────
 * **주변 공공시설**(U-ST-07). 점포의 입력 항목이 아니라 다른 카테고리를 끌어다 붙이는
 * 연계 노출이라 1-2 의 범위 밖이다.
 *
 * ── 화면에 적지 않는 것 ─────────────────────────────────────────────────
 * views(조회수). 인기순 정렬(U-ST-15)을 돌리기 위한 내부 값이지 사용자에게 보여줄 수치가
 * 아니다. "조회 1,240회"는 가게를 고르는 데 도움이 되지 않으면서 적은 쪽 가게에는 불리하게
 * 작용한다. 둘러보기 탭의 "이번 주 조회 1위" 처럼 순위로 감싸 노출하는 자리는 따로 있다.
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
               가맹이 아닌 곳에는 이 상자를 띄우지 않는다 — 정보 표의 × 한 줄로 충분하고,
               상자까지 세우면 그 가게에 없는 흠을 만든다.

               **"지류 및 디지털"이다** (2026-08-19). 예전에는 "지류·카드·모바일" 셋을 적었는데,
               온누리 가맹 자료가 나누는 축은 **지류와 디지털 둘**이다. 카드와 모바일은 그
               디지털 안의 결제 수단이라 같은 층위가 아니고, 셋으로 적으면 "카드는 되는데
               모바일은 안 되는" 가맹점이 따로 있는 것처럼 읽힌다.

               크기는 sm 이다 (2026-08-19). md 로는 320px 화면에서 상자가 154px 이었다 —
               상세 화면에서 가장 큰 덩어리가 배지 한 줄로도 되는 이야기였다. 99px 로 줄었다. */}
        {s.onnuri ? (
          <Notice tone="info" size="sm" title="온누리상품권 사용 가능">
            지류 및 디지털 온누리상품권 가맹점입니다. 가맹 여부는 2025.07 기준이며 방문 전
            매장에 확인해 주세요.
          </Notice>
        ) : null}

        {/* ── 도로명주소 (1-2 필수) ────────────────────────────────────
               구까지 포함한 값이 데이터에 들어 있다 (dunjeon.js). 복사한 주소는
               카카오맵·티맵 검색창으로 건너가므로 구가 있어야 한 번에 찾힌다.
               예전에는 화면이 "처인구 "를 앞에 붙였는데, 주소가 없을 때
               "처인구 undefined" 가 만들어져 빈 값 검사를 통과했다. */}
        <CopyField label="도로명주소" value={s.addr} onCopied={onCopied} />

        {/* 오류 신고는 상세 정보 박스에 바짝 붙인다 (U-CM-10) — S05 와 같은 자리, 같은 크기.
             [지도에서 보기]는 뺐다: 위에 뒤로가기, 아래에 길찾기가 이미 있다. */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {/* 정의서 1-2 의 항목 순서 그대로다. 대분류만 필수이고 나머지는 선택이라,
              원천이 비면 줄을 지우지 않고 "-" 로 남는다 — 골목상점가의 점포는 대부분
              단독 점포라 지점명이 실제로 자주 빈다.

              온누리 가맹 여부는 ○ · × 로 적는다 (yesNoMark). 답이 둘뿐인 항목이라
              부호가 낱말보다 빨리 읽히고, 읽어줄 때는 "가맹"·"미가맹"으로 들려준다.
              **불리언을 그대로 넘기지 않는 이유**: InfoList 는 false 를 빈 값으로 읽어
              "-" 를 찍는데, "미가맹"과 "확인되지 않음"은 다른 말이다 — 상품권을 들고 온
              사람에게는 그 차이가 갈지 말지를 가른다. */}
          <InfoList items={[
            { label: "지점명", value: s.branch },
            { label: "상권업종대분류명", value: s.bizL },
            { label: "상권업종소분류명", value: s.bizS },
            { label: "표준산업분류명", value: s.ksic },
            { label: "온누리상품권 가맹 여부", value: yesNoMark(s.onnuri, "가맹", "미가맹") },
          ]} />
          <Button variant="ghost" size="sm" icon="flag" onClick={onReport}
            style={{ alignSelf: "flex-start", color: "var(--text-muted)" }}>
            정보 오류 신고
          </Button>
        </div>

        {/* ── 주변 공공시설 (U-ST-07) ──────────────────────────────────
               상점가 탭 하단과 같은 컴포넌트, 같은 데이터다. 두 화면이 같은 시설을
               다른 거리로 말하면 안 된다 (data/facilities.js 의 NEARBY 주석). */}
        <NearbyFacilities items={nearby} note="QR 지점 기준" onPick={onPickFacility} />

        {/* ── 고지 (U-CM-07 · U-CM-08) ────────────────────────────────
               점포 정보는 분기 단위 갱신이라 폐업이 남아 있을 수 있다 (명세서 3-5).
               기준일자를 적는 것이 이 화면에서는 형식이 아니라 실질적인 경고다. */}
        {/* 기준일은 카테고리 단위로 관리한다 (정의서 3-2) — 점포마다, 상점가마다 갖지 않는다.
             온누리 가맹 정보의 기준일은 정의서에 없어 뺐다. 가맹 여부가 언제 기준인지는
             위 안내 문장이 이미 적고 있다. */}
        <DetailNotice asOf={`점포 정보 ${STORE_AS_OF} 기준`}>
          <span style={{ display: "block" }}>
            상가정보는 분기 단위로 갱신되어 폐업한 매장이 남아 있을 수 있습니다.
          </span>
        </DetailNotice>
      </DetailBody>
    </DetailPage>
  );
}

export default StoreDetail;
