import React from "react";
import { Input } from "../core/Input.jsx";
import { Icon } from "../core/Icon.jsx";

/* 검색해서 고르는 칸 — 선택지가 많을 때 `Select` 대신 쓴다.
 *
 * ── 왜 고르개(select)로는 안 되는가 ─────────────────────────────────────────
 * 골목 한바퀴 코스의 들르는 곳을 고르는 자리에서 처음 필요해졌다 (2026-08-25, 사용자 요청).
 * 한 상점가의 점포가 **335곳**이라, 그것을 `<select>` 하나에 넣으면 담당자가 「가온김밥」을
 * 찾으려고 목록을 손가락으로 훑는다. 브라우저의 기본 고르개에도 글자를 치면 뛰는 기능이
 * 있지만 **첫 글자부터 정확히 맞아야 하고**, 「김밥」으로는 아무 데도 가지 않는다.
 * 담당자가 아는 것은 대개 상호의 한 토막이다.
 *
 * ── 세 가지를 지킨다 ────────────────────────────────────────────────────────
 *   1. **가운데 토막으로도 찾는다.** 「김밥」 · 「본점」 · 「분식」. 앞에서부터가 아니라
 *      들어 있으면 걸린다
 *   2. **고른 뒤에는 고른 것이 보인다.** 검색어가 아니라 **고른 이름**이 칸에 남는다 —
 *      검색어가 남아 있으면 그것이 값인지 찾던 말인지 알 수 없다
 *   3. **많으면 몇이 남았는지 적는다.** 목록을 잘라 놓고 아무 말도 없으면 담당자는
 *      찾는 것이 없다고 읽는다
 *
 * ── 칸 아래로 펼친다. 다이얼로그를 띄우지 않는다 ────────────────────────────
 * 이 칸이 서는 자리가 이미 다이얼로그(Modal) 안이다. 그 위에 또 다이얼로그를 얹으면 ESC 가
 * 둘을 한꺼번에 닫고 포커스 가둠도 서로 싸운다 — `AddressField` 가 검색창을 패널로 편
 * 것과 같은 이유이고, `Repeater` 의 줄 삭제 확인이 상자를 겹치지 않는 것과도 같다.
 *
 * ── 목록은 흐름 밖에 띄운다 ─────────────────────────────────────────────────
 * `AddressField` 의 검색 패널은 칸 아래 흐름 안에 서서 폼을 밀어낸다. 저기는 칸 하나가
 * 여는 패널이라 그래도 되지만, 여기는 **목록의 줄마다** 있는 칸이다. 흐름 안에 두면 셋째
 * 줄의 목록이 넷째·다섯째 줄을 아래로 밀어 그 줄들이 화면 밖으로 나간다.
 *
 * ── 고를 수 없는 줄을 **감추지 않고 적는다** (2026-08-26) ────────────────────
 * 선택지에 `disabled` 와 `note` 를 열었다. QR ID 를 고르는 자리에서 처음 필요해졌다 —
 * 50개 중 이미 다른 지점에 걸린 ID 는 고를 수 없는데, 목록에서 **빼 버리면** 그 ID 가
 * 인쇄된 안내판을 손에 든 담당자가 검색해 놓고 「찾는 것이 없습니다」를 읽는다. 없는 것과
 * 이미 쓰는 것은 할 일이 다르다 — 앞은 잘못 읽은 것이고, 뒤는 **다른 안내판을 집어야**
 * 한다. 그래서 줄은 남기고, 오른쪽에 왜 못 고르는지를 적는다 (`note`).
 *
 * 고를 수 없는 줄은 **뒤로 보내지 않는다** — 순서는 넘겨준 쪽이 정한다. 다 걸린 목록에서
 * 고를 수 있는 몇 개가 잘려 안 보이는 일이 생기므로, 그것을 아는 쪽(화면)이 고를 수 있는
 * 것을 앞에 세워 넘긴다. 여기서 정렬하면 넘겨준 차례가 뜻을 갖는 목록(코스의 점포)이
 * 제멋대로 섞인다.
 */

/* 한 번에 보여주는 줄 수. 넘으면 아래에 몇이 더 있는지 적는다.
   10 은 스크롤 없이 한눈에 들어오는 수이자, 「더 적어 보라」고 말하기에 이른 수가 아니다. */
const MAX_SHOWN = 10;

/* 빈 값(「— 고르지 않음 —」 같은 첫 줄)은 검색 대상이 아니다. 목록을 좁히려고 글자를 친
   사람에게 「고르지 않음」이 걸려 나오면 그것도 하나의 후보처럼 보인다. */
const real = o => o && o.value !== "" && o.value != null;

export function OptionPicker({
  options = [], value, onChange,
  placeholder = "이름을 입력해 찾습니다", emptyText = "찾는 이름이 없습니다.",
  /* 잘린 뒤에 적는 한 마디. 기본은 상호를 찾는 자리의 말이라, 고르는 것이 이름이 아닌
     자리(QR ID)에서는 화면이 바꿔 넘긴다 */
  moreHint = "이름을 더 적어 보세요.",
  ariaLabel, disabled, style, ...rest
}) {
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");
  /* 키보드로 짚고 있는 줄. 마우스 없이도 고를 수 있어야 한다 */
  const [active, setActive] = React.useState(0);
  const boxRef = React.useRef(null);
  const listRef = React.useRef(null);

  const chosen = options.find(o => String(o.value) === String(value == null ? "" : value));
  const chosenLabel = chosen && real(chosen) ? chosen.label : "";

  /* 검색은 **들어 있으면 걸린다**. 공백은 지우고 견준다 — 담당자가 「가온 김밥」이라고
     띄어 쳐도 「가온김밥」이 나와야 한다 (상호의 띄어쓰기는 자료마다 다르다) */
  const norm = s => String(s || "").replace(/\s+/g, "").toLowerCase();
  const matched = React.useMemo(() => {
    const list = options.filter(real);
    const q = norm(term);
    return q ? list.filter(o => norm(o.label).includes(q)) : list;
  }, [options, term]);

  const shown = matched.slice(0, MAX_SHOWN);
  const rest_ = matched.length - shown.length;

  /* 짚을 수 있는 첫 줄. 못 고르는 줄에 짚개가 앉으면 Enter 가 아무 일도 하지 않는데,
     화면에는 그 줄이 강조되어 있어 눌리지 않는 이유가 보이지 않는다 */
  const nextActive = (from, d) => {
    for (let i = from; i >= 0 && i < shown.length; i += d) if (!shown[i].disabled) return i;
    return -1;
  };
  const firstPickable = Math.max(shown.findIndex(o => !o.disabled), 0);

  /* 밖을 누르면 닫는다. 닫을 때 검색어를 비우는 것이 요점이다 — 다시 열었을 때 지난번
     검색어가 남아 있으면 그때 걸러진 목록이 전부인 줄로 읽는다 */
  const close = React.useCallback(() => { setOpen(false); setTerm(""); setActive(0); }, []);
  React.useEffect(() => {
    if (!open) return undefined;
    const onDown = e => { if (boxRef.current && !boxRef.current.contains(e.target)) close(); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  /* 짚고 있는 줄이 잘려 보이지 않으면 스크롤한다 — 키보드로 내려가는 사람에게 목록이
     따라오지 않으면 지금 어디 있는지 알 수 없다 */
  React.useEffect(() => {
    const el = listRef.current && listRef.current.children[active];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  /* 목록이 갈릴 때마다(검색어 · 넘어온 선택지) 짚개를 고를 수 있는 첫 줄로 되돌린다.
     `matched` 는 memo 라 실제로 목록이 바뀔 때만 도는데, 화살표로 옮긴 자리는 그대로 남는다 */
  React.useEffect(() => { setActive(firstPickable); }, [matched, open]);   // eslint-disable-line react-hooks/exhaustive-deps

  const pick = o => { if (o.disabled) return; if (onChange) onChange(o.value); close(); };

  const onKeyDown = e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      const d = e.key === "ArrowDown" ? 1 : -1;
      setActive(i => { const n = nextActive(i + d, d); return n < 0 ? i : n; });
      return;
    }
    if (e.key === "Enter") {
      /* 폼 안이다 — 막지 않으면 저장이 눌린다 */
      e.preventDefault();
      if (open && shown[active]) pick(shown[active]);
      else setOpen(true);
      return;
    }
    if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); close(); }
  };

  return (
    <div ref={boxRef} style={{ position: "relative", minWidth: 0, ...style }} {...rest}>
      {/* 칸에 보이는 글자가 둘이다: 닫혀 있으면 **고른 이름**, 열려 있으면 **검색어**.
          고른 것이 있는데 검색어가 비어 있으면 흐린 글씨로 고른 이름을 되비쳐 준다 —
          열자마자 칸이 비어 보이면 방금 고른 것이 지워진 줄 안다 */}
      <Input
        value={open ? term : chosenLabel}
        placeholder={open ? (chosenLabel || placeholder) : placeholder}
        aria-label={ariaLabel}
        role="combobox" aria-expanded={open} aria-autocomplete="list"
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={e => { setTerm(e.target.value); setActive(0); if (!open) setOpen(true); }}
        onKeyDown={onKeyDown} />

      {/* 고른 것이 있으면 지우는 단추. 없으면 돋보기 — 이 칸이 **검색해서 고르는 칸**이라는
          것을 닫혀 있을 때도 말한다 */}
      {!disabled ? (
        chosenLabel && !open ? (
          <button type="button" aria-label="고른 항목 지우기"
            onClick={() => { if (onChange) onChange(""); }}
            style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
              display: "inline-flex", padding: 4, background: "none", border: "none",
              cursor: "pointer", color: "var(--text-muted)" }}>
            <Icon name="x" size={15} />
          </button>
        ) : (
          <span aria-hidden="true" style={{ position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)", display: "inline-flex", color: "var(--text-muted)",
            pointerEvents: "none" }}>
            <Icon name="search" size={15} />
          </span>
        )
      ) : null}

      {/* ── z 는 **표에 있는 값**이다 (2026-08-26) ──────────────────────────────
          아래 목록에 임의로 정한 `5` 가 박혀 있었고, 그래서 관리자 폼에서 **목록의
          아랫부분이 지도 밑으로 들어가 잘렸다** — 좌표 지도가 폼의 한 칸으로 들어앉아
          있는데 그 뿌리가 z 100(`--z-map`), 그 위의 [핀 위치로 이동]이 z 400
          (`--z-float`)이다. 표 밖의 값을 쓰면 그 규칙 안에서 겨룰 수가 없다
          (layers.css 머리말). 같은 판에서 지도 칸이 자기 층을 폼 밖으로 흘리지 않게
          막았다 (CoordField 의 `zIndex:0`) */}
      {open ? (
        <div style={{ position: "absolute", zIndex: "var(--z-popover)", left: 0, right: 0, top: "calc(100% + 4px)",
          background: "var(--surface-card)", borderRadius: "var(--radius-md)",
          border: "var(--stroke-hairline) solid var(--border-strong)",
          boxShadow: "var(--shadow-raised)", overflow: "hidden" }}>
          {shown.length ? (
            <ul ref={listRef} role="listbox" style={{ listStyle: "none", margin: 0, padding: 4,
              maxHeight: 240, overflowY: "auto" }}>
              {shown.map((o, i) => {
                const off = !!o.disabled;
                const on = i === active && !off;
                const isChosen = String(o.value) === String(value);
                return (
                  <li key={o.value} role="option" aria-selected={isChosen} aria-disabled={off || undefined}>
                    <button type="button" disabled={off}
                      /* 포인터가 눌리는 순간 위 바깥 클릭 감지가 먼저 닫아 버리지 않도록
                         `pointerdown` 에서 막는다 — 그 리스너도 pointerdown 이다 */
                      onPointerDown={e => e.preventDefault()}
                      onMouseEnter={() => { if (!off) setActive(i); }}
                      onClick={() => pick(o)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "var(--space-3)",
                        textAlign: "left", cursor: off ? "default" : "pointer",
                        minHeight: 34, padding: "6px 10px", borderRadius: "var(--radius-sm)",
                        border: "none", background: on ? "var(--brand-primary-tint)" : "transparent",
                        fontFamily: "var(--font-sans)", fontSize: "var(--fs-label)",
                        fontWeight: isChosen ? "var(--fw-semibold)" : "var(--fw-regular)",
                        color: off ? "var(--text-muted)" : "var(--text-body)" }}>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>
                      {/* 못 고르는 줄에 **왜**를 적는다 (머리말). 고를 수 있는 줄에도 붙일 수
                          있지만 지금 쓰는 자리는 없다 — 오른쪽 끝, 흐린 작은 글씨다 */}
                      {o.note ? (
                        <span style={{ flex: "0 1 auto", maxWidth: "60%", overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap",
                          fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>{o.note}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ padding: "10px 12px", fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
              {options.filter(real).length ? emptyText : "고를 수 있는 항목이 없습니다."}
            </p>
          )}

          {/* 잘라 놓고 아무 말도 하지 않으면 담당자는 이것이 전부인 줄 안다 */}
          {rest_ > 0 ? (
            <p style={{ padding: "6px 12px 8px", borderTop: "var(--stroke-hairline) solid var(--border-default)",
              fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>
              {rest_.toLocaleString("ko-KR")}개 더 있습니다. {moreHint}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default OptionPicker;
