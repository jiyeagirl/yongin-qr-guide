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
 * 눈금선을 넣으면 그 둘이 격자 뒤로 숨는다.
 *
 * ── 값은 막대 끝 위에 적는다 (2026-08-20) ──────────────────────────────────
 * 전에는 오른쪽 위에 「최대 833」 한 줄만 있었다. 그 한 줄로는 **어느 막대가 그 값인지**,
 * 나머지 날이 몇 건인지 알 수 없어, 담당자는 결국 막대마다 마우스를 올려 보게 된다
 * (그마저도 마우스가 없으면 못 한다). 그래서 최댓값 표시를 걷어내고 값을 막대 위에 적는다.
 *
 * 다만 서른 개를 다 적으면 12px 숫자가 16px 막대 위에서 서로 겹친다. 그래서 자리가
 * 모자라면 **띄엄띄엄** 적되, 가장 높은 날과 마지막 날은 언제나 적는다 — 「언제 튀었나」와
 * 「오늘 몇 건인가」가 이 그래프를 보는 두 가지 이유다. 기본 기간인 7일에서는 전부 적힌다.
 * 적히지 않은 막대의 값은 마우스를 올리면 뜨고(<title>), 아래 숨은 목록에는 60일치가
 * 하나도 빠짐없이 들어 있다.
 *
 * 숫자를 SVG 안에 넣지 않는 이유: 이 그래프는 preserveAspectRatio="none" 이라
 * 가로로 늘어난다. 그 안의 <text> 는 글자까지 함께 늘어나 뭉개진다.
 *
 * ── 막대가 적어도 굵어지지 않는다 (2026-08-24) ─────────────────────────────
 * viewBox 를 자료 개수에 맞춰 만들면 「오늘」(1일)을 골랐을 때 막대 하나가 카드 폭
 * 전체로 늘어난다. 같은 그래프가 기간만 바꿨는데 다른 물건처럼 보이고, 굵기 자체가
 * 값인 것처럼 읽힌다. 그래서 칸수의 하한을 `minSlots`(기본 7 — 기본 기간이 7일이다)로
 * 두고, 자료가 그보다 적으면 남는 칸을 양옆 여백으로 쓴다. 막대 굵기는 7일일 때와
 * 정확히 같고, 적은 자료는 가운데 선다.
 */

const PAD = 2;   /* 막대 사이 간격(퍼센트 아님, viewBox 단위) */

/* 값을 적을 막대를 고른다. 자리가 넉넉하면(막대 12개 이하) 전부, 아니면 띄엄띄엄 +
   가장 높은 날 + 마지막 날. 12는 500px 남짓한 카드에서 세 자리 숫자가 겹치지 않는 수다. */
function labelledIndexes(values) {
  const n = values.length;
  const step = Math.max(1, Math.ceil(n / 12));
  const maxIdx = values.indexOf(Math.max(...values));
  const keep = new Set([maxIdx, n - 1]);
  for (let i = 0; i < n; i += step) {
    /* 늘 적는 두 개와 붙어 버리면 건너뛴다 — 겹쳐 읽히느니 하나가 낫다 */
    if (Math.abs(i - maxIdx) >= step && n - 1 - i >= step) keep.add(i);
  }
  return keep;
}

export function MiniChart({
  data = [], type = "bar", height = 160, minSlots = 7,
  format = v => v.toLocaleString("ko-KR"),
  label = "추이",
  style, ...rest
}) {
  const values = data.map(d => Number(d.value) || 0);
  const max = Math.max(1, ...values);
  /* viewBox 를 값의 개수에 맞춰 만든다. 픽셀이 아니라 비율로 그리므로
     폭이 얼마든(1024px ~ 1600px) 막대 굵기가 스스로 맞는다.
     칸수에 하한(minSlots)이 있어 자료가 적어도 막대가 굵어지지 않는다 */
  const slots = Math.max(1, minSlots, data.length);
  const offset = (slots - data.length) / 2;   /* 남는 칸의 절반 — 자료를 가운데 세운다 */
  const W = slots * 10;
  const H = 100;

  const bars = data.map((d, i) => {
    const h = (Number(d.value) || 0) / max * H;
    return { ...d, x: (offset + i) * 10 + PAD / 2, y: H - h, w: 10 - PAD, h };
  });

  const line = bars.map((b, i) => `${i === 0 ? "M" : "L"}${b.x + b.w / 2},${b.y}`).join(" ");
  /* 면은 막대가 선 자리에서만 닫는다 — viewBox 끝이 아니다(양옆 여백이 있을 수 있다) */
  const area = bars.length
    ? `${line} L${bars[bars.length - 1].x + bars[bars.length - 1].w / 2},${H} L${bars[0].x + bars[0].w / 2},${H} Z`
    : "";

  const labelled = labelledIndexes(values);

  return (
    <div style={style} {...rest}>
      {/* 위쪽 여백은 가장 높은 막대의 숫자가 설 자리다 — 없으면 카드 밖으로 잘린다 */}
      <div style={{ position: "relative", paddingTop: 20 }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true"
          style={{ display: "block", width: "100%", height, overflow: "visible" }}>
          {type === "line" ? (
            <>
              <path d={area} fill="var(--brand-primary-soft)" />
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

        {/* 막대 끝 위의 숫자. SVG 밖의 겹친 층이라 글자가 늘어나지 않는다.
            세로 위치는 막대 높이(값/최댓값)를 퍼센트로 그대로 쓴다 — 막대와 같은 계산이라
            둘이 어긋날 수 없다. pointerEvents:none 이라 막대의 <title> 을 가리지 않는다. */}
        <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: 20, height,
          pointerEvents: "none" }}>
          {bars.map((b, i) => (labelled.has(i) ? (
            <span key={i} style={{ position: "absolute",
              left: `${((offset + i + 0.5) / slots) * 100}%`,
              bottom: `calc(${(b.h / H) * 100}% + 3px)`, transform: "translateX(-50%)",
              fontSize: "var(--fs-micro)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
              fontWeight: b.h === H ? "var(--fw-bold)" : "var(--fw-medium)",
              color: b.h === H ? "var(--brand-primary)" : "var(--text-muted)" }}>
              {format(Number(b.value) || 0)}
            </span>
          ) : null))}
        </div>
      </div>

      {/* 양 끝 날짜만 적는다. 서른 개를 다 적으면 글자가 겹쳐 아무 것도 안 읽힌다.
          여백이 있을 때는 그만큼 안쪽으로 들여 막대 끝에 맞춘다(자료가 꽉 차면 0%라
          전과 같다). 하루치면 양 끝이 같은 날이므로 한 번만, 막대 아래 가운데 적는다. */}
      {data.length ? (
        <div style={{ display: "flex",
          justifyContent: data.length === 1 ? "center" : "space-between",
          padding: `0 ${(offset / slots) * 100}%`, marginTop: 6,
          fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>
          <span>{data[0].label}</span>
          {data.length > 1 ? <span>{data[data.length - 1].label}</span> : null}
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
