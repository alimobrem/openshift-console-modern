export interface CostTrend {
  dataPoints: number[];
  changePercent: number;
  direction: 'up' | 'down' | 'flat';
}

export function getCostTrend(): CostTrend {
  return {
    dataPoints: [142, 148, 145, 151, 147, 139, 137],
    changePercent: -3.2,
    direction: 'down',
  };
}
