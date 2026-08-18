/** Map bottom sheet with three snap points (collapsed 18% / half 37% / full 100% of the map frame). */
export interface SheetProps {
  open?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Short aside sharing the title row, right-aligned. Costs no vertical space. */
  titleAside?: React.ReactNode;
  /** Block below the title row, full width. For content that needs the horizontal room. */
  headerExtra?: React.ReactNode;
  children?: React.ReactNode;
  snap?: "collapsed" | "half" | "full";
  onSnapChange?: (snap: "collapsed" | "half" | "full") => void;
  /** Reports the sheet's measured pixel height (map padding, floating-control anchor). */
  onHeightChange?: (height: number) => void;
  onClose?: () => void;
  closeIcon?: string;
  closeLabel?: string;
  /** Force the scrim on; otherwise it appears only at "full". */
  scrim?: boolean;
  /** Pixels at the top of the frame the sheet must never cover (the filter bar). */
  topInset?: number;
  /** Changing this resets the list scroll to the top — pass the active filter conditions. */
  scrollKey?: string;
  style?: React.CSSProperties;
}
export declare function Sheet(props: SheetProps): JSX.Element;
