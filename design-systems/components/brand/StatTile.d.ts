/** One key figure for program dashboards (실증 과제 수, 참여 기업 수). */
export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon?: string;
  tone?: "plain" | "brand" | "dark";
  delta?: string;
  style?: React.CSSProperties;
}
export declare function StatTile(props: StatTileProps): JSX.Element;
