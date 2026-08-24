import React from "react";
import {
  EmptyState, SectionHeader, DistrictRow, Notice, Button,
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
          여기서 나가는 길이 없으면 사용자는 탭을 하나씩 눌러보며 확인해야 한다. */}
      {onGoFacility ? (
        <Notice tone="info" title="주변 공공시설은 그대로 볼 수 있습니다">
          AED · 화장실 · 쉼터 · 대피소는 상점가와 무관하게 안내됩니다.
          <span style={{ display: "block", marginTop: "var(--space-2)" }}>
            <Button size="sm" variant="outline" icon="life-buoy" onClick={onGoFacility}>
              공공시설 탭으로
            </Button>
          </span>
        </Notice>
      ) : null}

      {picks.length ? (
        <section style={{ marginTop: "var(--space-6)" }}>
          <SectionHeader title="가볼 만한 상점가" note="가까운 순" />
          {/* 줄을 누르면 용인시 누리집의 그 상점가 안내로 나간다 (2026-08-18, 둘러보기 탭과 같다).
              앱 안에는 다른 상점가의 점포도 지도도 없어서, 여기서 열 수 있는 것이 없다.
              여기서는 [축제] 배지를 남긴다 — 이 화면에는 축제 섹션이 따로 없어서
              그 배지가 "왜 저기로 가나"에 대한 유일한 답이다 (DistrictRow 의 festivalTag 주석) */}
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
        상점가 지정 현황 2026.07 기준<br />
        안내 정보는 참고용입니다.
      </p>
    </div>
  );
}

export default DistrictEmpty;
