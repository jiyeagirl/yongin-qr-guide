/** Sticky top bar. tone="brand" on landing screens, "plain" (translucent white) on depth screens. */
export interface AppBarProps {
  title: React.ReactNode;
  back?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  tone?: "plain" | "brand";
  style?: React.CSSProperties;
}
export declare function AppBar(props: AppBarProps): JSX.Element;
