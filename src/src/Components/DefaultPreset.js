import Utils from "@iobroker/adapter-react/Components/Utils";

const DEFAULT_PRESET = {
    lines:[
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
    range: '120',
    aggregateType: 'count',
    aggregateSpan: 300,
    legend: 'ne',
    hoverDetail: true,
    useComma: true,
    zoom: true,
    animation: 0,
    live: '15',
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
    border_width: '',
    barColor: '',
    barLabels: 'topover',
    barWidth: '',
    barFontSize: '',
    barFontColor: '',
    title: '',
    titlePos: '',
    titleColor: '',
    titleSize: '',
    legColumns: '',
    legBgOpacity: '',
    legBg: '',
    timeFormat: 'HH:mm:ss DD.MM.YY',
    export: true,
};

function getDefaultPreset(systemSettings, instance, obj, language) {
    const preset = JSON.parse(JSON.stringify(DEFAULT_PRESET));

    preset.useComma = systemSettings.common.isFloatComma || false;

    if (systemSettings.common.dateFormat) {
        preset.timeFormat = 'HH:mm:ss ' + systemSettings.common.dateFormat;
    }

    preset.lines.push({
        name: (obj && obj.common && obj.common.name && Utils.getObjectNameFromObj(obj, null, {language})) || '',
        id: obj ? obj._id : '',
        color: (obj && obj.common && obj.common.color) || '#144578',
        instance: instance || systemSettings.common.defaultHistory,
        chartType: (obj && obj.common && obj.common.type === 'boolean') ? 'steps' : 'line',
        aggregate: (obj && obj.common && obj.common.type === 'boolean') ? 'onchange' : 'minmax',
        unit: (obj && obj.common && obj.common.unit) || '',
        symbolSize: 3,
    });

    return preset;
}
export default getDefaultPreset;