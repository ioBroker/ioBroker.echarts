import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/browser';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import pack from '../package.json';

declare global {
    interface Window {
        sentryDSN: string;
        adapterName: string | undefined;
    }
}

window.adapterName = 'echarts-show';
window.sentryDSN = 'https://cf39325071144219aa91bb3510addcdf@sentry.iobroker.net/95';

console.log(`iobroker.${window.adapterName}@${pack.version}"`);

// if not local development
if (window.location.host !== 'localhost:3000') {
    Sentry.init({
        dsn: window.sentryDSN,
        release: `iobroker.${window.adapterName}@${pack.version}`,
        integrations: [Sentry.dedupeIntegration()],
        beforeSend(event /* , hint */) {
            let ignore = false;

            // ignore errors from echarts lib
            if (event.exception && event.exception.values && event.exception.values[0]) {
                if (event.exception.values[0].type === 'NS_ERROR_FAILURE') {
                    ignore = true;
                } else if (event.exception.values[0].value) {
                    if (event.exception.values[0].value.includes('Microsoft YaHei')) {
                        ignore = true;
                    } else if (
                        event.exception.values[0].value ===
                        'ResizeObserver loop completed with undelivered notifications.'
                    ) {
                        ignore = true;
                    } else if (event.exception.values[0].value === "undefined is not an object (evaluating 't.get')") {
                        ignore = true;
                    } else if (event.exception.values[0].value === "Cannot read property 'get' of undefined") {
                        ignore = true;
                    } else if (event.exception.values[0].value === 'this.painter is null') {
                        ignore = true;
                    } else if (event.exception.values[0].value.includes('ioBroker is not connected')) {
                        ignore = true;
                    } else if (event.exception.values[0].value === "Cannot read property 'getDisplayList' of null") {
                        ignore = true;
                    }
                }
            }

            return ignore ? null : event;
        },
    });
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
