import React from "react";
import { PageHeader, DataTable, Button, Input, Badge, Notice, EMPTY_MARK } from "../../design-systems/admin.js";
import { AS_OF_CATEGORIES, AS_OF_DEFAULTS, asOfPhrase } from "../data/settings.js";
import { V } from "../data/fields.js";
import { useSettings } from "../data/store.js";

/* M14 데이터 기준일 관리 (명세서 7장).
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
 * 바뀐다. 한 값으로 묶으면 어느 한쪽은 반드시 틀린 날짜를 적게 되고, 틀린 날짜는
 * 없는 날짜보다 나쁘다 — 그것이 보증처럼 읽히기 때문이다.
 *
 * ── 기준일을 갖지 않는 카테고리를 목록에서 지우지 않는다 ────────────────────
 * 상점가 정보와 축제 정보는 공공데이터가 아니라 시·상인회가 그때그때 전달하는 자료라
 * "몇 월 기준"이라는 말이 성립하지 않는다. 목록에서 아예 빼면 **"기준일이 없는
 * 카테고리"와 "우리가 빠뜨린 카테고리"가 구분되지 않는다.** 줄은 남기고 사유를 적는다.
 *
 * ── 문구를 미리 보여준다 ────────────────────────────────────────────────────
 * 값을 넣는 사람은 `2026.04` 를 적지만 시민이 보는 것은 「공공시설 정보 2026.04. 기준」이다.
 * 끝 점 하나 때문에 형식을 다르게 적는 일이 실제로 생겨서, 저장되는 값과 나가는 문장을
 * 한 줄에 나란히 둔다.
 */

export function DataAsOf({ onToast }) {
  const asOf = useSettings("asOf", AS_OF_DEFAULTS, "데이터 기준일");
  const [draft, setDraft] = React.useState(asOf.value);
  const [errors, setErrors] = React.useState({});

  /* 저장된 값이 밖에서 바뀌면(초기화 버튼) 따라간다 */
  React.useEffect(() => { setDraft(asOf.value); setErrors({}); },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [JSON.stringify(asOf.value)]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(asOf.value);

  const save = () => {
    const bad = {};
    AS_OF_CATEGORIES.filter(c => c.managed).forEach(c => {
      const v = String(draft[c.key] || "").trim();
      if (!v) bad[c.key] = "기준일을 적어야 합니다.";
      else if (!V.yearMonth.re.test(v)) bad[c.key] = V.yearMonth.msg;
    });
    if (Object.keys(bad).length) { setErrors(bad); onToast("입력 형식을 확인해 주세요."); return; }
    asOf.save(draft);
    setErrors({});
    onToast("데이터 기준일을 저장했습니다.");
  };

  return (
    <>
      <PageHeader title="데이터 기준일 관리"
        note="카테고리마다 값 하나를 정하면, 그 카테고리에 속한 모든 시민용 상세 페이지 하단에 일괄 반영됩니다 (명세서 7장)."
        action={
          <Button variant="primary" icon="check" onClick={save} disabled={!dirty}>
            {dirty ? "변경 사항 저장" : "저장됨"}
          </Button>
        } />

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
          { key: "value", label: "기준일", width: 190,
            render: c => (c.managed ? (
              <div>
                <Input value={draft[c.key] == null ? "" : draft[c.key]} placeholder="2026.04" maxLength={7}
                  error={errors[c.key] || undefined}
                  onChange={e => {
                    setDraft(d => ({ ...d, [c.key]: e.target.value }));
                    setErrors(x => { const n = { ...x }; delete n[c.key]; return n; });
                  }} />
                {errors[c.key] ? (
                  <p style={{ marginTop: 4, fontSize: "var(--fs-micro)", color: "var(--state-danger)" }}>
                    {errors[c.key]}
                  </p>
                ) : null}
              </div>
            ) : <span style={{ color: "var(--text-muted)" }}>{EMPTY_MARK}</span>) },
          { key: "phrase", label: "시민 화면 노출 문구",
            render: c => {
              const p = asOfPhrase(c, draft[c.key]);
              return p
                ? <span style={{ color: "var(--text-body)" }}>{p}</span>
                : <span style={{ color: "var(--text-muted)" }}>노출하지 않습니다</span>;
            } },
        ]} />

      <Notice tone="neutral" size="sm" style={{ marginTop: "var(--space-5)" }}>
        입력 형식은 <b>YYYY.MM</b> 입니다 (예: 2026.04). 끝의 점과 「기준」은 시민 화면이 붙입니다.
        상점가 정보와 축제 정보에 기준일을 두지 않는 것은 빠뜨린 것이 아니라,
        공공데이터가 아니어서 「몇 월 기준」이라는 말이 성립하지 않기 때문입니다.
      </Notice>

      <Notice tone="warning" size="sm" style={{ marginTop: "var(--space-3)" }}>
        공공데이터 적재와 갱신은 개발 쪽에서 처리합니다 (명세서 범위). 갱신이 돌면 해당 카테고리의
        기준일도 함께 올라가야 하므로, 그때는 이 값이 서버에서 들어옵니다 — 지금은 이 화면에서만 바뀝니다.
      </Notice>
    </>
  );
}

export default DataAsOf;
