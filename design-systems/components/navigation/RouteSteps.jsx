import React from "react";
import { Icon } from "../core/Icon.jsx";

/* 구간별 도보 안내 목록 (U-NV-03). S07 길찾기 화면이 쓴다.
 *
 *   ●  120m 직진              ← 출발
 *   ┃   둔전로
 *   ↰  50m 앞에서 좌회전
 *   ┃   둔전2로 방향
 *   ⚑  30m 앞 도착
 *       둔전마을회관 AED
 *
 * ── 한 줄에 무엇을 적는가 ───────────────────────────────────────────────
 * 명세서의 예시 문구는 "50미터 앞에서 우회전"이다. 거리와 동작이 **한 줄에 같이** 있어야
 * 걸으면서 한 번에 읽힌다. 길 이름은 그 아래 작은 줄로 내린다 — 없어도 안내가 성립하고,
 * 실제로 경로 API 가 이름 없는 골목을 돌려주는 경우가 잦다.
 *
 * 거리는 **직전 안내 지점부터 이 지점까지**다. "총 340m 중 몇 m 지점"이 아니다.
 * 걷는 사람이 알아야 하는 것은 "여기서 얼마나 더 가면 되는가"뿐이다.
 *
 * ── 세로선을 긋는 이유 ──────────────────────────────────────────────────
 * 안내 항목은 목록이 아니라 **순서**다 (S08 코스의 순번과 같은 성격). 세로선이 없으면
 * 같은 무게의 항목이 나열된 것으로 읽혀 "위에서 아래로 따라가는 것"이 전달되지 않는다.
 * 마지막 항목 아래로는 선을 잇지 않는다 — 거기서 끝이라는 표시다.
 *
 * 고정 높이를 주지 않는다 (U-CM-14). 길 이름이 두 줄이 되면 행이 늘어난다.
 */

/* 회전 종류 → 아이콘. 경로 API 마다 코드 체계가 다르므로(카카오·TMAP 모두 숫자 코드다)
   화면에는 이 7종만 들이고, 코드→종류 변환은 데이터 어댑터가 맡는다.
   여기에 API 코드를 직접 적으면 제공자를 바꿀 때 디자인 시스템을 고쳐야 한다. */
export const TURN_ICONS = {
  start: "circle-dot",
  straight: "arrow-up",
  left: "corner-up-left",
  right: "corner-up-right",
  "slight-left": "arrow-up-left",
  "slight-right": "arrow-up-right",
  arrive: "flag",
};

export const TURN_LABELS = {
  start: "출발",
  straight: "직진",
  left: "좌회전",
  right: "우회전",
  "slight-left": "왼쪽 방향",
  "slight-right": "오른쪽 방향",
  arrive: "도착",
};

const meters = m => (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`);

/* 한 줄 안내 문구. 화면과 스크린리더가 같은 문장을 쓰도록 여기 한 곳에서만 만든다.
     출발        "출발"                 (거리가 붙으면 "120m 직진")
     직진        "100m 직진"
     회전        "50m 앞에서 좌회전"
     도착        "30m 앞 도착"
   거리가 없는(0m) 지점은 동작만 적는다 — "0m 앞에서 좌회전"은 읽히지 않는다.
   출발 지점의 거리가 0 인 것은 정상이다: 거기서부터 걷기 시작하므로 걸어온 거리가 없다. */
export function routeStepText(step) {
  if (!step) return "";
  const d = step.dist > 0 ? meters(step.dist) : null;
  if (step.type === "arrive") return d ? `${d} 앞 도착` : "도착";
  if (step.type === "start") return d ? `${d} 직진` : TURN_LABELS.start;
  if (step.type === "straight") return d ? `${d} 직진` : TURN_LABELS.straight;
  return d ? `${d} 앞에서 ${TURN_LABELS[step.type] || TURN_LABELS.straight}` : (TURN_LABELS[step.type] || TURN_LABELS.straight);
}

export function RouteStepRow({ step, index, total, active = false, onClick, style, ...rest }) {
  const last = index === total - 1;
  const text = routeStepText(step);
  const sub = step.type === "arrive" ? step.name : step.road;

  return (
    <button type="button" onClick={onClick} aria-current={active ? "step" : undefined}
      style={{ display: "flex", alignItems: "stretch", gap: "var(--space-3)", width: "100%",
        minHeight: "var(--tap-comfortable)", padding: "var(--space-2) var(--space-2)",
        background: active ? "var(--yong-blue-100)" : "transparent",
        border: "none", borderRadius: "var(--radius-sm)", textAlign: "left", cursor: "pointer", ...style }}
      {...rest}>

      {/* 아이콘 기둥 — 동그라미와 그 아래로 이어지는 세로선. 선은 행 높이만큼 늘어난다 */}
      <span style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", width: 34 }}>
        <span style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: 999,
          background: step.type === "arrive" ? "var(--brand-primary)" : "var(--yong-blue-100)",
          color: step.type === "arrive" ? "var(--text-on-brand)" : "var(--yong-blue-500)" }}>
          <Icon name={TURN_ICONS[step.type] || TURN_ICONS.straight} size={20} />
        </span>
        {last ? null : (
          <span aria-hidden="true" style={{ flex: 1, width: 2, minHeight: 10, marginTop: 4,
            background: "var(--yong-blue-100)", borderRadius: 999 }} />
        )}
      </span>

      <span style={{ flex: 1, minWidth: 0, paddingTop: 5, paddingBottom: "var(--space-3)" }}>
        <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)",
          fontWeight: "var(--fw-semibold)", color: "var(--text-heading)", lineHeight: 1.45,
          wordBreak: "keep-all" }}>{text}</span>
        {sub ? (
          <span style={{ display: "block", marginTop: 2, fontSize: "var(--fs-caption)",
            color: "var(--text-muted)", lineHeight: 1.45, wordBreak: "keep-all" }}>{sub}</span>
        ) : null}
      </span>
    </button>
  );
}

export function RouteSteps({ steps = [], activeIndex = -1, onPick, style, ...rest }) {
  return (
    <div role="list" style={{ display: "flex", flexDirection: "column", ...style }} {...rest}>
      {steps.map((s, i) => (
        <span role="listitem" key={i}>
          <RouteStepRow step={s} index={i} total={steps.length} active={i === activeIndex}
            onClick={onPick ? () => onPick(i) : undefined} />
        </span>
      ))}
    </div>
  );
}
