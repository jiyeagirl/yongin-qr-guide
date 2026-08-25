import React from "react";
import {
  EmptyState, SectionHeader, DistrictRow, Notice, Button, TextButton,
} from "../../design-systems/index.js";

/* S03-E 상점가 탭 안내 상태 (U-ST-16).
 *
 * QR 지점에서 임계 거리(1km 권장) 안에 지정 골목형 상점가가 없을 때, 상점가 탭의 점포 목록
 * 자리를 대신한다. 탭 자체를 없애지 않는 이유는 하단 탭 3개가 화면 구조이기 때문이다 —
 * 탭이 사라졌다 나타났다 하면 QR 지점마다 서비스가 다른 물건으로 보인다.
 *
 * ── 화면에 임계 거리 숫자를 적지 않는다 ────────────────────────────────────
 * "1km 안에 없습니다"라고 적으면 1.1km 에 있는 상점가를 보여주는 바로 아래 목록과 어긋나
 * 읽힌다. 상한은 어느 상점가를 "현재 상점가"로 삼을지 정하는 내부 기준이지, 사용자가
 * 알아야 할 값이 아니다 (U-FC-08 의 시설 상한을 감추는 것과 같은 이유다).
 *
 * ── 조아용을 여기에 쓰는 이유 ──────────────────────────────────────────────
 * U-ST-16 이 지정한 캐릭터 사용 지점이다. 빈 화면은 "고장 났나"로 읽히기 쉬운데,
 * 여기는 고장이 아니라 정상 상태의 하나다 — 그 온도 차를 문장보다 캐릭터가 먼저 전한다.
 *
 * ── 카드가 2~3개인 이유 ────────────────────────────────────────────────────
 * 명세가 정한 수다. 서른 곳을 다 늘어놓으면 둘러보기 탭의 "다른 상점가"와 같은 목록이 되어
 * 두 탭이 구분되지 않는다. 여기서는 "그럼 어디로 갈까"에 대한 답 몇 개면 된다.
 * 전체 목록이 필요하면 둘러보기 탭으로 보낸다.
 */

export const NEARBY_DISTRICT_COUNT = 3;

export function DistrictEmpty({
  districts = [], totalCount, anchorName, onPickDistrict, onGoDiscover, onGoFacility,
  base = "../../design-systems/",
}) {
  const picks = React.useMemo(
    () => [...districts].sort((a, b) => a.dist - b.dist).slice(0, NEARBY_DISTRICT_COUNT),
    [districts]);

  return (
    <div style={{ padding: "0 var(--gutter-screen) var(--space-8)" }}>

      <EmptyState pose="curious" base={base}
        title="가까운 골목형 상점가가 없습니다"
        description={anchorName
          ? `${anchorName} 주변에는 지정된 골목형 상점가가 없습니다.`
          : "이 지점 주변에는 지정된 골목형 상점가가 없습니다."}
        style={{ padding: "var(--space-6) 0 var(--space-4)" }} />

      {/* 막힌 채로 두지 않는다 — 이 탭이 못 하는 일을 다른 탭이 하고 있다는 것을 알려준다.
          여기서 나가는 길이 없으면 사용자는 탭을 하나씩 눌러보며 확인해야 한다.

          ── 안의 동작을 글자 링크로 바꿨다 (2026-08-24, 사용자 요청) ─────────────
          `Button size="sm" variant="outline"` 이었다. 두 가지가 어긋났다.

            흰 덩어리   outline 은 **흰 바탕과 테두리**를 갖는다 (Button 의 VARIANTS).
                        그것이 teal 로 옅게 깔린 안내 상자 위에 얹히니, 상자 안에 다른
                        상자가 하나 더 들어앉은 꼴이 됐다.
            무게        sm 도 최소 높이 40px 에 굵은 라벨이다. 이 상자에서 주인공은
                        "시설은 그대로 볼 수 있다"는 문장이고 버튼은 그 문장의 꼬리인데,
                        문장보다 버튼이 먼저 눈에 들어왔다. 게다가 이 화면의 주된 내용은
                        아래 「가볼 만한 상점가」라 거기 있는 버튼과 무게가 맞부딪혔다.

          `TextButton` 이 정확히 이 경우를 위해 있는 부품이다 (그 파일 머리말이 같은
          이야기를 적고 있다) — 바탕도 테두리도 없이 글자와 꺾쇠만 남기고, **손이 닿는
          높이는 44px 그대로**다 (U-CM-13). 눈에는 작고 손에는 크다.

          색은 브랜드 초록이 아니라 `--text-link`(teal-700)다. 이 상자의 제목·아이콘과
          **같은 색**이라 상자 안의 것으로 읽히고, 초록을 쓰면 옅은 teal 바탕 위에 세 번째
          색이 된다. 팔레트 값을 직접 적지 않는 것은 이것이 "누를 수 있는 글자"라는 뜻을
          가진 자리이기 때문이다 — 링크 색이 바뀌면 여기도 따라와야 한다.
          왼쪽 여백은 0 으로 당겨 문장과 첫 글자를 맞춘다 — 링크가 문장에서 이어진다.
          아이콘 둘은 각각 할 일이 있다: 구명튜브는 **어느 탭인지**를(탭바와 같은 그림쇠),
          꺾쇠는 **여기서 나간다**는 것을 말한다. */}
      {/* ── 문구 (2026-08-25, 사용자 요청) ─────────────────────────────────────
          제목이 「주변 공공시설은 그대로 볼 수 있습니다」, 본문이 「AED · 화장실 · 쉼터 ·
          대피소는 상점가와 무관하게 안내됩니다」였다. 둘이 **같은 말을 순서만 바꿔** 두 번
          하고 있었다 — 제목의 「그대로」와 본문의 「무관하게」가 같은 사실이다.
          이제 제목이 그 사실을 맡고, 본문은 **무엇을 볼 수 있는지**를 맡는다.
          가운뎃점을 쉼표로 바꾼 것은 관리자 검색창과 같은 갈래다 — 넷은 한 덩어리가
          아니라 「이 중 무엇이든」이라 붙여 읽히면 곤란하다.

          ── 아래 여백 (2026-08-25, 사용자 요청) ─────────────────────────────────
          [공공시설 탭으로] 밑이 허전했다. `TextButton` 은 눈에 보이는 글자보다 상자가
          큰 부품이라(손이 닿는 높이 44px 을 지킨다 — U-CM-13) 글자 아래로 빈 칸이
          십수 px 남고, 그 위에 상자 자신의 아래 여백(space-4)이 또 얹혔다.
          **상자의 아래 여백만 덜어낸다** — 단추의 44px 은 손가락의 몫이라 건드리지
          않고, 겹쳐 있던 두 여백 중 하나만 없애면 글자 사이는 그대로다. */}
      {onGoFacility ? (
        <Notice tone="info" title="주변 공공시설은 상점가와 관계없이 안내됩니다."
          style={{ paddingBottom: 0 }}>
          AED, 화장실, 쉼터, 대피소 정보를 확인할 수 있습니다.
          <span style={{ display: "block" }}>
            <TextButton icon="life-buoy" iconEnd="chevron-right" onClick={onGoFacility}
              style={{ paddingLeft: 0, color: "var(--text-link)" }}>
              공공시설 탭으로
            </TextButton>
          </span>
        </Notice>
      ) : null}

      {picks.length ? (
        <section style={{ marginTop: "var(--space-6)" }}>
          <SectionHeader title="가볼 만한 상점가" note="가까운 순" />
          {/* 줄을 누르면 용인시 누리집의 그 상점가 안내로 나간다 (2026-08-18, 둘러보기 탭과 같다).
              앱 안에는 다른 상점가의 점포도 지도도 없어서, 여기서 열 수 있는 것이 없다.

              **[축제] 배지를 여기서만 켜 두었다가 껐다** (2026-08-25, 사용자 요청). 이 화면에
              축제 섹션이 없어 그 배지가 "왜 저기로 가나"의 유일한 답이라는 이유였는데, 남겨 둔
              근거는 알릴 값이 있다는 것이었지 **그 모양이어야 한다**는 것이 아니었다. 다른
              화면에서 이미 없앤 표시가 여기만 남으면 오히려 더 낯설다 — 켜는 곳이 없어져
              `DistrictRow` 에서 프로퍼티째 지웠다 (그쪽 머리말) */}
          <div role="list">
            {picks.map((d, i) => (
              <DistrictRow key={d.id} district={d} external
                divider={i < picks.length - 1}
                onClick={() => onPickDistrict && onPickDistrict(d)} />
            ))}
          </div>

          {onGoDiscover ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-4) 0" }}>
              <Button variant="outline" icon="compass" onClick={onGoDiscover}>
                상점가 {totalCount || districts.length}곳 전체 보기
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* U-CM-07 · U-CM-08 — 목록이 비어 보이는 화면일수록 기준일자가 필요하다.
          "없다"는 말이 언제 기준인지 모르면 정보가 아니라 인상이 된다.

          119 안내는 끈다 (2026-08-24. 같은 탭의 DistrictSheet 와 같은 이유) — 이 화면에
          깔리는 것은 가까운 상점가 몇 곳뿐이고 안전시설은 한 줄도 없다. */}
      <p style={{ marginTop: "var(--space-5)", fontSize: "var(--fs-caption)",
        color: "var(--text-muted)", lineHeight: 1.55 }}>
        {/* 한 줄이다 (2026-08-24, 사용자 요청. DistrictSheet 와 같은 이유) */}
        상점가 지정 현황 2026.07 기준. 안내 정보는 참고용입니다.
      </p>
    </div>
  );
}

export default DistrictEmpty;
