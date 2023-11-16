/**
 * Parse a query string into its parts.
 * Copied from @iobroker/adapter-react-v5/Components/Utils
 * @param {string} query
 * @returns {Record<string, string | boolean | number>}
 */
function parseQuery(query) {
    query = (query || '').toString().replace(/^\?/, '');
    /** @type {Record<string, string | boolean | number>} */
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
                } else if (result[attr] === 'false') {
                    result[attr] = false;
                } else {
                    const f = parseFloat(result[attr]);
                    if (f.toString() === result[attr]) {
                        result[attr] = f;
                    }
                }
            } else {
                result[attr] = true;
            }
        }
    });
    return result;
}

/*
function deParam(params, coerce) {
    const obj = {};
    const coerceTypes = {'true': true, 'false': false, 'null': null};

    // Iterate over all name=value pairs.
    params.replace(/\+/g, ' ').split('&').forEach(v => {
        const param = v.split('=');
        let key = decodeURIComponent(param[0]);
        let val;
        let i = 0;

        // If key is more complex than 'foo', like 'a[]' or 'a[b][c]', split it
        // into its component parts.
        let keys = key.split('][');
        let keysLast = keys.length - 1;

        // If the first keys part contains [ and the last ends with ], then []
        // are correctly balanced.
        if (/\[/.test(keys[0]) && /]$/.test(keys[keysLast])) {
            // Remove the trailing ] from the last keys part.
            keys[keysLast] = keys[keysLast].replace(/]$/, '');

            // Split first keys part into two parts on the [ and add them back onto
            // the beginning of the keys array.
            keys = keys.shift().split('[').concat(keys);

            keysLast = keys.length - 1;
        } else {
            // Basic 'foo' style key.
            keysLast = 0;
        }

        // Are we dealing with a name=value pair, or just a name?
        if (param.length === 2) {
            val = decodeURIComponent(param[1]);

            // Coerce values.
            if (coerce) {
                val = val && !isNaN(val) && ((+val + '') === val) ? +val        // number
                    : val === 'undefined' ? undefined         // undefined
                        : coerceTypes[val] !== undefined ? coerceTypes[val] // true, false, null
                            : val;                                                          // string
            }

            if (keysLast) {
                let cur = obj;
                // Complex key, build deep object structure based on a few rules:
                // * The 'cur' pointer starts at the object top-level.
                // * [] = array push (n is set to array length), [n] = array if n is
                //   numeric, otherwise object.
                // * If at the last keys part, set the value.
                // * For each keys part, if the current level is undefined create an
                //   object or array based on the type of the next keys part.
                // * Move the 'cur' pointer to the next level.
                // * Rinse & repeat.
                for (; i <= keysLast; i++) {
                    key = keys[i] === '' ? cur.length : keys[i];
                    cur = cur[key] = i < keysLast
                        ? cur[key] || (keys[i + 1] && isNaN(keys[i + 1]) ? {} : [])
                        : val;
                }

            } else {
                // Simple key, even simpler rules, since only scalars and shallow
                // arrays are allowed.

                if (Object.prototype.toString.call(obj[key]) === '[object Array]') {
                    // val is already an array, so push on the next value.
                    obj[key].push(val);
                } else if ({}.hasOwnProperty.call(obj, key)) {
                    // val isn't an array, but since a second value has been specified,
                    // convert val into an array.
                    obj[key] = [obj[key], val];
                } else {
                    // val is a scalar.
                    obj[key] = val;
                }
            }
        } else if (key) {
            // No value was defined, so set something meaningful.
            obj[key] = coerce
                ? undefined
                : '';
        }
    });

    return obj;
}
*/
// Do not forget to change normalizeConfig in src/utils/flotConverter.js too
function normalizeConfig(config) {
    if (config.lines) {
        config.l = config.lines;
        delete config.lines;
    }

    if (config._ids) {
        const ids    = config._ids    ? config._ids.split(';')    : [];
        const colors = config._colors ? config._colors.split(';') : [];
        const names  = config._names  ? config._names.split(';')  : [];
        const units  = config._units  ? config._units.split(';')  : [];
        config.l = [];
        for (let i = 0; i < ids.length; i++) {
            config.l.push({
                id:         ids[i],
                offset:     0,
                name:       names[i] || '',
                aggregate:  'onchange',
                color:      colors[i] || 'blue',
                thickness:  config.strokeWidth || 1,
                shadowsize: config.strokeWidth || 1,
                min:        config.min || '',
                max:        config.max || '',
                unit:       units[i]   || '',
            });
        }
        config.aggregateType = 'step';
        config.aggregateSpan = 300;
        config.relativeEnd   = 'now';
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
            config.l[j].yOffset   = parseFloat(config.l[j].yOffset)   || 0;
            config.l[j].offset    = parseFloat(config.l[j].offset)    || 0;
            config.l[j].validTime = parseFloat(config.l[j].validTime) || 0;
            config.l[j].chartType = config.l[j].chartType || config.chartType || 'auto';
            config.l[j].xLabelShift = parseFloat(config.l[j].xLabelShift) || 0;
        }
    }

    config.l = config.l || [];

    // convert marks
    if (config.m) {
        config.marks = [];
        for (let j = 0; j < config.m.length; j++) {
            config.marks[j] = {
                lineId:         config.m[j].l,
                upperValueOrId: config.m[j].v,
                lowerValueOrId: config.m[j].vl,
                color:          config.m[j].c,
                fill:           config.m[j].f,
                ol:             config.m[j].t,
                os:             config.m[j].s,
                text:           config.m[j].d,
                textPosition:   config.m[j].p,
                textOffset:     config.m[j].py,
                textColor:      config.m[j].fc,
                textSize:       config.m[j].fs,
            };
        }
        delete config.m;
    }

    config.marks = config.marks || [];

    if (!config.l.length) {
        config.l.push({ id: '', unit: '' });
    }

    // Set default values
    config.width        = config.width                   || '100%';
    config.height       = config.height                  || '100%';
    config.timeFormat   = config.timeFormat              || '';
    config.useComma     = config.useComma    === 'true'  || config.useComma    === true;
    config.zoom         = config.zoom        === 'true'  || config.zoom        === true;
    config.export       = config.export      === 'true'  || config.export      === true;
    config.grid_hideX   = config.grid_hideX  === 'true'  || config.grid_hideX  === true;
    config.grid_hideY   = config.grid_hideY  === 'true'  || config.grid_hideY  === true;
    config.hoverDetail  = config.hoverDetail === 'true'  || config.hoverDetail === true;
    config.noLoader     = config.noLoader    === 'true'  || config.noLoader    === true;
    config.noedit       = config.noedit      === 'true'  || config.noedit      === true;
    config.animation    = parseInt(config.animation)     || 0;
    config.afterComma   = config.afterComma === undefined ? 2 : parseInt(config.afterComma, 10);
    config.timeType     = config.timeType || 'relative';

    return config;
}

const NOT_CONNECTED = 'notConnectedError';

class ChartModel {
    constructor(socket, config, options) {
        options = { updateTimeout: 300, ...options || {} };
        this.socket = socket;

        this.updateTimeout    = options.updateTimeout || 300; // how often the new data will be requested by zoom and pan
        this.serverSide       = options.serverSide || false; // if rendering is serverside

        this.seriesData       = [];
        this.actualValues     = []; // only if config.legActual === true
        this.ticks            = null;
        this.reading          = false;

        this.subscribes       = [];
        // this.subscribed       = false;
        this.sessionId        = 1;
        this.updateInterval   = null; // update interval by time
        this.presetSubscribed = false; // Is preset subscribed yet or not

        this.defaultHistory   = '';

        this.onUpdateFunc     = null;
        this.onReadingFunc    = null;
        this.onErrorFunc      = null;
        this.objectPromises   = {};
        this.debug            = false;
        this.zoomData         = null;

        if (!this.serverSide) {
            this.lastHash         = window.location.hash;

            if (!config) {
                this.onHashInstalled = true;
                this.onHashChangeBound = this.onHashChange.bind(this);
                window.addEventListener('hashchange', this.onHashChangeBound, false);
            }
            this.onPresetUpdateBound = this.onPresetUpdate.bind(this);
        } // else node.js

        this.socket.getSystemConfig()
            .catch(e => {
                e === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(e);
                console.error(`Cannot read systemConfig: ${e}`);
                return null;
            })
            .then(systemConfig => {
                this.systemConfig = systemConfig && systemConfig.common ? systemConfig.common : {};
                this.defaultHistory = this.systemConfig.defaultHistory;
                return this.analyseAndLoadConfig(config);
            });
    }

    async analyseAndLoadConfig(config) {
        if (config) {
            if (typeof config === 'string') {
                this.preset = config;
            } else {
                this.config = normalizeConfig(config);
            }
        } else if (!this.serverSide) {
            const query = parseQuery(window.location.search); // Utils.parseQuery

            this.debug = query.debug === true || query.debug === 'true' || query.debug === 1 || query.debug === '1';

            if (query.preset && typeof query.preset === 'string') {
                this.preset = query.preset;
            } else {
                const hQuery = parseQuery((window.location.hash || '').toString().replace(/^#/, '')); // Utils.parseQuery
                if (hQuery.data) {
                    try {
                        hQuery.data = JSON.parse(hQuery.data);
                    } catch (e) {
                        hQuery.data = {};
                    }
                }
                if (query.data) {
                    try {
                        query.data = JSON.parse(query.data);
                    } catch (e) {
                        query.data = {};
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
                } else {
                    // search ID and range
                    const _config = Object.assign(query.data || {}, hQuery.data || {}, true);
                    if (hQuery.noLoader !== undefined) {
                        _config.noLoader = hQuery.noLoader === true || hQuery.noLoader === 'true' || hQuery.noLoader === 1 || hQuery.noLoader === '1';
                    }
                    if (query.noLoader !== undefined) {
                        _config.noLoader = query.noLoader === true || query.noLoader === 'true' || query.noLoader === 1 || query.noLoader === '1';
                    }
                    this.config = normalizeConfig(_config);
                    // console.log(this.config);
                }
            }
        }

        this.seriesData = [];
        this.barCategories = null;

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.preset) {
            if ((!this.preset.startsWith('echarts.') && !this.preset.startsWith('flot.')) || !this.preset.includes('.')) {
                this.preset = `echarts.0.${this.preset}`;
            }

            try {
                const obj = await this.socket.getObject(this.preset);
                if (!obj || !obj.native || !obj.native.data || obj.type !== 'chart') {
                    console.error(`[ChartModel] Invalid object ${this.preset}: ${JSON.stringify(obj)}`);
                    return;
                }
                this.config          = normalizeConfig(obj.native.data);
                this.config.useComma = this.config.useComma === undefined ? this.systemConfig.isFloatComma === true || this.systemConfig.isFloatComma === 'true' : this.config.useComma === 'true' || this.config.useComma === true;
                this.config.lang     = this.systemConfig.language;
                this.config.live     = parseInt(this.config.live, 10) || 0;
                this.config.debug    = this.debug;
                this.config.presetId = this.preset;

                if (this.hash && this.hash.range) {
                    this.config.range = this.hash.range;
                }
                if (this.hash && this.hash.relativeEnd) {
                    this.config.relativeEnd = this.hash.relativeEnd;
                }

                await this.readData();

                // subscribe on preset changes
                if (!this.serverSide && this.presetSubscribed !== this.preset) {
                    this.presetSubscribed && (await this.socket.unsubscribeObject(this.presetSubscribed, this.onPresetUpdateBound));
                    this.presetSubscribed = this.preset;
                    await this.socket.subscribeObject(this.preset, this.onPresetUpdateBound);
                }
                if (!this.serverSide && this.config.live && (!this.zoomData || !this.zoomData.stopLive)) {
                    this.updateInterval = setInterval(() => this.readData(), this.config.live * 1000);
                }
            } catch (e) {
                e === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(e);
                console.error(`Cannot read "${this.preset}": ${e}`);
            }
        } else {
            this.config.useComma = this.config.useComma === undefined ? this.systemConfig.isFloatComma === true || this.systemConfig.isFloatComma === 'true' : this.config.useComma === 'true' || this.config.useComma === true;
            this.config.lang     = this.systemConfig.language;
            this.config.live     = parseInt(this.config.live, 10) || 0;
            this.config.debug    = this.debug;
            await this.readData();
            if (!this.serverSide && this.config.live && (!this.zoomData || !this.zoomData.stopLive)) {
                this.updateInterval = setInterval(() => this.readData(), this.config.live * 1000);
            }
        }
    }

    onHashChange() {
        if (this.lastHash !== window.location.hash) {
            this.lastHash = window.location.hash;
            this.analyseAndLoadConfig();
        }
    }

    onPresetUpdate(id, obj) {
        if (id !== this.preset) {
            return;
        }
        this.presetUpdateTimeout && clearTimeout(this.presetUpdateTimeout);
        this.presetUpdateTimeout = setTimeout(() => {
            this.presetUpdateTimeout = null;
            let newConfig;
            if (obj) {
                newConfig = normalizeConfig(obj.native.data);
            } else {
                newConfig = normalizeConfig({});
            }
            if (JSON.stringify(newConfig) !== JSON.stringify(this.config)) {
                this.config = newConfig;
                this.updateInterval && clearInterval(this.updateInterval);
                this.updateInterval = null;

                if (this.config.live && (!this.zoomData || !this.zoomData.stopLive)) {
                    this.updateInterval = setInterval(() => this.readData(), this.config.live * 1000);
                }

                this.readData();
            }
        }, 100);
    }

    setNewRange(options) {
        this.debug && console.log(`[ChartModel] [${new Date().toISOString()}] setNewRange: ${JSON.stringify(options)}`);

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
                    this.readData();
                }, this.updateTimeout);
            }
        } else if (options.stopLive) {
            this.zoomData = this.zoomData || {};
            this.zoomData.stopLive = true;
            if (this.updateInterval) {
                console.log('Clear interval');
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        } else {
            // options = {start, end}
            const stopLive = this.zoomData && this.zoomData.stopLive;
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
                    this.readData();
                }, this.updateTimeout);
            } else if (stopLive) {
                this.zoomData.stopLive = true;
            }
        }
    }

    destroy() {
        if (this.subscribed) {
            !this.serverSide && this.subscribes.forEach(id => this.socket.unsubscribeState(id, this.onStateChange));
            this.subscribes = [];
            this.subscribed = null;
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
            !this.serverSide && this.socket.unsubscribeObject(this.presetSubscribed, this.onPresetUpdateBound);
            this.presetSubscribed = null;
        }
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (!this.serverSide) {
            this.onHashInstalled && window.removeEventListener('hashchange', this.onHashChangeBound, false);
            this.onHashInstalled = false;
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
        this.analyseAndLoadConfig(config);
    }

    increaseRegionForBar(start, end, option) {
        this.config.aggregateBar = parseInt(this.config.aggregateBar, 10) || 0;
        // calculate count of intervals
        if (!this.config.aggregateBar) {
            if (end - start <= 3600000 * 12) { // less than 12 hours => 15 minutes
                this.config.aggregateBar = 15;
            } else if (end - start >= 3600000 * 24 * 60) { // more than 60 days => 1 month
                this.config.aggregateBar = 43200;
            } else if (end - start > 3600000 * 24 * 3) { // more than 3 days => 1 day
                this.config.aggregateBar = 1440;
            } else { // if (end - start > 3600000 * 12) { // more than 12 hours => 60 minutes
                this.config.aggregateBar = 60;
            }
        }

        option = option || {};

        if (this.config.aggregateBar === 15) {
            // align start and stop to 15 minutes
            start = new Date(start);
            start.setMinutes(Math.floor(start.getMinutes() / 15) * 15);
            if (this.config.postProcessing === 'diff') {
                start.setMinutes(start.getMinutes() - 15);
            }
            start.setSeconds(0);
            start.setMilliseconds(0);
            start = start.getTime();

            end = new Date(end);
            end.setMinutes(Math.ceil(end.getMinutes() / 15) * 15);
            end.setSeconds(0);
            end.setMilliseconds(0);
            end = end.getTime();
            option.count = Math.round((end - start) / 900000);
        } else if (this.config.aggregateBar === 60) {
            // align start and stop to 1 hour
            start = new Date(start);
            start.setMinutes(0);
            start.setSeconds(0);
            start.setMilliseconds(0);
            start = start.getTime();
            if (this.config.postProcessing === 'diff') {
                start.setMinutes(start.getMinutes() - 60);
            }

            end = new Date(end);
            end.setMinutes(60);
            end.setSeconds(0);
            end.setMilliseconds(0);
            end = end.getTime();
            option.count = Math.round((end - start) / 3600000);
        } else if (this.config.aggregateBar === 1440) {
            // align start and stop to 1 day
            start = new Date(start);
            start.setHours(0);
            start.setMinutes(0);
            start.setSeconds(0);
            start.setMilliseconds(0);
            start = start.getTime();
            if (this.config.postProcessing === 'diff') {
                start.setDate(start.getDate() - 1);
            }

            end = new Date(end);
            end.setDate(end.getDate() + 1);
            end.setHours(0);
            end.setMinutes(0);
            end.setSeconds(0);
            end.setMilliseconds(0);
            end = end.getTime();
            option.count = Math.round((end - start) / 86400000);
        } else if (this.config.aggregateBar === 43200) {
            // align start and stop to 1 month
            start = new Date(start);
            start.setDate(1);
            start.setHours(0);
            start.setMinutes(0);
            start.setSeconds(0);
            start.setMilliseconds(0);
            start = start.getTime();
            if (this.config.postProcessing === 'diff') {
                start.setDate(start.getDate() - 30);
            }

            end = new Date(end);
            end.setDate(1);
            end.setHours(0);
            end.setMinutes(0);
            end.setMonth(end.getMonth() + 1);
            end.setSeconds(0);
            end.setMilliseconds(0);
            end = end.getTime();
            option.count = Math.round((end - start) / (86400000 * 30)); // todo it must be variable as every month has different count of days
        }

        option.start = start;
        option.end   = end;
    }

    getStartStop(index, step) {
        let option;
        let end;
        let start;
        let _now;
        this.config.l[index].offset = this.config.l[index].offset || 0;

        const isMonthRange = typeof this.config.range === 'string' && this.config.range.includes('m');

        // check config range
        if (isMonthRange && this.config.l.length > 1) {
            const monthRange = parseInt(this.config.range, 10) || 1;
            for (let a = 0; a < this.config.l.length; a++) {
                if (this.config.l[a].offset && this.config.l[a].offset !== 0) {
                    // Check what the month has first index
                    _now = ChartModel.addTime(this.now, this.config.l[0].offset);
                    const minusMonth = new Date(_now);
                    minusMonth.setMonth(minusMonth.getMonth() - monthRange);
                    this.config.range = Math.floor((_now - minusMonth.getTime()) / 60000).toString();
                    break;
                }
            }
        }

        if (!step) {
            if (this.zoomData) {
                start = this.zoomData.start;
                end   = this.zoomData.end;
            } else if (this.config.timeType === 'static') {
                let startTime;
                let endTime;
                if (this.config.start_time !== undefined) {
                    startTime = this.config.start_time.split(':').map(Number);
                } else {
                    startTime = [0, 0];
                }

                if (this.config.end_time !== undefined) {
                    endTime = this.config.end_time.split(':').map(Number);
                } else {
                    endTime = [24, 0];
                }

                // offset is in seconds
                start = new Date(this.config.start).setHours(startTime[0], startTime[1]);
                end   = new Date(this.config.end).setHours(endTime[0],   endTime[1]);
                start = ChartModel.addTime(start, this.config.l[index].offset);
                end   = ChartModel.addTime(end,   this.config.l[index].offset);
            } else {
                this.config.relativeEnd = this.config.relativeEnd || 'now';

                if (this.config.relativeEnd === 'now') {
                    _now = new Date(this.now);
                } else if (this.config.relativeEnd.includes('minute')) {
                    const minutes = parseInt(this.config.relativeEnd, 10) || 1;
                    _now = new Date(this.now);
                    _now.setMinutes(Math.floor(_now.getMinutes() / minutes) * minutes + minutes);
                    _now.setSeconds(0);
                    _now.setMilliseconds(0);
                }  else if (this.config.relativeEnd.includes('hour')) {
                    const hours = parseInt(this.config.relativeEnd, 10) || 1;
                    _now = new Date(this.now);
                    _now.setHours(Math.floor(_now.getHours() / hours) * hours + hours);
                    _now.setMinutes(0);
                    _now.setSeconds(0);
                    _now.setMilliseconds(0);
                } else if (this.config.relativeEnd === 'today') {
                    _now = new Date(this.now);
                    _now.setDate(_now.getDate() + 1);
                    _now.setHours(0);
                    _now.setMinutes(0);
                    _now.setSeconds(0);
                    _now.setMilliseconds(0);
                } else if (this.config.relativeEnd === 'weekUsa') {
                    // const week = parseInt(config.relativeEnd, 10) || 1;
                    _now = new Date(this.now);
                    _now.setDate(_now.getDate() - _now.getDay() + 7);
                    _now.setHours(0);
                    _now.setMinutes(0);
                    _now.setSeconds(0);
                    _now.setMilliseconds(0);
                } else if (this.config.relativeEnd === 'weekEurope') {
                    // const _week = parseInt(config.relativeEnd, 10) || 1;
                    _now = new Date(this.now);
                    // If
                    if (_now.getDay() === 0) {
                        _now.setDate(_now.getDate() + 1);
                    } else {
                        _now.setDate(_now.getDate() - _now.getDay() + 8);
                    }
                    _now.setHours(0);
                    _now.setMinutes(0);
                    _now.setSeconds(0);
                    _now.setMilliseconds(0);
                } else if (this.config.relativeEnd === 'week2Usa') {
                    // const week = parseInt(config.relativeEnd, 10) || 1;
                    _now = new Date(this.now);
                    _now.setDate(_now.getDate() - _now.getDay() + 7);
                    _now.setDate(_now.getDate() - 7);
                    _now.setHours(0);
                    _now.setMinutes(0);
                    _now.setSeconds(0);
                    _now.setMilliseconds(0);
                } else if (this.config.relativeEnd === 'week2Europe') {
                    // const _week = parseInt(config.relativeEnd, 10) || 1;
                    _now = new Date(this.now);
                    // If
                    if (_now.getDay() === 0) {
                        _now.setDate(_now.getDate() + 1);
                    } else {
                        _now.setDate(_now.getDate() - _now.getDay() + 8);
                    }
                    _now.setDate(_now.getDate() - 7);
                    _now.setHours(0);
                    _now.setMinutes(0);
                    _now.setSeconds(0);
                    _now.setMilliseconds(0);
                } else if (this.config.relativeEnd === 'month') {
                    _now = new Date(this.now);
                    _now.setMonth(_now.getMonth() + 1);
                    _now.setDate(1);
                    _now.setHours(0);
                    _now.setMinutes(0);
                    _now.setSeconds(0);
                    _now.setMilliseconds(0);
                } else if (this.config.relativeEnd === 'year') {
                    _now = new Date(this.now);
                    _now.setFullYear(_now.getFullYear() + 1);
                    _now.setMonth(0);
                    _now.setDate(1);
                    _now.setHours(0);
                    _now.setMinutes(0);
                    _now.setSeconds(0);
                    _now.setMilliseconds(0);
                }

                this.config.range = this.config.range || '30m';

                end   = ChartModel.addTime(_now, this.config.l[index].offset);
                start = ChartModel.addTime(end,  this.config.range, false, true);
            }

            option = {
                start,
                end,
                ignoreNull: this.config.l[index].ignoreNull === undefined ? this.config.ignoreNull : this.config.l[index].ignoreNull,
                aggregate:  this.config.l[index].aggregate || this.config.aggregate || 'minmax',
                from:       false,
                ack:        false,
                q:          false,
                addID:      false,
            };

            if (this.config.l[index].chartType === 'bar') {
                this.increaseRegionForBar(start, end, option);
            } else if (this.config.aggregateType === 'step') {
                option.step = this.config.aggregateSpan * 1000;
            } else if (this.config.aggregateType === 'count') {
                option.count = this.config.aggregateSpan || 300;
            }

            this.config.start = start;
            this.config.end   = end;

            return option;
        }
        if (this.zoomData) {
            start = this.zoomData.start;
            end = this.zoomData.end;
        } else {
            end   = ChartModel.addTime(this.now, this.config.l[index].offset);
            start = end - step;
        }

        option = {
            start,
            end,
            ignoreNull: this.config.l[index].ignoreNull === undefined ? this.config.ignoreNull : this.config.l[index].ignoreNull,
            aggregate:  this.config.l[index].aggregate || this.config.aggregate || 'minmax',
            count:      1,
            from:       false,
            ack:        false,
            q:          false,
            addID:      false,
        };

        this.config.start = ChartModel.addTime(end, this.config.range, false, true);
        this.config.end   = end;

        return option;
    }

    static postProcessing(series, categories, aggregate, postProcessingMethod) {
        for (let i = 0; i < series.length; i++) {
            const interval = series[i];
            if (!interval.length) {
                series[i] = null;
            } else if (interval.length === 1) {
                // sum all values
                series[i] = interval[0];
            } else if (aggregate === 'average') {
                const sum = interval.reduce((a, b) => a + b, 0);
                series[i] = sum / interval.length;
            } else if (aggregate === 'min') {
                let min = interval[0];
                for (let j = 1; j < interval.length; j++) {
                    if (interval[j] < min) {
                        min = interval[j];
                    }
                }
                series[i] = min;
            } else if (aggregate === 'max') {
                let max = interval[0];
                for (let j = 1; j < interval.length; j++) {
                    if (interval[j] > max) {
                        max = interval[j];
                    }
                }
                series[i] = max;
            } else if (aggregate === 'total') {
                series[i] = interval.reduce((a, b) => a + b, 0);
            } else {
                series[i] = interval[interval.length - 1];
            }
        }

        if (postProcessingMethod === 'diff') {
            for (let i = series.length - 1; i > 0; i--) {
                if (series[i - 1] !== null && series[i] !== null) {
                    series[i] -= series[i - 1];
                } else {
                    series[i] = 0;
                }
            }
            series.splice(0, 1);
            categories.splice(0, 1);
        }
        for (let i = 0; i < series.length; i++) {
            console.log(`${categories[i]}: ${series[i]}`);
        }
    }

    processRawData(id, index, values, option) {
        if (!option) {
            option = {
                start: values[0].ts,
                end: values[values.length - 1].ts,
            };

            if (this.config.l[index].chartType === 'bar') {
                this.increaseRegionForBar(option.start, option.end, option);
            }
        }

        option.yOffset = this.config.l[index].yOffset;

        this.seriesData[index] = []; // not really needed
        const _series = this.seriesData[index];
        let barCategories = this.barCategories;

        // fill categories for bars
        if (this.config.l[index].chartType === 'bar') {
            if (!barCategories) {
                barCategories = [];
                this.barCategories = barCategories;
                const start = new Date(option.start);
                while (start.getTime() <= option.end) {
                    barCategories.push(start.getTime());
                    start.setMinutes(start.getMinutes() + this.config.aggregateBar);
                }
            }

            barCategories.forEach(() => _series.push([]));
        }

        let convertFunc;
        if (this.config.l[index].convert) {
            let convert = this.config.l[index].convert;
            if (!convert.includes('return')) {
                convert = `return ${convert}`;
            }
            try {
                // eslint-disable-next-line no-new-func
                convertFunc = new Function('val', convert);
            } catch (e) {
                console.error(`[ChartModel] Cannot parse convert function: ${e}`);
            }
        }

        for (let i = 0; i < values.length; i++) {
            // Convert boolean values to numbers
            if (values[i].val === 'true' || values[i].val === true) {
                values[i].val = 1;
            } else if (values[i].val === 'false' || values[i].val === false) {
                values[i].val = 0;
            } else if (typeof values[i].val === 'string') {
                values[i].val = parseFloat(values[i].val);
            }

            if (this.config.l[index].chartType === 'bar') {
                // find category
                for (let c = 0; c < barCategories.length; c++) {
                    if (barCategories[c] >= values[i].ts && values[i].ts < barCategories[c] + this.config.aggregateBar * 60000) {
                        if (convertFunc) {
                            _series[c].push(values[i].val !== null ? convertFunc(values[i].val + option.yOffset) : null);
                        } else {
                            _series[c].push(values[i].val !== null ? values[i].val + option.yOffset : null);
                        }
                        break;
                    }
                }
            } else {
                let val;
                if (convertFunc) {
                    val = values[i].val !== null ? convertFunc(values[i].val + option.yOffset) : null;
                } else {
                    val = values[i].val !== null ? values[i].val + option.yOffset : null;
                }
                const dp = { value: [values[i].ts, val] };

                // If value was interpolated by backend
                if (values[i].i) {
                    dp.exact = false;
                }
                _series.push(dp);
            }
        }

        // add start and end
        if (this.config.l[index].chartType !== 'bar') {
            let end = option.end;
            // End cannot be in the future
            if (end > this.now) {
                end = this.now;
            }
            if (_series.length) {
                if (_series[0].value[0] > option.start) {
                    _series.unshift({ value: [option.start, null], exact: false });
                }
                const last = _series[_series.length - 1];
                if (last.value[0] < end) {
                    if (this.config.l[index].validTime) {
                        // If the last value is not older than X seconds, assume it is still the same
                        if (end - this.config.l[index].validTime * 1000 <= last.value[0]) {
                            _series.push({ value: [end, last.value[1]], exact: false });
                        } else {
                            _series.push({ value: [end, null], exact: false });
                        }
                    } else {
                        _series.push({ value: [end, null], exact: false });
                    }
                }
            } else {
                _series.push({ value: [option.start, null], exact: false });
                _series.push({ value: [end,   null], exact: false });
            }

            // TODO: May be not required?
            _series.sort((a, b) => (a.value[0] > b.value[0] ? 1 : (a.value[0] < b.value[0] ? -1 : 0)));
        } else {
            ChartModel.postProcessing(_series, barCategories, this.config.l[index].aggregate, this.config.l[index].postProcessing);
        }
    }

    async readOneChart(id, instance, index) {
        if (instance === 'json') {
            const state = await this.socket.getState(id);
            try {
                let values = JSON.parse(state.val);
                if (values.history) {
                    values = values.history;
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
                        } else {
                            if (keys.includes('y')) {
                                values.forEach(v => v.val = v.y);
                            } else if (keys.includes('value')) {
                                values.forEach(v => v.val = v.value);
                            } else if (keys.includes('data')) {
                                values.forEach(v => v.val = v.data);
                            } else if (keys.includes('v')) {
                                values.forEach(v => v.val = v.v);
                            }

                            if (keys.includes('t')) {
                                values.forEach(v => v.ts = v.t);
                            } else if (keys.includes('time')) {
                                values.forEach(v => v.ts = v.time);
                            } else if (keys.includes('date')) {
                                values.forEach(v => v.ts = v.date);
                            }
                        }
                    }

                    // convert ts to number
                    if (values[0].ts) {
                        // eslint-disable-next-line no-restricted-properties
                        if (typeof values[0].ts === 'string' && window.isFinite(values[0].ts)) {
                            values.forEach(v => v.ts = parseInt(v.ts, 10));
                        } else if (typeof values[0].ts === 'string' && new Date(values[0].ts).toString() !== 'Invalid Date') {
                            values.forEach(v => v.ts = new Date(v.ts).getTime());
                        }
                        // no else
                        if (typeof values[0].ts === 'number' && values[0].ts < 946681200000) { // new Date(2000,0,1).getTime() === 946681200000
                            values.forEach(v => v.ts *= 1000);
                        }
                    }
                }

                values.sort((a, b) => (a.ts - b.ts ? -1 : (a.ts < b.ts ? 1 : 0)));

                this.processRawData(id, index, values);
            } catch (e) {
                console.error(`[ChartModel] Cannot parse values in JSON: ${e}`);
            }

            if (!this.serverSide && !this.subscribes.includes(id)) {
                this.subscribes.push(id);
                this.subscribed = true;
                this.socket.subscribeState(id, this.onStateChange);
            }
        } else {
            const option = this.getStartStop(index);
            option.instance  = instance;
            option.sessionId = this.sessionId;

            // console.log(JSON.stringify(option));
            this.debug && console.log(`[ChartModel] ${new Date(option.start)} - ${new Date(option.end)}`);

            try {
                const res = await this.socket.getHistoryEx(id, option);
                if (this.sessionId && res.sessionId && res.sessionId !== this.sessionId) {
                    console.warn(`[ChartModel] Ignore request with sessionId=${res.sessionId}, actual is ${this.sessionId}`);
                    return;
                }

                if (res && res.values) {
                    // option.ignoreNull = (config.l[index].ignoreNull === undefined) ? (config.ignoreNull === 'true' || config.ignoreNull === true) : (config.l[index].ignoreNull === 'true' || config.l[index].ignoreNull === true);
                    this.processRawData(id, index, res.values, option);

                    // free memory
                    res.values = null;
                }
            } catch (err) {
                err === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(err);
                err && console.error(`[ChartModel] ${err}`);
            }

            if (this.config.legActual && this.config.l[index].chartType !== 'bar') {
                // read current value
                try {
                    const state = await this.socket.getState(id);
                    this.actualValues[index] = state && (state.val || state.val === 0 || state.val === false) ? state.val : null;
                } catch (e) {
                    console.warn(`Cannot read last value of "${id}": ${e}`);
                    this.actualValues[index] = null;
                }

                if (!this.serverSide && !this.subscribes.includes(id)) {
                    this.subscribes.push(id);
                    this.subscribed = true;
                    this.socket.subscribeState(id, this.onStateChange);
                }
            }
        }
    }

    async readOneRawChart(id, instance, start, end) {
        if (instance === 'json') {
            const state = await this.socket.getState(id);
            try {
                let values = JSON.parse(state.val);
                if (values.history) {
                    values = values.history;
                }

                // convert alternative names to {ts, val}. Possible names for ts: t, time. Possible names for val: y, value
                if (values[0]) {
                    const keys = Object.keys(values[0]);
                    if (!keys.includes('val') || !keys.includes('ts')) {
                        // If format is [{t: 123, y: 1}, {t: 124, y: 2}] (e.g. from pvsolar
                        if (keys.includes('y') && keys.includes('t')) {
                            values = values.map(v => ({ ts: v.t, val: v.y }));
                        } else {
                            if (keys.includes('y')) {
                                values.forEach(v => v.val = v.y);
                            } else if (keys.includes('value')) {
                                values.forEach(v => v.val = v.value);
                            } else if (keys.includes('data')) {
                                values.forEach(v => v.val = v.data);
                            } else if (keys.includes('v')) {
                                values.forEach(v => v.val = v.v);
                            }

                            if (keys.includes('t')) {
                                values.forEach(v => v.ts = v.t);
                            } else if (keys.includes('time')) {
                                values.forEach(v => v.ts = v.time);
                            } else if (keys.includes('date')) {
                                values.forEach(v => v.ts = v.date);
                            }
                        }
                    }

                    // convert ts to number
                    if (values[0].ts) {
                        // eslint-disable-next-line no-restricted-properties
                        if (typeof values[0].ts === 'string' && window.isFinite(values[0].ts)) {
                            values = values.forEach(v => v.ts = parseInt(v.ts, 10));
                        } else if (typeof values[0].ts === 'string' && new Date(values[0].ts).toString() !== 'Invalid Date') {
                            values = values.forEach(v => v.ts = new Date(v.ts).getTime());
                        }
                        // no else
                        if (typeof values[0].ts === 'number' && values[0].ts < 946681200000) { // new Date(2000,0,1).getTime() === 946681200000
                            values = values.forEach(v => v.ts *= 1000);
                        }
                    }
                }

                if (!Array.isArray(values)) {
                    values = [];
                    console.warn('JSON is not an array');
                }
                values.sort((a, b) => (a.ts - b.ts ? -1 : (a.ts < b.ts ? 1 : 0)));

                return values;
            } catch (e) {
                console.error(`[ChartModel] Cannot parse values in JSON: ${e}`);
            }
        } else {
            const option = {
                start,
                end,
                ignoreNull: false,
                aggregate:  'none',
                count:      2000,
                from:       false,
                ack:        false,
                q:          false,
                addID:      false,
            };

            option.instance  = instance;
            option.sessionId = this.sessionId;

            this.debug && console.log(`[ChartModel] ${new Date(option.start)} - ${new Date(option.end)}`);

            try {
                const res = await this.socket.getHistoryEx(id, option);
                if (this.sessionId && res.sessionId && res.sessionId !== this.sessionId) {
                    console.warn(`[ChartModel] Ignore request with sessionId=${res.sessionId}, actual is ${this.sessionId}`);
                    return null;
                }

                return res?.values;
            } catch (err) {
                err === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(err);
                err && console.error(`[ChartModel] ${err}`);
            }
        }

        return null;
    }

    _readObject(id) {
        if (!this.objectPromises[id]) {
            this.objectPromises[id] = this.socket.getObject(id)
                .catch(e => {
                    e === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(e);
                    console.error(`Cannot read "${id}": ${e}`);
                    return null;
                });
        }

        return this.objectPromises[id];
    }

    async _readOneLine(index) {
        try {
            const obj = await this._readObject(this.config.l[index].id);

            if (obj?.common) {
                this.config.l[index].name = this.config.l[index].name || obj.common.name;
                this.config.l[index].unit = this.config.l[index].unit || (obj.common.unit ? obj.common.unit.replace('�', '°') : '');
                this.config.l[index].type = obj.common.type;
                if (this.config.l[index].chartType === 'auto') {
                    this.config.l[index].chartType = obj.common.type === 'boolean' ? 'steps' : 'line';
                    this.config.l[index].aggregate = obj.common.type === 'boolean' ? 'onchange' : 'minmax';
                }

                // ignore unit if true/false text set
                if (this.config.l[index].unit && (this.config.l[index].falseText || this.config.l[index].trueText)) {
                    delete this.config.l[index].unit;
                }

                // remember enum states
                if (obj.common.states &&
                    !Array.isArray(obj.common.states) &&
                    this.config.l[index].states !== false &&
                    !obj.common.unit
                ) {
                    if (this.config.l[index].states) {
                        this.config.l[index].states = Object.assign(obj.common.states, this.config.l[index].states);
                    } else {
                        this.config.l[index].states = obj.common.states;
                    }

                    // if the states have true, false as text => convert it to 1, 0
                    if (Object.keys(this.config.l[index].states).find(key => key === 'true' || key === 'false')) {
                        const states = {};
                        Object.keys(this.config.l[index].states).forEach(key => {
                            states[key === 'true' ? 1 : (key === 'false' ? 0 : key)] = this.config.l[index].states[key];
                        });
                        this.config.l[index].states = states;
                    }

                    // ignore unit for enums text set
                    if (this.config.l[index].unit && this.config.l[index].states) {
                        delete this.config.l[index].unit;
                    }
                }

                // set YAxis to 'off' if commonYAxis is set
                if (this.config.l[index].commonYAxis || this.config.l[index].commonYAxis === 0) {
                    this.config.l[index].yaxe = 'off';
                }
            }
        } catch (e) {
            e === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(e);
            console.error(`[ChartModel] Cannot read object ${this.config.l[index].id}: ${e}`);
        }

        this.config.l[index].name = this.config.l[index].name || this.config.l[index].id;
        this.config.l[index].unit = this.config.l[index].unit || '';
        if (this.config.l[index].chartType === 'auto') {
            this.config.l[index].chartType = 'line';
            this.config.l[index].aggregate = 'minmax';
        }
        if (typeof this.config.l[index].name === 'object') {
            this.config.l[index].name = this.config.l[index].name[this.systemConfig.language] || this.config.l[index].name.en;
        }

        await this.readOneChart(this.config.l[index].id, this.config.l[index].instance || this.defaultHistory, index);
    }

    async _readData() {
        for (let j = 0; j < this.config.l.length; j++) {
            if (this.config.l[j] !== '' && this.config.l[j] !== undefined) {
                this.seriesData.push([]);
            }
            if (this.config.l[j] && this.config.l[j].id) {
                await this._readOneLine(j);
            }
        }
    }

    async readTicks() {
        if (this.config.ticks) {
            const index = 0;
            const option = JSON.parse(JSON.stringify(this.getStartStop(index)));
            option.instance  = this.config.l[index].instance || this.defaultHistory;
            option.sessionId = this.sessionId;
            option.aggregate = 'onchange';

            this.debug && console.log(`[ChartModel] Ticks: ${new Date(option.start)} - ${new Date(option.end)}`);

            try {
                const res = await this.socket.getHistoryEx(this.config.ticks, option);
                if (this.sessionId && res.sessionId && res.sessionId !== this.sessionId) {
                    console.warn(`[ChartModel] Ignore request with sessionId=${res.sessionId}, actual is ${this.sessionId}`);
                    return;
                }

                const _series = this.ticks || [];
                if (res && res.values) {
                    if (this.ticks && this.ticks.length) {
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
                        if (_series[0][0] > option.start) {
                            _series.unshift({ value: [option.start, ''] });
                        }
                        if (_series[_series.length - 1][0] < option.end) {
                            _series.push({ value: [option.end, ''] });
                        }
                    } else {
                        _series.push({ value: [option.start, ''] });
                        _series.push({ value: [option.end, ''] });
                    }
                    // free memory
                    res.values = null;
                }

                this.ticks = _series;
            } catch (e) {
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
            if ((mark.upperValueOrId || mark.upperValueOrId === 0) &&
                parseFloat(mark.upperValueOrId).toString() !== mark.upperValueOrId.toString().replace(/\.0*$/, '') &&
                mark.upperValueOrId.toString().includes('.')
            ) {
                /* if (!this.subscribes.includes(mark.upperValueOrId)) {
                        this.subscribes.push(mark.upperValueOrId);
                    } */
                try {
                    const state = await this.socket.getState(mark.upperValueOrId);
                    if (state && state.val !== undefined && state.val !== null) {
                        mark.upperValue = parseFloat(state.val) || 0;
                    } else {
                        mark.upperValue = null;
                    }
                } catch (e) {
                    e === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(e);
                    console.error(`Cannot read marking ${mark.upperValueOrId}: ${e}`);
                }
            }

            // process lower ID
            if ((mark.lowerValueOrId || mark.lowerValueOrId === 0) &&
                parseFloat(mark.lowerValueOrId).toString() !== mark.lowerValueOrId.replace(/\.0*$/, '') &&
                mark.lowerValueOrId.includes('.')
            ) {
                /* if (!this.subscribes.includes(mark.upperValueOrId)) {
                        this.subscribes.push(mark.upperValueOrId);
                    } */
                try {
                    const state = await this.socket.getState(mark.lowerValueOrId);
                    if (state && state.val !== undefined && state.val !== null) {
                        mark.lowerValue = parseFloat(state.val) || 0;
                    } else {
                        mark.lowerValue = null;
                    }
                } catch (e) {
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
                } catch (e) {
                    e === NOT_CONNECTED && this.onErrorFunc && this.onErrorFunc(e);
                    console.error(`Cannot subscribe ${subscribes[s]}: ${e}`);
                }
            }
        }
    }

    onStateChange = (id, state) => {
        if (!id || !state || this.reading) {
            return;
        }

        this.debug && console.log(`State update ${id} - ${state.val}`);

        let changed = false;
        for (let m = 0; m < this.config.l.length; m++) {
            if (this.config.l[m].id === id) {
                // by update from json => update always all values
                if (this.config.l[m].instance === 'json') {
                    try {
                        let data = JSON.parse(state.val);
                        if (data.history) {
                            data = data.history;
                        }

                        if (!Array.isArray(data)) {
                            data = [];
                            console.warn('JSON is not an array');
                        }
                        data.sort((a, b) => (a.ts - b.ts ? -1 : (a.ts < b.ts ? 1 : 0)));
                        this.processRawData(id, m, data);
                        // take last value as actual value
                        if (this.actualValues) {
                            this.actualValues[m] = data[data.length - 1].val;
                        }
                        this.onUpdateFunc(this.seriesData, this.actualValues, this.barCategories);
                    } catch (e) {
                        console.error(`Cannot parse JSON: ${e}`);
                    }

                    return;
                }

                if (this.actualValues && this.actualValues[m] !== state.val) {
                    this.actualValues[m] = state.val;
                    changed = true;
                }
                break;
            }
        }
        changed && this.onUpdateFunc(null, this.actualValues);
    };

    static addTime(time, offset, plusOrMinus, isOffsetInMinutes) {
        time = new Date(time);

        if (typeof offset === 'string') {
            if (offset[1] === 'm' || offset[2] === 'm') {
                offset = parseInt(offset, 10);
                time.setMonth(plusOrMinus ? time.getMonth() + offset : time.getMonth() - offset);
                time = time.getTime();
            } else if (offset[1] === 'y' || offset[2] === 'y') {
                offset = parseInt(offset, 10);
                time.setFullYear(plusOrMinus ? time.getFullYear() + offset : time.getFullYear() - offset);
                time = time.getTime();
            } else {
                time  = time.getTime();
                if (isOffsetInMinutes) {
                    if (plusOrMinus) {
                        time += (parseInt(offset, 10) || 0) * 60000;
                    } else {
                        time -= (parseInt(offset, 10) || 0) * 60000;
                    }
                } else if (plusOrMinus) {
                    time += (parseInt(offset, 10) || 0) * 1000;
                } else {
                    time -= (parseInt(offset, 10) || 0) * 1000;
                }
            }
        } else {
            time  = time.getTime();
            if (isOffsetInMinutes) {
                if (plusOrMinus) {
                    time += (parseInt(offset, 10) || 0) * 60000;
                } else {
                    time -= (parseInt(offset, 10) || 0) * 60000;
                }
            } else if (plusOrMinus) {
                time += (parseInt(offset, 10) || 0) * 1000;
            } else {
                time -= (parseInt(offset, 10) || 0) * 1000;
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
            let _from = data && data.length ? data[data.length - 1].ts + 1 : 0;
            let values = data;
            while (values && values.length === 2000) {
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
        console.log(`Read till ${new Date(this.now)}`);
        this.sessionId = this.sessionId || 0;
        this.sessionId++;
        if (this.sessionId > 0xFFFFFF) {
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
            this.barCategories = null;

            await this._readData();
            // use units from common axis
            for (let i = 0; i < this.config.l.length; i++) {
                if (this.config.l[i].commonYAxis || this.config.l[i].commonYAxis === 0) {
                    this.config.l[i].units = this.config.l[this.config.l[i].commonYAxis].units;
                }
            }

            await this.readTicks();
            await this.readMarkings();
            /* if (!this.subscribed) {
                this.subscribed = true;
                await this.subscribeAll(this.subscribes));
            } */
            this.reading = false;
            this.onUpdateFunc(this.seriesData, this.actualValues, this.barCategories);
        } else {
            this.onErrorFunc && this.onErrorFunc('No config provided');
            this.onReadingFunc && this.onReadingFunc(false);
            this.reading = false;
        }
    }
}

export default ChartModel;
