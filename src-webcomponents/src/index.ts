/**
 * `<iob-echarts-chart>`: a chart of E-Charts in any host of web components - a saved preset (`echarts.0.<name>`), or
 * the history of a single state as the vis-2 widget draws it.
 *
 * Nothing of the chart is written anew: the model (`ChartModel.ts`, reads the preset, the history and the states) and
 * the option (`ChartOption.ts`, builds what echarts draws) are the sources of `src-chart`, compiled in - the same the
 * chart page, the widgets and the server render with. This element only does what `ChartView.tsx` does with MUI:
 * draw the option, pan and zoom, and the buttons of the preset (image, CSV, time range, lines).
 *
 * The model talks to ioBroker through the socket of the host (`connection.ts`). echarts and moment are bundled; no
 * host shares them.
 */
import type { LegendComponentOption } from 'echarts';
import moment from 'moment';
import 'moment/dist/locale/de';
import 'moment/dist/locale/es';
import 'moment/dist/locale/fr';
import 'moment/dist/locale/it';
import 'moment/dist/locale/nl';
import 'moment/dist/locale/pl';
import 'moment/dist/locale/pt';
import 'moment/dist/locale/ru';
import 'moment/dist/locale/uk';
import 'moment/dist/locale/zh-cn';

import type {
    WebComponentSetting,
    WebComponentSettings,
    WebComponentSettingsPanel,
    WebComponentSocket,
} from '@iobroker/web-components';
import { defineWebComponent, IobWebComponent } from '@iobroker/web-components/element';

import ChartModel, { type BarAndLineSeries, type ChartTimeRangeOverride } from '@echarts-chart/ChartModel';
import ChartOption, { type ChartViewOption } from '@echarts-chart/ChartOption';
import type { ChartConfig, ChartConfigMore, ChartRelativeEnd } from '../../src/types';

import { toChartConnection } from './connection';
import { getPresetId, RANGES, RELATIVE_ENDS, TAG, type ChartSettings } from './constants';
import { fileName, readTimeFormat, saveText, saveUrl, storeTimeFormat, toCsv } from './download';
import { init, type ECharts } from './echarts';
import { ICONS, svgIcon } from './icons';
import { PanZoom } from './panZoom';
import { buildStateChart, findHistoryInstance } from './stateChart';
import { STYLES } from './styles';
import { word } from './words';

/** The chart of a single state: what is known of its history instance */
type HistoryChart =
    | { key: string; status: 'loading' }
    | { key: string; status: 'ready'; config: ChartConfig }
    | { key: string; status: 'noHistory' }
    | { key: string; status: 'error'; error: string };

/** What the settings name: a chart to draw, or the reason why there is none; `null` while it is read */
type Source = { key: string; config: ChartConfig | string } | { message: string; error?: boolean } | null;

/** The first button on the right edge of the chart; the others hang one slot below each other */
const BUTTON_TOP = 40;
const BUTTON_SLOT = 30;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{1,2}:\d{2}$/;

let measureCanvas: HTMLCanvasElement | null = null;

/**
 * The width of a text in px, for the room `ChartOption` leaves for the labels
 *
 * @param text the text
 * @param fontSize in px
 * @param fontFamily the font the chart draws with
 */
function measureText(text: string, fontSize: number, fontFamily: string): number {
    try {
        measureCanvas ||= document.createElement('canvas');
        const context = measureCanvas.getContext('2d');
        if (context) {
            context.font = `${fontSize || 12}px ${fontFamily || 'sans-serif'}`;
            return Math.ceil(context.measureText(text).width);
        }
    } catch {
        // no canvas: estimated below
    }
    return Math.ceil(String(text).length * (fontSize || 12) * 0.6);
}

/**
 * Everything that decides HOW a chart is built, not only what it shows (`ChartView.getShape`). echarts merges a new
 * option into the old one, so a chart of another shape must be cleared first, or the old axes stay under a donut.
 *
 * @param config the configuration of the chart
 */
function getShape(config: ChartConfigMore): string {
    const ids = config.l?.map(line => line.id) || [];
    ids.sort();
    return JSON.stringify({
        ids,
        mode: config.chartMode || 'mixed',
        gaugeShape: config.gaugeShape || 'ring',
        types: config.l?.map(line => line.chartType) || [],
    });
}

/**
 * Only a chart over time can be panned and zoomed: not one with bars, not one value per line
 *
 * @param config the configuration of the chart
 */
function canZoom(config: ChartConfigMore): boolean {
    const mode = config.chartMode;
    if (mode === 'donut' || mode === 'barCurrent' || mode === 'gauge') {
        return false;
    }
    return !!config.zoom && !config.l.some(line => line.chartType === 'bar' || line.chartType === 'polar');
}

/**
 * Set the tooltip and the name of a button for a screen reader
 *
 * @param button the button
 * @param title what it does
 */
function setTitle(button: HTMLButtonElement, title: string): void {
    if (button.title !== title) {
        button.title = title;
        button.setAttribute('aria-label', title);
    }
}

function createDiv(className: string): HTMLDivElement {
    const div = document.createElement('div');
    div.className = className;
    return div;
}

class EchartsChart extends IobWebComponent<ChartSettings> {
    readonly #box: HTMLDivElement;

    readonly #title: HTMLDivElement;

    readonly #frame: HTMLDivElement;

    /** echarts draws into this one; out of the flow, so it never adds to the size of the box */
    readonly #canvas: HTMLDivElement;

    readonly #message: HTMLDivElement;

    readonly #messageText: HTMLSpanElement;

    readonly #progress: HTMLDivElement;

    readonly #imageButton: HTMLButtonElement;

    readonly #rangeButton: HTMLButtonElement;

    readonly #exportButton: HTMLButtonElement;

    readonly #legendButton: HTMLButtonElement;

    readonly #resetButton: HTMLButtonElement;

    readonly #resizeObserver: ResizeObserver | null;

    readonly #panZoom: PanZoom;

    #model: ChartModel | null = null;

    /** What the running model draws */
    #modelKey = '';

    #modelConfig: ChartConfig | string = '';

    #modelSocket: WebComponentSocket | null = null;

    /** What the settings named the last time; the choices of the user belong to it */
    #sourceKey = '';

    #history: HistoryChart | null = null;

    #systemConfig: { socket: WebComponentSocket; promise: Promise<ioBroker.SystemConfigObject | null> } | null = null;

    /** The time range the user picked in the chart; it wins over the one of the preset */
    #timeRange: ChartTimeRangeOverride | null = null;

    #data: BarAndLineSeries[] | null = null;

    #actualValues: (number | null | boolean | string)[] = [];

    #categories: number[] = [];

    #config: ChartConfigMore | null = null;

    #error = '';

    #reading = false;

    #chart: ECharts | null = null;

    #chartTheme = '';

    #chartRenderer = '';

    #chartOption: ChartOption | null = null;

    #chartOptionLook = '';

    #option: ChartViewOption | null = null;

    #shape = '';

    /** The lines the user hid in the dialog; `null` until the preset tells which ones start hidden */
    #excluded: string[] | null = null;

    /** The legend entries the user switched in the legend of the chart */
    #selected: Record<string, boolean> | null = null;

    #look = '';

    #drawTimer: ReturnType<typeof setTimeout> | null = null;

    #exporting = false;

    constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = STYLES;

        this.#box = createDiv('box');
        this.#title = createDiv('title');
        this.#frame = createDiv('frame');
        this.#canvas = createDiv('canvas');
        this.#progress = createDiv('progress');
        this.#progress.hidden = true;
        this.#message = createDiv('message');
        this.#message.hidden = true;
        this.#messageText = document.createElement('span');
        this.#message.append(svgIcon(ICONS.chart), this.#messageText);

        this.#imageButton = this.#createButton('icon', ICONS.image, () => this.#saveImage());
        this.#rangeButton = this.#createButton('icon', ICONS.range, () => void this.#showRangeDialog());
        this.#exportButton = this.#createButton('icon', ICONS.table, () => void this.#exportData());
        this.#legendButton = this.#createButton('surface', ICONS.menu, () => void this.#showLegendDialog());
        this.#resetButton = this.#createButton('surface reset', ICONS.reset, () => {
            this.#resetButton.hidden = true;
            this.#model?.setNewRange();
        });

        this.#frame.append(
            this.#canvas,
            this.#imageButton,
            this.#rangeButton,
            this.#exportButton,
            this.#legendButton,
            this.#resetButton,
            this.#progress,
            this.#message,
        );
        this.#box.append(this.#title, this.#frame);
        root.append(style, this.#box);

        this.#resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.#resize()) : null;

        this.#panZoom = new PanZoom({
            chart: () => this.#chart,
            info: () => this.#chartOption?.getHelperChartData() || null,
            option: () => this.#option,
            config: () => this.#config,
            setRange: options => this.#model?.setNewRange(options),
            showReset: show => {
                this.#resetButton.hidden = !show;
            },
        });
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.#resizeObserver?.observe(this.#canvas);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.#resizeObserver?.disconnect();
        if (this.#drawTimer) {
            clearTimeout(this.#drawTimer);
            this.#drawTimer = null;
        }
        this.#panZoom.destroy();
        this.#destroyModel();
        // a host that only moves the element connects it again at once: the chart stays then
        queueMicrotask(() => {
            if (!this.isConnected) {
                this.#disposeChart();
            }
        });
    }

    protected getObjectIds(settings: ChartSettings): (string | undefined)[] {
        if (settings.preset) {
            return [getPresetId(settings.preset)];
        }
        return [settings.historyOid];
    }

    protected render(): void {
        const settings = this.settings;
        const socket = this.socket;
        this.#box.classList.toggle('edit', this.editMode);
        this.#title.textContent = (settings.title || '').toString().trim();

        if (!settings.preset && !settings.historyOid) {
            this.#stop();
            this.#showMessage(word(this.systemLang, 'choose'));
            return;
        }
        if (!socket) {
            // the chart stays as it is until the host hands a connection again
            this.#destroyModel();
            this.#showMessage('');
            this.#progress.hidden = false;
            return;
        }

        const source = this.#getSource(socket, settings);
        if (!source) {
            // being read
            this.#showMessage('');
            this.#progress.hidden = false;
            return;
        }
        if ('message' in source) {
            this.#stop();
            this.#showMessage(source.message, source.error);
            return;
        }
        this.#ensureModel(socket, source.key, source.config);
        this.#updateView();
    }

    /**
     * The chart the settings name
     *
     * @param socket the connection
     * @param settings the settings
     */
    #getSource(socket: WebComponentSocket, settings: ChartSettings): Source {
        const lang = this.systemLang;
        if (settings.preset) {
            const id = getPresetId(settings.preset);
            const obj = this.objects[id];
            if (obj === undefined) {
                return null;
            }
            if (!obj || obj.type !== 'chart') {
                return { message: `${word(lang, 'noPreset')} ${id}` };
            }
            // the model reads the preset itself and follows its changes
            return { key: `preset:${id}`, config: id };
        }

        const id = settings.historyOid as string;
        const obj = this.objects[id];
        if (obj === undefined) {
            return null;
        }
        if (!obj || obj.type !== 'state') {
            return { message: `${word(lang, 'noState')} ${id}` };
        }
        const common = obj.common as ioBroker.StateCommon;
        const custom = common.custom || {};
        const key = JSON.stringify([
            'state',
            id,
            lang,
            common.name,
            common.unit,
            common.color,
            common.type,
            Object.keys(custom).filter(instance => (custom[instance] as { enabled?: boolean })?.enabled),
            settings.chartType,
            settings.aggregate,
            settings.live,
            settings.aggregateType,
            settings.aggregateSpan,
            settings.xticks,
            settings.yticks,
            settings.range,
            settings.relativeEnd,
        ]);
        if (this.#history?.key !== key) {
            this.#resolveHistory(socket, obj, { ...settings }, key);
        }
        const history = this.#history as HistoryChart;
        switch (history.status) {
            case 'ready':
                return { key, config: history.config };
            case 'noHistory':
                return { message: `${word(lang, 'noHistory')} ${id}` };
            case 'error':
                return { message: history.error, error: true };
            default:
                return null;
        }
    }

    /**
     * Find the history instance of a state and build its chart, then draw again
     *
     * @param socket the connection
     * @param obj the object of the state
     * @param settings the settings the chart is built with
     * @param key what the result belongs to
     */
    #resolveHistory(socket: WebComponentSocket, obj: ioBroker.Object, settings: ChartSettings, key: string): void {
        this.#history = { key, status: 'loading' };
        const lang = this.systemLang;
        void (async (): Promise<void> => {
            let history: HistoryChart;
            try {
                const systemConfig = await this.#getSystemConfig(socket);
                const defaultHistory = systemConfig?.common?.defaultHistory || undefined;
                const instance = await findHistoryInstance(socket, obj, defaultHistory);
                history = instance
                    ? {
                          key,
                          status: 'ready',
                          config: buildStateChart(obj, instance, defaultHistory, settings, lang),
                      }
                    : { key, status: 'noHistory' };
            } catch (e) {
                history = { key, status: 'error', error: String(e) };
            }
            if (this.#history?.key === key) {
                this.#history = history;
                if (this.isConnected) {
                    this.render();
                }
            }
        })();
    }

    /**
     * `system.config`, read once per connection
     *
     * @param socket the connection
     */
    #getSystemConfig(socket: WebComponentSocket): Promise<ioBroker.SystemConfigObject | null> {
        if (this.#systemConfig?.socket !== socket) {
            this.#systemConfig = {
                socket,
                promise: socket
                    .getObject('system.config')
                    .then(obj => (obj as ioBroker.SystemConfigObject | null | undefined) || null)
                    .catch(() => null),
            };
        }
        return this.#systemConfig.promise;
    }

    /**
     * Start the model for a chart, unless it runs already
     *
     * @param socket the connection
     * @param key what the chart is
     * @param config a preset ID, or the configuration of the chart of a state
     */
    #ensureModel(socket: WebComponentSocket, key: string, config: ChartConfig | string): void {
        if (this.#model && this.#modelKey === key && this.#modelSocket === socket) {
            return;
        }
        if (key !== this.#sourceKey) {
            // another chart: the choices of the user belonged to the old one
            this.#sourceKey = key;
            this.#timeRange = null;
            this.#excluded = null;
            this.#selected = null;
            this.#data = null;
            this.#config = null;
            this.#error = '';
            this.#resetButton.hidden = true;
        }
        this.#createModel(socket, key, config);
    }

    #createModel(socket: WebComponentSocket, key: string, config: ChartConfig | string): void {
        this.#destroyModel();
        const model = new ChartModel(toChartConnection(socket), config, { updateTimeout: 300 });
        this.#model = model;
        this.#modelKey = key;
        this.#modelConfig = config;
        this.#modelSocket = socket;

        model.onError(error => {
            if (this.#model === model) {
                this.#error = error?.toString() || 'Error';
                this.#updateView();
            }
        });
        model.onReading(reading => {
            if (this.#model === model) {
                this.#reading = reading;
                this.#progress.hidden = !this.#reading && !!this.#data;
            }
        });
        model.onUpdate((seriesData, actualValues, categories) => {
            if (this.#model !== model) {
                return;
            }
            // `null` as data: only a current value changed
            if (seriesData) {
                this.#data = seriesData;
                this.#categories = categories || [];
                // the model reports the end of a read only on an error: new data is the end of it
                this.#reading = false;
                this.#progress.hidden = true;
            }
            if (actualValues) {
                this.#actualValues = actualValues;
            }
            this.#error = '';
            this.#scheduleDraw();
        });
        if (this.#timeRange) {
            model.setTimeRange(this.#timeRange);
        }
    }

    #destroyModel(): void {
        if (this.#model) {
            this.#model.onUpdate(null);
            this.#model.onReading(null);
            this.#model.onError(null);
            this.#model.destroy();
            this.#model = null;
        }
        this.#modelKey = '';
        this.#modelSocket = null;
        this.#reading = false;
    }

    /** No chart: the settings name none, or one that is not there */
    #stop(): void {
        this.#destroyModel();
        this.#sourceKey = '';
        this.#data = null;
        this.#config = null;
        this.#option = null;
        this.#error = '';
        this.#disposeChart();
        this.#updateButtons();
    }

    #disposeChart(): void {
        this.#panZoom.destroy();
        if (this.#chart) {
            this.#chart.dispose();
            this.#chart = null;
        }
        this.#shape = '';
    }

    #showMessage(text: string, error?: boolean): void {
        this.#progress.hidden = true;
        this.#message.hidden = !text;
        this.#message.classList.toggle('error', !!error);
        this.#messageText.textContent = text;
    }

    /** The message, the progress and the buttons as the state of the model says; a new theme draws again */
    #updateView(): void {
        if (this.#error) {
            this.#showMessage(this.#error, true);
        } else {
            this.#showMessage('');
            this.#progress.hidden = !this.#reading && !!this.#data;
        }
        this.#updateButtons();

        const look = `${this.theme.type}|${this.theme.fontFamily}|${this.systemLang}`;
        if (look !== this.#look) {
            this.#look = look;
            if (this.#data) {
                this.#scheduleDraw(0);
            }
        }
    }

    /** The buttons the preset switches on, where the chart page has them */
    #updateButtons(): void {
        const lang = this.systemLang;
        const config = this.#data ? this.#config : null;
        const oneValue = config?.chartMode === 'donut' || config?.chartMode === 'gauge';

        const image = !!config?.export;
        const range = !!config && !!(config.rangeSelector || this.settings.rangeSelector) && !oneValue;
        const exportData = !!config?.exportData;
        const legend = config?.legend === 'dialog' && !!this.#option;

        this.#imageButton.hidden = !image;
        this.#imageButton.style.top = `${BUTTON_TOP}px`;
        this.#imageButton.style.color = config?.exportColor || '';
        setTitle(this.#imageButton, word(lang, this.#option?.useCanvas ? 'savePng' : 'saveSvg'));

        this.#rangeButton.hidden = !range;
        this.#rangeButton.style.top = `${image ? BUTTON_TOP + BUTTON_SLOT : BUTTON_TOP}px`;
        this.#rangeButton.style.color = config?.exportColor || '';
        setTitle(this.#rangeButton, word(lang, 'timeRange'));

        // the time range stands between the image and the CSV, so both keep their place without it
        this.#exportButton.hidden = !exportData;
        this.#exportButton.style.top = `${BUTTON_TOP + BUTTON_SLOT + (range && image ? BUTTON_SLOT : 0)}px`;
        this.#exportButton.style.color = config?.exportDataColor || '';
        this.#exportButton.classList.toggle('busy', this.#exporting);
        setTitle(this.#exportButton, word(lang, 'exportData'));

        this.#legendButton.hidden = !legend;
        const grid = this.#option?.grid as { left?: unknown } | undefined;
        this.#legendButton.style.left = `${typeof grid?.left === 'number' ? grid.left : 0}px`;
        setTitle(this.#legendButton, word(lang, 'selectLines'));

        setTitle(this.#resetButton, word(lang, 'resetZoom'));
        if (!config) {
            this.#resetButton.hidden = true;
        }
    }

    #createButton(className: string, icon: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.hidden = true;
        button.append(svgIcon(icon));
        button.addEventListener('click', event => {
            event.stopPropagation();
            if (!this.editMode) {
                onClick();
            }
        });
        return button;
    }

    /**
     * Draw after a short while, so a burst of updates draws once - as the chart page does
     *
     * @param delay in ms
     */
    #scheduleDraw(delay = 100): void {
        if (this.#drawTimer) {
            clearTimeout(this.#drawTimer);
        }
        this.#drawTimer = setTimeout(() => {
            this.#drawTimer = null;
            this.#draw();
        }, delay);
    }

    #draw(): void {
        const model = this.#model;
        const data = this.#data;
        if (!model || !data || !this.isConnected) {
            return;
        }
        let config: ChartConfigMore;
        try {
            config = model.getConfig();
        } catch {
            return;
        }
        this.#config = config;

        // the colors of the texts and the axes come from the theme while the option is built
        const theme = this.theme;
        const fontFamily = theme.fontFamily;
        const look = `${theme.type}|${fontFamily}`;
        if (!this.#chartOption || this.#chartOptionLook !== look) {
            this.#chartOption = new ChartOption(moment, theme.type, (text, fontSize) =>
                measureText(text, fontSize, fontFamily),
            );
            this.#chartOptionLook = look;
        }
        moment.locale(this.systemLang);

        let option: ChartViewOption;
        try {
            option = this.#chartOption.getOption(data, config, this.#actualValues, this.#categories);
        } catch (e) {
            console.error(`<${TAG}>: cannot build the chart: ${String(e)}`);
            return;
        }
        option.textStyle = { fontFamily, ...option.textStyle };
        if (this.#excluded === null) {
            // "show only in the legend"
            this.#excluded = config.l.filter(line => line.hide === true).map(line => line.id);
        }
        this.#applySelected(option, config);
        this.#option = option;
        this.#applyFrame(config);

        const renderer = option.useCanvas ? 'canvas' : 'svg';
        const echartsTheme = typeof option.theme === 'string' ? option.theme : '';
        if (this.#chart && (this.#chartRenderer !== renderer || this.#chartTheme !== echartsTheme)) {
            this.#disposeChart();
        }
        if (!this.#chart) {
            const chart = init(this.#canvas, echartsTheme || undefined, { renderer });
            chart.on('legendselectchanged', (params: unknown) => {
                this.#selected = { ...(params as { selected: Record<string, boolean> }).selected };
            });
            this.#chart = chart;
            this.#chartRenderer = renderer;
            this.#chartTheme = echartsTheme;
            this.#shape = '';
        }

        const shape = getShape(config);
        const changed = shape !== this.#shape;
        if (changed && this.#shape) {
            this.#chart.clear();
        }
        this.#shape = shape;
        try {
            this.#chart.setOption(option, changed);
        } catch (e) {
            console.error(`<${TAG}>: cannot draw the chart: ${String(e)}`);
        }

        this.#panZoom.install(canZoom(config), !!option.useCanvas, this.#canvas);
        this.#updateView();
    }

    #resize(): void {
        try {
            this.#chart?.resize();
        } catch {
            // disposed meanwhile
        }
    }

    /**
     * The background, the border and the padding of the preset around the chart
     *
     * @param config the configuration of the chart
     */
    #applyFrame(config: ChartConfigMore): void {
        const borderWidth = config.noBorder !== 'noborder' ? parseFloat(String(config.border_width)) || 0 : 0;
        const padding = parseFloat(String(config.border_padding)) || 0;
        const style = this.#frame.style;
        style.background = config.noBackground ? '' : config.window_bg || '';
        style.borderWidth = borderWidth ? `${borderWidth}px` : '';
        style.borderStyle = borderWidth ? config.border_style || 'solid' : '';
        style.borderColor = borderWidth ? config.border_color || '' : '';
        this.#canvas.style.inset = padding ? `${padding}px` : '';
    }

    /**
     * Keep the lines the user hid: in the dialog, or in the legend of the chart
     *
     * @param option the new option
     * @param config the configuration of the chart
     */
    #applySelected(option: ChartViewOption, config: ChartConfigMore): void {
        if (config.legend === 'dialog') {
            option.legend = {
                data: config.l.map(line => line.name).filter((name): name is string => !!name),
                show: false,
                selected: this.#getLegendSelection(config),
            };
        } else if (this.#selected && option.legend) {
            const legend = option.legend as LegendComponentOption;
            legend.selected = { ...(legend.selected || {}), ...this.#selected };
        }
    }

    /**
     * Which names the legend shows. Several lines may share a name: it is shown only if none of them is hidden
     *
     * @param config the configuration of the chart
     */
    #getLegendSelection(config: ChartConfigMore): Record<string, boolean> {
        const excluded = this.#excluded || [];
        const selected: Record<string, boolean> = {};
        config.l.forEach(line => {
            if (line.name) {
                selected[line.name] = selected[line.name] !== false && !excluded.includes(line.id);
            }
        });
        return selected;
    }

    async #showLegendDialog(): Promise<void> {
        const config = this.#config;
        if (!config) {
            return;
        }
        const lang = this.systemLang;
        const excluded = this.#excluded || [];

        // lines of the same name are one entry of the legend, so they are switched together
        const groups: { name: string; ids: string[] }[] = [];
        config.l.forEach(line => {
            if (line.hideInLegend) {
                return;
            }
            const group = line.name ? groups.find(item => item.name === line.name) : undefined;
            if (group) {
                group.ids.push(line.id);
            } else {
                groups.push({ name: line.name || '', ids: [line.id] });
            }
        });

        const items: Record<string, WebComponentSetting> = {};
        const data: WebComponentSettings = {};
        groups.forEach((group, i) => {
            items[`line${i}`] = {
                type: 'checkbox',
                label: group.name || group.ids.join(', '),
                help: group.name ? group.ids.join(', ') : undefined,
            };
            data[`line${i}`] = !group.ids.some(id => excluded.includes(id));
        });

        const result = await this.openDialog({
            title: word(lang, 'linesToShow'),
            form: { type: 'panel', items },
            data,
        });
        if (!result || this.#config !== config) {
            return;
        }
        // lines that are not in the dialog keep what they had
        const newExcluded = excluded.filter(id => !groups.some(group => group.ids.includes(id)));
        groups.forEach((group, i) => {
            if (!result[`line${i}`]) {
                newExcluded.push(...group.ids);
            }
        });
        this.#excluded = newExcluded;

        const selected = this.#getLegendSelection(config);
        if (this.#option?.legend) {
            (this.#option.legend as LegendComponentOption).selected = selected;
        }
        try {
            this.#chart?.setOption({ legend: { selected } });
        } catch (e) {
            console.error(`<${TAG}>: cannot select the lines: ${String(e)}`);
        }
    }

    async #showRangeDialog(): Promise<void> {
        const config = this.#config;
        if (!config || !this.#model) {
            return;
        }
        const lang = this.systemLang;
        const current = this.#timeRange || {};
        const today = moment().format('YYYY-MM-DD');
        const date = (...values: unknown[]): string =>
            (values.find(value => typeof value === 'string' && DATE.test(value)) as string | undefined) || today;
        const time = (fallback: string, ...values: unknown[]): string =>
            (values.find(value => typeof value === 'string' && TIME.test(value)) as string | undefined) || fallback;

        const isStatic = 'data.timeType === "static"';
        const form: WebComponentSettingsPanel = {
            type: 'panel',
            items: {
                timeType: {
                    type: 'select',
                    label: word(lang, 'timeType'),
                    options: [
                        { value: 'relative', label: word(lang, 'relative') },
                        { value: 'static', label: word(lang, 'static') },
                    ],
                },
                range: {
                    type: 'select',
                    label: word(lang, 'range'),
                    options: RANGES.map(choice => ({ value: choice.value, label: word(lang, choice.word) })),
                    hidden: isStatic,
                },
                relativeEnd: {
                    type: 'select',
                    label: word(lang, 'relativeEnd'),
                    options: RELATIVE_ENDS.map(choice => ({ value: choice.value, label: word(lang, choice.word) })),
                    hidden: isStatic,
                },
                start: {
                    type: 'text',
                    label: word(lang, 'start'),
                    help: word(lang, 'date_help'),
                    hidden: `!(${isStatic})`,
                },
                start_time: {
                    type: 'text',
                    label: word(lang, 'start_time'),
                    help: word(lang, 'time_help'),
                    hidden: `!(${isStatic})`,
                },
                end: {
                    type: 'text',
                    label: word(lang, 'end'),
                    help: word(lang, 'date_help'),
                    hidden: `!(${isStatic})`,
                },
                end_time: {
                    type: 'text',
                    label: word(lang, 'end_time'),
                    help: word(lang, 'time_help'),
                    hidden: `!(${isStatic})`,
                },
            },
        };
        const result = await this.openDialog({
            title: word(lang, 'timeRange'),
            form,
            data: {
                timeType: current.timeType || config.timeType || 'relative',
                range: String(current.range ?? config.range ?? '1440'),
                relativeEnd: current.relativeEnd || config.relativeEnd || 'now',
                start: date(current.start, config.start),
                start_time: time('00:00', current.start_time, config.start_time),
                end: date(current.end, config.end),
                end_time: time('23:59', current.end_time, config.end_time),
            },
        });
        if (!result || !this.#model || this.#config !== config) {
            return;
        }

        let override: ChartTimeRangeOverride;
        if (result.timeType === 'static') {
            const values = [result.start, result.start_time, result.end, result.end_time].map(value =>
                String(value ?? '').trim(),
            );
            if (!DATE.test(values[0]) || !TIME.test(values[1]) || !DATE.test(values[2]) || !TIME.test(values[3])) {
                await this.#showInfo(`${word(lang, 'date_help')}\n${word(lang, 'time_help')}`);
                return;
            }
            override = {
                timeType: 'static',
                start: values[0],
                start_time: values[1],
                end: values[2],
                end_time: values[3],
            };
        } else {
            override = {
                timeType: 'relative',
                range: String(result.range || config.range),
                relativeEnd: (result.relativeEnd || 'now') as ChartRelativeEnd,
            };
        }
        this.#timeRange = { ...this.#timeRange, ...override };
        this.#resetButton.hidden = true;

        if (override.timeType === 'static' && this.#modelSocket) {
            // the model keeps the borders of a static range per configuration object, and the range of the chart
            // changes the object it has: a new model starts with the new borders
            this.#createModel(this.#modelSocket, this.#modelKey, this.#modelConfig);
        } else {
            this.#model.setTimeRange(override);
        }
    }

    #saveImage(): void {
        const chart = this.#chart;
        const option = this.#option;
        const config = this.#config;
        if (!chart || !option || !config) {
            return;
        }
        const lang = this.systemLang;
        const background = config.window_bg || (this.theme.type === 'dark' ? '#000' : '#FFF');
        let url = chart.getDataURL({ pixelRatio: 2, backgroundColor: background });

        if (!option.useCanvas) {
            // the SVG has no background of its own
            try {
                const comma = url.indexOf(',');
                let xml = decodeURIComponent(url.substring(comma + 1));
                xml = xml.replace('fill="none"', `fill="${background}"`);
                xml = xml.replace('fill="transparent"', `fill="${background}"`);
                url = `${url.substring(0, comma)},${encodeURIComponent(xml)}`;
            } catch (e) {
                console.warn(`<${TAG}>: cannot add the background: ${String(e)}`);
            }
        }

        const series = (Array.isArray(option.series) ? option.series : [option.series]) as (
            { data?: unknown[] } | undefined
        )[];
        const points = series[0]?.data;
        if (!points?.length) {
            void this.#showInfo(word(lang, 'noData'));
            return;
        }
        const xAxis = (Array.isArray(option.xAxis) ? option.xAxis : [option.xAxis]) as (
            { max?: unknown } | undefined
        )[];
        const last = points[points.length - 1] as { value?: unknown } | undefined;
        const ts = Number(xAxis[0]?.max) || (Array.isArray(last?.value) ? Number(last.value[0]) : 0) || Date.now();
        const name = config.l.length === 1 ? config.l[0].name || 'chart' : 'chart';

        if (!saveUrl(this.#frame, url, fileName(new Date(ts), name, option.useCanvas ? 'png' : 'svg'))) {
            void this.#showInfo(word(lang, 'noDownload'));
        }
    }

    async #exportData(): Promise<void> {
        const config = this.#config;
        const model = this.#model;
        const info = this.#chartOption?.getHelperChartData();
        if (this.#exporting || !config || !model || !info) {
            return;
        }
        const lang = this.systemLang;
        let timeFormat = readTimeFormat();
        let excludes: string[] = [];

        if (config.l.length > 1) {
            const excluded = this.#excluded || [];
            const items: Record<string, WebComponentSetting> = {
                timeFormat: {
                    type: 'select',
                    label: word(lang, 'timeFormat'),
                    options: [
                        { value: 'iso', label: 'ISO' },
                        { value: 'locale', label: word(lang, 'browserFormat') },
                        { value: 'ts', label: word(lang, 'timestamp') },
                    ],
                },
                lines: { type: 'header', text: word(lang, 'linesToExport') },
            };
            const data: WebComponentSettings = { timeFormat };
            config.l.forEach((line, i) => {
                items[`line${i}`] = {
                    type: 'checkbox',
                    label: line.name || line.id,
                    help: line.name ? line.id : undefined,
                };
                data[`line${i}`] = !excluded.includes(line.id);
            });
            const result = await this.openDialog({
                title: word(lang, 'exportData'),
                form: { type: 'panel', items },
                data,
                ok: word(lang, 'export'),
            });
            if (!result || this.#config !== config || this.#model !== model) {
                return;
            }
            const format = result.timeFormat;
            if (format === 'iso' || format === 'locale' || format === 'ts') {
                timeFormat = format;
                storeTimeFormat(timeFormat);
            }
            excludes = config.l.filter((_line, i) => !result[`line${i}`]).map(line => line.id);
            if (excludes.length === config.l.length) {
                return;
            }
        }

        this.#exporting = true;
        this.#updateButtons();
        try {
            const values = await model.exportData(info.xMin, info.xMax, excludes);
            const name = config.l.length === 1 ? config.l[0].name || 'chart' : 'chart';
            if (
                !saveText(
                    this.#frame,
                    toCsv(values, timeFormat),
                    fileName(new Date(info.xMin), name, 'csv'),
                    'text/csv;charset=utf-8',
                )
            ) {
                await this.#showInfo(word(lang, 'noDownload'));
            }
        } catch (e) {
            console.error(`<${TAG}>: cannot export the data: ${String(e)}`);
        } finally {
            this.#exporting = false;
            this.#updateButtons();
        }
    }

    /**
     * A message in a dialog of the host
     *
     * @param text the message
     */
    async #showInfo(text: string): Promise<void> {
        await this.openDialog({
            form: { type: 'panel', items: { info: { type: 'staticText', text } } },
        });
    }
}

defineWebComponent(TAG, EchartsChart);
