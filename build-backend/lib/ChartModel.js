"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Parse a query string into its parts.
 * Copied from @iobroker/adapter-react-v5/Components/Utils
 */
function parseQuery(query) {
    query = (query || '').toString().replace(/^\?/, '');
    const result = {};
    query.split('&').forEach(part => {
        part = part.trim();
        if (part) {
            const parts = part.split('=');
            const attr = decodeURIComponent(parts[0]).trim();
            if (parts.length > 1) {
                result[attr] = decodeURIComponent(parts[1]);
                if (result[attr] === 'true') {
                    result[attr] = true;
                }
                else if (result[attr] === 'false') {
                    result[attr] = false;
                }
                else {
                    const f = parseFloat(result[attr]);
                    if (f.toString() === result[attr]) {
                        result[attr] = f;
                    }
                }
            }
            else {
                result[attr] = true;
            }
        }
    });
    return result;
}
// Do not forget to change normalizeConfig in src/utils/flotConverter.js too
function normalizeConfig(config) {
    const newConfig = JSON.parse(JSON.stringify(config));
    if (config.lines) {
        newConfig.l = config.lines;
        // @ts-expect-error delete old structure
        delete newConfig.lines;
    }
    if (config._ids) {
        const ids = config._ids ? config._ids.split(';') : [];
        const colors = config._colors ? config._colors.split(';') : [];
        const names = config._names ? config._names.split(';') : [];
        const units = config._units ? config._units.split(';') : [];
        newConfig.l = [];
        for (let i = 0; i < ids.length; i++) {
            newConfig.l.push({
                id: ids[i],
                offset: 0,
                name: names[i] || undefined,
                aggregate: 'none',
                color: colors[i] || 'blue',
                thickness: config.strokeWidth || 1,
                shadowsize: config.strokeWidth || 1,
                min: config.min || undefined,
                max: config.max || undefined,
                unit: units[i] || undefined,
            });
        }
        newConfig.aggregateType = 'step';
        newConfig.aggregateSpan = 300;
        newConfig.relativeEnd = 'now';
    }
    // convert art to aggregate (from flot)
    if (config.l) {
        for (let j = 0; j < config.l.length; j++) {
            if (config.l[j].art) {
                config.l[j].aggregate = config.l[j].art;
                delete config.l[j].art;
            }
            if (config.instance && !config.l[j].instance) {
                config.l[j].instance = config.instance;
            }
            config.l[j].yOffset = parseFloat(config.l[j].yOffset) || 0;
            config.l[j].offset = parseFloat(config.l[j].offset) || 0;
            config.l[j].validTime = parseFloat(config.l[j].validTime) || 0;
            config.l[j].chartType = config.l[j].chartType || config.chartType || 'auto';
        }
    }
    config.l = config.l || [];
    // convert marks
    if (config.m) {
        newConfig.marks = [];
        for (let j = 0; j < config.m.length; j++) {
            newConfig.marks[j] = {
                lineId: config.m[j].l,
                upperValueOrId: config.m[j].v,
                lowerValueOrId: config.m[j].vl,
                color: config.m[j].c,
                fill: parseFloat(config.m[j].f),
                ol: config.m[j].t,
                os: config.m[j].s,
                text: config.m[j].d,
                textPosition: config.m[j].p,
                textOffset: config.m[j].py,
                textColor: config.m[j].fc,
                textSize: config.m[j].fs,
            };
        }
        // @ts-expect-error delete old structure
        delete newConfig.m;
    }
    newConfig.marks = newConfig.marks || [];
    if (!newConfig.l?.length) {
        config.l = config.l || [];
        config.l.push({ id: '', unit: '' });
    }
    // Set default values
    newConfig.width = config.width || '100%';
    newConfig.height = config.height || '100%';
    // if width or height does not have any units, add px to it
    if (parseFloat(newConfig.width).toString() === newConfig.width.toString().trim()) {
        newConfig.width += 'px';
    }
    if (parseFloat(newConfig.height).toString() === newConfig.height.toString().trim()) {
        newConfig.height += 'px';
    }
    newConfig.timeFormat = config.timeFormat || '';
    newConfig.useComma = config.useComma === 'true' || config.useComma === true;
    newConfig.zoom = config.zoom === 'true' || config.zoom === true;
    newConfig.export = config.export === 'true' || config.export === true;
    newConfig.grid_hideX = config.grid_hideX === 'true' || config.grid_hideX === true;
    newConfig.grid_hideY = config.grid_hideY === 'true' || config.grid_hideY === true;
    newConfig.hoverDetail = config.hoverDetail === 'true' || config.hoverDetail === true;
    newConfig.noLoader = config.noLoader === 'true' || config.noLoader === true;
    newConfig.noedit = config.noedit === 'true' || config.noedit === true;
    newConfig.animation = parseInt(config.animation, 10) || 0;
    newConfig.afterComma = config.afterComma === undefined ? 2 : parseInt(config.afterComma, 10);
    newConfig.timeType = config.timeType || 'relative';
    if (config.xLabelShift) {
        if (typeof config.xLabelShift === 'string' && config.xLabelShift.endsWith('m')) {
            newConfig.xLabelShift = parseInt(config.xLabelShift.substring(0, config.xLabelShift.length - 1), 10) || 0;
            newConfig.xLabelShiftMonth = true;
        }
        else if (typeof config.xLabelShift === 'string' && config.xLabelShift.endsWith('y')) {
            newConfig.xLabelShift = parseInt(config.xLabelShift.substring(0, config.xLabelShift.length - 1), 10) || 0;
            newConfig.xLabelShiftYear = true;
        }
        else {
            newConfig.xLabelShift = parseInt(config.xLabelShift, 10) || 0;
        }
    }
    return newConfig;
}
const NOT_CONNECTED = 'notConnectedError';
class ChartModel {
    socket;
    updateTimeout;
    serverSide;
    // For line charts
    seriesData = [];
    // For Bar or polar charts
    barData = [];
    // Actual values for every line/bar. Only if config.legActual === true
    actualValues = [];
    ticks = null;
    reading = false;
    subscribes = [];
    sessionId = 1;
    // update interval by time
    updateInterval = null;
    presetUpdateTimeout = null;
    readOnZoomTimeout = null;
    subscribed = false;
    // Is preset subscribed yet or not
    presetSubscribed = '';
    defaultHistory = '';
    onUpdateFunc = null;
    onReadingFunc = null;
    onErrorFunc = null;
    objectPromises = {};
    debug = false;
    zoomData = null;
    lastHash;
    onHashInstalled = false;
    systemConfig = null;
    preset;
    config;
    barCategories;
    now = Date.now();
    hash;
    convertFunctions = {};
    constructor(socket, 
    /** Config or preset ID */
    config, options) {
        options = { updateTimeout: 300, ...(options || {}) };
        this.socket = socket;
        this.updateTimeout = options.updateTimeout || 300; // how often the new data will be requested by zoom and pan
        this.serverSide = options.serverSide || false; // if rendering is serverside
        if (!this.serverSide) {
            this.lastHash = window.location.hash;
            if (!config) {
                this.onHashInstalled = true;
                window.addEventListener('hashchange', this.onHashChange, false);
            }
        } // else node.js
        void this.socket
            .getSystemConfig()
            .catch((e) => {
            if (e.toString().includes(NOT_CONNECTED) && this.onErrorFunc) {
                this.onErrorFunc(e);
            }
            console.error(`Cannot read systemConfig: ${e.toString()}`);
            return null;
        })
            .then((systemConfig) => {
            this.systemConfig = systemConfig?.common ? systemConfig.common : {};
            this.defaultHistory = this.systemConfig.defaultHistory;
            return this.analyseAndLoadConfig(config);
        });
    }
    async analyseAndLoadConfig(config) {
        if (config) {
            if (typeof config === 'string') {
                this.preset = config;
            }
            else {
                this.config = normalizeConfig(config);
            }
        }
        else if (!this.serverSide) {
            const query = parseQuery(window.location.search); // Utils.parseQuery
            this.debug = query.debug === true || query.debug === 'true' || query.debug === 1 || query.debug === '1';
            if (query.preset && typeof query.preset === 'string') {
                this.preset = query.preset;
            }
            else {
                const hQuery = parseQuery((window.location.hash || '').toString().replace(/^#/, '')); // Utils.parseQuery
                let config = {};
                if (hQuery.data && typeof hQuery.data === 'string') {
                    try {
                        config = JSON.parse(hQuery.data);
                    }
                    catch {
                        // ignore
                    }
                }
                if (query.data && typeof query.data === 'string') {
                    try {
                        Object.assign(config, JSON.parse(query.data), true);
                    }
                    catch {
                        // ignore
                    }
                }
                if (hQuery.preset) {
                    this.preset = hQuery.preset;
                    if (hQuery.range || hQuery.relativeEnd) {
                        this.hash = {
                            range: hQuery.range,
                            relativeEnd: hQuery.relativeEnd,
                        };
                    }
                }
                else {
                    // search ID and range
                    if (hQuery.noLoader !== undefined) {
                        config.noLoader =
                            hQuery.noLoader === true ||
                                hQuery.noLoader === 'true' ||
                                hQuery.noLoader === 1 ||
                                hQuery.noLoader === '1';
                    }
                    if (query.noLoader !== undefined) {
                        config.noLoader =
                            query.noLoader === true ||
                                query.noLoader === 'true' ||
                                query.noLoader === 1 ||
                                query.noLoader === '1';
                    }
                    this.config = normalizeConfig(config);
                    // console.log(this.config);
                }
            }
        }
        this.seriesData = [];
        this.barData = [];
        this.barCategories = null;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.preset) {
            if ((!this.preset.startsWith('echarts.') && !this.preset.startsWith('flot.')) ||
                !this.preset.includes('.')) {
                this.preset = `echarts.0.${this.preset}`;
            }
            try {
                const obj = (await this.socket.getObject(this.preset));
                if (!obj?.native?.data || obj.type !== 'chart') {
                    console.error(`[ChartModel] Invalid object ${this.preset}: ${JSON.stringify(obj)}`);
                    return;
                }
                this.config = normalizeConfig(obj.native.data);
                this.config.useComma =
                    this.config.useComma === undefined ? this.systemConfig.isFloatComma : this.config.useComma;
                this.config.lang = this.systemConfig.language;
                this.config.live = parseInt(this.config.live, 10) || 0;
                this.config.debug = this.debug;
                this.config.presetId = this.preset;
                if (this.hash?.range) {
                    if (typeof this.hash.range === 'string' &&
                        !this.hash.range.includes('y') &&
                        !this.hash.range.includes('m')) {
                        this.config.range = parseInt(this.hash.range, 10);
                    }
                    else {
                        this.config.range = this.hash.range;
                    }
                }
                if (this.hash?.relativeEnd) {
                    this.config.relativeEnd = this.hash.relativeEnd;
                }
                await this.readData();
                // subscribe on preset changes
                if (!this.serverSide && this.presetSubscribed !== this.preset) {
                    this.presetSubscribed &&
                        (await this.socket.unsubscribeObject(this.presetSubscribed, this.onPresetUpdate));
                    this.presetSubscribed = this.preset;
                    await this.socket.subscribeObject(this.preset, this.onPresetUpdate);
                }
                if (!this.serverSide && this.config.live && !this.zoomData?.stopLive) {
                    this.updateInterval = setInterval(() => this.readData(), this.config.live * 1000);
                }
            }
            catch (e) {
                e === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(e);
                console.error(`Cannot read "${this.preset}": ${e}`);
            }
        }
        else {
            this.config.useComma =
                this.config.useComma === undefined
                    ? this.systemConfig.isFloatComma === true
                    : this.config.useComma === true;
            this.config.lang = this.systemConfig.language;
            this.config.live = parseInt(this.config.live, 10) || 0;
            this.config.debug = this.debug;
            await this.readData();
            if (!this.serverSide && this.config.live && !this.zoomData?.stopLive) {
                this.updateInterval = setInterval(() => this.readData(), this.config.live * 1000);
            }
        }
    }
    onHashChange = () => {
        if (this.lastHash !== window.location.hash) {
            this.lastHash = window.location.hash;
            void this.analyseAndLoadConfig();
        }
    };
    onPresetUpdate = (id, obj) => {
        if (id !== this.preset) {
            return;
        }
        if (this.presetUpdateTimeout) {
            clearTimeout(this.presetUpdateTimeout);
        }
        this.presetUpdateTimeout = setTimeout(() => {
            this.presetUpdateTimeout = null;
            let newConfig;
            if (obj) {
                newConfig = normalizeConfig(obj.native.data);
            }
            else {
                newConfig = normalizeConfig({});
            }
            if (JSON.stringify(newConfig) !== JSON.stringify(this.config)) {
                this.config = newConfig;
                this.updateInterval && clearInterval(this.updateInterval);
                this.updateInterval = null;
                if (this.config.live && (!this.zoomData || !this.zoomData.stopLive)) {
                    this.updateInterval = setInterval(() => this.readData(), this.config.live * 1000);
                }
                void this.readData();
            }
        }, 100);
    };
    setNewRange(options) {
        if (this.debug) {
            console.log(`[ChartModel] [${new Date().toISOString()}] setNewRange: ${JSON.stringify(options)}`);
        }
        if (!options) {
            if (this.zoomData) {
                this.zoomData = null;
                this.readOnZoomTimeout && clearTimeout(this.readOnZoomTimeout);
                this.readOnZoomTimeout = setTimeout(() => {
                    this.readOnZoomTimeout = null;
                    if (this.config.live && (!this.zoomData || !this.zoomData.stopLive)) {
                        console.log('Restore update');
                        this.updateInterval && clearInterval(this.updateInterval);
                        this.updateInterval = setInterval(() => this.readData(), this.config.live * 1000);
                    }
                    void this.readData();
                }, this.updateTimeout);
            }
        }
        else if (options.stopLive) {
            this.zoomData = this.zoomData || {};
            this.zoomData.stopLive = true;
            if (this.updateInterval) {
                console.log('Clear interval');
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        }
        else {
            // options = {start, end}
            const stopLive = this.zoomData?.stopLive;
            if (stopLive) {
                delete this.zoomData.stopLive;
            }
            if (!this.zoomData || JSON.stringify(this.zoomData) !== JSON.stringify(options)) {
                this.zoomData = options;
                if (stopLive) {
                    this.zoomData.stopLive = true;
                }
                this.readOnZoomTimeout && clearTimeout(this.readOnZoomTimeout);
                this.readOnZoomTimeout = setTimeout(() => {
                    this.readOnZoomTimeout = null;
                    void this.readData();
                }, this.updateTimeout);
            }
            else if (stopLive) {
                this.zoomData.stopLive = true;
            }
        }
    }
    destroy() {
        if (this.subscribed) {
            if (!this.serverSide) {
                this.subscribes.forEach(id => this.socket.unsubscribeState(id, this.onStateChange));
            }
            this.subscribes = [];
            this.subscribed = false;
        }
        if (this.readOnZoomTimeout) {
            clearTimeout(this.readOnZoomTimeout);
            this.readOnZoomTimeout = null;
        }
        if (this.presetUpdateTimeout) {
            clearTimeout(this.presetUpdateTimeout);
            this.presetUpdateTimeout = null;
        }
        if (this.presetSubscribed) {
            if (!this.serverSide) {
                void this.socket.unsubscribeObject(this.presetSubscribed, this.onPresetUpdate);
            }
            this.presetSubscribed = null;
        }
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (!this.serverSide) {
            if (this.onHashInstalled) {
                window.removeEventListener('hashchange', this.onHashChange, false);
                this.onHashInstalled = false;
            }
        }
    }
    onUpdate(cb) {
        this.onUpdateFunc = cb;
    }
    onReading(cb) {
        this.onReadingFunc = cb;
    }
    onError(cb) {
        this.onErrorFunc = cb;
    }
    getConfig() {
        return this.config;
    }
    getSystemConfig() {
        return this.systemConfig;
    }
    setConfig(config) {
        void this.analyseAndLoadConfig(config);
    }
    increaseRegionForBar(start, end, option) {
        this.config.aggregateBar = parseInt(this.config.aggregateBar, 10) || 0;
        let endTs = typeof end === 'number' ? end : end.getTime();
        let startTs = typeof start === 'number' ? start : start.getTime();
        // calculate count of intervals
        if (!this.config.aggregateBar) {
            if (endTs - startTs <= 3600000 * 12) {
                // less than 12 hours => 15 minutes
                this.config.aggregateBar = 15;
            }
            else if (endTs - startTs >= 3600000 * 24 * 60) {
                // more than 60 days => 1 month
                this.config.aggregateBar = 43200;
            }
            else if (endTs - startTs > 3600000 * 24 * 3) {
                // more than 3 days => 1 day
                this.config.aggregateBar = 1440;
            }
            else {
                // if (endTs - startTs > 3600000 * 12) { // more than 12 hours => 60 minutes
                this.config.aggregateBar = 60;
            }
        }
        option = option || {};
        if (this.config.aggregateBar === 15) {
            // align start and stop to 15 minutes
            const startDate = new Date(startTs);
            startDate.setMinutes(Math.floor(startDate.getMinutes() / 15) * 15);
            if (this.config.postProcessing === 'diff') {
                startDate.setMinutes(startDate.getMinutes() - 15);
            }
            startDate.setSeconds(0);
            startDate.setMilliseconds(0);
            startTs = startDate.getTime();
            const endDate = new Date(endTs);
            endDate.setMinutes(Math.ceil(endDate.getMinutes() / 15) * 15);
            endDate.setSeconds(0);
            endDate.setMilliseconds(0);
            endTs = endDate.getTime();
            option.count = Math.round((endTs - startTs) / 900000);
        }
        else if (this.config.aggregateBar === 60) {
            // align start and stop to 1 hour
            const startDate = new Date(startTs);
            startDate.setMinutes(0);
            startDate.setSeconds(0);
            startDate.setMilliseconds(0);
            if (this.config.postProcessing === 'diff') {
                startDate.setMinutes(startDate.getMinutes() - 60);
            }
            startTs = startDate.getTime();
            const endDate = new Date(endTs);
            endDate.setMinutes(60);
            endDate.setSeconds(0);
            endDate.setMilliseconds(0);
            endTs = endDate.getTime();
            option.count = Math.round((endTs - startTs) / 3600000);
        }
        else if (this.config.aggregateBar === 1440) {
            // align start and stop to 1 day
            const startDate = new Date(startTs);
            startDate.setHours(0);
            startDate.setMinutes(0);
            startDate.setSeconds(0);
            startDate.setMilliseconds(0);
            if (this.config.postProcessing === 'diff') {
                startDate.setDate(startDate.getDate() - 1);
            }
            startTs = startDate.getTime();
            const endDate = new Date(endTs);
            endDate.setDate(endDate.getDate() + 1);
            endDate.setHours(0);
            endDate.setMinutes(0);
            endDate.setSeconds(0);
            endDate.setMilliseconds(0);
            endTs = endDate.getTime();
            option.count = Math.round((endTs - startTs) / 86400000);
        }
        else if (this.config.aggregateBar === 43200) {
            // align start and stop to 1 month
            const startDate = new Date(startTs);
            startDate.setDate(1);
            startDate.setHours(0);
            startDate.setMinutes(0);
            startDate.setSeconds(0);
            startDate.setMilliseconds(0);
            if (this.config.postProcessing === 'diff') {
                startDate.setDate(startDate.getDate() - 30);
            }
            startTs = startDate.getTime();
            const endDate = new Date(endTs);
            endDate.setDate(1);
            endDate.setHours(0);
            endDate.setMinutes(0);
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setSeconds(0);
            endDate.setMilliseconds(0);
            endTs = endDate.getTime();
            option.count = Math.round((endTs - startTs) / (86400000 * 30)); // todo it must be variable as every month has different count of days
        }
        option.start = startTs;
        option.end = endTs;
    }
    getStartStop(index, step) {
        let option;
        let endTs;
        let startTs;
        let _nowTs;
        this.config.l[index].offset = this.config.l[index].offset || 0;
        // check config range
        if (typeof this.config.range === 'string' && this.config.range.includes('m') && this.config.l.length > 1) {
            const monthRange = parseInt(this.config.range, 10) || 1;
            for (let a = 0; a < this.config.l.length; a++) {
                if (this.config.l[a].offset) {
                    // Check what the month has first index
                    _nowTs = ChartModel.addTime(this.now, this.config.l[a].offset);
                    const minusMonth = new Date(_nowTs);
                    minusMonth.setMonth(minusMonth.getMonth() - monthRange);
                    this.config.range = Math.floor((_nowTs - minusMonth.getTime()) / 60000);
                    break;
                }
            }
        }
        else if (typeof this.config.range === 'string' &&
            this.config.range.includes('y') &&
            this.config.l.length > 1) {
            const yearRange = parseInt(this.config.range, 10) || 1;
            for (let a = 0; a < this.config.l.length; a++) {
                if (this.config.l[a].offset) {
                    // Check what the month has first index
                    _nowTs = ChartModel.addTime(this.now, this.config.l[a].offset);
                    const minusYear = new Date(_nowTs);
                    minusYear.setFullYear(minusYear.getFullYear() - yearRange);
                    this.config.range = Math.floor((_nowTs - minusYear.getTime()) / 60000);
                    break;
                }
            }
        }
        // todo: What about year?
        if (!step) {
            if (this.zoomData) {
                startTs = this.zoomData.start;
                endTs = this.zoomData.end;
            }
            else if (this.config.timeType === 'static') {
                let startTime;
                let endTime;
                if (this.config.start_time !== undefined) {
                    startTime = this.config.start_time.split(':').map(Number);
                }
                else {
                    startTime = [0, 0];
                }
                if (this.config.end_time !== undefined) {
                    endTime = this.config.end_time.split(':').map(Number);
                }
                else {
                    endTime = [24, 0];
                }
                // offset is in seconds
                const startDate = new Date(this.config.start).setHours(startTime[0], startTime[1]);
                const endDate = new Date(this.config.end).setHours(endTime[0], endTime[1]);
                startTs = ChartModel.addTime(startDate, this.config.l[index].offset);
                endTs = ChartModel.addTime(endDate, this.config.l[index].offset);
            }
            else {
                this.config.relativeEnd = this.config.relativeEnd || 'now';
                let _nowDate;
                if (this.config.relativeEnd === 'now') {
                    _nowDate = new Date(this.now);
                }
                else if (this.config.relativeEnd.includes('minute')) {
                    const minutes = parseInt(this.config.relativeEnd, 10) || 1;
                    _nowDate = new Date(this.now);
                    _nowDate.setMinutes(Math.floor(_nowDate.getMinutes() / minutes) * minutes + minutes);
                    _nowDate.setSeconds(0);
                    _nowDate.setMilliseconds(0);
                }
                else if (this.config.relativeEnd.includes('hour')) {
                    const hours = parseInt(this.config.relativeEnd, 10) || 1;
                    _nowDate = new Date(this.now);
                    _nowDate.setHours(Math.floor(_nowDate.getHours() / hours) * hours + hours);
                    _nowDate.setMinutes(0);
                    _nowDate.setSeconds(0);
                    _nowDate.setMilliseconds(0);
                }
                else if (this.config.relativeEnd === 'today') {
                    _nowDate = new Date(this.now);
                    _nowDate.setDate(_nowDate.getDate() + 1);
                    _nowDate.setHours(0);
                    _nowDate.setMinutes(0);
                    _nowDate.setSeconds(0);
                    _nowDate.setMilliseconds(0);
                }
                else if (this.config.relativeEnd === 'weekUsa') {
                    // const week = parseInt(config.relativeEnd, 10) || 1;
                    _nowDate = new Date(this.now);
                    _nowDate.setDate(_nowDate.getDate() - _nowDate.getDay() + 7);
                    _nowDate.setHours(0);
                    _nowDate.setMinutes(0);
                    _nowDate.setSeconds(0);
                    _nowDate.setMilliseconds(0);
                }
                else if (this.config.relativeEnd === 'weekEurope') {
                    // const _week = parseInt(config.relativeEnd, 10) || 1;
                    _nowDate = new Date(this.now);
                    // If
                    if (_nowDate.getDay() === 0) {
                        _nowDate.setDate(_nowDate.getDate() + 1);
                    }
                    else {
                        _nowDate.setDate(_nowDate.getDate() - _nowDate.getDay() + 8);
                    }
                    _nowDate.setHours(0);
                    _nowDate.setMinutes(0);
                    _nowDate.setSeconds(0);
                    _nowDate.setMilliseconds(0);
                }
                else if (this.config.relativeEnd === 'week2Usa') {
                    // const week = parseInt(config.relativeEnd, 10) || 1;
                    _nowDate = new Date(this.now);
                    _nowDate.setDate(_nowDate.getDate() - _nowDate.getDay() + 7);
                    _nowDate.setDate(_nowDate.getDate() - 7);
                    _nowDate.setHours(0);
                    _nowDate.setMinutes(0);
                    _nowDate.setSeconds(0);
                    _nowDate.setMilliseconds(0);
                }
                else if (this.config.relativeEnd === 'week2Europe') {
                    // const _week = parseInt(config.relativeEnd, 10) || 1;
                    _nowDate = new Date(this.now);
                    // If
                    if (_nowDate.getDay() === 0) {
                        _nowDate.setDate(_nowDate.getDate() + 1);
                    }
                    else {
                        _nowDate.setDate(_nowDate.getDate() - _nowDate.getDay() + 8);
                    }
                    _nowDate.setDate(_nowDate.getDate() - 7);
                    _nowDate.setHours(0);
                    _nowDate.setMinutes(0);
                    _nowDate.setSeconds(0);
                    _nowDate.setMilliseconds(0);
                }
                else if (this.config.relativeEnd === 'month') {
                    _nowDate = new Date(this.now);
                    _nowDate.setMonth(_nowDate.getMonth() + 1);
                    _nowDate.setDate(1);
                    _nowDate.setHours(0);
                    _nowDate.setMinutes(0);
                    _nowDate.setSeconds(0);
                    _nowDate.setMilliseconds(0);
                }
                else if (this.config.relativeEnd === 'year') {
                    _nowDate = new Date(this.now);
                    _nowDate.setFullYear(_nowDate.getFullYear() + 1);
                    _nowDate.setMonth(0);
                    _nowDate.setDate(1);
                    _nowDate.setHours(0);
                    _nowDate.setMinutes(0);
                    _nowDate.setSeconds(0);
                    _nowDate.setMilliseconds(0);
                }
                this.config.range = this.config.range || 30;
                endTs = ChartModel.addTime(_nowDate, this.config.l[index].offset);
                startTs = ChartModel.addTime(endTs, this.config.range, true);
            }
            const aggregate = this.config.l[index].aggregate || this.config.aggregate;
            if (aggregate === 'current') {
                throw new Error('Cannot use "current" aggregate for start/stop');
            }
            option = {
                start: startTs,
                end: endTs,
                ignoreNull: this.config.l[index].ignoreNull === undefined
                    ? this.config.ignoreNull
                    : this.config.l[index].ignoreNull,
                aggregate: aggregate || 'minmax',
                from: false,
                ack: false,
                q: false,
                addID: false,
            };
            if (this.config.l[index].chartType === 'bar' || this.config.l[index].chartType === 'polar') {
                this.increaseRegionForBar(startTs, endTs, option);
            }
            else if (this.config.aggregateType === 'step') {
                option.step = this.config.aggregateSpan * 1000;
            }
            else if (this.config.aggregateType === 'count') {
                option.count = this.config.aggregateSpan || 300;
            }
            this.config.start = startTs;
            this.config.end = endTs;
            return option;
        }
        if (this.zoomData) {
            startTs = this.zoomData.start;
            endTs = this.zoomData.end;
        }
        else {
            endTs = ChartModel.addTime(this.now, this.config.l[index].offset);
            startTs = endTs - step;
        }
        option = {
            start: startTs,
            end: endTs,
            ignoreNull: this.config.l[index].ignoreNull === undefined
                ? this.config.ignoreNull
                : this.config.l[index].ignoreNull,
            aggregate: this.config.l[index].aggregate ||
                this.config.aggregate ||
                'minmax',
            count: 1,
            from: false,
            ack: false,
            q: false,
            addId: false,
        };
        this.config.start = ChartModel.addTime(endTs, this.config.range, true);
        this.config.end = endTs;
        return option;
    }
    static postProcessing(series, categories, aggregate, postProcessingMethod) {
        const barSeries = [];
        for (let i = 0; i < series.length; i++) {
            const interval = series[i];
            if (!interval.length) {
                barSeries[i] = null;
            }
            else if (interval.length === 1) {
                // sum all values
                barSeries[i] = interval[0];
            }
            else if (aggregate === 'average') {
                const sum = interval.reduce((a, b) => a + b, 0);
                barSeries[i] = sum / interval.length;
            }
            else if (aggregate === 'min') {
                let min = interval[0];
                for (let j = 1; j < interval.length; j++) {
                    if (interval[j] < min) {
                        min = interval[j];
                    }
                }
                barSeries[i] = min;
            }
            else if (aggregate === 'max') {
                let max = interval[0];
                for (let j = 1; j < interval.length; j++) {
                    if (interval[j] > max) {
                        max = interval[j];
                    }
                }
                barSeries[i] = max;
            }
            else if (aggregate === 'total') {
                barSeries[i] = interval.reduce((a, b) => a + b, 0);
            }
            else {
                barSeries[i] = interval[interval.length - 1];
            }
        }
        if (postProcessingMethod === 'diff') {
            for (let i = series.length - 1; i > 0; i--) {
                if (barSeries[i - 1] !== null && barSeries[i] !== null) {
                    barSeries[i] -= barSeries[i - 1];
                }
                else {
                    barSeries[i] = 0;
                }
            }
            barSeries.splice(0, 1);
            categories.splice(0, 1);
        }
        for (let i = 0; i < series.length; i++) {
            console.log(`${categories[i]}: ${barSeries[i]}`);
        }
        return barSeries;
    }
    static processOneValue(value, convertFunc, yOffset) {
        // Convert boolean values to numbers
        if (value === 'true' || value === true) {
            value = 1;
        }
        else if (value === 'false' || value === false) {
            value = 0;
        }
        else if (typeof value === 'string') {
            value = parseFloat(value);
        }
        if (convertFunc) {
            return value !== null ? convertFunc(value + yOffset) : null;
        }
        return value !== null ? value + yOffset : null;
    }
    processRawData(_id, line, values, option) {
        if (!option) {
            option = {
                start: values[0].ts,
                end: values[values.length - 1].ts,
            };
            if (line.chartType === 'bar' || line.chartType === 'polar') {
                this.increaseRegionForBar(option.start, option.end, option);
            }
        }
        const yOffset = line.yOffset || 0;
        const seriesData = [];
        // Collects for every time interval the values. Later it will be combined to number[]
        const _barSeries = [];
        let barCategories = this.barCategories;
        // fill categories for bars
        if (line.chartType === 'bar') {
            if (!barCategories) {
                barCategories = [];
                this.barCategories = barCategories;
                const start = new Date(option.start);
                const end = typeof option.end === 'number' ? option.end : option.end.getTime();
                while (start.getTime() <= end) {
                    barCategories.push(start.getTime());
                    start.setMinutes(start.getMinutes() + this.config.aggregateBar);
                }
            }
            barCategories.forEach(() => _barSeries.push([]));
        }
        let convertFunc;
        if (line.convert?.trim()) {
            if (!this.convertFunctions[line.convert.trim()]) {
                let convert = line.convert.trim();
                if (!convert.includes('return')) {
                    convert = `return ${convert}`;
                }
                try {
                    this.convertFunctions[line.convert.trim()] = new Function('val', convert);
                }
                catch (e) {
                    console.error(`[ChartModel] Cannot parse convert function: ${e}`);
                }
            }
            convertFunc = this.convertFunctions[line.convert.trim()];
        }
        for (let i = 0; i < values.length; i++) {
            const value = ChartModel.processOneValue(values[i].val, convertFunc, yOffset);
            if (line.chartType === 'bar') {
                // find category
                for (let c = 0; c < barCategories.length; c++) {
                    if (barCategories[c] >= values[i].ts &&
                        values[i].ts < barCategories[c] + this.config.aggregateBar * 60000) {
                        _barSeries[c].push(value);
                        break;
                    }
                }
            }
            else if (line.chartType !== 'polar') {
                if (line.noFuture && values[i].ts > this.now) {
                    // todo: interpolate value
                    break;
                }
                const dp = { value: [values[i].ts, value] };
                // If value was interpolated by backend
                if (values[i].i) {
                    dp.exact = false;
                }
                seriesData.push(dp);
            }
        }
        // add start and end
        if (line.chartType !== 'bar' && line.chartType !== 'polar') {
            let end = typeof option.end === 'number' ? option.end : option.end.getTime();
            const start = typeof option.start === 'number' ? option.start : option.start.getTime();
            // End cannot be in the future
            if (end > this.now) {
                end = this.now;
            }
            if (seriesData.length) {
                if (seriesData[0].value[0] > start) {
                    seriesData.unshift({ value: [start, null], exact: false });
                }
                const last = seriesData[seriesData.length - 1];
                if (last.value[0] < end) {
                    if (line.validTime) {
                        // If the last value is not older than X seconds, assume it is still the same
                        if (end - line.validTime * 1000 <= last.value[0]) {
                            seriesData.push({ value: [end, last.value[1]], exact: false });
                        }
                        else {
                            seriesData.push({ value: [end, null], exact: false });
                        }
                    }
                    else {
                        seriesData.push({ value: [end, null], exact: false });
                    }
                }
            }
            else {
                seriesData.push({ value: [start, null], exact: false });
                seriesData.push({ value: [end, null], exact: false });
            }
            // TODO: May be not required?
            seriesData.sort((a, b) => (a.value[0] > b.value[0] ? 1 : a.value[0] < b.value[0] ? -1 : 0));
            // The next line is not required, as it is already done at the start
            return { seriesData };
        }
        // it is not the series, it is bar data
        const barData = ChartModel.postProcessing(_barSeries, barCategories, line.aggregate, line.postProcessing);
        return { barData };
    }
    async readOneChart(id, instance, index) {
        const lineConfig = this.config.l[index];
        if (instance === 'json') {
            const state = await this.socket.getState(id);
            try {
                const valuesAny = JSON.parse(state?.val);
                let values;
                if (valuesAny.history) {
                    values = valuesAny.history;
                }
                else {
                    values = valuesAny;
                }
                if (!Array.isArray(values)) {
                    values = [];
                    console.warn('JSON is not an array');
                }
                values = values.filter(v => v);
                // convert alternative names to {ts, val}. Possible names for ts: t, time. Possible names for val: y, value
                if (values[0]) {
                    const keys = Object.keys(values[0]);
                    if (!keys.includes('val') || !keys.includes('ts')) {
                        // If a format is [{t: 123, y: 1}, {t: 124, y: 2}] (e.g. from pvsolar
                        if (keys.includes('y') && keys.includes('t')) {
                            values = values.map(v => ({ ts: v.t, val: v.y }));
                        }
                        else {
                            if (keys.includes('y')) {
                                values.forEach(v => (v.val = v.y));
                            }
                            else if (keys.includes('value')) {
                                values.forEach(v => (v.val = v.value));
                            }
                            else if (keys.includes('data')) {
                                values.forEach(v => (v.val = v.data));
                            }
                            else if (keys.includes('v')) {
                                values.forEach(v => (v.val = v.v));
                            }
                            if (keys.includes('t')) {
                                values.forEach(v => (v.ts = v.t));
                            }
                            else if (keys.includes('time')) {
                                values.forEach(v => (v.ts = v.time));
                            }
                            else if (keys.includes('date')) {
                                values.forEach(v => (v.ts = v.date));
                            }
                        }
                    }
                    // convert ts to number
                    if (values[0].ts) {
                        if (typeof values[0].ts === 'string' && window.isFinite(values[0].ts)) {
                            values.forEach(v => (v.ts = parseInt(v.ts, 10)));
                        }
                        else if (typeof values[0].ts === 'string' &&
                            new Date(values[0].ts).toString() !== 'Invalid Date') {
                            values.forEach(v => (v.ts = new Date(v.ts).getTime()));
                        }
                        // no else
                        if (typeof values[0].ts === 'number' && values[0].ts < 946681200000) {
                            // new Date(2000,0,1).getTime() === 946681200000
                            values.forEach(v => (v.ts *= 1000));
                        }
                    }
                }
                values.sort((a, b) => (a.ts - b.ts ? -1 : a.ts < b.ts ? 1 : 0));
                const result = this.processRawData(id, lineConfig, values);
                if (result.barData) {
                    this.barData[index] = result.barData;
                }
                else {
                    this.seriesData[index] = result.seriesData;
                }
            }
            catch (e) {
                console.error(`[ChartModel] Cannot parse values in JSON: ${e}`);
            }
            if (!this.serverSide && !this.subscribes.includes(id)) {
                this.subscribes.push(id);
                this.subscribed = true;
                void this.socket.subscribeState(id, this.onStateChange);
            }
        }
        else {
            const option = this.getStartStop(index);
            option.instance = instance;
            option.sessionId = this.sessionId;
            // console.log(JSON.stringify(option));
            if (this.debug) {
                console.log(`[ChartModel] ${new Date(option.start).toString()} - ${new Date(option.end).toString()}`);
            }
            if (lineConfig.aggregate !== 'current') {
                try {
                    const res = await this.socket.getHistoryEx(id, option);
                    if (this.sessionId && res.sessionId && res.sessionId !== this.sessionId) {
                        console.warn(`[ChartModel] Ignore request with sessionId=${res.sessionId}, actual is ${this.sessionId}`);
                        return;
                    }
                    if (res?.values) {
                        // option.ignoreNull = (config.l[index].ignoreNull === undefined) ? (config.ignoreNull === 'true' || config.ignoreNull === true) : (config.l[index].ignoreNull === 'true' || config.l[index].ignoreNull === true);
                        const result = this.processRawData(id, lineConfig, res.values, option);
                        if (result.barData) {
                            this.barData[index] = result.barData;
                        }
                        else {
                            this.seriesData[index] = result.seriesData;
                        }
                        // free memory
                        res.values = null;
                    }
                }
                catch (err) {
                    if (err === NOT_CONNECTED && this.onErrorFunc) {
                        this.onErrorFunc(err);
                    }
                    console.error(`[ChartModel] ${err}`);
                }
            }
            if ((this.config.legActual && lineConfig.chartType !== 'bar' && lineConfig.chartType !== 'polar') ||
                lineConfig.aggregate === 'current') {
                // read current value
                try {
                    const state = await this.socket.getState(id);
                    this.actualValues[index] = ChartModel.processOneValue(state.val, this.convertFunctions[lineConfig.convert], lineConfig.yOffset || 0);
                }
                catch (e) {
                    console.warn(`Cannot read last value of "${id}": ${e}`);
                    this.actualValues[index] = null;
                }
                if (!this.serverSide && !this.subscribes.includes(id)) {
                    this.subscribes.push(id);
                    this.subscribed = true;
                    void this.socket.subscribeState(id, this.onStateChange);
                }
            }
        }
    }
    async readOneRawChart(id, instance, start, end) {
        if (instance === 'json') {
            const state = await this.socket.getState(id);
            try {
                const valuesJson = JSON.parse(state?.val);
                let values;
                if (valuesJson.history) {
                    values = valuesJson.history;
                }
                else {
                    values = valuesJson;
                }
                // convert alternative names to {ts, val}. Possible names for ts: t, time. Possible names for val: y, value
                if (values[0]) {
                    const keys = Object.keys(values[0]);
                    if (!keys.includes('val') || !keys.includes('ts')) {
                        // If format is [{t: 123, y: 1}, {t: 124, y: 2}] (e.g. from pvsolar
                        if (keys.includes('y') && keys.includes('t')) {
                            values = values.map(v => ({ ts: v.t, val: v.y }));
                        }
                        else {
                            if (keys.includes('y')) {
                                values.forEach(v => (v.val = v.y));
                            }
                            else if (keys.includes('value')) {
                                values.forEach(v => (v.val = v.value));
                            }
                            else if (keys.includes('data')) {
                                values.forEach(v => (v.val = v.data));
                            }
                            else if (keys.includes('v')) {
                                values.forEach(v => (v.val = v.v));
                            }
                            if (keys.includes('t')) {
                                values.forEach(v => (v.ts = v.t));
                            }
                            else if (keys.includes('time')) {
                                values.forEach(v => (v.ts = v.time));
                            }
                            else if (keys.includes('date')) {
                                values.forEach(v => (v.ts = v.date));
                            }
                        }
                    }
                    // convert ts to number
                    if (values[0].ts) {
                        if (typeof values[0].ts === 'string' && window.isFinite(values[0].ts)) {
                            values.forEach(v => (v.ts = parseInt(v.ts, 10)));
                        }
                        else if (typeof values[0].ts === 'string' &&
                            new Date(values[0].ts).toString() !== 'Invalid Date') {
                            values.forEach(v => (v.ts = new Date(v.ts).getTime()));
                        }
                        // no else
                        if (typeof values[0].ts === 'number' && values[0].ts < 946681200000) {
                            // new Date(2000,0,1).getTime() === 946681200000
                            values.forEach(v => (v.ts *= 1000));
                        }
                    }
                }
                if (!Array.isArray(values)) {
                    values = [];
                    console.warn('JSON is not an array');
                }
                values.sort((a, b) => (a.ts - b.ts ? -1 : a.ts < b.ts ? 1 : 0));
                return values;
            }
            catch (e) {
                console.error(`[ChartModel] Cannot parse values in JSON: ${e}`);
            }
        }
        else {
            const option = {
                start,
                end,
                ignoreNull: false,
                aggregate: 'none',
                count: 2000,
                from: false,
                ack: false,
                q: false,
                addId: false,
            };
            option.instance = instance;
            option.sessionId = this.sessionId;
            if (this.debug) {
                console.log(`[ChartModel] ${new Date(option.start).toString()} - ${new Date(option.end).toString()}`);
            }
            try {
                const res = await this.socket.getHistoryEx(id, option);
                if (this.sessionId && res.sessionId && res.sessionId !== this.sessionId) {
                    console.warn(`[ChartModel] Ignore request with sessionId=${res.sessionId}, actual is ${this.sessionId}`);
                    return null;
                }
                return res?.values;
            }
            catch (err) {
                err === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(err);
                err && console.error(`[ChartModel] ${err}`);
            }
        }
        return null;
    }
    _readObject(id) {
        if (!(this.objectPromises[id] instanceof Promise)) {
            this.objectPromises[id] = this.socket.getObject(id).catch((e) => {
                if (e.toString().includes(NOT_CONNECTED) && this.onErrorFunc) {
                    this.onErrorFunc(e);
                }
                console.error(`Cannot read "${id}": ${e.toString()}`);
                return null;
            });
        }
        return this.objectPromises[id];
    }
    async _readOneLine(index) {
        const lineConfig = this.config.l[index];
        try {
            const obj = await this._readObject(lineConfig.id);
            if (obj?.common) {
                const name = lineConfig.name || obj.common.name;
                lineConfig.name =
                    name && typeof name === 'object'
                        ? name[this.systemConfig.language] || name.en || lineConfig.id
                        : name || '';
                lineConfig.unit = lineConfig.unit || (obj.common.unit ? obj.common.unit.replace('�', '°') : '');
                lineConfig.type = obj.common.type;
                if (lineConfig.chartType === 'auto') {
                    lineConfig.chartType = obj.common.type === 'boolean' ? 'steps' : 'line';
                    lineConfig.aggregate = obj.common.type === 'boolean' ? 'none' : 'minmax';
                }
                // ignore unit if true/false text set
                if (lineConfig.unit && (lineConfig.falseText || lineConfig.trueText)) {
                    delete lineConfig.unit;
                }
                // remember enum states
                if (obj.common.states &&
                    !Array.isArray(obj.common.states) &&
                    lineConfig.states !== false &&
                    !obj.common.unit) {
                    if (lineConfig.states) {
                        lineConfig.states = Object.assign(obj.common.states, lineConfig.states);
                    }
                    else {
                        lineConfig.states = obj.common.states;
                    }
                    // if the states have true, false as text => convert it to 1, 0
                    if (Object.keys(lineConfig.states).find(key => key === 'true' || key === 'false')) {
                        const states = {};
                        Object.keys(lineConfig.states).forEach(key => {
                            states[key === 'true' ? 1 : key === 'false' ? 0 : key] = lineConfig.states[key];
                        });
                        lineConfig.states = states;
                    }
                    // ignore unit for enums text set
                    if (lineConfig.unit && lineConfig.states) {
                        delete lineConfig.unit;
                    }
                }
                // set YAxis to 'off' if commonYAxis is set
                if (lineConfig.commonYAxis || lineConfig.commonYAxis === 0) {
                    lineConfig.yaxe = 'off';
                }
            }
        }
        catch (e) {
            e === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(e);
            console.error(`[ChartModel] Cannot read object ${lineConfig.id}: ${e}`);
        }
        lineConfig.name = lineConfig.name || lineConfig.id || '';
        lineConfig.unit = lineConfig.unit || '';
        if (lineConfig.chartType === 'auto') {
            lineConfig.chartType = 'line';
            lineConfig.aggregate = 'minmax';
        }
        await this.readOneChart(lineConfig.id, lineConfig.instance || this.defaultHistory, index);
    }
    async _readData() {
        for (let j = 0; j < this.config.l.length; j++) {
            if (this.config.l[j]) {
                this.seriesData.push([]);
            }
            if (this.config.l[j]?.id) {
                await this._readOneLine(j);
            }
        }
    }
    async readTicks() {
        if (this.config.ticks) {
            const index = 0;
            const option = JSON.parse(JSON.stringify(this.getStartStop(index)));
            option.instance = this.config.l[index].instance || this.defaultHistory;
            option.sessionId = this.sessionId;
            option.aggregate = 'none';
            if (this.debug) {
                console.log(`[ChartModel] Ticks: ${new Date(option.start).toString()} - ${new Date(option.end).toString()}`);
            }
            try {
                const res = await this.socket.getHistoryEx(this.config.ticks, option);
                if (this.sessionId && res.sessionId && res.sessionId !== this.sessionId) {
                    console.warn(`[ChartModel] Ignore request with sessionId=${res.sessionId}, actual is ${this.sessionId}`);
                    return;
                }
                const _series = this.ticks || [];
                if (res?.values) {
                    if (this.ticks?.length) {
                        this.ticks.splice(0, this.ticks.length);
                    }
                    const values = res.values;
                    for (let i = 0; i < values.length; i++) {
                        if (values[i].val !== null) {
                            _series.push({ value: [values[i].ts, values[i].val] });
                        }
                    }
                    // add start and end
                    if (_series.length) {
                        if (_series[0].value[0] > option.start) {
                            _series.unshift({ value: [option.start, ''] });
                        }
                        if (_series[_series.length - 1].value[0] < option.end) {
                            _series.push({ value: [option.end, ''] });
                        }
                    }
                    else {
                        _series.push({ value: [option.start, ''] });
                        _series.push({ value: [option.end, ''] });
                    }
                    // free memory
                    res.values = null;
                }
                this.ticks = _series;
            }
            catch (e) {
                e === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(e);
                console.error(`[ChartModel] ${e}`);
            }
        }
    }
    /*
    readValue(id, index, cb) {
        this.socket.getState(id)
            .then(state => {
                if (state) {
                    cb(index, parseFloat(state.val) || 0);
                } else {
                    cb(index, 0);
                }
            })
            .catch(e => {
                e === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(e);
                console.error(`[ChartModel] ${e}`);
                cb(index, 0);
            });
    }
    */
    async readMarkings() {
        if (!this.config.marks) {
            return;
        }
        // read markings
        for (let m = 0; m < this.config.marks.length; m++) {
            const mark = this.config.marks[m];
            // process upper ID
            if (mark.upperValueOrId &&
                typeof mark.upperValueOrId === 'string' &&
                mark.upperValueOrId.toString().includes('.') &&
                parseFloat(mark.upperValueOrId).toString() !== mark.upperValueOrId.toString().replace(/\.0*$/, '')) {
                /* if (!this.subscribes.includes(mark.upperValueOrId)) {
                        this.subscribes.push(mark.upperValueOrId);
                    } */
                try {
                    const state = await this.socket.getState(mark.upperValueOrId);
                    if (state && state.val !== undefined && state.val !== null) {
                        mark.upperValue = parseFloat(state.val) || 0;
                    }
                    else {
                        mark.upperValue = null;
                    }
                }
                catch (e) {
                    e === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(e);
                    console.error(`Cannot read marking ${mark.upperValueOrId}: ${e}`);
                }
            }
            // process lower ID
            if (mark.lowerValueOrId &&
                typeof mark.lowerValueOrId === 'string' &&
                mark.lowerValueOrId.includes('.') &&
                parseFloat(mark.lowerValueOrId).toString() !== mark.lowerValueOrId.replace(/\.0*$/, '')) {
                /* if (!this.subscribes.includes(mark.upperValueOrId)) {
                        this.subscribes.push(mark.upperValueOrId);
                    } */
                try {
                    const state = await this.socket.getState(mark.lowerValueOrId);
                    if (state && state.val !== undefined && state.val !== null) {
                        mark.lowerValue = parseFloat(state.val) || 0;
                    }
                    else {
                        mark.lowerValue = null;
                    }
                }
                catch (e) {
                    e === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(e);
                    console.error(`Cannot read marking ${mark.lowerValueOrId}: ${e}`);
                }
            }
        }
    }
    async subscribeAll(subscribes) {
        if (!this.serverSide && subscribes?.length) {
            for (let s = 0; s < subscribes.length; s++) {
                try {
                    await this.socket.subscribeState(subscribes[s], this.onStateChange);
                }
                catch (e) {
                    e === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(e);
                    console.error(`Cannot subscribe ${subscribes[s]}: ${e}`);
                }
            }
        }
    }
    updateData() {
        // combine seriesData and barData
        const updateData = [];
        this.config.l.forEach((line, index) => {
            if (line.chartType === 'bar') {
                updateData[index] = this.barData[index];
            }
            else {
                updateData[index] = this.seriesData[index];
            }
        });
        this.onUpdateFunc(updateData, this.actualValues, this.barCategories);
    }
    onStateChange = (id, state) => {
        if (!id || !state || this.reading) {
            return;
        }
        if (this.debug) {
            console.log(`State update ${id} - ${state.val}`);
        }
        let changed = false;
        for (let index = 0; index < this.config.l.length; index++) {
            if (this.config.l[index].id === id) {
                // by update from json => update always all values
                if (this.config.l[index].instance === 'json') {
                    try {
                        const dataJson = JSON.parse(state?.val);
                        let data;
                        if (dataJson.history) {
                            data = dataJson.history;
                        }
                        else {
                            data = dataJson;
                        }
                        if (!Array.isArray(data)) {
                            data = [];
                            console.warn('JSON is not an array');
                        }
                        data.sort((a, b) => (a.ts - b.ts ? -1 : a.ts < b.ts ? 1 : 0));
                        const result = this.processRawData(id, this.config.l[index], data);
                        if (result.barData) {
                            this.barData[index] = result.barData;
                        }
                        else {
                            this.seriesData[index] = result.seriesData;
                        }
                        // take last value as actual value
                        if (this.actualValues) {
                            this.actualValues[index] = data[data.length - 1].val;
                        }
                        this.updateData();
                    }
                    catch (e) {
                        console.error(`Cannot parse JSON: ${e}`);
                    }
                    return;
                }
                const value = ChartModel.processOneValue(state.val, this.convertFunctions[this.config.l[index].convert], this.config.l[index].yOffset || 0);
                if (this.actualValues && this.actualValues[index] !== value) {
                    this.actualValues[index] = value;
                    changed = true;
                }
                break;
            }
        }
        changed && this.onUpdateFunc(null, this.actualValues);
    };
    static addTime(time, offset, isOffsetInMinutes) {
        const date = new Date(time);
        if (typeof offset === 'string') {
            if (offset[1] === 'm' || offset[2] === 'm') {
                offset = parseInt(offset, 10);
                date.setMonth(date.getMonth() - offset);
                time = date.getTime();
            }
            else if (offset[1] === 'y' || offset[2] === 'y') {
                offset = parseInt(offset, 10);
                date.setFullYear(date.getFullYear() - offset);
                time = date.getTime();
            }
            else {
                time = date.getTime();
                if (isOffsetInMinutes) {
                    time -= (parseInt(offset, 10) || 0) * 60000;
                }
                else {
                    time -= (parseInt(offset, 10) || 0) * 1000;
                }
            }
        }
        else {
            offset = offset || 0;
            time = date.getTime();
            if (isOffsetInMinutes) {
                time -= offset * 60000;
            }
            else {
                time -= offset * 1000;
            }
        }
        return time;
    }
    async exportData(from, to, excludes) {
        // read all raw data
        const result = {};
        for (let i = 0; i < this.config.l.length; i++) {
            if (excludes?.includes(this.config.l[i].id) || !this.config.l[i] || !this.config.l[i].id) {
                continue;
            }
            let data = await this.readOneRawChart(this.config.l[i].id, this.config.l[i].instance || this.defaultHistory, from, to);
            let _from = data?.length ? data[data.length - 1].ts + 1 : 0;
            let values = data;
            while (values?.length === 2000) {
                values = await this.readOneRawChart(this.config.l[i].id, this.config.l[i].instance || this.defaultHistory, _from, to);
                _from = values && values.length ? values[values.length - 1].ts + 1 : 0;
                data = data.concat(values);
            }
            if (values) {
                result[this.config.l[i].id] = values;
            }
        }
        return result;
    }
    async readData() {
        if (this.readOnZoomTimeout) {
            clearTimeout(this.readOnZoomTimeout);
            this.readOnZoomTimeout = null;
        }
        this.now = Date.now();
        console.log(`Read till ${new Date(this.now).toString()}`);
        this.sessionId = this.sessionId || 0;
        this.sessionId++;
        if (this.sessionId > 0xffffff) {
            this.sessionId = 1;
        }
        if (this.config.l) {
            this.reading = true;
            this.onReadingFunc && this.onReadingFunc(true);
            // todo
            //            if (config.renderer === 'pie' || (config.renderer === 'bar' && config._ids.length > 1)) {
            //
            //                seriesData = [[]];
            //                for (const j = 0; j < config._ids.length; j++) {
            //                    readOneValue(config._ids[j], j, function (_id, _index, value) {
            //                        if (config.renderer === 'pie') {
            //                            seriesData[0][_index] = {label: config.l[_index].name, data: value};
            //                        } else {
            //                            seriesData[0][_index] = [config.l[_index].name, value];
            //                        }
            //                        if (_index === config._ids.length - 1) {
            //                            graphCreate(divId, );
            //                        }
            //                    });
            //                }
            //            } else {
            this.seriesData = [];
            this.barData = [];
            this.barCategories = null;
            await this._readData();
            // use units from common axis
            for (let i = 0; i < this.config.l.length; i++) {
                if (this.config.l[i].commonYAxis || this.config.l[i].commonYAxis === 0) {
                    this.config.l[i].unit = this.config.l[this.config.l[i].commonYAxis].unit;
                }
            }
            await this.readTicks();
            await this.readMarkings();
            /* if (!this.subscribed) {
                this.subscribed = true;
                await this.subscribeAll(this.subscribes));
            } */
            this.reading = false;
            this.updateData();
        }
        else {
            this.onErrorFunc && this.onErrorFunc(new Error('No config provided'));
            this.onReadingFunc && this.onReadingFunc(false);
            this.reading = false;
        }
    }
}
exports.default = ChartModel;
//# sourceMappingURL=ChartModel.js.map