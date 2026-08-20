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
   화면이 두 벌의 분기를 갖지 않도록 여기서 한 번에 눕힌다. */
function fromPlace(p) {
  const road = p.road_address_name || p.address_name;
  if (!road) return null;
  return { key: `p-${p.id || road}`, road, name: p.place_name || null, lat: +p.y, lng: +p.x };
}

function fromAddress(a) {
  const road = (a.road_address && a.road_address.address_name) || a.address_name;
  if (!road) return null;
  return { key: `a-${road}`, road, name: null, lat: +a.y, lng: +a.x };
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

  const search = React.useCallback(() => {
    const q = term.trim();
    /* 두 글자 미만은 부르지 않는다. 한 글자로는 전국이 걸려 목록이 뜻을 잃고,
       목록 화면의 통합 검색과 같은 기준(최소 2자)이라 담당자가 두 규칙을 외울 필요가 없다 */
    if (q.length < 2) { setResults([]); return; }
    setBusy(true);
    loadKakaoMaps(appKey).then(kakao => {
      const svc = kakao.maps.services;
      const collect = [];
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
        setResults([...byRoad.values()].slice(0, MAX_RESULTS));
        setBusy(false);
      };
      new svc.Places().keywordSearch(q, (data, status) => {
        if (status === svc.Status.OK) data.forEach(p => collect.push(fromPlace(p)));
        done();
      });
      new svc.Geocoder().addressSearch(q, (data, status) => {
        if (status === svc.Status.OK) data.forEach(a => collect.push(fromAddress(a)));
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
                <Input value={term} placeholder="건물명 · 도로명주소 (2자 이상)"
                  onChange={e => setTerm(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); search(); } }} />
              </div>
              <Button variant="primary" onClick={search} disabled={busy}>{busy ? "찾는 중" : "찾기"}</Button>
            </div>

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
                <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-caption)",
                  color: "var(--text-muted)", lineHeight: 1.55 }}>
                  {sdkError
                    ? `주소 검색을 열지 못했습니다 — ${sdkError}`
                    : "검색 결과가 없습니다. 건물명이나 도로명 일부로 다시 찾아 보세요."}
                </p>
              )
            ) : (
              <p style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-caption)",
                color: "var(--text-muted)", lineHeight: 1.55 }}>
                고른 주소의 좌표가 함께 들어옵니다 (V-02). 좌표는 따로 입력하지 않습니다.
              </p>
            )}

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
