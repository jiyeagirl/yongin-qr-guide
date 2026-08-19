/** Text hidden from sight but read by screen readers. Not display:none — that would
 *  drop it from the accessibility tree too. */
export interface VisuallyHiddenProps {
  children?: React.ReactNode;
  /** Element to render. Defaults to "span". */
  as?: keyof JSX.IntrinsicElements;
}
export declare function VisuallyHidden(props: VisuallyHiddenProps): JSX.Element;
