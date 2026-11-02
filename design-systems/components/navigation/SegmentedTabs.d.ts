/** In-page tabs: underline for content sections, pill for compact filters. */
export interface SegmentedTabsProps {
  /** icon: lucide 이름. pill 에서만 그린다 */
  items?: Array<{ id: string; label: string; icon?: string }>;
  value?: string;
  onChange?: (id: string) => void;
  variant?: "underline" | "pill";
  style?: React.CSSProperties;
}
export declare function SegmentedTabs(props: SegmentedTabsProps): JSX.Element;
