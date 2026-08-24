import React from "react";
import {
  SectionHeader, TextButton, Notice, StoreRail, CourseCard, FestivalCard, DistrictRow,
} from "../../design-systems/index.js";
import { DISTRICT_PREVIEW, FESTIVAL_PREVIEW } from "./config.js";

/* S04 둘러보기 탭 (기능명세서 v1.1 4장 S04 행).
 * 관련 기능: U-DC-01~06 · U-FT-01 · U-ST-14(→U-DC-04)
 *
 * ── 이 탭에는 지도가 없다 (2026-08-18 변경) ─────────────────────────────────
 * 앞의 두 탭과 달리 **고르는 화면이 아니라 훑는 화면**이다. 필터도, sticky 제어 줄도 없다.
 * 지도도 마찬가지였다 — 상점가 전체를 한 화면에 담으려면 시 전역(약 25km)까지 줌아웃해야 하는데,
 * 그 축척에서는 핀이 어디에 있든 "용인시 어딘가"로만 읽혀 아무 것도 알려주지 못했다.
 * 게다가 이 탭의 주인공인 축제·신규매장·코스는 애초에 지도 위의 점이 아니라 읽을거리다.
 * 그래서 지도를 걷어내고 앱바 아래 전체를 정보 화면으로 쓴다.
 *
 * **지도 인스턴스는 그대로 살아 있고 감춰지기만 한다** (MainApp 참조). 언마운트하면
 * 탭을 되돌아올 때 지도가 다시 뜨는데 U-CM-16 이 그것을 금지한다. 여기서 금지되는 것은
 * "재로딩"이지 "안 보이는 것"이 아니다.
 *
 *   상점가 축제 정보         상점가 전체   ← 기간 한정이라 최상단 (U-DC-05). 진행중·예정만
 *   골목 한바퀴 코스 추천     현재 상점가
 *   신규 매장 / 인기 매장    현재 상점가
 *   용인시 골목형 상점가 정보 상점가 전체   ← 최하단 (U-DC-04). 줄마다 용인시 누리집으로 나간다
 *
 * 위에서부터 **넓은 답 → 좁은 답**이다. 축제와 코스는 "지금 이 동네에서 뭘 하지"에,
 * 신규·인기 매장은 그보다 한 걸음 좁은 "어느 가게에 가지"에 답한다 (2026-08-18 순서 변경).
 *
 * ── 범위가 섞이는 유일한 탭이다 ────────────────────────────────────────────
 * 축제와 다른 상점가는 상점가 전체, 가운데 두 섹션은 현재 상점가만 다룬다.
 * 그래서 섹션 머리말 오른쪽에 범위를 글자로 적고(`note`), 축제 카드에는 상점가명과 거리를
 * 반드시 병기한다 (U-DC-01). 이게 없으면 네 섹션이 모두 둔전 이야기로 읽힌다.
 *
 * U-DC-06 — 현재 상점가가 없으면(임계 거리 초과, U-ST-16) 가운데 두 섹션을 통째로 숨긴다.
 * 빈 카드 자리를 남기지 않는다. 축제와 다른 상점가 목록만으로도 화면이 성립한다.
 */
export function DiscoverPanel({
  festivals = [], newStores = [], popular = [], courses = [], districts = [],
  currentDistrict,               /* 없으면(null) U-DC-06 축소 모드 */
  onOpenFestival, onOpenAllFestivals, onOpenStore, onOpenCourse, onOpenAllDistricts,
  /* 안내 주소가 없는 상점가 줄만 쓴다 — 주소가 있으면 줄이 앵커라 앱 밖으로 나간다
     (DistrictRow 의 external 주석). 2026-08-24 */
  onOpenDistrict,
  base = "../../design-systems/",   /* 축제 카드의 조아용 PNG 경로 기준 */
}) {
  /* 다른 상점가는 가까운 몇 곳만 깐다. 목록이 화면 밖으로 한참 이어지면 탭 최하단이라는
     위치 자체가 무의미해진다 (U-DC-04 는 "탭 최하단 배치"를 요구한다).
     `districts` 는 이미 거리순이므로 앞에서 자르면 그것이 가까운 순이다.
     펼치는 상태가 없다 — 나머지는 [전체보기]가 여는 S13 이 맡는다 (아래 섹션 주석). */
  const preview = districts.slice(0, DISTRICT_PREVIEW);

  /* 축제도 같은 방식으로 접는다 (위 섹션 주석 참조). 다만 [더 보기]를 한 번 누르면
     전부 펼친다 — 6건짜리 목록을 두 번 나눠 펼치게 하면 누르는 일이 목적이 된다. */
  const [festivalLimit, setFestivalLimit] = React.useState(FESTIVAL_PREVIEW);
  const shownFestivals = festivals.slice(0, festivalLimit);
  const restFestivals = festivals.length - shownFestivals.length;

  const scope = { padding: "0 var(--gutter-screen)" };

  return (
    /* 시트가 아니라 화면 전체를 쓰는 스크롤 패널이다. 위에는 앱바·컨텍스트 바가,
       아래에는 탭바가 형제로 있으므로 여기서는 세로 스크롤만 맡는다. */
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain",
      WebkitOverflowScrolling: "touch", background: "var(--surface-page)" }}>
      <div style={{ padding: "var(--space-5) 0 var(--space-9)" }}>

      {/* ── 1. 축제 (U-DC-01 · U-FT-01) — 진행중·예정만, 앞의 몇 건만 펼쳐둔다 ───
             **종료된 축제는 여기 없다** (2026-08-18). 이 탭은 "지금 갈 수 있는 곳"을 훑는
             자리라 끝난 행사가 자리를 차지할 이유가 없다. 다만 U-FT-01 이 요구하는 세 상태
             구분을 버리는 것은 아니고, 머리말 오른쪽 [전체보기]가 여는 S12 가 그것을 맡는다.

             남은 것도 한 번에 깔지 않는다. 둘러보기는 축제 목록 화면이 아니라 **네 가지를
             훑는 화면**이라, 첫 화면에서 네 섹션이 다 보이지 않으면 아래 셋은 없는 것이나
             마찬가지다. 자료를 줄이는 것이 아니라 접는 것이다 — [더 보기]로 그 자리에서
             펼친다. 목록이 상태 다음 임박순이므로 접히는 것은 늘 덜 급한 쪽이다.

             머리말 오른쪽의 "상점가 전체 · n건"을 뺐다. 범위를 적어두던 자리인데, 이제
             그 자리가 [전체보기]로 가는 길이고 범위는 각 행의 상점가명이 이미 말한다. */}
      <section style={scope}>
        <SectionHeader title="상점가 축제 정보" action="전체보기" onAction={onOpenAllFestivals} />
        {festivals.length === 0 ? (
          <Notice tone="info" title="열리고 있거나 예정된 축제가 없습니다">
            새 축제가 확정되면 이 자리에 표시됩니다. 지난 축제는 [전체보기]에서 볼 수 있습니다.
          </Notice>
        ) : (
          <>
            {/* 홍보 카드로 깐다 (2026-08-18). 전에는 `FestivalRow` 였는데, 축제 섹션이
                이 탭 맨 위에 있는 이유가 **알리기 위해서**인데 정작 알려지지 않았다 —
                이름·날짜·거리만 나란한 줄은 이미 그 축제를 아는 사람에게나 쓸모가 있다.
                카드는 한 건에 화면 한 뼘을 내주고 그 자리에 "가면 무엇을 하나"를 적는다.

                그래서 펼침 기본값이 2건이다 (`FESTIVAL_PREVIEW`). 카드 두 장이면 아래
                세 섹션이 아직 첫 화면 언저리에 남고, 나머지는 [더 보기]가 그 자리에서 편다.
                축제는 지도 마커가 아니므로(마커는 상점가 지점이다) 선택 강조가 없다. */}
            <div role="list" style={{ display: "flex", flexDirection: "column",
              gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
              {shownFestivals.map(f => (
                <FestivalCard key={f.id} festival={f} base={base}
                  pose={f.pose}
                  onClick={() => onOpenFestival(f)} />
              ))}
            </div>
            {/* 펼침/접힘 손잡이. 축제는 한 번에 전부 펼치므로 둘 중 하나만 나온다 */}
            {restFestivals > 0 || festivalLimit > FESTIVAL_PREVIEW ? (
              <div style={{ display: "flex", justifyContent: "center" }}>
                {restFestivals > 0 ? (
                  <TextButton iconEnd="chevron-down" aria-expanded={false}
                    onClick={() => setFestivalLimit(festivals.length)}>
                    축제 {restFestivals}건 더 보기
                  </TextButton>
                ) : (
                  <TextButton iconEnd="chevron-up" aria-expanded
                    onClick={() => setFestivalLimit(FESTIVAL_PREVIEW)}>
                    축제 접기
                  </TextButton>
                )}
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* ── 2·3. 현재 상점가 대상 섹션 — 없으면 통째로 숨긴다 (U-DC-06) ──────
             **코스가 매장보다 위다** (2026-08-18 순서 변경). 축제와 코스는 둘 다 "지금 이
             동네에서 뭘 하지"에 답하는 자리이고, 신규·인기 매장은 그보다 한 걸음 좁은
             "어느 가게에 가지"다. 같은 결의 둘을 붙여두면 위에서부터 넓은 답 → 좁은 답으로
             읽히고, 축제가 없는 기간에도 코스가 첫 화면에 남는다. */}
      {currentDistrict ? (
        <>
          {/* 골목 한바퀴 추천 코스 (U-DC-03) */}
          {courses.length ? (
            <section style={{ marginTop: "var(--space-6)" }}>
              <div style={scope}>
                <SectionHeader title="골목 한바퀴 코스 추천" note={currentDistrict.name} />
              </div>
              <div style={{ display: "flex", alignItems: "stretch", gap: "var(--space-3)",
                overflowX: "auto", padding: "2px var(--gutter-screen) var(--space-2)", scrollbarWidth: "none" }}>
                {courses.map(c => (
                  <CourseCard key={c.id} course={c} onClick={() => onOpenCourse(c)} />
                ))}
              </div>
            </section>
          ) : null}

          {/* 신규 및 인기 매장 (U-DC-02).
              "신규"와 "인기"를 한 줄에 섞지 않는다 — 새로 생긴 가게는 아직 조회수가 낮고
              조회수 상위는 대개 오래된 가게라, 섞으면 어느 근거로 뽑힌 카드인지 알 수 없다.

              그런데 두 레일이 같은 초록이라, 나란히 이어진 두 섹션이 머리말을 읽지 않으면
              **같은 줄이 두 번 깔린 것처럼** 보였다 (2026-08-18). 근거가 다른 목록이면
              색도 갈라야 그 근거가 화면에 남는다 — tone 은 StoreRail 주석 참조. */}
          <section style={{ ...scope, marginTop: "var(--space-5)" }}>
            <SectionHeader title="신규 매장" note={currentDistrict.name} />
            <StoreRail items={newStores} label="신규 매장" tone="new" onPick={onOpenStore} />
          </section>

          <section style={{ ...scope, marginTop: "var(--space-5)" }}>
            <SectionHeader title="인기 매장" note={currentDistrict.name} />
            <StoreRail items={popular} label="인기 매장" tone="hot" onPick={onOpenStore} />
          </section>
        </>
      ) : (
        /* 현재 상점가가 없을 때 (U-DC-06). 빈 카드 자리를 남기는 대신 왜 없는지 한 줄로 적는다 */
        <section style={{ ...scope, marginTop: "var(--space-5)" }}>
          <Notice tone="info" title="가까운 상점가가 없습니다">
            골목 한바퀴 코스와 신규·인기 매장은 가까운 상점가가 있을 때 보여드립니다.
            아래에서 가볼 만한 상점가를 골라보세요.
          </Notice>
        </section>
      )}

      {/* ── 4. 용인시 골목형 상점가 목록 (U-DC-04, 옛 U-ST-14) — 최하단 ──────
             **가까운 5곳만 깔고 [더 보기]를 없앴다** (2026-08-18). 전에는 8곳씩 붙여 나갔는데,
             누를 때마다 목록이 길어져 탭 최하단이 화면 서너 개 분량이 됐다 — 게다가 그렇게
             다 펼쳐도 거리순 32줄이라 아는 이름 하나를 찾을 방법이 없었다. 접었다 폈다 하는
             손잡이는 목록을 정리해 주는 것처럼 보이지만, 실제로 하는 일은 **같은 화면에
             두 가지 길이를 만드는 것**이다.

             그래서 축제 섹션과 같은 구조로 갈랐다: 여기는 맛보기 5곳, 전체는 [전체보기]가
             여는 S13 이 맡고 거기서 구(區) 칩으로 좁힌다. 이 탭은 네 가지를 훑는 자리이지
             상점가 목록 화면이 아니다.

             줄을 누르면 용인시 누리집의 그 상점가 안내 페이지로 나간다 (2026-08-18).
             우리에게는 다른 상점가의 점포도 지도도 없어서, 앱 안에서 열면 이 줄에 이미
             적힌 이름·규모·거리를 한 번 더 보게 된다 (DistrictRow 의 external 주석). */}
      <section style={{ ...scope, marginTop: "var(--space-6)" }}>
        {/* 라벨은 그냥 "전체보기"다 (2026-08-18). 한때 [전체 32개]로 수를 실었는데, 그
            수는 목록의 길이도 아니고(여기는 5줄) 이 자리에서 할 일도 없다 — 필요하면
            S13 의 [전체] 칩이 적는다. 위 축제 섹션과 같은 낱말이라 두 [전체보기]가
            같은 성격의 길이라는 것도 함께 읽힌다. */}
        <SectionHeader title="용인시 골목형 상점가 정보"
          action="전체보기" onAction={onOpenAllDistricts} />
        {/* 지도가 없어졌으므로 마커 선택 강조(selected)도 없다 — 강조할 지도가 없다 */}
        <div role="list">
          {preview.map((d, i) => (
            /* [축제] 배지를 끈다 — 맨 위 섹션이 통째로 축제이고 [전체보기]까지 있어서,
               여기 배지는 같은 사실을 세 번째로 말한다 (DistrictRow 의 festivalTag 주석) */
            <DistrictRow key={d.id} district={d} festivalTag={false} external
              divider={i < preview.length - 1}
              onClick={() => onOpenDistrict && onOpenDistrict(d)} />
          ))}
        </div>
      </section>

      {/* ── 고지 (U-CM-07 · U-CM-08) ───────────────────────────────────── */}
      <div style={{ ...scope, marginTop: "var(--space-5)" }}>
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
          {/* 119 안내를 여기서는 뺀다 (2026-08-19). 그 문장은 **안전시설을 보여주는 화면의
              고지**다 — AED·대피소를 안내한 다음 "그래도 급하면 119"라고 잇는 자리.
              둘러보기 탭에는 안전시설이 한 줄도 없다(축제·매장·코스·상점가뿐). 시설을
              보여주지 않은 화면에서 응급을 말하면 고지가 아니라 관용구가 되고, 정작
              공공시설 탭에서 같은 문장을 읽을 때 무게가 빠진다.
              공공시설 탭(FacilitySheet)·상점가 탭(DistrictSheet, 하단에 주변 공공시설
              4줄이 붙는다)·상세 화면은 그대로 둔다. */}
          {/* "축제 일정은 주최 상점가 사정으로 변경될 수 있습니다"를 뺐다 (2026-08-19).
              이 줄이 말하는 것은 **상점가 지정 현황의 기준일자**인데, 성격이 다른 축제
              이야기가 가운뎃점 하나로 매달려 있었다 — 앞은 자료의 시점, 뒤는 자료의
              불확실성이라 이어붙일 수 있는 두 문장이 아니었다.

              그 고지가 사라지는 것도 아니다. 축제를 실제로 읽는 자리인 S09 상세와
              S12 전체보기가 같은 말을 각자 적고 있고, 거기서는 그 문장이 화면의
              주제와 맞는다. 이 탭의 축제 섹션은 카드 세 장짜리 훑어보기라, 그 세 장을
              위해 탭 전체의 고지를 한 문장 늘릴 자리가 아니다. */}
          {/* 한 줄이다. 둘로 끊었을 때 각 줄이 화면 폭의 절반도 못 채웠고, 두 조각 다
              같은 것(이 탭이 보여준 자료)을 말하고 있어 줄을 나눌 근거가 없었다 */}
          상점가 지정 현황 2026.07 기준이며, 안내 정보는 참고용입니다.
        </p>
      </div>
      </div>
    </div>
  );
}

export default DiscoverPanel;
