# 용인시 QR 기반 공공시설 · 골목형 상점가 위치안내 — 모바일 웹 디자인 시스템

Design system for the citizen-facing mobile web of Yongin City's **QR 기반 공공시설 및 골목형 상점가 위치안내 서비스**. A citizen scans a QR sticker in the street; the scanned point becomes the fixed anchor ("내 위치"), and from there the service answers three questions: where the nearest 생활안전 편의시설 is (AED, 화장실, 쉼터, 대피소), what is inside the 골목형 상점가 they are standing in (수백 개 점포, 온누리 가맹 여부), and what 축제 is on. Walking directions come from the 카카오맵 도보 길찾기 API.

No app install, no login, no membership. Primary users include older residents and people with low vision, so 16px body text, 44px+ targets and WCAG AA contrast are hard constraints, and the layout must survive a 1.5× text enlargement in 2차.

The brand image is **조아용**, the Yongin city mascot (green dragon, cream belly, gold horns, teal spine). Its use is deliberately bounded — see below.

## Sources provided
- 기능명세서 — this system was first built against **v0.8** (13화면, S07 상점가 상세가 대표 화면) and has tracked the document since; the current edition is **v1.1 (2026-08-20)**, whose 4장 lists 14 screens and whose 대표 화면 is S03 상점가 탭. What the system reads from it: 확정 결정사항, 화면 목록, 데이터 처리 방안(3장), 디자인 방향(5장), 지도 오버레이 레이어 규칙(5-3), 핸드오프(7장). See the 개정 이력 at the top of `docs/functional_specifications.md`.
- Referenced upstream documents (not supplied to this project): `2026년 QR기반 공공시설 및 골목형상점가 위치 안내_사업계획서_나인라이트.pdf`, `용인시 서비스 아이디어 및 추진 방안 제안_내부공유.pdf`, 소상공인시장진흥공단 상가(상권)정보 경기 202606, 전국 온누리상품권 가맹점 현황 20250731, 둔전 골목형 상점가 정보 xlsx.
- 14 PNG artworks of 조아용 → `assets/character/`.
- Pretendard OTF, 9 weights → `assets/fonts/`.

**There is no logo file.** The service name is set in Pretendard where a mark would go; no logo was drawn. No screenshots or existing code were supplied, so screens are built from the 기능명세서 text, not from a recreation.

## Index
| Path | What it is |
| --- | --- |
| `styles.css` | Global entry — `@import` list only |
| `tokens/` | `fonts`, `colors`, `typography`, `spacing`, `radius`, `elevation`, `motion`, `icons`, `layers`, `base` |
| `assets/character/` | 14 조아용 PNGs · `assets/fonts/` Pretendard 100–900 |
| `components/core/` | Icon, FacilityIcon, CategoryIcon, Button, IconButton, Card, Badge, Chip, PictogramTile, ListRow, SectionHeader, Input, Select, Checkbox, Radio, Switch |
| `components/navigation/` | AppBar, ContextBar, TabBar, SegmentedTabs, ProgressSteps |
| `components/feedback/` | Notice, Toast, Sheet, FloatingControls, EmptyState |
| `components/map/` | MapCanvas (카카오맵 SDK 자리의 목업) |
| `components/brand/` | Mascot, MascotBubble, StatTile |
| `ui_kits/qr_guide/` | **S07 상점가 상세** — the reference screen |
| `guidelines/` | Specimen cards (colour, type, spacing, overlay layers, icons, mascot) |
| `SKILL.md` | Agent-Skills entry point |

### Intentional additions
No component library was supplied, so the inventory is derived from the 13-screen list: **FacilityIcon / CategoryIcon** (the swappable icon wrappers the spec asks for in 5-2), **ContextBar** (U-CM-04), **MapCanvas** + **FloatingControls** + the 3-snap **Sheet** (5-3), **Notice** doubling as the 원거리 안내 배너 (U-FC-09), and **Mascot / MascotBubble** as the only sanctioned way to place 조아용.

## What this system fixes (spec 7장 1단계)
1. **Sheet snaps** — collapsed 25% / half 55% / full 100% **of the map area** (not the viewport): `--sheet-collapsed / --sheet-half / --sheet-full`, leaving 75% / 45% / 0% of the map visible. Drag or tap the handle to move. Full covers the map entirely, so no scrim is used — a **[지도]** button in the sheet header is the way back.
2. **Map padding** — `--map-pad-collapsed 30% / --map-pad-half 60% / --map-pad-full 60%` of the map area, passed to the map so a tapped marker rises clear of the sheet and updates with the snap. At runtime the map is handed the sheet's *measured* px height (`Sheet` → `onHeightChange`), so it stays correct under 2차 글자 확대.
3. **Floating controls** — anchored to the sheet's top edge (`--z-float`), so 목록 토글 and QR-복귀 ride up with it instead of disappearing behind it.
4. **Filter fixing (S07)** — only the **category chip row** is sticky. 검색창 and 온누리 칩 sit in the scrolling sheet header, so filters never occupy 40% of the screen.
5. **List/map switch** — one surface, not two routes: 목록 raises the sheet to full, QR-복귀 drops it to collapsed.
6. **Overlay stack** — `--z-map 100 / --z-marker 200 / --z-filter 300 / --z-float 400 / --z-tabbar 450 / --z-sheet 500 / --z-popover 550 / --z-modal 600 / --z-toast 700`, identical on all six map screens. `--z-popover` (added 2026-08-26) is for lists a field opens beneath itself — above the page's own content, never above a modal.
7. **조아용 boundary** — 홈 진입부(S02), 빈 상태(S13), 안내 일러스트, and the **QR 스캔 지점 ContextBar** (amended 2026.08). Information screens (시설 상세, 경로 안내, 점포 목록, 지도 마커) stay neutral. In the ContextBar the character *replaces* the `qr-code` glyph rather than sitting beside it, so the "never mixes into an icon row" rule still holds. Max one character per screen, ~38px, face-forward pose only.
8. **2차 자리 비우기** — 언어·음성·글자 크기 버튼은 화면에 노출하지 않는다. AppBar's `actions` slot is where they will land later; no disabled buttons, no placeholders.
9. **고정 높이 금지** — every control uses `min-height`, so a 1.5× text scale grows the layout instead of clipping it.

## Content fundamentals
- **Language:** Korean. Two registers, kept apart.
  - *Service voice* — anything with a rule, a distance, a date. Plain 합니다체: "안내 정보는 참고용입니다.", "가장 가까운 대피소는 1.4km 떨어져 있습니다."
  - *조아용's voice* — only in `MascotBubble`, `EmptyState`, and confirmation toasts on the home surface. Warm 해요체 with the mascot's -용 ending: "안녕하세용! 둔전 골목 어디로 안내해 드릴까용?", "신고가 접수되었어용". Never on legal text, distances, or emergency copy.
- **Distances:** always "약 320m, 도보 5분" — 직선거리 기준임을 상세에서 밝힌다. Walk minutes ≈ distance ÷ 67.
- **Counts:** "335곳", "온누리 139" — 상점가 점포 수는 실제 매칭 수치를 쓴다. 지정 요건 산정용 수치(둔전 108)는 화면에 절대 노출하지 않는다.
- **Status words** fixed: 진행중 / 예정 / 종료 (축제), 개방 / 이용가능 (시설), 온누리 (가맹).
- **Safety copy** is always present on information screens: "안내 정보는 참고용입니다. 응급 상황에는 119로 연락해 주세요." plus the 기준일자 (예: "점포 정보 2026.06 기준").
- **Emoji: never.** The mascot carries warmth; icons carry meaning.
- **Labels:** noun phrases (주변 공공시설, 신규 · 인기 매장); buttons are verb phrases (길찾기, 주소 복사, 더 보기, 다른 상점가 둘러보기). 중간점 `·` separates metadata.

## Visual foundations
**Colour.** Sampled from the character, then split. `--character-green #66ce94`, `--character-teal #179496`, `--character-cream #fef5aa` are for illustration and the mascot only. UI colour sits one step deeper for AA contrast: `--brand-primary` green-700 `#2f9260` (actions, active tab, anchor marker), `--brand-secondary` teal-700 `#0f6e70` (links, secondary), `--brand-accent` cream-300 (축제 배너). Emergency red `--pin-emergency` is reserved for AED and 대피소 — never used decoratively. Two background colours per screen: `--surface-page` mist and white cards; the map base is the neutral grid.

**Type.** Pretendard, nine weights. Body 16px is the floor (below it iOS Safari zooms on input focus). 18px for primary reading lines, 15px labels, 14px meta, 12px badges only. Headings 700–800 with negative tracking. Line-height 1.55–1.62 for Korean.

**Layout.** Single column, 390–430px, 20px gutter, 28px between sections. AppBar 56px + ContextBar are sticky; on map screens the sheet owns the lower half. No fixed heights anywhere — `min-height` only.

**Backgrounds.** No photography, no gradients, no textures. Flat fills; the map grid is the only pattern. The mascot PNG is the only imagery.

**Borders, corners, shadows.** Hairlines only — 1px `--border-default` on cards, 1px `--border-strong` on fields and the outline button, 1px `--border-brand` on an emphasis card. **No black outlines on UI**; the character's ink line belongs to the artwork. Radii 6/10/14/20/26/32 + pill; cards 20, sheet 28. Shadows: `--shadow-card` on cards, `--shadow-raised` on floating controls and toasts, `--shadow-sheet` on the sheet. No inner shadows, no glows.

**Hover, press, focus.** Press is what matters: buttons and tiles scale to 0.96 (`--press-scale`); no opacity fades. Hover (pointer only) deepens the fill one step. Focus is a 1px teal border + 3px teal 28% ring (`--shadow-focus`). Disabled is 42% opacity.

**Motion.** 120ms feedback, 200ms state, 320ms sheet snap with `--ease-out`; `--ease-bounce` only for the mascot, the switch knob and toasts. 조아용 idles with a 2.6s `yong-bob`. No scroll animation, no parallax.

**Transparency and blur.** Three places only: the plain AppBar, the sticky chip row inside the sheet, and the map-note chip. Scrim `rgba(22,34,28,.42)` at the full snap.

## Iconography
- **Set:** **Lucide** (ISC), loaded from the CDN UMD build per page. No other icon system, no icon font, no emoji, no Unicode dingbats.
- **Wrappers:** screens never name a glyph directly for domain concepts. `<FacilityIcon type="aed" />` and `<CategoryIcon type="cafe" />` hold the mapping in one place (spec 5-2), so a glyph swap before launch is a one-line change.
  - 시설 4종: aed → `heart-pulse`, toilet → `toilet`, rest → `armchair`, shelter → `shield`.
  - 업종 7종: all → `layout-grid`, food → `utensils`, cafe → `coffee`, shop → `shopping-bag`, beauty → `scissors`, culture → `palette`, etc → `ellipsis`.
- **Style rules:** Lucide default line style, stroke-width untouched on every screen. **No fills, no tinted background squares behind icons.** Sizes 16 inline / 20 rows / 24 tabs and headers / 28 tiles. Safety hierarchy is carried by colour (`--pin-emergency`) and list order, not by a heavier glyph.
- **Character vs icon:** never in the same cluster. 조아용 appears as PNG artwork in `Mascot`, `MascotBubble`, `EmptyState`, and the `ContextBar` leading slot only — never cropped, recoloured, rotated, or redrawn. 60px+ for illustration; down to 38px in the ContextBar, where only a face-forward pose (`hello`) survives the size.

## Known gaps
- Only **S07** is built. S01–S06, S08–S13 are not; they reuse these primitives and the fixed overlay rules.
- **No real map.** `MapCanvas` is a labelled stand-in; cluster and pin positions are fake. 카카오맵 SDK, 경로 폴리라인, 턴바이턴 데이터는 미연동.
- Only 둔전 dummy data (335 점포 / 139 온누리 / 7 chip counts from spec 3-4). The other 31 상점가는 데이터만 확보 상태.
- No official colour spec or logo; palette sampled from PNG artwork.
- 관리자 웹(2장)은 범위 외.
- Open items from spec 6장 (색약 보조 구분, 코스 생성 방식, 스탬프 식별, 언어셋, 부스 자료) are not designed for.
