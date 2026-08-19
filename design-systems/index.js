/* 디자인 시스템 공개 진입점.
   화면 코드는 컴포넌트 파일을 직접 import 하지 않고 항상 여기서 가져온다
   (_adherence.oxlintrc.json 의 no-restricted-imports 규칙). */

/* core */
export { Icon } from "./components/core/Icon.jsx";
export { FacilityIcon, FACILITY_ICONS, FACILITY_LABELS, FACILITY_TYPES, FACILITY_PIN, SAFETY, EMERGENCY, CONVENIENCE } from "./components/core/FacilityIcon.jsx";
export { CategoryIcon, CATEGORY_ICONS, CATEGORY_LABELS } from "./components/core/CategoryIcon.jsx";
export { Button } from "./components/core/Button.jsx";
export { TextButton } from "./components/core/TextButton.jsx";
export { IconButton } from "./components/core/IconButton.jsx";
export { Card } from "./components/core/Card.jsx";
export { Badge } from "./components/core/Badge.jsx";
export { Chip } from "./components/core/Chip.jsx";
export { PictogramTile } from "./components/core/PictogramTile.jsx";
export { ListRow } from "./components/core/ListRow.jsx";
export { SectionHeader } from "./components/core/SectionHeader.jsx";
export { Input } from "./components/core/Input.jsx";
export { Textarea } from "./components/core/Textarea.jsx";
export { Select } from "./components/core/Select.jsx";
export { Checkbox } from "./components/core/Checkbox.jsx";
export { Radio } from "./components/core/Radio.jsx";
export { RadioGroup } from "./components/core/RadioGroup.jsx";
export { Switch } from "./components/core/Switch.jsx";
export { OnnuriBadge } from "./components/core/OnnuriBadge.jsx";
export { OnnuriToggle } from "./components/core/OnnuriToggle.jsx";
export { SearchField } from "./components/core/SearchField.jsx";
export { InfoList, yesNoMark, EMPTY_MARK } from "./components/core/InfoList.jsx";
export { CopyField } from "./components/core/CopyField.jsx";
export { Accordion } from "./components/core/Accordion.jsx";
export { FilterBar } from "./components/core/FilterBar.jsx";
export { ListControls } from "./components/core/ListControls.jsx";
export { Pagination } from "./components/core/Pagination.jsx";
export { SortSelect } from "./components/core/SortSelect.jsx";
export { VisuallyHidden } from "./components/core/VisuallyHidden.jsx";
export { token, clearTokenCache } from "./components/core/token.js";
export { josa, hasBatchim, eun, i, eul, ro } from "./components/core/josa.js";

/* layout — 페이지 셸. 상세 화면(S05·S06, 이후 S07~S10)이 공유한다 */
export { DetailPage, DetailBody, DetailNotice } from "./components/layout/DetailPage.jsx";

/* navigation */
export { AppBar } from "./components/navigation/AppBar.jsx";
export { ContextBar } from "./components/navigation/ContextBar.jsx";
export { TabBar } from "./components/navigation/TabBar.jsx";
export { SegmentedTabs } from "./components/navigation/SegmentedTabs.jsx";
export { ProgressSteps } from "./components/navigation/ProgressSteps.jsx";
/* 도보 안내 목록 (S07 길찾기 · U-NV-03) */
export { RouteSteps, RouteStepRow, routeStepText, TURN_ICONS, TURN_LABELS } from "./components/navigation/RouteSteps.jsx";

/* feedback */
export { Notice } from "./components/feedback/Notice.jsx";
export { Toast } from "./components/feedback/Toast.jsx";
export { Sheet, SNAP_ORDER, SNAP_HEIGHT } from "./components/feedback/Sheet.jsx";
export { FloatingControls } from "./components/feedback/FloatingControls.jsx";
export { EmptyState } from "./components/feedback/EmptyState.jsx";
export { LoadingBar } from "./components/feedback/LoadingBar.jsx";
export { ProgressBar } from "./components/feedback/ProgressBar.jsx";

/* map */
export { MapCanvas } from "./components/map/MapCanvas.jsx";
export { KakaoMap } from "./components/map/KakaoMap.jsx";
export { MapPreviewCard } from "./components/map/MapPreviewCard.jsx";
export { MapFilterOverlay } from "./components/map/MapFilterOverlay.jsx";
export { loadKakaoMaps } from "./components/map/kakaoLoader.js";

/* facility — 공공시설 도메인 (AED · 화장실 · 쉼터 · 대피소) */
export { FacilityRow } from "./components/facility/FacilityRow.jsx";
export { FacilitySummary } from "./components/facility/FacilitySummary.jsx";
export { NearbyFacilities } from "./components/facility/NearbyFacilities.jsx";

/* store — 골목형 상점가 도메인 */
export { StoreRow } from "./components/store/StoreRow.jsx";
export { StoreRail } from "./components/store/StoreRail.jsx";
export { FestivalBanner } from "./components/store/FestivalBanner.jsx";
export { FestivalRow } from "./components/store/FestivalRow.jsx";
export { FestivalCard } from "./components/store/FestivalCard.jsx";
export { FESTIVAL_STATES, FESTIVAL_STATE_TONE, FESTIVAL_BADGE_TONE, festivalTone, festivalBadge, festivalPalette } from "./components/store/festivalState.js";
export { DistrictSummary } from "./components/store/DistrictSummary.jsx";
export { DistrictRow } from "./components/store/DistrictRow.jsx";
export { CourseCard } from "./components/store/CourseCard.jsx";

/* brand */
export { Mascot, MASCOT_POSES, MASCOT_FULL, MASCOT_BUST } from "./components/brand/Mascot.jsx";
export { MascotBubble } from "./components/brand/MascotBubble.jsx";
export { StatTile } from "./components/brand/StatTile.jsx";
