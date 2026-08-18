Floating controls that ride on top of the bottom sheet instead of being buried by it.

```jsx
<FloatingControls bottom="var(--sheet-half)" items={[{icon:"list", label:"목록으로", text:"목록"}, {icon:"qr-code", label:"QR 지점으로"}]} />
```

Always pass the same snap token the Sheet is using, so the buttons move with it. Pass `hidden` at the full snap — the position is clamped to the map area, but at 90% the sheet is the whole surface and the controls would sit over the header.
