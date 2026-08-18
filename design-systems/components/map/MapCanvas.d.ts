/** Stand-in for the 카카오맵 SDK surface: anchor marker, clusters, pins, and the bottom padding that keeps markers clear of the sheet. */
export interface MapCanvasProps {
  anchorLabel?: string;
  clusters?: Array<{ label: string; x: string; y: string }>;
  pins?: Array<{ label: string; icon: string; x: string; y: string; emergency?: boolean }>;
  /** Match the sheet snap: var(--map-pad-collapsed|half|full). */
  bottomPad?: string;
  note?: string;
  style?: React.CSSProperties;
}
export declare function MapCanvas(props: MapCanvasProps): JSX.Element;
