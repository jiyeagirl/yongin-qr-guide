import React from "react";
import { Icon } from "./Icon.jsx";

/* 쪽 넘기기 (2026-08-18 신설).
 *
 *   ‹   1  …  9  …  17   ›
 *
 * ── 왜 무한 스크롤을 걷어내고 이것을 두나 ─────────────────────────────────
 * 점포 335곳을 스크롤로만 내려가면 **끝이 없다.** 어디쯤 왔는지도, 얼마나 남았는지도
 * 알 수 없고, 한 번 내려간 뒤에는 처음으로 돌아가려면 손가락으로 그만큼을 되감아야 한다.
 * 쪽으로 끊으면 목록에 끝이 생기고, 지금 어디인지가 숫자로 읽히며, [1]이 늘 손 닿는 곳에 있다.
 *
 * ── 숫자를 셋만 보여준다 ──────────────────────────────────────────────────
 * 첫 쪽 · 지금 쪽 · 마지막 쪽. 사이는 …로 접는다. 이웃 쪽으로는 화살표가 데려간다.
 *
 * 다섯을 보여주는 흔한 꼴([1][…][8][9][10][…][17])을 쓰지 않은 이유는 **손가락 자리** 때문이다.
 * 단추 하나가 44px(--tap-min)이어야 하는데(U-CM-13), 360px 화면에서 쓸 수 있는 폭은
 * 320px 이라 44px 짜리 일곱 개가 들어가지 않는다. 폭을 줄여 다섯을 넣느니 셋을 제대로 만든다.
 *
 *     화살표 2 × 44 + 숫자 3 × 44 + … 2 × 24 = 268px  ≤ 320px
 *
 * 쪽이 다섯 이하면 접지 않고 전부 보여준다 (2×44 + 5×44 = 308px 로 아직 들어간다).
 *
 * ── 쪽을 넘기면 목록 맨 위로 ──────────────────────────────────────────────
 * 이 컨트롤은 목록 **끝**에 있다. 여기서 [다음]을 누르면 새 쪽의 첫 줄이 아니라 끝줄 근처가
 * 열려, 방금 넘긴 쪽의 위쪽을 보지 못한 채 다시 올려야 한다. 스크롤을 되돌리는 일은 이
 * 컴포넌트가 하지 않는다 — 스크롤 컨테이너를 가진 쪽(Sheet · DetailPage 의 scrollKey)이 맡는다.
 * 여기서 하면 어느 조상이 스크롤되는지 DOM 을 뒤져야 하고, 화면마다 그 답이 다르다.
 */

/* 보여줄 쪽 번호. 사이가 벌어지면 그 자리에 문자열 하나를 끼워 …로 그린다. */
const SHOW_ALL_UNTIL = 5;
function pagesFor(page, count) {
  if (count <= SHOW_ALL_UNTIL) return Array.from({ length: count }, (_, i) => i + 1);
  const keep = [...new Set([1, page, count])].sort((a, b) => a - b);
  const out = [];
  keep.forEach((n, i) => {
    if (i > 0 && n - keep[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

const cell = {
  minWidth: "var(--tap-min)", minHeight: "var(--tap-min)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  background: "none", border: "none", borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)",
};

export function Pagination({ page = 1, pageCount = 1, onChange, label = "쪽 넘기기", style, ...rest }) {
  /* 한 쪽뿐이면 그리지 않는다. 넘길 곳이 없는데 화살표만 회색으로 서 있으면
     "여기서 뭔가 더 볼 수 있나" 하고 한 번 눌러보게 된다 */
  if (pageCount <= 1) return null;

  const go = n => { if (n >= 1 && n <= pageCount && n !== page && onChange) onChange(n); };
  const arrow = (to, icon, aria) => {
    const off = to < 1 || to > pageCount;
    return (
      <button type="button" onClick={() => go(to)} disabled={off} aria-label={aria}
        style={{ ...cell, cursor: off ? "default" : "pointer",
          color: off ? "var(--text-disabled)" : "var(--text-body)" }}>
        <Icon name={icon} size={20} />
      </button>
    );
  };

  return (
    <nav aria-label={label}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, ...style }} {...rest}>
      {arrow(page - 1, "chevron-left", "이전 쪽")}

      {pagesFor(page, pageCount).map(n => (typeof n === "string" ? (
        /* 접힌 자리. 누를 수 없으므로 단추가 아니고, 보조기기는 읽지 않는다 —
           "말줄임표"라고 읽어봐야 넘길 수 있는 쪽이 늘지 않는다 */
        <span key={n} aria-hidden="true"
          style={{ minWidth: 24, textAlign: "center", color: "var(--text-disabled)",
            fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)" }}>…</span>
      ) : (
        <button key={n} type="button" onClick={() => go(n)}
          /* 지금 쪽을 색으로만 알리지 않는다 — aria-current 로 읽히고, 굵기까지 달라진다 */
          aria-current={n === page ? "page" : undefined}
          aria-label={`${n}쪽${n === pageCount ? `, 마지막` : ""}`}
          style={{ ...cell, cursor: n === page ? "default" : "pointer",
            background: n === page ? "var(--brand-primary-soft)" : "none",
            color: n === page ? "var(--brand-primary-strong)" : "var(--text-body)",
            fontWeight: n === page ? "var(--fw-bold)" : "var(--fw-medium)" }}>
          {n}
        </button>
      )))}

      {arrow(page + 1, "chevron-right", "다음 쪽")}
    </nav>
  );
}

export default Pagination;
