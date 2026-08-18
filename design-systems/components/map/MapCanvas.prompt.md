Map surface stand-in for publishing mockups — never present it as a working map.

```jsx
<MapCanvas anchorLabel="둔전 시장 입구" clusters={[{label:"128", x:"32%", y:"30%"}]} pins={[{label:"AED", icon:"heart-pulse", x:"70%", y:"38%", emergency:true}]} bottomPad="var(--map-pad-half)" />
```

Hundreds of stores must never be drawn as individual markers — cluster them. Emergency pins (AED, 대피소) use `--pin-emergency`; everything else `--pin-neutral`.
