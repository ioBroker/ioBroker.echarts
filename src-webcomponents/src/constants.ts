/** Tag of the custom element; a host checks that the module defines exactly this one */
export const TAG = 'iob-echarts-chart';

/** The built module, next to its manifest */
export const MODULE_FILE = 'echarts-chart.js';

/** The manifest the build writes next to the module; `common.webComponents` names this one */
export const MANIFEST_FILE = 'echarts-chart.json';

/** Where `tasksWebComponents.mts` puts the module in the admin folder */
export const MODULE_PATH = `webcomponents/${MODULE_FILE}`;

/** The values of the settings of the manifest; a setting without a value is missing */
export type ChartSettings = {
    [name: string]: string | number | boolean | undefined;
    /** ID of a preset: `echarts.0.<name>` */
    preset?: string;
    /** Instead of a preset: a state whose history is drawn */
    historyOid?: string;
    title?: string;
    /** Show the button for the time range, also if the preset does not */
    rangeSelector?: boolean;

    // the chart of a single state, as the vis-2 widget builds it
    chartType?: string;
    aggregate?: string;
    live?: string;
    aggregateType?: string;
    aggregateSpan?: number;
    xticks?: number;
    yticks?: number;
    range?: string;
    relativeEnd?: string;
};

/** A choice of a `select` setting: the value and the key of its word */
export interface Choice {
    value: string;
    word: string;
}

/** The time ranges of the preset editor and the vis-2 widget, so all of them offer the same steps */
export const RANGES: Choice[] = [
    { value: '10', word: 'm10' },
    { value: '30', word: 'm30' },
    { value: '60', word: 'h1' },
    { value: '120', word: 'h2' },
    { value: '180', word: 'h3' },
    { value: '360', word: 'h6' },
    { value: '720', word: 'h12' },
    { value: '1440', word: 'd1' },
    { value: '2880', word: 'd2' },
    { value: '4320', word: 'd3' },
    { value: '10080', word: 'd7' },
    { value: '20160', word: 'd14' },
    { value: '1m', word: 'mo1' },
    { value: '2m', word: 'mo2' },
    { value: '3m', word: 'mo3' },
    { value: '6m', word: 'mo6' },
    { value: '1y', word: 'y1' },
    { value: '2y', word: 'y2' },
];

export const RELATIVE_ENDS: Choice[] = [
    { value: 'now', word: 'end_now' },
    { value: '1minute', word: 'end_minute' },
    { value: '5minutes', word: 'end_m5' },
    { value: '10minutes', word: 'end_m10' },
    { value: '30minutes', word: 'end_m30' },
    { value: '1hour', word: 'end_hour' },
    { value: '2hours', word: 'end_h2' },
    { value: '3hours', word: 'end_h3' },
    { value: '4hours', word: 'end_h4' },
    { value: '6hours', word: 'end_h6' },
    { value: '8hours', word: 'end_h8' },
    { value: '12hours', word: 'end_h12' },
    { value: 'today', word: 'end_day' },
    { value: 'weekEurope', word: 'end_sunday' },
    { value: 'weekUsa', word: 'end_saturday' },
    { value: 'month', word: 'end_month' },
    { value: 'year', word: 'end_year' },
];

/** How often the chart of a single state is read again. `0` and not empty: a host drops an empty value as missing */
export const LIVE: Choice[] = [
    { value: '0', word: 'off' },
    { value: '5', word: 's5' },
    { value: '10', word: 's10' },
    { value: '15', word: 's15' },
    { value: '20', word: 's20' },
    { value: '30', word: 's30' },
    { value: '60', word: 'm1' },
    { value: '120', word: 'm2' },
    { value: '300', word: 'm5' },
    { value: '600', word: 'm10' },
    { value: '900', word: 'm15' },
    { value: '1200', word: 'm20' },
    { value: '1800', word: 'm30' },
    { value: '3600', word: 'h1' },
    { value: '7200', word: 'h2' },
    { value: '10800', word: 'h3' },
    { value: '21600', word: 'h6' },
    { value: '43200', word: 'h12' },
    { value: '86400', word: 'd1' },
];

export const CHART_TYPES: Choice[] = [
    { value: 'auto', word: 'type_auto' },
    { value: 'line', word: 'type_line' },
    { value: 'bar', word: 'type_bar' },
    { value: 'scatterplot', word: 'type_scatterplot' },
    { value: 'steps', word: 'type_steps' },
    { value: 'stepsStart', word: 'type_stepsStart' },
    { value: 'spline', word: 'type_spline' },
];

export const AGGREGATES: Choice[] = [
    { value: 'minmax', word: 'agg_minmax' },
    { value: 'average', word: 'agg_average' },
    { value: 'min', word: 'agg_min' },
    { value: 'max', word: 'agg_max' },
    { value: 'total', word: 'agg_total' },
    { value: 'raw', word: 'agg_raw' },
];

export const AGGREGATE_TYPES: Choice[] = [
    { value: 'count', word: 'aggType_count' },
    { value: 'step', word: 'aggType_step' },
];

/**
 * The words the element shows, out of `src/i18n/`. The build hands only these to the module
 * (`__ECHARTS_WORDS__`); the ones of the settings go into the manifest only.
 */
export const ELEMENT_WORDS = [
    'choose',
    'noPreset',
    'noState',
    'noHistory',
    'timeRange',
    'resetZoom',
    'savePng',
    'saveSvg',
    'exportData',
    'selectLines',
    'linesToShow',
    'linesToExport',
    'export',
    'timeFormat',
    'browserFormat',
    'timestamp',
    'noData',
    'noDownload',
    'timeType',
    'relative',
    'static',
    'range',
    'relativeEnd',
    'start',
    'start_time',
    'end',
    'end_time',
    'date_help',
    'time_help',
    ...RANGES.map(choice => choice.word),
    ...RELATIVE_ENDS.map(choice => choice.word),
];

/**
 * The ID of a preset as the model reads it: a bare name is one of the first instance, as in the URL of the chart
 *
 * @param preset what the setting holds
 */
export function getPresetId(preset: string | undefined): string {
    if (!preset) {
        return '';
    }
    if ((!preset.startsWith('echarts.') && !preset.startsWith('flot.')) || !preset.includes('.')) {
        return `echarts.0.${preset}`;
    }
    return preset;
}
