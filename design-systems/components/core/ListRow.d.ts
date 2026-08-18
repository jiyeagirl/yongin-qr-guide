/** One row of a scrolling list — notice, program, application. 56px minimum height. */
export interface ListRowProps {
  title: React.ReactNode;
  meta?: React.ReactNode;
  tag?: React.ReactNode;
  icon?: string;
  iconTint?: string;
  trailing?: React.ReactNode | "chevron";
  divider?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function ListRow(props: ListRowProps): JSX.Element;
