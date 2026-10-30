import React from "react";

/* 발자국 동선 (2026-10-19, 사용자 요청) — 가게 상세의 머리(이 가게)에서 아래 「현재 가게에서 시작하는 골목 한바퀴 코스」로
   이어지는 길. 가게 상세와 코스 추천이 따로 떨어진 두 영역이 아니라 **한 번의 탐방**이라는 것을 눈으로 잇는다.

   단순하게 다듬었다(같은 날 사용자 요청): 높이는 절반, 길은 **한 번만 완만하게 휘는 얇은 점선 하나**, 시작점 원은 없고
   끝에 작은 점 하나만 둔다. 색은 브랜드 그린을 45% 투명도로 낮춰 본문보다 앞서지 않게 했다.

   발자국은 코스 카드가 쓰는 `footprints` 아이콘(lucide)의 **발 하나씩**이다(속을 칠해 보았으나 윤곽선이 낫다고 해 되돌렸다) — 아이콘은 두 발이 한 쌍으로 붙어 있어
   그대로 놓으면 사람이 두 발을 모으고 걷는 것처럼 보인다. 그래서 아이콘의 왼발 · 오른발 경로를 따로 떼어 **번갈아**
   (왼 · 오른 · 왼 · 오른) 길의 양쪽에 같은 크기 · 같은 간격으로 네 개, 진행 방향으로 기울여 놓는다.

   장식이라 보조기기에는 숨긴다(aria-hidden). 높이는 가로세로 비율로 정해진다(고정 높이 금지 — U-CM-14). */

/* 길은 3차 베지어 하나다(아래 path 와 같은 곡선). 발자국은 이 곡선 위의 같은 간격 점에서 접선 방향으로 놓는다 */
const W = 320, H = 32;
const P = [[6, 5], [120, 5], [200, 27], [306, 24]];
const at = t => {
  const u = 1 - t;
  const f = k => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k];
  const d = k => 3 * u * u * (P[1][k] - P[0][k]) + 6 * u * t * (P[2][k] - P[1][k]) + 3 * t * t * (P[3][k] - P[2][k]);
  return { x: f(0), y: f(1), a: (Math.atan2(d(1), d(0)) * 180) / Math.PI };
};
const SIDE = 4;   /* 길 중심에서 좌우로 벌어지는 거리(viewBox 단위) — 왼발 · 오른발의 격차 */
const FEET = [0.2, 0.4, 0.6, 0.8].map((t, i) => {
  const p = at(t);
  const left = i % 2 === 0;
  const n = ((p.a - 90) * Math.PI) / 180;   /* 진행 방향의 왼쪽 법선 */
  const s = left ? SIDE : -SIDE;
  return { x: p.x + Math.cos(n) * s, y: p.y + Math.sin(n) * s, a: p.a, left };
});
/* lucide footprints — 왼발(발바닥 · 발볼 줄)과 오른발. 각각 자기 영역만 잘라(viewBox) 한 발씩 그린다 */
const LEFT = { box: "2 1 9 18", d: ["M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z", "M4 13h4"] };
const RIGHT = { box: "13 5 9 18", d: ["M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z", "M16 17h4"] };
const FOOT_H = 15;   /* 발 하나의 높이(px) — 네 개가 모두 같다 */

/* tone="member" — 상인회 정회원 가게 상세에서는 길을 골드(--member-accent)로 칠한다 (2026-10-30, 사용자 요청).
   골드는 초록보다 밝아 같은 45% 로는 흐려져 70% 로 둔다 */
export function FootprintTrail({ tone, style, ...rest }) {
  const member = tone === "member";
  return (
    <div aria-hidden="true" style={{ position: "relative", width: "100%", aspectRatio: `${W} / ${H}`,
      color: member ? "var(--member-accent)" : "var(--brand-primary)", opacity: member ? 0.7 : 0.45, ...style }} {...rest}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" focusable="false" style={{ position: "absolute", inset: 0 }}>
        <path d={`M${P[0]} C ${P[1]}, ${P[2]}, ${P[3]}`} fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeDasharray="1 6" />
        <circle cx={P[3][0]} cy={P[3][1]} r="3" fill="currentColor" />
      </svg>
      {FEET.map((f, i) => {
        const g = f.left ? LEFT : RIGHT;
        return (
          <svg key={i} viewBox={g.box} width={FOOT_H / 2} height={FOOT_H} focusable="false" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: `${(f.x / W) * 100}%`, top: `${(f.y / H) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${(f.a + 90).toFixed(1)}deg)` }}>
            {g.d.map((d, k) => <path key={k} d={d} />)}
          </svg>
        );
      })}
    </div>
  );
}

export default FootprintTrail;
