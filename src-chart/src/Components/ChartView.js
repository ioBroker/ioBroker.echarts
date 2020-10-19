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
import 'echarts/lib/component/markLine';
import 'echarts/lib/component/markArea';

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

const THEMES = {
    azul: [
        '#f2385a',
        '#f5a503',
        '#4ad9d9',
        '#f7879c',
        '#c1d7a8',
        '#4dffd2',
        '#fccfd7',
        '#d5f6f6'
    ],
    'bee-inspired': [
        '#001727',
        '#805500',
        '#ffff00',
        '#ffd11a',
        '#f2d71f',
        '#f2be19',
        '#f3a81a',
        '#fff5cc'
    ],
    'blue': [
        '#1790cf',
        '#1bb2d8',
        '#99d2dd',
        '#88b0bb',
        '#1c7099',
        '#038cc4',
        '#75abd0',
        '#afd6dd'
    ],
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
        '#26C0C0'
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
        '#4b565b'
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
        '#f49f42'
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
        '#c14089'
    ],
    shine: [
        '#c12e34',
        '#e6b600',
        '#0098d9',
        '#2b821d',
        '#005eaa',
        '#339ca8',
        '#cda819',
        '#32a487'
    ],
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
        '#38b6b6'
    ],
    royal: [
        '#3f7ea6',
        '#993366',
        '#408000',
        '#8c6f56',
        '#a65149',
        '#731f17',
        '#adc2eb',
        '#d9c3b0'
    ],
    'dark-blue': [
        '#00305a',
        '#004b8d',
        '#0074d9',
        '#4192d9',
        '#7abaf2',
        '#99cce6',
        '#d6ebf5',
        '#eeeeee'
    ],
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
        '#eeeeee'
    ],
    red: [
        '#d8361b',
        '#f16b4c',
        '#f7b4a9',
        '#d26666',
        '#99311c',
        '#c42703',
        '#d07e75'
    ],
    'red-velvet': [
        '#8b1a2d',
        '#a7314b',
        '#e6004c',
        '#ff8066',
        '#8e5c4e',
        '#ff1a66',
        '#d6c582',
        '#f0d4af'
    ],
    green: [
        '#408829',
        '#68a54a',
        '#a9cba2',
        '#86b379',
        '#397b29',
        '#8abb6f',
        '#759c6a',
        '#bfd3b7'
    ],
    light: ['#37A2DA', '#32C5E9', '#67E0E3', '#9FE6B8', '#FFDB5C', '#ff9f7f', '#fb7293', '#E062AE', '#E690D1', '#e7bcf3', '#9d96f5', '#8378EA', '#96BFFF'],
    gray: [
        '#757575',
        '#c7c7c7',
        '#dadada',
        '#8b8b8b',
        '#b5b5b5',
        '#e9e9e9'
    ],
    'dark-bold': [
        '#458c6b',
        '#f2da87',
        '#d9a86c',
        '#d94436',
        '#a62424',
        '#76bc9b',
        '#cce6da',
        '#eeeeee'
    ]
};

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
    divExportButton: {
        position: 'absolute',
        top: 40,
        right: 25,
        zIndex: 2,
        opacity: 0.7
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
            chartHeight: 300,
            chartWidth: 500,
        };

        this.echartsReact = React.createRef();
        // this.rangeRef     = React.createRef();

        this.divRef = React.createRef();
        this.divResetButton = React.createRef();

        this.chart = {yAxis: []};
        moment.locale(I18n.getLanguage());

        this.lastIds = (this.props.config && this.props.config.l && this.props.config.l.map(item => item.id)) || [];
        this.lastIds.sort();
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

            this.option = this.getOptions(props);
            this.debug && console.log(`[ChartView ] [${new Date().toISOString()}] updateProperties: {min: ${this.option.xAxis[0].min}, ${this.option.xAxis[0].max}}`);
            chartInstance.setOption(this.option, changed);
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

    convertData(props, i, yAxisIndex) {
        props = props || this.props;
        const values = props.data[i];
        if (!values || !values.length) {
            return [];
        }

        const yAxis = this.chart.yAxis[yAxisIndex] || {max: null, min: null};
        this.chart.yAxis[yAxisIndex] = yAxis;

        for (let i = 0; i < values.length; i++) {
            if (values[i].value[1] === null) {
                continue;
            }

            if (yAxis.min === null || yAxis.min > values[i].value[1]) {
                yAxis.min = values[i].value[1];
            }
            if (yAxis.max === null || yAxis.max < values[i].value[1]) {
                yAxis.max = values[i].value[1];
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

    getSeries(props, theme) {
        props = props || this.props;
        this.chart.xMin = null;
        this.chart.xMax = null;
        let colorCount = 0;

        return props.config.l.map((oneLine, i) => {
            const color = oneLine.color || (THEMES[theme] ? THEMES[theme][colorCount % THEMES[theme].length] : '');
            if (!oneLine.color) {
                colorCount++;
            }
            const yAxisIndex = oneLine.commonYAxis === '' || oneLine.commonYAxis === undefined ? i : parseInt(oneLine.commonYAxis) || 0;
            const cfg = {
                name: oneLine.name,
                xAxisIndex: 0,
                yAxisIndex,
                type: oneLine.chartType === 'scatterplot' ? 'scatter' : 'line',
                showSymbol: oneLine.chartType === 'scatterplot' || oneLine.points,
                hoverAnimation: true,
                animation: false,
                step: oneLine.chartType === 'steps' ? 'start' : undefined,
                smooth: oneLine.chartType === 'spline',
                data: this.convertData(props, i, yAxisIndex),
                itemStyle: {color},
                symbolSize: oneLine.chartType === 'scatterplot' || oneLine.points ? oneLine.symbolSize || 3 : undefined,
                symbol: 'circle',
                lineStyle: {
                    width:          oneLine.thickness || 1,
                    shadowBlur:     oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                    shadowOffsetY:  oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                    shadowColor:    color,
                    type:           oneLine.dashes ? 'dashed' : (oneLine.lineStyle || 'solid'),
                }
            };
            if (parseFloat(oneLine.fill)) {
                cfg.areaStyle = {
                    color: color,
                    opacity: parseFloat(oneLine.fill),
                };
            }

            return cfg;
        });
    }

    getXAxis(props) {
        return [
            {
                type: 'time',
                splitLine: {
                    show: !props.config.grid_hideX,
                    lineStyle: props.config.l[0].xaxe === 'off' ? {color: 'rgba(0,0,0,0)', type: 'dashed'} : props.config.grid_color ? {
                        color: props.config.grid_color,
                        type: 'dashed',
                    } : {type: 'dashed'},
                },
                splitNumber: parseInt(props.config.l[0].xticks, 10) || undefined,
                position: props.config.l[0].xaxe === 'top' ? 'top' : 'bottom',
                min: this.chart.xMin,
                max: this.chart.xMax,
                axisTick: {
                    alignWithLabel: true,
                    lineStyle: props.config.l[0].xaxe === 'off' ?
                        {color: 'rgba(0,0,0,0)'}
                        :
                        (props.config.x_ticks_color ? {color: props.config.x_ticks_color} : undefined),
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
                    color: props.config.l[0].xaxe === 'off' ? 'rgba(0,0,0,0)' : (props.config.x_labels_color || undefined),
                }
            }
        ];
    }

    getYAxis(props, theme, series) {
        props = props || this.props;

        return props.config.l.map((oneLine, i) => {
            if (oneLine.commonYAxis !== '' && oneLine.commonYAxis !== undefined) {
                return {};
            }

            let yMin = parseFloat(oneLine.min);
            let yMax = parseFloat(oneLine.max);

            const yAxis = this.chart.yAxis;
            if (yAxis[i]) {
                const diff = yAxis[i].max - yAxis[i].min;
                if (isNaN(yMin)) {
                    // auto calculate
                    yMin = yAxis[i].min - diff * 0.1; // min - 10%
                    if (yMin > 0) {
                        yMin = 0;
                    } else {
                        if (diff > 5000) {
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
                }
                if (isNaN(yMax)) {
                    // auto calculate
                    yMax = yAxis[i].max + diff * 0.1; // max + 10%
                    if (diff > 5000) {
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
                if (isNaN(yMin)) {
                    yMin = undefined;
                }
                if (isNaN(yMax)) {
                    yMax = undefined;
                }
            }

            let color = oneLine.yaxe === 'off' ? 'rgba(0,0,0,0)' : (props.config.grid_color || undefined);
            if (oneLine.yaxe === 'leftColor' || oneLine.yaxe === 'rightColor') {
                color = series[i].itemStyle.color;
            }

            return {
                type: 'value',
                min: yMin,
                max: yMax,
                position: (oneLine.yaxe === 'left' || oneLine.yaxe === 'off' || oneLine.yaxe === 'leftColor') ?
                    'left' :
                    (oneLine.yaxe === 'right' || oneLine.yaxe === 'rightColor' ?
                        'right' :
                        (!i ? 'left' : 'right')
                    ), // by default only first line is on the left
                splitLine: !i ? { // grid has only first line
                    show: !props.config.grid_hideY,
                    lineStyle: {
                        color: color || undefined,
                        type: 'dashed',
                    },
                } : undefined,
                splitNumber: parseInt(oneLine.yticks, 10) || undefined,
                axisLabel: {
                    formatter: value => this.yFormatter(value, i, props, true),
                    color: oneLine.yaxe === 'off' || oneLine.yaxe === 'leftColor' || oneLine.yaxe === 'rightColor' ? color : (props.config.y_labels_color || undefined),
                },
                axisTick: {
                    alignWithLabel: true,
                    lineStyle: color ? {color} : (props.config.y_ticks_color ? {color: props.config.y_ticks_color} : undefined)
                }
            };
        });
    }

    getMarkings(props, options) {
        // fill markings
        props.config.marks && props.config.marks.forEach(oneMark => {
            const lowerLimitFloat = oneMark.lowerValue !== undefined ? oneMark.lowerValue : parseFloat(oneMark.lowerValueOrId);
            const upperLimitFloat = oneMark.upperValue !== undefined ? oneMark.upperValue : parseFloat(oneMark.upperValueOrId);
            const isLowerNumber   = lowerLimitFloat !== null && !isNaN(lowerLimitFloat);
            const isUpperNumber   = upperLimitFloat !== null && !isNaN(upperLimitFloat);

            const series = options.series[oneMark.lineId];
            if (isLowerNumber && isUpperNumber) {
                // area
                series.markArea = series.markArea || {
                    symbol: ['none', 'none'],
                    itemStyle: {
                        color:       oneMark.color || series.itemStyle.color,
                        borderWidth: 0,
                        opacity:     parseFloat(oneMark.fill),
                    },
                    data: []
                };
                series.markArea.data.push([
                    {yAxis: lowerLimitFloat, name: oneMark.text || ''},
                    {yAxis: upperLimitFloat},
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
                        label: {
                            show: !!oneMark.text,
                            formatter: oneMark.text || '',
                            position: oneMark.textPosition === 'r' ? 'end' : 'start',
                            distance: oneMark.textOffset || -35,
                            textStyle: {
                                color: oneMark.textColor || '#FFF',
                                fontStyle: 'normal',
                                fontSize: oneMark.textSize || undefined,
                            }
                        },
                        lineStyle: {
                            color:          oneMark.color || series.itemStyle.color,
                            width:          parseFloat(oneMark.ol) || 1,
                            shadowBlur:     parseFloat(oneMark.os) ? parseFloat(oneMark.os) + 1 : 0,
                            shadowOffsetY:  parseFloat(oneMark.os) ? parseFloat(oneMark.os) + 1 : 0,
                            shadowColor:    oneMark.color,
                            type:           oneMark.lineStyle || 'solid',
                        },
                        data: []
                    };
                    series.markLine.data.push({yAxis: limitFloat});

                    // if minimum not set
                    let yMin = parseFloat(props.config.l[oneMark.lineId].min);
                    if (isNaN(yMin)) {
                        if (this.chart.yAxis[oneMark.lineId].min > limitFloat && limitFloat < 0) {
                            options.yAxis[0].min = limitFloat;
                        }
                    }
                    let yMax = parseFloat(props.config.l[oneMark.lineId].min);
                    if (isNaN(yMax)) {
                        if (this.chart.yAxis[oneMark.lineId].max < limitFloat) {
                            options.yAxis[0].max = limitFloat;
                        }
                    }
                }
            }
        });

        return options;
    }

    yFormatter(val, line, props, withUnit) {
        props = props || this.props;
        if (props.config.l[line].type === 'boolean') {
            return val ? 'TRUE' : 'FALSE';
        }

        if (val === null || val === undefined) {
            return '';
        }

        const afterComma = props.config.l[line].afterComma;
        if (afterComma !== undefined && afterComma !== null) {
            val = parseFloat(val);
            if (props.config.useComma) {
                return val.toFixed(afterComma).replace('.', ',') + (withUnit ? props.config.l[line].unit : '');
            } else {
                return val.toFixed(afterComma) + (withUnit ? props.config.l[line].unit : '');
            }
        } else {
            if (props.config.useComma) {
                val = parseFloat(val) || 0;
                return val.toString().replace('.', ',') + (withUnit ? props.config.l[line].unit : '');
            } else {
                return val.toString() + (withUnit ? props.config.l[line].unit : '');
            }
        }
    }

    renderTooltip(props, params) {
        const date = new Date(params[0].value[0]);

        const values = params.filter(param => !param.seriesName.startsWith('__markings__')).map(param => {
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

    getOptions(props) {
        props = props || this.props;
        let theme = this.props.config.theme;
        if (!theme || theme === 'default') {
            theme = this.props.themeType === 'light' ? 'roma' : 'dark-bold';
        }

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

        const series = this.getSeries(props, theme);

        if (props.config.start) {
            if (this.chart.xMax < props.config.end) {
                this.chart.xMax = props.config.end;
            }
            if (this.chart.xMin > props.config.start) {
                this.chart.xMin = props.config.start;
            }
        }

        this.chart.diff        = this.chart.xMax - this.chart.xMin;
        this.chart.withTime    = this.chart.diff < 3600000 * 24 * 7;
        this.chart.withSeconds = this.chart.diff < 60000 * 30;

        const yAxis = this.getYAxis(props, theme, series);
        const xAxis = this.getXAxis(props);

        const options = {
            theme,
            backgroundColor: 'transparent',
            animation: !props.config.noAnimation && !props.config.noLoader,
            title: {
                text: props.config.title || '',
                textStyle: {
                    fontSize: props.config.titleSize ? parseInt(props.config.titleSize, 10) : undefined,
                    color: props.config.titleColor || undefined
                },
                textVerticalAlign: titlePos.bottom      ? 'bottom' : 'top',
                textAlign:         titlePos.left === 50 ? 'center' : (titlePos.right === -5 ? 'right' : 'left'),
                top:               titlePos.top  === 35 ? 5 : (titlePos.top === 50 ? '50%' : undefined),
                left:              titlePos.left === 50 ? '50%' : (titlePos.left === 65 ? 15 : undefined),
                bottom:            titlePos.bottom      ? (titlePos.bottom > 0 ? titlePos.bottom + xAxisHeight - 10 : titlePos.bottom) : undefined,
                right:             titlePos.right === 5 ? this.chart.padRight : undefined,
            },
            grid: {
                backgroundColor: props.config.bg_custom || 'transparent',
                show: !!props.config.bg_custom,
                left:   0,
                top:    8,
                right:  0,
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
            xAxis,
            yAxis,
            toolbox: false && (props.config.export === true || props.config.export === 'true') ? {
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

        this.getMarkings(props, options);

        // calculate padding: left and right
        let padLeft  = 0;
        let padRight = 0;
        series.forEach((ser, i) => {
            let minTick = this.yFormatter(options.yAxis[ser.yAxisIndex].min, i, props, true);
            let maxTick = this.yFormatter(options.yAxis[ser.yAxisIndex].max, i, props, true);

            const position = options.yAxis[ser.yAxisIndex].position;
            if (position === 'off') {
                return;
            }
            let wMin = calcTextWidth(minTick);
            let wMax = calcTextWidth(maxTick);
            if (position === 'left' || position === 'leftColor') {
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
        options.grid.left = padLeft + 10;
        options.grid.right = padRight + 10 + (props.config.export === true || props.config.export === 'true' ? 20 : 0);
        this.chart.padLeft = options.grid.left;
        this.chart.padRight = options.grid.right;

        // 'nw': 'Top, left',
        // 'ne': 'Top, right',
        // 'sw': 'Bottom, left',
        // 'se': 'Bottom, right',
        options.legend = !props.config.legend || props.config.legend === 'none' ? undefined : {
            data:   props.config.l.map(oneLine => oneLine.name),
            show:   true,
            left:   props.config.legend === 'nw' || props.config.legend === 'sw' ?  this.chart.padLeft  + 1 : undefined,
            right:  props.config.legend === 'ne' || props.config.legend === 'se' ?  this.chart.padRight + 1 : undefined,
            top:    props.config.legend === 'nw' || props.config.legend === 'ne' ?  10 : undefined,
            bottom: props.config.legend === 'sw' || props.config.legend === 'se' ?  xAxisHeight + 20 : undefined,
            backgroundColor: props.config.legBg || undefined,
            textStyle: {
                color: props.config.legColor || undefined
            },
        };

        if (!props.config.grid_color) {
            options.yAxis.forEach(axis => axis.splitLine && delete axis.splitLine.lineStyle);
            options.xAxis.forEach(axis => axis.splitLine && delete axis.splitLine.lineStyle);
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
        this.chart.diff        = this.chart.xMax - this.chart.xMin;
        this.chart.withTime    = this.chart.diff < 3600000 * 24 * 7;
        this.chart.withSeconds = this.chart.diff < 60000 * 30;

        console.log(`[ChartView ] [${new Date().toISOString()}] setNewRange: ${!!updateChart}, {min: ${this.chart.xMin}, max: ${this.chart.xMax}}`);
        if (updateChart) {
            this.updateDataTimer && clearTimeout(this.updateDataTimer);
            this.updateDataTimer = null;
            this.props.onRangeChange && this.props.onRangeChange({start: this.chart.xMin, end: this.chart.xMax});
        } else {
            console.log(`[ChartView ] [${new Date().toISOString()}] setOption in setNewRange`);
            this.option.xAxis[0].min = this.chart.xMin;
            this.option.xAxis[0].max = this.chart.xMax;

            this.echartsReact && typeof this.echartsReact.getEchartsInstance === 'function' &&
            this.echartsReact.getEchartsInstance().setOption({
                xAxis: {
                    min: this.chart.xMin,
                    max: this.chart.xMax,
                }
            });
        }
    }

    onMouseMove = e => {
        if (this.mouseDown) {
            if (this.divResetButton.current && this.divResetButton.current.style.display !== 'block') {
                 this.divResetButton.current.style.display = 'block';
            }
            const chart = this.chart;
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
        let diff = this.chart.xMax - this.chart.xMin;
        const width = this.state.chartWidth - this.chart.padRight - this.chart.padLeft;
        const x = e.offsetX - this.chart.padLeft;
        const pos = x / width;

        const oldDiff = diff;
        const amount = e.wheelDelta > 0 ? 1.1 : 0.9;
        diff = diff * amount;
        const move = oldDiff - diff;
        this.chart.xMax += move * (1 - pos);
        this.chart.xMin -= move * pos;

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
        const pageX = touches[touches.length - 1].pageX - this.chart.padLeft;
        if (this.mouseDown) {
            if (touches.length > 1) {
                // zoom
                const fingerWidth = Math.abs(touches[0].pageX - touches[1].pageX);
                if (this.chart.lastWidth !== null && fingerWidth !== this.chart.lastWidth) {
                    let diff = this.chart.xMax - this.chart.xMin;
                    const chartWidth = this.state.chartWidth - this.chart.padRight - this.chart.padLeft;

                    const amount     = fingerWidth > this.chart.lastWidth ? 1.1 : 0.9;
                    const positionX  = touches[0].pageX > touches[1].pageX ?
                        touches[1].pageX - this.chart.padLeft + fingerWidth / 2 :
                        touches[0].pageX - this.chart.padLeft + fingerWidth / 2;

                    const pos = positionX / chartWidth;

                    const oldDiff = diff;
                    diff = diff * amount;
                    const move = oldDiff - diff;

                    this.chart.xMax += move * (1 - pos);
                    this.chart.xMin -= move * pos;

                    this.setNewRange();
                }
                this.chart.lastWidth = fingerWidth;
            } else {
                // swipe
                const moved = this.chart.lastX - pageX;
                const diff  = this.chart.xMax - this.chart.xMin;
                const chartWidth = this.state.chartWidth - this.chart.padRight - this.chart.padLeft;

                const shift = Math.round(moved * diff / chartWidth);
                this.chart.xMin += shift;
                this.chart.xMax += shift;

                this.setNewRange();
            }
        }
        this.chart.lastX = pageX;
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
            if (this.echartsReact && typeof this.echartsReact.getEchartsInstance === 'function') {
                const chartInstance = this.echartsReact.getEchartsInstance();
                console.log(chartInstance._theme);
            }
            this.option = this.option || this.getOptions();

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
            return <Fab
                ref={ this.divExportButton }
                size="small"
                color="default"
                style={{display: 'none'}}
                className={this.props.classes.resetButton}
                title={I18n.t('Reset pan and zoom')}
                onClick={() => {
                    if (this.echartsReact && typeof this.echartsReact.getEchartsInstance === 'function') {
                        const chartInstance = this.echartsReact.getEchartsInstance();
                        const base64 = chartInstance.getDataURL({
                            pixelRatio: 2,
                            backgroundColor: this.props.config.window_bg || '#FFF',
                        });

                        const linkSource = `data:image/png;base64,${base64}`;
                        const downloadLink = document.createElement('a');
                        document.body.appendChild(downloadLink);

                        downloadLink.href = linkSource;
                        downloadLink.target = '_self';
                        downloadLink.download = 'chart.svg';
                        downloadLink.click();
                    }
                }}
            >
                <IconReset className={this.props.classes.resetButtonIcon}/>
            </Fab>;
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