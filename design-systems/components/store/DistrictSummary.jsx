import React from "react";
import { Icon } from "../core/Icon.jsx";

/* 상점가 구역 안내 (U-ST-02). 상점가 탭 시트 헤더가 쓴다.
   구역 경계는 폴리곤이 아니라 도로명주소 목록으로 판정하므로 (기능명세서 3-2)
   화면에는 소재지를 글로 적고 지도에는 점포 마커만 찍는다.

   ── 점포·온누리 수를 뺐다 (2026-08-18) ────────────────────────────────────
   U-ST-03 의 헤더 수치를 여기 적고 있었는데, **바로 아래에서 두 번 다시 나온다.**
   목록 제어 줄의 "전체 335곳"이 점포 수이고, 온누리 토글의 "139곳"이 가맹 수다.
   게다가 아래 둘은 조건을 걸면 함께 줄어드는 살아 있는 수인데 헤더의 것만 고정이라,
   업종을 좁히고 나면 같은 화면에 335 와 42 가 나란히 놓여 어느 쪽이 맞는지 알 수 없었다.

   수치가 사라진 것이 아니라 **한 곳으로 모인 것**이다. 헤더는 "여기가 어디인가"만 맡는다.

   주의: 구역도 xlsx 의 "밀집도에 따른 기준 점포수 108개"는 지정 요건 산정용 수치이며
   실제 점포 수가 아니다. 화면에 노출하면 안 된다 (기능명세서 3-5). */
export function DistrictSummary({ district, style, ...rest }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", ...style }} {...rest}>
      {/* 소재지 한 줄만 둔다. 주요 업종은 바로 아래 업종 칩이 개수까지 붙여 더 정확하게 보여주므로
          같은 정보를 문장으로 한 번 더 적으면 헤더만 길어진다 */}
      <p style={{ display: "flex", alignItems: "center", gap: 6,
        fontFamily: "var(--font-sans)", fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.45 }}>
        <Icon name="map-pin" size={15} color="var(--text-muted)" />
        {district.area}
      </p>
    </div>
  );
}
