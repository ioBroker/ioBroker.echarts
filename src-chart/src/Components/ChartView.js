import React from 'react';
import PropTypes from 'prop-types';
import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';

import LinearProgress from '@material-ui/core/LinearProgress';
import Fab from '@material-ui/core/Fab';

import {FaRedoAlt as IconReset}  from 'react-icons/fa'
import {FaDownload as IconExport}  from 'react-icons/fa'

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
import 'echarts/lib/component/markLine';
import 'echarts/lib/component/markArea';

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

import 'echarts/lib/component/toolbox';
import 'echarts/lib/component/title';
import 'echarts/lib/component/legend';

import 'echarts/lib/component/dataZoom';
import 'echarts/lib/component/timeline';
import 'zrender/lib/svg/svg';

const styles = theme => ({
    chart: {
        maxHeight: '100%',
        maxWidth: '100%',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
    },
    exportButton: {
        position: 'absolute',
        top: 40,
        right: 5,
        width: 20,
        height: 20,
        zIndex: 2,
        opacity: 0.7,
        cursor: 'pointer'
        //background: '#00000000',
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

let canvasCalcTextWidth = null;
function calcTextWidth(text, fontSize, fontFamily) {
    // canvas for better performance
    const canvas = canvasCalcTextWidth || (canvasCalcTextWidth = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    context.font = `${fontSize || 12}px ${fontFamily || 'Microsoft YaHei'}`;
    const metrics = context.measureText(text);
    return Math.ceil(metrics.width);
}

class ChartView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            chartHeight: null,
            chartWidth: null,
        };

        this.echartsReact = React.createRef();
        // this.rangeRef     = React.createRef();

        this.divRef = React.createRef();
        this.divResetButton = React.createRef();

        moment.locale(I18n.getLanguage());

        this.lastIds = (this.props.config && this.props.config.l && this.props.config.l.map(item => item.id)) || [];
        this.lastIds.sort();

        this.chartOption = new ChartOption(moment, this.props.themeType, calcTextWidth);
    }

    componentDidMount() {
        window.addEventListener('resize', this.onResize)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onResize);
    }

    updateProperties = props => {
        this.updatePropertiesTimeout = null;
        if (this.echartsReact && typeof this.echartsReact.getEchartsInstance === 'function') {
            const chartInstance = this.echartsReact.getEchartsInstance();
            const lastIds = (props.config && props.config.l && props.config.l.map(item => item.id)) || [];
            lastIds.sort();
            const changed = JSON.stringify(lastIds) !== JSON.stringify(this.lastIds);
            // If list of IDs changed => clear all settings
            if (changed)  {
                this.lastIds = lastIds;
                chartInstance.clear();
            }

            this.option = this.chartOption.getOption(props.data, props.config);
            this.debug && console.log(`[ChartView ] [${new Date().toISOString()}] updateProperties: {min: ${this.option.xAxis[0].min}, ${this.option.xAxis[0].max}}`);
            try {
                chartInstance.setOption(this.option, changed);
            } catch (e) {
                console.error('Cannot apply options: ' + JSON.stringify(this.option));
            }
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
            if (state.ts >= this.chart.min && state.ts <= this.chart.xMax + 300000) {
                this.updateChart();
            }
        }
    };*/

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
    }*/

    setNewRange(updateChart) {
        const chart = this.chartOption.getHelperChartData();
        chart.diff        = chart.xMax - chart.xMin;
        chart.withTime    = chart.diff < 3600000 * 24 * 7;
        chart.withSeconds = chart.diff < 60000 * 30;

        console.log(`[ChartView ] [${new Date().toISOString()}] setNewRange: ${!!updateChart}, {min: ${chart.xMin}, max: ${chart.xMax}}`);
        if (updateChart) {
            this.updateDataTimer && clearTimeout(this.updateDataTimer);
            this.updateDataTimer = null;
            this.props.onRangeChange && this.props.onRangeChange({start: chart.xMin, end: chart.xMax});
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
                    }
                });
            } catch (e) {
                console.error('Cannot apply options 1: ' + JSON.stringify(this.option));
            }
        }
    }

    onMouseMove = e => {
        if (this.mouseDown) {
            if (this.divResetButton.current && this.divResetButton.current.style.display !== 'block') {
                 this.divResetButton.current.style.display = 'block';
            }
            const chart = this.chartOption.getHelperChartData();
            const moved = chart.lastX - (e.offsetX - chart.padLeft);
            chart.lastX = e.offsetX - chart.padLeft;
            const diff = chart.xMax - chart.xMin;
            const width = this.state.chartWidth - chart.padRight - chart.padLeft;

            const shift = Math.round(moved * diff / width);
            chart.xMin += shift;
            chart.xMax += shift;
            this.setNewRange();
        }
    };

    onMouseDown = e => {
        this.mouseDown = true;
        const chart = this.chartOption.getHelperChartData();
        chart.lastX = e.offsetX;
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
        const chart = this.chartOption.getHelperChartData();
        let diff = chart.xMax - chart.xMin;
        const width = this.state.chartWidth - chart.padRight - chart.padLeft;
        const x = e.offsetX - chart.padLeft;
        const pos = x / width;

        const oldDiff = diff;
        const amount = e.wheelDelta > 0 ? 1.1 : 0.9;
        diff = diff * amount;
        const move = oldDiff - diff;
        chart.xMax += move * (1 - pos);
        chart.xMin -= move * pos;

        this.setNewRange();
        this.updateDataTimer && clearTimeout(this.updateDataTimer);
        this.updateDataTimer = setTimeout(() => this.setNewRange(true), 1000);
    };

    onTouchStart = e => {
        e.preventDefault();
        this.mouseDown = true;
        const touches = e.touches || e.originalEvent.touches;
        if (touches) {
            const chart = this.chartOption.getHelperChartData();
            chart.lastX = touches[touches.length - 1].pageX;
            if (touches.length > 1) {
                chart.lastWidth = Math.abs(touches[0].pageX - touches[1].pageX);
            } else {
                chart.lastWidth = null;
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
        const chart = this.chartOption.getHelperChartData();
        const pageX = touches[touches.length - 1].pageX - chart.padLeft;
        if (this.mouseDown) {
            if (touches.length > 1) {
                // zoom
                const fingerWidth = Math.abs(touches[0].pageX - touches[1].pageX);
                if (chart.lastWidth !== null && fingerWidth !== chart.lastWidth) {
                    let diff = chart.xMax - chart.xMin;
                    const chartWidth = this.state.chartWidth - chart.padRight - chart.padLeft;

                    const amount     = fingerWidth > chart.lastWidth ? 1.1 : 0.9;
                    const positionX  = touches[0].pageX > touches[1].pageX ?
                        touches[1].pageX - chart.padLeft + fingerWidth / 2 :
                        touches[0].pageX - chart.padLeft + fingerWidth / 2;

                    const pos = positionX / chartWidth;

                    const oldDiff = diff;
                    diff = diff * amount;
                    const move = oldDiff - diff;

                    chart.xMax += move * (1 - pos);
                    chart.xMin -= move * pos;

                    this.setNewRange();
                }
                chart.lastWidth = fingerWidth;
            } else {
                // swipe
                const moved = chart.lastX - pageX;
                const diff  = chart.xMax - chart.xMin;
                const chartWidth = this.state.chartWidth - chart.padRight - chart.padLeft;

                const shift = Math.round(moved * diff / chartWidth);
                chart.xMin += shift;
                chart.xMax += shift;

                this.setNewRange();
            }
        }
        chart.lastX = pageX;
    };

    installEventHandlers() {
        this.zr = this.echartsReact && this.echartsReact.getEchartsInstance && this.echartsReact.getEchartsInstance().getZr();

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
            this.option = this.option || this.chartOption.getOption(this.props.data, this.props.config);

            this.debug && console.log(`[ChartView ] [${new Date().toISOString()}] render chart`);

            return <ReactEchartsCore
                ref={e => this.echartsReact = e}
                echarts={ echarts }
                option={ this.option }
                notMerge={ true }
                lazyUpdate={ true }
                theme={ this.option.theme }
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
            const borderWidth   = this.props.config.noBorder !== 'noborder' ? parseFloat(this.props.config.border_width) || 0 : 0;
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

    renderExportButton() {
        if (this.props.config.export) {
            return <IconExport
                color={this.props.config.exportColor || 'default'}
                className={this.props.classes.exportButton}
                title={I18n.t('Save chart as svg')}
                onClick={() => {
                    if (this.echartsReact && typeof this.echartsReact.getEchartsInstance === 'function') {
                        const chartInstance = this.echartsReact.getEchartsInstance();
                        const base64 = chartInstance.getDataURL({
                            pixelRatio: 2, // only for png
                            backgroundColor: this.props.config.window_bg || (this.props.themeType === 'dark' ? '#000' : '#FFF'),
                        });

                        const downloadLink = document.createElement('a');
                        document.body.appendChild(downloadLink);

                        downloadLink.href = base64;
                        downloadLink.target = '_self';
                        let name = '';
                        if (this.props.config.l.length === 1) {
                            name = this.props.config.l[0].name;
                        } else {
                            name = 'chart';
                        }
                        const option = this.option;
                        const date = new Date(option.xAxis[0].max || option.series[0].data[option.series[0].data.length - 1].value[0]);
                        downloadLink.download =
                            `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}` +
                            `_${date.getHours().toString().padStart(2, '0')}_${date.getMinutes().toString().padStart(2, '0')}_${name}.svg`;
                        downloadLink.click();
                    }
                }}
            />
        } else {
            return null;
        }
    }

    render() {
        if (!this.divRef.current) {
            setTimeout(() => this.forceUpdate(), 10);
        }

        const borderWidth   = this.props.config.noBorder !== 'noborder' ? parseFloat(this.props.config.border_width) || 0 : 0;
        const borderPadding = parseFloat(this.props.config.border_padding) || 0;

        return <div
            ref={ this.divRef }
            className={ this.props.classes.chart }
            style={{
                borderWidth,
                width:          borderWidth || borderPadding ? 'calc(100% - ' + ((borderWidth + borderPadding) * 2 + 1) + 'px' : undefined,
                height:         borderWidth || borderPadding ? 'calc(100% - ' + (borderWidth + borderPadding) * 2 + 'px' : undefined,
                background:     this.props.config.window_bg || undefined,
                borderColor:    this.props.config.noBorder !== 'noborder' ? this.props.config.border_color || undefined : undefined,
                borderStyle:    this.props.config.noBorder !== 'noborder' && borderWidth ? this.props.config.border_style || 'solid' : 'hidden',
                padding:        borderPadding || 0,
            }}>
            { this.renderExportButton() }
            { this.renderResetButton() }
            { this.state.chartHeight !== null ? this.renderChart() : null }
        </div>;
    }
}

ChartView.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    config: PropTypes.object,
    themeType: PropTypes.string,
    data: PropTypes.array,
    noAnimation: PropTypes.bool,
    onRangeChange: PropTypes.func,
};

export default withWidth()(withStyles(styles)(ChartView));