import React from "react";
import { Icon } from "../core/Icon.jsx";
import { VisuallyHidden } from "../core/VisuallyHidden.jsx";

/* 관리자 데이터 표 — 목록 화면 여섯 개가 전부 이것을 쓴다.
 *
 * 열은 배열로 선언한다:
 *   { key, label, width, align, render(row), sortable, sortValue(row) }
 *
 * ── 열 이름 아래에 설명을 달지 않는다 (2026-08-20) ──────────────────────────
 * `hint` 를 두어 열 이름 밑에 작은 글씨를 한 줄 붙일 수 있었다 ("원천 분류" · "노출 상태
 * 기준" · "자동 판정"). 없앴다 — 목록의 머리줄은 **어느 칸이 무엇인지 가리키는 자리**이지
 * 그 값이 어디서 왔는지 설명하는 자리가 아니다. 열 여덟에 설명이 여덟이면 머리줄이 두 배로
 * 두꺼워지고, 정작 훑어야 하는 것은 그 아래 스무 줄이다. 설명이 꼭 필요한 값이면 열 이름을
 * 그렇게 짓는다 (「업종 칩」 · 「상권업종대분류명」).
 *
 * ── 진짜 <table> 을 쓴다 ────────────────────────────────────────────────────
 * div + grid 로 흉내내면 스크린리더에게 그냥 글자 더미가 된다. 표는 "이 값이 어느 열의
 * 것인가"가 의미의 전부라, 담당자가 화면을 읽어주는 도구를 쓴다면 그 관계가 남아야 한다.
 * <th scope="col"> 이 그 관계를 만든다.
 *
 * ── 행 전체를 누르게 만들지 않는다 ──────────────────────────────────────────
 * <tr onClick> 은 키보드로 갈 수 없고 스크린리더에도 눌린다는 사실이 전해지지 않는다.
 * onRowClick 을 주면 **첫 열의 내용을 버튼으로 감싼다** — 담당자가 실제로 누르는 것도
 * 언제나 이름 칸이고, 탭 키로 목록을 훑을 때 행마다 정지점이 하나씩 생긴다.
 *
 * ── 정렬은 안에서 갖는다 ────────────────────────────────────────────────────
 * 필터는 화면이 갖고(무엇을 보여줄지는 화면의 일이다) 정렬은 표가 갖는다(어떻게 늘어놓을지는
 * 표의 일이다). 화면마다 sort 상태를 들고 다니면 여섯 화면에 같은 코드가 여섯 번 생긴다.
 * 기본 차례는 넘겨받은 배열 그대로다 — 화면이 정한 차례(가까운 순 등)를 표가 덮지 않는다.
 *
 * ── 고정 높이 없음 ──────────────────────────────────────────────────────────
 * --table-row-min 은 최소 높이다. 상호명이 길어 두 줄이 되는 점포가 실제로 있고,
 * 2차 글자 확대에서는 모든 행이 그렇게 된다 (U-CM-14).
 *
 * 그 최소 높이를 **`height` 로 준다** (2026-08-20). `min-height` 는 표의 칸에 적용되지
 * 않는다 — CSS 는 `display: table-cell` 에서 그 속성을 무시하고, 대신 `height` 를 최소
 * 높이로 읽는다. 그래서 지금까지 52px 은 아무 일도 하지 않았고 행 높이는 내용이 정했다.
 * 배지가 든 칸과 글자만 든 칸이 1~2px 씩 어긋났고, 대시보드처럼 표 둘을 나란히 놓으면
 * 줄이 서로 맞지 않았다. `height` 로 바꾸면 52px 이 바닥이 되고 내용이 넘치면 그만큼
 * 늘어난다 — 원래 이 토큰이 하려던 일이다.
 */

/* ── 칸 안에 여럿을 나란히 놓을 때 ───────────────────────────────────────────
   이름 옆에 배지, 유형 앞에 아이콘 — 목록 화면 여섯 곳이 전부 같은 줄을 손으로 적고
   있었고(`display:inline-flex, gap:6`), 그러다 보니 두 화면에만 whiteSpace:nowrap 이
   붙는 식으로 조금씩 갈렸다. Toolbar 를 나눈 이유와 같다.

   여기서 정하는 것은 **감싼다**는 사실 하나다. 배지는 통째로만 서므로(Badge 가 nowrap),
   "둔전 프레시마트 본점 [현재][숨김]" 이 200px 칸에 안 들어가면 감싸지 않는 한 배지가
   옆 칸 위로 넘어간다. 감싸면 배지가 아랫줄로 내려갈 뿐 아무것도 잘리지 않는다 —
   표의 행 높이는 min-height 라 한 줄 늘어나는 것을 이미 받아들인다 (U-CM-14).

   rowGap 이 gap 보다 좁은 것은 일부러다. 두 줄이 된 것이 **한 칸의 내용**으로 보여야지
   위아래로 벌어지면 다른 행처럼 읽힌다. */
export function Cell({ children, align, style, ...rest }) {
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", alignItems: "center",
      justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : undefined,
      gap: 6, rowGap: 3, ...style }} {...rest}>
      {children}
    </span>
  );
}

/* 기본 비교 — 숫자는 숫자로, 글자는 한국어 사전 순.
   섞여 있으면(값이 비었을 때) 빈 값을 언제나 뒤로 보낸다. 정렬을 눌렀을 때
   "값 없음"이 맨 위를 차지하면 정렬한 이유가 사라진다. */
function compare(a, b) {
  const ea = a == null || a === "";
  const eb = b == null || b === "";
  if (ea || eb) return ea && eb ? 0 : ea ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return (a ? 1 : 0) - (b ? 1 : 0);
  return String(a).localeCompare(String(b), "ko");
}

function SortButton({ col, sort, onSort }) {
  const active = sort && sort.key === col.key;
  const dir = active ? sort.dir : null;
  return (
    <button type="button" onClick={() => onSort(col.key)}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: "var(--tap-min)",
        margin: "calc(var(--space-2) * -1) calc(var(--space-1) * -1)", padding: "0 var(--space-1)",
        background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-label)", fontWeight: "var(--fw-bold)",
        color: active ? "var(--brand-primary)" : "var(--text-heading)" }}>
      {col.label}
      <Icon name={dir === "desc" ? "arrow-down" : dir === "asc" ? "arrow-up" : "chevrons-up-down"}
        size={14} color={active ? "var(--brand-primary)" : "var(--yong-ink-300)"} />
      <VisuallyHidden>{active ? (dir === "asc" ? "오름차순 정렬됨" : "내림차순 정렬됨") : "정렬하려면 누르세요"}</VisuallyHidden>
    </button>
  );
}

/* ── 행 선택 (목록 화면 공통 규격) ────────────────────────────────────────────
   명세서 1장: "체크박스 다중 선택 후 일괄 처리". 선택은 표가 갖지 않고 **화면이 갖는다** —
   무엇을 일괄로 할 수 있는지는 화면마다 다르고(검수 큐는 상태 변경, 점포는 노출 토글),
   선택한 것을 가지고 무엇을 할지 아는 것도 화면이다. 표는 켜고 끄는 자리만 낸다.

   selectable 을 주지 않은 표에는 체크박스 열이 아예 생기지 않는다 — 대시보드의 순위표처럼
   고를 이유가 없는 표에 빈 열이 서면 담당자는 그것이 고장인지 묻는다. */
export function DataTable({
  columns = [], rows = [], rowKey = "id",
  onRowClick,
  selectable = false,
  selected = [],                       /* 선택된 행의 key 배열 */
  onSelectedChange,
  empty,                               /* { title, description } 또는 노드 */
  caption,                             /* 스크린리더용 표 이름 — 화면에는 안 보인다 */
  rowTone,                             /* row => "danger" | "warning" | null. 강조가 필요한 줄 */
  /* ── `fixed` — 열 폭을 적은 그대로 쓴다 (2026-08-26 신설) ────────────────────
     기본은 브라우저 기본값(`table-layout: auto`)이라 `col.width` 가 **제안**일 뿐이고,
     실제 폭은 그 열에 들어간 가장 긴 값이 정한다. 대부분의 표에서는 그 편이 낫다 —
     이름이 긴 줄 하나 때문에 열이 넓어지는 것이 잘리는 것보다 낫다.

     `fixed` 를 켜면 적은 폭이 그대로 서고, **폭을 적지 않은 열이 남는 자리를 전부
     가져간다.** 그 열의 칸 안에서 `width:100%` + `text-overflow: ellipsis` 가 비로소
     제대로 돈다 — auto 에서는 칸의 폭이 내용에서 나오므로 「칸에 맞춰 자르기」가
     순환 참조가 되어, 화면마다 다른 폭에서 잘리게 하려면 상수를 박는 수밖에 없다
     (오류신고의 「내용」 열이 320px 상수로 잘리고 있었다 — 1920px 화면에서 그 열은
     700px 이 넘는데 글자는 320px 에서 끊겼다).

     대신 좁은 화면에서 그 열이 한없이 줄어들지 않게 **최소 폭을 함께 잡는다**:
     적힌 폭의 합 + 폭 없는 열마다 `FLEX_MIN`. 그보다 좁아지면 표가 가로로 스크롤된다
     (바깥 상자가 이미 `overflow-x: auto` 다). */
  fixed = false,
  /* ── `fit` 이 여기 있었다 (2026-08-26 신설 → 2026-08-27 삭제) ──────────────────
     표를 자기 내용 너비에 맞춰 세우고 바깥 상자도 함께 줄이던 플래그다. 쓰는 자리는
     대시보드의 「조회수 상위 점포」 하나였는데 — 열이 넷뿐이라 남는 자리를 상호명 열이
     통째로 먹던 표다 — **그 표가 열 여섯이 되면서 손님이 없어졌다.**

     남는 한 줄: 열이 서넛뿐인 표가 화면 폭에서 흩어져 보이면, **표를 줄이기 전에 그
     자리에 담당자가 읽을 것이 빠져 있지 않은지** 먼저 본다. 줄이면 오른쪽 절반이 비고,
     빈 절반은 「알맞게 선 표」가 아니라 「무언가 빠진 자리」로 읽힌다. */
  style, ...rest
}) {
  const [sort, setSort] = React.useState(null);
  const keyOf = React.useCallback(
    row => (typeof rowKey === "function" ? rowKey(row) : row[rowKey]), [rowKey]);

  const toggleSort = key => {
    setSort(cur => (cur && cur.key === key
      ? (cur.dir === "asc" ? { key, dir: "desc" } : null)   /* 오름 → 내림 → 원래 차례 */
      : { key, dir: "asc" }));
  };

  const ordered = React.useMemo(() => {
    if (!sort) return rows;
    const col = columns.find(c => c.key === sort.key);
    if (!col) return rows;
    const value = col.sortValue || (row => row[col.key]);
    /* 원본 배열을 뒤집지 않는다 — 화면이 넘긴 배열은 화면의 것이다 */
    const out = rows.slice().sort((a, b) => compare(value(a), value(b)));
    return sort.dir === "desc" ? out.reverse() : out;
  }, [rows, sort, columns]);

  const cellPad = "var(--space-3) var(--space-4)";

  /* 폭 없는 열이 좁은 화면에서 실 한 오라기가 되지 않게 잡는 하한. 240 은 「내용」 열에서
     열 몇 자가 잘리기 전에 읽히는 폭이다 — 그보다 좁으면 잘린 글자가 뜻을 이루지 못한다 */
  const FLEX_MIN = 240;
  const minWidth = fixed
    ? columns.reduce((n, c) => n + (Number(c.width) || FLEX_MIN), selectable ? 44 : 0)
    : undefined;

  /* 머리 체크박스는 **지금 화면에 보이는 행**만 다룬다. 필터가 걸린 상태에서 전체를 켜면
     보이지 않는 행까지 선택되어, 그 다음 [일괄 처리]가 담당자가 못 본 것에 손을 댄다. */
  const shownKeys = ordered.map(keyOf);
  const allOn = shownKeys.length > 0 && shownKeys.every(k => selected.includes(k));
  const someOn = !allOn && shownKeys.some(k => selected.includes(k));
  const toggleAll = () => {
    if (!onSelectedChange) return;
    onSelectedChange(allOn ? selected.filter(k => !shownKeys.includes(k))
      : [...new Set(selected.concat(shownKeys))]);
  };
  const toggleOne = k => {
    if (!onSelectedChange) return;
    onSelectedChange(selected.includes(k) ? selected.filter(x => x !== k) : selected.concat(k));
  };

  /* 행 강조는 **tint(50단)** 를 쓴다. soft(100단)는 상자 하나가 쓰는 값이라, 표의 한 줄
     전체에 깔면 같은 색이 화면 폭만큼 늘어나 훨씬 진해 보인다 — 세 줄이 걸리면 표가
     통째로 붉어진다 (2026-08-20). 강조의 목적은 그 줄을 **찾게** 하는 것이지
     경고를 지르는 것이 아니다. 「3건 누적」 배지가 이유를 글자로 따로 적는다. */
  const TONE_BG = { danger: "var(--state-danger-tint)", warning: "var(--state-warning-tint)" };

  return (
    <div style={{ background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)",
      borderRadius: "var(--radius-lg)", overflow: "hidden", ...style }} {...rest}>
      {/* 가로 스크롤은 **이 상자 안에서만** 일어난다. 밖으로 새면 셸 전체가 흔들리고
          좌측 내비가 화면 밖으로 밀린다 (AdminShell 의 minWidth:0 주석 참조) */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)",
          tableLayout: fixed ? "fixed" : undefined, minWidth }}>
          {caption ? <caption style={{ position: "absolute", width: 1, height: 1, overflow: "hidden",
            clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{caption}</caption> : null}
          <thead>
            <tr style={{ background: "var(--surface-sunken)" }}>
              {selectable ? (
                <th scope="col" style={{ width: 44, padding: cellPad, textAlign: "center",
                  borderBottom: "var(--stroke-hairline) solid var(--border-default)" }}>
                  <input type="checkbox" checked={allOn}
                    ref={el => { if (el) el.indeterminate = someOn; }}
                    onChange={toggleAll} aria-label="보이는 행 모두 선택"
                    style={{ width: 18, height: 18, accentColor: "var(--brand-primary)", cursor: "pointer" }} />
                </th>
              ) : null}
              {columns.map(col => (
                <th key={col.key} scope="col"
                  aria-sort={sort && sort.key === col.key
                    ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  style={{ width: col.width, height: "var(--table-head-min)", padding: cellPad,
                    textAlign: col.align || "left", whiteSpace: "nowrap",
                    fontSize: "var(--fs-label)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)",
                    borderBottom: "var(--stroke-hairline) solid var(--border-default)" }}>
                  {col.sortable ? <SortButton col={col} sort={sort} onSort={toggleSort} /> : col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {ordered.map((row, i) => {
              const k = keyOf(row);
              const tone = rowTone ? rowTone(row) : null;
              return (
                <tr key={k} style={{
                  background: tone && TONE_BG[tone] ? TONE_BG[tone] : undefined,
                  borderTop: i === 0 ? "none" : "var(--stroke-hairline) solid var(--border-default)" }}>
                  {selectable ? (
                    <td style={{ padding: cellPad, textAlign: "center", verticalAlign: "middle" }}>
                      <input type="checkbox" checked={selected.includes(k)} onChange={() => toggleOne(k)}
                        aria-label={`${k} 선택`}
                        style={{ width: 18, height: 18, accentColor: "var(--brand-primary)", cursor: "pointer" }} />
                    </td>
                  ) : null}
                  {columns.map((col, ci) => {
                    const content = col.render ? col.render(row) : row[col.key];
                    /* 첫 열만 버튼이 된다 — 위 머리말의 "행 전체를 누르게 만들지 않는다" 참조 */
                    const asButton = ci === 0 && typeof onRowClick === "function";
                    return (
                      <td key={col.key} style={{ height: "var(--table-row-min)", padding: cellPad,
                        textAlign: col.align || "left", verticalAlign: "middle",
                        fontSize: "var(--fs-label)", color: "var(--text-body)", lineHeight: 1.5 }}>
                        {asButton ? (
                          <button type="button" onClick={() => onRowClick(row)}
                            style={{ display: "block", width: "100%", minHeight: 28, padding: 0, textAlign: "left",
                              background: "none", border: "none", cursor: "pointer",
                              fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)",
                              fontWeight: "var(--fw-semibold)", color: "var(--text-link)",
                              textDecorationLine: "underline", textDecorationColor: "transparent",
                              textUnderlineOffset: 3, transition: "text-decoration-color var(--dur-fast)" }}
                            onMouseEnter={e => { e.currentTarget.style.textDecorationColor = "currentColor"; }}
                            onMouseLeave={e => { e.currentTarget.style.textDecorationColor = "transparent"; }}>
                            {content}
                          </button>
                        ) : content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 빈 상태는 표 **바깥**이다. <tbody> 안에 colspan 으로 넣으면 열 수가 바뀔 때마다
          같이 고쳐야 하고, 무엇보다 "빈 표"가 아니라 "표가 없다"가 맞는 상태다 */}
      {ordered.length === 0 ? (
        <div style={{ padding: "var(--space-8) var(--space-5)", textAlign: "center" }}>
          {empty && empty.title ? (
            <>
              <p style={{ fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)" }}>
                {empty.title}
              </p>
              {empty.description ? (
                <p style={{ marginTop: 6, fontSize: "var(--fs-label)", color: "var(--text-muted)", lineHeight: 1.55 }}>
                  {empty.description}
                </p>
              ) : null}
            </>
          ) : (empty || (
            <p style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>결과가 없습니다.</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default DataTable;
