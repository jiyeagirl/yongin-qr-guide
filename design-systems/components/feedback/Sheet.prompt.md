Map bottom sheet — the single sheet used by all six map screens (S03, S05, S06, S07, S09, S13).

```jsx
const [snap, setSnap] = React.useState("half");
<Sheet title="둔전 골목형 상점가" subtitle="점포 335 · 온누리 139" snap={snap} onSnapChange={setSnap}>…</Sheet>
```

Snaps: collapsed 25% / half 55% / full 90% (`--sheet-collapsed/-half/-full`). Drag or tap the handle to move between them; the scrim appears only at full. Pass the matching `--map-pad-*` value to the map so a tapped marker is never hidden behind the sheet. Must sit inside a `position: relative` parent.
