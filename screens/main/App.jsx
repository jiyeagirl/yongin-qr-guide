import React from "react";
import { QrEntry } from "../boot/QrEntry.jsx";
import { EntryFallback } from "../boot/EntryFallback.jsx";
import { MainApp } from "./MainApp.jsx";
import { readQrCode, readReviewFlags, resolveQr } from "./data/qr.js";

/* 진입 게이트 — 이 저장소의 **화면 진입점**이다 (index.html 과 tools/build.mjs 가 여기를 연다).
 *
 *   QR 스캔 → S01 QrEntry (로딩)  ─ ok ────→  MainApp (셸: S02·S03·S04 탭)
 *                                └ unknown ┐
 *                                └ inactive ┴→ S11 EntryFallback
 *
 * ── 왜 MainApp 안이 아니라 그 바깥인가 ─────────────────────────────────────
 * 셸(MainApp)은 지도를 만들고 335곳을 그린다. QR 이 잘못됐을 때 그 셸을 띄운 뒤 위에
 * 안내를 덮으면, 보여줄 수도 없는 지도를 이미 다 만든 뒤가 된다. 여기서 갈라두면
 * 잘못된 QR 로 들어온 사람은 지도 SDK 를 아예 내려받지 않는다.
 *
 * 반대로 정상 진입에서는 이 컴포넌트가 **한 번만** 갈라지고 그 뒤로는 관여하지 않는다.
 * 셸이 마운트된 뒤 다시 언마운트되는 일이 없어야 U-CM-16(지도 재로딩 금지)이 지켜진다.
 *
 * ── 상세 화면(S05~S10)은 여기서 다루지 않는다 ──────────────────────────────
 * 그것들은 셸 위에 덮이는 오버레이이고 해시 라우터가 연다 (router.js). 여기서 갈라지는
 * 것은 "셸을 띄울 수 있는가" 하나뿐이다 — 조건이 늘어나면 진입이 느려진다.
 */
export function App() {
  const code = React.useMemo(() => readQrCode(), []);
  const flags = React.useMemo(() => readReviewFlags(), []);

  /* boot → 조회 중(S01) · ok → 셸 · 그 외 → S11.
     attempt 는 [다시 시도]용 — 값이 바뀌면 QrEntry 가 다시 마운트되며 조회를 새로 건다. */
  const [phase, setPhase] = React.useState("boot");
  const [result, setResult] = React.useState(null);
  const [attempt, setAttempt] = React.useState(0);

  const onResolved = React.useCallback(r => {
    setResult(r);
    setPhase(r.status === "ok" ? "ok" : "fallback");
  }, []);

  const retry = React.useCallback(() => {
    setResult(null);
    setPhase("boot");
    setAttempt(n => n + 1);
  }, []);

  if (phase === "boot") {
    return <QrEntry key={attempt} code={code} onResolved={onResolved} />;
  }

  if (phase === "fallback") {
    const r = result || resolveQr(code);
    return (
      <EntryFallback
        status={r.status}
        code={r.code}
        point={r.point}
        onRetry={retry}
        /* 고른 상점가의 요약은 EntryFallback 이 그 자리에서 펼친다 (그쪽 주석 참조).
           여기서 더 할 일은 없다 — 셸은 QR 지점이 있어야 서기 때문이다. */ />
    );
  }

  /* 정상 진입 — 여기서부터는 셸이 화면을 전부 맡는다.
     noDistrict 는 S03-E(U-ST-16) 검수 플래그다 (data/qr.js 머리말 참조). */
  return <MainApp qr={result ? result.point : null} noDistrict={flags.noDistrict} />;
}

export default App;
