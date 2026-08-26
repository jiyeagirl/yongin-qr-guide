/** Floating map controls ([스캔 위치로]) anchored above the bottom sheet. */
export interface FloatingControlsProps {
  /** The sheet's current height — px number or token, e.g. "var(--sheet-half)". */
  bottom?: string | number;
  /** true at the full snap, or when the button has nothing to do — the column fades out. */
  hidden?: boolean;
  /** Measured height of the top filter bar (px). The column never rises above it. */
  topInset?: string | number;
  /** Map-surface pill: 34px, translucent .82 + blur — same values as the other floating parts. */
  subtle?: boolean;
  items?: Array<{ icon: string; label: string; text?: string; active?: boolean; onClick?: () => void }>;
  style?: React.CSSProperties;
}
export declare function FloatingControls(props: FloatingControlsProps): JSX.Element;
