const { AppBar, ContextBar, IconButton, MapCanvas, Sheet, FloatingControls, Toast } = window.DesignSystem_5c90e8;

function App() {
  const d = window.DUNJEON;
  const [snap, setSnap] = React.useState("half");
  const [cat, setCat] = React.useState("all");
  const [onnuriOnly, setOnnuriOnly] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [toast, setToast] = React.useState(null);
  const pad = { collapsed: "var(--map-pad-collapsed)", half: "var(--map-pad-half)", full: "var(--map-pad-full)" }[snap];
  const say = m => { setToast(m); setTimeout(() => setToast(null), 2000); };
  return (
    <div style={{ position: "relative", width: 390, height: 844, overflow: "hidden", background: "var(--surface-page)", borderRadius: 28, border: "var(--stroke-hairline) solid var(--border-default)", boxShadow: "0 18px 48px rgba(22,34,28,.18)", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", zIndex: "var(--z-filter)" }}>
        <AppBar back onBack={() => say("이전 화면으로 (S02 홈)")} title="둔전 골목형 상점가"
          actions={<IconButton name="flag" label="오류 신고" onClick={() => say("오류 신고 화면으로 (S12)")} />} />
        <ContextBar place={d.anchor} onReset={() => { setSnap("collapsed"); say("QR 지점으로 이동했습니다"); }} />
      </div>
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <MapCanvas anchorLabel={d.anchor} bottomPad={pad}
          clusters={[{ label: "128", x: "30%", y: "26%" }, { label: "76", x: "68%", y: "20%" }, { label: "41", x: "52%", y: "34%" }]}
          pins={[{ label: "AED", icon: "heart-pulse", x: "22%", y: "40%", emergency: true }, { label: "화장실", icon: "toilet", x: "76%", y: "38%" }]} />
        <FloatingControls hidden={snap === "full"} bottom={{ collapsed: "var(--sheet-collapsed)", half: "var(--sheet-half)", full: "var(--sheet-full)" }[snap]}
          items={[{ icon: "list", label: "목록으로", text: "목록", onClick: () => setSnap("full") }, { icon: "qr-code", label: "QR 지점으로", onClick: () => { setSnap("collapsed"); say("QR 지점으로 이동했습니다"); } }]} />
        <Sheet title={d.district.name} subtitle={`${d.district.area} · 점포 ${d.district.stores} · 온누리 ${d.district.onnuri}`} snap={snap} onSnapChange={setSnap}>
          <window.DistrictSheet data={d} cat={cat} setCat={setCat} onnuriOnly={onnuriOnly} setOnnuriOnly={setOnnuriOnly} q={q} setQ={setQ}
            onPickStore={() => say("점포 상세로 (S08)")} onOpenFestival={() => say("축제 상세로 (S11)")} />
        </Sheet>
        {toast && <div style={{ position: "absolute", left: 0, right: 0, bottom: 24, zIndex: "var(--z-toast)", display: "flex", justifyContent: "center" }}><Toast icon="info">{toast}</Toast></div>}
      </div>
    </div>
  );
}
window.App = App;
