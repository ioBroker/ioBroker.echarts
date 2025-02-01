export type ChartType = 'bar' | 'polar' | 'line' | 'auto' | 'steps' | 'stepsStart' | 'scatterplot' | 'spline';

export type ChartAggregateType =
    | 'minmax'
    | 'min'
    | 'max'
    | 'average'
    | 'percentile'
    | 'integral'
    | 'total'
    | 'count'
    | 'none'
    | 'current'
    | 'onchange'; // current does not exist in history

export type ChartRelativeEnd =
    | 'now'
    | '1minute'
    | '5minutes'
    | '10minutes'
    | '30minutes'
    | '1hour'
    | '2hours'
    | '3hours'
    | '4hours'
    | '6hours'
    | '8hours'
    | '12hours'
    | 'today'
    | 'weekEurope'
    | 'weekUsa'
    | 'week2Europe'
    | 'week2Usa'
    | 'month'
    | 'year';

export type ChartRangeOptions = number | '1m' | '2m' | '3m' | '6m' | '1y' | '2y';

export type ChartMarkConfig = {
    lineId: number;
    upperValueOrId: string | number;
    upperValue?: number | null; // parsed from upperValueOrId
    lowerValueOrId: string | number;
    lowerValue?: number | null; // parsed from lowerValueOrId
    color: string;
    fill: number;
    // line width
    ol: number;
    // shadow
    os: number;
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    text: string;
    textPosition:
        | 'r'
        | 'l'
        | 'insideStart'
        | 'insideStartTop'
        | 'insideStartBottom'
        | 'insideMiddle'
        | 'insideMiddleTop'
        | 'insideMiddleBottom'
        | 'insideEnd'
        | 'insideEndTop'
        | 'insideEndBottom';
    textOffset: number;
    textColor: string;
    textSize: number;
};

export type ChartLineConfig = {
    id: string;
    unit?: string;

    // conversion function
    convert?: string;
    // cut the chart after "now"
    noFuture?: boolean;
    postProcessing?: 'diff' | '';
    offset?: number | '1m' | '2m' | '3m' | '6m' | '1y' | '2y' | '-1m' | '-2m' | '-3m' | '-6m' | '-1y' | '-2y';
    name?: string;
    aggregate?: ChartAggregateType;

    // Todo: implement it
    percentile?: number;
    integralUnit?: number;
    integralInterpolation?: 'none' | 'linear';

    color?: string;
    thickness?: number;
    shadowsize?: number;
    dashes?: boolean;
    min?: number | string;
    max?: number | string;
    yOffset?: number;
    validTime?: number;
    chartType?: ChartType;
    instance?: string;
    ignoreNull?: boolean | 0;
    type?: 'number' | 'boolean' | 'string'; // obj.common.type
    states?: Record<string, string> | false; // obj.common.states
    falseText?: string;
    trueText?: string;

    afterComma?: number;

    commonYAxis?: number;
    yaxe?: 'off' | 'left' | 'right' | 'leftColor' | 'rightColor' | '';
};

export interface ChartLineConfigMore extends ChartLineConfig {
    // Show points on the line
    points?: boolean;
    // Point size
    symbolSize?: number;
    /** Style of the line */
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    // Fill the area under the line
    fill?: number;
    // splitNumber for Y axis
    yticks?: number;
    // splitNumber for X axis
    xticks?: number;

    xaxe?: 'off' | 'top' | '';

    // Hide this in legend
    hide?: boolean;

    // Used only for editor
    isBoolean?: boolean;
}

type ThemeChartType =
    | 'azul'
    | 'bee-inspired'
    | 'blue'
    | 'infographic'
    | 'vintage'
    | 'dark'
    | 'macarons'
    | 'shine'
    | 'roma'
    | 'royal'
    | 'dark-blue'
    | 'tech-blue'
    | 'red'
    | 'red-velvet'
    | 'green'
    | 'light'
    | 'gray'
    | 'dark-bold';

export interface ChartConfig {
    aggregate?: ChartAggregateType;
    ignoreNull?: boolean;
    aggregateBar?: number;
    aggregateType: 'step' | 'count';
    aggregateSpan: number;
    relativeEnd: ChartRelativeEnd;
    postProcessing?: 'diff';

    // Show actual values in legend
    legActual?: boolean;

    start_time?: string; // 00:00
    end_time?: string; // 23:59
    start?: number | string;
    end?: number | string;

    l: ChartLineConfig[];
    marks: ChartMarkConfig[];
    ticks?: string;

    width?: string | number;
    height?: string | number;
    timeFormat?: string;
    useComma?: boolean;
    zoom?: boolean;
    export?: boolean;
    grid_hideX?: boolean;
    grid_hideY?: boolean;
    /** If tooltip should be shown on mouse over */
    hoverDetail?: boolean;
    /** Color of tooltip background */
    hoverBackground?: string;
    /** Do not show loader animation at start */
    noLoader?: boolean;
    noedit?: boolean;
    animation: number;
    afterComma?: number;
    timeFormatCustom?: boolean;
    timeType: 'relative' | 'static';
    xLabelShift?: number | '1m' | '2m' | '3m' | '6m' | '1y' | '2y' | '-1m' | '-2m' | '-3m' | '-6m' | '-1y' | '-2y';
    xLabelShiftMonth?: boolean;
    xLabelShiftYear?: boolean;

    lang?: ioBroker.Languages;
    live: number;
    debug?: boolean;
    presetId?: string;
    range: ChartRangeOptions;
}

// string = presetID, {id, instance} = direct from state with history enabled
export type SelectedChart = { id: string; instance: string } | string;

export interface ChartConfigMore extends ChartConfig {
    l: ChartLineConfigMore[];

    title?: string;
    /** Title position in form "top:35;left:65" */
    titlePos?: string;
    titleSize?: number;
    titleColor?: string;

    noBorder?: 'noborder';
    // Outer border width of the whole chart
    border_width?: number;
    // Outer padding of the whole chart
    border_padding?: number;
    /** Color of a border */
    border_color?: string;
    /** Style of a border */
    border_style?: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset';

    // Color of export button
    exportColor?: string;

    // Window background
    window_bg?: string;

    theme?: ThemeChartType | 'default';
    barFontColor?: string;
    barLabels?: 'topover' | 'topunder' | 'bottom' | 'inside' | '';
    barFontSize?: number;
    barWidth?: number;

    noAnimation?: boolean;

    x_labels_size?: number;
    x_labels_color?: string;
    x_ticks_color?: string;
    y_labels_size?: number;
    y_labels_color?: string;
    y_ticks_color?: string;
    // Grid color
    grid_color?: string;
    // Time after which the zoom position will be reset
    resetZoom?: number;

    // Show legend
    legend?: 'nw' | 'sw' | 'ne' | 'se' | 'dialog' | '';
    // Legend background
    legBg?: string;
    // Legend Height
    legendHeight?: number;
    legColor?: string;
    legFontSize?: number;
    legendDirection?: 'vertical' | '';

    // Calculate padding for chart automatically
    autoGridPadding?: boolean;
    // Background for chart itself (not window)
    bg_custom?: string;

    hoverNoNulls?: boolean;
    hoverNoInterpolate?: boolean;

    // Show export data button
    exportData?: boolean;
    // Color of export button
    exportDataColor?: string;

    // Make the background of the HTML window transparent
    noBackground?: boolean;

    // Show radar as circle
    radarCircle?: 'circle';

    /** Chart type for all lines (fast editing) */
    chartType?: ChartType;
}

export type EchartsOptions = {
    preset: string; // the only mandatory attribute

    renderer?: 'svg' | 'png' | 'jpg' | 'pdf'; // svg | png | jpg | pdf, default: svg

    /** default 1024 */
    width?: number;
    /** default 300 */
    height?: number;
    /** Background color */
    background?: string;
    /** Theme type */
    theme?: 'light' | 'dark';
    /** @deprecated use theme instead */
    themeType?: 'light' | 'dark';

    /** Title of PDF document */
    title?: string;
    /** quality of JPG */
    quality?: number;
    /** Compression level of PNG */
    compressionLevel?: number;
    /** Filters of PNG (Bit combination https://github.com/Automattic/node-canvas/blob/master/types/index.d.ts#L10) */
    filters?: number;

    /** Path on disk to save the file. */
    fileOnDisk?: string;
    /** Path in ioBroker DB to save the files on 'echarts.0'. E.g., if your set "chart.svg", so you can access your picture via http(s)://ip:8082/echarts.0/chart.png */
    fileName?: string;

    /** Cache time for this preset in seconds, default: 0 - no cache */
    cache?: number;
    /** Ignore cache */
    forceRefresh?: boolean;
};

export interface Connection {
    getState: (id: string) => Promise<ioBroker.State | null | undefined>;
    getHistoryEx: (
        id: string,
        options: ioBroker.GetHistoryOptions,
    ) => Promise<{
        values: ioBroker.GetHistoryResult;
        sessionId: number | string;
        step: number;
    }>;

    getObject: (id: string) => Promise<ioBroker.Object | null | undefined>;

    getSystemConfig: () => Promise<ioBroker.SystemConfigObject>;

    unsubscribeState: (_id: string | string[], _cb?: ioBroker.StateChangeHandler) => void;
    subscribeState: (_id: string | string[], _cb: ioBroker.StateChangeHandler) => Promise<void>;

    unsubscribeObject: (
        _id: string | string[],
        _cb?: (
            id: string,
            obj: ioBroker.Object | null | undefined,
            oldObj?: {
                _id: string;
                type: string;
            },
        ) => void,
    ) => Promise<void>;

    subscribeObject: (
        _id: string | string[],
        _cb: (
            id: string,
            obj: ioBroker.Object | null | undefined,
            oldObj?: {
                _id: string;
                type: string;
            },
        ) => void,
    ) => Promise<void>;
}
