import React from "react";

/* 관리자 화면의 머리 — 제목 · 설명 한 줄 · 우측 주 행동 하나.
 *
 * 시민용 SectionHeader 와 나눈 이유: 저쪽은 **한 화면 안의 구획**에 붙는 이름표라
 * 글자가 작고(fs-title-3) 여백이 좁다. 여기는 **화면 자체의 이름**이고, 그 아래
 * 표가 스무 줄씩 이어지므로 어디가 화면의 시작인지가 확실해야 한다.
 *
 * `note` 는 설명이 아니라 **출처와 기준일**을 적는 자리다. 관리자 화면에서 가장 자주
 * 나오는 질문이 "이 숫자 언제 것이냐"인데, 시민 화면은 그것을 하단 고지에서 답하고
 * 관리자는 여기서 답한다 — 담당자는 화면 끝까지 굴리지 않고 표만 보고 판단한다.
 *
 * 주 행동은 **하나뿐이다.** 목록 화면에서 할 일은 [등록]이고, 나머지(내보내기·일괄
 * 업로드 등)는 표 위 Toolbar 의 오른쪽에 붙는다. 둘을 같은 자리에 놓으면 무게가 같아져
 * 담당자가 매번 읽고 고르게 된다.
 */
export function PageHeader({ title, note, count, action, style, ...rest }) {
  return (
    <header style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-4)",
      marginBottom: "var(--space-5)", ...style }} {...rest}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)",
          font: "var(--type-title-1)", letterSpacing: "var(--ls-snug)", color: "var(--text-heading)" }}>
          {title}
          {/* 건수는 제목 옆에 붙는다. 표 위에 따로 한 줄을 내주면 그 줄이 필터 결과가
              바뀔 때마다 혼자 깜빡여 화면이 들썩인다 */}
          {count != null ? (
            <span style={{ fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)",
              color: "var(--brand-primary)", fontVariantNumeric: "tabular-nums" }}>
              {count}
            </span>
          ) : null}
        </h1>
        {note ? (
          <p style={{ marginTop: 6, fontSize: "var(--fs-label)", color: "var(--text-muted)", lineHeight: 1.55 }}>
            {note}
          </p>
        ) : null}
      </div>
      {/* 행동이 둘 이상 올 수 있다 ([취소]+[제출] 처럼). 붙어 서지 않게 여기서 간격을 준다 */}
      {action ? (
        <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {action}
        </div>
      ) : null}
    </header>
  );
}

export default PageHeader;
