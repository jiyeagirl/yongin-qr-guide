import React from "react";
import { Badge } from "../core/Badge.jsx";
import { Icon } from "../core/Icon.jsx";
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

/* 소수점 6자리 (V-01). 표기와 저장을 같은 자리에서 자른다 — 화면은 6자리로 보여주고
   데이터에는 14자리가 들어 있으면, 두 값을 견주는 사람이 매번 다른 것을 본다. */
export function fixCoord(v) {
  const n = Number(v);
  return Number.isFinite(n) ? +n.toFixed(6) : null;
}

export function CoordField({
  label = "좌표", lat, lng, name, appKey, onChange, span = 2, height = 240, note,
}) {
  const has = lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const off = has && outOfBounds(lat, lng);

  const pick = React.useCallback((la, ln) => {
    if (onChange) onChange({ lat: fixCoord(la), lng: fixCoord(ln) });
  }, [onChange]);

  return (
    /* 「주소를 고르면 자동으로 들어옵니다」를 뺐다 (2026-08-20) — 빈 지도 자리가 이미
       같은 말을 하고 있고, 주소를 고르고 나면 그 말이 필요 없다. 남긴 한 줄은 설명이 아니라
       **보이지 않는 조작**이다: 지도를 눌러 옮기거나 핀을 끌 수 있다는 것은 화면만 봐서는 모른다. */
    <FormField label={label} required="auto" span={span}
      hint={note || "자리가 틀리면 지도를 눌러 옮기거나 핀을 끌어 맞춥니다."}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: 6 }}>
          <span style={{ fontSize: "var(--fs-label)", fontVariantNumeric: "tabular-nums",
            color: has ? "var(--text-heading)" : "var(--text-muted)" }}>
            {has ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : "좌표 없음"}
          </span>
          {off ? <Badge tone="warning" size="sm">용인시 범위 밖</Badge> : null}
        </div>

        {/* KakaoMap 의 뿌리가 position:absolute 라 크기를 가진 relative 상자가 필요하다 */}
        <div style={{ position: "relative", height, borderRadius: "var(--radius-md)", overflow: "hidden",
          border: "var(--stroke-hairline) solid "
            + (off ? "var(--state-warning)" : "var(--border-default)") }}>
          {has ? (
            /* key 를 주지 않는다. 시민용 셸에서 지도를 다시 만들지 않는 이유(U-CM-16)와는
               다른 이유인데, 여기서는 **핀을 끌 때마다 지도가 새로 생기면 안 되기** 때문이다.
               중심은 처음 좌표에 맞추고, 이후 이동은 핀만 움직인다. */
            <KakaoMap appKey={appKey} center={{ lat: Number(lat), lng: Number(lng) }}
              anchorLabel={name || "지정 위치"} level={3}
              pick={{ lat: Number(lat), lng: Number(lng), label: name }} onPick={pick} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8, background: "var(--surface-sunken)",
              fontSize: "var(--fs-label)", color: "var(--text-muted)", textAlign: "center", padding: "var(--space-4)" }}>
              <Icon name="map-pin-off" size={24} color="var(--text-muted)" />
              <span>도로명주소를 고르면 좌표가 자동으로 들어오고 이 자리에 지도가 뜹니다.</span>
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
