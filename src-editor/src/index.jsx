import React from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import pack from '../package.json';

window.adapterName = 'echarts';
window.sentryDSN = 'https://709f116e1de34029921e4f2696d6740f@sentry.iobroker.net/88';

console.log(`iobroker.${window.adapterName}@${pack.version}`);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
