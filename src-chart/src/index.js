import React from 'react';
import ReactDOM from 'react-dom';
import { MuiThemeProvider} from '@material-ui/core/styles';
import * as Sentry from '@sentry/browser';
import * as SentryIntegrations from '@sentry/integrations';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { version } from '../package.json';
import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';

window.adapterName = 'echarts-show';
let themeName = Utils.getThemeName();

console.log('iobroker.' + window.adapterName + '@' + version + ' using theme "' + themeName + '"');

function build() {
    return ReactDOM.render(
        <MuiThemeProvider theme={theme(themeName)}>
            <App
                onThemeChange={_theme => {
                    themeName = _theme;
                    build();
                }}
            />
        </MuiThemeProvider>,
        document.getElementById('root')
    );
}

// if not local development
if (window.location.host !== 'localhost:3000') {
    Sentry.init({
        dsn: 'https://cf39325071144219aa91bb3510addcdf@sentry.iobroker.net/95',
        release: 'iobroker.' + window.adapterName + '@' + version,
        integrations: [
            new SentryIntegrations.Dedupe()
        ],
        beforeSend: function (event, hint) {
            let ignore = false;

            // ignore errors from echarts lib
            if (event.exception &&
                event.exception.values &&
                event.exception.values[0]) {
                if (event.exception.values[0].type === 'NS_ERROR_FAILURE') {
                    ignore = true;
                } else if (event.exception.values[0].value) {
                    if (event.exception.values[0].value.includes('Microsoft YaHei')) {
                        ignore = true;
                    } else if (event.exception.values[0].value === 'ResizeObserver loop completed with undelivered notifications.') {
                        ignore = true;
                    } else if (event.exception.values[0].value === `undefined is not an object (evaluating 't.get')`) {
                        ignore = true;
                    } else if (event.exception.values[0].value === `Cannot read property 'get' of undefined`) {
                        ignore = true;
                    } else if (event.exception.values[0].value === `this.painter is null`) {
                        ignore = true;
                    } else if (event.exception.values[0].value.includes('ioBroker is not connected')) {
                        ignore = true;
                    }
                }
            }

            return ignore ? null : event;
        },
    });
}

build();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
