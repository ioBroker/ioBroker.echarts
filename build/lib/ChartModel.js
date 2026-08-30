"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Parse a query string into its parts.
 * Copied from adapter-react-v5/Components/Utils
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
function getFloat(value) {
    if (typeof value === 'number') {
        return value;
    }
    if (value === true) {
        return 1;
    }
    if (value === false || value === 'null' || value === '') {
        return 0;
    }
    const f = parseFloat(value || '0');
    if (isNaN(f)) {
        return 0;
    }
    return f;
}
function getInt(value) {
    if (typeof value === 'number') {
        return value;
    }
    if (value === 'null') {
        return 0;
    }
    const f = parseInt(value || '0', 10);
    if (isNaN(f)) {
        return 0;
    }
    return f;
}
function getBoolean(value) {
    return value === true || value === 'true';
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
                min: config.min === 0 || config.min ? config.min : undefined,
                max: config.max === 0 || config.max ? config.max : undefined,
                unit: units[i] || undefined,
            });
        }
        newConfig.aggregateType = 'step';
        newConfig.aggregateSpan = 300;
        newConfig.relativeEnd = 'now';
    }
    if (config.l) {
        for (let j = 0; j < config.l.length; j++) {
            // convert art to aggregate (from flot)
            if (config.l[j].art) {
                config.l[j].aggregate = config.l[j].art;
                delete config.l[j].art;
            }
            if (config.instance && !config.l[j].instance) {
                config.l[j].instance = config.instance;
            }
            config.l[j].yOffset = getFloat(config.l[j].yOffset);
            config.l[j].offset = getFloat(config.l[j].offset);
            config.l[j].validTime = getFloat(config.l[j].validTime);
            config.l[j].chartType = config.l[j].chartType || config.chartType || 'auto';
            config.l[j].thickness = config.l[j].thickness === undefined ? 1 : getFloat(config.l[j].thickness);
            config.l[j].shadowsize = getFloat(config.l[j].shadowsize);
        }
    }
    else {
        config.l = [];
    }
    // convert marks
    if (config.m) {
        newConfig.marks = [];
        for (let j = 0; j < config.m.length; j++) {
            newConfig.marks[j] = {
                lineId: config.m[j].l,
                upperValueOrId: config.m[j].v,
                lowerValueOrId: config.m[j].vl,
                color: config.m[j].c,
                fill: getFloat(config.m[j].f),
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
    if (getFloat(newConfig.width).toString() === newConfig.width.toString().trim()) {
        newConfig.width += 'px';
    }
    if (getFloat(newConfig.height).toString() === newConfig.height.toString().trim()) {
        newConfig.height += 'px';
    }
    newConfig.timeFormat = config.timeFormat || '';
    newConfig.useComma = getBoolean(config.useComma);
    newConfig.zoom = getBoolean(config.zoom);
    newConfig.export = getBoolean(config.export);
    newConfig.grid_hideX = getBoolean(config.grid_hideX);
    newConfig.grid_hideY = getBoolean(config.grid_hideY);
    newConfig.hoverDetail = getBoolean(config.hoverDetail);
    newConfig.noLoader = getBoolean(config.noLoader);
    newConfig.noedit = getBoolean(config.noedit);
    newConfig.rangeSelector = getBoolean(config.rangeSelector);
    newConfig.animation = getInt(config.animation);
    newConfig.afterComma =
        config.afterComma === undefined || config.afterComma === null ? 2 : getInt(config.afterComma);
    newConfig.timeType = config.timeType || 'relative';
    if (config.xLabelShift) {
        if (typeof config.xLabelShift === 'string' && config.xLabelShift.endsWith('m')) {
            newConfig.xLabelShift = getInt(config.xLabelShift.substring(0, config.xLabelShift.length - 1));
            newConfig.xLabelShiftMonth = true;
        }
        else if (typeof config.xLabelShift === 'string' && config.xLabelShift.endsWith('y')) {
            newConfig.xLabelShift = getInt(config.xLabelShift.substring(0, config.xLabelShift.length - 1));
            newConfig.xLabelShiftYear = true;
        }
        else {
            newConfig.xLabelShift = getInt(config.xLabelShift);
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
    /**
     * The borders of a static time range as the user configured them.
     *
     * `getStartStop` writes the range that is really drawn back into `config.start`/`config.end`, and
     * the static branch reads them again on the next run. With the default end time of 24:00 that moved
     * the chart one day further into the future with every re-read, e.g. with every tick of "live".
     * The entry is bound to the config object, so a new preset starts with fresh borders.
     */
    staticRange = null;
    barCategories;
    /** Exclusive end (ms) of the last entry of `barCategories` */
    barCategoriesEnd;
    /**
     * For every bar line of a `json` source the first and the last time stamp of the data the
     * categories were built from. A later update of the state can bring another time range, and the
     * chart must be read again then.
     */
    barJsonRange = [];
    now = Date.now();
    /**
     * A range that overrides the one of the preset for this view only: it comes from the URL hash or
     * from the range selector in the chart. It is kept apart from the config, so a reload of the preset
     * object does not throw the choice away.
     */
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
            this.systemConfig = systemConfig?.common || {};
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
        this.barCategories = undefined;
        this.barCategoriesEnd = undefined;
        this.barJsonRange = [];
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
                this.config.useComma = this.config.useComma ?? this.systemConfig?.isFloatComma ?? true;
                this.config.lang = this.systemConfig?.language || 'en';
                this.config.live = getInt(this.config.live);
                this.config.debug = this.debug;
                this.config.presetId = this.preset;
                this.applyHash(this.config);
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
            this.config ||= {};
            this.config.useComma = this.config.useComma ?? this.systemConfig?.isFloatComma === true;
            this.config.lang = this.systemConfig?.language || 'en';
            this.config.live = getInt(this.config?.live);
            this.config.debug = this.debug;
            await this.readData();
            if (!this.serverSide && this.config.live && !this.zoomData?.stopLive) {
                this.updateInterval = setInterval(() => this.readData(), this.config.live * 1000);
            }
        }
    }
    /**
     * A range or an end that was given in the URL hash or picked in the range selector wins over the one
     * of the preset, so it must be applied again every time the preset object is read.
     */
    applyHash(config) {
        if (this.hash?.range) {
            if (typeof this.hash.range === 'string' &&
                !this.hash.range.includes('y') &&
                !this.hash.range.includes('m')) {
                config.range = getInt(this.hash.range) || 1;
            }
            else {
                config.range = this.hash.range;
            }
        }
        if (this.hash?.relativeEnd) {
            config.relativeEnd = this.hash.relativeEnd;
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
            this.applyHash(newConfig);
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
                    if (this.config?.live && (!this.zoomData || !this.zoomData.stopLive)) {
                        console.log('Restore update');
                        if (this.updateInterval) {
                            clearInterval(this.updateInterval);
                        }
                        this.updateInterval = setInterval(() => this.readData(), (this.config?.live || 10) * 1000);
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
            this.presetSubscribed = '';
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
        if (!this.config) {
            throw new Error('Unexpected null config');
        }
        return this.config;
    }
    getSystemConfig() {
        return this.systemConfig;
    }
    setConfig(config) {
        void this.analyseAndLoadConfig(config);
    }
    /**
     * The range selector in the chart shows another time range without touching the preset. The choice
     * is remembered like a range from the URL hash, so an update of the preset object does not throw it
     * away, and a zoom must be dropped: a zoomed window is read from `zoomData` and would swallow the
     * new range.
     */
    setRange(range) {
        if (this.config.range === range && !this.zoomData) {
            return;
        }
        this.config.range = range;
        this.hash = { ...this.hash, range };
        this.zoomData = null;
        this.readOnZoomTimeout && clearTimeout(this.readOnZoomTimeout);
        this.readOnZoomTimeout = null;
        this.updateInterval && clearInterval(this.updateInterval);
        this.updateInterval = null;
        void this.readData().then(() => {
            if (!this.serverSide && this.config.live) {
                this.updateInterval = setInterval(() => this.readData(), this.config.live * 1000);
            }
        });
    }
    /**
     * The `diff` post-processing shows the difference to the previous bar, so one interval before the
     * visible range must be read as a reference. It is configured per line, but as all bars share the
     * same categories, the additional interval must be requested for the whole chart.
     */
    hasBarDiff() {
        return (this.config.postProcessing === 'diff' ||
            !!this.config.l?.find(line => line.chartType === 'bar' && line.postProcessing === 'diff'));
    }
    /**
     * Move the given date to the start of the next bar interval.
     *
     * `aggregateBar` is given in minutes, but 43200 minutes stand for "one month" and a month is not
     * always 30 days long, so it must be counted in the calendar and not in milliseconds.
     *
     * @param date date to modify in place
     * @param aggregateBar interval in minutes: 15, 60, 1440 (day), 10080 (week) or 43200 (month)
     */
    static addBarInterval(date, aggregateBar) {
        if (aggregateBar === 43200) {
            date.setMonth(date.getMonth() + 1);
        }
        else {
            // setMinutes works on the local time, so the DST change is taken into account
            date.setMinutes(date.getMinutes() + aggregateBar);
        }
    }
    /**
     * Move the given date to the start of the previous bar interval. The counterpart of
     * `addBarInterval`, needed to grow the categories to the front.
     *
     * @param date date to modify in place
     * @param aggregateBar interval in minutes: 15, 60, 1440 (day), 10080 (week) or 43200 (month)
     */
    static subBarInterval(date, aggregateBar) {
        if (aggregateBar === 43200) {
            date.setMonth(date.getMonth() - 1);
        }
        else {
            // setMinutes works on the local time, so the DST change is taken into account
            date.setMinutes(date.getMinutes() - aggregateBar);
        }
    }
    /**
     * How many days the date lies behind its Monday. `getDay` counts the Sunday as 0, so the days are
     * rotated to let the week start on Monday, like the ISO calendar week does.
     */
    static daysSinceMonday(date) {
        return (date.getDay() + 6) % 7;
    }
    /**
     * Make sure the bar categories cover the given time range.
     *
     * The categories are built by the first line that is processed, and every value outside them is
     * dropped without a trace. A `json` source brings its own time range, so a second source can reach
     * further than the first one, and an update of the state can bring a value behind the end. The
     * categories therefore grow instead of cutting the data off, and the bars that were collected for
     * the lines before are moved with them.
     *
     * The new categories are walked from the existing ones, so they always stay on the same raster.
     *
     * @param startTs first time stamp that needs a category, on the main time range
     * @param endTs exclusive end of the range that must be covered, on the main time range
     */
    ensureBarCategories(startTs, endTs) {
        const interval = this.config.aggregateBar;
        // `endTs` is the exclusive border of the last bar and must not get a category of its own
        if (!this.barCategories?.length) {
            const categories = [];
            const walker = new Date(startTs);
            while (walker.getTime() < endTs) {
                categories.push(walker.getTime());
                ChartModel.addBarInterval(walker, interval);
            }
            this.barCategories = categories;
            this.barCategoriesEnd = endTs;
            return;
        }
        const front = [];
        const walkerFront = new Date(this.barCategories[0]);
        while (walkerFront.getTime() > startTs) {
            ChartModel.subBarInterval(walkerFront, interval);
            front.unshift(walkerFront.getTime());
        }
        const back = [];
        const walkerBack = new Date(this.barCategoriesEnd);
        while (walkerBack.getTime() < endTs) {
            back.push(walkerBack.getTime());
            ChartModel.addBarInterval(walkerBack, interval);
        }
        if (!front.length && !back.length) {
            return;
        }
        this.barCategories = front.concat(this.barCategories, back);
        if (back.length) {
            this.barCategoriesEnd = walkerBack.getTime();
        }
        // The lines that were processed before keep their bars, they only move to the right
        for (let i = 0; i < this.barData.length; i++) {
            if (this.barData[i]) {
                this.barData[i] = new Array(front.length)
                    .fill(null)
                    .concat(this.barData[i], new Array(back.length).fill(null));
            }
        }
    }
    /**
     * Align the given range to the borders of the bars and write it into `option`.
     *
     * @returns the exclusive end of the last bar
     */
    increaseRegionForBar(start, end, option) {
        if (!this.config) {
            throw new Error('Unexpected null config');
        }
        // A free interval comes from a number field or from a preset that was written by hand. It has to
        // be a whole number of minutes greater than zero: with a fraction below one minute the walk over
        // the intervals would not move at all, and with a negative one it would run backwards. In both
        // cases the loops below would never reach the end of the range and the browser would freeze.
        const interval = Math.round(getInt(this.config.aggregateBar));
        this.config.aggregateBar = interval >= 1 ? interval : 0;
        let endTs = typeof end === 'number' ? end : end.getTime();
        let startTs = typeof start === 'number' ? start : start.getTime();
        // calculate count of intervals
        if (!this.config.aggregateBar) {
            const range = endTs - startTs;
            if (range <= 3600000 * 12) {
                // less than 12 hours => 15 minutes
                this.config.aggregateBar = 15;
            }
            else if (range > 3600000 * 24 * 180) {
                // more than half a year => 1 month
                this.config.aggregateBar = 43200;
            }
            else if (range >= 3600000 * 24 * 60) {
                // 60 days up to half a year => 1 week. Days would give more than 60 bars here, and a
                // month would leave only two of them
                this.config.aggregateBar = 10080;
            }
            else if (range > 3600000 * 24 * 3) {
                // more than 3 days => 1 day
                this.config.aggregateBar = 1440;
            }
            else {
                // if (range > 3600000 * 12) { // more than 12 hours => 60 minutes
                this.config.aggregateBar = 60;
            }
        }
        option ||= {};
        const withDiff = this.hasBarDiff();
        if (this.config.aggregateBar === 15) {
            // align start and stop to 15 minutes
            const startDate = new Date(startTs);
            startDate.setMinutes(Math.floor(startDate.getMinutes() / 15) * 15);
            startDate.setSeconds(0);
            startDate.setMilliseconds(0);
            if (withDiff) {
                startDate.setMinutes(startDate.getMinutes() - 15);
            }
            startTs = startDate.getTime();
            // `end` is the exclusive border of the last bar, so round it up only if it is not aligned yet.
            // Otherwise, an empty bar is appended.
            const endDate = new Date(endTs);
            if (endDate.getMinutes() % 15 || endDate.getSeconds() || endDate.getMilliseconds()) {
                endDate.setMinutes(Math.floor(endDate.getMinutes() / 15) * 15 + 15);
                endDate.setSeconds(0);
                endDate.setMilliseconds(0);
            }
            endTs = endDate.getTime();
            option.count = Math.round((endTs - startTs) / 900000);
        }
        else if (this.config.aggregateBar === 60) {
            // align start and stop to 1 hour
            const startDate = new Date(startTs);
            startDate.setMinutes(0);
            startDate.setSeconds(0);
            startDate.setMilliseconds(0);
            if (withDiff) {
                startDate.setMinutes(startDate.getMinutes() - 60);
            }
            startTs = startDate.getTime();
            const endDate = new Date(endTs);
            if (endDate.getMinutes() || endDate.getSeconds() || endDate.getMilliseconds()) {
                endDate.setMinutes(60);
                endDate.setSeconds(0);
                endDate.setMilliseconds(0);
            }
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
            if (withDiff) {
                startDate.setDate(startDate.getDate() - 1);
            }
            startTs = startDate.getTime();
            const endDate = new Date(endTs);
            if (endDate.getHours() || endDate.getMinutes() || endDate.getSeconds() || endDate.getMilliseconds()) {
                endDate.setDate(endDate.getDate() + 1);
                endDate.setHours(0);
                endDate.setMinutes(0);
                endDate.setSeconds(0);
                endDate.setMilliseconds(0);
            }
            endTs = endDate.getTime();
            option.count = Math.round((endTs - startTs) / 86400000);
        }
        else if (this.config.aggregateBar === 10080) {
            // align start and stop to 1 week. The week starts on Monday, like the ISO calendar week
            const startDate = new Date(startTs);
            startDate.setHours(0);
            startDate.setMinutes(0);
            startDate.setSeconds(0);
            startDate.setMilliseconds(0);
            startDate.setDate(startDate.getDate() - ChartModel.daysSinceMonday(startDate));
            if (withDiff) {
                startDate.setDate(startDate.getDate() - 7);
            }
            startTs = startDate.getTime();
            const endDate = new Date(endTs);
            if (ChartModel.daysSinceMonday(endDate) ||
                endDate.getHours() ||
                endDate.getMinutes() ||
                endDate.getSeconds() ||
                endDate.getMilliseconds()) {
                endDate.setHours(0);
                endDate.setMinutes(0);
                endDate.setSeconds(0);
                endDate.setMilliseconds(0);
                endDate.setDate(endDate.getDate() - ChartModel.daysSinceMonday(endDate) + 7);
            }
            endTs = endDate.getTime();
            // A week can have 167 or 169 hours because of the daylight saving time
            option.count = Math.round((endTs - startTs) / (7 * 86400000));
        }
        else if (this.config.aggregateBar === 43200) {
            // align start and stop to 1 month
            const startDate = new Date(startTs);
            startDate.setDate(1);
            startDate.setHours(0);
            startDate.setMinutes(0);
            startDate.setSeconds(0);
            startDate.setMilliseconds(0);
            if (withDiff) {
                // one calendar month back and not 30 days, as every month has a different length
                startDate.setMonth(startDate.getMonth() - 1);
            }
            startTs = startDate.getTime();
            const endDate = new Date(endTs);
            if (endDate.getDate() !== 1 ||
                endDate.getHours() ||
                endDate.getMinutes() ||
                endDate.getSeconds() ||
                endDate.getMilliseconds()) {
                endDate.setDate(1);
                endDate.setHours(0);
                endDate.setMinutes(0);
                endDate.setSeconds(0);
                endDate.setMilliseconds(0);
                endDate.setMonth(endDate.getMonth() + 1);
            }
            endTs = endDate.getTime();
            // Count the real calendar months and do not assume 30 days per month
            option.count =
                (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth();
        }
        else {
            // A free interval the user entered. It is anchored at the midnight before the start, so the
            // bars keep the same width and no shorter one appears at the border of a day. The end is
            // walked in the same steps that `addBarInterval` uses, so the categories fit exactly.
            const interval = this.config.aggregateBar;
            const startDate = new Date(startTs);
            const minutesOfDay = startDate.getHours() * 60 + startDate.getMinutes();
            startDate.setHours(0, 0, 0, 0);
            startDate.setMinutes(Math.floor(minutesOfDay / interval) * interval);
            if (withDiff) {
                startDate.setMinutes(startDate.getMinutes() - interval);
            }
            startTs = startDate.getTime();
            // `end` is the exclusive border of the last bar
            const walker = new Date(startTs);
            let count = 0;
            while (walker.getTime() < endTs) {
                ChartModel.addBarInterval(walker, interval);
                count++;
            }
            endTs = walker.getTime();
            option.count = count;
        }
        option.start = startTs;
        option.end = endTs;
        return endTs;
    }
    /**
     * Data can reach behind the end of the time range: a `json` source is not limited by start and end,
     * so a forecast is drawn into the future. The user must be able to scroll there, so the limit for
     * the zoom is moved to the newest value. While the chart is zoomed, the data is cut to the zoomed
     * range, so the limit must not be touched then.
     */
    extendZoomLimitToData() {
        if (this.zoomData || !this.config.zoomLimitEnd) {
            return;
        }
        let last = this.config.zoomLimitEnd;
        this.seriesData?.forEach(series => {
            const newest = series?.[series.length - 1];
            if (newest && newest.value[0] > last) {
                last = newest.value[0];
            }
        });
        this.config.zoomLimitEnd = last;
    }
    /**
     * Remember where the chart ends without any zoom, so `ChartView` can stop the zoom and the pan there.
     *
     * This is not simply "now": with `relativeEnd: 'today'` the range ends at the next midnight, with
     * `'month'` at the first of the next month, and a static range ends where the user defined it.
     * While the chart is zoomed, the value is kept, as `referenceEnd` is then the zoomed end.
     *
     * @param referenceEnd end of the time range of the current read
     */
    rememberZoomLimit(referenceEnd) {
        if (!this.zoomData) {
            this.config.zoomLimitEnd = referenceEnd;
        }
    }
    /**
     * Is the line drawn on the main time range instead of extending the X-axis? Polar charts are
     * excluded: they show a single value per line and have no time axis to be moved on.
     *
     * @param index index of the line
     */
    isOffsetOverlay(index) {
        const line = this.config.l[index];
        return !!line.offsetOverlay && line.chartType !== 'polar';
    }
    /**
     * Split a time offset into its number and its unit.
     *
     * An offset is stored as a number of seconds, or as a string with a unit: `1m` is one month and
     * `1y` is one year. The negative entries of the editor arrive as strings too (`-3600`), and a
     * preset that was written by hand or converted from an old chart can carry other spellings.
     *
     * The unit used to be found by looking at the second and the third character of the string, so
     * `-12m` was read as -12 seconds and `100m` as 100 seconds, and an upper case `1M` as one second.
     *
     * @param offset the offset as it stands in the configuration
     * @param defaultUnit the unit of a bare number, seconds if not given
     */
    static parseOffset(offset, defaultUnit = 'second') {
        if (typeof offset === 'number') {
            return { value: offset || 0, unit: defaultUnit };
        }
        const parts = /^\s*([+-]?\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s*$/.exec(offset || '');
        if (!parts) {
            return { value: 0, unit: defaultUnit };
        }
        const value = parseFloat(parts[1]) || 0;
        switch (parts[2].toLowerCase()) {
            case '':
                return { value, unit: defaultUnit };
            case 's':
            case 'sec':
            case 'secs':
            case 'second':
            case 'seconds':
                return { value, unit: 'second' };
            case 'h':
            case 'hour':
            case 'hours':
                return { value, unit: 'hour' };
            case 'd':
            case 'day':
            case 'days':
                return { value, unit: 'day' };
            case 'w':
            case 'week':
            case 'weeks':
                return { value, unit: 'week' };
            case 'y':
            case 'year':
            case 'years':
                return { value, unit: 'year' };
            // A bare `m` has always meant a month in the presets, not a minute
            case 'm':
            case 'mon':
            case 'month':
            case 'months':
                return { value, unit: 'month' };
            default:
                return { value, unit: defaultUnit };
        }
    }
    /**
     * Move a date by whole months or years in the calendar.
     *
     * `setMonth` rolls over into the next month if the target month is shorter, so the 31st of March
     * minus one month would land on the 1st or the 3rd of March instead of the end of February. The
     * day is therefore kept inside the target month.
     *
     * @param date date to modify in place
     * @param months whole months to add, may be negative
     * @param years whole years to add, may be negative
     */
    static addCalendarTime(date, months, years) {
        const day = date.getDate();
        date.setDate(1);
        if (years) {
            date.setFullYear(date.getFullYear() + years);
        }
        if (months) {
            date.setMonth(date.getMonth() + months);
        }
        // the 0th day of the following month is the last day of this one
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        date.setDate(day < daysInMonth ? day : daysInMonth);
    }
    /**
     * Move one time stamp from the shifted range of a line onto the main time range.
     *
     * An offset in months or years is applied in the calendar and not as a fixed number of
     * milliseconds. Otherwise a value that is written on the 1st of every month wanders away from the
     * 1st after a few intervals, because the months have different lengths.
     *
     * @param line the line, carrying the shift calculated by `getOffsetShift`
     * @param ts the real time stamp of the value
     */
    static shiftToMainRange(line, ts) {
        if (line.offsetShiftMonths || line.offsetShiftYears) {
            const date = new Date(ts);
            // the same step that `addTime` walked, so both cancel each other out exactly
            ChartModel.addCalendarTime(date, line.offsetShiftMonths || 0, line.offsetShiftYears || 0);
            return date.getTime();
        }
        return ts + (line.offsetShift || 0);
    }
    /**
     * Calculate how far the values of a line must be moved to draw them on the main time range. The
     * result is stored on the line and used by `processRawData` via `shiftToMainRange`.
     *
     * @param index index of the line
     * @param referenceEnd end of the time range the line would have without its offset
     * @param endTs end of the time range of this line
     */
    getOffsetShift(index, referenceEnd, endTs) {
        const line = this.config.l[index];
        delete line.offsetShiftMonths;
        delete line.offsetShiftYears;
        if (!this.isOffsetOverlay(index)) {
            line.offsetShift = 0;
            return 0;
        }
        // `addTime` moves the read window by whole months or years, so the values have to move back the
        // same way. The sign is inverted: the window went into the past, the values come back from it.
        const { value, unit } = ChartModel.parseOffset(line.offset);
        if (unit === 'month') {
            line.offsetShiftMonths = Math.trunc(value);
        }
        else if (unit === 'year') {
            line.offsetShiftYears = Math.trunc(value);
        }
        line.offsetShift = referenceEnd - endTs;
        return line.offsetShift;
    }
    getStartStop(index, step) {
        let option;
        let endTs;
        let startTs;
        let referenceEnd;
        let _nowTs;
        if (!this.config) {
            throw new Error('Unexpected null config');
        }
        this.config.l[index].offset ||= 0;
        // check config range
        if (typeof this.config.range === 'string' && this.config.range.includes('m') && this.config.l.length > 1) {
            const monthRange = getInt(this.config.range) || 1;
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
            const yearRange = getInt(this.config.range) || 1;
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
                referenceEnd = this.zoomData.end;
                // Keep the offset while zooming, otherwise an overlaid line would jump to the zoomed range
                endTs = this.isOffsetOverlay(index)
                    ? ChartModel.addTime(this.zoomData.end, this.config.l[index].offset)
                    : this.zoomData.end;
                startTs = endTs - (this.zoomData.end - this.zoomData.start);
            }
            else if (this.config.timeType === 'static') {
                if (this.staticRange?.config !== this.config) {
                    this.staticRange = { config: this.config, start: this.config.start, end: this.config.end };
                }
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
                const startDate = new Date(this.staticRange.start).setHours(startTime[0], startTime[1]);
                const endDate = new Date(this.staticRange.end).setHours(endTime[0], endTime[1]);
                startTs = ChartModel.addTime(startDate, this.config.l[index].offset);
                endTs = ChartModel.addTime(endDate, this.config.l[index].offset);
                referenceEnd = endDate;
            }
            else {
                this.config.relativeEnd = this.config.relativeEnd || 'now';
                let _nowDate;
                if (this.config.relativeEnd === 'now') {
                    _nowDate = new Date(this.now);
                }
                else if (this.config.relativeEnd.includes('minute')) {
                    const minutes = getInt(this.config.relativeEnd) || 1;
                    _nowDate = new Date(this.now);
                    _nowDate.setMinutes(Math.floor(_nowDate.getMinutes() / minutes) * minutes + minutes);
                    _nowDate.setSeconds(0);
                    _nowDate.setMilliseconds(0);
                }
                else if (this.config.relativeEnd.includes('hour')) {
                    const hours = getInt(this.config.relativeEnd) || 1;
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
                    // const week = getInt(config.relativeEnd) || 1;
                    _nowDate = new Date(this.now);
                    _nowDate.setDate(_nowDate.getDate() - _nowDate.getDay() + 7);
                    _nowDate.setHours(0);
                    _nowDate.setMinutes(0);
                    _nowDate.setSeconds(0);
                    _nowDate.setMilliseconds(0);
                }
                else if (this.config.relativeEnd === 'weekEurope') {
                    // const _week = getInt(config.relativeEnd) || 1;
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
                    // const week = getInt(config.relativeEnd) || 1;
                    _nowDate = new Date(this.now);
                    _nowDate.setDate(_nowDate.getDate() - _nowDate.getDay() + 7);
                    _nowDate.setDate(_nowDate.getDate() - 7);
                    _nowDate.setHours(0);
                    _nowDate.setMinutes(0);
                    _nowDate.setSeconds(0);
                    _nowDate.setMilliseconds(0);
                }
                else if (this.config.relativeEnd === 'week2Europe') {
                    // const _week = getInt(config.relativeEnd) || 1;
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
                referenceEnd = _nowDate.getTime();
            }
            const aggregate = this.config.l[index].aggregate || this.config.aggregate;
            option = {
                start: startTs,
                end: endTs,
                ignoreNull: this.config.l[index].ignoreNull === undefined
                    ? this.config.ignoreNull
                    : this.config.l[index].ignoreNull,
                // "current" reads the state and never the history, so it must not reach the history adapter
                aggregate: !aggregate || aggregate === 'current' ? 'minmax' : aggregate,
                from: false,
                ack: false,
                q: false,
                addID: false,
            };
            if (this.config.l[index].chartType === 'bar' || this.config.l[index].chartType === 'polar') {
                const alignedEnd = this.increaseRegionForBar(startTs, endTs, option);
                // A relative range asks for a number of intervals: "7 days" with daily bars means seven
                // bars. The end is rounded up to the border of the last bar and the start was rounded
                // down, so both ends got a bar that holds only a part of its interval - "7 days" showed
                // eight bars, the first and the last one cut off. The start is therefore measured again
                // from the rounded end, so the range holds whole bars. A zoomed or a static range is the
                // window the user picked himself and stays untouched.
                if (!this.zoomData && this.config.timeType !== 'static') {
                    this.increaseRegionForBar(ChartModel.addTime(alignedEnd, this.config.range, true), alignedEnd, option);
                }
            }
            else if (this.config.aggregateType === 'step') {
                option.step = this.config.aggregateSpan * 1000;
            }
            else if (this.config.aggregateType === 'count') {
                option.count = this.config.aggregateSpan || 300;
            }
            this.rememberZoomLimit(referenceEnd);
            // The X-axis shows the main time range, so a shifted line reports the range it is drawn in
            this.getOffsetShift(index, referenceEnd, endTs);
            this.config.start = ChartModel.shiftToMainRange(this.config.l[index], startTs);
            this.config.end = ChartModel.shiftToMainRange(this.config.l[index], endTs);
            return option;
        }
        if (this.zoomData) {
            referenceEnd = this.zoomData.end;
            endTs = this.isOffsetOverlay(index)
                ? ChartModel.addTime(this.zoomData.end, this.config.l[index].offset)
                : this.zoomData.end;
            startTs = endTs - (this.zoomData.end - this.zoomData.start);
        }
        else {
            endTs = ChartModel.addTime(this.now, this.config.l[index].offset);
            startTs = endTs - step;
            referenceEnd = this.now;
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
        this.rememberZoomLimit(referenceEnd);
        this.getOffsetShift(index, referenceEnd, endTs);
        this.config.start = ChartModel.shiftToMainRange(this.config.l[index], ChartModel.addTime(endTs, this.config.range, true));
        this.config.end = ChartModel.shiftToMainRange(this.config.l[index], endTs);
        return option;
    }
    static postProcessing(series, aggregate, postProcessingMethod, dropFirstInterval) {
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
        }
        if (dropFirstInterval) {
            // The first interval was only read as a reference for `diff` and has no category
            barSeries.splice(0, 1);
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
        else if (value === 'null') {
            value = null;
        }
        else if (typeof value === 'string') {
            value = getFloat(value);
        }
        if (value === null || value === undefined) {
            return null;
        }
        // A preset that was written by hand can carry an offset that is not a number. Adding it would
        // glue the value and the offset together to a text.
        const offset = typeof yOffset === 'number' ? yOffset : getFloat(yOffset);
        const result = convertFunc ? convertFunc(value + offset) : value + offset;
        // The convert function of the user can return anything: a division by zero gives infinity, a
        // formula without a result gives undefined, and a wrong one gives a text. Such a result is not
        // a value. It must not be drawn, and above all it must not reach the Y-axis: one single
        // infinity or NaN makes the whole axis disappear, labels and grid lines included.
        return typeof result === 'number' && Number.isFinite(result) ? result : null;
    }
    processRawData(_id, line, values, option) {
        if (!option) {
            const firstTs = values.length ? values[0].ts : this.now;
            const lastTs = values.length ? values[values.length - 1].ts : this.now;
            option = {
                start: firstTs,
                end: lastTs,
            };
            if (line.chartType === 'bar' || line.chartType === 'polar') {
                // A `json` source has no time range of its own, so the range is the data itself. The end
                // of the range is the exclusive border of the last bar, and it is rounded up only if it
                // is not on the raster yet. A value that sits exactly on an interval border - a counter
                // written at 00:00 is the normal case - would therefore fall out of the range and lose
                // its bar, so the end is moved one millisecond behind the last value.
                this.increaseRegionForBar(firstTs, lastTs + 1, option);
            }
        }
        const yOffset = line.yOffset || 0;
        const seriesData = [];
        // Collects for every time interval the values. Later it will be combined to number[]
        const _barSeries = [];
        let barCategories = this.barCategories;
        // fill categories for bars
        if (line.chartType === 'bar') {
            // A shifted line is drawn on the main time range, so its categories are the moved ones
            this.ensureBarCategories(ChartModel.shiftToMainRange(line, option.start), ChartModel.shiftToMainRange(line, typeof option.end === 'number' ? option.end : option.end.getTime()));
            barCategories = this.barCategories;
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
            // The place on the X-axis: for a shifted line that is not the time the value was written
            const ts = ChartModel.shiftToMainRange(line, values[i].ts);
            if (line.chartType === 'bar') {
                // find category: every interval is [category, next category[ and the last one ends at `end`
                for (let c = 0; c < barCategories.length; c++) {
                    const intervalEnd = c + 1 < barCategories.length ? barCategories[c + 1] : this.barCategoriesEnd;
                    if (ts >= barCategories[c] && ts < intervalEnd) {
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
                const dp = { value: [ts, value] };
                // If value was interpolated by backend
                if (values[i].i) {
                    dp.exact = false;
                }
                seriesData.push(dp);
            }
        }
        // add start and end
        if (line.chartType !== 'bar' && line.chartType !== 'polar') {
            let end = typeof option.end === 'number'
                ? option.end
                : typeof option.end === 'string'
                    ? new Date(option.end).getTime()
                    : option.end.getTime();
            let start = typeof option.start === 'number'
                ? option.start
                : typeof option.start === 'string'
                    ? new Date(option.start).getTime()
                    : option.start.getTime();
            // End cannot be in the future
            if (end > this.now) {
                end = this.now;
            }
            // The values were moved, so the borders of the series must be moved too
            start = ChartModel.shiftToMainRange(line, start);
            end = ChartModel.shiftToMainRange(line, end);
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
        const barData = ChartModel.postProcessing(_barSeries, line.aggregate, line.postProcessing, this.hasBarDiff());
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
                        // `window` does not exist on the server: the data is read before `main.ts` creates the
                        // jsdom stub, so `window.isFinite` threw and the whole source was dropped
                        if (typeof values[0].ts === 'string' && Number.isFinite(Number(values[0].ts))) {
                            values.forEach(v => (v.ts = getInt(v.ts)));
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
                values.sort((a, b) => a.ts - b.ts);
                // Remember the range the categories are built from, so a later update of the state can
                // see that the chart has to be read again
                this.barJsonRange[index] =
                    lineConfig.chartType === 'bar' && values.length
                        ? { first: values[0].ts, last: values[values.length - 1].ts }
                        : undefined;
                const result = this.processRawData(id, lineConfig, values);
                if (result.barData) {
                    this.barData[index] = result.barData;
                }
                else {
                    this.seriesData[index] = result.seriesData;
                }
                // set actual value for legend from last JSON entry
                if (this.config.legActual && values.length) {
                    this.actualValues[index] = ChartModel.processOneValue(values[values.length - 1].val, this.convertFunctions[lineConfig.convert?.trim()], lineConfig.yOffset || 0);
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
                    this.actualValues[index] = ChartModel.processOneValue(state.val, this.convertFunctions[lineConfig.convert?.trim()], lineConfig.yOffset || 0);
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
                        // `window` does not exist on the server: the data is read before `main.ts` creates the
                        // jsdom stub, so `window.isFinite` threw and the whole source was dropped
                        if (typeof values[0].ts === 'string' && Number.isFinite(Number(values[0].ts))) {
                            values.forEach(v => (v.ts = getInt(v.ts)));
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
                values.sort((a, b) => a.ts - b.ts);
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
            // process the lower ID
            if (mark.lowerValueOrId &&
                typeof mark.lowerValueOrId === 'string' &&
                mark.lowerValueOrId.includes('.') &&
                parseFloat(mark.lowerValueOrId).toString() !== mark.lowerValueOrId.replace(/\.0*$/, '')) {
                /* if (!this.subscribes.includes(mark.upperValueOrId)) {
                        this.subscribes.push(mark.upperValueOrId);
                    } */
                try {
                    const state = await this.socket.getState(mark.lowerValueOrId);
                    if (state?.val != null) {
                        mark.lowerValue = getFloat(state.val);
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
        this.extendZoomLimitToData();
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
        this.onUpdateFunc?.(updateData, this.actualValues, 
        // The first interval is only the reference of the `diff` calculation and is not shown
        this.barCategories && this.hasBarDiff() ? this.barCategories.slice(1) : this.barCategories);
    }
    /**
     * The category a time stamp belongs to, or -1 if it lies outside of the categories.
     */
    barCategoryIndex(ts) {
        const categories = this.barCategories;
        if (!categories?.length || ts < categories[0] || ts >= this.barCategoriesEnd) {
            return -1;
        }
        for (let c = categories.length - 1; c >= 0; c--) {
            if (ts >= categories[c]) {
                return c;
            }
        }
        return -1;
    }
    /**
     * Do the new contents of a `json` source stand in other bars than the ones the categories were
     * built from? Then the time range of the chart has moved and it must be read again.
     *
     * @param index index of the line in the configuration
     * @param values the new values, sorted by time
     */
    barsMoveOutOfRange(index, values) {
        const known = this.barJsonRange[index];
        if (!known || !values.length || !this.barCategories?.length) {
            return false;
        }
        const line = this.config.l[index];
        const category = (ts) => this.barCategoryIndex(ChartModel.shiftToMainRange(line, ts));
        return (category(values[0].ts) !== category(known.first) ||
            category(values[values.length - 1].ts) !== category(known.last));
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
                        data.sort((a, b) => a.ts - b.ts);
                        // The time range of a `json` source is the data itself, so a new value can move
                        // it. The categories of the bars would only grow then, and a rolling window
                        // would leave more and more empty bars at the front, so the whole chart is read
                        // again in that case. As long as the data stays inside the range, the cheap
                        // update is enough.
                        if (this.config.l[index].chartType === 'bar' && this.barsMoveOutOfRange(index, data)) {
                            void this.readData();
                            return;
                        }
                        const result = this.processRawData(id, this.config.l[index], data);
                        if (result.barData) {
                            this.barData[index] = result.barData;
                        }
                        else {
                            this.seriesData[index] = result.seriesData;
                        }
                        // take last value as actual value
                        if (this.actualValues) {
                            this.actualValues[index] = ChartModel.processOneValue(data[data.length - 1].val, this.convertFunctions[this.config.l[index].convert?.trim()], this.config.l[index].yOffset || 0);
                        }
                        this.updateData();
                    }
                    catch (e) {
                        console.error(`Cannot parse JSON: ${e}`);
                    }
                    return;
                }
                const value = ChartModel.processOneValue(state.val, this.convertFunctions[this.config.l[index].convert?.trim()], this.config.l[index].yOffset || 0);
                if (this.actualValues && this.actualValues[index] !== value) {
                    this.actualValues[index] = value;
                    changed = true;
                }
                break;
            }
        }
        if (changed) {
            this.onUpdateFunc?.(null, this.actualValues);
        }
    };
    /**
     * Go back in time by the given offset. A positive offset reaches into the past.
     *
     * Months and years are counted in the calendar, everything else is a fixed number of
     * milliseconds.
     *
     * @param time the point the offset is measured from
     * @param offset seconds, or a string with a unit like `1m` (month) or `1y` (year)
     * @param isOffsetInMinutes a bare number stands for minutes instead of seconds
     */
    static addTime(time, offset, isOffsetInMinutes) {
        const date = new Date(time);
        const { value, unit } = ChartModel.parseOffset(offset, isOffsetInMinutes ? 'minute' : 'second');
        switch (unit) {
            case 'month':
                ChartModel.addCalendarTime(date, -Math.trunc(value));
                return date.getTime();
            case 'year':
                ChartModel.addCalendarTime(date, 0, -Math.trunc(value));
                return date.getTime();
            case 'week':
                return date.getTime() - value * 7 * 86400000;
            case 'day':
                return date.getTime() - value * 86400000;
            case 'hour':
                return date.getTime() - value * 3600000;
            case 'minute':
                return date.getTime() - value * 60000;
            default:
                return date.getTime() - value * 1000;
        }
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
                _from = values?.length ? values[values.length - 1].ts + 1 : 0;
                data = data.concat(values);
            }
            if (data) {
                result[this.config.l[i].id] = data;
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
            this.barCategoriesEnd = undefined;
            this.barJsonRange = [];
            await this._readData();
            // The lines that share a Y-axis show the unit of that axis. A preset that was written by
            // hand or that survived a conversion can point at a line that does not exist. That must not
            // stop the whole chart, so such a line falls back to an own axis.
            for (let i = 0; i < this.config.l.length; i++) {
                const commonYAxis = this.config.l[i].commonYAxis;
                if (commonYAxis || commonYAxis === 0) {
                    const axisOwner = this.config.l[commonYAxis];
                    if (axisOwner) {
                        this.config.l[i].unit = axisOwner.unit;
                    }
                    else {
                        console.warn(`[ChartModel] Line ${i + 1} shares the Y-axis of line ${Number(commonYAxis) + 1}, which does not exist. It gets an own axis.`);
                        delete this.config.l[i].commonYAxis;
                    }
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