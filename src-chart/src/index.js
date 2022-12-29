import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { StylesProvider, createGenerateClassName } from '@mui/styles';
import * as Sentry from '@sentry/browser';
import * as SentryIntegrations from '@sentry/integrations';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import pack from '../package.json';
import theme from '@iobroker/adapter-react-v5/Theme';
import Utils from '@iobroker/adapter-react-v5/Components/Utils';

window.adapterName = 'echarts-show';
window.sentryDSN = 'https://cf39325071144219aa91bb3510addcdf@sentry.iobroker.net/95';
let themeName = Utils.getThemeName();

console.log(`iobroker.${window.adapterName}@${pack.version} using theme "${themeName}"`);

const generateClassName = createGenerateClassName({
    productionPrefix: 'iob',
});

function build() {
    const container = document.getElementById('root');
    const root = createRoot(container);
    return root.render(<StylesProvider generateClassName={generateClassName}>
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme(themeName)}>
                <App
                    onThemeChange={_theme => {
                        themeName = _theme;
                        build();
                    }}
                />
            </ThemeProvider>
        </StyledEngineProvider>
    </StylesProvider>);
}

// if not local development
if (window.location.host !== 'localhost:3000') {
    Sentry.init({
        dsn: window.sentryDSN,
        release: 'iobroker.' + window.adapterName + '@' + pack.version,
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
                    } else if (event.exception.values[0].value === `Cannot read property 'getDisplayList' of null`) {
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
