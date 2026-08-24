import React from "react";
import {
  DetailPage, DetailBody, DetailNotice, InfoList, Accordion, SectionHeader,
  Badge, ListRow, Icon, Notice, festivalBadge,
} from "../../design-systems/index.js";
import { whenLabel } from "../main/data/districts.js";

/* S09 축제 상세 (기능명세서 v1.1 4장 S09 행).
 * 관련 기능: U-FT-02(축제 상세) · U-FT-04(부스 위치) `C` · U-FT-05(당일 임시시설) `C`
 *            U-CM-08 (U-CM-07 기준일자와 U-CM-10 오류신고는 이 화면에 두지 않는다.
 *            둘 다 아래에 이유를 적었다)
 *
 *   [AppBar]  ← 뒤로 · 축제명
 *   ─────────────────────────────────
 *   [진행중] 배지 · 축제명 · 상권명, 거리
 *   ─────────────────────────────────
 *   기간 / 상권명 / 시간 / 주요 프로그램
 *   ─────────────────────────────────
 *   주요 프로그램 일정 (아코디언)          ← 협의 필요. 자료가 있을 때만
 *   ─────────────────────────────────
 *   부스 위치                              ← 협의 필요. 자료가 있을 때만
 *   ─────────────────────────────────
 *   참고용 고지 · 119                      ← 기준일자는 적지 않는다
 *
 * ── 항목은 우리가 정하지 않는다 (2026-08-19) ────────────────────────────
 * 입력 항목 정의서 1-3 에 적힌 것만 보여준다:
 *
 *   축제명 · 기간(시작일·종료일) · 상권명                     (필수)
 *   시간 · 주요 프로그램                                      (선택)
 *   └ 주요 프로그램 일정 · 부스 위치                          (선택, **협의 필요**)
 *   노출 상태                                                 (시스템 자동)
 *
 * 축제 자료는 공공데이터가 아니라 용인시가 **금년도 이미지 파일**로 전달하는 것이라
 * (정의서 3-1 의 5번) 관리자가 수기로 옮겨 적는다. 그래서 항목이 적고, 늘릴 수도 없다.
 *
 * **뺀 것**: "장소"(정의서에 없다 — 상권명이 그 자리를 대신한다), "당일 임시시설"
 * (U-FT-05 는 우선순위 C 인데 정의서 1-3 에 항목 자체가 없다), 기준일자(3-2 미표기 대상).
 *
 * ── 협의 필요 항목은 "-" 로 남기지 않는다 ───────────────────────────────
 * 다른 선택 항목은 비어도 "-" 로 자리를 남기지만(InfoList 머리말), 주요 프로그램 일정과
 * 부스 위치는 다르다. 정의서 3-1 의 4번이 **"자료 제공 범위 확정 후 반영 여부를 결정한다"**
 * 고 적고 있어, 아직 이 항목을 화면이 약속한 상태가 아니다. 약속하지 않은 자리를 "-" 로
 * 여섯 축제마다 반복해 두면 빠뜨린 것처럼 읽힌다. 자료가 온 축제에만 그린다.
 *
 * ── 종료된 축제 ─────────────────────────────────────────────────────────
 * 목록(U-FT-01)이 종료 상태도 노출하므로 상세에도 들어올 수 있다. 이때 프로그램을
 * 그대로 보여주면 아직 열리는 행사로 읽힌다. 맨 위에 끝났다는 사실을 먼저 적는다.
 */
/* 「상권명」줄. 주소가 있으면 앵커로 새 창을 열고, 없으면 앱 안의 준비 중 안내로 가는
   버튼이 된다 — **눈에 보이는 모양은 둘이 같다.** 나가는 것과 안 나가는 것의 차이는
   보조기기에만 말한다 (aria-label): 새 창이 뜨는 쪽만 그 사실을 미리 알아야 한다. */
function DistrictLink({ f, onOpenDistrict }) {
  const look = { display: "inline-flex", alignItems: "center", gap: 4, minHeight: 44,
    color: "var(--text-link)", fontWeight: "var(--fw-semibold)",
    background: "none", border: "none", padding: 0, font: "inherit", textAlign: "left" };
  const inner = <>
    {f.districtName}
    <span style={{ fontSize: "var(--fs-micro)", fontWeight: "var(--fw-regular)",
      color: "var(--text-muted)" }}>상세 페이지</span>
    <Icon name="chevron-right" size={16} />
  </>;

  if (f.homepage) {
    return (
      /* 보조기기에는 어디로 가는지 온전히 말한다. 눈으로 보는 "상세 페이지"만으로는
         이 앱 안의 화면인지 바깥인지 구분되지 않는데, 화면에서는 꺾쇠와 링크색이
         그 역할을 나눠 맡고 있어 글자를 길게 늘일 필요가 없다. */
      <a href={f.homepage} target="_blank" rel="noopener noreferrer"
        aria-label={`${f.districtName} 상세 페이지 — 용인시 누리집에서 새 창으로 열림`}
        style={{ ...look, color: "var(--text-link)" }}>
        {inner}
      </a>
    );
  }
  /* 열어줄 화면이 없으면(핸들러를 안 넘긴 화면) 평문으로 떨어진다 — 눌리지 않는 것을
     눌리는 모양으로 두지 않는다 */
  if (!onOpenDistrict) return f.districtName;
  return (
    <button type="button" onClick={() => onOpenDistrict(f)} style={{ ...look, cursor: "pointer" }}>
      {inner}
    </button>
  );
}

export function FestivalDetail({ festival, onBack, onOpenDistrict }) {
  const f = festival;
  const ended = f.state === "종료";
  const live = f.state === "진행중";

  /* 거리는 "가까운 순" 정렬의 근거이자 갈지 말지를 정하는 값이다 (U-DC-01 이 목록에서도
     상점가명과 거리를 병기하라고 요구한다). km 로 적는다 — 축제는 수 km 밖이 기본이다. */
  const distance = f.dist >= 1000 ? `${(f.dist / 1000).toFixed(1)}km` : `${f.dist}m`;

  /* ── 시각과 위치가 값으로 들어온다 (2026-08-24) ─────────────────────────
     전에는 `p.at` 이 "15:00~17:00" 이라는 한 덩어리 글자였고, 자리 정보("한숲공원
     야외무대")는 설명 문장 끝에 섞여 있었다. 관리자 폼이 날짜·시각 고르개와 「위치」
     칸을 갖게 되면서 여기도 조각으로 들어온다 (data/districts.js).

     아코디언은 접힌 줄에 **시각과 제목만** 보인다. 위치는 펴야 보이는 쪽이 맞다 —
     훑을 때 필요한 것은 "몇 시에 뭘 하나"이고, "어디서"는 갈지 정한 다음의 질문이다. */
  const oneDay = f.start === f.end;
  const programs = (f.programs || []).map(p => ({
    meta: whenLabel(p.startAt, p.endAt, oneDay),
    title: p.title,
    body: p.where ? (
      <>
        <span style={{ display: "block", fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>
          {p.where}
        </span>
        {p.desc}
      </>
    ) : p.desc,
  }));
  const booths = f.booths || [];

  return (
    /* ── 하단 액션바가 없다 (2026-08-18) ──────────────────────────────────────
       [○○ 상점가 보기]를 뺐다. 이 화면은 **축제 하나를 읽는 자리**다. 그런데 그 버튼이
       가는 곳은 축제와 상관없는 상점가 화면이었고, 현재 상점가가 아니면 갈 곳조차 없어
       토스트만 띄웠다 — 화면에서 가장 큰 버튼이 대개 아무 일도 하지 않았다.

       상점가로 가는 길은 아래 정보 표의 "주최 상점가" 줄이 맡는다. 축제를 읽다가 주최가
       궁금해진 사람이 그 낱말을 보고 있는 바로 그 자리다. */
    /* 앱바 제목은 **짧은 이름**이다 (2026-08-20). 실제 축제명은 24자까지 가는데 그 줄은
       뒤로가기 단추와 한 줄을 나눠 쓴다 — 아래 머리에서 온전히 적으므로 여기서 잘릴 이유가 없다 */
    <DetailPage title={f.short || f.name} onBack={onBack}>

      <DetailBody>
        {/* ── 머리 ─────────────────────────────────────────────────────── */}
        <header>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "var(--space-2)" }}>
            {/* 상태 알약은 디자인 시스템의 표 하나가 정한다 (festivalState.js). 여기서
                삼항으로 다시 적고 있었는데, 같은 표가 네 곳에 흩어진 결과 관리자 표만
                예정이 청록으로 갈려 있었다. 진행중이 꽉 찬 빨강에 점을 다는 것도 그 표가 정한다 */}
            <Badge {...festivalBadge(f.state)}>{f.state}</Badge>
            <Badge tone="neutral">{f.districtName} · {distance}</Badge>
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
            <span style={{ flex: "0 0 auto", paddingTop: 3 }}>
              <Icon name="party-popper" size={26} color="var(--yong-amber-500)" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ font: "var(--type-title-2)", letterSpacing: "var(--ls-snug)",
                color: "var(--text-heading)", wordBreak: "keep-all" }}>{f.short || f.name}</h2>
              {/* 실제 축제명 (2026-08-20). 제목은 짧은 이름이고 — 여섯 축제가 모두
                  "OO 골목축제"라 목록에서 견주기 좋다 — 이 줄이 현수막에 적힌 그 이름이다.
                  카드에서 이미 보고 들어온 줄이라 상세에서 사라지면 딴 축제로 읽힌다.
                  정보 표(아래 InfoList)에 한 칸으로 넣지 않은 이유: 표는 기간·시간·상권명처럼
                  **항목값**이 서는 자리이고, 이것은 값이 아니라 이 화면의 이름이다. */}
              {f.short ? (
                <p style={{ marginTop: 2, fontSize: "var(--fs-body)",
                  fontWeight: "var(--fw-semibold)", color: "var(--text-body)",
                  wordBreak: "keep-all" }}>{f.name}</p>
              ) : null}
              <p style={{ marginTop: 4, fontSize: "var(--fs-body)", color: "var(--text-body)" }}>
                {f.period} {f.time}
              </p>
            </div>
          </div>
        </header>

        {ended ? (
          <Notice tone="info" title="이미 끝난 축제입니다">
            아래 내용은 지난 행사 기준입니다. 다음 축제가 확정되면 둘러보기 탭에 다시 올라옵니다.
          </Notice>
        ) : null}

        {/* ── 기본 정보 (U-FT-02) ──────────────────────────────────────
               "주최 상점가"만 누를 수 있다. 상점가 자체의 소개·연혁·연락처는 우리가 가진
               자료가 아니라 시가 이미 관리하는 자료다 — 여기에 옮겨 적으면 갱신 주체가
               둘이 되어 반드시 어긋난다. 그래서 우리 화면에 상점가 소개를 만들지 않고
               용인시 누리집의 그 상점가 안내로 내보낸다.

               **바깥으로 나가는 링크라는 것을 숨기지 않는다.** 새 창으로 열고, 꺾쇠 옆에
               "용인시 누리집"이라고 적고, 보조기기에는 aria-label 로 한 번 더 말한다.
               같은 앱 안의 다른 화면으로 가는 줄 알고 눌렀다가 브라우저가 바뀌면
               되돌아오는 길을 스스로 찾아야 한다. */}
        {/* 항목과 순서는 정의서 1-3 그대로다. 라벨 "상권명"은 정의서의 항목명이고,
             시민에게는 "주최 상점가"가 더 자연스럽지만 원천 항목명을 그대로 쓴다 —
             관리자 화면과 시민 화면이 다른 이름으로 같은 칸을 부르면 문의가 들어왔을 때
             어느 칸 이야기인지 맞춰봐야 한다. */}
        <InfoList items={[
          { label: "기간", value: f.period },
          /* ── 주소가 없어도 [상세 페이지]는 그대로다 (2026-08-24) ────────────
                 전에는 `homepage` 가 비면 이 줄이 상점가 이름 한 글자짜리 평문으로 떨어졌다.
                 상점가 목록의 같은 자리와 같은 이유로 고쳤다 (DistrictRow 의 external 주석):
                 관리자가 그 칸을 비우는 이유는 대개 **아직 페이지가 없어서**이고, 그 사정이
                 「이 축제만 링크가 없다」는 모양으로 나갈 이유가 없다.
                 주소가 있으면 새 창으로 나가고, 없으면 앱 안의 준비 중 안내로 간다. */
          { label: "상권명", value: (
            <DistrictLink f={f} onOpenDistrict={onOpenDistrict} />
          ) },
          { label: "시간", value: f.time },
          { label: "주요 프로그램", value: f.program },
        ]} />

        {/* ── 주요 프로그램 일정 (정의서 1-3, 협의 필요) — 자료가 있을 때만 ──
               위 표의 "주요 프로그램"이 한 줄 요약이고, 이것은 그 아래 딸린 시간대별
               일정이다. 아직 제공 범위가 확정되지 않은 항목이라 없는 축제에는 그리지 않는다
               (머리말 "협의 필요 항목은 -로 남기지 않는다"). */}
        {programs.length ? (
          <section>
            {/* note 를 달지 않는다 (2026-08-19). "4개 · 시간대별"이라 적었는데, 개수는 바로
                아래 네 줄이 이미 보여주고 "시간대별"은 각 줄 왼쪽의 시각이 말한다 —
                머리말이 아래를 한 번 더 설명하면 읽을 것만 늘어난다 */}
            <SectionHeader title="주요 프로그램 일정" />
            {/* 전부 닫힌 채로 시작한다 (Accordion 의 기본값. 그쪽 주석 참조) */}
            <Accordion items={programs} />
          </section>
        ) : null}

        {/* ── 부스 위치 (정의서 1-3, 협의 필요) — 자료가 있을 때만 ─────── */}
        {booths.length ? (
          <section>
            <SectionHeader title="부스 위치" note="주최 상점가 제공" />
            <div style={{ background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)",
              borderRadius: "var(--radius-card)", padding: "var(--space-2) var(--space-4)" }}>
              {/* 두 줄이 각각 다른 질문에 답한다 — 어디에 있나(위치) · 지금 열었나(시각).
                  「규모」 한 마디("20여 곳")가 있던 자리는 없앴다 (2026-08-24) — 무엇을 하는
                  곳인지는 부스명이 이미 말한다. 시각이 없으면 그 줄은 나오지 않는다. */}
              {booths.map((b, i) => (
                <ListRow key={b.name} icon={<Icon name="grid" size={22} />} title={b.name}
                  meta={
                    <>
                      <span style={{ display: "block" }}>{b.where}</span>
                      {b.startAt ? (
                        <span style={{ display: "block", color: "var(--brand-primary)",
                          fontWeight: "var(--fw-semibold)" }}>
                          {whenLabel(b.startAt, b.endAt, oneDay)}
                        </span>
                      ) : null}
                    </>
                  }
                  trailing={null} divider={i < booths.length - 1} />
              ))}
            </div>
            {/* 배치도 이미지는 아직 자료가 없다. 글자 목록만으로도 "어디쯤인지"는 전달된다 */}
          </section>
        ) : null}

        {/* 당일 임시시설(U-FT-05)을 뺐다 (2026-08-19) — 정의서 1-3 에 항목이 없다.
             임시 화장실·의료소 자료를 시가 전달하기로 확정되면 정의서에 항목을 더하고
             여기에 되살린다. 데이터(districts.js 의 tempFacilities)는 남겨 두었다. */}

        {/* [정보 오류 신고]를 뺐다 (2026-08-19). U-CM-10 이 받는 것은 **시설과 점포**의
            정보 오류다. 그 둘은 공공데이터를 옮겨온 것이라 원본이 틀려 있을 수 있고,
            신고가 그것을 고치는 유일한 통로다.

            축제는 다르다. 관리자가 직접 입력한 자료라(정의서 3-1 의 5번) 틀렸다면 입력한
            사람이 고치면 되고, 게다가 여기서 열리는 폼은 대상 칸이 비어 있었다 —
            시설·점포처럼 대상을 실어 보낼 수 없어서다. 무엇에 대한 신고인지 사용자가
            직접 적어야 하는 폼을 축제마다 달아둘 이유가 없다. */}

        {/* 기준일자를 적지 않는다 (정의서 3-2: 축제 정보는 미표기 대상).
             축제는 공공데이터가 아니라 시가 그때그때 전달하는 자료라 "몇 월 기준"이라는 말이
             성립하지 않는다 — 없는 근거를 적으면 그 날짜가 보증처럼 읽힌다.
             대신 바뀔 수 있다는 사실은 그대로 적는다. */}
        {/* 119 안내를 끈다 — 이 화면에는 안전시설이 한 줄도 없다 (DetailNotice 의 emergency 주석).
             그러면서 "참고용"과 "바뀔 수 있다"를 한 문장으로 잇는다. 두 줄로 나누면 앞줄이
             축제 이야기, 뒷줄이 일반 고지로 읽혀 같은 말을 두 번 하는 것처럼 보였다 */}
        <DetailNotice emergency={false}>
          안내 정보는 참고용이며, 일정과 프로그램은 주최 상점가 사정으로 변경될 수 있습니다.
        </DetailNotice>
      </DetailBody>
    </DetailPage>
  );
}

export default FestivalDetail;
