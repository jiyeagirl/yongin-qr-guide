import React from "react";
import { DetailPage, EmptyState, Button } from "../../design-systems/index.js";

/* S13-S 상점가 상세 안내 준비 중 (2026-08-24 신설).
 * 관련 기능: U-DC-04 · U-ST-14 — 상점가 목록 줄의 [상세 페이지]가 여는 화면.
 *
 *   [AppBar]  ← 뒤로 · 상점가 상세 페이지
 *   ─────────────────────────────────
 *          (조아용 · sorry)
 *        아직 준비 중입니다
 *   OO골목형상점가 안내 페이지는 …
 *
 *        [상점가 전체 보기]        ← 있을 때만
 *
 * ── 왜 이 화면이 생겼나 ─────────────────────────────────────────────────
 * 상점가 목록의 줄은 용인시 누리집의 그 상점가 안내 페이지로 나간다. 그 주소는 관리자
 * 화면의 「상권 활성화 센터 페이지 링크」 한 칸에서 오는데, **아직 페이지가 없는 곳이
 * 있을 수 있다.**
 *
 * 그때까지는 줄에서 [상세 페이지] 이름표와 꺾쇠를 통째로 걷어냈다. 그런데 서른두 줄 중
 * 하나만 갈 곳이 없으면 목록이 고르지 않게 보이고, 시민은 **그 상점가에 무언가 빠졌다**고
 * 읽는다. 실제로 빠진 것은 우리 쪽 자료 한 칸이다.
 *
 * 그래서 줄은 그대로 두고 여기로 보낸다. 이 화면이 하는 일은 하나다 — **없는 것이
 * 상점가가 아니라 아직 안 만들어진 페이지라는 것**을 말하는 것.
 *
 * ── 조아용을 쓰는 이유 ──────────────────────────────────────────────────
 * S03-E(가까운 상점가 없음)와 같은 자리다. 글자만 있는 화면은 "고장 났나"로 읽히는데
 * 여기는 고장이 아니라 정상 상태의 하나다. 그 온도 차를 문장보다 캐릭터가 먼저 전한다.
 * 포즈는 `sorry` — 전신 그림 쪽이라 다른 화면의 조아용과 크기가 같다 (Mascot 머리말의
 * FULL/BUST 구분).
 *
 * ── 다시 시도해 보라고 하지 않는다 ──────────────────────────────────────
 * 새로고침해도 달라지지 않는다. 이 화면은 통신 오류가 아니라 **자료가 아직 없는 상태**이고,
 * 그 사실을 그대로 적는다. 대신 막힌 채로 두지 않는다 — 상점가 목록으로 되돌아가는 길
 * 하나를 둔다 (S03-E 가 [공공시설 탭으로]를 두는 것과 같은 규칙).
 */
export function DistrictSoon({ district, onBack, onClose, onGoDistricts,
  base = "../../design-systems/" }) {
  const name = district && district.name ? district.name : "이 상점가";

  return (
    <DetailPage title="상점가 상세 페이지" onBack={onBack} onClose={onClose}>
      <div style={{ padding: "0 var(--gutter-screen) var(--space-8)" }}>
        <EmptyState pose="sorry" base={base}
          title="아직 준비 중입니다"
          description={`${name}의 상세 안내 페이지는 아직 준비 중입니다. 준비되는 대로 이 자리에서 보실 수 있습니다.`}
          action={onGoDistricts ? (
            <Button variant="outline" icon="store" onClick={onGoDistricts}>
              상점가 전체 보기
            </Button>
          ) : null} />

        {/* 이 줄에 적힌 것(이름·규모·거리)이 지금 우리가 가진 전부다. 화면이 비어 보일수록
            그 사실을 적어 두어야 "없다"가 인상이 아니라 정보가 된다 (U-CM-07 · U-CM-08) */}
        {district ? (
          <p style={{ marginTop: "var(--space-4)", textAlign: "center",
            fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.55 }}>
            {district.gu} {district.area} · 점포 {district.stores}곳<br />
            상점가 지정 현황 2026.07 기준
          </p>
        ) : null}
      </div>
    </DetailPage>
  );
}

export default DistrictSoon;
