import React from 'react';
import PropTypes from 'prop-types';

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
}  from 'react-icons/fa';

import moment from 'moment';
import 'moment/locale/en-gb';
import 'moment/locale/es';
import 'moment/locale/fr';
import 'moment/locale/pl';
import 'moment/locale/pt';
import 'moment/locale/it';
import 'moment/locale/nl';
import 'moment/locale/ru';
import 'moment/locale/zh-cn';
import 'moment/locale/de';
import 'moment/locale/uk';

import { I18n, Utils, withWidth } from '@iobroker/adapter-react-v5';

import ReactEchartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, ScatterChart } from 'echarts/charts';
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

    SVGRenderer,

    CanvasRenderer,
]);

const styles = {
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
        paddingTop: 6,
    },
};

let canvasCalcTextWidth = null;
function calcTextWidth(text, fontSize, fontFamily) {
    // canvas for better performance
    const canvas = canvasCalcTextWidth || (canvasCalcTextWidth = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    context.font = `${fontSize || 12}px ${fontFamily || 'Microsoft YaHei'}`;
    const metrics = context.measureText(text);
    return Math.ceil(metrics.width);
}

if (!String.prototype.padStart) {
    // Copyright (c) 2019 Behnam Mohammadi MIT https://github.com/behnammodi/polyfill/blob/master/string.polyfill.js#L273
    // eslint-disable-next-line
    String.prototype.padStart = function padStart(targetLength, padString) {
        // eslint-disable-next-line no-bitwise
        targetLength >>= 0; // floor if number or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length > targetLength) {
            return String(this);
        }
        targetLength -= this.length;
        if (targetLength > padString.length) {
            padString += padString.repeat(targetLength / padString.length); // append to original to ensure we are longer than needed
        }
        return padString.slice(0, targetLength) + String(this);
    };
}

class ChartView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            chartHeight: null,
            chartWidth: null,
            excluded: [],
            timeFormat: window.localStorage.getItem('Chart.timeFormat') || 'locale',
        };

        this.echartsReact = React.createRef();
        // this.rangeRef     = React.createRef();

        this.divRef = React.createRef();
        this.divResetButton = React.createRef();

        this.selected = null;

        moment.locale(I18n.getLanguage());

        this.lastIds = (this.props.config && this.props.config.l && this.props.config.l.map(item => item.id)) || [];
        this.lastIds.sort();

        this.chartOption = new ChartOption(moment, this.props.themeType, calcTextWidth, undefined, this.props.compact);
    }

    componentDidMount() {
        window.addEventListener('resize', this.onResize);
    }

    componentWillUnmount() {
        this.resetZoomAndTiltTimer && clearTimeout(this.resetZoomAndTiltTimer);
        this.resetZoomAndTiltTimer = null;

        this.timerResize && clearTimeout(this.timerResize);
        this.timerResize = null;

        this.updatePropertiesTimeout && clearTimeout(this.updatePropertiesTimeout);
        this.updatePropertiesTimeout = null;

        window.removeEventListener('resize', this.onResize);
    }

    updateProperties = props => {
        this.updatePropertiesTimeout = null;
        if (this.echartsReact && typeof this.echartsReact.getEchartsInstance === 'function') {
            const chartInstance = this.echartsReact.getEchartsInstance();
            const lastIds = (props.config && props.config.l && props.config.l.map(item => item.id)) || [];
            lastIds.sort();
            const changed = JSON.stringify(lastIds) !== JSON.stringify(this.lastIds);
            // If the list of IDs changed => clear all settings
            if (changed)  {
                this.lastIds = lastIds;
                chartInstance.clear();
            }

            this.option = this.chartOption.getOption(props.data, props.config, props.actualValues, props.categories);
            this.applySelected();
            this.debug && console.log(`[ChartView ] [${new Date().toISOString()}] updateProperties: {min: ${this.option.xAxis[0].min}, ${this.option.xAxis[0].max}}`);
            try {
                chartInstance.setOption(this.option, changed);
            } catch (e) {
                console.error(`Cannot apply options: ${JSON.stringify(this.option)}`);
            }
        }
    };

    UNSAFE_componentWillReceiveProps(props) {
        if (props.data !== this.state.data) {
            this.updatePropertiesTimeout && clearTimeout(this.updatePropertiesTimeout);
            this.updatePropertiesTimeout = setTimeout(this.updateProperties, 100, props);
        }
    }

    onResize = () => {
        this.timerResize && clearTimeout(this.timerResize);

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

    setNewRange(updateChart) {
        const chart = this.chartOption.getHelperChartData();
        chart.diff        = chart.xMax - chart.xMin;
        chart.withTime    = chart.diff < 3600000 * 24 * 7;
        chart.withSeconds = chart.diff < 60000 * 30;

        console.log(`[ChartView ] [${new Date().toISOString()}] setNewRange: ${!!updateChart}, {min: ${new Date(chart.xMin)}, max: ${new Date(chart.xMax)}}`);

        if (updateChart) {
            this.updateDataTimer && clearTimeout(this.updateDataTimer);
            this.updateDataTimer = null;
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
            this.option.xAxis[0].min = chart.xMin;
            this.option.xAxis[0].max = chart.xMax;

            try {
                this.echartsReact && typeof this.echartsReact.getEchartsInstance === 'function' &&
                this.echartsReact.getEchartsInstance().setOption({
                    xAxis: {
                        min: chart.xMin,
                        max: chart.xMax,
                    },
                });
            } catch (e) {
                console.error(`Cannot apply options 1: ${JSON.stringify(this.option)}`);
            }
        }
    }

    setNewYAxis(yAxis) {
        // console.log(`[ChartView ] [${new Date().toISOString()}] setOption in setNewRange`);
        this.option.yAxis = yAxis;

        try {
            this.echartsReact && typeof this.echartsReact.getEchartsInstance === 'function' &&
                this.echartsReact.getEchartsInstance().setOption({ yAxis });
        } catch (e) {
            console.error(`Cannot apply options 2: ${JSON.stringify(this.option)}`);
        }
    }

    onMouseMove = e => {
        if (this.mouseDown) {
            if (this.divResetButton.current && this.divResetButton.current.style.display !== 'block') {
                this.divResetButton.current.style.display = 'block';
            }

            const chart = this.chartOption.getHelperChartData();

            if (e.event.shiftKey) {
                chart.yMoved = true;
                const moved = chart.lastY - (e.offsetY - chart.padTop);
                chart.lastY = e.offsetY - chart.padTop;
                const height = this.state.chartHeight - chart.padTop - chart.padBottom;

                let shift;
                let diff;
                chart._yAxis.forEach(axis => {
                    diff = axis.max - axis.min;
                    shift = (moved * diff) / height;
                    axis.min -= shift;
                    axis.max -= shift;
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

    onMouseDown = e => {
        this.mouseDown = true;
        const chart = this.chartOption.getHelperChartData();
        chart.lastX = e.offsetX;
        chart.lastY = e.offsetY;
        chart.yMoved = false;
        chart.xMoved = false;
        chart._yAxis = JSON.parse(JSON.stringify(chart.yAxis));

        if (this.zr && !this.zr._mousemove) {
            this.zr._mousemove = true;
            this.zr.on('mousemove', this.onMouseMove);
        }

        const config = this.props.config;
        if (config.live && this.props.onRangeChange) {
            console.log('Stop update');
            this.props.onRangeChange({ stopLive: true });
        }
    };

    onMouseUp = () => {
        this.mouseDown = false;
        const chart = this.chartOption.getHelperChartData();
        if (chart.xMoved) {
            this.setNewRange(true);
        }

        if (this.zr && this.zr._mousemove) {
            this.zr._mousemove = false;
            this.zr.off('mousemove', this.onMouseMove);
        }
    };

    onMouseWheel = e => {
        const chart = this.chartOption.getHelperChartData();
        if (e.event.shiftKey) {
            const height = this.state.chartHeight - chart.padBottom - chart.padTop;
            const y = e.offsetY - chart.padTop;
            const pos = y / height;
            const amount = e.wheelDelta > 0 ? 1.1 : 0.9;
            const yAxis = JSON.parse(JSON.stringify(chart.yAxis));

            chart.yAxis.forEach(axis => {
                let diff = axis.max - axis.min;
                const oldDiff = diff;
                diff *= amount;
                const move = oldDiff - diff;

                axis.max += move * (1 - pos);
                axis.min -= move * pos;
            });

            this.setNewYAxis(yAxis);
        } else {
            let diff = chart.xMax - chart.xMin;
            const width = this.state.chartWidth - chart.padRight - chart.padLeft;
            const x = e.offsetX - chart.padLeft;
            const pos = x / width;

            const oldDiff = diff;
            const amount = e.wheelDelta > 0 ? 1.1 : 0.9;
            diff *= amount;
            const move = oldDiff - diff;
            chart.xMax += move * (1 - pos);
            chart.xMin -= move * pos;

            this.setNewRange();
            this.updateDataTimer && clearTimeout(this.updateDataTimer);
            this.updateDataTimer = setTimeout(() => this.setNewRange(true), 1000);
        }
    };

    onTouchStart = e => {
        this.mouseDown = true;
        const touches = e.touches || e.originalEvent.touches;
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

    onTouchEnd = e => {
        if (this.mouseDown) {
            e.stopImmediatePropagation();
            e.preventDefault();
            this.mouseDown = false;
            this.setNewRange(true);
        }
    };

    onTouchMove = e => {
        const touches = e.touches || e.originalEvent.touches;
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

                    const amount     = fingerWidth > chart.lastWidth ? 1.05 : 0.95;
                    const positionX  = touches[0].pageX > touches[1].pageX ?
                        touches[1].pageX - chart.padLeft + fingerWidth / 2 :
                        touches[0].pageX - chart.padLeft + fingerWidth / 2;

                    const pos = positionX / chartWidth;

                    const oldDiff = diff;
                    diff *= amount;
                    const move = oldDiff - diff;

                    console.log(`Move: ${Math.round(move / 1000)} => ${Math.round((move * pos) / 1000)} -- ${Math.round((move * (1 - pos)) / 1000)}`);

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
                const diff  = chart.xMax - chart.xMin;
                const chartWidth = this.state.chartWidth - chart.padRight - chart.padLeft;

                const shift = Math.round((moved * diff) / chartWidth);
                chart.xMin += shift;
                chart.xMax += shift;

                this.setNewRange();
            }
        }
        chart.lastX = pageX;
    };

    installEventHandlers() {
        this.zr = this.echartsReact && this.echartsReact.getEchartsInstance && this.echartsReact.getEchartsInstance().getZr();
        const items = this.divRef.current && this.divRef.current.getElementsByClassName('echarts-for-react');
        const div = items && items[0];

        if (this.zr && this.props.config.zoom && !this.zr._iobInstalled) {
            this.zr._iobInstalled = true;

            if (!this.option || !this.option.useCanvas) {
                this.zr.on('mousedown', this.onMouseDown);
                this.zr.on('mouseup', this.onMouseUp);
                this.zr.on('mousewheel', this.onMouseWheel);
            } else if (div) {
                div.addEventListener('touchstart', this.onTouchStart, false);
                div.addEventListener('touchend', this.onTouchEnd, false);
                div.addEventListener('touchmove', this.onTouchMove, false);
            }
        } else if (this.zr && !this.props.config.zoom && this.zr._iobInstalled) {
            this.zr._iobInstalled = false;

            if (!!this.option || !this.option.useCanvas) {
                this.zr.off('mousedown', this.onMouseDown);
                this.zr.off('mouseup', this.onMouseUp);
                this.zr.off('mousewheel', this.onMouseWheel);
                if (this.zr && this.zr._mousemove) {
                    this.zr._mousemove = false;
                    this.zr.off('mousemove', this.onMouseMove);
                }
            } else if (div) {
                div.removeEventListener('touchstart', this.onTouchStart, false);
                div.removeEventListener('touchend', this.onTouchEnd, false);
                div.removeEventListener('touchmove', this.onTouchMove, false);
            }
        }
    }

    applySelected() {
        if (this.props.config.legend === 'dialog') {
            // remove unselected series
            this.option.legend = {
                data:   this.props.config.l.map(oneLine => oneLine.name),
                show:   false,
                selected: {},
            };
            this.props.config.l.forEach(oneLine =>
                this.option.legend.selected[oneLine.name] = !this.state.excluded.includes(oneLine.id));
        } else if (this.selected && this.option.legend) {
            // merge selected
            Object.keys(this.selected)
                .forEach(name => this.option.legend.selected[name] = this.selected[name]);
        }
    }

    renderChart() {
        if (this.props.data) {
            this.option = this.option || this.chartOption.getOption(this.props.data, this.props.config, this.props.actualValues, this.props.categories);
            const hasAnyBarOrPolar = !!this.props.config.l.find(item => item.chartType === 'bar' || item.chartType === 'polar');

            if (this.props.config.title) {
                window.document.title = this.props.config.title;
            } else if (this.props.config.presetId) {
                window.document.title = this.props.config.presetId;
            }

            // console.log(JSON.stringify(this.option, null, 2));

            this.debug && console.log(`[ChartView ] [${new Date().toISOString()}] render chart`);

            this.applySelected();

            return <ReactEchartsCore
                ref={e => this.echartsReact = e}
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
                    legendselectchanged: e => {
                        this.selected = JSON.parse(JSON.stringify(e.selected));
                    },
                    rendered: () =>
                        !this.props.compact && this.props.config.zoom && !hasAnyBarOrPolar && this.installEventHandlers(),
                }}
            />;
        }
        return <LinearProgress />;
    }

    componentDidUpdate() {
        if (this.divRef.current) {
            const borderWidth   = this.props.config.noBorder !== 'noborder' ? parseFloat(this.props.config.border_width) || 0 : 0;
            const borderPadding = parseFloat(this.props.config.border_padding) || 0;
            const chartHeight = this.divRef.current.offsetHeight - (borderWidth + borderPadding) * 2;
            if (this.state.chartHeight !== chartHeight) {
                const chartWidth  = this.divRef.current.offsetWidth - (borderWidth + borderPadding) * 2;
                setTimeout(() => this.setState({ chartHeight, chartWidth }), 10);
            }
        }
    }

    renderResetButton() {
        return <Fab
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
            <IconReset state={styles.resetButtonIcon} />
        </Fab>;
    }

    renderSaveImageButton() {
        if (this.props.config.export) {
            return <IconSaveImage
                color={this.props.config.exportColor || 'default'}
                state={styles.saveImageButton}
                title={this.option && this.option.useCanvas ? I18n.t('Save chart as png') : I18n.t('Save chart as svg')}
                onClick={() => {
                    if (this.echartsReact && typeof this.echartsReact.getEchartsInstance === 'function') {
                        const chartInstance = this.echartsReact.getEchartsInstance();
                        let base64 = chartInstance.getDataURL({
                            pixelRatio: 2, // only for png
                            backgroundColor: this.props.config.window_bg || (this.props.themeType === 'dark' ? '#000' : '#FFF'),
                        });

                        // Add background to SVG
                        if (!this.option || !this.option.useCanvas) {
                            try {
                                const data = base64.split(',');
                                // decode base64
                                let xml = decodeURIComponent(data[1]);
                                xml = xml.replace('fill="none"', `fill="${this.props.config.window_bg || (this.props.themeType === 'dark' ? '#000' : '#FFF')}"`);
                                xml = xml.replace('fill="transparent"', `fill="${this.props.config.window_bg || (this.props.themeType === 'dark' ? '#000' : '#FFF')}"`);
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
                        if (option &&
                            option.series &&
                            option.series[0] &&
                            option.series[0].data &&
                            option.series[0].data.length
                        ) {
                            const date = new Date(option.xAxis[0].max || option.series[0].data[option.series[0].data.length - 1].value[0]);
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
            />;
        }
        return null;
    }

    exportData() {
        const chart = this.chartOption.getHelperChartData();
        this.setState({ exporting: true }, () =>
            this.props.exportData(chart.xMin, chart.xMax, this.state.excluded)
                .then(data => {
                    const downloadLink = document.createElement('a');
                    document.body.appendChild(downloadLink);

                    const header = ['time'];
                    const table = [];
                    Object.keys(data).forEach((id, i) => {
                        header.push(id);
                        data[id].forEach(value => {
                            const line = [value.ts];
                            line[i + 1] = value.val;
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
                    const lines = [];
                    const timeFormat = this.state.timeFormat;
                    table.forEach(line => {
                        if (timeFormat === 'iso') {
                            const time = new Date(line[0]);
                            line[0] = time.toISOString();
                        } else if (timeFormat === 'locale') {
                            const time = new Date(line[0]);
                            line[0] = `${time.toLocaleDateString()} ${time.toLocaleTimeString()}.${time.getMilliseconds().toString().padStart(3, '0')}`;
                        }
                        lines.push(line.join(';'));
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
                }));
    }

    renderExportDataButton() {
        if (this.props.config.exportData) {
            return <IconExportData
                style={this.state.exporting ? { opacity: 0.5 } : {}}
                color={this.props.config.exportDataColor || 'default'}
                state={styles.exportDataButton}
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
            />;
        }
        return null;
    }

    renderLegendDialog() {
        if (this.props.config.legend !== 'dialog') {
            return null;
        }
        return <>
            <Fab
                size="small"
                color="default"
                style={{ left: this.option?.grid?.left || 0 }}
                state={styles.legendButton}
                title={I18n.t('Select lines')}
                onClick={() => this.setState({ showLegendDialog: true })}
            >
                <IconMenu state={styles.resetButtonIcon} />
            </Fab>
            {this.state.showLegendDialog ?
                <Dialog
                    open={!0}
                    onClose={() => this.setState({ showLegendDialog: false })}
                >
                    <DialogTitle>{I18n.t('Select lines to show')}</DialogTitle>
                    <DialogContent>
                        <FormControlLabel
                            control={<Checkbox
                                checked={!this.state.excluded.length}
                                indeterminate={this.state.excluded.length && this.state.excluded.length !== this.props.config.l.length}
                                onChange={() => {
                                    if (!this.state.excluded.length) {
                                        this.setState({ excluded: this.props.config.l.map(line => line.id) });
                                    } else {
                                        this.setState({ excluded: [] });
                                    }
                                }}
                            />}
                            label={this.state.excluded.length !== this.props.config.l.length ? I18n.t('Select all') : I18n.t('Unselect all')}
                        />
                        {this.props.config.l.map((line, i) => <MenuItem
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
                                <div style={{ opacity: 0.7, fontStyle: 'italic', fontSize: 'smaller' }}>{line?.name ? line?.id : null}</div>
                            </div>
                        </MenuItem>)}
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
                </Dialog> : null}
        </>;
    }

    renderExportDataDialog() {
        if (this.state.showExportDataDialog) {
            return <Dialog
                open={!0}
                onClose={() => this.setState({ showExportDataDialog: false })}
            >
                <DialogTitle>{I18n.t('Select lines for export')}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth variant="standard">
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
                        control={<Checkbox
                            checked={!this.state.excluded.length}
                            indeterminate={this.state.excluded.length && this.state.excluded.length !== this.props.config.l.length}
                            onChange={() => {
                                if (!this.state.excluded.length) {
                                    this.setState({ excluded: this.props.config.l.map(line => line.id) });
                                } else {
                                    this.setState({ excluded: [] });
                                }
                            }}
                        />}
                        label={this.state.excluded.length !== this.props.config.l.length ? I18n.t('Select all') : I18n.t('Unselect all')}
                    />
                    {this.props.config.l.map((line, i) => <MenuItem
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
                            <div style={{ opacity: 0.7, fontStyle: 'italic', fontSize: 'smaller' }}>{line?.name ? line?.id : null}</div>
                        </div>
                    </MenuItem>)}
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
            </Dialog>;
        }

        return null;
    }

    renderDevCopyButton() {
        if (window.location.port === '3000') {
            return <IconCopy
                color="default"
                state={styles.copyButton}
                title="Copy option to clipboard"
                onClick={() => Utils.copyToClipboard(JSON.stringify(this.option, null, 2))}
            />;
        }

        return null;
    }

    render() {
        if (!this.divRef.current) {
            setTimeout(() => this.forceUpdate(), 10);
        }

        const borderWidth   = this.props.config.noBorder !== 'noborder' ? parseFloat(this.props.config.border_width) || 0 : 0;
        const borderPadding = parseFloat(this.props.config.border_padding) || 0;

        return <div
            ref={this.divRef}
            state={styles.chart}
            style={{
                borderWidth,
                width:       borderWidth || borderPadding ? `calc(100% - ${(borderWidth + borderPadding) * 2 + 1}px)` : undefined,
                height:      borderWidth || borderPadding ? `calc(100% - ${(borderWidth + borderPadding) * 2}px)` : undefined,
                background:  this.props.config.noBackground ? undefined : (this.props.config.window_bg || undefined),
                borderColor: this.props.config.noBorder !== 'noborder' ? this.props.config.border_color || undefined : undefined,
                borderStyle: this.props.config.noBorder !== 'noborder' && borderWidth ? this.props.config.border_style || 'solid' : 'hidden',
                padding:     borderPadding || 0,
            }}
        >
            {this.renderSaveImageButton()}
            {this.renderExportDataDialog()}
            {this.renderExportDataButton()}
            {this.renderResetButton()}
            {this.renderDevCopyButton()}
            {this.state.chartHeight !== null ? this.renderChart() : null}
            {this.option ? this.renderLegendDialog() : null}
        </div>;
    }
}

ChartView.propTypes = {
    config: PropTypes.object,
    themeType: PropTypes.string,
    data: PropTypes.array,
    actualValues: PropTypes.array,
    onRangeChange: PropTypes.func,
    compact: PropTypes.bool,
    categories: PropTypes.array, // for bar and pie charts
    exportData: PropTypes.func,
};

export default withWidth()(ChartView);
