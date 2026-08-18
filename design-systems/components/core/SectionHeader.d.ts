/** Section title with an optional "전체보기" affordance. */
export interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}
export declare function SectionHeader(props: SectionHeaderProps): JSX.Element;
