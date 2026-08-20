import React from "react";
import { Chip } from "./Chip.jsx";
import { CategoryIcon } from "./CategoryIcon.jsx";
import { Icon } from "./Icon.jsx";

/* 업종 칩 필터 (U-ST-10) + 활성 필터 요약.
   기능명세서 5-3 #4 에서 정해야 했던 "상단 필터 바의 고정 범위"의 답:

     고정하는 것   업종 칩 한 줄 (+ 켜져 있을 때만 나타나는 활성 필터 pill 줄)
     고정하지 않는 것  검색창, 온누리 칩, 축제 배너, 신규·인기 매장

   셋 다 고정하면 시트 자체 헤더까지 더해 화면 상단 40% 가 필터로 찬다. 칩만 고정하면
   68px(2차 확대에도 min-height 로만 늘어난다)이고, 검색·토글은 시트를 조금만 내리면 다시 나온다.
   대신 스크롤로 사라진 필터가 켜져 있을 수 있으므로, 그 상태는 pill 로 칩 줄에 남긴다.
   ("결과가 왜 12곳뿐인가"에 답할 수 있어야 한다)

   sticky 는 시트의 스크롤 컨테이너 기준으로 붙는다 (position:sticky; top:0).

   renderIcon / label 은 같은 칩 줄을 다른 축에도 쓰기 위한 것이다.
   상점가 탭은 업종 7종(CategoryIcon), 공공시설 탭은 시설 4종(FacilityIcon)을 칩으로 쓴다 —
   생김새와 sticky 규칙은 같아야 하고 아이콘 체계만 달라야 한다 (5-2).

   ── 여럿 고르기 (2026-08-20) ───────────────────────────────────────────────
   `value` 에 **배열**을 주면 칩이 켜고 끄는 스위치가 된다. 문자열을 주면 예전처럼 하나만
   골린다 — 부르는 쪽이 축의 성질에 따라 고른다.

   배열 모드에서 **빈 배열은 "전체"** 다. 그래서 [전체] 칩을 따로 두지 않는다:

     자리    5종이면 [전체]까지 여섯 알약이 되어 좁은 화면에서 마지막 칩이 화면 밖으로
             밀렸다 (공공시설 탭의 [화장실]이 실제로 그랬다). 가로로 밀면 나오기는 하지만,
             **밀 수 있다는 것 자체가 보이지 않는다** — 없는 칩과 구별되지 않는다.
     뜻     여럿 고르기에서 [전체]는 칩이 아니라 **다른 종류의 동작**(모두 해제)이다.
             같은 줄에 같은 모양으로 서 있으면서 혼자 다르게 동작하는 알약이 된다.
     되돌리기 켠 칩을 다시 누르면 꺼진다. 전부 끄면 전체로 돌아오므로 길이 막히지 않는다.

   역할(role)도 함께 바뀐다. 하나만 고르는 줄은 tablist/tab 이지만, 여럿 고르는 줄에서
   그것은 틀린 이름이다 — 탭은 한 번에 하나만 선택되는 것을 뜻한다. 배열 모드에서는
   group + aria-pressed 로, 켜고 끄는 단추 묶음이라고 말한다. */
export function FilterBar({ chips = [], value, onChange, active = [], sticky = true, floating = false, leading,
  renderIcon, label = "업종 필터", gutter = "var(--gutter-screen)", style, ...rest }) {
  const icon = renderIcon || (c => <CategoryIcon type={c.id} size={15} />);

  const multi = Array.isArray(value);
  const isOn = id => (multi ? value.includes(id) : value === id);
  /* 배열 모드는 **다음 배열**을 돌려준다 — 부르는 쪽이 토글 규칙을 저마다 다시 적으면
     탭마다 다르게 동작한다 (한쪽만 "다시 누르면 꺼짐"이 되는 식으로) */
  const hit = id => {
    if (!onChange) return;
    onChange(multi ? (value.includes(id) ? value.filter(v => v !== id) : [...value, id]) : id);
  };
  return (
    <div style={{
      position: floating ? "static" : (sticky ? "sticky" : "static"), top: 0, zIndex: "var(--z-filter)",
      /* floating: 지도 위에 배경 패널 없이 알약만 띄운다. 패널을 깔면 지도가 그만큼 가려진다 */
      background: floating ? "transparent" : "rgba(255,255,255,.96)",
      backdropFilter: floating ? "none" : "var(--blur-glass)",
      borderBottom: floating ? "none" : "var(--stroke-hairline) solid var(--border-default)", ...style }} {...rest}>
      {/* 칩이 위아래 5px 씩 히트 여백을 이미 갖고 있으므로 바깥 여백은 최소로 둔다.
          leading 은 칩과 함께 흐르면 안 되는 것의 자리 — 스크롤 바깥에 고정된다.
          지금 여기 서는 것은 조아용 한 마리다 (MainApp). 한때 온누리 컨트롤이 이 자리를
          썼는데, 그것은 목록 위 제어 줄로 내려갔다 (ListControls · OnnuriChip) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: `2px ${gutter} var(--space-1)` }}>
        {leading ? <span style={{ flex: "0 0 auto", display: "inline-flex", paddingRight: 2 }}>{leading}</span> : null}
        <div role={multi ? "group" : "tablist"} aria-label={label}
          style={{ flex: 1, minWidth: 0, display: "flex", gap: 6,
            overflowX: "auto", padding: "5px 0", margin: "-5px 0", scrollbarWidth: "none" }}>
          {/* 해당 상점가에 0건인 칩은 숨긴다 (U-ST-10). 공공시설 탭에서도 같은 규칙이 통한다 —
              그 QR 지점 주변에 없는 시설 유형을 눌러 빈 결과를 보게 하지 않는다 */}
          {chips.filter(c => c.count > 0).map(c => (
            <Chip key={c.id} selected={isOn(c.id)} count={c.count} elevated={floating}
              role={multi ? undefined : "tab"}
              aria-selected={multi ? undefined : isOn(c.id)}
              aria-pressed={multi ? isOn(c.id) : undefined}
              icon={icon(c)} onClick={() => hit(c.id)}>{c.label}</Chip>
          ))}
        </div>
      </div>
      {active.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-2)",
          padding: "0 var(--gutter-screen) var(--space-2)" }}>
          <span style={{ fontSize: "var(--fs-micro)", fontWeight: "var(--fw-medium)", color: "var(--text-muted)" }}>적용 중</span>
          {active.map(a => (
            <button key={a.key} onClick={a.onClear} aria-label={`${a.label} 필터 해제`}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 26, padding: "3px 7px 3px 9px",
                background: "var(--state-info-soft)", color: "var(--yong-teal-900)", border: "none",
                borderRadius: "var(--radius-pill)", cursor: "pointer",
                fontFamily: "var(--font-sans)", fontSize: "var(--fs-micro)", fontWeight: "var(--fw-semibold)" }}>
              {a.label}
              <Icon name="x" size={14} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
