import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { StylesProvider, createGenerateClassName } from '@mui/styles';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import pack from '../package.json';
import theme from '@iobroker/adapter-react-v5/Theme';
import Utils from '@iobroker/adapter-react-v5/Components/Utils';

window.adapterName = 'echarts';
window.sentryDSN = 'https://709f116e1de34029921e4f2696d6740f@sentry.iobroker.net/88';
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

build();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
