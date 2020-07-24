import Utils from '@iobroker/adapter-react/Components/Utils';

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

function normalizeConfig(config) {
    if (config.lines) {
        config.l = JSON.parse(JSON.stringify(config.lines));
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
                unit:       units[i]   || ''
            });
        }
        config.aggregateType = 'step';
        config.aggregateSpan = 300;
        config.relativeEnd   = 'now';
    }

    // convert art to aggregate
    if (config.l) {
        for (let j = 0; j < config.l.length; j++) {
            if (config.l[j].art) {
                config.l[j].aggregate = config.l[j].art;
                delete config.l[j].art;
            }
            if (config.instance && !config.l[j].instance) {
                config.l[j].instance = config.instance;
            }
        }
    }

    // Set default values
    config.width        = config.width  || '100%';
    config.height       = config.height || '100%';
    config.timeFormat   = config.timeFormat || '%H:%M:%S %e.%m.%y';
    config.useComma     = config.useComma  === 'true' || config.useComma  === true;
    config.zoom         = config.zoom      === 'true' || config.zoom      === true;
    config.animation    = parseInt(config.animation)  || 0;
    config.noedit       = config.noedit    === 'true' || config.noedit    === true;
    config.afterComma   = config.afterComma === undefined ? 2 : parseInt(config.afterComma, 10);
    config.timeType     = config.timeArt || config.timeType || 'relative';
    return config;
}

class ChartModel {
    constructor(socket, config) {
        if (!config) {
            const query = Utils.parseQuery(window.location.search); // Utils.parseQuery

            if (query.preset) {
                this.preset = query.preset;
            } else {
                // search ID and range
                const config = deParam((window.location.search || '').toString().replace(/^\?/, ''));
                this.config = normalizeConfig(config);
            }
        } else {
            if (typeof config === 'string') {
                this.preset = config;
            } else {
                this.config = config;
            }
        }

        this.socket = socket;

        this.seriesData      = [];
        this.ticks           = null;
        this.liveInterval    = null;

        this.navOptions      = {};

        this.subscribes      = [];
        this.subscribed      = false;
        this.sessionId       = 1;

        this.onUpdateFunc    = null;
        this.onReadingFunc   = null;
        this.onErrorFunc     = null;

        if (this.preset) {
            this.socket.getObject(this.preset)
                .then(obj => {
                    this.config = normalizeConfig(obj.native.data);
                    this.readData();
                    this.socket.subscribeObject(this.preset, this.onPresetUpdate);
                });
        } else {
            this.readData();
        }
    }

    onPresetUpdate = (id, obj) => {
        this.config = normalizeConfig(obj.native.data);

        // just copy data to force update
        this.seriesData = JSON.parse(JSON.stringify(this.seriesData));
        this.onUpdateFunc && this.onUpdateFunc(this.seriesData);
    };

    destroy() {
        if (this.subscribed) {
            this.subscribes.forEach(id => this.socket.unsubscribeState(id, this.onStateChange));
            this.subscribes = [];
            this.subscribed = null;
        }
        if (this.preset) {
            this.socket.unsubscribeObject(this.preset, this.onPresetUpdate);
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

    getStartStop(index, step) {
        let option = {};
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
                    _now = this.addTime(this.now, this.config.l[0].offset);
                    const minusMonth = new Date(_now);
                    minusMonth.setMonth(minusMonth.getMonth() - monthRange);
                    this.config.range = Math.floor((_now - minusMonth.getTime()) / 60000) + '';
                    break;
                }
            }
        }

        if (this.config.zoomed) {
            this.navOptions[index].end   = this.config.l[index].zMax;
            this.navOptions[index].start = this.config.l[index].zMin;
            return this.navOptions[index];
        } else {
            if (!step) {
                if (this.config.timeType === 'static') {
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
                    start = this.addTime(start, this.config.l[index].offset);
                    end   = this.addTime(end,   this.config.l[index].offset);
                } else {
                    if (this.config.relativeEnd === 'now') {
                        _now = new Date(this.now);
                    } else if (this.config.relativeEnd.indexOf('minute') !== -1) {
                        const minutes = parseInt(this.config.relativeEnd, 10) || 1;
                        _now = new Date(this.now);
                        _now.setMinutes(Math.floor(_now.getMinutes() / minutes) * minutes + minutes);
                        _now.setSeconds(0);
                        _now.setMilliseconds(0);
                    }  else if (this.config.relativeEnd.indexOf('hour') !== -1) {
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
                        //const week = parseInt(config.relativeEnd, 10) || 1;
                        _now = new Date(this.now);
                        _now.setDate(_now.getDate() - _now.getDay() + 7);
                        _now.setHours(0);
                        _now.setMinutes(0);
                        _now.setSeconds(0);
                        _now.setMilliseconds(0);
                    } else if (this.config.relativeEnd === 'weekEurope') {
                        //const _week = parseInt(config.relativeEnd, 10) || 1;
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

                    end   = this.addTime(_now, this.config.l[index].offset);
                    start = this.addTime(end,  this.config.range, false, true);
                }

                option = {
                    start:      start,
                    end:        end,
                    ignoreNull: this.config.l[index].ignoreNull === undefined ? this.config.ignoreNull : this.config.l[index].ignoreNull,
                    aggregate:  this.config.l[index].aggregate || this.config.aggregate || 'minmax',
                    from:       false,
                    ack:        false,
                    q:          false,
                    addID:      false,

                };

                if (this.config.aggregateType === 'step') {
                    option.step = this.config.aggregateSpan * 1000;
                } else if (this.config.aggregateType === 'count') {
                    option.count = this.config.aggregateSpan || (this.chartRef.current.clientWidth / 10);
                }

                this.navOptions[index] = option;
                return option;
            } else {
                end   = this.addTime(this.now, this.config.l[index].offset);
                start = end - step;

                option = {
                    start:      start,
                    end:        end,
                    ignoreNull: this.config.l[index].ignoreNull === undefined ? this.config.ignoreNull : this.config.l[index].ignoreNull,
                    aggregate:  this.config.l[index].aggregate || this.config.aggregate || 'minmax',
                    count:      1,
                    from:       false,
                    ack:        false,
                    q:          false,
                    addID:      false,
                };

                this.navOptions[index].end   = end;
                this.navOptions[index].start = this.addTime(end, this.config.range, false, true);
                return option;
            }
        }
    }

    readOneChart(id, instance, index, cb) {
        const option = this.getStartStop(index);
        option.instance  = instance;
        option.sessionId = this.sessionId;
        this.config.l[index].yOffset = parseFloat(this.config.l[index].yOffset) || 0;

        //console.log(JSON.stringify(option));
        console.log(new Date(option.start) + ' - ' + new Date(option.end));

        this.socket.getHistoryEx(id, option)
            .then(res => {
                if (this.sessionId && res.sessionId && res.sessionId !== this.sessionId) {
                    return console.warn(`Ignore request with sessionId=${res.sessionId}, actual is ${this.sessionId}`);
                }

                if (res && res.values) {
                    //option.ignoreNull = (config.l[index].ignoreNull === undefined) ? (config.ignoreNull === 'true' || config.ignoreNull === true) : (config.l[index].ignoreNull === 'true' || config.l[index].ignoreNull === true);
                    option.yOffset = this.config.l[index].yOffset;
                    const values = res.values;

                    const _series = this.seriesData[index];

                    for (let i = 0; i < values.length; i++) {
                        // if less 2000.01.01 00:00:00
                        //if (values[i].ts < 946681200000) {
                        //    values[i].ts = values[i].ts * 1000;
                        //}

                        // Convert boolean values to numbers
                        if (values[i].val === 'true' || values[i].val === true) {
                            values[i].val = 1;
                        } else if (values[i].val === 'false' || values[i].val === false) {
                            values[i].val = 0;
                        }
                        if (typeof values[i].val === 'string') {
                            values[i].val = parseFloat(values[i].val);
                        }

                        _series.push({value: [values[i].ts, values[i].val !== null ? values[i].val + option.yOffset : null]});
                    }

                    // add start and end
                    if (_series.length) {
                        if (_series[0][0] > option.start) {
                            _series.unshift({value: [option.start, null]});
                        }
                        if (_series[_series.length - 1][0] < option.end) {
                            _series.push({value: [option.end, null]});
                        }
                    } else {
                        _series.push({value: [option.start, null]});
                        _series.push({value: [option.end,   null]});
                    }

                    // free memory
                    res.values = null;
                    res = null;
                }

                return Promise.resolve();
            })
            .catch(err => err && console.error(err))
            .then(() => cb(id, index))
    }

    _readOneLine(index, cb) {
        return this.socket.getObject(this.config.l[index].id)
            .then(obj => {
                if (obj && obj.common) {
                    this.config.l[index].name = this.config.l[index].name || obj.common.name;
                    this.config.l[index].unit = this.config.l[index].unit || (obj.common.unit ? obj.common.unit.replace('�', '°') : '');
                    this.config.l[index].type = obj.common.type;
                } else {
                    this.config.l[index].name = this.config.l[index].name || this.config.l[index].id;
                    this.config.l[index].unit = this.config.l[index].unit || '';
                }
                return Promise.resolve();
            })
            .catch(e => {
                console.error(`Cannot read object ${this.config.l[index].id}: ${e}`);
                this.config.l[index].name = this.config.l[index].name || this.config.l[index].id;
                this.config.l[index].unit = this.config.l[index].unit || '';
                return Promise.resolve();
            })
            .then(() => {
                if (typeof this.config.l[index].name === 'object') {
                    this.config.l[index].name = this.config.l[index].name[this.state.systemConfig.language] || this.config.l[index].name.en;
                }
                this.readOneChart(this.config.l[index].id, this.config.l[index].instance, index, cb);
            });
    }

    _readData(cb, j) {
        j = j || 0;
        if (j >= this.config.l.length) {
            return cb();
        } else {
            if (this.config.l[j] !== '' && this.config.l[j] !== undefined) {
                this.seriesData.push([]);
            }

            this._readOneLine(j, () =>
                setTimeout(() => this._readData(cb, j + 1), 10));
        }
    }

    readTicks(cb) {
        if (!this.config.ticks) {
            cb(null);
        } else {
            const index = 0;
            const option = JSON.parse(JSON.stringify(this.getStartStop(index)));
            option.instance  = this.config.l[index].instance;
            option.sessionId = this.sessionId;
            option.aggregate = 'onchange';

            console.log('Ticks: ' + new Date(option.start) + ' - ' + new Date(option.end));

            this.socket.getHistoryEx(this.config.ticks, option)
                .then(res => {
                    if (this.sessionId && res.sessionId && res.sessionId !== this.sessionId) {
                        return console.warn(`Ignore request with sessionId=${res.sessionId}, actual is ${this.sessionId}`);
                    }

                    if (res && res.values) {
                        const _series = this.ticks || [];
                        if (this.ticks && this.ticks.length) {
                            this.ticks.splice(0, this.ticks.length);
                        }

                        const values = res.values;

                        for (let i = 0; i < values.length; i++) {
                            // if less 2000.01.01 00:00:00
                            //if (values[i].ts < 946681200000) {
                            //    values[i].ts = values[i].ts * 1000;
                            //}

                            if (values[i].val !== null) {
                                _series.push({value: [values[i].ts, values[i].val]});
                            }
                        }

                        // add start and end
                        if (_series.length) {
                            if (_series[0][0] > option.start) {
                                _series.unshift({value: [option.start, '']});
                            }
                            if (_series[_series.length - 1][0] < option.end) {
                                _series.push({value: [option.end, '']});
                            }
                        } else {
                            _series.push({value: [option.start, '']});
                            _series.push({value: [option.end,   '']});
                        }
                        // free memory
                        res.values = null;
                        res = null;

                        this.ticks = _series;
                    }
                    return Promise.resolve();
                })
                .catch(e => console.error(e))
                .then(() => cb && cb(this.ticks));
        }
    }

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
                console.error(e);
                cb(index, 0);
            });
    }

    readMarkings(cb, m) {
        m = m || 0;
        if (!this.config.m || !this.config.m.length || m >= this.config.m.length) {
            return cb();
        } else {
            if (!this.config.m[m].oid && this.config.m[m].v && parseFloat(this.config.m[m].v).toString() !== this.config.m[m].v && this.config.m[m].v.includes('.')) {
                if (!this.subscribes.includes(this.config.m[m].v)) {
                    this.subscribes.push(this.config.m[m].v);
                }

                this.readValue(this.config.m[m].v, m, (index, val) => {
                    this.config.m[index].oid = this.config.m[index].v;
                    this.config.m[index].v   = val;

                    if (!this.config.m[m].oidl && this.config.m[m].vl && parseFloat(this.config.m[m].vl).toString() !== this.config.m[m].vl && this.config.m[m].vl.includes('.')) {
                        if (!this.subscribes.includes(this.config.m[m].vl)) {
                            this.subscribes.push(this.config.m[m].vl);
                        }

                        this.readValue(this.config.m[m].vl, m, (index, val) => {
                            this.config.m[index].oidl = this.config.m[index].vl;
                            this.config.m[index].vl   = val;
                            setTimeout(() => this.readMarkings(cb, m + 1), 0);
                        });
                    } else {
                        setTimeout(() => this.readMarkings(cb, m + 1), 0);
                    }
                });
            } else
            if (!this.config.m[m].oidl && this.config.m[m].vl && parseFloat(this.config.m[m].vl).toString() !== this.config.m[m].vl && this.config.m[m].vl.includes('.')) {
                if (!this.subscribes.includes(this.config.m[m].vl)) {
                    this.subscribes.push(this.config.m[m].vl);
                }
                this.readValue(this.config.m[m].vl, m, (index, val) => {
                    this.config.m[index].oidl = this.config.m[index].vl;
                    this.config.m[index].vl   = val;
                    setTimeout(() => this.readMarkings(cb, m + 1), 0);
                });
            } else {
                setTimeout(() => this.readMarkings(cb, m + 1), 0);
            }
        }
    }

    subscribeAll(subscribes, cb, s) {
        s = s || 0;

        if (!subscribes || !subscribes.length || s >= subscribes.length) {
            cb();
        } else {
            this.socket.subscribeState(subscribes[s], this.onStateChange);
            setTimeout(() => this.subscribeAll(subscribes, cb, s + 1), 0);
        }
    }

    onStateChange = (id, state) => {
        if (!this.state.seriesData || !this.config || !this.config.m) {
            return;
        }

        console.log('State update ' + id + ' - ' + state.val);

        for (let m = 0; m < this.config.m.length; m++) {
            if (this.config.m[m].oid === id) {
                this.config.m[m].v = parseFloat(state.val) || 0;
            }
            if (this.config.m[m].oidl === id) {
                this.config.m[m].vl = parseFloat(state.val) || 0;
            }
        }
        //chart.update(null, ;config.m);
    };

    addTime(time, offset, plusOrMinus, isOffsetInMinutes) {
        time = new Date(time);

        if (typeof offset === 'string') {
            if (offset[1] === 'm') {
                offset = parseInt(offset, 10);
                time.setMonth(plusOrMinus ? time.getMonth() + offset : time.getMonth() - offset);
                time = time.getTime();
            } else if (offset[1] === 'y') {
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

                } else {
                    if (plusOrMinus) {
                        time += (parseInt(offset, 10) || 0) * 1000;
                    } else {
                        time -= (parseInt(offset, 10) || 0) * 1000;
                    }
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

            } else {
                if (plusOrMinus) {
                    time += (parseInt(offset, 10) || 0) * 1000;
                } else {
                    time -= (parseInt(offset, 10) || 0) * 1000;
                }
            }
        }
        return time;
    }

    readData() {
        this.now = Date.now();
        this.sessionId = this.sessionId || 0;
        this.sessionId++;
        if (this.sessionId > 0xFFFFFF) {
            this.sessionId = 1;
        }

        if (this.config.l) {
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
            this._readData(() =>
                this.readTicks(_ticks =>
                    this.readMarkings(() => {
                        if (!this.subscribed) {
                            this.subscribed = true;
                            this.subscribeAll(this.subscribes, () =>
                                this.onUpdateFunc(this.seriesData));
                        } else {
                            this.onUpdateFunc(this.seriesData);
                        }
                    })));
        } else {
            this.onErrorFunc && this.onErrorFunc('No config provided');
            this.onReadingFunc && this.onReadingFunc(false);
        }
    }
}

export default ChartModel;