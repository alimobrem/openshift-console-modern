/**
 * MetricsChart - SVG-based time-series area chart component.
 *
 * Required CSS classes:
 *   .compass-metrics-chart           - outer container, width: 100%
 *   .compass-metrics-chart__svg      - the SVG element
 *   .compass-metrics-chart__axis-label - axis tick labels (font-size, fill, etc.)
 *   .compass-metrics-chart__tooltip  - tooltip popup (position: absolute, background, padding, border-radius, box-shadow)
 *   .compass-metrics-chart__crosshair - vertical crosshair line (stroke, stroke-dasharray)
 *   .compass-metrics-chart__area     - the filled area path
 *   .compass-metrics-chart__line     - the stroke line path
 *
 * Animation keyframes:
 *   @keyframes compass-metrics-draw {
 *     from { stroke-dashoffset: var(--path-length); }
 *     to   { stroke-dashoffset: 0; }
 *   }
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';

interface MetricsChartProps {
  data: { timestamp: string; value: number }[];
  label: string;
  color?: string;
  height?: number;
  showAxis?: boolean;
  gradientId?: string;
}

const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const Y_TICKS = [0, 25, 50, 75, 100];

function formatRelativeTime(timestamp: string, nowMs: number): string {
  const diffMs = nowMs - new Date(timestamp).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin <= 0) return 'now';
  return `${diffMin}m ago`;
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  const first = points[0]!;
  if (points.length === 1) return `M${first.x},${first.y}`;

  let d = `M${first.x},${first.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(i + 2, points.length - 1)]!;

    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

const MetricsChart: React.FC<MetricsChartProps> = ({
  data,
  label,
  color = 'rgba(251, 146, 60, 0.8)',
  height = 200,
  showAxis = true,
  gradientId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [hover, setHover] = useState<{ x: number; index: number } | null>(null);

  const gId = useMemo(
    () => gradientId ?? `compass-metrics-gradient-${Math.random().toString(36).slice(2, 9)}`,
    [gradientId],
  );

  // Observe container width for responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animate path on mount / data change
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    // Force reflow then animate
    path.getBoundingClientRect();
    path.style.transition = 'stroke-dashoffset 1s ease-in-out';
    path.style.strokeDashoffset = '0';
  }, [data, containerWidth]);

  const chartWidth = containerWidth - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  const points = useMemo(() => {
    if (data.length === 0) return [];
    return data.map((d, i) => ({
      x: PADDING.left + (data.length === 1 ? chartWidth / 2 : (i / (data.length - 1)) * chartWidth),
      y: PADDING.top + chartHeight - (d.value / 100) * chartHeight,
    }));
  }, [data, chartWidth, chartHeight]);

  const linePath = useMemo(() => buildSmoothPath(points), [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = PADDING.top + chartHeight;
    return `${linePath} L${points[points.length - 1]!.x},${bottomY} L${points[0]!.x},${bottomY} Z`;
  }, [linePath, points, chartHeight]);

  const nowMs = useMemo(() => {
    if (data.length === 0) return Date.now();
    return new Date(data[data.length - 1]!.timestamp).getTime();
  }, [data]);

  const timeLabels = useMemo(() => {
    if (data.length === 0) return [];
    const first = new Date(data[0]!.timestamp).getTime();
    const last = new Date(data[data.length - 1]!.timestamp).getTime();
    const span = last - first;
    if (span <= 0) return [{ x: PADDING.left + chartWidth / 2, text: 'now' }];

    const count = Math.min(5, data.length);
    const labels: { x: number; text: string }[] = [];
    for (let i = 0; i < count; i++) {
      const t = first + (i / (count - 1)) * span;
      const x = PADDING.left + (i / (count - 1)) * chartWidth;
      const diffMin = Math.round((last - t) / 60000);
      labels.push({ x, text: diffMin <= 0 ? 'now' : `${diffMin}m ago` });
    }
    return labels;
  }, [data, chartWidth]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (data.length === 0) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const relX = mouseX - PADDING.left;
      const ratio = Math.max(0, Math.min(1, relX / chartWidth));
      const index = Math.round(ratio * (data.length - 1));
      setHover({ x: points[index]?.x ?? mouseX, index });
    },
    [data, chartWidth, points],
  );

  const handleMouseLeave = useCallback(() => {
    setHover(null);
  }, []);

  const hoveredPoint = hover !== null && data[hover.index] ? data[hover.index] : null;

  return (
    <div
      ref={containerRef}
      className="compass-metrics-chart os-metrics__container"
      aria-label={`Metrics chart: ${label}`}
    >
      <svg
        className="compass-metrics-chart__svg"
        width={containerWidth}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {/* Y-axis labels */}
        {showAxis &&
          Y_TICKS.map((tick) => {
            const y = PADDING.top + chartHeight - (tick / 100) * chartHeight;
            return (
              <g key={`y-${tick}`}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + chartWidth}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1}
                />
                <text
                  className="compass-metrics-chart__axis-label"
                  x={PADDING.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.5)"
                  fontSize={11}
                >
                  {tick}%
                </text>
              </g>
            );
          })}

        {/* Time axis labels */}
        {showAxis &&
          timeLabels.map((tl, i) => (
            <text
              key={`t-${i}`}
              className="compass-metrics-chart__axis-label"
              x={tl.x}
              y={PADDING.top + chartHeight + 24}
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize={11}
            >
              {tl.text}
            </text>
          ))}

        {/* Area fill */}
        {areaPath && (
          <path
            className="compass-metrics-chart__area"
            d={areaPath}
            fill={`url(#${gId})`}
          />
        )}

        {/* Line */}
        {linePath && (
          <path
            ref={pathRef}
            className="compass-metrics-chart__line"
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Hover crosshair */}
        {hover !== null && (
          <line
            className="compass-metrics-chart__crosshair"
            x1={hover.x}
            y1={PADDING.top}
            x2={hover.x}
            y2={PADDING.top + chartHeight}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}

        {/* Hover dot */}
        {hover !== null && points[hover.index] != null && (
          <circle
            cx={points[hover.index]!.x}
            cy={points[hover.index]!.y}
            r={4}
            fill={color}
            stroke="#fff"
            strokeWidth={2}
          />
        )}
      </svg>

      {/* Tooltip */}
      {hover !== null && hoveredPoint && (
        <div
          className="compass-metrics-chart__tooltip os-metrics__tooltip"
          style={{
            '--os-tooltip-left': `${hover.x}px`,
            '--os-tooltip-top': `${PADDING.top - 10}px`,
            left: 'var(--os-tooltip-left)',
            top: 'var(--os-tooltip-top)',
          } as React.CSSProperties}
        >
          <div className="os-metrics__tooltip-value">{hoveredPoint.value.toFixed(1)}%</div>
          <div className="os-metrics__tooltip-time">
            {formatRelativeTime(hoveredPoint.timestamp, nowMs)}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsChart;
