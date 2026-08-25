import React from "react";
import { Input } from "../core/Input.jsx";
import { Button } from "../core/Button.jsx";
import { Icon } from "../core/Icon.jsx";
import { Badge } from "../core/Badge.jsx";
import { FormField } from "./FormGrid.jsx";
import { loadKakaoMaps } from "../map/kakaoLoader.js";

/* 도로명주소 입력 (검증 규칙 V-02).
 *
 * ── 왜 타이핑을 막는가 ──────────────────────────────────────────────────────
 * 명세서 V-02 는 "주소검색 API 연동, 직접 타이핑 불가. 선택 시 좌표 자동 입력"이다.
 * 두 가지를 한꺼번에 지키는 규칙이다:
 *
 *   1. 표기가 흔들리지 않는다. 손으로 적으면 "포곡읍 둔전로42" · "포곡읍 둔전로 42번지" ·
 *      "처인구 포곡읍 둔전로 42" 가 같은 곳을 가리키면서 서로 다른 문자열이 된다.
 *      점포의 소속 상점가 판정이 **도로명주소 문자열 매칭**이라(명세서 2-2), 이 흔들림이
 *      그대로 매칭 실패가 되어 검수 큐(M07)로 쌓인다.
 *   2. 좌표를 사람이 넣지 않는다. 검색 결과가 좌표를 함께 들고 오므로, 입력 원칙 3번의
 *      "좌표는 주소 입력 시 자동 변환되며 별도 입력란을 두지 않는다"가 저절로 지켜진다.
 *
 * **1번은 화면이 넘겨주는 값에도 걸린다** (2026-08-25). 손으로 못 적게 해 놓고 검색 결과의
 * 지번을 대신 넣어 주면 같은 흔들림이 다른 문으로 들어온다 — 담당자는 고른 적도 없는 표기를
 * 갖게 되고, 그것이 검색으로 들어온 값이라 더 믿게 된다. 도로명이 없는 결과는 **버린다**
 * (아래 fromPlace · fromAddress).
 *
 * ── 검색은 카카오 지도 SDK 가 한다 ──────────────────────────────────────────
 * kakaoLoader 가 이미 `services` 라이브러리를 함께 받고 있다. REST 키가 필요한 API 가
 * 아니라 JavaScript 키로 도는 SDK 기능이므로 **서버 없이 실제로 동작한다** —
 * 이 화면에서 유일하게 더미가 아닌 부분이다.
 *
 *   Places.keywordSearch   "둔전시장" 같은 이름으로 찾는다 (담당자가 아는 것은 대개 이름이다)
 *   Geocoder.addressSearch "둔전로 42" 같은 주소로 찾는다
 *
 * 둘 다 부른다. 담당자가 무엇을 칠지 미리 알 수 없고, 한쪽만 부르면 "검색 결과 없음"이
 * 뜨는데 다른 쪽에는 있는 상황이 생긴다.
 *
 * ── SDK 가 죽었을 때 ────────────────────────────────────────────────────────
 * 검색이 안 되는데 타이핑도 막으면 담당자는 아무것도 못 한다. 그때만 직접 입력을 열되,
 * **열렸다는 사실을 화면에 적는다** — 그렇게 들어온 주소는 표기가 흔들릴 수 있고
 * 좌표가 비어 있다는 것을 다음 사람이 알아야 한다.
 *
 * ── 검색창을 다이얼로그로 띄우지 않는다 ─────────────────────────────────────
 * 이 칸은 이미 다이얼로그(Modal) 안에 있다. 그 위에 또 다이얼로그를 얹으면 ESC 가
 * 둘을 한꺼번에 닫고(두 리스너가 같은 document 에 걸린다), 포커스 가둠도 서로 싸운다.
 * 칸 아래로 펼쳐지는 패널이면 그런 일이 없고, 고른 주소가 어느 칸에 들어가는지도 보인다.
 */

const MAX_RESULTS = 8;

/* 검색 결과 한 줄로 모양을 맞춘다. Places 와 Geocoder 의 응답 필드가 서로 달라
   화면이 두 벌의 분기를 갖지 않도록 여기서 한 번에 눕힌다.

   ── 도로명이 없으면 **버린다** (2026-08-25, 사용자 요청) ─────────────────────
   전에는 지번으로 대신했다 (`p.road_address_name || p.address_name`). 그러면 도로명이
   없는 결과 — 신축 건물, 농촌 지번, 지번으로 검색한 경우 — 를 골랐을 때 **지번 주소가
   「도로명주소」 칸에 그대로 들어가고 화면에는 아무 표시가 없다.**

   이 칸이 타이핑까지 막으며 표기를 고정하는 이유가 위 머리말의 1번(도로명주소 문자열
   매칭)이라, 지번이 한 줄 섞이는 순간 그 매칭이 조용히 실패한다. **없는 값보다 나쁜
   종류의 값**이라 대체하지 않는다 — 고를 수 없게 하고, 왜 비었는지를 빈 목록이 적는다
   (아래 `noRoad`). */
function fromPlace(p) {
  const road = p.road_address_name;
  if (!road) return null;
  return { key: `p-${p.id || road}`, road, name: p.place_name || null, lat: +p.y, lng: +p.x };
}

function fromAddress(a) {
  /* Geocoder 는 지번(`address`)과 도로명(`road_address`)을 따로 담아 준다. 도로명 칸이
     비어 있으면 그 주소에는 도로명이 없는 것이다.
     좌표도 도로명 쪽 것을 먼저 쓴다 — 지번과 도로명의 대표 좌표가 갈리는 자리가 있다 */
  const r = a.road_address;
  if (!r || !r.address_name) return null;
  return { key: `a-${r.address_name}`, road: r.address_name, name: null,
    lat: +(r.y || a.y), lng: +(r.x || a.x) };
}

export function AddressField({
  label = "도로명주소", required = true, example, range = "최대 100자",
  value, onSelect, appKey, error, span = 2, disabled,
}) {
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");
  const [results, setResults] = React.useState(null);   /* null=아직 안 찾음, []=결과 없음 */
  const [busy, setBusy] = React.useState(false);
  const [sdkError, setSdkError] = React.useState(null);
  const [manual, setManual] = React.useState(false);
  /* 「찾은 것은 있는데 도로명이 있는 줄이 없다」 — 빈 목록의 사유가 둘로 갈렸다
     (2026-08-25). 못 찾은 것과 같은 문구를 쓰면 담당자는 같은 말을 다시 친다 */
  const [noRoad, setNoRoad] = React.useState(false);

  const search = React.useCallback(() => {
    const q = term.trim();
    /* 두 글자 미만은 부르지 않는다. 한 글자로는 전국이 걸려 목록이 뜻을 잃고,
       목록 화면의 통합 검색과 같은 기준(최소 2자)이라 담당자가 두 규칙을 외울 필요가 없다 */
    setNoRoad(false);
    if (q.length < 2) { setResults([]); return; }
    setBusy(true);
    loadKakaoMaps(appKey).then(kakao => {
      const svc = kakao.maps.services;
      const collect = [];
      let raw = 0;              /* 응답에 들어온 줄 수. 남은 것과 견주어 사유를 가른다 */
      let left = 2;
      const done = () => {
        left -= 1;
        if (left) return;
        /* 같은 도로명주소가 두 검색 모두에서 나온다. 이름이 있는 쪽(Places)을 남긴다 —
           "둔전로 42" 보다 "둔전시장 · 둔전로 42" 가 고르기 쉽다 */
        const byRoad = new Map();
        collect.filter(Boolean).forEach(r => {
          const prev = byRoad.get(r.road);
          if (!prev || (!prev.name && r.name)) byRoad.set(r.road, r);
        });
        const list = [...byRoad.values()].slice(0, MAX_RESULTS);
        setResults(list);
        /* 찾기는 했는데 전부 도로명이 없어 걸러졌다 (위 fromPlace · fromAddress) */
        setNoRoad(list.length === 0 && raw > 0);
        setBusy(false);
      };
      new svc.Places().keywordSearch(q, (data, status) => {
        if (status === svc.Status.OK) { raw += data.length; data.forEach(p => collect.push(fromPlace(p))); }
        done();
      });
      new svc.Geocoder().addressSearch(q, (data, status) => {
        if (status === svc.Status.OK) { raw += data.length; data.forEach(a => collect.push(fromAddress(a))); }
        done();
      });
    }).catch(err => {
      setBusy(false);
      setSdkError(err.message || String(err));
      setResults([]);
    });
  }, [term, appKey]);

  const choose = r => {
    if (onSelect) onSelect({ addr: r.road, lat: r.lat, lng: r.lng, placeName: r.name });
    setOpen(false);
    setTerm("");
    setResults(null);
    setNoRoad(false);
  };

  return (
    <FormField label={label} required={required} example={example} range={range} error={error} span={span}>
      <div>
        <div style={{ display: "flex", alignItems: "stretch", gap: "var(--space-2)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {manual ? (
              <Input value={value == null ? "" : value} maxLength={100} disabled={disabled}
                placeholder="도로명주소를 직접 입력합니다"
                onChange={e => onSelect && onSelect({ addr: e.target.value, lat: null, lng: null })} />
            ) : (
              /* 값을 보여주는 상자이지 입력칸이 아니다. Input 으로 두고 readOnly 만 걸면
                 커서가 깜빡여 칠 수 있는 것처럼 보인다 — 모양부터 다르게 둔다 */
              <div style={{ minHeight: "var(--tap-comfortable)", display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", background: "var(--surface-card)",
                border: "var(--stroke-hairline) solid " + (error ? "var(--state-danger)" : "var(--border-strong)"),
                borderRadius: "var(--radius-control)", fontSize: "var(--fs-body)",
                color: value ? "var(--text-heading)" : "var(--text-muted)", lineHeight: 1.5 }}>
                <Icon name="map-pin" size={16} color="var(--text-muted)" style={{ flex: "0 0 auto" }} />
                <span style={{ minWidth: 0, wordBreak: "keep-all" }}>
                  {value || "주소 검색으로 선택합니다"}
                </span>
              </div>
            )}
          </div>
          <Button variant={value ? "outline" : "primary"} icon="search" disabled={disabled}
            onClick={() => { setOpen(o => !o); setManual(false); }}>
            주소 검색
          </Button>
        </div>

        {open ? (
          <div style={{ marginTop: "var(--space-3)", padding: "var(--space-4)",
            background: "var(--surface-sunken)", borderRadius: "var(--radius-md)",
            border: "var(--stroke-hairline) solid var(--border-default)" }}>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* 「도로명주소」 → 「도로명 + 건물번호」 (2026-08-25). 도로명만 치면 거의
                    나오지 않는다 — `keywordSearch` 는 장소 **이름**을 찾는 것이라 도로명에
                    걸리지 않고, `addressSearch` 도 번호 없는 도로명에는 대개 빈 결과를 준다.
                    번호가 필요하다는 것은 검색어를 치는 이 자리에서 말해야 한다 */}
                <Input value={term} placeholder="건물명 · 도로명 + 건물번호 (2자 이상)"
                  onChange={e => setTerm(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); search(); } }} />
              </div>
              <Button variant="primary" onClick={search} disabled={busy}>{busy ? "찾는 중" : "찾기"}</Button>
            </div>

            {/* 찾기 전에는 아무것도 적지 않는다 (2026-08-20). 여기 「고른 주소의 좌표가
                함께 들어옵니다 (V-02). 좌표는 따로 입력하지 않습니다.」가 있었는데, 담당자가
                이 자리에서 하려는 일은 검색어를 치는 것 하나다. 좌표가 함께 들어온다는 사실은
                고르고 나면 아래 지도가 바로 보여준다 — 미리 말할 필요가 없다. */}
            {results ? (
              results.length ? (
                <ul style={{ listStyle: "none", marginTop: "var(--space-3)", display: "flex",
                  flexDirection: "column", gap: 2, maxHeight: 260, overflowY: "auto" }}>
                  {results.map(r => (
                    <li key={r.key}>
                      <button type="button" onClick={() => choose(r)}
                        style={{ width: "100%", display: "block", textAlign: "left", cursor: "pointer",
                          minHeight: "var(--tap-min)", padding: "var(--space-2) var(--space-3)",
                          background: "var(--surface-card)", borderRadius: "var(--radius-sm)",
                          border: "var(--stroke-hairline) solid var(--border-default)",
                          fontFamily: "var(--font-sans)" }}>
                        {r.name ? (
                          <span style={{ display: "block", fontSize: "var(--fs-label)",
                            fontWeight: "var(--fw-semibold)", color: "var(--text-heading)" }}>{r.name}</span>
                        ) : null}
                        <span style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-body)" }}>
                          {r.road}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                /* 빈 이유가 셋이다 (2026-08-25). 하나로 뭉치면 담당자가 할 일이 달라지는데
                   화면은 같은 말을 한다 — 도로명이 없어서 비었으면 **다르게 찾아야** 하고,
                   못 찾았으면 **더 적어야** 한다 */
                <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-caption)",
                  color: noRoad ? "var(--state-warning)" : "var(--text-muted)", lineHeight: 1.55 }}>
                  {sdkError
                    ? `주소 검색을 열지 못했습니다 — ${sdkError}`
                    : noRoad
                      ? "찾은 곳에 도로명주소가 없습니다. 이 칸은 도로명주소만 받습니다 — 건물명이나 「도로명 + 건물번호」로 다시 찾아 보세요."
                      : "검색 결과가 없습니다. 건물명이나 「도로명 + 건물번호」로 다시 찾아 보세요."}
                </p>
              )
            ) : null}

            {/* SDK 가 죽었을 때만 열리는 문. 열려 있다는 사실을 화면에 적는다 —
                이렇게 들어온 주소는 표기가 흔들릴 수 있고 좌표가 비어 있다 */}
            {sdkError && !manual ? (
              <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)",
                borderTop: "var(--stroke-hairline) solid var(--border-default)" }}>
                <Button variant="ghost" size="sm" icon="pencil"
                  onClick={() => { setManual(true); setOpen(false); }}>
                  직접 입력으로 전환
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {manual ? (
          <p style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <Badge tone="warning" size="sm">직접 입력</Badge>
            <span style={{ fontSize: "var(--fs-caption)", color: "var(--state-warning)", lineHeight: 1.5 }}>
              주소 검색을 열지 못해 임시로 열어 둔 상태입니다. 좌표가 비어 있으므로 지도에서 지정해야 합니다.
            </span>
          </p>
        ) : null}
      </div>
    </FormField>
  );
}

export default AddressField;
