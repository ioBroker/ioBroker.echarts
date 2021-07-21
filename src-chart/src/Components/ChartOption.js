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
    if (!num) {
        return '00';
    }
    // on safari 9.0 it is unknown
    // return num.toString().padStart(2, '0');
    num = (num || '').toString();
    if (num.length < 2) {
        return '0' + num;
    } else {
        return num;
    }
}

function rgba2hex(color) {
    const rgb = color.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i);
    return rgb ?
        '#' +
        padding2(parseInt(rgb[1], 10).toString(16)) +
        padding2(parseInt(rgb[2], 10).toString(16)) +
        padding2(parseInt(rgb[3], 10).toString(16)) : color;
}

function brighterColor(color, amt) {
    let usePound = false;

    if (color.includes('rgb')) {
        color = rgba2hex(color);
    }

    if (color[0] === '#') {
        color = color.slice(1);
        usePound = true;
    }

    const num = parseInt(color,16);

    let r = (num >> 16) + amt;
    if (r > 255) {
        r = 255;
    } else if (r < 0) {
        r = 0;
    }

    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) {
        b = 255;
    } else if (b < 0) {
        b = 0;
    }

    let g = (num & 0x0000FF) + amt;
    if (g > 255) {
        g = 255;
    } else if (g < 0) {
        g = 0;
    }

    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
}

//----- copied from
const Gradient = function (colorStops) {
    this.colorStops = colorStops || [];
};

Gradient.prototype = {
    constructor: Gradient,
    addColorStop: function (offset, color) {
        this.colorStops.push({
            offset: offset,
            color: color
        });
    }
};
const LinearGradient = function (x, y, x2, y2, colorStops, globalCoord) {
    // Should do nothing more in this constructor. Because gradient can be
    // declared by `color: {type: 'linear', colorStops: ...}`, where
    // this constructor will not be called.
    this.x = x == null ? 0 : x;
    this.y = y == null ? 0 : y;
    this.x2 = x2 == null ? 1 : x2;
    this.y2 = y2 == null ? 0 : y2; // Can be cloned

    this.type = 'linear'; // If use global coord

    this.global = globalCoord || false;
    Gradient.call(this, colorStops);
};

LinearGradient.prototype = {
    constructor: LinearGradient
};

function zrUtilInherits(clazz, baseClazz) {
    const clazzPrototype = clazz.prototype;

    function F() {}

    F.prototype = baseClazz.prototype;
    clazz.prototype = new F();

    for (const prop in clazzPrototype) {
        if (clazzPrototype.hasOwnProperty(prop)) {
            clazz.prototype[prop] = clazzPrototype[prop];
        }
    }

    clazz.prototype.constructor = clazz;
    clazz.superClass = baseClazz;
}
zrUtilInherits(LinearGradient, Gradient);

class ChartOption {
    constructor(moment, themeType, calcTextWidth, config, compact) {
        this.moment = moment;
        if (!this.moment) {
            throw new Error('moment must be set and initialized');
        }

        this.config = config ? JSON.parse(JSON.stringify(config)) : null;
        this.calcTextWidth = calcTextWidth;
        this.themeType = themeType || 'light';
        this.chart = {yAxis: []};
        this.isTouch = typeof window !== 'undefined' ? 'ontouchstart' in window.document.documentElement : false;
        this.compact = compact;
        this.lastFormattedTime = null;
    }

    setThemeName(themeType) {
        this.themeType = themeType || 'light';
    }

    setConfig(config) {
        this.config = config;
    }

    getHelperChartData() {
        return this.chart;
    }

    convertData(data, i, yAxisIndex) {
        const values = data[i];
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

    getSeries(data, theme) {
        this.chart.xMin = null;
        this.chart.xMax = null;
        let colorCount = 0;

        return this.config.l.map((oneLine, i) => {
            const color = oneLine.color || (THEMES[theme] ? THEMES[theme][colorCount % THEMES[theme].length] : '');
            if (!oneLine.color) {
                colorCount++;
            }

            oneLine.shadowsize = parseFloat(oneLine.shadowsize) || 0;
            if (oneLine.dashes === 'false') {
                oneLine.dashes = false;
            } else if (oneLine.dashes === 'true') {
                oneLine.dashes = true;
            }

            const yAxisIndex = oneLine.commonYAxis === '' || oneLine.commonYAxis === undefined ? i : parseInt(oneLine.commonYAxis) || 0;
            const cfg = {
                name: oneLine.name,
                clip: true,
                xAxisIndex: 0,

                silent: true,
                yAxisIndex,
                type: oneLine.chartType === 'scatterplot' ? 'scatter' : 'line',
                showSymbol: oneLine.chartType === 'scatterplot' || oneLine.points,
                //hoverAnimation: false,
                animation: false,
                step: oneLine.chartType === 'steps' ? 'end' : (oneLine.chartType === 'stepsStart' ? 'start' : undefined) ,
                smooth: oneLine.chartType === 'spline',
                data: this.convertData(data, i, yAxisIndex),
                itemStyle: {color},
                symbolSize: (oneLine.chartType === 'scatterplot' || oneLine.points) ? (oneLine.symbolSize || 3) : undefined,
                symbol: 'circle',
                emphasis: {
                    scale: false,
                    focus: 'none',
                    blurScope: 'none',
                    lineStyle: {
                        width:          oneLine.thickness !== undefined ? parseFloat(oneLine.thickness) : 1,
                        shadowBlur:     oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                        shadowOffsetY:  oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                        shadowColor:    color,
                        type:           oneLine.dashes ? 'dashed' : (oneLine.lineStyle || 'solid'),
                    },
                },
                lineStyle: {
                    width:          oneLine.thickness !== undefined ? parseFloat(oneLine.thickness) : 1,
                    shadowBlur:     oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                    shadowOffsetY:  oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                    shadowColor:    color,
                    type:           oneLine.dashes ? 'dashed' : (oneLine.lineStyle || 'solid'),
                }
            };
            if (parseFloat(oneLine.fill)) {
                let _color;
                if (!this.isTouch) {
                    _color = new LinearGradient(0, 0, 0, 1, [{
                        offset: 0,
                        color: brighterColor(color, 30)
                    }, {
                        offset: 1,
                        color
                    }]);
                } else {
                    _color = color;
                }
                cfg.areaStyle = {
                    color: _color,
                    opacity: parseFloat(oneLine.fill) || 0,
                };
            }

            return cfg;
        });
    }

    getXAxis() {
        return [
            {
                type: 'time',
                splitLine: {
                    show: !this.config.grid_hideX,
                    lineStyle: this.config.l[0].xaxe === 'off' ? {color: 'rgba(0,0,0,0)', type: 'dashed'} : this.config.grid_color ? {
                        color: this.config.grid_color,
                        type: 'dashed',
                    } : {type: 'dashed'},
                },
                splitNumber: parseInt(this.config.l[0].xticks, 10) || undefined,
                position: this.config.l[0].xaxe === 'top' ? 'top' : 'bottom',
                min: this.chart.xMin,
                max: this.chart.xMax,
                axisTick: {
                    alignWithLabel: true,
                    lineStyle: this.config.l[0].xaxe === 'off' ?
                        {color: 'rgba(0,0,0,0)'}
                        :
                        (this.config.x_ticks_color ? {color: this.config.x_ticks_color} : undefined),
                },
                axisLabel: {
                    show: !this.compact,
                    formatter: (value, _index) => this.xFormatter(value, _index, this.config.l[0].xaxe === 'top'),
                    fontSize: parseInt(this.config.x_labels_size, 10) || 12,
                    color: this.config.l[0].xaxe === 'off' ? 'rgba(0,0,0,0)' : (this.config.x_labels_color || undefined),
                    rich: {
                        a: {
                            fontWeight: 'bold',
                        },
                        b: {
                            opacity: 0,
                        },
                    }
                }
            }
        ];
    }

    getYAxis(theme, series) {
        return this.config.l.map((oneLine, i) => {
            if (!oneLine || (oneLine.commonYAxis !== '' && oneLine.commonYAxis !== undefined)) {
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
                if (isNaN(yMax)) {
                    // auto calculate
                    yMax = yAxis[i].max + diff * 0.1; // max + 10%
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
                if (isNaN(yMin)) {
                    yMin = undefined;
                }
                if (isNaN(yMax)) {
                    yMax = undefined;
                }
            }

            let color = oneLine.yaxe === 'off' ? 'rgba(0,0,0,0)' : (this.config.grid_color || undefined);
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
                    show: !this.config.grid_hideY,
                    lineStyle: {
                        color: color || undefined,
                        type: 'dashed',
                    },
                } : undefined,
                splitNumber: parseInt(oneLine.yticks, 10) || undefined,
                axisLabel: {
                    show: !this.compact,
                    formatter: value => this.yFormatter(value, i, true),
                    color: oneLine.yaxe === 'off' || oneLine.yaxe === 'leftColor' || oneLine.yaxe === 'rightColor' ? color : (this.config.y_labels_color || undefined),
                    fontSize: parseInt(this.config.y_labels_size, 10) || 12
                },
                axisTick: {
                    alignWithLabel: true,
                    lineStyle: color ? {color} : (this.config.y_ticks_color ? {color: this.config.y_ticks_color} : undefined)
                }
            };
        });
    }

    getMarkings(options) {
        // fill markings
        this.config.marks && this.config.marks.forEach(oneMark => {
            if (!oneMark) {
                return;
            }
            const lowerLimitFloat = oneMark.lowerValue !== undefined ? oneMark.lowerValue : parseFloat(oneMark.lowerValueOrId);
            const upperLimitFloat = oneMark.upperValue !== undefined ? oneMark.upperValue : parseFloat(oneMark.upperValueOrId);
            const isLowerNumber   = lowerLimitFloat !== null && !isNaN(lowerLimitFloat);
            const isUpperNumber   = upperLimitFloat !== null && !isNaN(upperLimitFloat);

            const series = options.series[oneMark.lineId];

            if (!series) {
                console.error('Mark line has no chart line');
                return;
            }

            if (isLowerNumber && isUpperNumber) {
                // area
                series.markArea = series.markArea || {
                    symbol: ['none', 'none'],
                    data: []
                };
                series.markArea.data.push([
                    {
                        yAxis: lowerLimitFloat,
                        name: oneMark.text || '',
                        itemStyle: {
                            color:       oneMark.color || series.itemStyle.color,
                            borderWidth: 0,
                            opacity:     parseFloat(oneMark.fill) || 0,
                        }
                    },
                    {
                        yAxis: upperLimitFloat
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
                        data: []
                    };

                    series.markLine.data.push({
                        yAxis: limitFloat,
                        name: oneMark.text,
                        lineStyle: {
                            color:          oneMark.color || series.itemStyle.color,
                            width:          parseFloat(oneMark.ol) || 1,
                            shadowBlur:     parseFloat(oneMark.os) ? parseFloat(oneMark.os) + 1 : 0,
                            shadowOffsetY:  parseFloat(oneMark.os) ? parseFloat(oneMark.os) + 1 : 0,
                            shadowColor:    oneMark.color,
                            type:           oneMark.lineStyle || 'solid',
                        },
                        label: {
                            show: !!oneMark.text,
                            formatter: param => param.name,
                            position: oneMark.textPosition === 'r' ? 'end' : 'start',
                            distance: (-1 * oneMark.textOffset) || -35,
                            textStyle: {
                                color: oneMark.textColor || '#FFF',
                                fontStyle: 'normal',
                                fontSize: oneMark.textSize || undefined,
                            }
                        },
                    });

                    if (this.config.l[oneMark.lineId]) {
                        // if minimum not set
                        let yMin = parseFloat(this.config.l[oneMark.lineId].min);
                        if (isNaN(yMin) && this.chart.yAxis[oneMark.lineId]) {
                            if (this.chart.yAxis[oneMark.lineId].min > limitFloat && limitFloat < 0) {
                                options.yAxis[0].min = limitFloat;
                            }
                        }
                        let yMax = parseFloat(this.config.l[oneMark.lineId].min);
                        if (isNaN(yMax) && this.chart.yAxis[oneMark.lineId]) {
                            if (this.chart.yAxis[oneMark.lineId].max < limitFloat) {
                                options.yAxis[0].max = limitFloat;
                            }
                        }
                    }
                }
            }
        });

        return options;
    }

    yFormatter(val, line, withUnit, interpolated, ignoreWidth) {
        if (this.config.l[line].type === 'boolean') {
            return val ? 'TRUE' : 'FALSE';
        }

        if (val === null || val === undefined) {
            return '';
        }

        const afterComma = this.config.l[line].afterComma;
        if (afterComma !== undefined && afterComma !== null) {
            val = parseFloat(val);
            if (this.config.useComma) {
                return val.toFixed(afterComma).replace('.', ',') + (withUnit ? this.config.l[line].unit : '');
            } else {
                return val.toFixed(afterComma) + (withUnit ? this.config.l[line].unit : '');
            }
        } else {
            if (interpolated) {
                val = Math.round(val * 10000) / 10000;
            }

            if (this.config.useComma) {
                val = parseFloat(val) || 0;
                return val.toString().replace('.', ',') + (withUnit ? this.config.l[line].unit : '');
            } else {
                return val.toString() + (withUnit ? this.config.l[line].unit : '');
            }
        }
    }

    isXLabelHasBreak() {
        if (this.config.timeFormat) {
            return this.config.timeFormat.replace('<br/>', '\n').includes('\n');
        } else
        if (this.chart.withSeconds) {
            return true;
        } else if (this.chart.withTime) {
            return true;
        } else {
            return true;
        }
    }

    xFormatter(value, _index, isTop) {
        const date = new Date(value);
        if (this.config.timeFormat) {
            return this.moment(date).format(this.config.timeFormat).replace('<br/>', '\n');
        } else {
            let dateTxt = '';
            const dateInMonth = date.getDate();
            if (this.chart.withSeconds || this.chart.withTime) {
                let showDate = false;
                if (_index < 2 || this.lastFormattedTime === null || value < this.lastFormattedTime) {
                    showDate = true;
                } else
                if (!showDate && new Date(this.lastFormattedTime).getDate() !== dateInMonth) {
                    showDate = true;
                }
                if (showDate) {
                    if (isTop) {
                        dateTxt = '{a|' + padding2(dateInMonth) + '.' + padding2(date.getMonth() + 1) + '.}\n';
                    } else {
                        dateTxt = '{b|..}\n{a|' + padding2(dateInMonth) + '.' + padding2(date.getMonth() + 1) + '.}';
                    }
                }
                this.lastFormattedTime = value;
                if (isTop) {
                    if (this.chart.withSeconds) {
                        return dateTxt + padding2(date.getHours()) + ':' + padding2(date.getMinutes()) + ':' + padding2(date.getSeconds()) + (dateTxt ? '{b|..}' : '');
                    } else if (this.chart.withTime) {
                        return dateTxt + padding2(date.getHours()) + ':' + padding2(date.getMinutes()) + (dateTxt ? '{b|..}' : '');
                    }
                } else {
                    if (this.chart.withSeconds) {
                        return padding2(date.getHours()) + ':' + padding2(date.getMinutes()) + ':' + padding2(date.getSeconds()) + dateTxt;
                    } else if (this.chart.withTime) {
                        return padding2(date.getHours()) + ':' + padding2(date.getMinutes()) + dateTxt;
                    }
                }
            } else {
                return padding2(dateInMonth) + '.' + padding2(date.getMonth() + 1) + '\n' + date.getFullYear();
            }
        }
    }

    // result.val === null => start and end are null
    // result === null => no start or no end
    getInterpolatedValue(i, ts, type, hoverNoNulls) {
        const data = this.option.series[i].data;
        if (!data || !data[0] || data[0].value[0] > ts || data[data.length - 1].value[0] < ts) {
            return null;
        }

        for (let k = 0; k < data.length - 1; k++) {
            if (data[k].value[0] === ts) {
                // Calculate
                return {exact: true, val: data[k].value[1]};
            } else if (data[k].value[0] < ts && ts < data[k + 1].value[0]) {
                const y1 = data[k].value[1];
                const y2 = data[k + 1].value[1];
                if (y2 === null || y2 === undefined || y1 === null || y1 === undefined) {
                    return hoverNoNulls ? null : {exact: false, val: null};
                }
                if (type === 'boolean') {
                    return {exact: false, val: y1};
                }

                // interpolate
                const diff = data[k + 1].value[0] - data[k].value[0];
                const kk = (data[k + 1].value[0] - ts) / diff;
                return {exact: false, val: (1 - kk) * (y2 - y1) + y1};
            }
        }
        return hoverNoNulls ? null : {exact: false, val: null};
    }

    renderTooltip(params) {
        const ts = params[0].value[0];
        const date = new Date(ts);
        const hoverNoNulls = this.config.hoverNoNulls === true || this.config.hoverNoNulls === 'true';

        const values = this.option.series.map((line, i) => {
            const p = params.find(param => param.seriesIndex === i);
            let interpolated;
            if (p) {
                interpolated = {exact: p.data.exact !== undefined ? p.data.exact : true, val: p.value[1]};
            }

            interpolated = interpolated || this.getInterpolatedValue(i, ts, this.config.l[i].type, hoverNoNulls);
            if (!interpolated) {
                return '';
            }
            if (!interpolated.exact && this.config.hoverNoInterpolate) {
                return '';
            }

            const val = interpolated.val === null ?
                'null' :
                this.yFormatter(interpolated.val, i, false, !interpolated.exact, true);

            return `<div style="width: 100%; display: inline-flex; justify-content: space-around; color: ${line.itemStyle.color}">` +
                `<div style="display: flex;margin-right: 4px">${line.name}:</div>` +
                `<div style="display: flex; flex-grow: 1"></div>` +
                `<div style="display: flex;">${interpolated.exact ? '' : 'i '}<b>${val}</b>${interpolated.val !== null ? this.config.l[i].unit : ''}</div>` +
                `</div>`;
        });

        const format = this.config.timeFormat || 'dd, MM Do YYYY, HH:mm:ss.SSS';
        return `<b>${this.moment(date).format(format)}</b><br/>${values.filter(t => t).join('<br/>')}`;
    }

    getLegend(actualValues) {
        if (!this.config.legend || this.config.legend === 'none') {
            return undefined;
        } else {
            const legend = {
                data:   this.config.l.map(oneLine => oneLine.name),
                show:   true,
                left:   this.config.legend === 'nw' || this.config.legend === 'sw' ?  this.chart.padLeft   + 1 : undefined,
                right:  this.config.legend === 'ne' || this.config.legend === 'se' ?  this.chart.padRight  + 1 : undefined,
                top:    this.config.legend === 'nw' || this.config.legend === 'ne' ?  this.chart.padTop    + 2 : undefined,
                bottom: this.config.legend === 'sw' || this.config.legend === 'se' ?  this.chart.padBottom + 2 : undefined,
                backgroundColor: this.config.legBg || undefined,
                formatter: (name, arg) => {
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
                    fontSize:this.config.legFontSize,
                },
                orient: this.config.legendDirection || 'horizontal',
                selected: {}
            };

            this.config.l.forEach(oneLine => legend.selected[oneLine.name] = oneLine.hide !== true);

            return legend;
        }
    }

    getTitle() {
        if (!this.config || !this.config.title) {
            return undefined;
        }
        let titlePos = {};
        (this.config.titlePos || 'top:35;left:65').split(';').forEach(a => {
            const parts = a.split(':');
            titlePos[parts[0].trim()] = parseInt(parts[1].trim(), 10);
        });

        return {
            text: this.config.title,
            textStyle: {
                fontSize: this.config.titleSize ? parseInt(this.config.titleSize, 10) : 20,
                color:    this.config.titleColor || (this.themeType === 'light' ? '#000' : '#FFF')
            },
            textVerticalAlign: titlePos.bottom      ? 'bottom' : 'top',
            textAlign:         titlePos.left === 50 ? 'center' : (titlePos.right === -5 ? 'right' : 'left'),
            top:               titlePos.top  === 35 ? 5 + this.chart.padTop : (titlePos.top === 50 ? '50%'   : undefined),
            left:              titlePos.left === 50 ? '50%'    : (titlePos.left  === 65 ? this.chart.padLeft : undefined),
            bottom:            titlePos.bottom      ? (titlePos.bottom > 0 ? titlePos.bottom + this.chart.padBottom - 15 : titlePos.bottom) : undefined,
            right:             titlePos.right === 5 ? this.chart.padRight : undefined,
        };
    }

    getOption(data, config, actualValues) {
        if (config) {
            this.config = JSON.parse(JSON.stringify(config));
        }
        const useCanvas = this.isTouch && this.config.zoom;

        let theme = this.config.theme;
        if (!theme || theme === 'default') {
            theme = this.themeType === 'light' ? 'roma' : 'dark-bold';
        }

        this.debug = this.config && this.config.debug;

        this.debug && console.log(`[ChartView ] [${new Date().toISOString()}] ${JSON.stringify(this.config, null, 2)}`);

        const series = this.getSeries(data, theme);

        if (this.config.start) {
            if (this.chart.xMax < this.config.end) {
                this.chart.xMax = this.config.end;
            }
            if (this.chart.xMin > this.config.start) {
                this.chart.xMin = this.config.start;
            }
        }

        this.chart.diff        = this.chart.xMax - this.chart.xMin;
        this.chart.withTime    = this.chart.diff < 3600000 * 24 * 7;
        this.chart.withSeconds = this.chart.diff < 60000 * 30;
        this.config.y_labels_size = parseInt(this.config.y_labels_size, 10) || 12;
        this.config.x_labels_size = parseInt(this.config.x_labels_size, 10) || 12;
        this.config.legFontSize   = parseInt(this.config.legFontSize, 10) || 12;

        const yAxis = this.getYAxis(theme, series);
        const xAxis = this.getXAxis();

        const option = {
            theme,
            backgroundColor: 'transparent',
            animation: !this.config.noAnimation && !this.config.noLoader,
            grid: {
                backgroundColor: this.config.bg_custom || 'transparent',
                show: !!this.config.bg_custom,
                left:   0,
                top:    8,
                right:  0,
                bottom: this.compact ? 4 : (this.isXLabelHasBreak() ? 40 : 24),
            },
            tooltip: !this.compact && this.config.hoverDetail ? {
                trigger: 'axis',
                formatter: params => this.renderTooltip(params),
                hoverAnimation: true,
                axisPointer: {
                    animation: true
                }
            } : undefined,
            xAxis,
            yAxis,
            /*toolbox: false && (this.config.export === true || this.config.export === 'true') ? {
                left: 'right',
                feature: {
                    saveAsImage: {
                        title: props.t('Save as image'),
                        show: true,
                    }
                }
            } : undefined,*/
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
            series,
            useCanvas
        };

        this.getMarkings(option);

        if (!this.compact) {
            // calculate padding: left and right
            let padLeft  = 0;
            let padRight = 0;
            let padBottom = 0;
            let padTop = 0;
            series.forEach((ser, i) => {
                let yAxis = option.yAxis[ser.yAxisIndex];
                if (!yAxis) {
                    // seems this axis is defined something else
                    const cY = this.config.l[ser.yAxisIndex] ? this.config.l[ser.yAxisIndex].commonYAxis : undefined;
                    if (cY !== undefined) {
                        yAxis = option.yAxis[cY];
                    } else {
                        console.log('Cannot find Y axis for line ' + i);
                        return;
                    }
                }

                let minTick = this.yFormatter(yAxis.min, i, true);
                let maxTick = this.yFormatter(!yAxis.min && yAxis.max === yAxis.min ? 0.8 : yAxis.max, i, true);

                if (xAxis[0].position === 'top') {
                    padTop = this.isXLabelHasBreak() ? 40 : 24;
                } else
                if (xAxis[0].position !== 'off' || xAxis[0].position === 'bottom') {
                    padBottom = this.isXLabelHasBreak() ? 40 : 24;
                }

                const position = yAxis.position;
                if (position === 'off' || (yAxis.axisLabel && yAxis.axisLabel.color === 'rgba(0,0,0,0)')) {
                    return;
                }
                let wMin = this.calcTextWidth(minTick, this.config.y_labels_size) + 4;
                let wMax = this.calcTextWidth(maxTick, this.config.y_labels_size) + 4;
                if (position !== 'right' && position !== 'rightColor') {
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
            option.grid.left    = padLeft  + 10;
            option.grid.right   = padRight + 10 + (this.config.export === true || this.config.export === 'true' ? 20 : 0);
            // if xAxis shown, let the place for last value
            if (option.grid.right <= 10 && (padTop || padBottom)) {
                option.grid.right = 18;
            }
            if (option.grid.left <= 10 && (padTop || padBottom)) {
                option.grid.left = 18;
            }
            this.chart.padLeft  = option.grid.left;
            this.chart.padRight = option.grid.right;
            if (!padTop) {
                padTop = 8;
            }
            if (!padBottom) {
                padBottom = 8;
            }
            option.grid.top      = padTop;
            option.grid.bottom   = padBottom;
            this.chart.padTop    = option.grid.top;
            this.chart.padBottom = option.grid.bottom;
        }

        // 'nw': 'Top, left',
        // 'ne': 'Top, right',
        // 'sw': 'Bottom, left',
        // 'se': 'Bottom, right',
        option.legend = this.getLegend(actualValues);
        option.title  = this.getTitle();

        if (!this.config.grid_color) {
            option.yAxis.forEach(axis => axis.splitLine && delete axis.splitLine.lineStyle);
            option.xAxis.forEach(axis => axis.splitLine && delete axis.splitLine.lineStyle);
        }

        this.option = option;
        return this.option;
    }
}

export default ChartOption;
