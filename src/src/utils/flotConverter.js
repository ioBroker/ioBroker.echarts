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
        config.l = config.lines;
        delete config.lines;
    }

    // BF (2020.11.27): it is very old and can be deleted
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

    // convert art to aggregate (from flot)
    if (config.l) {
        for (let j = 0; j < config.l.length; j++) {
            // BF (2020.11.27): it is very old and can be deleted
            if (config.l[j].art) {
                config.l[j].aggregate = config.l[j].art;
                delete config.l[j].art;
            }
            if (config.instance && !config.l[j].instance) {
                config.l[j].instance = config.instance || '';
            }
            config.l[j].yOffset   = parseFloat(config.l[j].yOffset)   || 0;
            config.l[j].offset    = parseFloat(config.l[j].offset)    || 0;
            config.l[j].validTime = parseFloat(config.l[j].validTime) || 0;
        }
    }

    config.l = config.l || [];

    // convert marks
    if (config.m) {
        config.marks = [];
        for (let j = 0; j < config.m.length; j++) {
            config.marks[j] = {
                lineId:         parseInt(config.m[j].l, 10).toString(),
                upperValueOrId: config.m[j].v,
                lowerValueOrId: config.m[j].vl,
                color:          config.m[j].c,
                fill:           parseFloat(config.m[j].f) || 0.2,
                ol:             parseInt(config.m[j].t, 10) || 1,
                os:             parseInt(config.m[j].s, 10) || 0,
                text:           config.m[j].d,
                textPosition:   config.m[j].p,
                textOffset:     parseFloat(config.m[j].py) || 0,
                textColor:      config.m[j].fc || '',
                textSize:       parseInt(config.m[j].fs, 10) || undefined,
            };
        }
        delete config.m;
    }

    config.marks = config.marks || [];

    if (!config.l.length) {
        config.l.push({id: '', unit: ''});
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

async function _readFlotSettings(socket) {
    const objs =  this.props.socket.getObjectViewSystem('chart', 'flot.', 'flot.\u9999');
    return Object.values(objs);
}

function _executeWriteTasks(socket, tasks, _resolve) {
    if (!_resolve) {
        return new Promise(resolve => _executeWriteTasks(socket, tasks, resolve));
    } else if (!tasks || !tasks.length) {
        _resolve();
    } else {
        const obj = tasks.shift();
        if (obj) {
            socket.getObject(obj._id)
                .catch(() => null)
                .then(exists => {
                    if (!exists) {
                        socket.setObject(obj._id, obj)
                            .then(() => setTimeout(() => _executeWriteTasks(socket, tasks, _resolve), 50));
                    } else {
                        console.log(`Object ${obj._id} already exists and will not be converted`);
                        setTimeout(() => _executeWriteTasks(socket, tasks, _resolve), 50);
                    }
                });
        } else {
            setTimeout(() => _executeWriteTasks(socket, tasks, _resolve), 50);
        }
    }
}

function _flot2echarts(flotObj, instance) {
    // convert name
    const echartsObj = {
        _id: flotObj._id.replace(/^flot.\d+/, 'echarts.' + instance),
        common: {
            name: flotObj.common.name,
            expert: true,
        },
        native: {

        },
        type: 'chart',
    };

    if (echartsObj._id.endsWith('.')) {
        echartsObj._id = 'empty_' + Math.round(Math.random() * 10000);
    }

    /*
    {
          "l": [
            {
              "id": "javascript.0.dimmer",
              "offset": "0",
              "aggregate": "minmax",
              "color": "#FF0000",
              "thickness": "3",
              "shadowsize": "3",
              "fill": "0.9"
            }
          ],
          "timeType": "relative",
          "relativeEnd": "now",
          "range": "10",
          "aggregateType": "count",
          "aggregateSpan": "300",
          "hoverDetail": "false",
          "useComma": "false",
          "zoom": "false",
          "noedit": "false",
          "animation": "0",
          "m": [
            {
              "l": "0",
              "v": "0",
              "f": "false",
              "c": "#FF0000",
              "t": "3",
              "s": "3",
              "d": "",
              "p": "l",
              "py": "0",
              "fc": "#FF0000",
              "fs": "",
              "vl": "100"
            },
            {
              "l": "0",
              "v": "0",
              "f": "false",
              "c": "#00FF00",
              "t": "3",
              "s": "3",
              "d": "",
              "p": "l",
              "py": "0",
              "fc": "#00FF00",
              "fs": "",
              "vl": "50"
            }
          ]
        }
     */

    const data = normalizeConfig(deParam(flotObj.native.url));

    if (!data.lines) {
        data.lines = data.l;
        delete data.l;
    }

    echartsObj.native.data = data;

    console.log(`Convert ${flotObj._id} => ${echartsObj._id}`);
    return echartsObj;
}

function flotConverter(socket, instance) {
    instance = instance || 0;

    let instanceObj;

    return socket.getObject(`system.adapter.echarts.${instance}`)
        .then(obj => {
            instanceObj = obj;
            if (obj && obj.native && !obj.native.convertDone) {
                return _readFlotSettings(socket);
            } else {
                return Promise.resolve([]);
            }
        })
        .then(charts =>
            // convert every chart
            _executeWriteTasks(socket, charts.map(obj => _flot2echarts(obj, instance)))
        )
        .then(() => {
            if (!instanceObj.native.convertDone) {
                instanceObj.native.convertDone = true;
                return socket.setObject(instanceObj._id, instanceObj);
            } else {
                return Promise.resolve();
            }
        })
        .catch(e => {
            console.error(`Cannot convert flot: ${e}`);
            return Promise.resolve();
        });
}

export default flotConverter;