/** Page stepper for long lists. Renders nothing when there is only one page. */
export interface PaginationProps {
  /** 1-based. */
  page?: number;
  pageCount?: number;
  onChange?: (page: number) => void;
  /** aria-label for the surrounding nav. */
  label?: string;
  style?: React.CSSProperties;
}
export declare function Pagination(props: PaginationProps): JSX.Element | null;
