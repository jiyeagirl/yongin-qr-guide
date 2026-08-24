import React from "react";
import { PageHeader, DataTable, Badge, EMPTY_MARK } from "../../design-systems/admin.js";
import { AS_OF_CATEGORIES, AS_OF_DEFAULTS, asOfPhrase } from "../data/settings.js";

/* M14 데이터 갱신 현황 (명세서 7장).
 *
 * ── 고치는 화면에서 보는 화면이 되었다 (2026-08-24, 사용자 요청) ─────────────
 * 이름이 「데이터 기준일 관리」였고 [기준일 수정] → [제출] 두 걸음으로 값을 고칠 수
 * 있었다. **그 기능을 통째로 뺐다.** 기준일은 원천 파일을 언제 받아 언제 밀어 넣었는지를
 * 적는 값이고, 그 적재를 하는 쪽이 개발이다 (명세서 범위 문단: "데이터 일괄 적재, 매칭,
 * 갱신, 검수는 개발 쪽에서 처리한다"). 자료를 넣는 사람과 그 날짜를 적는 사람이 다르면
 * 둘은 반드시 어긋나고, 어긋난 날짜는 없는 날짜보다 나쁘다 — 그것이 보증처럼 읽히기
 * 때문이다. 환경 설정 화면이 개발 쪽으로 간 것과 같은 선이다.
 *
 * 담당자에게 남는 일은 **확인**이다. 시민 화면 하단에 지금 무슨 문장이 나가고 있는지,
 * 어느 카테고리가 언제 기준인지를 여기서 본다. 오래된 줄이 보이면 개발 쪽에 갱신을
 * 요청하는 것이 이 화면에서 시작되는 유일한 행동이다.
 *
 * ── 값 자체는 그대로다 ──────────────────────────────────────────────────────
 * `AS_OF_DEFAULTS` 를 그대로 읽는다. 없어진 것은 **고치는 길**이지 값이 아니다.
 * 실연동에서는 서버가 적재할 때 이 값을 함께 갱신하고, 이 화면은 그것을 받아 적는다.
 * `useSettings("asOf", …)` 를 더 이상 쓰지 않는 것도 그래서다 — 덮개에 쓸 일이 없다.
 *
 * ── 왜 개별 등록 화면에 두지 않는가 ─────────────────────────────────────────
 * 갱신이 **원천 파일 단위로** 일어나기 때문이다. 공중화장실 표준데이터를 한 번 받으면
 * 그 안의 수백 건이 전부 같은 달 기준이다. 건별로 적게 하면 같은 날 받은 자료에 다른
 * 날짜가 붙고, 그러면 시민 화면의 하단 고지가 가게마다 다른 달을 말한다.
 *
 * 명세서가 못 박은 그대로다: "카테고리 단위로 관리하며, 개별 점포·시설 등록 화면에는
 * 입력란을 두지 않는다."
 *
 * ── 공공시설 4종을 하나로 묶지 않는다 ───────────────────────────────────────
 * 원천의 갱신 주기가 유형마다 다르다. AED 는 월 단위로 갱신되는데 대피소는 반기에 한 번
 * 바뀐다. 한 값으로 묶으면 어느 한쪽은 반드시 틀린 날짜를 적게 된다.
 *
 * ── 기준일을 갖지 않는 카테고리를 목록에서 지우지 않는다 ────────────────────
 * 상점가 정보와 축제 정보는 공공데이터가 아니라 시·상인회가 그때그때 전달하는 자료라
 * "몇 월 기준"이라는 말이 성립하지 않는다. 목록에서 아예 빼면 **"기준일이 없는
 * 카테고리"와 "우리가 빠뜨린 카테고리"가 구분되지 않는다.** 줄은 남기고 사유를 적는다.
 *
 * ── 문구를 함께 보여준다 ────────────────────────────────────────────────────
 * 저장된 값은 `2026.04` 지만 시민이 보는 것은 「공공시설 정보 2026.04. 기준」이다.
 * 이 화면이 확인하는 자리가 되면서 이 칸이 더 중요해졌다 — 담당자가 실제로 견주는 대상은
 * 값이 아니라 **화면에 나가고 있는 문장**이다.
 */

/* 기준일 칸의 높이 — 일곱 줄짜리 표라 촘촘할 이유가 없고, 이 화면에서 눈이 머무는 곳이
   이 칸이다. 입력칸이 없어진 뒤에도 이 값을 그대로 둔다 (표의 리듬이 달라질 이유가 없다). */
const ROW_H = 36;

export function DataAsOf() {
  const value = AS_OF_DEFAULTS;

  return (
    <>
      {/* 제목이 하는 일을 바꿨다 — 「관리」가 아니라 「현황」이다. 안내 줄도 담당자가
          여기서 할 수 있는 일(확인)과 할 수 없는 일(수정)을 그대로 적는다. 할 수 없는
          일을 적지 않으면, 고칠 자리를 찾느라 표를 한참 뒤지게 된다. */}
      <PageHeader title="데이터 갱신 현황"
        note="카테고리별 데이터 기준일과 그것이 사용자 화면에 나가는 문장을 확인하는 화면입니다. 기준일은 원천 자료를 적재할 때 함께 갱신되므로 이 화면에서 수정하지 않습니다. 오래된 기준일이 보이면 자료 갱신을 요청해 주세요." />

      <DataTable
        caption="카테고리별 데이터 기준일"
        rows={AS_OF_CATEGORIES} rowKey="key"
        empty={{ title: "카테고리가 없습니다." }}
        columns={[
          { key: "group", label: "구분", width: 130 },
          { key: "label", label: "카테고리", width: 160 },
          { key: "source", label: "원천", render: c => c.source || <span style={{ color: "var(--text-muted)" }}>{c.reason}</span> },
          { key: "managed", label: "기준일 관리", width: 110, align: "center",
            render: c => (
              <Badge tone={c.managed ? "success" : "neutral"} size="sm">
                {c.managed ? "적용" : "미적용"}
              </Badge>
            ) },
          { key: "value", label: "기준일", width: 150,
            render: c => {
              if (!c.managed) {
                return <span style={{ display: "inline-flex", alignItems: "center", minHeight: ROW_H,
                  color: "var(--text-muted)" }}>{EMPTY_MARK}</span>;
              }
              return (
                <span style={{ display: "inline-flex", alignItems: "center", minHeight: ROW_H,
                  fontVariantNumeric: "tabular-nums", fontWeight: "var(--fw-semibold)",
                  color: "var(--text-heading)" }}>
                  {value[c.key] || <span style={{ color: "var(--text-muted)", fontWeight: "var(--fw-regular)" }}>기준일 미설정</span>}
                </span>
              );
            } },
          { key: "phrase", label: "사용자 화면 노출 문구",
            render: c => {
              const p = asOfPhrase(c, value[c.key]);
              return p
                ? <span style={{ color: "var(--text-body)" }}>{p}</span>
                : <span style={{ color: "var(--text-muted)" }}>노출하지 않습니다</span>;
            } },
        ]} />

      {/* ── 여기 있던 것들 (2026-08-24 삭제) ────────────────────────────────
             [기준일 수정] · [제출] 단추, 입력칸 일곱, YYYY.MM 형식 검사(V.yearMonth),
             「무엇이 무엇으로」를 보여주던 제출 확인 다이얼로그, 고치는 동안 서던 경고 띠.
             세 걸음짜리 잠금장치를 공들여 만들어 두었는데, **애초에 담당자가 고칠 값이
             아니었다.** 자료를 넣는 쪽과 날짜를 적는 쪽이 다르면 둘은 반드시 어긋난다.
             `V.yearMonth` 는 남겨 둔다 — 실연동 때 서버가 보내는 값을 받는 자리에서 같은
             형식을 검사하게 된다. */}
    </>
  );
}

export default DataAsOf;
