"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 *      ioBroker echarts Adapter
 *
 *      (c) 2020-2026 bluefox <dogafox@gmail.com>
 *
 *      MIT License
 *
 */
const node_fs_1 = require("node:fs");
const node_child_process_1 = require("node:child_process");
const node_path_1 = require("node:path");
const node_module_1 = require("node:module");
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
const echarts_1 = require("echarts");
const adapter_core_1 = require("@iobroker/adapter-core");
const ChartModel_1 = require("./lib/ChartModel");
const ChartOption_1 = require("./lib/ChartOption");
const socketSimulator_1 = require("./lib/socketSimulator");
// let echartsInit:
//     | ((canvas: HTMLElement | null, theme?: string | object | null, opts?: EChartsInitOpts) => EChartsType)
//     | undefined;
// undefined = not yet attempted, null = attempted but failed, value = loaded successfully
let createCanvas;
let CanvasClass;
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
        if (JsDomClass === undefined) {
            try {
                JsDomClass = (await Promise.resolve().then(() => require('jsdom'))).JSDOM;
                this.socketSimulator ||= (0, socketSimulator_1.getSocket)(this);
            }
            catch (e) {
                JsDomClass = null;
                this.log.error(`Cannot load jsdom module: ${e}`);
            }
        }
        if (!JsDomClass) {
            throw new Error('Cannot render chart: jsdom module is not available on this system');
        }
        const needsCanvas = options.renderer && options.renderer !== 'svg';
        if (needsCanvas) {
            if (createCanvas === undefined) {
                try {
                    const canvasModule = await Promise.resolve().then(() => require('canvas'));
                    createCanvas = canvasModule.createCanvas;
                    CanvasClass = canvasModule.Canvas;
                }
                catch {
                    createCanvas = null;
                    CanvasClass = null;
                }
            }
            if (!createCanvas) {
                throw new Error(`Cannot render as "${options.renderer}": canvas module is not available on this system. ` +
                    'Only SVG rendering is supported. ' +
                    'To fix: cd /opt/iobroker/node_modules/canvas && sudo -u iobroker npm install --omit=dev --build-from-source');
            }
        }
        return new Promise((resolve, reject) => {
            options.width = parseFloat(options.width) || 1024;
            options.height = parseFloat(options.height) || 300;
            const chartData = new ChartModel_1.default(this.socketSimulator, options.preset, { serverSide: true });
            chartData.onError(err => this.log.error(err.toString()));
            chartData.onUpdate((seriesData, _actualValues, barCategories) => {
                const theme = options.theme || options.themeType || 'light';
                const chartOption = new ChartOption_1.default(moment, theme, calcTextWidth);
                const option = chartOption.getOption(seriesData, chartData.getConfig(), null, barCategories);
                const { window } = new JsDomClass();
                // @ts-expect-error must be so
                global.window = window;
                try {
                    global.navigator = window.navigator;
                }
                catch {
                    // ignore
                }
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
                if (!root || !canvas || !CanvasClass) {
                    throw new Error('No root');
                }
                chart.setOption(option);
                let data;
                switch (options.renderer || '') {
                    case 'png': {
                        data = `data:image/png;base64,${canvas
                            .toBuffer('image/png', {
                            compressionLevel: options.compressionLevel || 3,
                            filters: options.filters || CanvasClass.PNG_FILTER_NONE,
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
    async tryRebuildCanvas() {
        let canvasDir;
        try {
            const req = (0, node_module_1.createRequire)(__filename);
            canvasDir = (0, node_path_1.dirname)(req.resolve('canvas/package.json'));
        }
        catch {
            this.log.warn('Cannot locate canvas package directory — rebuild skipped');
            return false;
        }
        this.log.info(`Rebuilding canvas from source in ${canvasDir} (this may take a few minutes)...`);
        return new Promise(resolve => {
            const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
            const child = (0, node_child_process_1.spawn)(npm, ['install', '--omit=dev', '--build-from-source'], {
                cwd: canvasDir,
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            child.stdout?.on('data', (data) => {
                for (const line of data.toString().split('\n')) {
                    if (line.trim()) {
                        this.log.debug(`canvas rebuild: ${line.trim()}`);
                    }
                }
            });
            child.stderr?.on('data', (data) => {
                for (const line of data.toString().split('\n')) {
                    if (line.trim()) {
                        this.log.debug(`canvas rebuild: ${line.trim()}`);
                    }
                }
            });
            child.on('close', code => {
                if (code === 0) {
                    this.log.info('canvas rebuilt successfully');
                    resolve(true);
                }
                else {
                    this.log.warn(`canvas rebuild failed with exit code ${code}`);
                    resolve(false);
                }
            });
            child.on('error', err => {
                this.log.warn(`canvas rebuild error: ${err.message}`);
                resolve(false);
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
        // Set the system language for moment
        const systemConfig = await this.getForeignObjectAsync('system.config');
        if (systemConfig?.common?.language) {
            moment.locale(systemConfig.common.language);
        }
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
        // Pre-load rendering modules so issues are visible in the log at startup
        try {
            JsDomClass = (await Promise.resolve().then(() => require('jsdom'))).JSDOM;
            this.socketSimulator = (0, socketSimulator_1.getSocket)(this);
        }
        catch (e) {
            JsDomClass = null;
            this.log.error(`Cannot load jsdom module: ${e}. Chart rendering will not be available.`);
        }
        try {
            const canvasModule = await Promise.resolve().then(() => require('canvas'));
            createCanvas = canvasModule.createCanvas;
            CanvasClass = canvasModule.Canvas;
        }
        catch (e) {
            this.log.warn(`Canvas module failed to load: ${e}. Trying to rebuild from source...`);
            const rebuilt = await this.tryRebuildCanvas();
            if (rebuilt) {
                // Clear require cache so the freshly built native binary is picked up
                for (const key of Object.keys(require.cache)) {
                    if (key.includes('/canvas/') || key.includes('\\canvas\\')) {
                        delete require.cache[key];
                    }
                }
                try {
                    const canvasModule = await Promise.resolve().then(() => require('canvas'));
                    createCanvas = canvasModule.createCanvas;
                    CanvasClass = canvasModule.Canvas;
                    this.log.info('Canvas loaded successfully after rebuild. PNG/JPG/PDF rendering is available.');
                }
                catch (e2) {
                    createCanvas = null;
                    CanvasClass = null;
                    this.log.warn(`Canvas still failed after rebuild: ${e2}. Only SVG rendering is supported.`);
                }
            }
            else {
                createCanvas = null;
                CanvasClass = null;
                this.log.warn('PNG/JPG/PDF chart rendering is not available — only SVG is supported. ' +
                    'To fix manually: cd /opt/iobroker/node_modules/canvas && sudo -u iobroker npm install --omit=dev --build-from-source');
            }
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