import type * as moment from 'moment';
import type { ChartConfigMore, ThemeChartType } from '../../../src/types';
import type { BarAndLineSeries, BarSeries, EchartsOneValue, LineSeries } from './ChartModel';
import type { EChartsOption, LegendComponentOption } from 'echarts/types/dist/echarts';
import type {
    CallbackDataParams,
    GridOption,
    LinearGradientObject,
    RegisteredSeriesOption,
    TitleOption,
    XAXisOption,
    YAXisOption,
} from 'echarts/types/dist/shared';

type ThemeType = 'light' | 'dark';

const THEMES: Record<ThemeChartType, string[]> = {
    azul: ['#f2385a', '#f5a503', '#4ad9d9', '#f7879c', '#c1d7a8', '#4dffd2', '#fccfd7', '#d5f6f6'],
    'bee-inspired': ['#001727', '#805500', '#ffff00', '#ffd11a', '#f2d71f', '#f2be19', '#f3a81a', '#fff5cc'],
    blue: ['#1790cf', '#1bb2d8', '#99d2dd', '#88b0bb', '#1c7099', '#038cc4', '#75abd0', '#afd6dd'],
    infographic: [
        '#C1232B',
        '#27727B',
        '#FCCE10',
        '#E87C25',
        '#B5C334',
        '#FE8463',
        '#9BCA63',
        '#FAD860',
        '#F3A43B',
        '#60C0DD',
        '#D7504B',
        '#C6E579',
        '#F4E001',
        '#F0805A',
        '#26C0C0',
    ],
    vintage: [
        '#d87c7c',
        '#919e8b',
        '#d7ab82',
        '#6e7074',
        '#61a0a8',
        '#efa18d',
        '#787464',
        '#cc7e63',
        '#724e58',
        '#4b565b',
    ],
    dark: [
        '#dd6b66',
        '#759aa0',
        '#e69d87',
        '#8dc1a9',
        '#ea7e53',
        '#eedd78',
        '#73a373',
        '#73b9bc',
        '#7289ab',
        '#91ca8c',
        '#f49f42',
    ],
    macarons: [
        '#2ec7c9',
        '#b6a2de',
        '#5ab1ef',
        '#ffb980',
        '#d87a80',
        '#8d98b3',
        '#e5cf0d',
        '#97b552',
        '#95706d',
        '#dc69aa',
        '#07a2a4',
        '#9a7fd1',
        '#588dd5',
        '#f5994e',
        '#c05050',
        '#59678c',
        '#c9ab00',
        '#7eb00a',
        '#6f5553',
        '#c14089',
    ],
    shine: ['#c12e34', '#e6b600', '#0098d9', '#2b821d', '#005eaa', '#339ca8', '#cda819', '#32a487'],
    roma: [
        '#E01F54',
        '#001852',
        '#f5e8c8',
        '#b8d2c7',
        '#c6b38e',
        '#a4d8c2',
        '#f3d999',
        '#d3758f',
        '#dcc392',
        '#2e4783',
        '#82b6e9',
        '#ff6347',
        '#a092f1',
        '#0a915d',
        '#eaf889',
        '#6699FF',
        '#ff6666',
        '#3cb371',
        '#d5b158',
        '#38b6b6',
    ],
    royal: ['#3f7ea6', '#993366', '#408000', '#8c6f56', '#a65149', '#731f17', '#adc2eb', '#d9c3b0'],
    'dark-blue': ['#00305a', '#004b8d', '#0074d9', '#4192d9', '#7abaf2', '#99cce6', '#d6ebf5', '#eeeeee'],
    'tech-blue': [
        '#4d4d4d',
        '#3a5897',
        '#007bb6',
        '#7094db',
        '#0080ff',
        '#b3b3ff',
        '#00bdec',
        '#33ccff',
        '#ccddff',
        '#eeeeee',
    ],
    red: ['#d8361b', '#f16b4c', '#f7b4a9', '#d26666', '#99311c', '#c42703', '#d07e75'],
    'red-velvet': ['#8b1a2d', '#a7314b', '#e6004c', '#ff8066', '#8e5c4e', '#ff1a66', '#d6c582', '#f0d4af'],
    green: ['#408829', '#68a54a', '#a9cba2', '#86b379', '#397b29', '#8abb6f', '#759c6a', '#bfd3b7'],
    light: [
        '#37A2DA',
        '#32C5E9',
        '#67E0E3',
        '#9FE6B8',
        '#FFDB5C',
        '#ff9f7f',
        '#fb7293',
        '#E062AE',
        '#E690D1',
        '#e7bcf3',
        '#9d96f5',
        '#8378EA',
        '#96BFFF',
    ],
    gray: ['#757575', '#c7c7c7', '#dadada', '#8b8b8b', '#b5b5b5', '#e9e9e9'],
    'dark-bold': ['#458c6b', '#f2da87', '#d9a86c', '#d94436', '#a62424', '#76bc9b', '#cce6da', '#eeeeee'],
};

type MomentType = typeof moment;

function padding2(num: number): string {
    if (!num) {
        return '00';
    }
    // on safari 9.0 it is unknown
    // return num.toString().padStart(2, '0');
    const numStr = (num || '').toString();
    if (numStr.length < 2) {
        return `0${numStr}`;
    }

    return numStr;
}

function rgba2hex(color: string): string {
    const rgb = color.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i);
    return rgb
        ? `#${parseInt(rgb[1], 10).toString(16).padStart(2, '0')}${parseInt(rgb[2], 10).toString(16).padStart(2, '0')}${parseInt(rgb[3], 10).toString(16).padStart(2, '0')}`
        : color;
}

function brighterColor(color: string, amt: number): string {
    let usePound = false;

    if (color.includes('rgb')) {
        color = rgba2hex(color);
    }

    if (color[0] === '#') {
        color = color.slice(1);
        usePound = true;
    }

    const num = parseInt(color, 16);

    let r = (num >> 16) + amt;
    if (r > 255) {
        r = 255;
    } else if (r < 0) {
        r = 0;
    }

    let b = ((num >> 8) & 0x00ff) + amt;
    if (b > 255) {
        b = 255;
    } else if (b < 0) {
        b = 0;
    }

    let g = (num & 0x0000ff) + amt;
    if (g > 255) {
        g = 255;
    } else if (g < 0) {
        g = 0;
    }

    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
}

function getGradient(color: string): LinearGradientObject {
    return {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
            {
                offset: 0,
                color: brighterColor(color, 30),
            },
            {
                offset: 1,
                color,
            },
        ],
    };
}

type ChartInfo = {
    xMin?: number;
    xMax?: number;
    yAxis: YAXisOption[];
    withSeconds?: boolean;
    withTime?: boolean;
    diff?: number;

    lastX?: number;
    lastY?: number;
    yMoved?: boolean;
    xMoved?: boolean;
    _yAxis?: YAXisOption[];

    padTop?: number;
    padBottom?: number;
    padLeft?: number;
    padRight?: number;

    lastWidth?: number;
};

class ChartOption {
    private readonly moment: MomentType;
    calcTextWidth: (text: string, fontSize: number) => number;
    private config: ChartConfigMore;
    private readonly themeType: ThemeType;
    private readonly chart: ChartInfo;
    private readonly isTouch: boolean =
        typeof window !== 'undefined' ? 'ontouchstart' in window.document.documentElement : false;
    private readonly compact: boolean;
    private lastFormattedTime: string | number | Date | null;
    private option: EChartsOption | null;
    private debug = false;

    constructor(
        moment: MomentType,
        themeType: ThemeType,
        calcTextWidth: (text: string, fontSize: number) => number,
        config?: ChartConfigMore,
        compact?: boolean,
    ) {
        this.moment = moment;
        if (!this.moment) {
            throw new Error('moment must be set and initialized');
        }

        this.config = config ? JSON.parse(JSON.stringify(config)) : null;
        this.calcTextWidth = calcTextWidth;
        this.themeType = themeType || 'light';
        this.chart = { yAxis: [] };
        this.compact = compact;
        this.lastFormattedTime = null;
    }

    /*
    setThemeName(themeType) {
        this.themeType = themeType || 'light';
    }

    setConfig(config) {
        this.config = config;
    }
    */

    getHelperChartData(): ChartInfo {
        return this.chart;
    }

    convertData(data: LineSeries[], chartIndex: number, yAxisIndex: number): LineSeries {
        const values = data[chartIndex];
        if (!values?.length) {
            return [];
        }

        const yAxis: YAXisOption = this.chart.yAxis[yAxisIndex] || ({ max: null, min: null } as YAXisOption);
        this.chart.yAxis[yAxisIndex] = yAxis;

        for (let ii = 0; ii < values.length; ii++) {
            if (values[ii].value[1] === null) {
                continue;
            }

            if (yAxis.min === null || (yAxis.min as number) > values[ii].value[1]) {
                yAxis.min = values[ii].value[1];
            }
            if (yAxis.max === null || (yAxis.max as number) < values[ii].value[1]) {
                yAxis.max = values[ii].value[1];
            }
        }

        if (this.chart.xMin === null || this.chart.xMin > values[0].value[0]) {
            this.chart.xMin = values[0].value[0];
        }
        if (this.chart.xMax === null || this.chart.xMax < values[values.length - 1].value[0]) {
            this.chart.xMax = values[values.length - 1].value[0];
        }

        return values;
    }

    static getCommonAxis(commonYAxis: number, chartIndex: number): number {
        return (commonYAxis as unknown as string) === '' || commonYAxis === undefined
            ? chartIndex
            : parseInt(commonYAxis as unknown as string, 10) || 0;
    }

    getSeries(
        data: BarAndLineSeries[],
        theme: ThemeChartType,
    ): (
        | RegisteredSeriesOption['radar']
        | RegisteredSeriesOption['line']
        | RegisteredSeriesOption['scatter']
        | RegisteredSeriesOption['bar']
    )[] {
        this.chart.xMin = null;
        this.chart.xMax = null;
        let colorCount = 0;

        const anyNotOwnAxis = this.config.l.find(
            (oneLine, i) => ChartOption.getCommonAxis(oneLine.commonYAxis, i) !== i,
        );

        return this.config.l.map((oneLine, i) => {
            const color = oneLine.color || (THEMES[theme] ? THEMES[theme][colorCount % THEMES[theme].length] : '');
            if (!oneLine.color) {
                colorCount++;
            }

            oneLine.shadowsize = parseFloat(oneLine.shadowsize as unknown as string) || 0;
            if ((oneLine.dashes as unknown as string) === 'false') {
                oneLine.dashes = false;
            } else if ((oneLine.dashes as unknown as string) === 'true') {
                oneLine.dashes = true;
            }

            const yAxisIndex = ChartOption.getCommonAxis(oneLine.commonYAxis, i);
            if (oneLine.chartType === 'bar') {
                const cfg: RegisteredSeriesOption['bar'] = {
                    name: oneLine.name,
                    clip: true,
                    label: {
                        show: !!this.config.barLabels,
                        position:
                            this.config.barLabels === 'topover'
                                ? 'top'
                                : this.config.barLabels === 'topunder'
                                  ? 'insideTop'
                                  : this.config.barLabels === 'bottom'
                                    ? 'insideBottom'
                                    : 'inside',
                        formatter: (value: CallbackDataParams): string => this.yFormatter(value, i, true),
                        color: this.config.barFontColor || (this.themeType === 'dark' ? '#fff' : '#000'),
                        fontSize: parseInt(this.config.barFontSize as unknown as string, 10) || undefined,
                    },
                    barWidth: parseInt(this.config.barWidth as unknown as string, 10) || undefined,
                    // xAxisIndex: 0,
                    stack: anyNotOwnAxis ? 'total' : undefined,
                    silent: true,
                    // yAxisIndex,
                    type: 'bar',
                    // showSymbol: oneLine.chartType === 'scatterplot' || oneLine.points,
                    // hoverAnimation: false,
                    animation: false,
                    // step: oneLine.chartType === 'steps' ? 'end' : (oneLine.chartType === 'stepsStart' ? 'start' : undefined) ,
                    // smooth: oneLine.chartType === 'spline',
                    data: data[i] as BarSeries,
                    color,
                };
                return cfg;
            } else if (oneLine.chartType === 'polar') {
                const cfg: RegisteredSeriesOption['radar'] = {
                    // name: oneLine.name,
                    clip: true,
                    ttt: 84,
                    label: {
                        show: !!this.config.barLabels,
                        position:
                            this.config.barLabels === 'topover'
                                ? 'top'
                                : this.config.barLabels === 'topunder'
                                  ? 'insideTop'
                                  : this.config.barLabels === 'bottom'
                                    ? 'insideBottom'
                                    : 'inside',
                        formatter: (value: CallbackDataParams): string => this.yFormatter(value, i, true),
                        color: this.config.barFontColor || (this.themeType === 'dark' ? '#fff' : '#000'),
                        fontSize: parseInt(this.config.barFontSize as unknown as string, 10) || undefined,
                    },
                    stack: anyNotOwnAxis ? 'total' : undefined,
                    silent: true,
                    type: 'radar',
                    animation: false,
                    // @ts-expect-error fix later!
                    data: data[i] as BarSeries,
                    color,
                };
                return cfg;
            }
            let cfg: RegisteredSeriesOption['scatter'] | RegisteredSeriesOption['line'];
            if (oneLine.chartType === 'scatterplot') {
                const _cfg: RegisteredSeriesOption['scatter'] = {
                    name: oneLine.name,
                    clip: true,
                    xAxisIndex: 0,

                    silent: true,
                    yAxisIndex,
                    type: 'scatter',
                    // hoverAnimation: false,
                    animation: false,
                    data: this.convertData(data as LineSeries[], i, yAxisIndex),
                    itemStyle: { color },
                    symbolSize: oneLine.points ? oneLine.symbolSize || 3 : undefined,
                    symbol: oneLine.points ? 'circle' : 'none',
                    emphasis: {
                        scale: false,
                        focus: 'none',
                        disabled: true, // what is that?
                    },
                };
                cfg = _cfg;
            } else {
                const _cfg: RegisteredSeriesOption['line'] = {
                    name: oneLine.name,
                    clip: true,
                    xAxisIndex: 0,

                    silent: true,
                    yAxisIndex,
                    type: 'line',
                    // hoverAnimation: false,
                    animation: false,
                    step:
                        oneLine.chartType === 'steps'
                            ? 'end'
                            : oneLine.chartType === 'stepsStart'
                              ? 'start'
                              : undefined,
                    smooth: oneLine.chartType === 'spline',
                    data: this.convertData(data as LineSeries[], i, yAxisIndex),
                    itemStyle: { color },
                    symbolSize: oneLine.points ? oneLine.symbolSize || 3 : undefined,
                    symbol: oneLine.points ? 'circle' : 'none',
                    emphasis: {
                        scale: false,
                        focus: 'none',
                        disabled: true, // what is that?
                        lineStyle: {
                            width:
                                oneLine.thickness !== undefined
                                    ? parseFloat(oneLine.thickness as unknown as string)
                                    : 1,
                            shadowBlur: oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                            shadowOffsetY: oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                            shadowColor: color,
                            type: oneLine.dashes ? 'dashed' : oneLine.lineStyle || 'solid',
                        },
                    },
                    lineStyle: {
                        width: oneLine.thickness !== undefined ? parseFloat(oneLine.thickness as unknown as string) : 1,
                        shadowBlur: oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                        shadowOffsetY: oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                        shadowColor: color,
                        type: oneLine.dashes ? 'dashed' : oneLine.lineStyle || 'solid',
                    },
                };
                if (parseFloat(oneLine.fill as unknown as string)) {
                    let _color: string | LinearGradientObject;
                    if (!this.isTouch) {
                        _color = getGradient(color);
                    } else {
                        _color = color;
                    }
                    _cfg.areaStyle = {
                        color: _color,
                        opacity: parseFloat(oneLine.fill as unknown as string) || 0,
                    };
                }
                cfg = _cfg;
            }
            return cfg;
        });
    }

    getXAxis(categories: number[]): XAXisOption[] {
        if (this.config.l.find(l => l.chartType === 'bar')) {
            const xAxis: XAXisOption = {
                type: 'category',
                data: categories.map(i => `b${i}`),
                splitLine: {
                    show: !this.config.grid_hideX,
                    lineStyle:
                        this.config.l[0].xaxe === 'off'
                            ? { color: 'rgba(0,0,0,0)', type: 'dashed' }
                            : this.config.grid_color
                              ? {
                                    color: this.config.grid_color,
                                    type: 'dashed',
                                }
                              : { type: 'dashed' },
                },
                position: this.config.l[0].xaxe === 'top' ? 'top' : 'bottom',
                axisLabel: {
                    show: !this.compact,
                    formatter: (value: string, _index: number) =>
                        this.xFormatter(value, _index, this.config.l[0].xaxe === 'top'),
                    fontSize: parseInt(this.config.x_labels_size as unknown as string, 10) || 12,
                    color: this.config.l[0].xaxe === 'off' ? 'rgba(0,0,0,0)' : this.config.x_labels_color || undefined,
                    rich: {
                        a: {
                            fontWeight: 'bold',
                        },
                        b: {
                            opacity: 0,
                        },
                    },
                },
            };

            return [xAxis];
        }

        const xAxis: XAXisOption = {
            type: 'time',
            splitLine: {
                show: !this.config.grid_hideX,
                lineStyle:
                    this.config.l[0].xaxe === 'off'
                        ? { color: 'rgba(0,0,0,0)', type: 'dashed' }
                        : this.config.grid_color
                          ? {
                                color: this.config.grid_color,
                                type: 'dashed',
                            }
                          : { type: 'dashed' },
            },
            splitNumber: parseInt(this.config.l[0].xticks as unknown as string, 10) || undefined,
            position: this.config.l[0].xaxe === 'top' ? 'top' : 'bottom',
            min: this.chart.xMin,
            max: this.chart.xMax,
            axisTick: {
                lineStyle:
                    this.config.l[0].xaxe === 'off'
                        ? { color: 'rgba(0,0,0,0)' }
                        : this.config.x_ticks_color
                          ? { color: this.config.x_ticks_color }
                          : undefined,
            },
            axisLabel: {
                show: !this.compact,
                formatter: (value, _index) => this.xFormatter(value, _index, this.config.l[0].xaxe === 'top'),
                fontSize: parseInt(this.config.x_labels_size as unknown as string, 10) || 12,
                color: this.config.l[0].xaxe === 'off' ? 'rgba(0,0,0,0)' : this.config.x_labels_color || undefined,
                rich: {
                    a: {
                        fontWeight: 'bold',
                    },
                    b: {
                        opacity: 0,
                    },
                },
            },
        };

        return [xAxis];
    }

    getYAxis(
        series: (
            | RegisteredSeriesOption['radar']
            | RegisteredSeriesOption['line']
            | RegisteredSeriesOption['scatter']
            | RegisteredSeriesOption['bar']
        )[],
    ): YAXisOption[] {
        return this.config.l.map((oneLine, chartIndex) => {
            if (!oneLine || ((oneLine.commonYAxis as unknown as string) !== '' && oneLine.commonYAxis !== undefined)) {
                return {};
            }

            let yMin = parseFloat(oneLine.min as unknown as string);
            let yMax = parseFloat(oneLine.max as unknown as string);

            const yAxis = this.chart.yAxis;
            if (yAxis[chartIndex]) {
                const diff = (yAxis[chartIndex].max as number) - (yAxis[chartIndex].min as number);
                if (Number.isNaN(yMin)) {
                    // auto calculate
                    yMin = (yAxis[chartIndex].min as number) - diff * 0.1; // min - 10%
                    if (diff > 25000) {
                        yMin = Math.floor(yMin / 10000) * 10000;
                    } else if (diff > 5000) {
                        yMin = Math.floor(yMin / 1000) * 1000;
                    } else if (diff > 200) {
                        yMin = Math.floor(yMin / 100) * 100;
                    } else if (diff > 30) {
                        yMin = Math.floor(yMin / 10) * 10;
                    } else if (diff > 10) {
                        yMin = Math.floor(yMin);
                    } else if (diff > 1) {
                        yMin = Math.floor(yMin * 10) / 10;
                    }
                }
                if (Number.isNaN(yMax)) {
                    // auto calculate
                    yMax = (yAxis[chartIndex].max as number) + diff * 0.1; // max + 10%
                    if (diff > 25000) {
                        yMax = Math.ceil(yMax / 10000) * 10000;
                    } else if (diff > 5000) {
                        yMax = Math.ceil(yMax / 1000) * 1000;
                    } else if (diff > 200) {
                        yMax = Math.ceil(yMax / 100) * 100;
                    } else if (diff > 30) {
                        yMax = Math.ceil(yMax / 10) * 10;
                    } else if (diff > 10) {
                        yMax = Math.ceil(yMax);
                    } else if (diff > 1) {
                        yMax = Math.floor(yMax * 10) / 10;
                    }
                }
            } else {
                if (Number.isNaN(yMin)) {
                    yMin = undefined;
                }
                if (Number.isNaN(yMax)) {
                    yMax = undefined;
                }
            }

            let color: string | undefined =
                oneLine.yaxe === 'off' ? 'rgba(0,0,0,0)' : this.config.grid_color || undefined;
            if (oneLine.yaxe === 'leftColor' || oneLine.yaxe === 'rightColor') {
                color = series[chartIndex]?.itemStyle?.color as string;
            }

            return {
                type: 'value',
                min: yMin,
                max: yMax,
                position:
                    oneLine.yaxe === 'left' || oneLine.yaxe === 'off' || oneLine.yaxe === 'leftColor'
                        ? 'left'
                        : oneLine.yaxe === 'right' || oneLine.yaxe === 'rightColor'
                          ? 'right'
                          : !chartIndex
                            ? 'left'
                            : 'right', // by default, only the first line is on the left
                splitLine: !chartIndex
                    ? {
                          // grid has only first line
                          show: !this.config.grid_hideY,
                          lineStyle: {
                              color: color || undefined,
                              type: 'dashed',
                          },
                      }
                    : undefined,
                splitNumber: parseInt(oneLine.yticks as unknown as string, 10) || undefined,
                axisLabel: {
                    show: !this.compact,
                    formatter: value => this.yFormatter(value, chartIndex, true),
                    color:
                        oneLine.yaxe === 'off' || oneLine.yaxe === 'leftColor' || oneLine.yaxe === 'rightColor'
                            ? color
                            : this.config.y_labels_color || undefined,
                    fontSize: parseInt(this.config.y_labels_size as unknown as string, 10) || 12,
                },
                axisTick: {
                    alignWithLabel: true,
                    lineStyle: color
                        ? { color }
                        : this.config.y_ticks_color
                          ? { color: this.config.y_ticks_color }
                          : undefined,
                },
            };
        });
    }

    getMarkings(options: EChartsOption): EChartsOption {
        // fill markings
        this.config.marks?.forEach(oneMark => {
            if (!oneMark) {
                return;
            }
            const lowerLimitFloat =
                oneMark.lowerValue !== undefined ? oneMark.lowerValue : parseFloat(oneMark.lowerValueOrId as string);
            const upperLimitFloat =
                oneMark.upperValue !== undefined ? oneMark.upperValue : parseFloat(oneMark.upperValueOrId as string);
            const isLowerNumber = lowerLimitFloat !== null && !Number.isNaN(lowerLimitFloat);
            const isUpperNumber = upperLimitFloat !== null && !Number.isNaN(upperLimitFloat);

            const series = (
                options.series as (
                    | RegisteredSeriesOption['radar']
                    | RegisteredSeriesOption['line']
                    | RegisteredSeriesOption['scatter']
                    | RegisteredSeriesOption['bar']
                )[]
            )[oneMark.lineId];

            if (!series) {
                console.error('Mark line has no chart line');
                return;
            }

            if (isLowerNumber && isUpperNumber) {
                // area
                series.markArea = series.markArea || {
                    data: [],
                };
                series.markArea.data.push([
                    {
                        yAxis: lowerLimitFloat,
                        //  name: oneMark.text || '',
                        itemStyle: {
                            color: oneMark.color || (series.itemStyle.color as string),
                            borderWidth: 0,
                            opacity: parseFloat(oneMark.fill as unknown as string) || 0,
                        },
                    },
                    {
                        yAxis: upperLimitFloat,
                    },
                ]);
            }
            if (isLowerNumber || isUpperNumber) {
                for (let i = 0; i < 2; i++) {
                    if (!i && !isUpperNumber) {
                        continue;
                    } else if (i && !isLowerNumber) {
                        continue;
                    }
                    const limitFloat = i ? lowerLimitFloat : upperLimitFloat;
                    series.markLine = series.markLine || {
                        symbol: ['none', 'none'],
                        data: [],
                    };

                    series.markLine.data.push({
                        yAxis: limitFloat,
                        name: oneMark.text,
                        lineStyle: {
                            color: oneMark.color || (series.itemStyle.color as string),
                            width: parseFloat(oneMark.ol as unknown as string) || 1,
                            shadowBlur: parseFloat(oneMark.os as unknown as string)
                                ? parseFloat(oneMark.os as unknown as string) + 1
                                : 0,
                            shadowOffsetY: parseFloat(oneMark.os as unknown as string)
                                ? parseFloat(oneMark.os as unknown as string) + 1
                                : 0,
                            shadowColor: oneMark.color,
                            type: oneMark.lineStyle || 'solid',
                        },
                        label: {
                            show: !!oneMark.text,
                            formatter: param => param.name,
                            position:
                                oneMark.textPosition === 'r'
                                    ? 'end'
                                    : oneMark.textPosition === 'l'
                                      ? 'start'
                                      : oneMark.textPosition || 'start',
                            distance: [
                                oneMark.textPosition === 'r' || oneMark.textPosition === 'l'
                                    ? -1 * oneMark.textOffset || -35
                                    : parseFloat(oneMark.textOffset as unknown as string) || 0,
                                0,
                            ],
                            fontStyle: 'normal',
                            color: oneMark.textColor || '#FFF',
                            fontSize: oneMark.textSize || undefined,
                        },
                    });

                    if (this.config.l[oneMark.lineId]) {
                        // if the minimum isn't set
                        const yMin = parseFloat(this.config.l[oneMark.lineId].min as unknown as string);
                        if (Number.isNaN(yMin) && this.chart.yAxis[oneMark.lineId]) {
                            if ((this.chart.yAxis[oneMark.lineId].min as number) > limitFloat && limitFloat < 0) {
                                (options.yAxis as YAXisOption[])[0].min = limitFloat;
                            }
                        }
                        const yMax = parseFloat(this.config.l[oneMark.lineId].min as unknown as string);
                        if (Number.isNaN(yMax) && this.chart.yAxis[oneMark.lineId]) {
                            if ((this.chart.yAxis[oneMark.lineId].max as number) < limitFloat) {
                                (options.yAxis as YAXisOption[])[0].max = limitFloat;
                            }
                        }
                    }
                }
            }
        });

        return options;
    }

    yFormatter(
        val: CallbackDataParams | ioBroker.StateValue,
        line: number,
        withUnit?: boolean,
        interpolated?: boolean,
        forAxis?: boolean,
    ): string {
        let simpleValue: string | number | null | undefined | boolean;
        if (val && typeof val === 'object') {
            if (val.seriesType !== 'bar' && val.seriesType !== 'polar') {
                withUnit = false;
            }
            if (val.seriesType === 'polar') {
                line = val.dimensionIndex;
            }
            simpleValue = val.value as string | number;
        } else {
            simpleValue = val as string | number | null | undefined | boolean;
        }

        // If mapping exist for state values
        if (this.config.l[line].states) {
            let strNumValue: number | string;
            if (simpleValue === true) {
                strNumValue = 1;
            } else if (simpleValue === false) {
                strNumValue = 0;
            } else {
                strNumValue = simpleValue;
            }

            const state = (this.config.l[line].states as Record<string, string>)[strNumValue];
            if (state !== null && state !== undefined) {
                return state.toString();
            }
            if (forAxis) {
                // find the nearest state
                const values = Object.keys(this.config.l[line].states).sort();
                for (let i = 0; i < values.length; i++) {
                    if (strNumValue < values[i]) {
                        return (this.config.l[line].states as Record<string, string>)[values[i]].toString();
                    }
                }
                return (this.config.l[line].states as Record<string, string>)[values[values.length - 1]].toString();
            }
            return ''; // do not show 1.1 or 0.8 for enum
        }

        if (this.config.l[line].type === 'boolean') {
            if (simpleValue === 0 || simpleValue === '0' || simpleValue === 'false' || simpleValue === false) {
                return this.config.l[line].falseText || 'FALSE';
            }
            if (simpleValue === 1 || simpleValue === '1' || simpleValue === 'true' || simpleValue === true) {
                return this.config.l[line].trueText || 'TRUE';
            }
            if (forAxis) {
                // find the nearest state
                return (simpleValue as number) >= 0.5
                    ? this.config.l[line].trueText || 'TRUE'
                    : this.config.l[line].falseText || 'FALSE';
            }
            return ''; // do not show 1.1 or 0.8 for boolean
        }

        if (simpleValue === null || simpleValue === undefined) {
            return '';
        }

        const afterComma = this.config.l[line].afterComma;
        if (afterComma !== undefined && afterComma !== null) {
            simpleValue = parseFloat(simpleValue as string);
            if (this.config.useComma) {
                return simpleValue.toFixed(afterComma).replace('.', ',') + (withUnit ? this.config.l[line].unit : '');
            }
            return simpleValue.toFixed(afterComma) + (withUnit ? this.config.l[line].unit : '');
        }
        if (interpolated) {
            simpleValue = Math.round((simpleValue as number) * 10000) / 10000;
        }

        if (this.config.useComma) {
            simpleValue = parseFloat(simpleValue as string) || 0;
            simpleValue = simpleValue.toString().replace('.', ',') + (withUnit ? this.config.l[line].unit : '');
            return simpleValue;
        }
        return simpleValue.toString() + (withUnit ? this.config.l[line].unit : '');
    }

    isXLabelHasBreak(): boolean {
        if (this.config.timeFormat) {
            return this.config.timeFormat.replace('<br/>', '\n').includes('\n');
        }
        if (this.chart.withSeconds) {
            return true;
        }
        if (this.chart.withTime) {
            return true;
        }
        return true;
    }

    xFormatter(value: string | number | Date, _index: number, isTop?: boolean): string {
        if (typeof value === 'string' && value.startsWith('b')) {
            const _date = new Date(parseInt(value.substring(1), 10));
            if (this.config.xLabelShift) {
                if (this.config.xLabelShiftMonth) {
                    _date.setMonth(_date.getMonth() + (this.config.xLabelShift as number));
                } else if (this.config.xLabelShiftYear) {
                    _date.setFullYear(_date.getFullYear() + (this.config.xLabelShift as number));
                } else {
                    _date.setSeconds(_date.getSeconds() + (this.config.xLabelShift as number));
                }
            }

            if (this.config.aggregateBar === 60) {
                return `.${_date.getDate()} ${_date.getHours().toString().padStart(2, '0')}:00`;
            }
            if (this.config.aggregateBar === 15) {
                return `${_date.getHours().toString().padStart(2, '0')}:${_date.getMinutes().toString().padStart(2, '0')}`;
            }
            if (this.config.aggregateBar === 1440) {
                return `${_date.getDate()}.${_date.getMonth() + 1}`;
            }
            if (this.config.aggregateBar === 43200) {
                const middle = new Date(_date);
                middle.setDate(middle.getDate() + 15);
                return `${middle.getMonth() + 1}.${middle.getFullYear()}`;
            }
        }
        const date = new Date(value);

        if (this.config.xLabelShift) {
            if (this.config.xLabelShiftMonth) {
                date.setMonth(date.getMonth() + (this.config.xLabelShift as number));
            } else if (this.config.xLabelShiftYear) {
                date.setFullYear(date.getFullYear() + (this.config.xLabelShift as number));
            } else {
                date.setSeconds(date.getSeconds() + (this.config.xLabelShift as number));
            }
        }

        if (this.config.timeFormat) {
            return this.moment(date).format(this.config.timeFormat).replace('<br/>', '\n');
        }
        let dateTxt = '';
        const dateInMonth = date.getDate();
        if (this.chart.withSeconds || this.chart.withTime) {
            let showDate = false;
            if (_index < 2 || this.lastFormattedTime === null || value < this.lastFormattedTime) {
                showDate = true;
            } else if (!showDate && new Date(this.lastFormattedTime).getDate() !== dateInMonth) {
                showDate = true;
            }
            if (showDate) {
                if (isTop) {
                    dateTxt = `{a|${dateInMonth.toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.}\n`;
                } else {
                    dateTxt = `{b|..}\n{a|${dateInMonth.toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.}`;
                }
            }

            this.lastFormattedTime = value;

            if (isTop) {
                if (this.chart.withSeconds) {
                    return `${dateTxt + padding2(date.getHours())}:${padding2(date.getMinutes())}:${padding2(date.getSeconds())}${dateTxt ? '{b|..}' : ''}`;
                }
                if (this.chart.withTime) {
                    return `${dateTxt + padding2(date.getHours())}:${padding2(date.getMinutes())}${dateTxt ? '{b|..}' : ''}`;
                }
            }

            if (this.chart.withSeconds) {
                return `${padding2(date.getHours())}:${padding2(date.getMinutes())}:${padding2(date.getSeconds())}${dateTxt}`;
            }
            if (this.chart.withTime) {
                return `${padding2(date.getHours())}:${padding2(date.getMinutes())}${dateTxt}`;
            }
        }

        return `${padding2(dateInMonth)}.${padding2(date.getMonth() + 1)}\n${date.getFullYear()}`;
    }

    // result.val === null => start and end are null
    // result === null => no start or no end
    getInterpolatedValue(
        seriesIndex: number,
        ts: number,
        type: 'number' | 'boolean' | 'string',
        hoverNoNulls?: boolean,
    ): { exact?: boolean; val: number } {
        // it cannot be bar or polar
        const series: (RegisteredSeriesOption['line'] | RegisteredSeriesOption['scatter'])[] | undefined = this.option
            ?.series as (RegisteredSeriesOption['line'] | RegisteredSeriesOption['scatter'])[];

        const data: EchartsOneValue[] = series[seriesIndex].data as EchartsOneValue[];
        if (!data?.[0] || data[0].value[0] > ts || data[data.length - 1].value[0] < ts) {
            return null;
        }

        for (let k = 0; k < data.length - 1; k++) {
            if (data[k].value[0] === ts) {
                // Calculate
                const dp: { exact?: boolean; val: number } = { val: data[k].value[1] };
                if (data[k].exact === false) {
                    dp.exact = false;
                }
                return dp;
            }
            if (data[k].value[0] < ts && ts < data[k + 1].value[0]) {
                const y1 = data[k].value[1];
                const y2 = data[k + 1].value[1];
                if (y2 === null || y2 === undefined || y1 === null || y1 === undefined) {
                    return hoverNoNulls ? null : { exact: false, val: null };
                }
                if (type === 'boolean') {
                    return { exact: false, val: y1 };
                }

                // interpolate
                const diff = data[k + 1].value[0] - data[k].value[0];
                const kk = (data[k + 1].value[0] - ts) / diff;
                return { exact: false, val: (1 - kk) * (y2 - y1) + y1 };
            }
        }

        return hoverNoNulls ? null : { exact: false, val: null };
    }

    renderTooltip(params: CallbackDataParams[]): string {
        const series:
            | (
                  | RegisteredSeriesOption['radar']
                  | RegisteredSeriesOption['line']
                  | RegisteredSeriesOption['scatter']
                  | RegisteredSeriesOption['bar']
              )[]
            | undefined = this.option?.series as (
            | RegisteredSeriesOption['radar']
            | RegisteredSeriesOption['line']
            | RegisteredSeriesOption['scatter']
            | RegisteredSeriesOption['bar']
        )[];

        let ts: number;
        let date: Date;
        // It is line chart and not par or polar
        if (Array.isArray(params[0].value)) {
            ts = params[0].value[0] as number;
            date = new Date(ts);
            if (this.config.xLabelShift) {
                if (this.config.xLabelShiftMonth) {
                    date.setMonth(date.getMonth() + (this.config.xLabelShift as number));
                } else if (this.config.xLabelShiftYear) {
                    date.setFullYear(date.getFullYear() + (this.config.xLabelShift as number));
                } else {
                    date.setSeconds(date.getSeconds() + (this.config.xLabelShift as number));
                }
            }
        }

        const hoverNoNulls =
            this.config.hoverNoNulls === true || (this.config.hoverNoNulls as unknown as string) === 'true';
        const anyBarOrPolar = this.config.l.find(l => l.chartType === 'bar' || l.chartType === 'polar');

        let barPolarName: string;
        const values: string[] = series.map((line, seriesIndex: number): string => {
            const lineConfig = this.config.l[seriesIndex];
            const p = params.find(param => param.seriesIndex === seriesIndex);
            if (anyBarOrPolar) {
                if (!p) {
                    return null;
                }
                let val;
                if (lineConfig.afterComma !== undefined) {
                    const ex = 10 ** lineConfig.afterComma;
                    val = Math.round((p.value as number) * ex) / ex;
                } else {
                    val = p.value;
                }
                barPolarName = p.name;

                return (
                    `<div style="width: 100%; display: inline-flex; justify-content: space-around; color: ${p.color as string}">` +
                    `<div style="display: flex;margin-right: 4px">${lineConfig.name}:</div>` +
                    '<div style="display: flex; flex-grow: 1"></div>' +
                    `<div style="display: flex;"><b>${val as number}</b>${lineConfig.unit || ''}</div>` +
                    '</div>'
                );
            }

            // It is line and not bar or polar
            let interpolated: { exact?: boolean; val: number };
            if (p) {
                // @ts-expect-error fix later
                interpolated = { exact: p.data.exact !== undefined ? p.data.exact : true, val: p.value[1] as number };
            }

            interpolated = interpolated || this.getInterpolatedValue(seriesIndex, ts, lineConfig.type, hoverNoNulls);
            if (!interpolated) {
                return '';
            }
            if (!interpolated.exact && this.config.hoverNoInterpolate) {
                return '';
            }

            const val =
                interpolated.val === null
                    ? 'null'
                    : this.yFormatter(interpolated.val, seriesIndex, false, !interpolated.exact, true);

            return (
                `<div style="width: 100%; display: inline-flex; justify-content: space-around; color: ${line.itemStyle?.color as string}">` +
                `<div style="display: flex;margin-right: 4px">${line.name}:</div>` +
                '<div style="display: flex; flex-grow: 1"></div>' +
                `<div style="display: flex;">${interpolated.exact ? '' : 'i '}<b>${val}</b>${interpolated.val !== null ? lineConfig.unit : ''}</div>` +
                '</div>'
            );
        });

        if (anyBarOrPolar) {
            const format = this.config.timeFormat || 'dd, MM Do YYYY, HH:mm';
            const _date = new Date(parseInt(barPolarName.substring(1), 10));
            return `<b>${this.moment(_date).format(format)}</b><br/>${values.filter(t => t).join('<br/>')}`;
        }
        const format = this.config.timeFormat || 'dd, MM Do YYYY, HH:mm:ss.SSS';
        return `<b>${this.moment(date).format(format)}</b><br/>${values.filter(t => t).join('<br/>')}`;
    }

    getLegend(actualValues: number[]): LegendComponentOption {
        if (!this.config.legend || this.config.legend === 'dialog') {
            return undefined;
        }
        const legend: LegendComponentOption = {
            data: this.config.l.map(oneLine => oneLine.name),
            show: true,
            left: this.config.legend === 'nw' || this.config.legend === 'sw' ? this.chart.padLeft + 1 : undefined,
            right: this.config.legend === 'ne' || this.config.legend === 'se' ? this.chart.padRight + 1 : undefined,
            top: this.config.legend === 'nw' || this.config.legend === 'ne' ? this.chart.padTop + 2 : undefined,
            bottom: this.config.legend === 'sw' || this.config.legend === 'se' ? this.chart.padBottom + 2 : undefined,
            backgroundColor: this.config.legBg || undefined,
            height: this.config.legendHeight || undefined,
            formatter: (name /* , arg */) => {
                if (this.config.legActual && actualValues) {
                    for (let i = 0; i < this.config.l.length; i++) {
                        if (this.config.l[i].name === name) {
                            return `${name} [${this.yFormatter(actualValues[i], i, true, true, true)}]`;
                        }
                    }
                }
                return name;
            },
            textStyle: {
                color: this.config.legColor || (this.themeType === 'light' ? '#000' : '#FFF'),
                fontSize: this.config.legFontSize,
            },
            orient: this.config.legendDirection || 'horizontal',
            selected: {},
        };

        // if (legend.height) {
        //     legend.height = legend.height + 'px';
        // }

        this.config.l.forEach(oneLine => (legend.selected[oneLine.name] = oneLine.hide !== true));

        return legend;
    }

    getTitle(): TitleOption {
        if (!this.config || !this.config.title) {
            return undefined;
        }
        const titlePos: { top?: number; left?: number; bottom?: number; right?: number } = {};
        (this.config.titlePos || 'top:35;left:65').split(';').forEach(a => {
            const parts = a.split(':');
            (titlePos as Record<string, number>)[parts[0].trim()] = parseInt(parts[1].trim(), 10);
        });

        return {
            text: this.config.title,
            textStyle: {
                fontSize: this.config.titleSize ? parseInt(this.config.titleSize as unknown as string, 10) : 20,
                color: this.config.titleColor || (this.themeType === 'light' ? '#000' : '#FFF'),
            },
            textVerticalAlign: titlePos.bottom ? 'bottom' : 'top',
            textAlign: titlePos.left === 50 ? 'center' : titlePos.right === -5 ? 'right' : 'left',
            top: titlePos.top === 35 ? 5 + this.chart.padTop : titlePos.top === 50 ? '50%' : undefined,
            left: titlePos.left === 50 ? '50%' : titlePos.left === 65 ? this.chart.padLeft : undefined,
            bottom: titlePos.bottom
                ? titlePos.bottom > 0
                    ? titlePos.bottom + this.chart.padBottom - 15
                    : titlePos.bottom
                : undefined,
            right: titlePos.right === 5 ? this.chart.padRight : undefined,
        };
    }

    getOption(
        data: BarAndLineSeries[],
        config: ChartConfigMore,
        actualValues: number[],
        categories: number[],
    ): EChartsOption {
        if (config) {
            this.config = JSON.parse(JSON.stringify(config));
        }
        const useCanvas = this.isTouch && this.config.zoom;

        let theme = this.config.theme;
        if (!theme || theme === 'default') {
            theme = this.themeType === 'light' ? 'roma' : 'dark-bold';
        }

        this.debug = this.config?.debug;

        if (this.debug) {
            console.log(`[ChartView ] [${new Date().toISOString()}] ${JSON.stringify(this.config, null, 2)}`);
        }

        const series: (
            | RegisteredSeriesOption['radar']
            | RegisteredSeriesOption['line']
            | RegisteredSeriesOption['scatter']
            | RegisteredSeriesOption['bar']
        )[] = this.getSeries(data, theme);

        if (this.config.start) {
            const end = parseInt(this.config.end as string, 10);
            if (this.chart.xMax < end) {
                this.chart.xMax = end;
            }
            const start = parseInt(this.config.start as string, 10);
            if (this.chart.xMin > start) {
                this.chart.xMin = start;
            }
        }

        this.chart.diff = this.chart.xMax - this.chart.xMin;
        this.chart.withTime = this.chart.diff < 3600000 * 24 * 7;
        this.chart.withSeconds = this.chart.diff < 60000 * 30;
        this.config.y_labels_size = parseInt(this.config.y_labels_size as unknown as string, 10) || 12;
        this.config.x_labels_size = parseInt(this.config.x_labels_size as unknown as string, 10) || 12;
        this.config.legFontSize = parseInt(this.config.legFontSize as unknown as string, 10) || 12;

        const yAxis = this.getYAxis(series);
        const xAxis = this.getXAxis(categories);

        const option: EChartsOption = {
            theme,
            backgroundColor: 'transparent',
            animation: !this.config.noAnimation && !this.config.noLoader,
            grid: {
                backgroundColor: this.config.bg_custom || 'transparent',
                show: !!this.config.bg_custom,
                left: 10,
                top: 8,
                right: this.config.export === true || (this.config.export as unknown as string) === 'true' ? 30 : 0,
                bottom: this.compact ? 4 : this.isXLabelHasBreak() ? 40 : 24,
                containLabel: this.config.autoGridPadding,
            },
            tooltip:
                !this.compact && this.config.hoverDetail
                    ? {
                          trigger: 'axis',
                          formatter: (params: CallbackDataParams[]) => this.renderTooltip(params),
                      }
                    : undefined,
            axisPointer:
                this.compact && this.config.hoverDetail
                    ? {
                          animation: true,
                      }
                    : undefined,
            xAxis,
            yAxis,
            // @ts-expect-error it is because of markArea.tooltip.position
            series,
            useCanvas,
        };

        this.config.l.forEach((item, chartIndex) => {
            if (item.aggregate === 'current') {
                // It could be only bar or polar
                (option.series as (RegisteredSeriesOption['radar'] | RegisteredSeriesOption['bar'])[])[
                    chartIndex
                ].data = [actualValues[chartIndex]];
            }
        });

        // modify series for polar
        if (this.config.l.find(item => item.chartType === 'polar')) {
            option.animation = false;
            option.radar = {
                shape: this.config.radarCircle === 'circle' ? 'circle' : undefined,
                indicator: [],
            };
            const radarSeries: RegisteredSeriesOption['radar'][] = [
                {
                    type: 'radar',
                    data: [{ value: [] }],
                    lineStyle: {
                        // @ts-expect-error fix later
                        color: option.series[0].color as string,
                    },
                    // @ts-expect-error fix later
                    label: option.series[0].label as string,
                },
            ];

            // @ts-expect-error fix later
            option.series.forEach((item, chartIndex) => {
                const max = this.config.l[chartIndex].max
                    ? parseFloat(this.config.l[chartIndex].max as unknown as string) || undefined
                    : undefined;
                // @ts-expect-error fix later
                option.radar.indicator.push({
                    name: item.name + (max !== undefined ? ` (max ${this.yFormatter(max, chartIndex, true)})` : ''),
                    max,
                });
                // find last not null value;
                let value;
                for (let d = item.data.length - 1; d >= 0; d--) {
                    if (item.data[d] !== undefined && item.data[d] !== null) {
                        value = item.data[d];
                        break;
                    }
                }

                if (value !== undefined) {
                    // @ts-expect-error fix later
                    radarSeries[0].data[0].value.push(value);
                } else {
                    // @ts-expect-error fix later
                    radarSeries[0].data[0].value.push(0);
                }
            });
            (option.series as RegisteredSeriesOption['radar'][]) = radarSeries;

            delete option.xAxis;
            delete option.yAxis;
            delete option.grid;
        } else {
            this.getMarkings(option);

            if (!this.compact && !this.config.autoGridPadding) {
                const lineSeries: (
                    | RegisteredSeriesOption['line']
                    | RegisteredSeriesOption['scatter']
                    | RegisteredSeriesOption['bar']
                )[] = series as (
                    | RegisteredSeriesOption['line']
                    | RegisteredSeriesOption['scatter']
                    | RegisteredSeriesOption['bar']
                )[];
                // calculate padding: left and right
                let padLeft = 0;
                let padRight = 0;
                let padBottom = 0;
                let padTop = 0;

                lineSeries.forEach((ser, i) => {
                    let _yAxis = (option.yAxis as YAXisOption[])[ser.yAxisIndex];
                    if (!_yAxis) {
                        // it seems this axis is defined something else
                        const cY = this.config.l[ser.yAxisIndex]
                            ? this.config.l[ser.yAxisIndex].commonYAxis
                            : undefined;
                        if (cY !== undefined) {
                            _yAxis = (option.yAxis as YAXisOption[])[cY];
                        } else if (this.config.l[i].chartType === 'bar') {
                            _yAxis = { min: ser.data[0] as number, max: ser.data[0] as number };
                            for (let s = 1; s < ser.data.length; s++) {
                                if (ser.data[s] === null) {
                                    continue;
                                }
                                if (ser.data[s] < _yAxis.min || _yAxis.min === null) {
                                    _yAxis.min = ser.data[s] as number;
                                }
                                if (ser.data[s] > _yAxis.max || _yAxis.max === null) {
                                    _yAxis.max = ser.data[s] as number;
                                }
                            }
                        } else {
                            console.log(`Cannot find Y axis for line ${i}`);
                            return;
                        }
                    }

                    const minTick = this.yFormatter(_yAxis.min as number, i, true, false, true);
                    const maxTick = this.yFormatter(
                        !_yAxis.min && _yAxis.max === _yAxis.min ? 0.8 : (_yAxis.max as number),
                        i,
                        true,
                        false,
                        true,
                    );

                    if (xAxis[0].position === 'top') {
                        padTop = this.isXLabelHasBreak() ? 40 : 24;
                    } else if (xAxis[0].position === 'bottom') {
                        padBottom = this.isXLabelHasBreak() ? 40 : 24;
                    }

                    const position = _yAxis.position;
                    if (_yAxis.axisLabel && _yAxis.axisLabel.color === 'rgba(0,0,0,0)') {
                        return;
                    }
                    const wMin = this.calcTextWidth(minTick, this.config.y_labels_size) + 4;
                    let wMax = this.calcTextWidth(maxTick, this.config.y_labels_size) + 4;

                    // if we have descriptions for every number, so find the longest one and use it as max width
                    // @ts-expect-error fix later
                    if (ser.states) {
                        // get the longest state
                        let wState = '';
                        // @ts-expect-error fix later
                        Object.keys(ser.states).forEach(state => {
                            // @ts-expect-error fix later
                            if (ser.states[state].length > wState.length) {
                                // @ts-expect-error fix later
                                wState = ser.states[state];
                            }
                        });
                        wMax = this.calcTextWidth(wState, this.config.y_labels_size) + 4;
                    }

                    if (position !== 'right') {
                        if (wMin > padLeft) {
                            padLeft = wMin;
                        }
                        if (wMax > padLeft) {
                            padLeft = wMax;
                        }
                    } else {
                        if (wMin > padRight) {
                            padRight = wMin;
                        }
                        if (wMax > padRight) {
                            padRight = wMax;
                        }
                    }
                });
                (option.grid as GridOption).left = padLeft + 10;
                (option.grid as GridOption).right =
                    padRight +
                    10 +
                    (this.config.export === true || (this.config.export as unknown as string) === 'true' ? 20 : 0);
                // if xAxis shown, let the place for last value
                if (((option.grid as GridOption).right as number) <= 10 && (padTop || padBottom)) {
                    (option.grid as GridOption).right = 18;
                }
                if (((option.grid as GridOption).left as number) <= 10 && (padTop || padBottom)) {
                    (option.grid as GridOption).left = 18;
                }
                this.chart.padLeft = (option.grid as GridOption).left as number;
                this.chart.padRight = (option.grid as GridOption).right as number;
                if (!padTop) {
                    padTop = 8;
                }
                if (!padBottom) {
                    padBottom = 8;
                }
                (option.grid as GridOption).top = padTop;
                (option.grid as GridOption).bottom = padBottom;
                this.chart.padTop = (option.grid as GridOption).top as number;
                this.chart.padBottom = (option.grid as GridOption).bottom as number;
            }
        }

        // 'nw': 'Top, left',
        // 'ne': 'Top, right',
        // 'sw': 'Bottom, left',
        // 'se': 'Bottom, right',
        option.legend = this.getLegend(actualValues);
        option.title = this.getTitle();

        if (!this.config.grid_color && Array.isArray(option.yAxis)) {
            option.yAxis.forEach(axis => axis.splitLine && delete axis.splitLine.lineStyle);
            (option.xAxis as XAXisOption[]).forEach(axis => axis.splitLine && delete axis.splitLine.lineStyle);
        }

        this.option = option;
        return this.option;
    }
}

export default ChartOption;
