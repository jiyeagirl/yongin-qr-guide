import React from "react";

/* 쪽 넘기기 (2026-08-18 신설).
 *
 *   1  2  3  …  17          1  …  8  9  10  …  17          1  …  15  16  17
 *
 * ── 왜 무한 스크롤을 걷어내고 이것을 두나 ─────────────────────────────────
 * 점포 335곳을 스크롤로만 내려가면 **끝이 없다.** 어디쯤 왔는지도, 얼마나 남았는지도
 * 알 수 없고, 한 번 내려간 뒤에는 처음으로 돌아가려면 손가락으로 그만큼을 되감아야 한다.
 * 쪽으로 끊으면 목록에 끝이 생기고, 지금 어디인지가 숫자로 읽히며, [1]이 늘 손 닿는 곳에 있다.
 *
 * ── 이웃 쪽은 늘 보인다 ───────────────────────────────────────────────────
 * 세 칸짜리 창(지금 쪽과 그 좌우)이 미끄러지고, 첫 쪽과 마지막 쪽은 언제나 양 끝에 못박혀
 * 있다. 사이가 벌어지면 …로 접는다. 1쪽에서 창이 왼쪽으로 잘리면 오른쪽으로 밀어 언제나
 * 세 칸을 채운다 — 1쪽에서 `1 2 … 17` 이 아니라 `1 2 3 … 17` 이 나오는 것은 그래서다.
 *
 * ── 화살표(‹ ›)를 두지 않았다 ─────────────────────────────────────────────
 * 이유가 둘인데 같은 곳으로 모인다.
 *
 *   쓸모   이웃 쪽이 늘 보이므로 "다음"은 이미 화면에 숫자로 있다. 9쪽에서 10을 누르는
 *          것과 ›를 누르는 것이 같은 일이면, 둘 중 하나는 자리만 차지한다.
 *   자리   단추 하나가 44px(--tap-min)여야 하고(U-CM-13) 360px 화면에서 쓸 수 있는 폭은
 *          320px 이다. 화살표를 넣으면 이웃 쪽을 보여줄 자리가 사라진다:
 *
 *            화살표 + 이웃 3개   ‹ 1 … 8 9 10 … 17 ›   364px   넘침
 *            화살표 없이 이웃 3개    1 … 8 9 10 … 17    272px   들어감
 *
 * 폭을 줄여 화살표를 끼워 넣는 길도 있었지만, 그러면 **44px 를 깎는 대신 중복을 사는** 셈이다.
 *
 * 쪽이 여섯 이하면 접지 않고 전부 보여준다 (6 × 44 = 274px 로 아직 들어간다).
 *
 * ── 쪽을 넘기면 목록 맨 위로 ──────────────────────────────────────────────
 * 이 컨트롤은 목록 **끝**에 있다. 여기서 다음 쪽을 누르면 새 쪽의 첫 줄이 아니라 끝줄 근처가
 * 열려, 방금 넘긴 쪽의 위쪽을 보지 못한 채 다시 올려야 한다. 스크롤을 되돌리는 일은 이
 * 컴포넌트가 하지 않는다 — 스크롤 컨테이너를 가진 쪽(Sheet · DetailPage 의 scrollKey)이 맡는다.
 * 여기서 하면 어느 조상이 스크롤되는지 DOM 을 뒤져야 하고, 화면마다 그 답이 다르다.
 */

/* 보여줄 쪽 번호. 사이가 벌어지면 그 자리에 문자열 하나를 끼워 …로 그린다. */
const SHOW_ALL_UNTIL = 6;
const WINDOW = 3;
function pagesFor(page, count) {
  if (count <= SHOW_ALL_UNTIL) return Array.from({ length: count }, (_, i) => i + 1);
  /* 창의 시작을 양 끝에서 안으로 밀어붙인다 — 가장자리에서도 세 칸이 그대로 나온다 */
  const start = Math.min(Math.max(page - 1, 1), count - WINDOW + 1);
  const near = Array.from({ length: WINDOW }, (_, i) => start + i);
  const keep = [...new Set([1, ...near, count])].sort((a, b) => a - b);
  const out = [];
  keep.forEach((n, i) => {
    if (i > 0 && n - keep[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

/* ── 누르는 자리와 칠하는 자리를 나눈다 (2026-08-18) ─────────────────────────
   단추는 44px(--tap-min) 그대로 두고, 색은 그 안의 30px 원에만 칠한다.
   전에는 단추 전체를 칠했는데 두 글자짜리 숫자에 44×44 짜리 색면이 붙어 **글자보다 칠이
   훨씬 컸다** — 목록 끝의 작은 컨트롤인데 화면에서 가장 큰 덩어리가 됐다.

   손가락 자리를 줄인 것이 아니다. 44px 는 그대로이고 눈에 보이는 것만 작아졌다 (U-CM-13).
   세 자리 쪽수(100쪽 이상)에서는 원이 알약으로 늘어난다 — radius 999 라 저절로 그렇다. */
const cell = {
  minWidth: "var(--tap-min)", minHeight: "var(--tap-min)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  padding: 0, background: "none", border: "none",
  fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)",
};
const disc = {
  minWidth: 30, height: 30, padding: "0 6px", borderRadius: 999,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};

export function Pagination({ page = 1, pageCount = 1, onChange, label = "쪽 넘기기", style, ...rest }) {
  /* 한 쪽뿐이면 그리지 않는다. 넘길 곳이 없는데 [1] 하나가 덩그러니 서 있으면
     "여기서 뭔가 더 볼 수 있나" 하고 한 번 눌러보게 된다 */
  if (pageCount <= 1) return null;

  const go = n => { if (n >= 1 && n <= pageCount && n !== page && onChange) onChange(n); };

  return (
    <nav aria-label={label}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, ...style }} {...rest}>
      {pagesFor(page, pageCount).map(n => (typeof n === "string" ? (
        /* 접힌 자리. 누를 수 없으므로 단추가 아니고, 보조기기는 읽지 않는다 —
           "말줄임표"라고 읽어봐야 넘길 수 있는 쪽이 늘지 않는다 */
        <span key={n} aria-hidden="true"
          style={{ minWidth: 20, textAlign: "center", color: "var(--text-disabled)",
            fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)" }}>…</span>
      ) : (
        <button key={n} type="button" onClick={() => go(n)}
          /* 지금 쪽을 색으로만 알리지 않는다 — aria-current 로 읽히고, 굵기까지 달라진다 */
          aria-current={n === page ? "page" : undefined}
          aria-label={`${n}쪽${n === pageCount ? `, 마지막` : ""}`}
          style={{ ...cell, cursor: n === page ? "default" : "pointer",
            color: n === page ? "var(--brand-primary-strong)" : "var(--text-body)",
            fontWeight: n === page ? "var(--fw-bold)" : "var(--fw-medium)" }}>
          {/* 칠은 이 원에만. 단추는 44px 그대로다 (위 disc 주석) */}
          <span style={{ ...disc, background: n === page ? "var(--brand-primary-soft)" : "none" }}>{n}</span>
        </button>
      )))}
    </nav>
  );
}

export default Pagination;
