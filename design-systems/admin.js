/* 관리자 웹(/admin/)의 공개 진입점.
 *
 * ── index.js 에 합치지 않은 이유 ────────────────────────────────────────────
 * index.js 는 재수출 목록이고, 빌드는 그 목록을 따라 모듈을 모은다. 관리자 컴포넌트를
 * 거기 한 줄 더하면 **시민용 모바일 번들에 데이터 표와 다이얼로그가 들어간다.**
 * 길에서 QR 을 찍은 사람이 자기가 절대 보지 않을 관리자 화면의 부품을 내려받는다.
 *
 * 그래서 진입점을 둘로 나눈다:
 *
 *   design-systems/index.js   시민용 (screens/**)   — 공용 + 모바일 전용
 *   design-systems/admin.js   관리자용 (admin/**)   — 공용 + 데스크톱 전용
 *
 * 공용 컴포넌트는 아래에서 index.js 를 통해 다시 내준다. 컴포넌트 파일을 직접
 * 가리키지 않는 이유는 그러면 같은 컴포넌트로 가는 길이 두 개가 되고, 언젠가 한쪽만
 * 고쳐지기 때문이다. index.js 가 공용의 단일 출처라는 사실은 그대로 둔다.
 *
 * ── 관리자 화면이 지키는 규칙도 같다 ────────────────────────────────────────
 * admin/** 의 화면 코드는 컴포넌트 파일을 직접 import 하지 않고 **언제나 이 파일에서**
 * 가져온다. 시민 화면이 index.js 하나만 쓰는 것과 같다.
 *
 * ── 중괄호 안에 주석을 쓰지 않는다 ──────────────────────────────────────────
 * tools/build.mjs 의 재수출 검사가 `export { … } from` 안을 쉼표로 잘라 이름으로 읽는다.
 * 주석을 넣으면 그것까지 이름으로 세어 "그런 export 없음"으로 빌드가 멈춘다.
 * 그래서 묶음마다 export 문을 따로 쓴다.
 */

/* ── 관리자 전용 ─────────────────────────────────────────────────────────── */
export { AdminShell } from "./components/admin/AdminShell.jsx";
export { PageHeader } from "./components/admin/PageHeader.jsx";
export { DataTable, Cell } from "./components/admin/DataTable.jsx";
export { Toolbar } from "./components/admin/Toolbar.jsx";
export { Modal } from "./components/admin/Modal.jsx";
export { ConfirmDialog } from "./components/admin/ConfirmDialog.jsx";
export { FormGrid, FormField, FormSection, requiredKey } from "./components/admin/FormGrid.jsx";
export { MiniChart } from "./components/admin/MiniChart.jsx";

/* ── 관리자 전용: 명세서의 특수 입력 항목 ────────────────────────────────── */
export { AddressField } from "./components/admin/AddressField.jsx";
export { CoordField, COORD_BOUNDS, outOfBounds, fixCoord } from "./components/admin/CoordField.jsx";
export { Repeater, ConditionalBadge } from "./components/admin/Repeater.jsx";
export { AssetPicker } from "./components/admin/AssetPicker.jsx";

/* ── 공용: 기본 부품 ─────────────────────────────────────────────────────── */
export { Icon, Button, TextButton, IconButton, Card, Badge, Chip } from "./index.js";

/* ── 공용: 입력 ──────────────────────────────────────────────────────────── */
export { Input, Textarea, Select, Checkbox, Radio, RadioGroup, Switch, SearchField } from "./index.js";

/* ── 공용: 목록과 표기 ───────────────────────────────────────────────────── */
export { Pagination, SectionHeader, VisuallyHidden, InfoList, yesNoMark, EMPTY_MARK, CopyField } from "./index.js";

/* ── 공용: 도메인 아이콘과 이름표 ────────────────────────────────────────── */
export { FacilityIcon, FACILITY_LABELS, FACILITY_TYPES, EMERGENCY, CategoryIcon, CATEGORY_LABELS, OnnuriBadge } from "./index.js";

/* 축제 상태 색은 시민 화면과 **같은 표**를 본다. 여기서 따로 정하면 담당자가 관리자에서
   본 색과 시민 화면의 색이 갈린다 — 실제로 예정이 청록/크림으로 갈려 있었다 */
export { FESTIVAL_STATES, FESTIVAL_STATE_TONE, FESTIVAL_BADGE_TONE, festivalTone, festivalBadge } from "./index.js";

/* ── 공용: 알림 ──────────────────────────────────────────────────────────── */
export { Notice, Toast, EmptyState, LoadingBar, ProgressBar } from "./index.js";

/* ── 공용: 그 밖 ─────────────────────────────────────────────────────────── */
export { SegmentedTabs, StatTile, token, josa } from "./index.js";

/* 조아용은 시민을 맞이하는 자리의 것이지만(디자인 시스템 7번 규칙), 관리자에서도
   **고르는 대상**으로는 나온다 — 축제 카드에 쓸 그림을 여기서 정하기 때문이다.
   맞이하는 데 쓰지 않고 썸네일로만 쓴다 (AssetPicker). */
export { Mascot, MASCOT_POSES, MASCOT_FULL, MASCOT_BUST } from "./index.js";

/* ── 공용: 지도 (QR 지점 관리의 좌표 미리보기) ───────────────────────────── */
export { KakaoMap, MapCanvas } from "./index.js";
