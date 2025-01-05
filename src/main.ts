/**
 *
 *      ioBroker echarts Adapter
 *
 *      (c) 2020-2024 bluefox <dogafox@gmail.com>
 *
 *      MIT License
 *
 */
import { Adapter, type AdapterOptions } from '@iobroker/adapter-core';
import { readFileSync, writeFileSync } from 'node:fs';
import ChartModel, { type BarAndLineSeries } from './lib/ChartModel';
import ChartOption from './lib/ChartOption';
import * as moment from 'moment';
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
import type { EchartsOptions, Connection, ChartConfigMore } from './types';
import { getSocket } from './lib/socketSimulator';
import { type EChartsType, init as echartsInit } from 'echarts';
import type { Canvas, JpegConfig, PdfConfig, PngConfig } from 'canvas';
import { type JSDOM } from 'jsdom';

// let echartsInit:
//     | ((canvas: HTMLElement | null, theme?: string | object | null, opts?: EChartsInitOpts) => EChartsType)
//     | undefined;
let createCanvas: ((width: number, height: number, type?: 'pdf' | 'svg') => Canvas) | undefined;
let JsDomClass: typeof JSDOM | undefined;

function calcTextWidth(text: string, fontSize?: number | string): number {
    // try to simulate
    return Math.ceil((text.length * (parseFloat(fontSize as string) || 12)) / 0.75);
}

class EchartsAdapter extends Adapter {
    public __lastMessageTime = 0;
    public __lastMessageText = '';
    private cachedSnapshots: Record<string, { ts: number; data: string | null; error: string }> = {};
    private socketSimulator: Connection = null;

    public constructor(options: Partial<AdapterOptions> = {}) {
        super({
            ...options,
            name: 'echarts',
        });
        this.on('ready', () => this.main());
        this.on('message', obj => obj?.command === 'send' && this.processMessage(obj));
    }

    // Todo: queue requests as  global.window is "global"
    async renderImage(options: EchartsOptions): Promise<string> {
        if (!createCanvas) {
            try {
                createCanvas = (await import('canvas')).createCanvas;
                JsDomClass = (await import('jsdom')).JSDOM;
                this.socketSimulator = getSocket(this);
            } catch (e) {
                this.log.error(`Cannot find required modules: ${e}`);
                throw new Error(
                    'Cannot find required modules: looks like it is not possible to generate charts on your Hardware/OS',
                );
            }
        }

        return new Promise((resolve, reject) => {
            options.width = parseFloat(options.width as unknown as string) || 1024;
            options.height = parseFloat(options.height as unknown as string) || 300;

            const chartData = new ChartModel(this.socketSimulator, options.preset, { serverSide: true });

            chartData.onError(err => this.log.error(err.toString()));

            chartData.onUpdate(
                (
                    seriesData: BarAndLineSeries[],
                    _actualValues?: (number | null | boolean | string)[],
                    barCategories?: number[],
                ) => {
                    const systemConfig = chartData.getSystemConfig();
                    moment.locale(systemConfig?.language || 'en');
                    const theme = options.theme || options.themeType || 'light';

                    const chartOption = new ChartOption(moment, theme, calcTextWidth);
                    const option = chartOption.getOption(
                        seriesData,
                        chartData.getConfig() as ChartConfigMore,
                        null,
                        barCategories,
                    );
                    const { window } = new JsDomClass();

                    // @ts-expect-error must be so
                    global.window = window;
                    global.navigator = window.navigator;
                    global.document = window.document;

                    let chart: EChartsType;
                    let canvas: Canvas | undefined;
                    let root: HTMLDivElement | undefined;
                    if (options.renderer && options.renderer !== 'svg') {
                        canvas = createCanvas(options.width, options.height);
                        canvas.width = options.width;
                        canvas.height = options.height;
                        chart = echartsInit(canvas as unknown as HTMLElement);
                        if (options.background) {
                            option.backgroundColor = options.background;
                        }
                    } else {
                        root = global.document.createElement('div');
                        root.style.cssText = `width: ${options.width}px; height: ${options.height}px;${
                            options.background
                                ? ` background: ${options.background}`
                                : theme === 'dark'
                                  ? ' background: #000;'
                                  : ''
                        }`;
                        chart = echartsInit(root, undefined, { renderer: 'svg' });
                    }

                    chart.setOption(option);

                    let data: string;
                    switch (options.renderer || '') {
                        case 'png': {
                            data = `data:image/png;base64,${canvas
                                .toBuffer('image/png', {
                                    compressionLevel: options.compressionLevel || 3,
                                    filters: options.filters || canvas.PNG_FILTER_NONE,
                                } as PngConfig)
                                .toString('base64')}`;
                            break;
                        }
                        case 'jpg': {
                            data = `data:image/jpeg;base64,${canvas
                                .toBuffer('image/jpeg', {
                                    quality: options.quality || 0.8,
                                } as JpegConfig)
                                .toString('base64')}`;
                            break;
                        }
                        case 'pdf': {
                            data = `data:application/pdf;base64,${canvas
                                .toBuffer('application/pdf', {
                                    title: options.title || 'ioBroker Chart',
                                    creationDate: new Date(),
                                } as PdfConfig)
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
                        writeFileSync(options.fileOnDisk, Buffer.from(data.split(',')[1], 'base64'));
                    }
                    if (options.fileName) {
                        this.writeFile(
                            this.namespace,
                            options.fileName,
                            Buffer.from(data.split(',')[1], 'base64'),
                            err => (err ? reject(err) : resolve(data)),
                        );
                    } else {
                        resolve(data);
                    }
                },
            );
        });
    }

    async fixSystemObject(): Promise<boolean> {
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

    processMessage(obj: ioBroker.Message): void {
        if (!obj?.message) {
            return;
        }

        // filter out the double messages
        const json = JSON.stringify(obj.message);
        if (this.__lastMessageTime && this.__lastMessageText === json && Date.now() - this.__lastMessageTime < 300) {
            return this.log.debug(
                `Filter out double message [first was for ${Date.now() - this.__lastMessageTime}ms]: ${json}`,
            );
        }

        this.__lastMessageTime = Date.now();
        this.__lastMessageText = json;

        const message: EchartsOptions = obj.message;

        if (!message?.preset) {
            this.log.error(
                'Please define settings: {"preset": "echarts.0.XXX", width: 500, height: 200, renderer: "png/svg"}',
            );
            if (obj.callback) {
                this.sendTo(
                    obj.from,
                    'send',
                    {
                        error: 'Please define settings: {"preset": "echarts.0.XXX", width: 500, height: 200, renderer: "svg/png"}',
                    },
                    obj.callback,
                );
            }
        } else {
            // delete cached snapshots
            Object.keys(this.cachedSnapshots).forEach(preset => {
                if (this.cachedSnapshots[preset].ts < Date.now()) {
                    delete this.cachedSnapshots[preset];
                }
            });

            if (
                message.cache &&
                !message.forceRefresh &&
                this.cachedSnapshots[message.preset] &&
                this.cachedSnapshots[message.preset].ts >= Date.now()
            ) {
                if (obj.callback) {
                    this.sendTo(
                        obj.from,
                        'send',
                        {
                            data: this.cachedSnapshots[message.preset].data,
                            error: this.cachedSnapshots[message.preset].error,
                        },
                        obj.callback,
                    );
                }
            } else {
                this.renderImage(message)
                    .then(data => {
                        if (message.cache) {
                            if (!this.cachedSnapshots[message.preset]) {
                                this.cachedSnapshots[message.preset] = {
                                    ts: Date.now() + message.cache * 1000,
                                    data,
                                    error: null,
                                };
                            } else {
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
                            } else {
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

    async main(): Promise<void> {
        // fix _design/chart
        let designObject: ioBroker.DesignObject | null | undefined = await this.getForeignObjectAsync('_design/chart');
        const _obj: any = JSON.parse(readFileSync(`${__dirname}/../io-package.json`).toString('utf8')).objects.find(
            (ob: ioBroker.Object) => ob._id === '_design/chart',
        );

        if (!designObject || (_obj && JSON.stringify(designObject.views) !== JSON.stringify(_obj.views))) {
            designObject = { language: 'javascript' } as ioBroker.DesignObject;
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
        if (
            adapterInstance?.common &&
            (adapterInstance.common.mode !== 'daemon' || !adapterInstance.common.messagebox)
        ) {
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
    module.exports = (options: Partial<AdapterOptions> | undefined) => new EchartsAdapter(options);
} else {
    // otherwise start the instance directly
    (() => new EchartsAdapter())();
}
