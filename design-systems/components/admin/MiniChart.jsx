import React from "react";
import { VisuallyHidden } from "../core/VisuallyHidden.jsx";

/* 대시보드의 추이 그래프 — 순수 SVG. 차트 라이브러리를 넣지 않는다.
 *
 * 이 저장소는 번들러가 직접 만든 것이고(tools/build.mjs) 의존성이 넷뿐이다.
 * 막대 서른 개를 그리자고 그 위에 차트 라이브러리(보통 60~200KB)를 얹으면,
 * 이 화면 하나가 시민용 번들 전체와 맞먹는 무게를 갖는다.
 *
 * ── 그래프는 눈으로만 읽히지 않는다 ─────────────────────────────────────────
 * SVG 자체는 aria-hidden 이다. 대신 같은 자료를 글로 적은 목록을 옆에 숨겨 둔다 —
 * 스크린리더를 쓰는 담당자에게 "그래프"라는 말만 들리고 값이 안 들리면
 * 그 화면에는 아무 정보도 없는 것이다.
 *
 * ── 축을 그리지 않는다 ──────────────────────────────────────────────────────
 * 30일 추이에서 담당자가 읽는 것은 "늘고 있나 줄고 있나"와 "언제 튀었나" 둘이다.
 * 눈금선을 넣으면 그 둘이 격자 뒤로 숨는다. 최댓값만 오른쪽 위에 적고,
 * 막대에 마우스를 올리면 그 날의 값이 뜬다(<title>).
 */

const PAD = 2;   /* 막대 사이 간격(퍼센트 아님, viewBox 단위) */

export function MiniChart({
  data = [], type = "bar", height = 160,
  format = v => v.toLocaleString("ko-KR"),
  label = "추이",
  style, ...rest
}) {
  const values = data.map(d => Number(d.value) || 0);
  const max = Math.max(1, ...values);
  /* viewBox 를 값의 개수에 맞춰 만든다. 픽셀이 아니라 비율로 그리므로
     폭이 얼마든(1024px ~ 1600px) 막대 굵기가 스스로 맞는다 */
  const W = Math.max(1, data.length) * 10;
  const H = 100;

  const bars = data.map((d, i) => {
    const h = (Number(d.value) || 0) / max * H;
    return { ...d, x: i * 10 + PAD / 2, y: H - h, w: 10 - PAD, h };
  });

  const line = bars.map((b, i) => `${i === 0 ? "M" : "L"}${b.x + b.w / 2},${b.y}`).join(" ");

  return (
    <div style={style} {...rest}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", top: 0, right: 0, fontSize: "var(--fs-micro)",
          color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
          최대 {format(max)}
        </span>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true"
          style={{ display: "block", width: "100%", height, overflow: "visible" }}>
          {type === "line" ? (
            <>
              <path d={`${line} L${W - PAD / 2},${H} L${PAD / 2},${H} Z`} fill="var(--brand-primary-soft)" />
              {/* vectorEffect 로 선 굵기가 가로 확대에 딸려 늘어나지 않게 한다 —
                  preserveAspectRatio="none" 때문에 그러지 않으면 선이 뭉개진다 */}
              <path d={line} fill="none" stroke="var(--brand-primary)" strokeWidth={2}
                vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </>
          ) : bars.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={Math.max(b.h, 0.6)} rx={0.8}
              fill="var(--brand-primary)" opacity={0.25 + 0.75 * (b.h / H)}>
              <title>{`${b.label} · ${format(Number(b.value) || 0)}`}</title>
            </rect>
          ))}
        </svg>
      </div>

      {/* 양 끝 날짜만 적는다. 서른 개를 다 적으면 글자가 겹쳐 아무 것도 안 읽힌다 */}
      {data.length ? (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6,
          fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>
          <span>{data[0].label}</span>
          <span>{data[data.length - 1].label}</span>
        </div>
      ) : null}

      <VisuallyHidden as="ul">
        {data.map((d, i) => <li key={i}>{d.label} {format(Number(d.value) || 0)}</li>)}
      </VisuallyHidden>
      <VisuallyHidden>{label}</VisuallyHidden>
    </div>
  );
}

export default MiniChart;
