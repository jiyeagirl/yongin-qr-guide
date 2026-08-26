/** Floating map controls (QR 지점 복귀, 반경 고르개) anchored above the bottom sheet. */
export interface FloatingControlsProps {
  /** The sheet's current height — px number or token, e.g. "var(--sheet-half)". */
  bottom?: string | number;
  /** true at the full snap — the sheet owns the surface. */
  hidden?: boolean;
  /** Measured height of the top filter bar (px). The column never rises above it. */
  topInset?: string | number;
  items?: Array<{ icon: string; label: string; text?: string; active?: boolean; onClick?: () => void }>;
  /** Non-button controls that share the same anchoring — rendered above the buttons. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function FloatingControls(props: FloatingControlsProps): JSX.Element;
