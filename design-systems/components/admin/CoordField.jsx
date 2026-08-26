import React from "react";
import { Badge } from "../core/Badge.jsx";
import { Icon } from "../core/Icon.jsx";
import { FloatingControls } from "../feedback/FloatingControls.jsx";
import { KakaoMap } from "../map/KakaoMap.jsx";
import { FormField } from "./FormGrid.jsx";

/* 좌표 확인·수정 (검증 규칙 V-01 · 입력 원칙 3번).
 *
 * ── 입력칸이 아니다 ─────────────────────────────────────────────────────────
 * 명세서 입력 원칙 3번: "좌표는 주소 입력 시 자동 변환되며 **별도 입력란을 두지 않는다.**
 * 부정확한 경우 지도에서 수정할 수 있다."
 *
 * 위경도 숫자 두 칸을 내주면 담당자는 거기에 무언가를 적어야 하는 것으로 읽는다. 그런데
 * 37.28874 가 맞는 값인지 아는 사람은 없다 — 숫자만 보고 검증이 불가능한 값이다.
 * 그래서 여기서는 **지도만** 준다. 자동 변환된 자리가 틀렸으면 지도를 눌러 옮긴다.
 *
 * ── 왜 이 한 칸이 중요한가 ──────────────────────────────────────────────────
 * 시민 화면의 모든 거리("약 320m")가 좌표에서 나온다. QR 지점 좌표가 100m 틀리면
 * 그 지점으로 들어온 시민이 보는 **모든 숫자**가 100m 틀린다. 시설 좌표가 틀리면
 * 길찾기가 엉뚱한 골목으로 안내한다 — 실제로 오류신고에 그 문구가 있다.
 *
 * ── V-01 범위를 벗어나면 막지 않고 묻는다 ───────────────────────────────────
 * "위도 37.05~37.40, 경도 127.00~127.45 밖이면 **경고 후 확인**"이다. 막지 않는 이유는
 * 용인시 경계가 사각형이 아니라서, 상자를 조금 벗어나는 실제 지점이 있을 수 있기
 * 때문이다. 대신 벗어났다는 사실을 눈에 띄게 적어 담당자가 한 번 더 보게 한다.
 */

/* V-01 — 용인시를 감싸는 사각형. 부록의 값 그대로다 */
export const COORD_BOUNDS = { latMin: 37.05, latMax: 37.40, lngMin: 127.00, lngMax: 127.45 };

export function outOfBounds(lat, lng) {
  if (lat == null || lng == null) return false;
  const a = Number(lat), b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return a < COORD_BOUNDS.latMin || a > COORD_BOUNDS.latMax
    || b < COORD_BOUNDS.lngMin || b > COORD_BOUNDS.lngMax;
}

/* 이 지도의 배율. 건물 하나를 가리키는 자리라 3 이다(카카오는 작을수록 가깝다).
   **두 곳에서 쓰므로 상수로 둔다** — 지도를 만들 때와, 밖에서 좌표가 바뀌어 따라갈 때.
   두 자리에 3 을 따로 적으면 한쪽만 고쳐지고 그 어긋남은 화면에서 잘 안 보인다. */
const LEVEL = 3;

/* 소수점 6자리 (V-01). 표기와 저장을 같은 자리에서 자른다 — 화면은 6자리로 보여주고
   데이터에는 14자리가 들어 있으면, 두 값을 견주는 사람이 매번 다른 것을 본다. */
export function fixCoord(v) {
  const n = Number(v);
  return Number.isFinite(n) ? +n.toFixed(6) : null;
}

export function CoordField({
  label = "좌표", lat, lng, name, appKey, onChange, span = 2, height = 240, note,
  /* 항목표가 정한다 (fields.js 의 COORD). 2026-08-25 부터 ● 이다 — 이 값이 없으면 그
     자료는 지도에 없는 것이나 같아서, 비운 채로 저장되면 안 된다 (그쪽 머리말).
     화면이 직접 적지 않고 표에서 흘러온다 (RecordForm 의 coord 슬롯). */
  required = "auto", error,
}) {
  const has = lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const off = has && outOfBounds(lat, lng);
  /* 좌표가 들어오면 오류는 스스로 사라진다. 이 칸의 오류는 「좌표 없음」 하나뿐이라
     값이 생긴 순간 지난 이야기가 된다 — 다른 칸처럼 입력 이벤트로 지울 수가 없다
     (지도를 누르는 것은 `lat`·`lng` 를 고치는 일이고 오류는 `coord` 에 달려 있다) */
  const err = has ? null : error;

  const mapApi = React.useRef(null);

  /* **지도가 마지막으로 내놓은 좌표**를 적어 둔다 — 아래 「밖에서 들어온 좌표」가 이것으로
     갈린다. 핀을 끌어 옮긴 것까지 지도를 따라 움직이면 끄는 동안 화면이 계속 밀린다.

     켜고 끄는 깃발이 아니라 값으로 두는 이유: 깃발은 **소비되지 않고 남을 수** 있다.
     끈 자리가 반올림 뒤 이전과 같은 좌표면 `lat`·`lng` 가 그대로라 아래 effect 가 아예
     돌지 않고, 깃발이 켜진 채 남아 그다음 주소 선택을 한 번 삼킨다. 값끼리 견주면 그런
     자리가 없다 — 같으면 어차피 그 자리를 보고 있는 것이고, 다르면 따라가면 된다. */
  const fromMap = React.useRef(null);
  const at = (a, b) => `${fixCoord(a)},${fixCoord(b)}`;
  const pick = React.useCallback((la, ln) => {
    fromMap.current = at(la, ln);
    if (onChange) onChange({ lat: fixCoord(la), lng: fixCoord(ln) });
  }, [onChange]);

  /* ── 밖에서 좌표가 바뀌면 지도가 따라간다 (2026-08-25, 사용자 요청) ───────────
     `KakaoMap` 은 지도를 **한 번만** 만든다 — `center` 가 나중에 바뀌어도 화면은 그
     자리에 남는다 (그쪽 「지도 생성 — 한 번만」). 그래서 이미 좌표가 있는 자료를 열어
     주소를 다시 검색해 고르면, 좌표 숫자와 핀은 새 자리로 가는데 **보고 있는 화면은
     옛 자리에 그대로** 있었다 — 핀이 화면 밖으로 나가 아무 일도 일어나지 않은 것처럼
     보인다. 좌표가 없던 자료에서는 그때 지도가 처음 서므로 이 일이 안 생겨, 신규
     등록으로만 검수하면 놓치는 자리였다.

     **줌도 함께 맞춘다.** [핀 위치로]와 갈리는 지점이다 — 그쪽은 「핀을 잃어버렸으니
     데려다 달라」라서 맞춰 둔 배율을 지키는 것이 요점이고, 여기는 **다른 곳을 골랐다**라서
     옛 배율이 그 자리의 것이 아니다. 시 전체가 보이도록 멀리 끌어 둔 채 주소를 고르면
     새 자리도 시 전체로 보인다. */
  React.useEffect(() => {
    if (!has) return;
    /* 핀을 끈 것이면 이미 그 자리를 보고 있다 */
    if (fromMap.current === at(lat, lng)) return;
    /* 지도가 아직 없으면(첫 렌더 · 좌표가 막 생겨 지도가 이제 서는 참) 할 일이 없다 —
       그때는 `KakaoMap` 이 이 좌표를 center 로 받아 만들어진다 */
    if (mapApi.current) mapApi.current.setView(Number(lat), Number(lng), LEVEL);
  }, [lat, lng, has]);

  /* ── 핀을 잃어버렸을 때 되찾는 길 (2026-08-25, 사용자 요청) ──────────────────
     이 지도는 끌어 움직일 수 있는데 되돌리는 길이 없었다. 자리를 확인하려고 주변을
     둘러보다 핀이 화면 밖으로 나가면, 그때부터는 **좌표 숫자를 보고 손으로 찾아
     돌아와야 한다.** 240px 짜리 상자에서 그것은 사실상 불가능하다.

     줌은 건드리지 않고 **가운데만 옮긴다.** 핀을 정확히 놓으려고 깊이 당겨 둔 배율을
     되돌리면, 되찾기가 곧 다시 맞추기가 된다 (시민 화면의 [QR 스캔 지점으로]는 줌까지
     되돌리는데 그쪽은 탐색용 지도라 사정이 다르다). */
  const backToPin = () => {
    if (mapApi.current && has) mapApi.current.focus(Number(lat), Number(lng));
  };

  return (
    /* 「주소를 고르면 자동으로 들어옵니다」를 뺐다 (2026-08-20) — 빈 지도 자리가 이미
       같은 말을 하고 있고, 주소를 고르고 나면 그 말이 필요 없다. 남긴 한 줄은 설명이 아니라
       **보이지 않는 조작**이다: 핀을 끌 수 있다는 것은 화면만 봐서는 모른다.
       (2026-08-25, 사용자 요청 — 「자리가 틀리면 지도를 눌러 옮기거나 핀을 끌어 맞춥니다」
       에서 고쳤다. 지도를 눌러도 핀이 옮겨 가는 것은 그대로지만, 그쪽은 **일부러 하지
       않으면 일어나지 않는 조작**이라 굳이 권하지 않는다 — 자리를 살피다 무심코 누른
       사람에게 핀이 따라오는 편이 낫지는 않다.) */
    <FormField label={label} required={required} span={span} error={err}
      hint={note || "핀 위치가 올바르지 않으면, 핀을 드래그해 수정할 수 있습니다."}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: 6 }}>
          <span style={{ fontSize: "var(--fs-label)", fontVariantNumeric: "tabular-nums",
            color: has ? "var(--text-heading)" : "var(--text-muted)" }}>
            {has ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : "좌표 없음"}
          </span>
          {off ? <Badge tone="warning" size="sm">용인시 범위 밖</Badge> : null}
        </div>

        {/* KakaoMap 의 뿌리가 position:absolute 라 크기를 가진 relative 상자가 필요하다 */}
        {/* 테두리가 상태를 말한다 — 오류(붉게)가 범위 경고(노랗게)보다 앞이다.
            둘이 함께 뜰 수는 없다: 오류는 좌표가 없을 때이고 경고는 있을 때다 */}
        {/* ── 지도의 층이 이 상자 밖으로 새지 않게 한다 (`zIndex: 0`, 2026-08-26) ──
            `position:relative` 만 있으면 이 상자는 **쌓임 맥락을 만들지 않아**, 안쪽의
            지도(z 100)와 [핀 위치로 이동](z 400)이 폼의 다른 칸들과 **같은 자리에서**
            겨룬다. 그래서 바로 위 칸이 열어 내린 목록이 지도 밑으로 들어가 잘렸다.
            100 과 400 은 지도가 화면 전체를 덮는 시민 화면의 셈이지, 폼 한 칸으로
            들어앉은 260px 짜리 상자가 주장할 높이가 아니다 — `zIndex:0` 이 그 층들을
            이 상자 안의 이야기로 가둔다. 상자 자신은 여전히 0 이라 폼 안에서의 차례는
            달라지지 않는다. */}
        <div style={{ position: "relative", zIndex: 0, height, borderRadius: "var(--radius-md)", overflow: "hidden",
          border: "var(--stroke-hairline) solid "
            + (err ? "var(--state-danger)" : off ? "var(--state-warning)" : "var(--border-default)") }}>
          {has ? (
            /* key 를 주지 않는다. 시민용 셸에서 지도를 다시 만들지 않는 이유(U-CM-16)와는
               다른 이유인데, 여기서는 **핀을 끌 때마다 지도가 새로 생기면 안 되기** 때문이다.
               중심은 처음 좌표에 맞추고, 이후 이동은 핀만 움직인다. */
            <>
              {/* `anchor={false}` — 파란 점과 말풍선을 그리지 않는다 (2026-08-25, 사용자
                  요청). 시민 화면에서 그 표시는 「내 위치」인데, 여기서 center 는 지금
                  고치고 있는 **그 좌표**다. 켜 두면 끌 수 있는 핀 바로 밑에 같은 자리를
                  가리키는 점이 하나 더 서고 말풍선이 시설 이름을 적어, 무엇을 끌어야
                  하는지 화면이 스스로 흐린다. 여기 있어야 하는 것은 핀뿐이다. */}
              <KakaoMap appKey={appKey} center={{ lat: Number(lat), lng: Number(lng) }}
                anchorLabel={name || "지정 위치"} anchor={false} level={LEVEL} mapRef={mapApi}
                pick={{ lat: Number(lat), lng: Number(lng), label: name }} onPick={pick} />
              {/* 시민 지도의 [스캔 위치로]와 **같은 부품**이다 (2026-08-25, 사용자
                  요청). 하는 일이 같으므로 — 끌어 움직인 지도를 기준점으로 되돌린다 —
                  알약 모양과 서는 자리가 같다. 다만 **글자는 붙이지 않는다**: 시민 쪽은
                  「스캔 위치」가 무엇인지 설명이 필요해 글자를 달았지만(2026-08-26),
                  여기서 되돌아가는 곳은 화면 안에서 지금 끌고 있는 그 핀이다.
                  이름은 보조기기와 마우스 툴팁에 간다 */}
              <FloatingControls bottom={0}
                items={[{ icon: "crosshair", label: "핀 위치로 이동", onClick: backToPin }]} />
            </>
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8, background: "var(--surface-sunken)",
              fontSize: "var(--fs-label)", color: "var(--text-muted)", textAlign: "center", padding: "var(--space-4)" }}>
              <Icon name="map-pin-off" size={24} color="var(--text-muted)" />
              {/* 2026-08-25, 사용자 요청 — 「도로명주소를 고르면 좌표가 자동으로 들어오고
                  이 자리에 지도가 뜹니다」에서 고쳤다. 하는 말은 같다 */}
              <span>도로명주소를 선택하면 좌표가 자동으로 입력되며, 해당 위치가 지도에 표시됩니다.</span>
            </div>
          )}
        </div>

        {off ? (
          <p style={{ marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--state-warning)", lineHeight: 1.55 }}>
            용인시 범위(위도 {COORD_BOUNDS.latMin}~{COORD_BOUNDS.latMax} ·
            경도 {COORD_BOUNDS.lngMin}~{COORD_BOUNDS.lngMax}) 밖입니다.
            저장은 되지만 맞는 자리인지 한 번 더 확인해 주세요.
          </p>
        ) : null}
      </div>
    </FormField>
  );
}

export default CoordField;
