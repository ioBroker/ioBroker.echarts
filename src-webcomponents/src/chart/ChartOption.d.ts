/**
 * What the web component uses of `src-chart/src/Components/ChartOption.ts`: it builds the option of echarts out of
 * the configuration of a preset and the series of the model - the same code the chart page, the widgets and the
 * server render with. See `ChartModel.d.ts` for why these are declarations and not the sources.
 */
import type { EChartsOption } from 'echarts';
import type Moment from 'moment';

import type { ChartConfigMore } from '../../../src/types';
import type { BarAndLineSeries } from './ChartModel';

/** What `getOption` returns beside the option: the theme to init echarts with, and the renderer */
export type ChartViewOption = EChartsOption & {
    /** Name of the echarts theme */
    theme?: string;
    /** Draw on a canvas instead of SVG: on a touch device with zoom */
    useCanvas?: boolean;
};

/** The state of the drawn chart that a pan or a zoom changes */
export interface ChartInfo {
    xMin: number;
    xMax: number;
    yAxis: { min?: unknown; max?: unknown }[];
    withSeconds?: boolean;
    withTime?: boolean;
    diff?: number;

    lastX?: number;
    lastY?: number;
    yMoved?: boolean;
    xMoved?: boolean;
    _yAxis?: { min?: unknown; max?: unknown }[];

    padTop: number;
    padBottom: number;
    padLeft: number;
    padRight: number;

    lastWidth?: number | null;
}

export default class ChartOption {
    /**
     * @param moment moment with its locales, set to the language of the chart
     * @param themeType light or dark
     * @param calcTextWidth width of a text in px, for the room of the labels
     * @param config not needed: `getOption` takes it
     * @param compact without axes and labels
     */
    constructor(
        moment: typeof Moment,
        themeType: 'light' | 'dark',
        calcTextWidth: (text: string, fontSize: number) => number,
        config?: ChartConfigMore,
        compact?: boolean,
    );

    getHelperChartData(): ChartInfo;

    getOption(
        data: BarAndLineSeries[],
        config: ChartConfigMore,
        actualValues: (number | null | boolean | string)[],
        categories: number[],
    ): ChartViewOption;
}
