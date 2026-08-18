/** Glyph for one of the 7 business-category chips. */
export interface CategoryIconProps {
  type: "all" | "food" | "cafe" | "shop" | "beauty" | "culture" | "etc";
  size?: number;
  style?: React.CSSProperties;
}
export declare function CategoryIcon(props: CategoryIconProps): JSX.Element;
