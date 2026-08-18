const { Chip, CategoryIcon, CATEGORY_LABELS, Badge, Input, Switch, Button, ListRow, FacilityIcon, Icon, SectionHeader, Notice } = window.DesignSystem_5c90e8;

function StoreRow({ s, onPick }) {
  return (
    <ListRow onClick={onPick} icon={<CategoryIcon type={s.cat} size={22} />}
      title={s.name}
      tag={s.onnuri ? <Badge size="sm" tone="onnuri">온누리</Badge> : null}
      meta={`${s.biz} · 약 ${s.dist}m, 도보 ${Math.max(1, Math.round(s.dist / 67))}분 · ${s.addr}`} />
  );
}

function DistrictSheet({ data, cat, setCat, onnuriOnly, setOnnuriOnly, q, setQ, onPickStore, onOpenFestival }) {
  let rows = data.stores.filter(s => (cat === "all" || s.cat === cat) && (!onnuriOnly || s.onnuri) && (!q || s.name.includes(q)));
  const shown = data.chips.find(c => c.id === cat);
  return (
    <div style={{ paddingBottom: "var(--space-9)" }}>
      {/* 스크롤되는 헤더 영역: 검색 · 온누리 토글 · 축제 배너 */}
      <div style={{ padding: "0 var(--gutter-screen) var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <button onClick={onOpenFestival} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3) var(--space-4)", background: "var(--brand-accent-soft)", border: "var(--stroke-hairline) solid var(--yong-cream-300)", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left" }}>
          <Icon name="party-popper" size={22} color="var(--yong-cream-900)" />
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)" }}>{data.festival.name}</span>
            <span style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-body)", marginTop: 2 }}>{data.festival.state} · {data.festival.date}</span>
          </span>
          <Icon name="chevron-right" size={20} color="var(--yong-ink-300)" />
        </button>
        <Input icon="search" placeholder="업체명 검색" value={q} onChange={e => setQ(e.target.value)} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", padding: "var(--space-2) 0" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-body)", color: "var(--text-heading)", fontWeight: "var(--fw-semibold)" }}>
            <Icon name="ticket" size={20} color="var(--brand-secondary)" />온누리 가맹점만
            <span style={{ fontSize: "var(--fs-caption)", fontWeight: "var(--fw-medium)", color: "var(--text-muted)" }}>{data.district.onnuri}곳</span>
          </span>
          <Switch checked={onnuriOnly} onChange={setOnnuriOnly} />
        </div>
      </div>
      {/* 고정되는 영역: 업종 칩 한 줄만 sticky */}
      <div style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", gap: 8, overflowX: "auto", padding: "var(--space-3) var(--gutter-screen)",
        background: "rgba(255,255,255,.96)", backdropFilter: "var(--blur-glass)", borderBottom: "var(--stroke-hairline) solid var(--border-default)" }}>
        {data.chips.filter(c => c.count > 0).map(c => (
          <Chip key={c.id} selected={cat === c.id} count={c.count} icon={<CategoryIcon type={c.id} size={18} />} onClick={() => setCat(c.id)}>{c.label}</Chip>
        ))}
      </div>
      <div style={{ padding: "var(--space-4) var(--gutter-screen) 0" }}>
        <SectionHeader title={`신규 · 인기 매장`} />
        <div style={{ display: "flex", gap: "var(--space-2)", overflowX: "auto", paddingBottom: "var(--space-2)" }}>
          {data.popular.map(p => (
            <button key={p.name} onClick={onPickStore} style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: 6, minWidth: 148, padding: "var(--space-4)", textAlign: "left",
              background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", cursor: "pointer" }}>
              <CategoryIcon type={p.cat} size={20} />
              <span style={{ fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)" }}>{p.name}</span>
              <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>{p.note}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: "var(--space-5) var(--gutter-screen) 0" }}>
        <SectionHeader title={`${CATEGORY_LABELS[cat] || "전체"} ${rows.length}곳`} action="거리순" />
        {rows.length === 0
          ? <Notice tone="info">조건에 맞는 매장이 없습니다. 업종 칩이나 온누리 조건을 바꿔보세요.</Notice>
          : rows.map((s, i) => <StoreRow key={s.name} s={s} onPick={onPickStore} />)}
        {rows.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-4) 0" }}>
            <Button variant="outline" icon="chevron-down">더 보기 ({Math.max(0, (shown ? shown.count : rows.length) - rows.length)}곳)</Button>
          </div>
        )}
      </div>
      <div style={{ padding: "var(--space-5) var(--gutter-screen) 0" }}>
        <SectionHeader title="인근 편의시설" />
        <div style={{ background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "var(--space-2) var(--space-4)" }}>
          {data.nearby.map((n, i) => (
            <ListRow key={n.name} icon={<FacilityIcon type={n.type} size={22} />} title={n.name} meta={n.detail} divider={i < data.nearby.length - 1} onClick={onPickStore} />
          ))}
        </div>
      </div>
      <div style={{ padding: "var(--space-5) var(--gutter-screen) 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <Button variant="outline" block icon="store">다른 상점가 둘러보기 (32개소)</Button>
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: 1.5 }}>
          점포 정보 {data.district.asOf} · 안내 정보는 참고용입니다. 응급 상황에는 119로 연락해 주세요.
        </p>
        <button style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, minHeight: "var(--tap-min)", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-semibold)", color: "var(--text-link)" }}>
          <Icon name="flag" size={16} />정보 오류 신고
        </button>
      </div>
    </div>
  );
}
window.DistrictSheet = DistrictSheet;
