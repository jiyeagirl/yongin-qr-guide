/** Glyph for one of the 8 business-category chips. */
export interface CategoryIconProps {
  type: "all" | "food" | "cafe" | "shop" | "life" | "edu" | "culture" | "etc";
  size?: number;
  style?: React.CSSProperties;
}
export declare function CategoryIcon(props: CategoryIconProps): JSX.Element;
