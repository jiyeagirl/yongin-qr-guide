/** Floating map controls (목록/지도 토글, QR 지점 복귀) anchored above the bottom sheet. */
export interface FloatingControlsProps {
  /** The sheet's current height token, e.g. "var(--sheet-half)". */
  bottom?: string;
  /** true at the full snap — the sheet owns the surface. */
  hidden?: boolean;
  items?: Array<{ icon: string; label: string; text?: string; onClick?: () => void }>;
  style?: React.CSSProperties;
}
export declare function FloatingControls(props: FloatingControlsProps): JSX.Element;
