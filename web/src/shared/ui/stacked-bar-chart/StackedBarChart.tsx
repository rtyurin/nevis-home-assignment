import { useReducedMotion } from 'motion/react';
import { useId, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type BarShapeProps } from 'recharts';
import { ChartLegend } from './ChartLegend';
import {
  BAR_MIN_SHARE,
  barPath,
  barWidth,
  CAP_RADIUS,
  CHART_HEIGHT,
  CHART_TOP_MARGIN,
  MISSING_PLACEHOLDER_HEIGHT,
  niceScale,
  X_AXIS_HEIGHT,
  Y_AXIS_WIDTH,
  ZERO_STUB_HEIGHT,
} from './layout';
import { Swatch } from './Swatch';
import { toChartRows, type ChartRow } from './toChartRows';
import type { ChartCategory, ChartSeries } from './types';
import styles from './StackedBarChart.module.css';

export interface StackedBarChartProps {
  categories: readonly ChartCategory[];
  /** Stacked bottom-to-top in array order. */
  series: readonly ChartSeries[];
  /** Per-category totals for the tooltip. Defaults to the sum of the stack. */
  totals?: readonly (number | null)[];
  height?: number;
  formatValue?: (value: number) => string;
  /** Extra content at the bottom of the tooltip, by category id. */
  renderTooltipFooter?: (categoryId: string) => ReactNode;
  /** Changing it remounts the bars so they replay their entrance, even for series that carry over. */
  animationKey?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

/** Below this band width, x labels switch to short form and thin out. */
const FULL_LABEL_MIN_BAND = 76;

const defaultFormat = (value: number) => value.toLocaleString('en-US');

export function StackedBarChart({
  categories,
  series,
  totals,
  height = CHART_HEIGHT,
  formatValue = defaultFormat,
  renderTooltipFooter,
  animationKey = '',
  ...ariaProps
}: StackedBarChartProps) {
  const rows = toChartRows(categories, series, totals);
  const scale = niceScale(Math.max(0, ...rows.map((row) => Math.max(row.total ?? 0, row.stackSum))));
  const chartId = useId();
  const patternId = `hatch-${chartId}`;
  const missingPatternId = `missing-${chartId}`;
  const reduceMotion = useReducedMotion() ?? false;
  const [band, setBand] = useState<number>();
  const narrow = band !== undefined && band < FULL_LABEL_MIN_BAND;
  const hatchColor = series.find((s) => s.pattern === 'hatch')?.color;

  return (
    <div className={styles.root} role="figure" {...ariaProps}>
      <ResponsiveContainer
        width="100%"
        height={height}
        initialDimension={{ width: 720, height }}
        onResize={(width) => setBand((width - Y_AXIS_WIDTH) / Math.max(categories.length, 1))}
      >
        <BarChart
          data={rows}
          margin={{ top: CHART_TOP_MARGIN, right: 0, bottom: 0, left: 0 }}
          barSize={band === undefined ? undefined : barWidth(band)}
          // Until measured: the narrow-plot proportions.
          barCategoryGap={`${((1 - BAR_MIN_SHARE) / 2) * 100}%`}
          accessibilityLayer
        >
          <defs>
            {hatchColor && <HatchPattern id={patternId} lineClassName={styles.hatchLine} background={hatchColor} />}
            <HatchPattern id={missingPatternId} lineClassName={styles.missingLine} />
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            // Not via tickFormatter: once ticks thin out, its index counts visible ticks, not categories.
            dataKey={narrow ? 'shortLabel' : 'label'}
            height={X_AXIS_HEIGHT}
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            interval={narrow ? 'preserveStartEnd' : 0}
            minTickGap={8}
          />
          <YAxis
            width={Y_AXIS_WIDTH}
            tickLine={false}
            axisLine={false}
            domain={[0, scale.max]}
            ticks={scale.ticks}
            tickFormatter={formatValue}
          />
          <Tooltip
            cursor={{ className: styles.cursor }}
            isAnimationActive={false}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as ChartRow | undefined;
              if (!active || !row) return null;
              return (
                <ChartTooltip
                  row={row}
                  series={series}
                  formatValue={formatValue}
                  footer={renderTooltipFooter?.(row.id)}
                />
              );
            }}
          />
          {series.map((s) => (
            <Bar
              key={`${animationKey}:${s.id}`}
              name={s.name}
              dataKey={(row: ChartRow) => row.values[s.id] ?? 0}
              stackId="stack"
              isAnimationActive={!reduceMotion}
              animationDuration={400}
              shape={(props: BarShapeProps) => (
                <Segment
                  {...props}
                  seriesId={s.id}
                  fill={s.pattern === 'hatch' ? `url(#${patternId})` : s.color}
                  color={s.color}
                  missingFill={`url(#${missingPatternId})`}
                />
              )}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      {series.length > 1 && <ChartLegend items={series} />}
    </div>
  );
}

function HatchPattern({ id, lineClassName, background }: { id: string; lineClassName?: string; background?: string }) {
  return (
    <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      {background && <rect width="6" height="6" style={{ fill: background }} />}
      <line x1="0" y1="0" x2="0" y2="6" className={lineClassName} />
    </pattern>
  );
}

interface SegmentProps extends BarShapeProps {
  seriesId: string;
  fill: string;
  /** The series' plain color, for its zero stub. */
  color: string;
  missingFill: string;
}

function Segment({ x, y, width, height, payload, seriesId, fill, color, missingFill }: SegmentProps) {
  const row = payload as ChartRow;
  if (row.marker?.seriesId === seriesId) {
    const missing = row.marker.kind === 'missing';
    const markerHeight = missing ? MISSING_PLACEHOLDER_HEIGHT : ZERO_STUB_HEIGHT;
    return (
      <rect
        x={x}
        y={y + height - markerHeight}
        width={width}
        height={markerHeight}
        rx={Math.min(CAP_RADIUS, markerHeight / 2)}
        style={{ fill: missing ? missingFill : color }}
        data-baseline={row.marker.kind}
        data-category={row.id}
      />
    );
  }
  if (!(height > 0)) return <g />;
  const isTop = row.topSeriesId === seriesId;
  const isBottom = row.bottomSeriesId === seriesId;
  return (
    <path
      d={barPath(x, y, width, height, { top: isTop ? CAP_RADIUS : 0, bottom: isBottom ? CAP_RADIUS : 0 })}
      style={{ fill }}
      data-series={seriesId}
      data-category={row.id}
      data-value={row.values[seriesId] ?? undefined}
      data-top={isTop || undefined}
      data-bottom={isBottom || undefined}
    />
  );
}

interface ChartTooltipProps {
  row: ChartRow;
  series: readonly ChartSeries[];
  formatValue: (value: number) => string;
  footer?: ReactNode;
}

function ChartTooltip({ row, series, formatValue, footer }: ChartTooltipProps) {
  if (row.total === null) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipEmpty}>No data for {row.label}</p>
      </div>
    );
  }
  // Top of the stack first, as drawn.
  const visible = series.filter((s) => (row.values[s.id] ?? 0) > 0).reverse();
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{row.label}</p>
      <dl className={styles.tooltipRows}>
        {visible.map((s) => (
          <div key={s.id} className={styles.tooltipRow}>
            <dt>
              <Swatch color={s.color} pattern={s.pattern} />
              {s.name}
            </dt>
            <dd>{formatValue(row.values[s.id] ?? 0)}</dd>
          </div>
        ))}
        <div className={`${styles.tooltipRow} ${styles.tooltipTotal}`}>
          <dt>Total</dt>
          <dd>{formatValue(row.total)}</dd>
        </div>
      </dl>
      {footer && <div className={styles.tooltipFooter}>{footer}</div>}
    </div>
  );
}
