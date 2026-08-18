/** Content container. Soft shadow by default; outlined for emphasis blocks. */
export interface CardProps {
  children?: React.ReactNode;
  tone?: "plain" | "brand" | "accent" | "dark";
  /** true = 1px brand-green border, no shadow. */
  outlined?: boolean;
  padding?: string;
  style?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
