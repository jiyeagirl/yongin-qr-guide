/** In-page tabs: underline for content sections, pill for compact filters. */
export interface SegmentedTabsProps {
  items?: Array<{ id: string; label: string }>;
  value?: string;
  onChange?: (id: string) => void;
  variant?: "underline" | "pill";
  style?: React.CSSProperties;
}
export declare function SegmentedTabs(props: SegmentedTabsProps): JSX.Element;
