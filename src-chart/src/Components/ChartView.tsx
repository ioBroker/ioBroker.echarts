import React from 'react';
import type { EChartsOption, LegendComponentOption, zrender } from 'echarts/types/dist/echarts';
import type EChartsReactCore from 'echarts-for-react';

import {
    LinearProgress,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    Fab,
    FormControlLabel,
} from '@mui/material';

import {
    FaRedoAlt as IconReset,
    FaDownload as IconSaveImage,
    FaFileExport as IconExportData,
    FaCopy as IconCopy,
    FaBars as IconMenu,
    FaCheck as IconCheck,
} from 'react-icons/fa';

import moment from 'moment';
import 'moment/dist/locale/en-gb';
import 'moment/dist/locale/es';
import 'moment/dist/locale/fr';
import 'moment/dist/locale/pl';
import 'moment/dist/locale/pt';
import 'moment/dist/locale/it';
import 'moment/dist/locale/nl';
import 'moment/dist/locale/ru';
import 'moment/dist/locale/zh-cn';
import 'moment/dist/locale/de';
import 'moment/dist/locale/uk';

import { I18n, Utils, withWidth, type ThemeType } from '@iobroker/adapter-react-v5';
import type { BarAndLineSeries, SeriesData } from './ChartModel';

import ReactEchartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, ScatterChart, BarChart, RadarChart } from 'echarts/charts';
import {
    GridComponent,
    ToolboxComponent,
    TitleComponent,
    LegendComponent,
    DataZoomComponent,
    TimelineComponent,
    MarkLineComponent,
    MarkAreaComponent,
    TooltipComponent,
} from 'echarts/components';

import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';

import ChartOption from './ChartOption';

// Themes
import 'echarts/theme/azul';
import 'echarts/theme/bee-inspired';
import 'echarts/theme/blue';
import 'echarts/theme/infographic';
import 'echarts/theme/vintage';
import 'echarts/theme/dark';
import 'echarts/theme/macarons';
import 'echarts/theme/shine';
import 'echarts/theme/roma';
import 'echarts/theme/royal';
import 'echarts/theme/dark-blue';
import 'echarts/theme/tech-blue';
import 'echarts/theme/red';
import 'echarts/theme/red-velvet';
import 'echarts/theme/green';
import 'echarts/theme/gray';
import 'echarts/theme/dark-bold';
import type { GridOption, RegisteredSeriesOption, XAXisOption, YAXisOption } from 'echarts/types/dist/shared';
import type { EChartsInstance } from 'echarts-for-react/src/types';

import type { ChartConfigMore, ChartLineConfigMore } from '../../../src/types';

echarts.use([
    GridComponent,
    ToolboxComponent,
    TitleComponent,
    LegendComponent,
    DataZoomComponent,
    TimelineComponent,
    MarkLineComponent,
    MarkAreaComponent,
    TooltipComponent,
    // Axis2D,
    // CartesianGrid,
    GridComponent,

    LineChart,
    ScatterChart,
    BarChart,
    RadarChart,

    SVGRenderer,

    CanvasRenderer,
]);

function LineSvg(props: { style?: React.CSSProperties }): React.JSX.Element {
    return (
        <svg
            width="24"
            height="24"
            style={props.style}
        >
            <path
                fill="currentColor"
                d="m12.17582,5.73626c-3.39092,0 -6.13187,2.79989 -6.13187,6.26374s2.74095,6.26374 6.13187,6.26374s6.13187,-2.79989 6.13187,-6.26374s-2.74095,-6.26374 -6.13187,-6.26374"
            />
            <rect
                fill="currentColor"
                height="1.93407"
                width="21.97802"
                y="11.16483"
                x="1.05494"
            />
        </svg>
    );
}

const styles: Record<string, React.CSSProperties> = {
    chart: {
        maxHeight: '100%',
        maxWidth: '100%',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
    },
    saveImageButton: {
        position: 'absolute',
        top: 40,
        right: 5,
        width: 20,
        height: 20,
        zIndex: 2,
        opacity: 0.7,
        cursor: 'pointer',
        // background: '#00000000',
    },
    exportDataButton: {
        position: 'absolute',
        top: 70,
        right: 5,
        width: 20,
        height: 20,
        zIndex: 2,
        opacity: 0.7,
        cursor: 'pointer',
        // background: '#00000000',
    },
    copyButton: {
        position: 'absolute',
        top: 100,
        right: 5,
        width: 20,
        height: 20,
        zIndex: 2,
        opacity: 0.7,
        cursor: 'pointer',
        // background: '#00000000',
    },
    resetButton: {
        position: 'absolute',
        top: 10,
        right: 25,
        zIndex: 2,
        opacity: 0.7,
        // background: '#00000000',
    },
    legendButton: {
        position: 'absolute',
        top: 10,
        left: 30,
        zIndex: 2,
        opacity: 0.7,
    },
    resetButtonIcon: {
        paddingTop: 8,
    },
};

let canvasCalcTextWidth: HTMLCanvasElement | null = null;

function calcTextWidth(text: string, fontSize: number, fontFamily?: string): number {
    // canvas for better performance
    const canvas = canvasCalcTextWidth || (canvasCalcTextWidth = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    context.font = `${fontSize || 12}px ${fontFamily || 'Microsoft YaHei'}`;
    const metrics = context.measureText(text);
    return Math.ceil(metrics.width);
}

interface ChartViewProps {
    themeType: ThemeType;
    compact?: boolean;
    config: ChartConfigMore;

    data: BarAndLineSeries[];
    actualValues: number[];
    onRangeChange: (settings?: { stopLive?: boolean; start?: number; end?: number }) => void;
    categories: number[]; // for bar and pie charts
    exportData: (from: number, to: number, excludes?: string[]) => Promise<{ [objectId: string]: SeriesData[] }>;
}

interface ChartViewState {
    chartHeight: number | null;
    chartWidth: number | null;
    excluded: string[];
    timeFormat: string;
    data: BarAndLineSeries[] | null;
    exporting: boolean;
    showExportDataDialog: boolean;
    showLegendDialog: boolean;
}

class ChartView extends React.Component<ChartViewProps, ChartViewState> {
    private readonly divRef: React.RefObject<HTMLDivElement>;
    private echartsReact: EChartsReactCore | null = null;
    private readonly divResetButton: React.RefObject<HTMLButtonElement>;
    private selected: { [name: string]: boolean } | null = null;
    private lastIds: string[];
    private chartOption: ChartOption;
    private resetZoomAndTiltTimer: ReturnType<typeof setTimeout> | null = null;
    private timerResize: ReturnType<typeof setTimeout> | null = null;
    private updatePropertiesTimeout: ReturnType<typeof setTimeout> | null = null;
    private updateDataTimer: ReturnType<typeof setTimeout> | null = null;
    private debug = false;
    // If actually mouse pressed down
    private mouseDown = false;
    private option: EChartsOption | null = null;
    private zr: zrender.ZRenderType | null = null;
    private zrMousemove = false;
    private zrIobInstalled = false;

    constructor(props: ChartViewProps) {
        super(props);

        this.state = {
            chartHeight: null,
            chartWidth: null,
            excluded: [],
            timeFormat: window.localStorage.getItem('Chart.timeFormat') || 'locale',
            data: null,
            exporting: false,
            showExportDataDialog: false,
            showLegendDialog: false,
        };

        this.divRef = React.createRef();
        this.divResetButton = React.createRef();

        moment.locale(I18n.getLanguage());

        this.lastIds = this.props.config?.l?.map((item: ChartLineConfigMore): string => item.id) || [];
        this.lastIds.sort();

        this.chartOption = new ChartOption(moment, this.props.themeType, calcTextWidth, undefined, this.props.compact);
    }

    componentDidMount(): void {
        window.addEventListener('resize', this.onResize);
    }

    componentWillUnmount(): void {
        if (this.resetZoomAndTiltTimer) {
            clearTimeout(this.resetZoomAndTiltTimer);
            this.resetZoomAndTiltTimer = null;
        }

        if (this.timerResize) {
            clearTimeout(this.timerResize);
            this.timerResize = null;
        }

        if (this.updatePropertiesTimeout) {
            clearTimeout(this.updatePropertiesTimeout);
            this.updatePropertiesTimeout = null;
        }

        if (this.updateDataTimer) {
            clearTimeout(this.updateDataTimer);
            this.updateDataTimer = null;
        }

        window.removeEventListener('resize', this.onResize);
    }

    updateProperties = (props: ChartViewProps): void => {
        this.updatePropertiesTimeout = null;
        if (this.echartsReact && typeof this.echartsReact.getEchartsInstance === 'function') {
            const chartInstance = this.echartsReact.getEchartsInstance();
            const lastIds: string[] = props.config?.l?.map((item: ChartLineConfigMore): string => item.id) || [];
            lastIds.sort();
            const changed = JSON.stringify(lastIds) !== JSON.stringify(this.lastIds);
            // If the list of IDs changed => clear all settings
            if (changed) {
                this.lastIds = lastIds;
                chartInstance.clear();
            }

            this.option = this.chartOption.getOption(props.data, props.config, props.actualValues, props.categories);
            this.applySelected();
            if (this.debug) {
                console.log(
                    `[ChartView ] [${new Date().toISOString()}] updateProperties: {min: ${(this.option.xAxis as XAXisOption[])[0].min as number}, ${(this.option.xAxis as XAXisOption[])[0].max as number}}`,
                );
            }
            try {
                chartInstance.setOption(this.option, changed);
            } catch {
                console.error(`Cannot apply options: ${JSON.stringify(this.option)}`);
            }
        }
    };

    UNSAFE_componentWillReceiveProps(props: ChartViewProps): void {
        if (props.data !== this.state.data) {
            this.updatePropertiesTimeout && clearTimeout(this.updatePropertiesTimeout);
            this.updatePropertiesTimeout = setTimeout(this.updateProperties, 100, props);
        }
    }

    onResize = (): void => {
        if (this.timerResize) {
            clearTimeout(this.timerResize);
        }

        this.timerResize = setTimeout(() => {
            this.timerResize = null;
            this.componentDidUpdate();
        });
    };

    /* onChange = (id, state) => {
        if (id === this.props.obj._id &&
            state &&
            this.rangeValues &&
            (!this.rangeValues.length || this.rangeValues[this.rangeValues.length - 1].ts < state.ts)) {

            this.chartValues && this.chartValues.push({val: state.val, ts: state.ts});
            this.rangeValues.push({val: state.val, ts: state.ts});

            // update only if end is near to now
            if (state.ts >= this.chart.min && state.ts <= this.chart.xMax + 300000) {
                this.updateChart();
            }
        }
    }; */

    /* updateChart(start, end, withReadData, cb) {
        if (start) {
            this.start = start;
        }
        if (end) {
            this.end = end;
        }
        start = start || this.start;
        end   = end   || this.end;

        this.readTimeout && clearTimeout(this.readTimeout);

        this.readTimeout = setTimeout(() => {
            this.readTimeout = null;

            const diff = this.chart.xMax - this.chart.xMin;
            if (diff !== this.chart.diff) {
                this.chart.diff        = diff;
                this.chart.withTime    = this.chart.diff < 3600000 * 24 * 7;
                this.chart.withSeconds = this.chart.diff < 60000 * 30;
            }

            if (withReadData) {
                this.readHistory(start, end)
                    .then(values => {
                        typeof this.echartsReact.getEchartsInstance === 'function' && this.echartsReact.getEchartsInstance().setOption({
                            series: [{data: this.convertData(values)}],
                            xAxis: {
                                min: this.chart.xMin,
                                max: this.chart.xMax,
                            }
                        }, true);
                        cb && cb();
                    });
            } else {
                typeof this.echartsReact.getEchartsInstance === 'function' && this.echartsReact.getEchartsInstance().setOption({
                    series: [{data: this.convertData()}],
                    xAxis: {
                        min: this.chart.xMin,
                        max: this.chart.xMax,
                    }
                }, true);
                cb && cb();
            }
        }, 400);
    } */

    setNewRange(updateChart?: boolean): void {
        const chart = this.chartOption.getHelperChartData();
        chart.diff = chart.xMax - chart.xMin;
        chart.withTime = chart.diff < 3600000 * 24 * 7;
        chart.withSeconds = chart.diff < 60000 * 30;

        console.log(
            `[ChartView ] [${new Date().toISOString()}] setNewRange: ${!!updateChart}, {min: ${new Date(chart.xMin).toString()}, max: ${new Date(chart.xMax).toString()}}`,
        );

        if (updateChart) {
            if (this.updateDataTimer) {
                clearTimeout(this.updateDataTimer);
                this.updateDataTimer = null;
            }
            this.props.onRangeChange && this.props.onRangeChange({ start: chart.xMin, end: chart.xMax });

            if (this.props.config.resetZoom) {
                this.resetZoomAndTiltTimer && clearTimeout(this.resetZoomAndTiltTimer);
                this.resetZoomAndTiltTimer = setTimeout(() => {
                    this.resetZoomAndTiltTimer = null;
                    if (this.divResetButton.current) {
                        this.divResetButton.current.style.display = 'none';
                    }
                    this.props.onRangeChange && this.props.onRangeChange();
                }, 1000 * this.props.config.resetZoom);
            }
        } else {
            console.log(`[ChartView ] [${new Date().toISOString()}] setOption in setNewRange`);
            (this.option.xAxis as XAXisOption[])[0].min = chart.xMin;
            (this.option.xAxis as XAXisOption[])[0].max = chart.xMax;

            try {
                typeof this.echartsReact?.getEchartsInstance === 'function' &&
                    this.echartsReact.getEchartsInstance().setOption({
                        xAxis: {
                            min: chart.xMin,
                            max: chart.xMax,
                        },
                    });
            } catch {
                console.error(`Cannot apply options 1: ${JSON.stringify(this.option)}`);
            }
        }
    }

    setNewYAxis(yAxis: YAXisOption[]): void {
        // console.log(`[ChartView ] [${new Date().toISOString()}] setOption in setNewRange`);
        this.option.yAxis = yAxis;

        try {
            typeof this.echartsReact?.getEchartsInstance === 'function' &&
                this.echartsReact.getEchartsInstance().setOption({ yAxis });
        } catch {
            console.error(`Cannot apply options 2: ${JSON.stringify(this.option)}`);
        }
    }

    onMouseMove = (e: MouseEvent): void => {
        if (this.mouseDown) {
            if (this.divResetButton.current && this.divResetButton.current.style.display !== 'block') {
                this.divResetButton.current.style.display = 'block';
            }

            const chart = this.chartOption.getHelperChartData();

            if (e.shiftKey) {
                chart.yMoved = true;
                const moved = chart.lastY - (e.offsetY - chart.padTop);
                chart.lastY = e.offsetY - chart.padTop;
                const height = this.state.chartHeight - chart.padTop - chart.padBottom;

                let shift;
                let diff;
                chart._yAxis.forEach(axis => {
                    diff = (axis.max as number) - (axis.min as number);
                    shift = (moved * diff) / height;
                    (axis.min as number) -= shift;
                    (axis.max as number) -= shift;
                });

                this.setNewYAxis(chart._yAxis);
            } else {
                chart.xMoved = true;
                const moved = chart.lastX - (e.offsetX - chart.padLeft);
                chart.lastX = e.offsetX - chart.padLeft;
                const diff = chart.xMax - chart.xMin;
                const width = this.state.chartWidth - chart.padRight - chart.padLeft;

                const shift = Math.round((moved * diff) / width);
                chart.xMin += shift;
                chart.xMax += shift;
                this.setNewRange();
            }
        }
    };

    onMouseDown = (e: MouseEvent): void => {
        this.mouseDown = true;
        const chart = this.chartOption.getHelperChartData();
        chart.lastX = e.offsetX;
        chart.lastY = e.offsetY;
        chart.yMoved = false;
        chart.xMoved = false;
        chart._yAxis = JSON.parse(JSON.stringify(chart.yAxis));

        if (this.zr && !this.zrMousemove) {
            this.zrMousemove = true;
            this.zr.on('mousemove', this.onMouseMove);
        }

        const config = this.props.config;
        if (config.live && this.props.onRangeChange) {
            console.log('Stop update');
            this.props.onRangeChange({ stopLive: true });
        }
    };

    onMouseUp = (): void => {
        this.mouseDown = false;
        const chart = this.chartOption.getHelperChartData();
        if (chart.xMoved) {
            this.setNewRange(true);
        }

        if (this.zr && this.zrMousemove) {
            this.zrMousemove = false;
            this.zr.off('mousemove', this.onMouseMove);
        }
    };

    onMouseWheel = (e: WheelEvent | { event: WheelEvent }): void => {
        const chart = this.chartOption.getHelperChartData();
        const wheelEvent: WheelEvent = e.deltaY === undefined && e.deltaX === undefined ? e.event : e;

        if (wheelEvent.shiftKey) {
            const height = this.state.chartHeight - chart.padBottom - chart.padTop;
            const y = wheelEvent.offsetY - chart.padTop;
            const pos = y / height;
            const amount = wheelEvent.deltaY > 0 || wheelEvent.deltaX > 0 ? 1.1 : 0.9;
            const yAxis = JSON.parse(JSON.stringify(chart.yAxis));

            chart.yAxis.forEach(axis => {
                let diff = (axis.max as number) - (axis.min as number);
                const oldDiff = diff;
                diff *= amount;
                const move = oldDiff - diff;

                (axis.max as number) += move * (1 - pos);
                (axis.min as number) -= move * pos;
            });

            this.setNewYAxis(yAxis);
        } else {
            let diff = chart.xMax - chart.xMin;
            const width = this.state.chartWidth - chart.padRight - chart.padLeft;
            const x = wheelEvent.offsetX - chart.padLeft;
            const pos = x / width;

            const oldDiff = diff;

            const amount = wheelEvent.deltaY > 0 || wheelEvent.deltaX > 0 ? 1.1 : 0.9;
            diff *= amount;
            const move = oldDiff - diff;
            chart.xMax += move * (1 - pos);
            chart.xMin -= move * pos;

            this.setNewRange();
            if (this.updateDataTimer) {
                clearTimeout(this.updateDataTimer);
            }
            this.updateDataTimer = setTimeout(() => this.setNewRange(true), 1000);
        }
    };

    onTouchStart = (e: TouchEvent): void => {
        this.mouseDown = true;

        const touches: TouchList =
            e.touches ||
            // @ts-expect-error fix later
            e.originalEvent.touches;

        if (touches) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const chart = this.chartOption.getHelperChartData();
            chart.lastX = touches[touches.length - 1].pageX;

            if (touches.length > 1) {
                chart.lastWidth = Math.round(Math.abs(touches[0].pageX - touches[1].pageX));
            } else {
                chart.lastWidth = null;
            }
        }
    };

    onTouchEnd = (e: TouchEvent): void => {
        if (this.mouseDown) {
            e.stopImmediatePropagation();
            e.preventDefault();
            this.mouseDown = false;
            this.setNewRange(true);
        }
    };

    onTouchMove = (e: TouchEvent): void => {
        const touches: TouchList =
            e.touches ||
            // @ts-expect-error fix later
            e.originalEvent.touches;

        if (!touches) {
            return;
        }
        const chart = this.chartOption.getHelperChartData();
        const pageX = touches[touches.length - 1].pageX - chart.padLeft;
        if (this.mouseDown) {
            e.preventDefault();
            e.stopImmediatePropagation();

            if (this.divResetButton.current && this.divResetButton.current.style.display !== 'block') {
                this.divResetButton.current.style.display = 'block';
            }

            if (touches.length > 1) {
                console.log(`touch move: ${touches.length}`);
                // zoom
                const fingerWidth = Math.round(Math.abs(touches[0].pageX - touches[1].pageX));
                if (chart.lastWidth !== null && fingerWidth !== chart.lastWidth) {
                    let diff = chart.xMax - chart.xMin;
                    const chartWidth = this.state.chartWidth - chart.padRight - chart.padLeft;

                    const amount = fingerWidth > chart.lastWidth ? 1.05 : 0.95;
                    const positionX =
                        touches[0].pageX > touches[1].pageX
                            ? touches[1].pageX - chart.padLeft + fingerWidth / 2
                            : touches[0].pageX - chart.padLeft + fingerWidth / 2;

                    const pos = positionX / chartWidth;

                    const oldDiff = diff;
                    diff *= amount;
                    const move = oldDiff - diff;

                    console.log(
                        `Move: ${Math.round(move / 1000)} => ${Math.round((move * pos) / 1000)} -- ${Math.round((move * (1 - pos)) / 1000)}`,
                    );

                    chart.xMax += move * (1 - pos);
                    chart.xMin -= move * pos;

                    chart.xMax = Math.round(chart.xMax);
                    chart.xMin = Math.round(chart.xMin);

                    this.setNewRange();
                }
                chart.lastWidth = fingerWidth;
            } else {
                // swipe
                const moved = chart.lastX - pageX;
                const diff = chart.xMax - chart.xMin;
                const chartWidth = this.state.chartWidth - chart.padRight - chart.padLeft;

                const shift = Math.round((moved * diff) / chartWidth);
                chart.xMin += shift;
                chart.xMax += shift;

                this.setNewRange();
            }
        }
        chart.lastX = pageX;
    };

    installEventHandlers(instance?: EChartsInstance): void {
        const hasAnyBarOrPolar = !!this.props.config.l.find(
            item => item.chartType === 'bar' || item.chartType === 'polar',
        );

        if (this.props.compact || !this.props.config.zoom || hasAnyBarOrPolar) {
            return;
        }
        const eChartInstance =
            instance || (this.echartsReact?.getEchartsInstance ? this.echartsReact.getEchartsInstance() : null);
        this.zr = eChartInstance?.getZr();
        const items = this.divRef.current?.getElementsByClassName('echarts-for-react');
        const div = items?.[0];

        if (this.zr && this.props.config.zoom /* && !this.zrIobInstalled*/) {
            this.zrIobInstalled = true;

            if (!this.option?.useCanvas) {
                this.zr.off('mousedown', this.onMouseDown);
                this.zr.off('mouseup', this.onMouseUp);
                this.zr.off('mousewheel', this.onMouseWheel);

                this.zr.on('mousedown', this.onMouseDown);
                this.zr.on('mouseup', this.onMouseUp);
                this.zr.on('mousewheel', this.onMouseWheel);
            } else if (div) {
                div.addEventListener('touchstart', this.onTouchStart, false);
                div.addEventListener('touchend', this.onTouchEnd, false);
                div.addEventListener('touchmove', this.onTouchMove, false);
            }
        } else if (this.zr && !this.props.config.zoom && this.zrIobInstalled) {
            this.zrIobInstalled = false;

            if (!!this.option || !this.option.useCanvas) {
                this.zr.off('mousedown', this.onMouseDown);
                this.zr.off('mouseup', this.onMouseUp);
                this.zr.off('mousewheel', this.onMouseWheel);
                if (this.zr && this.zrMousemove) {
                    this.zrMousemove = false;
                    this.zr.off('mousemove', this.onMouseMove);
                }
            } else if (div) {
                div.removeEventListener('touchstart', this.onTouchStart, false);
                div.removeEventListener('touchend', this.onTouchEnd, false);
                div.removeEventListener('touchmove', this.onTouchMove, false);
            }
        }
    }

    applySelected(): void {
        if (this.props.config.legend === 'dialog') {
            // remove unselected series
            this.option.legend = {
                data: this.props.config.l.map(oneLine => oneLine.name),
                show: false,
                selected: {},
            };
            this.props.config.l.forEach(
                oneLine =>
                    ((this.option.legend as LegendComponentOption).selected[oneLine.name] =
                        !this.state.excluded.includes(oneLine.id)),
            );
        } else if (this.selected && this.option.legend) {
            // merge selected
            Object.keys(this.selected).forEach(
                name => ((this.option.legend as LegendComponentOption).selected[name] = this.selected[name]),
            );
        }
    }

    renderChart(): React.JSX.Element {
        if (this.props.data) {
            this.option =
                this.option ||
                this.chartOption.getOption(
                    this.props.data,
                    this.props.config,
                    this.props.actualValues,
                    this.props.categories,
                );

            if (this.props.config.title) {
                window.document.title = this.props.config.title;
            } else if (this.props.config.presetId) {
                window.document.title = this.props.config.presetId;
            }

            if (this.debug) {
                console.log(`[ChartView ] [${new Date().toISOString()}] render chart`);
            }

            this.applySelected();

            return (
                <ReactEchartsCore
                    key="chart"
                    ref={(e: EChartsReactCore): void => {
                        this.echartsReact = e;
                    }}
                    onChartReady={(instance: EChartsInstance): void => {
                        this.installEventHandlers(instance);
                    }}
                    echarts={echarts}
                    option={this.option}
                    notMerge
                    lazyUpdate
                    theme={this.option.theme}
                    style={{ height: `${this.state.chartHeight}px`, width: '100%' }}
                    opts={this.option && this.option.useCanvas ? undefined : { renderer: 'svg' }}
                    onEvents={{
                        /* datazoom: e => {
                        const {startValue, endValue} = e.batch[0];
                        this.updateChart(startValue, endValue, true);
                    }, */
                        // triggered while changing the legend selected
                        legendselectchanged: (params: {
                            /** change legend name */
                            name: string;
                            // table of all legends selecting states
                            selected: { [name: string]: boolean };
                        }) => {
                            this.selected = JSON.parse(JSON.stringify(params.selected));
                        },
                        //rendered: () => this.installEventHandlers(),
                    }}
                />
            );
        }
        console.log('No chart 111!!!');

        return <LinearProgress />;
    }

    componentDidUpdate(): void {
        if (this.divRef.current) {
            const borderWidth =
                this.props.config.noBorder !== 'noborder'
                    ? parseFloat(this.props.config.border_width as unknown as string) || 0
                    : 0;
            const borderPadding = parseFloat(this.props.config.border_padding as unknown as string) || 0;
            const chartHeight = this.divRef.current.offsetHeight - (borderWidth + borderPadding) * 2;
            if (this.state.chartHeight !== chartHeight) {
                const chartWidth = this.divRef.current.offsetWidth - (borderWidth + borderPadding) * 2;
                setTimeout(() => this.setState({ chartHeight, chartWidth }), 10);
            }
        }
    }

    renderResetButton(): React.JSX.Element {
        return (
            <Fab
                ref={this.divResetButton}
                size="small"
                color="default"
                style={{ ...styles.resetButton, display: 'none' }}
                title={I18n.t('Reset pan and zoom')}
                onClick={() => {
                    if (this.divResetButton.current) {
                        this.divResetButton.current.style.display = 'none';
                    }
                    this.props.onRangeChange && this.props.onRangeChange();
                }}
            >
                <IconReset style={styles.resetButtonIcon} />
            </Fab>
        );
    }

    renderSaveImageButton(): React.JSX.Element | null {
        if (this.props.config.export) {
            return (
                <IconSaveImage
                    color={this.props.config.exportColor || 'default'}
                    style={styles.saveImageButton}
                    title={
                        this.option && this.option.useCanvas ? I18n.t('Save chart as png') : I18n.t('Save chart as svg')
                    }
                    onClick={() => {
                        if (this.echartsReact && typeof this.echartsReact.getEchartsInstance === 'function') {
                            const chartInstance = this.echartsReact.getEchartsInstance();
                            let base64 = chartInstance.getDataURL({
                                pixelRatio: 2, // only for png
                                backgroundColor:
                                    this.props.config.window_bg || (this.props.themeType === 'dark' ? '#000' : '#FFF'),
                            });

                            // Add background to SVG
                            if (!this.option || !this.option.useCanvas) {
                                try {
                                    const data = base64.split(',');
                                    // decode base64
                                    let xml = decodeURIComponent(data[1]);
                                    xml = xml.replace(
                                        'fill="none"',
                                        `fill="${this.props.config.window_bg || (this.props.themeType === 'dark' ? '#000' : '#FFF')}"`,
                                    );
                                    xml = xml.replace(
                                        'fill="transparent"',
                                        `fill="${this.props.config.window_bg || (this.props.themeType === 'dark' ? '#000' : '#FFF')}"`,
                                    );
                                    base64 = `${data[0]},${encodeURIComponent(xml)}`;
                                } catch (e) {
                                    console.warn(`cannot attach background: ${e}`);
                                }
                            }

                            const downloadLink = document.createElement('a');
                            document.body.appendChild(downloadLink);

                            downloadLink.href = base64;
                            downloadLink.target = '_self';
                            let name;
                            if (this.props.config.l.length === 1) {
                                name = this.props.config.l[0].name;
                            } else {
                                name = 'chart';
                            }
                            const option = this.option;
                            const series:
                                | (
                                      | RegisteredSeriesOption['radar']
                                      | RegisteredSeriesOption['line']
                                      | RegisteredSeriesOption['scatter']
                                      | RegisteredSeriesOption['bar']
                                  )[]
                                | undefined = option?.series as (
                                | RegisteredSeriesOption['radar']
                                | RegisteredSeriesOption['line']
                                | RegisteredSeriesOption['scatter']
                                | RegisteredSeriesOption['bar']
                            )[];

                            if (series?.[0]?.data?.length) {
                                const date = new Date(
                                    (option.xAxis as XAXisOption[])[0].max ||
                                        // @ts-expect-error fix later
                                        series[0].data[series[0].data.length - 1].value[0],
                                );
                                try {
                                    downloadLink.download =
                                        `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}` +
                                        `_${date.getHours().toString().padStart(2, '0')}_${date.getMinutes().toString().padStart(2, '0')}_${name}.${this.option && this.option.useCanvas ? 'png' : 'svg'}`;
                                    downloadLink.click();
                                } catch (e) {
                                    console.error(`Cannot access download: ${e}`);
                                    window.alert(I18n.t('Unfortunately your browser does not support this feature'));
                                }
                            } else {
                                window.alert(I18n.t('No data found'));
                            }
                        }
                    }}
                />
            );
        }
        return null;
    }

    exportData(): void {
        const chart = this.chartOption.getHelperChartData();
        this.setState({ exporting: true }, () =>
            this.props.exportData(chart.xMin, chart.xMax, this.state.excluded).then(data => {
                const downloadLink = document.createElement('a');
                document.body.appendChild(downloadLink);

                const header = ['time'];
                const table: number[][] = [];
                Object.keys(data).forEach((id, i) => {
                    header.push(id);
                    data[id].forEach(value => {
                        // The first element is always timestamp
                        const line: number[] = [value.ts];
                        line[i + 1] = value.val as number;
                        table.push(line);
                    });
                });
                table.sort((a, b) => a[0] - b[0]);

                // try to combine same time
                for (let i = 0; i < table.length - 1; i++) {
                    if (table[i][0] === table[i + 1][0]) {
                        for (let j = 1; j < table[i].length; j++) {
                            if (table[i + 1][j] !== undefined) {
                                table[i][j] = table[i + 1][j];
                            }
                        }
                        table.splice(i + 1, 1);
                        i--;
                    }
                }
                const lines: string[] = [];
                const timeFormat = this.state.timeFormat;
                table.forEach(line => {
                    let date: string;
                    if (timeFormat === 'iso') {
                        const time = new Date(line.shift());
                        date = time.toISOString();
                    } else if (timeFormat === 'locale') {
                        const time = new Date(line.shift());
                        date = `${time.toLocaleDateString()} ${time.toLocaleTimeString()}.${time.getMilliseconds().toString().padStart(3, '0')}`;
                    } else {
                        date = line.shift().toString();
                    }
                    lines.push(`${date};${line.join(';')}`);
                });

                downloadLink.href = `data:text/plain;charset=utf-8,${header.join(';')}\n${lines.join('\n')}`;
                downloadLink.target = '_self';
                let name;
                if (this.props.config.l.length === 1) {
                    name = this.props.config.l[0].name;
                } else {
                    name = 'chart';
                }
                const date = new Date(chart.xMin);
                try {
                    downloadLink.download =
                        `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}` +
                        `_${date.getHours().toString().padStart(2, '0')}_${date.getMinutes().toString().padStart(2, '0')}_${name}.csv`;
                    downloadLink.click();
                } catch (e) {
                    console.error(`Cannot access download: ${e}`);
                    window.alert(I18n.t('Unfortunately your browser does not support this feature'));
                }
                this.setState({ exporting: false });
            }),
        );
    }

    renderExportDataButton(): React.JSX.Element | null {
        if (this.props.config.exportData) {
            return (
                <IconExportData
                    color={this.props.config.exportDataColor || 'default'}
                    style={{ ...styles.exportDataButton, opacity: this.state.exporting ? 0.5 : 1 }}
                    title={I18n.t('Export raw data as CSV')}
                    onClick={() => {
                        if (this.state.exporting) {
                            return;
                        }
                        if (this.props.config.l.length === 1) {
                            this.exportData();
                        } else {
                            this.setState({ showExportDataDialog: true });
                        }
                    }}
                />
            );
        }
        return null;
    }

    renderLegendDialog(): React.JSX.Element | null {
        if (this.props.config.legend !== 'dialog') {
            return null;
        }
        const colors: string[] = [];
        if (
            this.state.showLegendDialog &&
            this.echartsReact &&
            typeof this.echartsReact.getEchartsInstance === 'function'
        ) {
            const chartInstance = this.echartsReact.getEchartsInstance();
            chartInstance
                // @ts-expect-error we need this data
                .getModel()
                .getSeries()
                .forEach((s: any): void => {
                    colors[s.seriesIndex as number] = chartInstance.getVisual(
                        { seriesIndex: s.seriesIndex },
                        'color',
                    ) as string;
                });

            console.log(colors);
        }

        return (
            <>
                <Fab
                    size="small"
                    color="default"
                    style={{ ...styles.legendButton, left: (this.option?.grid as GridOption)?.left || 0 }}
                    title={I18n.t('Select lines')}
                    onClick={() => this.setState({ showLegendDialog: true })}
                >
                    <IconMenu />
                </Fab>
                {this.state.showLegendDialog ? (
                    <Dialog
                        open={!0}
                        onClose={() => this.setState({ showLegendDialog: false })}
                    >
                        <DialogTitle>{I18n.t('Select lines to show')}</DialogTitle>
                        <DialogContent>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!this.state.excluded.length}
                                        indeterminate={
                                            this.state.excluded.length &&
                                            this.state.excluded.length !== this.props.config.l.length
                                        }
                                        onChange={() => {
                                            if (!this.state.excluded.length) {
                                                this.setState({ excluded: this.props.config.l.map(line => line.id) });
                                            } else {
                                                this.setState({ excluded: [] });
                                            }
                                        }}
                                    />
                                }
                                label={
                                    this.state.excluded.length !== this.props.config.l.length
                                        ? I18n.t('Select all')
                                        : I18n.t('Unselect all')
                                }
                            />
                            {this.props.config.l.map((line, i) => (
                                <MenuItem
                                    key={i}
                                    onClick={() => {
                                        const excluded = [...this.state.excluded];
                                        const pos = excluded.indexOf(line.id);
                                        if (pos === -1) {
                                            excluded.push(line.id);
                                        } else {
                                            excluded.splice(pos, 1);
                                        }
                                        this.setState({ excluded });
                                    }}
                                >
                                    <Checkbox checked={!this.state.excluded.includes(line?.id)} />
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <LineSvg style={{ color: line?.color || colors[i], marginRight: 8 }} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            {line?.name || line?.id}
                                            {line?.name && line?.id ? (
                                                <div style={{ opacity: 0.7, fontStyle: 'italic', fontSize: 'smaller' }}>
                                                    {line?.id}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </MenuItem>
                            ))}
                        </DialogContent>
                        <DialogActions>
                            <Button
                                variant="contained"
                                color="grey"
                                onClick={() => this.setState({ showLegendDialog: false })}
                                startIcon={<span style={{ fontSize: 14 }}>X</span>}
                            >
                                {I18n.t('Close')}
                            </Button>
                        </DialogActions>
                    </Dialog>
                ) : null}
            </>
        );
    }

    renderExportDataDialog(): React.JSX.Element | null {
        if (this.state.showExportDataDialog) {
            return (
                <Dialog
                    open={!0}
                    onClose={() => this.setState({ showExportDataDialog: false })}
                >
                    <DialogTitle>{I18n.t('Select lines for export')}</DialogTitle>
                    <DialogContent>
                        <FormControl
                            fullWidth
                            variant="standard"
                        >
                            <InputLabel>{I18n.t('Time format')}</InputLabel>
                            <Select
                                value={this.state.timeFormat}
                                onChange={e => {
                                    window.localStorage.setItem('Chart.timeFormat', e.target.value);
                                    this.setState({ timeFormat: e.target.value });
                                }}
                            >
                                <MenuItem value="iso">ISO</MenuItem>
                                <MenuItem value="locale">{I18n.t('Browser format')}</MenuItem>
                                <MenuItem value="ts">{I18n.t('Time stamp in milliseconds')}</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!this.state.excluded.length}
                                    indeterminate={
                                        this.state.excluded.length &&
                                        this.state.excluded.length !== this.props.config.l.length
                                    }
                                    onChange={() => {
                                        if (!this.state.excluded.length) {
                                            this.setState({ excluded: this.props.config.l.map(line => line.id) });
                                        } else {
                                            this.setState({ excluded: [] });
                                        }
                                    }}
                                />
                            }
                            label={
                                this.state.excluded.length !== this.props.config.l.length
                                    ? I18n.t('Select all')
                                    : I18n.t('Unselect all')
                            }
                        />
                        {this.props.config.l.map((line, i) => (
                            <MenuItem
                                key={i}
                                onClick={() => {
                                    const excluded = [...this.state.excluded];
                                    const pos = excluded.indexOf(line.id);
                                    if (pos === -1) {
                                        excluded.push(line.id);
                                    } else {
                                        excluded.splice(pos, 1);
                                    }
                                    this.setState({ excluded });
                                }}
                            >
                                <Checkbox checked={!this.state.excluded.includes(line?.id)} />
                                <div>
                                    <div>{line?.name || line?.id}</div>
                                    <div style={{ opacity: 0.7, fontStyle: 'italic', fontSize: 'smaller' }}>
                                        {line?.name ? line?.id : null}
                                    </div>
                                </div>
                            </MenuItem>
                        ))}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={this.state.excluded.length === this.props.config.l.length}
                            startIcon={<IconCheck />}
                            onClick={() => {
                                this.setState({ showExportDataDialog: false });
                                this.exportData();
                            }}
                        >
                            {I18n.t('Export')}
                        </Button>
                        <Button
                            variant="contained"
                            color="grey"
                            onClick={() => this.setState({ showExportDataDialog: false })}
                            startIcon={<span style={{ fontSize: 14 }}>X</span>}
                        >
                            {I18n.t('Cancel')}
                        </Button>
                    </DialogActions>
                </Dialog>
            );
        }

        return null;
    }

    renderDevCopyButton(): React.JSX.Element | null {
        if (window.location.port === '3000') {
            return (
                <IconCopy
                    color="default"
                    style={styles.copyButton}
                    title="Copy option to clipboard"
                    onClick={() => Utils.copyToClipboard(JSON.stringify(this.option, null, 2))}
                />
            );
        }

        return null;
    }

    render(): React.JSX.Element {
        if (!this.divRef.current) {
            setTimeout(() => this.forceUpdate(), 10);
        }

        const borderWidth =
            this.props.config.noBorder !== 'noborder'
                ? parseFloat(this.props.config.border_width as unknown as string) || 0
                : 0;
        const borderPadding = parseFloat(this.props.config.border_padding as unknown as string) || 0;

        const chart = this.state.chartHeight !== null ? this.renderChart() : null;

        if (!chart) {
            this.zrIobInstalled = false;
        }

        return (
            <div
                ref={this.divRef}
                style={{
                    ...styles.chart,
                    borderWidth,
                    width:
                        borderWidth || borderPadding
                            ? `calc(100% - ${(borderWidth + borderPadding) * 2 + 1}px)`
                            : '100%',
                    height:
                        borderWidth || borderPadding ? `calc(100% - ${(borderWidth + borderPadding) * 2}px)` : '100%',
                    background: this.props.config.noBackground ? undefined : this.props.config.window_bg || undefined,
                    borderColor:
                        this.props.config.noBorder !== 'noborder'
                            ? this.props.config.border_color || undefined
                            : undefined,
                    borderStyle:
                        this.props.config.noBorder !== 'noborder' && borderWidth
                            ? this.props.config.border_style || 'solid'
                            : 'hidden',
                    padding: borderPadding || 0,
                }}
            >
                {chart}
                {this.renderSaveImageButton()}
                {this.renderExportDataDialog()}
                {this.renderExportDataButton()}
                {this.renderResetButton()}
                {this.renderDevCopyButton()}
                {this.option ? this.renderLegendDialog() : null}
            </div>
        );
    }
}

export default withWidth()(ChartView);
