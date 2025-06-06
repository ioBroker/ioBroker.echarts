import { I18n, Utils } from '@iobroker/adapter-react-v5';
import type { ChartConfigMore, ChartLineConfigMore } from '../../../src/types';

const DEFAULT_PRESET: ChartConfigMore = {
    l: [
        /*
        {
            'id':'system.adapter.admin.0.cpu',
            'offset':'0',
            'aggregate':'minmax',
            'color':'#FF0000',
            'thickness':'3',
            'shadowsize':'3',
            'name':'Line 1',
            'xaxe':'off',
            'ignoreNull':'false',
            'afterComma':'2',
            'dashes':'true',
            'dashLength':'10',
            'spaceLength':'10',
            'min':'-0.1',
            'max':'1',
            'points':'true',
            'fill':'4',
            'unit':'2',
            'yaxe':'left',
            'yOffset':'1',
            'xticks':'2',
            'yticks':'3',
            'smoothing':'4'
        },
        {
            'id':'system.adapter.admin.0.memHeapTotal',
            'offset':'0',
            'aggregate':'minmax',
            'color':'#00FF00',
            'thickness':'3',
            'shadowsize':'3',
            'min':'-0.1',
            'points':'false'
        },
        {
            'id':'system.adapter.admin.0.memRss',
            'offset':'0',
            'aggregate':'minmax',
            'color':'#0000FF',
            'thickness':'3',
            'shadowsize':'3',
            'xaxe':'off',
            'min':'-0.1'
        }
        */
    ],
    marks: [
        /*
        {
            'lineId':'0',
            'upperValueOrId':'20',
            'fill':'1',
            'color':'#FF0000',
            'ol':'1',
            'os':'0',
            'text':'11',
            'textPosition':'l',
            'textOffset':'2',
            'textColor':'#FF0000',
            'textSize':'2',
            'lowerValueOrId':'20'
        }
        */
    ],
    timeType: 'relative',
    relativeEnd: '30minutes',
    range: 120,
    aggregateType: 'count',
    aggregateSpan: 300,
    legend: 'ne',
    hoverDetail: true,
    zoom: true,
    animation: 0,
    live: 15,
    ticks: '',
    width: '100%',
    height: '100%',
    noBorder: 'noborder',
    window_bg: '',
    bg_custom: '',
    x_labels_color: '',
    y_labels_color: '',
    border_color: '',
    grid_color: '',
    grid_hideX: false,
    grid_hideY: false,
    border_width: 0,
    barLabels: 'topover',
    barFontColor: '',
    title: '',
    titlePos: '',
    titleColor: '',
    legBg: '',
    timeFormat: '',
    export: true,
};

export function getDefaultLine(
    systemSettings: ioBroker.SystemConfigObject,
    instance?: string,
    obj?: ioBroker.StateObject,
    language?: ioBroker.Languages,
): ChartLineConfigMore {
    const isBoolean = obj?.common?.type === 'boolean';

    const line: ChartLineConfigMore = {
        name: (
            (obj?.common?.name &&
                Utils.getObjectNameFromObj(obj, null, { language: language || I18n.getLanguage() })) ||
            ''
        ).trim(),
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
    if (obj && obj.common && obj.common.unit) {
        line.unit = obj.common.unit;
    }
    if (isBoolean) {
        line.yaxe = 'off';
        line.min = 0;
        line.yticks = 1;
        line.fill = 0.3;
        line.symbolSize = 1;
    }

    return line;
}

export function getDefaultPreset(
    systemSettings: ioBroker.SystemConfigObject,
    instance?: string,
    obj?: ioBroker.StateObject,
    language?: ioBroker.Languages,
): ChartConfigMore {
    const preset: ChartConfigMore = JSON.parse(JSON.stringify(DEFAULT_PRESET));

    preset.useComma = systemSettings.common.isFloatComma || false;

    if (systemSettings.common.dateFormat) {
        // preset.timeFormat = 'HH:mm:ss ' + systemSettings.common.dateFormat;
    }

    preset.l.push(getDefaultLine(systemSettings, instance, obj, language));

    return preset;
}
