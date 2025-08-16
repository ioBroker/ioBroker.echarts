import React, { useEffect, useState } from 'react';

import { MenuItem, Select } from '@mui/material';

import { Timeline as ChartIcon } from '@mui/icons-material';

import { I18n, IconClosed as FolderIcon, Utils } from '@iobroker/adapter-react-v5';
import type {
    RxRenderWidgetProps,
    RxWidgetInfo,
    RxWidgetInfoAttributesField,
    RxWidgetInfoCustomComponentContext,
    VisRxWidgetProps,
    VisRxWidgetState,
    WidgetData,
} from '@iobroker/types-vis-2';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';

interface EchartsRxData {
    noCard?: boolean;
    noChartBackground?: boolean;
    echart_oid?: string;
    history_instance?: string;
    history_oid?: string;
    chartType?: 'auto' | 'line' | 'bar' | 'scatterplot' | 'steps' | 'stepsStart' | 'spline';
    aggregate?: 'minmax' | 'average' | 'min' | 'max' | 'total' | 'raw' | 'onchange';
    live?:
        | ''
        | '5'
        | '10'
        | '15'
        | '20'
        | '30'
        | '60'
        | '120'
        | '300'
        | '600'
        | '900'
        | '1200'
        | '1800'
        | '3600'
        | '7200'
        | '10800'
        | '21600'
        | '43200'
        | '86400';
    aggregateType?: 'count' | 'step';
    aggregateSpan?: number;
    xticks?: string;
    yticks?: string;
    range?:
        | '10'
        | '30'
        | '60'
        | '120'
        | '180'
        | '360'
        | '720'
        | '1440'
        | '2880'
        | '4320'
        | '10080'
        | '20160'
        | '1m'
        | '2m'
        | '3m'
        | '6m'
        | '1y'
        | '2y';
    relativeEnd?:
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
        | 'month'
        | 'year';

    timeType?: 'relative' | 'static';
    start?: string;
    end?: string;
    start_time?: string;
    end_time?: string;
    ticks?: string;
}

function ChartSelector(props: {
    field: RxWidgetInfoAttributesField;
    context: RxWidgetInfoCustomComponentContext;
    data: EchartsRxData;
    setData: (newData: WidgetData) => void;
}): React.JSX.Element | null {
    const [charts, setCharts] = useState<{ path: string; name: string; level: number; id?: string }[] | null>(null);
    useEffect(() => {
        void props.context.socket.getObjectViewSystem('chart', 'echarts.', 'echarts.\u9999').then(res => {
            const presets: string[] = [];
            if (res) {
                Object.values(res).forEach(
                    preset => preset._id && !preset._id.toString().endsWith('.') && presets.push(preset._id),
                );
            }

            const items: { path: string; name: string; level: number; id?: string }[] = [];
            // Build a tree
            presets.forEach(id => {
                const parts = id.split('.');
                if (parts.length >= 3) {
                    parts.shift(); // echarts
                    parts.shift(); // 0
                    const path = [];
                    for (let p = 0; p < parts.length - 1; p++) {
                        path.push(parts[p]);
                        const preset = path.join('.');
                        if (!items.find(pr => pr.path === preset)) {
                            items.push({
                                path: preset,
                                name: parts[p],
                                level: path.length,
                            });
                        }
                    }
                    path.push(parts[parts.length - 1]);
                    items.push({
                        path: parts.join('.'),
                        name: parts[parts.length - 1],
                        level: path.length,
                        id,
                    });
                }
            });
            items.sort((a, b) => a.path.localeCompare(b.path));

            setCharts(items);
        });
    }, []);

    if (!charts) {
        return null;
    }

    return (
        <Select
            style={{ width: '100%' }}
            value={props.data[props.field.name as keyof EchartsRxData] || ''}
            onChange={e => {
                const data = { ...props.data, [props.field.name as keyof EchartsRxData]: e.target.value };
                props.setData(data);
            }}
            renderValue={value => value?.toString().substring('echarts.0.'.length) || ''}
            variant="standard"
        >
            <MenuItem
                key="___none"
                value=""
            >
                {I18n.t('echarts_none')}
            </MenuItem>
            {charts.map(chart => (
                <MenuItem
                    key={chart.name}
                    value={chart.id || chart.name}
                    disabled={!chart.id}
                >
                    <div style={{ paddingLeft: chart.level * 20, display: 'flex' }}>
                        <span style={{ paddingRight: 4 }}>{!chart.id ? <FolderIcon /> : <ChartIcon />}</span>
                        {chart.name}
                    </div>
                </MenuItem>
            ))}
        </Select>
    );
}

interface PresetLine {
    name: string;
    id: string;
    instance: string;
    thickness: number;
    chartType: 'steps' | 'line';
    aggregate: 'onchange' | 'minmax';
    isBoolean?: boolean;
    color?: string;
    unit?: string;
    yaxe?: 'off';
    min?: string;
    xticks?: string;
    yticks?: string | number;
    fill?: number;
    symbolSize?: number;
    validTime?: number;
}

interface PresetLines {
    marks: [];
    lines: PresetLine[];
    zoom: true;
    hoverDetail: true;
    aggregate?: 'minmax' | 'average' | 'min' | 'max' | 'total' | 'raw' | 'onchange';
    chartType?: 'auto' | 'line' | 'bar' | 'scatterplot' | 'steps' | 'stepsStart' | 'spline';
    live?:
        | ''
        | '5'
        | '10'
        | '15'
        | '20'
        | '30'
        | '60'
        | '120'
        | '300'
        | '600'
        | '900'
        | '1200'
        | '1800'
        | '3600'
        | '7200'
        | '10800'
        | '21600'
        | '43200'
        | '86400';
    timeType?: 'relative' | 'static';
    aggregateType: 'count' | 'step';
    aggregateSpan: number;
    ticks: string;
    range?:
        | '10'
        | '30'
        | '60'
        | '120'
        | '180'
        | '360'
        | '720'
        | '1440'
        | '2880'
        | '4320'
        | '10080'
        | '20160'
        | '1m'
        | '2m'
        | '3m'
        | '6m'
        | '1y'
        | '2y';
    relativeEnd?:
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
        | 'month'
        | 'year';
    start: string;
    end: string;
    start_time: string;
    end_time: string;
    noBorder: 'noborder';
    noedit: false;
    animation: 0;
    legend: '';
}

export interface EchartsState extends VisRxWidgetState {
    presetData: PresetLines | null;
}

export default class Echarts extends (window.visRxWidget as typeof VisRxWidget)<EchartsRxData, EchartsState> {
    private refIframe = React.createRef<HTMLIFrameElement>();
    private ready = false;
    private lastPresetData = '';
    private systemConfig: ioBroker.SystemConfigObject | null = null;
    private object: ioBroker.Object | null = null;

    constructor(props: VisRxWidgetProps) {
        super(props);
        this.state = {
            ...this.state,
            presetData: null,
        };
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplEchartsChart',

            visSet: 'echarts',
            visSetLabel: 'set_label', // Label of widget set
            visSetColor: '#aa314d', // color of a widget set

            visWidgetLabel: 'E-Charts', // Label of widget
            visName: 'E-Charts',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        {
                            name: 'noCard',
                            label: 'without_card',
                            type: 'checkbox',
                            default: false,
                        },
                        {
                            name: 'widgetTitle',
                            label: 'name',
                            hidden: '!!data.noCard',
                        },
                        {
                            label: 'noChartBackground',
                            name: 'noChartBackground',
                            type: 'checkbox',
                            default: true,
                            hidden: '!data.noCard',
                        },
                        {
                            label: 'echart_oid',
                            name: 'echart_oid',
                            type: 'custom',
                            hidden: '!!data.history_instance || !!data.history_oid',
                            component: (field, data, setData, props) => (
                                <ChartSelector
                                    field={field}
                                    data={data as EchartsRxData}
                                    setData={setData}
                                    context={props.context}
                                />
                            ),
                        },
                        {
                            label: 'history_instance',
                            name: 'history_instance',
                            type: 'instance',
                            hidden: '!!data.echart_oid',
                            adapter: '_dataSources',
                        },
                        {
                            label: 'history_oid',
                            name: 'history_oid',
                            type: 'id',
                            hidden: '!!data.echart_oid || !data.history_instance',
                            // @ts-expect-error fixed in next vis-2/types
                            filter: data => ({ common: { custom: data.history_instance } }),
                        },
                        {
                            label: 'chartType',
                            name: 'chartType',
                            default: 'auto',
                            hidden: '!data.history_oid',
                            type: 'select',
                            options: [
                                { value: 'auto', label: 'Auto' },
                                { value: 'line', label: 'Line' },
                                { value: 'bar', label: 'Bar' },
                                { value: 'scatterplot', label: 'Scatter plot' },
                                { value: 'steps', label: 'Steps' },
                                { value: 'stepsStart', label: 'Steps on start' },
                                { value: 'spline', label: 'Spline' },
                            ],
                        },
                        {
                            label: 'aggregate',
                            name: 'aggregate',
                            default: 'minmax',
                            hidden: '!data.history_oid || data.chartType === "auto" || !data.chartType',
                            type: 'select',
                            noTranslation: true,
                            options: ['minmax', 'average', 'min', 'max', 'total', 'raw'],
                        },
                        {
                            label: 'live',
                            name: 'live',
                            default: '30',
                            type: 'select',
                            hidden: '!data.history_oid',
                            options: [
                                { value: '', label: 'none' },
                                { value: '5', label: '5 seconds' },
                                { value: '10', label: '10 seconds' },
                                { value: '15', label: '15 seconds' },
                                { value: '20', label: '20 seconds' },
                                { value: '30', label: '30 seconds' },
                                { value: '60', label: '1 minute' },
                                { value: '120', label: '2 minutes' },
                                { value: '300', label: '5 minutes' },
                                { value: '600', label: '10 minutes' },
                                { value: '900', label: '15 minutes' },
                                { value: '1200', label: '20 minutes' },
                                { value: '1800', label: '30 minutes' },
                                { value: '3600', label: '1 hour' },
                                { value: '7200', label: '2 hours' },
                                { value: '10800', label: '3 hours' },
                                { value: '21600', label: '6 hours' },
                                { value: '43200', label: '12 hours' },
                                { value: '86400', label: '1 day' },
                            ],
                        },
                        // {
                        //     label: 'timeType',
                        //     name: 'timeType',
                        //     default: 'relative',
                        //     hidden: data => !data.history_oid,
                        //     type: 'select',
                        //     options: [
                        //         { label: 'relative', value: 'relative' },
                        //         { label: 'static', value: 'static' },
                        //     ],
                        // },
                        {
                            label: 'aggregateType',
                            name: 'aggregateType',
                            default: 'step',
                            hidden: '!data.history_oid',
                            type: 'select',
                            options: [
                                { label: 'counts', value: 'count' },
                                { label: 'seconds', value: 'step' },
                            ],
                        },
                        {
                            label: 'aggregateSpan',
                            name: 'aggregateSpan',
                            default: 300,
                            type: 'number',
                            hidden: '!data.history_oid',
                        },
                        {
                            label: 'xticks',
                            name: 'xticks',
                            type: 'slider',
                            min: 0,
                            max: 50,
                            hidden: '!data.history_oid',
                        },
                        {
                            label: 'yticks',
                            name: 'yticks',
                            type: 'slider',
                            min: 0,
                            max: 50,
                            hidden: '!data.history_oid',
                        },
                        {
                            label: 'range',
                            name: 'range',
                            default: '1440',
                            hidden: '!data.history_oid',
                            type: 'select',
                            options: [
                                { value: '10', label: '10 minutes' },
                                { value: '30', label: '30 minutes' },
                                { value: '60', label: '1 hour' },
                                { value: '120', label: '2 hours' },
                                { value: '180', label: '3 hours' },
                                { value: '360', label: '6 hours' },
                                { value: '720', label: '12 hours' },
                                { value: '1440', label: '1 day' },
                                { value: '2880', label: '2 days' },
                                { value: '4320', label: '3 days' },
                                { value: '10080', label: '7 days' },
                                { value: '20160', label: '14 days' },
                                { value: '1m', label: '1 month' },
                                { value: '2m', label: '2 months' },
                                { value: '3m', label: '3 months' },
                                { value: '6m', label: '6 months' },
                                { value: '1y', label: '1 year' },
                                { value: '2y', label: '2 years' },
                            ],
                        },
                        {
                            label: 'relativeEnd',
                            name: 'relativeEnd',
                            default: 'now',
                            hidden: '!data.history_oid',
                            type: 'select',
                            options: [
                                { value: 'now', label: 'now' },
                                { value: '1minute', label: 'end of minute' },
                                { value: '5minutes', label: 'end of 5 minutes' },
                                { value: '10minutes', label: 'end of 10 minutes' },
                                { value: '30minutes', label: 'end of 30 minutes' },
                                { value: '1hour', label: 'end of hour' },
                                { value: '2hours', label: 'end of 2 hours' },
                                { value: '3hours', label: 'end of 3 hours' },
                                { value: '4hours', label: 'end of 4 hours' },
                                { value: '6hours', label: 'end of 6 hours' },
                                { value: '8hours', label: 'end of 8 hours' },
                                { value: '12hours', label: 'end of 12 hours' },
                                { value: 'today', label: 'end of day' },
                                { value: 'weekEurope', label: 'end of sunday' },
                                { value: 'weekUsa', label: 'end of saturday' },
                                { value: 'month', label: 'this month' },
                                { value: 'year', label: 'this year' },
                            ],
                        },
                        // {
                        //     label: 'start',
                        //     name: 'start',
                        //     default: '',
                        //     hidden: data => !data.history_oid,
                        // },
                        // {
                        //     label: 'end',
                        //     name: 'end',
                        //     default: '',
                        //     hidden: data => !data.history_oid,
                        // },
                        // {
                        //     label: 'start_time',
                        //     name: 'start_time',
                        //     default: '',
                        //     hidden: data => !data.history_oid,
                        // },
                        // {
                        //     label: 'end_time',
                        //     default: '',
                        //     name: 'end_time',
                        //     hidden: data => !data.history_oid,
                        // },
                    ],
                },
            ],
            visDefaultStyle: {
                width: '100%',
                height: 300,
                position: 'relative',
            },
            visPrev: 'widgets/echarts/img/prev_echarts.png',
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return Echarts.getWidgetInfo();
    }

    static getDefaultLine(
        systemSettings: ioBroker.SystemConfigObject,
        instance: string | undefined,
        obj: ioBroker.Object,
        language: ioBroker.Languages,
    ): PresetLine {
        const isBoolean = obj?.common?.type === 'boolean';

        const line: PresetLine = {
            name: ((obj?.common?.name && Utils.getObjectNameFromObj(obj, null, { language })) || '').trim(),
            id: obj?._id || '',
            instance: instance === systemSettings.common.defaultHistory ? '' : instance || '',
            thickness: 2,
            chartType: isBoolean ? 'steps' : 'line',
            aggregate: isBoolean ? 'onchange' : 'minmax',
            isBoolean,
            symbolSize: 3,
            validTime: 35, // 35 seconds
        };

        if (obj?.common?.color) {
            line.color = obj.common.color;
        }
        if (obj?.common?.unit) {
            line.unit = obj.common.unit;
        }
        if (isBoolean) {
            line.yaxe = 'off';
            line.min = '0';
            line.yticks = 1;
            line.fill = 0.3;
            line.symbolSize = 1;
        }

        return line;
    }

    loadChartParam(name: keyof EchartsRxData, def: any): any {
        const val = this.state.rxData[name];
        if (val === undefined || val === null) {
            return def;
        }

        return val;
    }

    async propertiesUpdate(): Promise<void> {
        if (this.state.rxData.history_oid && this.state.rxData.history_instance) {
            this.setState({ presetData: await this.createChartFromLine() });
        } else if (this.state.presetData) {
            this.setState({ presetData: null });
        }
    }

    async componentDidMount(): Promise<void> {
        super.componentDidMount();
        window.addEventListener('message', this.onReceiveMessage, false);
        await this.propertiesUpdate();
    }

    componentWillUnmount(): void {
        window.removeEventListener('message', this.onReceiveMessage, false);
    }

    async onRxDataChanged(): Promise<void> {
        await this.propertiesUpdate();
    }

    async createChartFromLine(): Promise<PresetLines> {
        this.systemConfig ||= await this.props.context.socket.getObject('system.config');

        if (!this.object || this.object._id !== this.state.rxData.history_oid) {
            this.object = await this.props.context.socket.getObject(this.state.rxData.history_oid!);
        }

        const lines = [
            Echarts.getDefaultLine(
                this.systemConfig!,
                this.state.rxData.history_instance,
                this.object!,
                I18n.getLanguage(),
            ),
        ];

        lines[0].xticks = this.loadChartParam('xticks', '');
        lines[0].yticks = this.loadChartParam('yticks', '');

        return {
            marks: [],
            lines,
            zoom: true,
            hoverDetail: true,
            aggregate: this.loadChartParam('aggregate', 'minmax'),
            chartType: this.loadChartParam('chartType', 'auto'),
            live: this.loadChartParam('live', '30'),
            timeType: this.loadChartParam('timeType', 'relative'),
            aggregateType: this.loadChartParam('aggregateType', 'step'),
            aggregateSpan: this.loadChartParam('aggregateSpan', '300'),
            ticks: this.loadChartParam('ticks', ''),
            range: this.loadChartParam('range', '1440'),
            relativeEnd: this.loadChartParam('relativeEnd', 'now'),
            start: this.loadChartParam('start', ''),
            end: this.loadChartParam('end', ''),
            start_time: this.loadChartParam('start_time', ''),
            end_time: this.loadChartParam('end_time', ''),
            noBorder: 'noborder',
            noedit: false,
            animation: 0,
            legend: '',
        };
    }

    onReceiveMessage = (message: any): void => {
        if (message?.data === 'chartReady') {
            this.ready = true;
            if (this.state.presetData) {
                this.lastPresetData = JSON.stringify(this.state.presetData);
                this.refIframe.current?.contentWindow?.postMessage(this.lastPresetData, '*');
                console.log('Received ready from iframe');
            }
        }
    };

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element | React.JSX.Element[] | null {
        super.renderWidgetBody(props);

        let content;
        if (
            (!this.state.rxData.echart_oid || this.state.rxData.echart_oid === 'nothing_selected') &&
            !this.state.presetData
        ) {
            // no chart selected
            content = (
                <div
                    style={{
                        padding: 8,
                        width: 'calc(100% - 16px)',
                        height: 'calc(100% - 16px)',
                        backgroundColor: this.state.rxData.noChartBackground
                            ? undefined
                            : this.props.context.themeType === 'dark'
                              ? 'rgb(31, 31, 31)'
                              : '#f0f0f0',
                    }}
                >
                    {I18n.t('echarts_chart_not_selected')}
                </div>
            );
        } else {
            const presetJson = JSON.stringify(this.state.presetData);
            if (this.ready && this.lastPresetData !== presetJson) {
                this.lastPresetData = presetJson;
                this.refIframe.current?.contentWindow?.postMessage(this.lastPresetData, '*');
            }

            content = (
                <iframe
                    ref={this.refIframe}
                    title={this.state.rxData.echart_oid || this.state.rxData.history_oid}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 0,
                    }}
                    src={
                        this.state.rxData.echart_oid
                            ? `../echarts/index.html?preset=${this.state.rxData.echart_oid}&noBG=${this.state.rxData.noChartBackground || !this.state.rxData.noCard}`
                            : `../echarts/index.html?noBG=${this.state.rxData.noChartBackground || !this.state.rxData.noCard}&edit=true`
                    }
                />
            );
        }

        if (!this.state.rxData.noCard) {
            return this.wrapContent(content);
        }

        return content;
    }
}
