/** One key figure for program dashboards (실증 과제 수, 참여 기업 수). */
export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon?: string;
  tone?: "plain" | "brand" | "dark";
  delta?: string;
  /** 증감 줄의 색. 문자열에서 부호를 짐작하지 않으므로 부르는 쪽이 정한다. 기본 "up" */
  deltaTone?: "up" | "down" | "flat";
  style?: React.CSSProperties;
}
export declare function StatTile(props: StatTileProps): JSX.Element;
