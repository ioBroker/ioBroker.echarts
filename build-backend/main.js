"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 *      ioBroker echarts Adapter
 *
 *      (c) 2020-2024 bluefox <dogafox@gmail.com>
 *
 *      MIT License
 *
 */
const adapter_core_1 = require("@iobroker/adapter-core");
const node_fs_1 = require("node:fs");
const ChartModel_1 = require("./lib/ChartModel");
const ChartOption_1 = require("./lib/ChartOption");
const moment = require("moment");
require("moment/locale/en-gb");
require("moment/locale/es");
require("moment/locale/fr");
require("moment/locale/pl");
require("moment/locale/pt");
require("moment/locale/it");
require("moment/locale/nl");
require("moment/locale/ru");
require("moment/locale/zh-cn");
require("moment/locale/de");
const socketSimulator_1 = require("./lib/socketSimulator");
const echarts_1 = require("echarts");
// let echartsInit:
//     | ((canvas: HTMLElement | null, theme?: string | object | null, opts?: EChartsInitOpts) => EChartsType)
//     | undefined;
let createCanvas;
let JsDomClass;
function calcTextWidth(text, fontSize) {
    // try to simulate
    return Math.ceil((text.length * (parseFloat(fontSize) || 12)) / 0.75);
}
class EchartsAdapter extends adapter_core_1.Adapter {
    __lastMessageTime = 0;
    __lastMessageText = '';
    cachedSnapshots = {};
    socketSimulator = null;
    constructor(options = {}) {
        super({
            ...options,
            name: 'echarts',
        });
        this.on('ready', () => this.main());
        this.on('message', obj => obj?.command === 'send' && this.processMessage(obj));
    }
    // Todo: queue requests as  global.window is "global"
    async renderImage(options) {
        if (!createCanvas) {
            try {
                createCanvas = (await Promise.resolve().then(() => require('canvas'))).createCanvas;
                JsDomClass = (await Promise.resolve().then(() => require('jsdom'))).JSDOM;
                this.socketSimulator = (0, socketSimulator_1.getSocket)(this);
            }
            catch (e) {
                this.log.error(`Cannot find required modules: ${e}`);
                throw new Error('Cannot find required modules: looks like it is not possible to generate charts on your Hardware/OS');
            }
        }
        return new Promise((resolve, reject) => {
            options.width = parseFloat(options.width) || 1024;
            options.height = parseFloat(options.height) || 300;
            const chartData = new ChartModel_1.default(this.socketSimulator, options.preset, { serverSide: true });
            chartData.onError(err => this.log.error(err.toString()));
            chartData.onUpdate((seriesData, _actualValues, barCategories) => {
                const systemConfig = chartData.getSystemConfig();
                moment.locale(systemConfig?.language || 'en');
                const theme = options.theme || options.themeType || 'light';
                const chartOption = new ChartOption_1.default(moment, theme, calcTextWidth);
                const option = chartOption.getOption(seriesData, chartData.getConfig(), null, barCategories);
                const { window } = new JsDomClass();
                // @ts-expect-error must be so
                global.window = window;
                global.navigator = window.navigator;
                global.document = window.document;
                let chart;
                let canvas;
                let root;
                if (options.renderer && options.renderer !== 'svg') {
                    canvas = createCanvas(options.width, options.height);
                    canvas.width = options.width;
                    canvas.height = options.height;
                    chart = (0, echarts_1.init)(canvas);
                    if (options.background) {
                        option.backgroundColor = options.background;
                    }
                }
                else {
                    root = global.document.createElement('div');
                    root.style.cssText = `width: ${options.width}px; height: ${options.height}px;${options.background
                        ? ` background: ${options.background}`
                        : theme === 'dark'
                            ? ' background: #000;'
                            : ''}`;
                    chart = (0, echarts_1.init)(root, undefined, { renderer: 'svg' });
                }
                chart.setOption(option);
                let data;
                switch (options.renderer || '') {
                    case 'png': {
                        data = `data:image/png;base64,${canvas
                            .toBuffer('image/png', {
                            compressionLevel: options.compressionLevel || 3,
                            filters: options.filters || canvas.PNG_FILTER_NONE,
                        })
                            .toString('base64')}`;
                        break;
                    }
                    case 'jpg': {
                        data = `data:image/jpeg;base64,${canvas
                            .toBuffer('image/jpeg', {
                            quality: options.quality || 0.8,
                        })
                            .toString('base64')}`;
                        break;
                    }
                    case 'pdf': {
                        data = `data:application/pdf;base64,${canvas
                            .toBuffer('application/pdf', {
                            title: options.title || 'ioBroker Chart',
                            creationDate: new Date(),
                        })
                            .toString('base64')}`;
                        break;
                    }
                    case '':
                    case 'svg': {
                        const svg = root.querySelector('svg').outerHTML;
                        data = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
                        break;
                    }
                    default:
                        reject(new Error('Unsupported format'));
                        return;
                }
                chart?.dispose();
                if (options.fileOnDisk) {
                    (0, node_fs_1.writeFileSync)(options.fileOnDisk, Buffer.from(data.split(',')[1], 'base64'));
                }
                if (options.fileName) {
                    this.writeFile(this.namespace, options.fileName, Buffer.from(data.split(',')[1], 'base64'), err => (err ? reject(err) : resolve(data)));
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    async fixSystemObject() {
        const obj = await this.getForeignObjectAsync('_design/system');
        if (obj?.views && !obj.views.chart) {
            obj.views.chart = {
                map: `function(doc) { if (doc.type === 'chart') emit(doc._id, doc) }`,
            };
            await this.setForeignObjectAsync(obj._id, obj);
            return true;
        }
        return false;
    }
    processMessage(obj) {
        if (!obj?.message) {
            return;
        }
        // filter out the double messages
        const json = JSON.stringify(obj.message);
        if (this.__lastMessageTime && this.__lastMessageText === json && Date.now() - this.__lastMessageTime < 300) {
            return this.log.debug(`Filter out double message [first was for ${Date.now() - this.__lastMessageTime}ms]: ${json}`);
        }
        this.__lastMessageTime = Date.now();
        this.__lastMessageText = json;
        const message = obj.message;
        if (!message?.preset) {
            this.log.error('Please define settings: {"preset": "echarts.0.XXX", width: 500, height: 200, renderer: "png/svg"}');
            if (obj.callback) {
                this.sendTo(obj.from, 'send', {
                    error: 'Please define settings: {"preset": "echarts.0.XXX", width: 500, height: 200, renderer: "svg/png"}',
                }, obj.callback);
            }
        }
        else {
            // delete cached snapshots
            Object.keys(this.cachedSnapshots).forEach(preset => {
                if (this.cachedSnapshots[preset].ts < Date.now()) {
                    delete this.cachedSnapshots[preset];
                }
            });
            if (message.cache &&
                !message.forceRefresh &&
                this.cachedSnapshots[message.preset] &&
                this.cachedSnapshots[message.preset].ts >= Date.now()) {
                if (obj.callback) {
                    this.sendTo(obj.from, 'send', {
                        data: this.cachedSnapshots[message.preset].data,
                        error: this.cachedSnapshots[message.preset].error,
                    }, obj.callback);
                }
            }
            else {
                this.renderImage(message)
                    .then(data => {
                    if (message.cache) {
                        if (!this.cachedSnapshots[message.preset]) {
                            this.cachedSnapshots[message.preset] = {
                                ts: Date.now() + message.cache * 1000,
                                data,
                                error: null,
                            };
                        }
                        else {
                            this.cachedSnapshots[message.preset].ts = Date.now() + message.cache * 1000;
                            this.cachedSnapshots[message.preset].data = data;
                            this.cachedSnapshots[message.preset].error = null;
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, 'send', { data }, obj.callback);
                    }
                })
                    .catch(error => {
                    if (message.cache) {
                        if (!this.cachedSnapshots[message.preset]) {
                            this.cachedSnapshots[message.preset] = {
                                ts: Date.now() + message.cache * 1000,
                                data: null,
                                error,
                            };
                        }
                        else {
                            this.cachedSnapshots[message.preset].ts = Date.now() + message.cache * 1000;
                            this.cachedSnapshots[message.preset].data = null;
                            this.cachedSnapshots[message.preset].error = error;
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, 'send', { error }, obj.callback);
                    }
                });
            }
        }
    }
    async main() {
        // fix _design/chart
        let designObject = await this.getForeignObjectAsync('_design/chart');
        const _obj = JSON.parse((0, node_fs_1.readFileSync)(`${__dirname}/../io-package.json`).toString('utf8')).objects.find((ob) => ob._id === '_design/chart');
        if (!designObject || (_obj && JSON.stringify(designObject.views) !== JSON.stringify(_obj.views))) {
            designObject = { language: 'javascript' };
            designObject.views = _obj?.views
                ? _obj.views
                : { chart: { map: `function(doc) { if (doc.type === 'chart') emit(doc._id, doc); }` } };
            await this.setForeignObjectAsync('_design/chart', designObject);
        }
        // fix _design/system
        const systemDesign = await this.getForeignObjectAsync('_design/system');
        if (systemDesign?.views && !systemDesign.views.chart) {
            systemDesign.views.chart = {
                map: "function(doc) { if (doc.type === 'chart') emit(doc._id, doc); }",
            };
            await this.setForeignObjectAsync('_design/system', systemDesign);
        }
        // enabled mode daemon and message box
        const adapterInstance = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
        if (adapterInstance?.common &&
            (adapterInstance.common.mode !== 'daemon' || !adapterInstance.common.messagebox)) {
            adapterInstance.common.mode = 'daemon';
            adapterInstance.common.messagebox = true;
            await this.setForeignObjectAsync(adapterInstance._id, adapterInstance);
        }
        if (await this.fixSystemObject()) {
            this.log.debug('Added chart view to system object');
        }
        /*renderImage({preset: 'Test', theme: 'dark', renderer: 'png', background: '#000000'})
            .then(data => {
                const base64 = Buffer.from(data.split(',')[1], 'base64');
                require('fs').writeFileSync('image.png', base64);
            });*/
    }
}
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new EchartsAdapter(options);
}
else {
    // otherwise start the instance directly
    (() => new EchartsAdapter())();
}
//# sourceMappingURL=main.js.map