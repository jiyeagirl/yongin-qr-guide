/** Bottom navigation, 4–5 pictogram items. Active item fills the glyph and turns green-700. */
export interface TabBarProps {
  items?: Array<{ id: string; label: string; icon: string }>;
  value?: string;
  onChange?: (id: string) => void;
  style?: React.CSSProperties;
}
export declare function TabBar(props: TabBarProps): JSX.Element;
