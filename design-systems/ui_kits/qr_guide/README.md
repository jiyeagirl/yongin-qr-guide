# UI kit — QR 기반 공공시설 및 골목형 상점가 위치안내 (시민용 모바일 웹)

Reference screen **S07 상점가 상세** — the screen the spec names as the one to settle first, because the sheet, the filter bar and the marker clustering all land here and the rules copy out to S03, S05, S06, S09, S13.

| File | What |
| --- | --- |
| `App.jsx` | Frame, AppBar + ContextBar, MapCanvas, 3-snap Sheet, FloatingControls, toast |
| `DistrictSheet.jsx` | Sheet content: festival banner, search, 온누리 toggle, sticky category chips, 신규·인기 매장, store list, 인근 편의시설, 다른 상점가 |
| `data.js` | 둔전 dummy data — 335 stores, 139 온누리, the 7 chip counts from spec 3-4 |

## Decisions this screen fixes

1. **Sheet snaps** — collapsed 25% / half 55% / full 100% of the map area (`--sheet-collapsed/-half/-full`) → 75% / 45% / 0% of the map stays visible. Drag or tap the handle; full covers the map entirely (no scrim), with a **[지도]** button in the sheet header to get back.
2. **Map padding** — `--map-pad-collapsed 30% / -half 60% / -full 60%` is handed to the map so a tapped marker rises above the sheet, and it updates with the snap.
3. **Floating controls** — 목록 토글 and QR-복귀 anchor to the sheet's top edge and move with it, never behind it. The position is clamped to the map area, and the controls fade out at the full snap where the sheet owns the surface.
4. **Filter bar fixing** — only the **category chip row** is sticky. Search and the 온누리 toggle scroll away with the sheet header, so filters never eat 40% of the screen.
5. **List/map switch** — one surface, not two screens: 목록 raises the sheet to full, QR-복귀 drops it to collapsed. No separate list route.
6. **조아용 boundary** — on this screen the character appears **once**, in the QR ContextBar's leading slot (amended 2026.08), where it replaces the `qr-code` glyph. Everything else — list, map, markers, detail — stays neutral.

> **이 폴더는 디자인 단계의 프로토타입이다.** 실제 퍼블리싱 산출물은 `screens/main/` 이며,
> 카카오맵 SDK 실연동, 335개 점포 더미 데이터, 무한 스크롤, 마커 클러스터가 거기 들어 있다.
> 이 프로토타입은 `_ds_bundle.js`(Claude Design 빌드 산출물)를 보므로 그 이후의 디자인 시스템
> 변경분은 반영되어 있지 않다. 확정 수치는 `docs/S07_map_overlay_rules.md` 를 따른다.

## Not built
No live map: `MapCanvas` is a labelled stand-in (카카오맵 SDK 연동 예정) with fake cluster/pin positions. Store rows are 8 of 335 standing in for the infinite scroll. 언어·음성·글자 크기 버튼은 화면에 자리를 두지 않았다 (spec 결정사항 3).
