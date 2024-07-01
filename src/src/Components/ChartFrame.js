import React from 'react';
import PropTypes from 'prop-types';

import { Paper } from '@mui/material';
import { Utils } from '@iobroker/adapter-react-v5';

const styles = {
    darkBackground: {
        stroke: '#3a3a3a !important',
        fill: '#515151 !important',
    },
    iframe: theme => ({
        width: '100%',
        height: '100%',
        overflow: 'auto',
        border: 0,
        color: theme.palette.primary.main, // && console.log(JSON.stringify(theme))
    }),
};

/* function deParam(params, coerce) {
    const obj = {};
    const coerceTypes = {'true': true, 'false': false, 'null': null};

    // Iterate over all name=value pairs.
    (params || '').replace(/\+/g, ' ').split('&').forEach(v => {
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
} */

class ChartFrame extends React.Component {
    constructor(props) {
        super(props);
        this.ready = false;
        this.refIframe = React.createRef();
        this.lastPresetData = '';
    }

    componentDidMount() {
        window.addEventListener('message', this.onReceiveMessage, false);
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.onReceiveMessage, false);
    }

    onReceiveMessage = message => {
        if (message && message.data === 'chartReady') {
            this.ready = true;
            this.lastPresetData = JSON.stringify(this.props.presetData);
            this.refIframe.contentWindow?.postMessage(this.lastPresetData, '*');
            console.log('Received ready from iframe');
        }
    };

    render() {
        if (window.location.port === '3000') {
            return <Paper sx={styles.iframe} style={{ background: '#333' }}>
                <pre>{JSON.stringify(this.props.presetData, null, 2)}</pre>
            </Paper>;
        }
        if (this.lastPresetData !== JSON.stringify(this.props.presetData) && this.ready) {
            this.lastPresetData = JSON.stringify(this.props.presetData);
            this.refIframe.contentWindow?.postMessage(this.lastPresetData, '*');
        }

        return <iframe
            ref={el => this.refIframe = el}
            title="iobrokerChart"
            style={Utils.getStyle(this.props.theme, styles.iframe)}
            src={this.props.src}
        >
        </iframe>;
    }
}

ChartFrame.propTypes = {
    src: PropTypes.string,
    presetData: PropTypes.object,
    theme: PropTypes.object,
};

export default ChartFrame;
