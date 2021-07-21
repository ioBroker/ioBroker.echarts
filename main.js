/**
 *
 *      ioBroker echarts Adapter
 *
 *      (c) 2020-2021 bluefox <dogafox@gmail.com>
 *
 *      MIT License
 *
 */
'use strict';

const utils       = require('@iobroker/adapter-core'); // Get common adapter utils
const adapterName = require('./package.json').name.split('.').pop();
const fs          = require('fs');
prepareReactFiles(); // this call must be before require ChartModel and ChartOption
const ChartModel  = require(__dirname + '/_helpers/ChartModel');
const ChartOption = require(__dirname + '/_helpers/ChartOption');

const moment = require('moment');
require('moment/locale/en-gb');
require('moment/locale/es');
require('moment/locale/fr');
require('moment/locale/pl');
require('moment/locale/pt');
require('moment/locale/it');
require('moment/locale/nl');
require('moment/locale/ru');
require('moment/locale/zh-cn');
require('moment/locale/de');

let echarts;
let Canvas;
let JSDOM;
let adapter;

function prepareReactFiles() {
    // there is a problem that node.js does not support "export default, so remove it manually from these files and create new
    // after that require changed files and not original ones.
    let _chartModel = fs.readFileSync(__dirname + '/src-chart/src/Components/ChartModel.js').toString('utf8');
    let _chartOption = fs.readFileSync(__dirname + '/src-chart/src/Components/ChartOption.js').toString('utf8');
    _chartModel = _chartModel.replace('export default ', 'module.exports = ');
    _chartOption = _chartOption.replace('export default ', 'module.exports = ');

    if (fs.existsSync(__dirname + '/_helpers/ChartModel.js')) {
        if (fs.readFileSync(__dirname + '/_helpers/ChartModel.js').toString('utf8') !== _chartModel) {
            fs.writeFileSync(__dirname + '/_helpers/ChartModel.js', _chartModel);
        }
    } else {
        !fs.existsSync(__dirname + '/_helpers') && fs.mkdirSync(__dirname + '/_helpers');
        fs.writeFileSync(__dirname + '/_helpers/ChartModel.js', _chartModel);
    }

    if (fs.existsSync(__dirname + '/_helpers/ChartOption.js')) {
        if (fs.readFileSync(__dirname + '/_helpers/ChartOption.js').toString('utf8') !== _chartOption) {
            fs.writeFileSync(__dirname + '/_helpers/ChartOption.js', _chartOption);
        }
    } else {
        !fs.existsSync(__dirname + '/_helpers') && fs.mkdirSync(__dirname + '/_helpers');
        fs.writeFileSync(__dirname + '/_helpers/ChartOption.js', _chartOption);
    }
}

function startAdapter(options) {
    options = options || {};
    Object.assign(options, {
        name: adapterName, // adapter name
    });

    adapter = new utils.Adapter(options);

    adapter.on('message', obj =>
        obj && obj.command === 'send' && processMessage(adapter, obj));

    adapter.on('ready', () => main(adapter));

    adapter.__emailTransport  = null;
    adapter.__stopTimer       = null;
    adapter.__lastMessageTime = 0;
    adapter.__lastMessageText = '';

    return adapter;
}
let systemConfig;

const socketSimulator = {
    getState: function (id) {
        return adapter.getForeignStateAsync(id);
    },
    getHistoryEx: function (id, options) {
        return new Promise((resolve, reject) =>
            adapter.getHistory(id, options, (err, values, stepIgnore, sessionId) =>
                err ? reject(err) : resolve({values, sessionId, stepIgnore})));
    },
    getObject: function (id) {
        return adapter.getForeignObjectAsync(id);
    },
    getSystemConfig: function () {
        systemConfig = systemConfig || adapter.getForeignObjectAsync('system.config');
        return systemConfig;
    },
    unsubscribeState: function () {},
    subscribeState: function () {},
    unsubscribeObject: function () {},
    subscribeObject: function () {}
};

function calcTextWidth(text, fontSize, fontFamily) {
    // try to simulate
    return Math.ceil(text.length * parseFloat(fontSize || 12) / 0.75);
}

// Todo: queue requests as  global.window is "global"
function renderImage(options) {
    return new Promise((resolve, reject) => {
        try {
            echarts = echarts || require('echarts');
            Canvas  = Canvas  || require('canvas');
            JSDOM   = JSDOM   || require('jsdom').JSDOM;
        } catch (e) {
            adapter.log.error('Cannot find required modules: ' + e);
            return reject('Cannot find required modules: looks like it is not possible to generate charts on your Hardware/OS');
        }

        options.width  = parseFloat(options.width)  || 1024;
        options.height = parseFloat(options.height) || 300;

        const chartData = new ChartModel(socketSimulator, options.preset, {serverSide: true});
        chartData.onError(err => adapter.log.error(err));
        chartData.onUpdate(seriesData => {
            const systemConfig = chartData.getSystemConfig();
            moment.locale((systemConfig && systemConfig.common && systemConfig.common.language) || 'en');
            const theme = options.theme || options.themeType || 'light';

            const chartOption = new ChartOption(moment, theme, calcTextWidth);
            const option = chartOption.getOption(seriesData, chartData.getConfig());
            const {window} = new JSDOM();

            global.window    = window;
            global.navigator = window.navigator;
            global.document  = window.document;

            let chart;
            let canvas;
            let root;
            if (options.renderer && options.renderer !== 'svg') {
                canvas = Canvas.createCanvas(options.width, options.height);
                canvas.width  = options.width;
                canvas.height = options.height;
                chart = echarts.init(canvas);
                if (options.background) {
                    option.backgroundColor = options.background;
                }
            } else {
                root = global.document.createElement('div');
                root.style.cssText = `width: ${options.width}px; height: ${options.height}px;${
                    options.background ? 
                        (' background: ' + options.background) 
                        : 
                        (theme === 'dark' ? ' background: #000;' : '')
                }`;
                chart = echarts.init(root, null, {renderer: 'svg'});
            }

            chart.setOption(option);

            let data;
            switch (options.renderer || '') {
                case 'png': {
                        data = 'data:image/png;base64,' + canvas.toBuffer('image/png', {
                        compressionLevel: options.compressionLevel || 3,
                        filters: options.filters || canvas.PNG_FILTER_NONE
                    }).toString('base64');
                    break;
                }
                case 'jpg': {
                    data = 'data:image/jpeg;base64,' + canvas.toBuffer('image/jpeg', {
                        quality: options.quality || 0.8
                    }).toString('base64');
                    break;
                }
                case 'pdf': {
                    data = 'data:application/pdf;base64,' + canvas.toBuffer('application/pdf', {
                        title: options.title || 'ioBroker Chart',
                        creationDate: new Date()
                    }).toString('base64');
                    break;
                }
                case '':
                case 'svg': {
                    const svg = root.querySelector('svg').outerHTML;
                    data = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
                    break;
                }
                default:
                    reject('Unsupported format');
                    return;
            }

            chart && chart.dispose();

            if (options.fileOnDisk) {
                fs.writeFileSync(options.fileOnDisk, Buffer.from(data.split(',')[1], 'base64'));
            }
            if (options.fileName) {
                adapter.writeFile(adapter.namespace, options.fileName, Buffer.from(data.split(',')[1], 'base64'), err =>
                    err ? reject(err) : resolve(data));
            } else {
                resolve(data)
            }
        });
    });
}

function processMessage(adapter, obj) {
    if (!obj || !obj.message) {
        return;
    }

    // filter out double messages
    const json = JSON.stringify(obj.message);
    if (adapter.__lastMessageTime && adapter.__lastMessageText === json && Date.now() - adapter.__lastMessageTime < 300) {
        return adapter.log.debug('Filter out double message [first was for ' + (Date.now() - adapter.__lastMessageTime) + 'ms]: ' + json);
    }

    adapter.__lastMessageTime = Date.now();
    adapter.__lastMessageText = json;

    if (!obj.message || !obj.message.preset) {
        adapter.log.error('Please define settings: {"preset": "echarts.0.XXX", width: 500, height: 200, renderer: "png/svg"}');
        obj.callback && adapter.sendTo(obj.from, 'send', {error: 'Please define settings: {"preset": "echarts.0.XXX", width: 500, height: 200, renderer: "svg/png"}'}, obj.callback);
    } else {
        renderImage(obj.message)
            .then(data => obj.callback && adapter.sendTo(obj.from, 'send', {data}, obj.callback))
            .catch(error => obj.callback && adapter.sendTo(obj.from, 'send', {error}, obj.callback));
    }
}

function main(adapter) {
    // fix _design/chart
    adapter.getForeignObject('_design/chart', (err, obj) => {
        const _obj = require('./io-package.json').objects.find(ob => ob._id === '_design/chart');
        if (obj && _obj && JSON.stringify(obj.views) !== JSON.stringify(_obj.views)) {
            obj.views = _obj.views;
            adapter.setForeignObject('_design/chart', _obj);
        }
    });

    // enabled mode daemon and message box
    adapter.getForeignObject('system.adapter.' + adapter.namespace, (err, obj) => {
        if (obj && obj.common && (obj.common.mode !== 'daemon' || !obj.common.messagebox)) {
            obj.common.mode = 'daemon';
            obj.common.messagebox = true;
            adapter.setForeignObject(obj._id, obj);
        }
    });

    /*renderImage({preset: 'Test', theme: 'dark', renderer: 'png', background: '#000000'})
        .then(data => {
            const base64 = Buffer.from(data.split(',')[1], 'base64');
            require('fs').writeFileSync('image.png', base64);
        });*/
}

// If started as allInOne mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}