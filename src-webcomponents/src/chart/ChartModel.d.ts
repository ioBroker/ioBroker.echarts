/**
 * What the web component uses of `src-chart/src/Components/ChartModel.ts` - the model that reads a preset, the
 * history and the states and hands the series to the view. The same file runs in the chart page, in the widgets and,
 * copied, on the server.
 *
 * `tsconfig.json` maps `@echarts-chart/*` onto these declarations and Vite maps it onto the real sources, which it
 * bundles. The sources are not type-checked here: they are written for `strict: false` (see the tsconfig of
 * `src-chart`), this package is strict. So this file is where the coupling is visible: what the component needs of
 * the chart and nothing more.
 */
import type { ChartConfig, ChartConfigMore, ChartRangeOptions, ChartRelativeEnd, Connection } from '../../../src/types';

/** A time range that is put over the one of a preset for this view only */
export interface ChartTimeRangeOverride {
    range?: number | string;
    relativeEnd?: ChartRelativeEnd;
    timeType?: 'relative' | 'static';
    start?: string;
    start_time?: string;
    end?: string;
    end_time?: string;
}

export type EchartsOneValue = { value: [number, number]; exact?: false };
export type LineSeries = EchartsOneValue[];
export type BarSeries = number[];
export type BarAndLineSeries = BarSeries | LineSeries;

/** A raw value of the history, as the CSV export writes it */
export interface SeriesData {
    ts: number;
    val: ioBroker.StateValue;
}

export type ChartUpdateHandler = (
    seriesData: BarAndLineSeries[],
    actualValues?: (number | null | boolean | string)[],
    barCategories?: number[],
) => void;

export default class ChartModel {
    /**
     * @param socket the connection
     * @param config the ID of a preset, or a whole configuration
     * @param options how often a zoom reads again, whether it runs on the server
     */
    constructor(
        socket: Connection,
        config: ChartConfig | string,
        options?: { updateTimeout?: number; serverSide?: boolean; compact?: boolean },
    );

    onUpdate(cb: ChartUpdateHandler | null): void;

    onReading(cb: ((isReading: boolean) => void) | null): void;

    onError(cb: ((err: Error) => void) | null): void;

    /** The configuration as it is drawn: the preset with the range of the view put over it */
    getConfig(): ChartConfigMore;

    /** A zoomed or panned window, `{ stopLive }` while the user drags, nothing to go back to the range */
    setNewRange(options?: { stopLive?: boolean; start?: number; end?: number }): void;

    setRange(range: ChartRangeOptions): void;

    setTimeRange(override: ChartTimeRangeOverride): void;

    exportData(from: number, to: number, excludes?: string[]): Promise<Record<string, SeriesData[]>>;

    /** Unsubscribes everything and stops the timers */
    destroy(): void;
}
