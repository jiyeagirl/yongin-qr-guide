import React from "react";
import { FestivalCard } from "./FestivalCard.jsx";

/* 진행 중 또는 예정 축제 배너 (U-ST-03, U-FT-03). 상점가 탭 시트 헤더가 쓴다.
   종료된 축제는 호출하는 쪽에서 걸러 넣는다 — 배너 자리를 종료 안내로 채우지 않는다.
   범위가 "현재 상점가 1건"이라, 둘러보기 탭의 전체 축제 목록과 겹치지 않는다.

   ── 이제 `FestivalCard` 그 자체다 (2026-08-19) ──────────────────────────────
   전에는 따로 그린 줄이었다. 크림색 띠에 party-popper 아이콘, Badge 하나, 꺾쇠 — 둘러보기
   탭의 축제 카드와 **같은 축제를 다른 물건처럼** 보여주고 있었다. 색도 따로였다:
   배너는 `--brand-accent-soft`, 카드는 상태별 파스텔. 상점가 탭에서 본 축제와 둘러보기
   탭에서 본 축제가 같은 것인지 알아보려면 이름을 읽어야 했다.

   지금은 같은 컴포넌트의 `compact` 변형이다. **색·상태 알약·글의 차례**가 두 화면에서
   같으므로 같은 축제라는 것이 그대로 읽힌다. 시트 헤더가 좁으니 홍보 문구와 상점가·거리
   줄은 접고, 오른쪽 조아용 대신 왼쪽에 축제 아이콘 한 점을 둔다 — 캐릭터는 한 뼘을 받아야
   사는 그림이라 두세 줄짜리 띠에는 자리가 없다 (FestivalCard 의 MASCOT_SIZE 주석).

   **따로 그리지 않는 것이 요점이다.** 두 벌을 두면 한쪽만 고쳐지는 날이 오고, 실제로
   그렇게 됐었다. 이 파일에 남은 것은 "시트 헤더에서는 접어서 쓴다"는 결정 한 줄뿐이다.

   ── 닫을 수 있다 ────────────────────────────────────────────────────────────
   축제에 관심이 없는 사람에게 이 배너는 점포 목록 위에 늘 얹혀 있는 두 줄이다.
   `onDismiss` 를 주면 우측 상단에 [X] 가 붙는다 (FestivalCard 가 그린다).

   **닫힘 상태는 이 컴포넌트가 들고 있지 않는다.** 시트 헤더는 탭을 옮기면 언마운트되므로
   여기에 두면 둘러보기를 갔다 올 때마다 배너가 되살아나 같은 것을 몇 번이고 닫아야 한다
   (U-FC-09 말풍선에서 겪은 그대로다). 셸이 들고, 여기는 알리기만 한다. */
export function FestivalBanner({ festival, onClick, onDismiss, dismissLabel = "축제 안내 닫기",
  style, ...rest }) {
  if (!festival) return null;

  /* pose·base 를 넘기지 않는다 — compact 는 조아용을 그리지 않으므로 PNG 경로가 필요 없다 */
  return (
    <FestivalCard compact festival={festival} onClick={onClick}
      onDismiss={onDismiss} dismissLabel={dismissLabel}
      style={style} {...rest} />
  );
}
