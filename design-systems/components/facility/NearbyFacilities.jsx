import React from "react";
import { ListRow } from "../core/ListRow.jsx";
import { SectionHeader } from "../core/SectionHeader.jsx";
import { FacilityIcon } from "../core/FacilityIcon.jsx";

/* 주변 공공시설 (U-ST-07). 명세는 이것을 **상점가 상세와 점포 상세 양쪽 하단**에 요구한다.
   S03 상점가 탭 시트(DistrictSheet)에 인라인으로 있던 블록을 여기로 옮겼다 — 같은 것이
   두 벌 있으면 한쪽만 고쳐지고, 두 화면이 같은 시설을 다르게 말하게 된다.

   ── 이름은 "주변 공공시설"이다 (2026-08-18) ─────────────────────────────────
   명세서 U-ST-07 의 표기는 "인근 편의시설"이지만 화면에는 쓰지 않는다. 두 낱말 다 바꿨다.

     편의시설 → 공공시설   편의시설은 흔히 편의점·카페 같은 상업 시설로 읽히는데, 여기
                          올라오는 넷은 AED·화장실·쉼터·대피소로 전부 공공시설 탭이
                          다루는 것과 **같은 자료**다. 탭 이름이 "공공시설"인데 같은
                          시설을 다른 탭에서 달리 부르면 두 목록이 다른 것으로 읽힌다.
     인근 → 주변           같은 뜻이지만 "주변"이 입말이다. 이 서비스는 회원가입도 없이
                          안내판을 찍고 들어오는 사람이 읽는 화면이라, 문서 말투를
                          그대로 옮기지 않는다.

   목록에 넣는 시설은 화면이 고른다. 지금은 유형별 최근접 1건씩(data/facilities.js 의 NEARBY)
   이며, 공공시설 탭과 같은 원본에서 뽑으므로 두 탭이 같은 시설을 다른 거리로 말하지 않는다.

   행을 FacilityRow 가 아니라 ListRow 로 짜는 이유: 여기는 "가는 곳"이 아니라 "곁에 뭐가 있는지"를
   알리는 자리다. FacilityRow 의 유형 배지·개방시간까지 붙이면 네 줄짜리 보조 정보가
   본문보다 무거워진다. 상세 위치 한 줄이면 충분하다.

   ── 거리는 적는다 ──────────────────────────────────────────────────────────
   목록이 가까운 순이기 때문이다 (2026-08-18). 순서에는 근거가 있는데 화면에 그 근거가 없으면
   왜 이 차례인지 알 수 없고, 급할 때(AED·대피소) 필요한 것이 바로 그 값이다. */
export function NearbyFacilities({ items = [], title = "주변 공공시설", note, onPick, style, ...rest }) {
  if (!items.length) return null;

  const km = m => (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`);

  return (
    <section style={style} {...rest}>
      <SectionHeader title={title} note={note} />
      <div style={{ background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)",
        borderRadius: "var(--radius-card)", padding: "var(--space-2) var(--space-4)" }}>
        {items.map((n, i) => (
          <ListRow key={n.id} icon={<FacilityIcon type={n.type} size={22} />} title={n.name}
            /* 위치 문구의 출처는 유형마다 다르다 — FacilityRow 와 같은 규칙이다
               (AED·대피소는 정의서의 위치 항목, 화장실·쉼터는 도로명주소) */
            meta={n.dist != null ? `${n.place || n.addr} · ${km(n.dist)}` : (n.place || n.addr)}
            divider={i < items.length - 1} onClick={onPick ? () => onPick(n) : undefined} />
        ))}
      </div>
    </section>
  );
}
