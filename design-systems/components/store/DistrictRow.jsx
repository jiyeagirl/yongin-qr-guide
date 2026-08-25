import React from "react";
import { ListRow } from "../core/ListRow.jsx";
import { Icon } from "../core/Icon.jsx";
/* `Badge` 를 여기서 뺐다 (2026-08-25) — [축제] 배지가 유일한 쓰임이었다 */
import { OnnuriBadge } from "../core/OnnuriBadge.jsx";

/* 다른 상점가 목록의 한 행 (U-DC-04, U-ST-14). 둘러보기 탭 최하단이 쓴다.
   `StoreRow`(점포) · `FacilityRow`(시설) 와 같은 `ListRow` 위에 올라간다 —
   세 목록이 서로 다른 물건처럼 보이면 탭을 옮길 때마다 읽는 법을 새로 배워야 한다.

   상점가는 점이 아니라 구역이므로(확정 결정사항 6) 거리는 "구역까지"의 근사값이다.
   점포 수와 온누리 가맹 수를 함께 적는 이유: 상점가를 고르는 기준이 이름이 아니라 규모와
   온누리 사용 가능 여부이기 때문이다.

   ── [축제] 배지가 여기 있었다 (`festivalTag`, 2026-08-25 삭제) ───────────────
   축제가 걸린 상점가 줄에 노란 알약을 달던 것이다. 2026-08-18 에 둘러보기 탭(S04)과 S13
   전체보기에서 먼저 껐고 — 두 화면 다 축제를 맡는 자리가 따로 있으며([전체보기] → S12)
   서른몇 줄 중 여섯에만 붙는 배지는 **그 여섯 줄을 다른 종류처럼** 보이게 할 뿐이었다 —
   S03-E 하나만 남겨 두었다. "가볼 만한 상점가"에는 축제 섹션이 없으니 그 배지가 "왜
   저기로 가나"의 유일한 답이라는 이유였다.

   **그 하나도 껐다** (2026-08-25, 사용자 요청). 남겨 둔 근거는 이 줄에서 축제를 알리는
   값이 있다는 것이었지, **그 모양이어야 한다**는 것이 아니었다. 눌리지 않는데 알약이라
   같은 화면의 칩(필터)과 같은 것으로 읽히는 문제는 S03-E 에서도 그대로였고, 화면 하나에만
   남은 표시는 다른 화면에서 본 적 없는 것이라 오히려 더 낯설다.

   켜는 곳이 없어져 프로퍼티째 지웠다 — 쓰지 않는 갈래는 아무도 눌러보지 않은 채 남는다.
   `district.festival` 값 자체는 그대로다 (축제 목록·상세가 읽는다).

   ── external ───────────────────────────────────────────────────────────────
   줄을 누르면 용인시 누리집의 그 상점가 안내 페이지로 나간다 (2026-08-18).
   우리에게는 다른 상점가의 점포 목록도 지도도 없다 — 있는 것은 이름·규모·거리뿐이라
   앱 안에서 열어봐야 이 줄에 이미 적힌 것을 한 번 더 보게 된다. 상점가 소개·연혁·연락처는
   시가 이미 관리하고 있으므로 그리로 보낸다 (축제 상세의 "주최 상점가" 줄과 같은 판단).

   **바깥으로 나간다는 것을 숨기지 않는다** — 새 창으로 열고, 꺾쇠 앞에 "상세 페이지"라고
   작게 적고, 보조기기에는 aria-label 로 한 번 더 말한다. 같은 앱 안의 화면인 줄 알고
   눌렀다가 브라우저가 바뀌면 되돌아오는 길을 스스로 찾아야 한다.

   ── 주소가 없어도 줄은 그대로다 (2026-08-24) ────────────────────────────────
   전에는 `homepage` 가 비면 [상세 페이지] 이름표가 사라지고 아무 데도 가지 않는 꺾쇠만
   남았다. 그런데 **줄마다 갈 수 있고 없고가 다르면 목록이 고르지 않게 보인다** — 서른두
   줄 중 하나만 이름표가 없으면 시민은 그 상점가에 무언가 빠졌다고 읽는다. 관리자가 그
   칸을 비우는 이유는 대개 아직 페이지가 없어서인데, 그 사정이 이런 모양으로 나갈 이유가
   없다.

   그래서 external 이면 **이름표와 꺾쇠를 언제나** 세운다. 주소가 있으면 지금까지처럼
   바깥으로 나가고, 없으면 `onClick` 으로 앱 안의 안내 화면을 연다 (S13-S 준비 중 안내).
   나가는 줄에는 onClick 을 달지 않는다 — 앵커가 새 창을 여는데 해시까지 바뀌면 돌아왔을
   때 열어본 적 없는 화면이 덮여 있다. */
export function DistrictRow({ district, onClick, selected = false, divider = true,
  external = false, style, ...rest }) {
  const d = district;
  /* 거리 0 은 "0m"가 아니라 지금 서 있는 곳이다 (S13 전체 목록에는 현재 상점가도 들어간다).
     축제 목록의 같은 자리와 문구를 맞춘다 — 두 목록이 같은 사실을 다르게 말할 이유가 없다 */
  const km = d.dist === 0 ? "지금 계신 곳"
    : d.dist >= 1000 ? `${(d.dist / 1000).toFixed(1)}km` : `${d.dist}m`;
  const href = external && d.homepage ? d.homepage : null;

  return (
    <ListRow
      /* 나가는 줄에는 onClick 을 달지 않는다 (위 머리말) — ListRow 는 href 가 있어도
         onClick 을 함께 붙이므로, 그대로 두면 새 창이 뜨는 동시에 해시가 바뀐다 */
      onClick={href ? undefined : onClick}
      href={href}
      aria-label={href ? `${d.name} 상세 페이지 — 용인시 누리집에서 새 창으로 열림` : undefined}
      divider={divider}
      /* 아이콘 색이 배지에 따라 갈렸다 (2026-08-25 없앰) — 배지 없이 색만 남기면
         이름표 없는 색 신호가 되어 색으로만 뜻을 전하는 꼴이 된다. 배지가 없어졌으므로
         색도 한 가지다 */
      icon={<Icon name="store" size={22} color="var(--text-muted)" />}
      title={d.name}
      meta={<>
        {d.gu} {d.area} · {km}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginLeft: 6 }}>
          점포 {d.stores}곳
          {/* 온누리 가맹수를 모르는 곳이 있다 (시 안내에 그 수가 없다). 0 곳으로 적으면
              "가맹점이 없다"는 다른 말이 되므로, 모를 때는 배지째 내린다 */}
          {d.onnuri != null ? <>
            <OnnuriBadge size="sm" />
            {d.onnuri}곳
          </> : null}
        </span>
      </>}
      /* external 이면 꺾쇠 앞에 이름표를 붙인다. 꺾쇠 하나로는 앱 안의 다른 줄들과
         구분되지 않아, 새 창이 뜨고 나서야 나갔다는 것을 알게 된다.
         **주소가 없는 줄에도 붙인다** — 위 머리말 참조. 그 줄은 앱 안의 안내로 간다 */
      trailing={external ? (
        <span style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 2, marginTop: 3 }}>
          <span style={{ fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>상세 페이지</span>
          <Icon name="chevron-right" size={20} color="var(--yong-ink-300)" />
        </span>
      ) : "chevron"}
      /* 지도에서 상점가 마커를 탭했을 때 목록의 같은 줄이 함께 켜진다 (점포·시설과 같은 규칙) */
      style={selected
        ? { background: "var(--surface-selected)", borderRadius: "var(--radius-sm)",
            paddingLeft: "var(--space-2)", paddingRight: "var(--space-2)", ...style }
        : style}
      {...rest} />
  );
}
