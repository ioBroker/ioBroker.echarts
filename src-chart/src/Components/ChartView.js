import React from 'react';
import PropTypes from 'prop-types';
import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';

import LinearProgress from '@material-ui/core/LinearProgress';
import Fab from '@material-ui/core/Fab';

import {FaRedoAlt as IconReset}  from 'react-icons/fa'

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

import I18n from '@iobroker/adapter-react/i18n';

import ReactEchartsCore from 'echarts-for-react/lib/core';
import echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/line';
import 'echarts/lib/chart/scatter';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/grid';

import 'echarts/lib/component/toolbox';
import 'echarts/lib/component/title';
import 'echarts/lib/component/legend';

import 'echarts/lib/component/dataZoom';
import 'echarts/lib/component/timeline';
import 'zrender/lib/svg/svg';

function padding2(num) {
    return num.toString().padStart(2, '0');
}

const styles = theme => ({
    chart: {
        maxHeight: '100%',
        maxWidth: '100%',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
    },
    resetButton: {
        position: 'absolute',
        top: 10,
        right: 25,
        zIndex: 2,
        opacity: 0.7
        //background: '#00000000',
    },
    resetButtonIcon: {
        paddingTop: 6,
    },
});

const GRID_PADDING_LEFT = 100;
const GRID_PADDING_RIGHT = 30;

class ChartView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            chartHeight: 300,
            chartWidth: 500,
        };

        this.echartsReact = React.createRef();
        // this.rangeRef     = React.createRef();

        this.divRef = React.createRef();
        this.divResetButton = React.createRef();

        this.chart = {};
        moment.locale(I18n.getLanguage());
    }

    componentDidMount() {
        window.addEventListener('resize', this.onResize)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onResize);
    }

    updateProperties = props => {
        this.updatePropertiesTimeout = null;
        if (typeof this.echartsReact.getEchartsInstance === 'function') {
            this.debug && console.log(`[ChartView ] [${new Date().toISOString()}] updateProperties`);
            const chartInstance = this.echartsReact.getEchartsInstance();
            chartInstance.clear();  // may be it is not required
            chartInstance.setOption(this.getOption(props));
        }
    };

    UNSAFE_componentWillReceiveProps(props) {
        if (props.data !== this.state.data) {
            this.updatePropertiesTimeout && clearTimeout(this.updatePropertiesTimeout);
            this.updatePropertiesTimeout = setTimeout(this.updateProperties, 100, props);
        } else {
            return null;
        }
    }

    onResize = () => {
        this.timerResize && clearTimeout(this.timerResize);

        this.timerResize = setTimeout(() => {
            this.timerResize = null;
            this.componentDidUpdate();
        });
    };

    /*onChange = (id, state) => {
        if (id === this.props.obj._id &&
            state &&
            this.rangeValues &&
            (!this.rangeValues.length || this.rangeValues[this.rangeValues.length - 1].ts < state.ts)) {

            this.chartValues && this.chartValues.push({val: state.val, ts: state.ts});
            this.rangeValues.push({val: state.val, ts: state.ts});

            // update only if end is near to now
            if (state.ts >= this.chart.min && state.ts <= this.chart.max + 300000) {
                this.updateChart();
            }
        }
    };*/

    convertData(props, i) {
        props = props || this.props;
        const values = props.data[i];
        if (!values || !values.length) {
            return [];
        }

        if (this.chart.min === null || this.chart.min > values[0].value[0]) {
            this.chart.min = values[0].value[0];

        }
        if (this.chart.max === null || this.chart.max < values[values.length - 1].value[0]) {
            this.chart.max = values[values.length - 1].value[0];
        }

        return values;
    }

    getSeries(props) {
        props = props || this.props;
        this.chart.min = null;
        this.chart.max = null;

        return props.config.l.map((oneLine, i) => {
            const cfg = {
                name: oneLine.name,
                xAxisIndex: 0,
                type: oneLine.chartType === 'scatterplot' ? 'scatter' : 'line',
                showSymbol: oneLine.chartType === 'scatterplot' || oneLine.points,
                hoverAnimation: true,
                animation: false,
                step: oneLine.chartType === 'steps' ? 'start' : undefined,
                smooth: oneLine.chartType === 'spline',
                data: this.convertData(props, i),
                itemStyle: {
                    color: oneLine.color
                },
                symbolSize: oneLine.chartType === 'scatterplot' || oneLine.points ? oneLine.symbolSize || 3 : undefined,
                symbol: 'circle',
                lineStyle: {
                    width:          oneLine.thickness || 1,
                    shadowBlur:     oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                    shadowOffsetY:  oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                    shadowColor:    oneLine.color,
                    type:           oneLine.dashes ? 'dashed' : (oneLine.lineStyle || 'solid'),
                }
            };
            if (oneLine.fill) {
                cfg.areaStyle = {
                    color: oneLine.color,
                    opacity: parseFloat(oneLine.fill),
                };
            }

            return cfg;
        });
    }

    yFormatter(val, line, props) {
        props = props || this.props;
        if (props.config.l[line].type === 'boolean') {
            return val ? 'TRUE' : 'FALSE';
        }

        const afterComma = props.config.l[line].afterComma;
        if (afterComma !== undefined && afterComma !== null) {
            val = parseFloat(val);
            if (props.config.useComma) {
                return val.toFixed(afterComma).replace('.', ',');
            } else {
                return val.toFixed(afterComma);
            }
        } else {
            if (props.config.useComma) {
                val = parseFloat(val);
                return val.toString().replace('.', ',');
            } else {
                return val;
            }
        }
    }

    renderTooltip(props, params) {
        const date = new Date(params[0].value[0]);

        const values = params.map(param => {
            let val = param.value[1] === null ?
                'null' :
                this.yFormatter(param.value[1], param.seriesIndex, props);

            return `<div style="width: 100%; display: inline-flex; justify-content: space-around; color: ${props.config.l[param.seriesIndex].color}">` +
                `<div style="display: flex;">${props.config.l[param.seriesIndex].name}:</div>` +
                `<div style="display: flex; flex-grow: 1"></div>` +
                `<div style="display: flex;"><b>${val}</b>${param.value[1] !== null ? props.config.l[param.seriesIndex].unit : ''}</div>` +
                `</div>`
        });

        const format = props.config.timeFormat || 'dddd, MMMM Do YYYY, h:mm:ss.SSS';
        return `<b>${moment(date).format(format)}</b><br/>${values.join('<br/>')}`;
    }

    getOption(props) {
        props = props || this.props;
        this.debug = props.config && props.config.debug;

        this.debug && console.log(`[ChartView ] [${new Date().toISOString()}] ${JSON.stringify(props.config, null, 2)}`);

        let titlePos = {};
        if (props.config.titlePos) {
            props.config.titlePos.split(';').forEach(a => {
                const parts = a.split(':');
                titlePos[parts[0].trim()] = parseInt(parts[1].trim(), 10);
            });
        }

        const xAxisHeight = 20;

        // 'nw': 'Top, left',
        // 'ne': 'Top, right',
        // 'sw': 'Bottom, left',
        // 'se': 'Bottom, right',
        const legend = !props.config.legend || props.config.legend === 'none' ? undefined : {
            data:   props.config.l.map(oneLine => oneLine.name),
            show:   true,
            left:   props.config.legend === 'nw' || props.config.legend === 'sw' ?  GRID_PADDING_LEFT + 1 : undefined,
            right:  props.config.legend === 'ne' || props.config.legend === 'se' ?  GRID_PADDING_RIGHT + 1 : undefined,
            top:    props.config.legend === 'nw' || props.config.legend === 'ne' ?  10 : undefined,
            bottom: props.config.legend === 'sw' || props.config.legend === 'se' ?  xAxisHeight + 20 : undefined,
            backgroundColor: props.config.legBg || undefined
        };

        const series = this.getSeries(props);

        if (props.config.start) {
            if (this.chart.max < props.config.end) {
                this.chart.max = props.config.end;
            }
            if (this.chart.min > props.config.start) {
                this.chart.min = props.config.start;
            }
        }

        this.chart.diff        = this.chart.max - this.chart.min;
        this.chart.withTime    = this.chart.diff < 3600000 * 24 * 7;
        this.chart.withSeconds = this.chart.diff < 60000 * 30;

        const options = {
            backgroundColor: 'transparent',
            animation: !props.config.noAnimation && !props.config.noLoader,
            title: {
                text: props.config.title || '',
                textStyle: {
                    fontSize: props.config.titleSize ? parseInt(props.config.titleSize, 10) : undefined,
                    color: props.config.titleColor || undefined
                },
                padding: [
                    8,  // up
                    0,  // right
                    0,  // down
                    90, // left
                ],
                textVerticalAlign: titlePos.bottom      ? 'bottom' : 'top',
                textAlign:         titlePos.left === 50 ? 'center' : (titlePos.right === -5 ? 'right' : 'left'),
                top:               titlePos.top  === 35 ? 5 : (titlePos.top === 50 ? '50%' : undefined),
                left:              titlePos.left === 50 ? '50%' : (titlePos.left === 65 ? 15 : undefined),
                bottom:            titlePos.bottom      ? (titlePos.bottom > 0 ? titlePos.bottom + xAxisHeight - 5 : titlePos.bottom) : undefined,
                right:             titlePos.right === 5 ? 35 : undefined,
            },
            legend,
            grid: {
                backgroundColor: props.config.bg_custom || 'transparent',
                show: !!props.config.bg_custom,
                left:   GRID_PADDING_LEFT,
                top:    8,
                right:  GRID_PADDING_RIGHT,
                bottom: 40,
            },
            tooltip: props.config.hoverDetail ? {
                trigger: 'axis',
                formatter: params => this.renderTooltip(props, params),
                hoverAnimation: true,
                axisPointer: {
                    animation: true
                }
            } : undefined,
            xAxis: [
                {
                    type: 'time',
                    splitLine: {
                        show: !props.config.grid_hideX,
                        lineStyle: props.config.grid_color ? {
                            color: props.config.grid_color,
                        } : undefined,
                    },
                    //splitNumber: Math.round((this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT) / 50),
                    min: this.chart.min,
                    max: this.chart.max,
                    axisTick: {
                        alignWithLabel: true,
                    },
                    axisLabel: {
                        formatter: (value, index) => {
                            const date = new Date(value);
                            if (props.config.timeFormat) {
                                return moment(date).format(props.config.timeFormat).replace('<br/>', '\n');
                            } else
                            if (this.chart.withSeconds) {
                                return padding2(date.getHours()) + ':' + padding2(date.getMinutes()) + ':' + padding2(date.getSeconds());
                            } else if (this.chart.withTime) {
                                return padding2(date.getHours()) + ':' + padding2(date.getMinutes()) + '\n' + padding2(date.getDate()) + '.' + padding2(date.getMonth() + 1);
                            } else {
                                return padding2(date.getDate()) + '.' + padding2(date.getMonth() + 1) + '\n' + date.getFullYear();
                            }
                        },
                        color: props.config.x_labels_color || undefined,
                    }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    boundaryGap: [0, '100%'],
                    splitLine: {
                        show: !props.config.grid_hideY,
                        lineStyle: props.config.grid_color ? {
                            color: props.config.grid_color,
                        } : undefined,
                    },
                    //splitNumber: Math.round(this.state.chartHeight / 100),
                    axisLabel: {
                        formatter: function (value) {
                            if (props.config.useComma) {
                                value = value.toString().replace('.', ',');
                            }
                            return value + props.config.l[0].unit;
                        },//'{value}' + props.config.l[0].unit,
                        color: props.config.y_labels_color || undefined,
                    },
                    axisTick: {
                        alignWithLabel: true,
                    }
                }
            ],
            toolbox: props.config.export === true || props.config.export === 'true' ? {
                left: 'right',
                feature: {
                    /*dataZoom: {
                        yAxisIndex: 'none',
                        title: props.t('Zoom'),
                    },
                    restore: {
                        title: props.t('Restore')
                    },*/
                    saveAsImage: {
                        title: props.t('Save as image'),
                        show: true,
                    }
                }
            } : undefined,
            /*dataZoom: [
                {
                    show: true,
                    realtime: true,
                    startValue: this.start,
                    endValue: this.end,
                    y: this.state.chartHeight - 50,
                    dataBackground: {
                        lineStyle: {
                            color: '#FFFFFF'
                        },
                        areaStyle: {
                            color: '#FFFFFFE0'
                        }
                    },
                },
                {
                    show: true,
                    type: 'inside',
                    realtime: true,
                },
            ],*/
            series
        };

        if (!props.config.grid_color) {
            options.yAxis.forEach(axis => delete axis.splitLine.lineStyle);
            options.xAxis.forEach(axis => delete axis.splitLine.lineStyle);
        }

        return options;
    }

    /*updateChart(start, end, withReadData, cb) {
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

            const diff = this.chart.max - this.chart.min;
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
                                min: this.chart.min,
                                max: this.chart.max,
                            }
                        }, true);
                        cb && cb();
                    });
            } else {
                typeof this.echartsReact.getEchartsInstance === 'function' && this.echartsReact.getEchartsInstance().setOption({
                    series: [{data: this.convertData()}],
                    xAxis: {
                        min: this.chart.min,
                        max: this.chart.max,
                    }
                }, true);
                cb && cb();
            }
        }, 400);
    }*/

    setNewRange(updateChart) {
        this.chart.diff        = this.chart.max - this.chart.min;
        this.chart.withTime    = this.chart.diff < 3600000 * 24 * 7;
        this.chart.withSeconds = this.chart.diff < 60000 * 30;

        this.debug && console.log(`[ChartView ] [${new Date().toISOString()}] setNewRange: ${!!updateChart}`);
        if (updateChart) {
            this.updateDataTimer && clearTimeout(this.updateDataTimer);
            this.updateDataTimer = null;

            this.props.onRangeChange && this.props.onRangeChange({start: this.chart.min, end: this.chart.max});
        } else {
            this.debug && console.log(`[ChartView ] [${new Date().toISOString()}] setOption in setNewRange`);
            this.echartsReact.getEchartsInstance().setOption({
                xAxis: {
                    min: this.chart.min,
                    max: this.chart.max,
                }
            });
        }
    }

    onMouseMove = e => {
        if (this.mouseDown) {
            if (this.divResetButton.current && this.divResetButton.current.style.display !== 'block') {
                 this.divResetButton.current.style.display = 'block';
            }
            const moved = this.chart.lastX - (e.offsetX - GRID_PADDING_LEFT);
            this.chart.lastX = e.offsetX - GRID_PADDING_LEFT;
            const diff = this.chart.max - this.chart.min;
            const width = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;

            const shift = Math.round(moved * diff / width);
            this.chart.min += shift;
            this.chart.max += shift;
            this.setNewRange();
        }
    };

    onMouseDown = e => {
        this.mouseDown = true;
        this.chart.lastX = e.offsetX;
        if (this.zr && !this.zr._mousemove) {
            this.zr._mousemove = true;
            this.zr.on('mousemove', this.onMouseMove);
        }
        const config = this.props.config;
        if (config.live && this.props.onRangeChange) {
            console.log('Stop update');
            this.props.onRangeChange({stopLive: true});
        }
    };

    onMouseUp = () => {
        this.mouseDown = false;
        this.setNewRange(true);
        if (this.zr && this.zr._mousemove) {
            this.zr._mousemove = false;
            this.zr.off('mousemove', this.onMouseMove);
        }
    };

    onMouseWheel = e => {
        let diff = this.chart.max - this.chart.min;
        const width = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;
        const x = e.offsetX - GRID_PADDING_LEFT;
        const pos = x / width;

        const oldDiff = diff;
        const amount = e.wheelDelta > 0 ? 1.1 : 0.9;
        diff = diff * amount;
        const move = oldDiff - diff;
        this.chart.max += move * (1 - pos);
        this.chart.min -= move * pos;

        this.setNewRange();
        this.updateDataTimer && clearTimeout(this.updateDataTimer);
        this.updateDataTimer = setTimeout(() => this.setNewRange(true), 1000);
    };

    onTouchStart = e => {
        e.preventDefault();
        this.mouseDown = true;
        const touches = e.touches || e.originalEvent.touches;
        if (touches) {
            this.chart.lastX = touches[touches.length - 1].pageX;
            if (touches.length > 1) {
                this.chart.lastWidth = Math.abs(touches[0].pageX - touches[1].pageX);
            } else {
                this.chart.lastWidth = null;
            }
        }
    };

    onTouchEnd = e => {
        e.preventDefault();
        this.mouseDown = false;
        this.setNewRange(true);
    };

    onTouchMove = e => {
        e.preventDefault();
        const touches = e.touches || e.originalEvent.touches;
        if (!touches) {
            return;
        }
        const pageX = touches[touches.length - 1].pageX - GRID_PADDING_LEFT;
        if (this.mouseDown) {
            if (touches.length > 1) {
                // zoom
                const fingerWidth = Math.abs(touches[0].pageX - touches[1].pageX);
                if (this.chart.lastWidth !== null && fingerWidth !== this.chart.lastWidth) {
                    let diff = this.chart.max - this.chart.min;
                    const chartWidth = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;

                    const amount     = fingerWidth > this.chart.lastWidth ? 1.1 : 0.9;
                    const positionX  = touches[0].pageX > touches[1].pageX ?
                        touches[1].pageX - GRID_PADDING_LEFT + fingerWidth / 2 :
                        touches[0].pageX - GRID_PADDING_LEFT + fingerWidth / 2;

                    const pos = positionX / chartWidth;

                    const oldDiff = diff;
                    diff = diff * amount;
                    const move = oldDiff - diff;

                    this.chart.max += move * (1 - pos);
                    this.chart.min -= move * pos;

                    this.setNewRange();
                }
                this.chart.lastWidth = fingerWidth;
            } else {
                // swipe
                const moved = this.chart.lastX - pageX;
                const diff  = this.chart.max - this.chart.min;
                const chartWidth = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;

                const shift = Math.round(moved * diff / chartWidth);
                this.chart.min += shift;
                this.chart.max += shift;

                this.setNewRange();
            }
        }
        this.chart.lastX = pageX;
    };

    installEventHandlers() {
        this.zr = this.echartsReact.getEchartsInstance().getZr();

        if (this.zr && this.props.config.zoom && !this.zr._iobInstalled) {
            this.zr._iobInstalled = true;

            this.zr.on('mousedown', this.onMouseDown);

            this.zr.on('mouseup', this.onMouseUp);

            this.zr.on('mousewheel', this.onMouseWheel);

            this.zr.on('touchstart', this.onTouchStart);

            this.zr.on('touchend', this.onTouchEnd);

            this.zr.on('touchmove', this.onTouchMove);
        } else if (this.zr && !this.props.config.zoom && this.zr._iobInstalled) {
            this.zr._iobInstalled = false;
            this.zr.off('mousedown', this.onMouseDown);
            this.zr.off('mouseup', this.onMouseUp);
            this.zr.off('mousewheel', this.onMouseWheel);
            if (this.zr && this.zr._mousemove) {
                this.zr._mousemove = false;
                this.zr.off('mousemove', this.onMouseMove);
            }
            this.zr.off('touchstart', this.onTouchStart);
            this.zr.off('touchend', this.onTouchEnd);
            this.zr.off('touchmove', this.onTouchMove);
        }
    }

    renderChart() {
        if (this.props.data) {
            const option = this.getOption();

            //console.log(JSON.stringify(option, null, 2));
            this.debug && console.log(`[ChartView ] [${new Date().toISOString()}] render chart`);

            return <ReactEchartsCore
                ref={e => this.echartsReact = e}
                echarts={ echarts }
                option={ option }
                notMerge={ true }
                lazyUpdate={ true }
                theme={ this.props.themeType === 'dark' ? 'dark' : '' }
                style={{ height: this.state.chartHeight + 'px', width: '100%' }}
                opts={{ renderer: 'svg' }}
                onEvents={ {
                    /*datazoom: e => {
                        const {startValue, endValue} = e.batch[0];
                        this.updateChart(startValue, endValue, true);
                    },*/
                    rendered: e => {
                        this.props.config.zoom && this.installEventHandlers();
                    }
                }}
            />;
        } else {
            return <LinearProgress/>;
        }
    }

    componentDidUpdate() {
        if (this.divRef.current) {
            const borderWidth   = parseFloat(this.props.config.border_width)   || 0;
            const borderPadding = parseFloat(this.props.config.border_padding) || 0;
            const chartHeight = this.divRef.current.offsetHeight - (borderWidth + borderPadding) * 2;
            if (this.state.chartHeight !== chartHeight) {
                const chartWidth  = this.divRef.current.offsetWidth - (borderWidth + borderPadding) * 2;
                setTimeout(() => this.setState({chartHeight, chartWidth}), 10);
            }
        }
    }

    renderResetButton() {
        return <Fab
            ref={ this.divResetButton }
            size="small"
            color="default"
            style={{display: 'none'}}
            className={this.props.classes.resetButton}
            title={I18n.t('Reset pan and zoom')}
            onClick={() => {
                if (this.divResetButton.current) {
                    this.divResetButton.current.style.display = 'none';
                }
                this.props.onRangeChange && this.props.onRangeChange();
            }}
        >
            <IconReset className={this.props.classes.resetButtonIcon}/>
        </Fab>;
    }

    render() {
        if (!this.divRef.current) {
            setTimeout(() => this.forceUpdate(), 10);
        }

        const borderWidth   = parseFloat(this.props.config.border_width) || 0;
        const borderPadding = parseFloat(this.props.config.border_padding) || 0;

        return <div
            ref={ this.divRef }
            className={ this.props.classes.chart }
            style={{
                width:  borderWidth || borderPadding ? 'calc(100% - ' + ((borderWidth + borderPadding) * 2 + 1) + 'px' : undefined,
                height: borderWidth || borderPadding ? 'calc(100% - ' + (borderWidth + borderPadding) * 2 + 'px' : undefined,
                background: this.props.config.window_bg || undefined,
                borderWidth,
                borderColor: this.props.config.border_color || undefined,
                borderStyle: borderWidth ? this.props.config.border_style || 'solid' : '',
                padding: borderPadding || 0,
            }}>
            { this.renderResetButton() }
            { this.renderChart() }
        </div>;
    }
}

ChartView.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    config: PropTypes.object,
    themeType: PropTypes.string,
    data: PropTypes.array,
    noAnimation: PropTypes.bool,
    onRangeChange: PropTypes.func,
};

export default withWidth()(withStyles(styles)(ChartView));