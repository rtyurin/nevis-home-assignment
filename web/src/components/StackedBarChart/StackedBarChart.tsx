import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { useElementWidth } from '../../lib/useElementWidth';
import { useStableId } from '../../lib/useStableId';
import { ChartLegend } from './ChartLegend';
import { barPath, niceScale, stackCategory } from './layout';
import styles from './StackedBarChart.module.css';

export interface ChartCategory {
  id: string;
  label: string;
  /** Used instead of `label` when the bars get too narrow for it. */
  shortLabel?: string;
}

export interface ChartSeries {
  id: string;
  name: string;
  /** One value per category. */
  values: readonly number[];
  /** Any CSS color. */
  color: string;
  /** Hatched fill, for series that should read as "not a real category". */
  pattern?: 'hatch';
}

export interface StackedBarChartProps {
  categories: readonly ChartCategory[];
  /** Stacked bottom-to-top in array order. */
  series: readonly ChartSeries[];
  /** Per-category totals for tooltips and labels. Defaults to the sum of the stack. */
  totals?: readonly number[];
  height?: number;
  formatValue?: (value: number) => string;
  /** Extra content at the bottom of the tooltip for a category. */
  renderTooltipFooter?: (index: number) => ReactNode;
  /** Hide the legend, for example to render `ChartLegend` elsewhere. */
  hideLegend?: boolean;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

const MARGIN = { top: 12, right: 0, bottom: 36, left: 44 };
const BAR_RATIO = 0.78;
const CAP_RADIUS = 4;
/** Surface-colored gap between stacked segments. */
const SEGMENT_GAP = 1;
const FULL_LABEL_MIN_BAND = 76;
const SHORT_LABEL_WIDTH = 52;

const defaultFormat = (value: number) => value.toLocaleString('en-US');

export function StackedBarChart({
  categories,
  series,
  totals,
  height = 400,
  formatValue = defaultFormat,
  renderTooltipFooter,
  hideLegend = false,
  ...ariaProps
}: StackedBarChartProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>(720);
  const patternId = useStableId('hatch');
  const barRefs = useRef<(SVGGElement | null)[]>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [tabIndexOwner, setTabIndexOwner] = useState(0);

  const stacks = categories.map((_, index) => stackCategory(series, index));
  const stackSums = stacks.map((segments) => segments.at(-1)?.y1 ?? 0);
  const categoryTotals = categories.map((_, index) => totals?.[index] ?? stackSums[index] ?? 0);
  const scale = niceScale(Math.max(0, ...stackSums, ...categoryTotals));

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);
  const band = categories.length > 0 ? plotWidth / categories.length : 0;
  const barWidth = band * BAR_RATIO;
  const yToPx = (value: number) => MARGIN.top + plotHeight - (value / scale.max) * plotHeight;

  const useFullLabels = band >= FULL_LABEL_MIN_BAND;
  const labelEvery = useFullLabels ? 1 : Math.max(1, Math.ceil(SHORT_LABEL_WIDTH / Math.max(band, 1)));

  const activeIndex = hoverIndex ?? focusIndex;
  const seriesById = new Map(series.map((s) => [s.id, s]));
  const fillFor = (s: ChartSeries) => (s.pattern === 'hatch' ? `url(#${patternId})` : s.color);
  const hatchColor = series.find((s) => s.pattern === 'hatch')?.color;

  const describeCategory = (index: number) => {
    const parts = series
      .filter((s) => (s.values[index] ?? 0) > 0)
      .map((s) => `${s.name} ${formatValue(s.values[index] ?? 0)}`);
    const total = `Total ${formatValue(categoryTotals[index] ?? 0)}`;
    return `${categories[index]?.label}: ${[...parts, total].join(', ')}`;
  };

  const moveFocus = (event: KeyboardEvent, index: number) => {
    const last = categories.length - 1;
    const next =
      event.key === 'ArrowRight' ? Math.min(index + 1, last)
      : event.key === 'ArrowLeft' ? Math.max(index - 1, 0)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    setTabIndexOwner(next);
    barRefs.current[next]?.focus();
  };

  return (
    <div className={styles.root}>
      <div ref={containerRef} className={styles.plot} style={{ height }}>
        <svg
          width={width}
          height={height}
          role="group"
          aria-roledescription="stacked bar chart"
          className={styles.svg}
          {...ariaProps}
        >
          {hatchColor && (
            <defs>
              <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" style={{ fill: hatchColor }} />
                <line x1="0" y1="0" x2="0" y2="6" className={styles.hatchLine} />
              </pattern>
            </defs>
          )}

          <g aria-hidden="true">
            {scale.ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={MARGIN.left + plotWidth}
                  y1={yToPx(tick)}
                  y2={yToPx(tick)}
                  className={styles.gridLine}
                />
                <text x={MARGIN.left - 12} y={yToPx(tick)} className={styles.yTick} dominantBaseline="middle">
                  {formatValue(tick)}
                </text>
              </g>
            ))}
          </g>

          {categories.map((category, index) => {
            const x = MARGIN.left + band * index;
            const barX = x + (band - barWidth) / 2;
            const isActive = activeIndex === index;
            return (
              <g
                key={category.id}
                ref={(element) => {
                  barRefs.current[index] = element;
                }}
                role="img"
                aria-label={describeCategory(index)}
                tabIndex={index === tabIndexOwner ? 0 : -1}
                className={styles.bar}
                data-category={category.id}
                data-active={isActive || undefined}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => {
                  setFocusIndex(index);
                  setTabIndexOwner(index);
                }}
                onBlur={() => setFocusIndex(null)}
                onKeyDown={(event) => moveFocus(event, index)}
              >
                <rect x={x} y={MARGIN.top} width={band} height={plotHeight} className={styles.hitArea} />
                {stacks[index]?.map((segment) => {
                  const s = seriesById.get(segment.seriesId);
                  if (!s) return null;
                  const top = yToPx(segment.y1);
                  const fullHeight = yToPx(segment.y0) - top;
                  const gap = segment.isTop || fullHeight <= SEGMENT_GAP * 2 ? 0 : SEGMENT_GAP;
                  return (
                    <path
                      key={segment.seriesId}
                      d={barPath(barX, top + gap, barWidth, fullHeight - gap, segment.isTop ? CAP_RADIUS : 0)}
                      style={{ fill: fillFor(s) }}
                      data-series={segment.seriesId}
                      data-value={segment.value}
                      data-y0={segment.y0}
                      data-y1={segment.y1}
                      data-top={segment.isTop || undefined}
                    />
                  );
                })}
              </g>
            );
          })}

          <g aria-hidden="true">
            {categories.map((category, index) =>
              index % labelEvery === 0 ? (
                <text
                  key={category.id}
                  x={MARGIN.left + band * (index + 0.5)}
                  y={MARGIN.top + plotHeight + 24}
                  className={styles.xTick}
                  textAnchor="middle"
                >
                  {useFullLabels ? category.label : (category.shortLabel ?? category.label)}
                </text>
              ) : null,
            )}
          </g>
        </svg>

        {activeIndex !== null && categories[activeIndex] && (
          <ChartTooltip
            title={categories[activeIndex].label}
            rows={series
              .filter((s) => (s.values[activeIndex] ?? 0) > 0)
              .map((s) => ({ ...s, value: formatValue(s.values[activeIndex] ?? 0) }))
              .reverse()}
            total={formatValue(categoryTotals[activeIndex] ?? 0)}
            footer={renderTooltipFooter?.(activeIndex)}
            style={
              activeIndex < categories.length / 2
                ? { left: MARGIN.left + band * activeIndex + (band + barWidth) / 2 + 8 }
                : { right: width - (MARGIN.left + band * activeIndex + (band - barWidth) / 2) + 8 }
            }
          />
        )}
      </div>

      {!hideLegend && series.length > 1 && <ChartLegend items={series} />}
    </div>
  );
}

interface ChartTooltipProps {
  title: string;
  rows: { id: string; name: string; color: string; pattern?: 'hatch'; value: string }[];
  total: string;
  footer?: ReactNode;
  style: { left?: number; right?: number };
}

function ChartTooltip({ title, rows, total, footer, style }: ChartTooltipProps) {
  return (
    <div className={styles.tooltip} style={{ ...style, top: MARGIN.top }} aria-hidden="true">
      <p className={styles.tooltipTitle}>{title}</p>
      <dl className={styles.tooltipRows}>
        {rows.map((row) => (
          <div key={row.id} className={styles.tooltipRow}>
            <dt>
              <span
                className={styles.swatch}
                data-pattern={row.pattern}
                style={{ '--swatch-color': row.color } as CSSProperties}
              />
              {row.name}
            </dt>
            <dd>{row.value}</dd>
          </div>
        ))}
        <div className={`${styles.tooltipRow} ${styles.tooltipTotal}`}>
          <dt>Total</dt>
          <dd>{total}</dd>
        </div>
      </dl>
      {footer && <div className={styles.tooltipFooter}>{footer}</div>}
    </div>
  );
}
