/** Empty list or no-results view, always fronted by 조아용. */
export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  pose?: string;
  /** Path prefix to the project root, e.g. "../../". */
  base?: string;
  style?: React.CSSProperties;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;
