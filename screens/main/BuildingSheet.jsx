import React from "react";
import { ListRow, CategoryIcon, OnnuriBadge, Notice } from "../../design-systems/index.js";

/* 상점가 탭 — **건물 하나의 가게 목록, 층별** (2026-10-30, 사용자 요청).
 *
 * 동백이음길은 가게 227곳이 건물 12채에 몰려 있어, 가게마다 핀을 찍으면 한 건물 위에 핀이 수십 개 겹친다.
 * 그래서 지도는 건물마다 핀 하나(이름 + 가게 수)를 찍고(KakaoMap 의 `buildings`), 핀을 누르면 바텀시트가
 * 이 목록으로 바뀐다. 시트 제목이 건물명이다. 상점가 시트(홈형)로 돌아가는 길은 **같은 핀을 다시 누르거나 지도 빈 곳을
 * 누르는 것**이다(MainApp) — [닫기] 단추는 두지 않는다(2026-10-30, 사용자 요청).
 *
 * - **지금 걸린 조건(업종 칩 · 검색어 · 온누리)을 따른다** — 핀의 가게 수와 목록 줄 수가 같아야 한다.
 * - 층은 **1층부터 위로**, 지하는 맨 뒤다. 길에서 건물을 보고 들어가는 사람에게는 1층이 먼저다.
 *   「6·7층」처럼 여러 층을 쓰는 가게는 낮은 층에 선다.
 * - 줄을 누르면 가게 상세로 간다. 지도에는 건물 핀만 있어 가게를 「지도에서 켤」 자리가 없다.
 * - 거리를 적지 않는다 — 한 건물 안이라 모두 같다. 대신 업종을 적는다.
 * - 상인회 정회원 표시는 목록 줄에 두지 않는다(2026-10-30, 사용자 요청 — 한때 「함께가게」 배지가 있었다). 정회원은 가게 상세의 「이음길 함께가게」 배지가 말한다.
 */
/* 층 표기 — 「1층」→「1F」, 「6·7층」→「6·7F」, 「지하1층」→「B1F」 (2026-10-30, 사용자 요청). 자료는 받은 그대로 「층」이고 화면만 바꾼다 */
export const floorLabel = f => String(f).replace(/^지하\s*(\d+)층$/, "B$1F").replace(/층$/, "F");

const floorKey = f => {
  if (!f) return 999;
  const m = String(f).match(/\d+/);   /* 「2·3층」은 앞의 2 로 선다 */
  const n = m ? parseInt(m[0], 10) : 0;
  const multi = /·/.test(f) ? 0.5 : 0;   /* 같은 층의 단일 층 가게 뒤에 */
  return (/지하|B/.test(f) ? 500 + n : n) + multi;   /* 지하는 맨 뒤 */
};

export function BuildingSheet({ building, rows = [], onOpenStore }) {
  const groups = React.useMemo(() => {
    const by = new Map();
    rows.forEach(s => {
      const f = s.floor || "층 정보 없음";
      if (!by.has(f)) by.set(f, []);
      by.get(f).push(s);
    });
    return [...by.entries()].sort((a, b) => floorKey(a[0]) - floorKey(b[0]));
  }, [rows]);

  return (
    <div style={{ padding: "var(--space-1) var(--gutter-screen) var(--space-9)" }}>
      {/* 「주소 · 가게 n곳 · 함께가게 m곳」 줄을 뺐다 (2026-10-30, 사용자 요청) — 건물명은 시트 제목이, 가게 수는 지도 핀이 적는다 */}
      {rows.length === 0 ? <Notice tone="info">조건에 맞는 매장이 없습니다.</Notice> : groups.map(([floor, list]) => (
        <section key={floor} aria-label={floor /* 읽어 줄 때는 「1층」이 자연스럽다 */} style={{ marginTop: floor === groups[0][0] ? 0 : "var(--space-3)" }}>
          <h3 style={{ font: "var(--type-label)", color: "var(--text-heading)", padding: "var(--space-1) 0",
            borderBottom: "var(--stroke-hairline) solid var(--border-default)" }}>{floorLabel(floor)}</h3>
          <div role="list">
            {list.map((s, i) => (
              <ListRow key={s.id} role="listitem" divider={i < list.length - 1}
                icon={<CategoryIcon type={s.cat} size={22} />}
                title={s.name}
                tag={<>
                  {s.onnuri ? <OnnuriBadge size="sm" /> : null}
                </>}
                meta={s.biz}
                onClick={() => onOpenStore(s)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
