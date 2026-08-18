/** Map bottom sheet with three snap points (collapsed 25% / half 55% / full 90% of the frame). */
export interface SheetProps {
  open?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  snap?: "collapsed" | "half" | "full";
  onSnapChange?: (snap: "collapsed" | "half" | "full") => void;
  onClose?: () => void;
  /** Force the scrim on; otherwise it appears only at "full". */
  scrim?: boolean;
  style?: React.CSSProperties;
}
export declare function Sheet(props: SheetProps): JSX.Element;
