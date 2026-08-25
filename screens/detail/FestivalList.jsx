import React from "react";
import {
  DetailPage, DetailNotice, ListControls, Chip, FestivalCard, EmptyState, Pagination,
  FESTIVAL_STATES,
} from "../../design-systems/index.js";

/* S12 축제 전체보기 (2026-08-18 신설 · 08-18 카드형으로 개편).
 * 관련 기능: U-FT-01(축제 목록 · 진행중/예정/종료 구분) · U-DC-01 · U-CM-07 · U-CM-08
 *
 *   [AppBar]  ← 뒤로 · 상점가 축제 정보
 *   ─────────────────────────────────
 *   [전체][진행중][예정][종료]
 *   ─────────────────────────────────
 *   ┌─ 홍보 카드 ─────────────────┐   ← 한 열, 한 건이 한 뼘
 *   │ [진행중] 날짜        조아용   │
 *   │ OO 골목축제 (짧은 제목)       │
 *   │ 실제 축제명                   │
 *   │ 상점가명 · 거리               │
 *   └────────────────────────────┘
 *   …
 *   ─────────────────────────────────
 *   기준일자 · 참고용 고지 · 119
 *
 * ── 왜 이 화면이 생겼나 ─────────────────────────────────────────────────
 * 둘러보기 탭(S04)의 축제 섹션은 **진행중과 예정만** 보여준다. 그 탭은 "지금 갈 수 있는
 * 곳"을 훑는 자리라 끝난 행사가 자리를 차지할 이유가 없다. 그런데 U-FT-01 은 세 상태를
 * 모두 다루라고 요구하고, 실제로 "그 축제 언제였지"를 확인하러 오는 사람도 있다.
 * 그래서 종료를 포함한 전체는 이 화면이 맡는다.
 *
 * ── 행이 아니라 카드다 (2026-08-18 개편) ────────────────────────────────
 * 처음에는 둘러보기 탭과 같은 `FestivalRow` 를 썼다. 같은 축제가 화면마다 다르게 생기면
 * 다른 목록으로 읽힌다는 이유였는데, **여기가 하는 일이 그 탭과 달랐다.**
 *
 *   둘러보기 탭  네 섹션 중 하나. 축제는 "지금 뭘 하나"의 한 답이고, 한 건이 한 뼘을
 *                차지하면 아래 세 섹션이 첫 화면에서 사라진다 → 행이 맞다.
 *   이 화면      화면 전체가 축제다. 여섯 줄이 똑같이 생기면 훑고 나가지 한 건도
 *                읽지 않는다. 상점가 축제를 알리는 자리인데 알려지지 않는다 → 카드.
 *
 * 그래서 카드마다 **실제 축제명**을 제목 아래 한 줄로 적고, 조아용 포즈를 다르게 준다.
 * 그 값은 화면이 아니라 데이터가 정한다 (`districts.js` 의 FESTIVAL_RAW · POSES).
 * 전에는 그 한 줄이 우리가 지어낸 홍보 문장이었다 (2026-08-20 교체. FestivalCard 머리말).
 *
 * **카드 바탕색은 상태다** (2026-08-19 개편). 진행중 cream · 예정 sand · 종료 neutral 이고,
 * 그 바탕과 짝이 되는 배지 색까지 한 세트로 묶여 있다 (`festivalState.js` · `--status-*`).
 * 전에는 축제마다 다른 파스텔 여섯을 깔아 카드끼리 구별했는데, 배지의 상태 색과 겹쳐
 * 한 화면에 축제를 가리키는 색이 아홉 가지가 됐다. 구별은 축제명·날짜가 맡는다.
 * 색만으로 상태를 말하지는 않는다 — 카드 안에 "진행중"·"예정"·"종료"가 글자로 함께 나간다.
 *
 * ── 제어는 상태 칩 하나뿐이다 (2026-08-18 정리) ──────────────────────────
 * 처음에는 결과 수 · 정렬(임박순|가까운 순) · 상점가 Select 까지 넉 줄이 있었다.
 * **6건짜리 목록에 필터가 셋이면 필터가 목록보다 크다.** 전부 걷어냈다:
 *
 *   결과 수 "n건"   칩이 이미 개수를 달고 있어 같은 수를 두 번 적는다.
 *   정렬 고르기      6건에서는 어느 차례든 한 화면에 다 들어온다. 고를 값이 결과를
 *                   바꾸지 못하는 컨트롤은 손이 갈 자리만 차지한다.
 *   상점가 Select    후보가 축제를 여는 여섯 곳뿐이라, 고르면 대개 1건만 남는다.
 *                   목록을 좁히는 것이 아니라 목록을 없애는 축이었다.
 *
 * 남긴 것은 상태 칩이다. 이 화면에 오는 이유의 대부분이 "끝난 것도 보고 싶다"라서
 * 1순위 축이고, 칩은 한 번에 보이고 한 번에 눌린다.
 *
 * 차례는 `sortNear` 하나로 고정한다 — 상태 먼저, 그 다음 가까운 순이다. 순수 거리순으로
 * 두지 않는 이유: [전체] 칩에서 종료된 축제가 진행 중인 축제 위로 올라온다. 갈 수 있는
 * 것이 위에 있어야 한다. 상태 칩을 누르면 그 안은 어차피 거리순뿐이다.
 *
 * ── 쪽을 나눈다 (2026-08-19 추가) ────────────────────────────────────────
 * 전에는 조건에 걸린 것을 한 번에 다 깔았다. 그런데 카드는 한 장이 화면 한 뼘이라, 여섯
 * 장이면 스크롤이 여섯 뼘이다. **끝이 어디인지 모른 채 내려가면 계속 나올 것처럼 보이고,**
 * 실제로는 여섯 건뿐이라 그 기대가 어긋난다.
 *
 * 쪽 단추와 "n건 중 1–5" 한 줄이 그 답을 미리 준다. 형식은 S13 상점가 전체보기와 같다 —
 * 두 화면 다 [전체보기]로 들어오는 목록이라 같은 자리에서 같은 방식으로 넘어가야 한다.
 *
 * **`pageSize` 는 10 이다 — S13 상점가 전체보기와 같다** (2026-08-24 변경, 사용자 요청.
 * 종전 5). 5 로 둔 근거는 "저쪽은 한 줄짜리 행이고 여기는 한 뼘짜리 카드라, 쪽당 몇 줄이냐가
 * 아니라 쪽당 몇 화면이냐를 맞춘다"였는데, **이 목록에서는 그 계산이 맞지 않았다.** 축제는
 * 32개소를 통틀어 여섯 건이라 5 로 끊으면 두 번째 쪽에 한 건만 남고, 상태 칩을 누르면
 * 걸리는 것이 대개 한 자리 수라 쪽 나누기가 아예 일을 하지 않는다. 쪽 단추는 **끝이 어디인지
 * 미리 알려주려고** 둔 것인데, 5 는 있지도 않은 끝을 하나 더 만들고 있었다.
 *
 * 10 이면 지금 자료에서 [전체] 여섯 건이 한 쪽에 다 들어온다. 쪽 단추는 그래도 [1] 하나로
 * 남는다 — 한 쪽뿐이어도 그리는 것이 `Pagination` 의 규칙이고(그쪽 머리말), 칩을 누를
 * 때마다 목록 아래가 나타났다 사라졌다 하지 않게 하려는 것이다. "6건 중 1–6" 줄도 그대로
 * 남아 전체 건수를 말한다. 축제가 열 건을 넘기면 그때부터 [2]가 생긴다.
 */
export function FestivalList({ festivals = [], sortNear, onOpen, onBack, pageSize = 10,
  base = "../../design-systems/" }) {
  const [state, setState] = React.useState("전체");
  const [page, setPage] = React.useState(1);

  /* 상태를 바꾸면 1쪽으로. 1건뿐인 상태에서 2쪽을 보고 있으면 빈 화면이 열린다 (S13 과 같다) */
  React.useEffect(() => { setPage(1); }, [state]);

  /* 상태 칩에 개수를 함께 적는다. "종료"를 눌러보기 전에 몇 건인지 알 수 있어야
     누를지 말지를 정한다 (S03 업종 칩과 같은 규칙). */
  const counts = React.useMemo(() => {
    const o = { 전체: festivals.length, 진행중: 0, 예정: 0, 종료: 0 };
    festivals.forEach(f => { o[f.state] = (o[f.state] || 0) + 1; });
    return o;
  }, [festivals]);

  const rows = React.useMemo(() => {
    const out = festivals.filter(f => state === "전체" || f.state === state);
    return [...out].sort(sortNear);
  }, [festivals, state, sortNear]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const shown = rows.slice(start, start + pageSize);

  const gutter = { padding: "0 var(--gutter-screen)" };

  return (
    /* 칩을 바꾸거나 쪽을 넘기면 본문을 맨 위로 되돌린다. 쪽 단추는 목록 **끝**에 있어서
       [다음]을 누르면 새 쪽의 끝 카드 근처가 열리고, 칩을 바꾸면 다른 목록의 한가운데가
       열린다. 둘 다 "위에 무엇이 있는지 모른 채 올려봐야 하는" 상태다 (S13 과 같은 장치) */
    <DetailPage title="상점가 축제 정보" onBack={onBack} scrollKey={`${state}|${safePage}`}>
      {/* sticky 를 끈다. S03 상점가 탭에서는 335곳을 스크롤하는 내내 정렬이 손에 닿아야 해서
          붙여두지만, 여기는 축제 6건이라 스크롤이 길지 않다. 칩이 화면 위에 눌러앉으면
          정작 카드가 설 자리가 사라진다.

          결과 수와 정렬을 넘기지 않으므로 ListControls 는 칩 줄만 그린다 (그쪽 주석). */}
      <ListControls sticky={false}>
        <div role="tablist" aria-label="축제 상태"
          style={{ display: "flex", gap: "var(--space-2)", overflowX: "auto",
            scrollbarWidth: "none", padding: "var(--space-1) 0 var(--space-2)" }}>
          {["전체", ...FESTIVAL_STATES].map(s => (
            <Chip key={s} selected={state === s} count={counts[s] || 0}
              role="tab" aria-selected={state === s}
              onClick={() => setState(s)}>{s}</Chip>
          ))}
        </div>
      </ListControls>

      <div style={{ ...gutter, paddingTop: "var(--space-4)", paddingBottom: "var(--space-6)" }}>
        {rows.length ? (
          /* 한 열이다. 두 열로 깔면 카드 폭이 절반이 되어 실제 축제명이 들어갈 자리가 없고,
             제목조차 세 줄로 접힌다 — 카드로 바꾼 이유가 사라진다. */
          <div role="list" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {shown.map(f => (
              <FestivalCard key={f.id} festival={f} base={base}
                pose={f.pose}
                onClick={() => onOpen(f)} />
            ))}
          </div>
        ) : (
          /* 조건을 좁히다 0 건이 되는 것은 고장이 아니라 정상 상태다. 무엇을 풀면 되는지
             함께 적는다 — 빈 화면만 두면 사용자는 자료가 없다고 읽는다. 이제 축이 하나뿐이라
             풀 것도 하나다: 어느 칩을 누르라고 이름으로 적는다 */
          <EmptyState pose="curious" base={base}
            title={`${state}인 축제가 없습니다`}
            description="[전체]를 누르면 다른 상태의 축제도 함께 볼 수 있습니다."
            style={{ padding: "var(--space-8) 0" }} />
        )}

        {/* 지금 쪽이 목록의 어디인지 한 줄로 적는다 — 칩이 말하는 수는 조건에 걸린 전부이고,
            이 줄은 그중 지금 화면에 있는 구간이다 (S13 과 같은 어법) */}
        {rows.length ? (
          <div style={{ padding: "var(--space-4) 0 var(--space-2)" }}>
            <p style={{ textAlign: "center", fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
              {rows.length}건 중 {start + 1}–{start + shown.length}
            </p>
            <Pagination page={safePage} pageCount={pageCount} onChange={setPage}
              label="축제 목록 쪽 넘기기" style={{ marginTop: "var(--space-2)" }} />
          </div>
        ) : null}

        {/* 기준일자를 적지 않는다 (입력 항목 정의서 3-2: 축제 정보는 미표기 대상).
             119 안내도 끈다 — S09 축제 상세와 같은 이유이고 같은 문장이다. 두 화면이
             같은 축제를 다루는데 고지만 다르면 어느 쪽이 맞는지 알 수 없다 */}
        <DetailNotice emergency={false} style={{ marginTop: "var(--space-6)" }}>
          안내 정보는 참고용이며, 일정과 프로그램은 주최 상점가 사정으로 변경될 수 있습니다.
        </DetailNotice>
      </div>
    </DetailPage>
  );
}

export default FestivalList;
