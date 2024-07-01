import React, { Component } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import MD5 from 'crypto-js/md5';

import { LinearProgress } from '@mui/material';

import {
    Connection,
    PROGRESS,
    ERRORS,
    Loader, I18n, Utils, withWidth,
    Error as DialogError,
    Theme,
} from '@iobroker/adapter-react-v5';

import '@iobroker/adapter-react-v5/index.css';

import ChartModel from './Components/ChartModel';
import ChartView from './Components/ChartView';

class App extends Component {
    constructor(props) {
        super(props);

        const themeInstance = App.createTheme();

        const query     = Utils.parseQuery(window.location.search);
        const queryHash = Utils.parseQuery((window.location.hash || '').replace(/^#/, ''));

        this.state = {
            connected:  false,
            seriesData: null,
            categories: null, // used for bar and pie charts
            actualValues: null,
            noLoader:   query.noLoader || queryHash.noLoader || false,
            theme:      themeInstance,
            themeType:  App.getThemeType(themeInstance),
            noBackground: query.noBG || queryHash.noBG || false,
            compact:    query.compact || queryHash.compact || false,
        };

        this.inEdit =
            query.edit     === '1' || query.edit     === 1 || query.edit     === true || query.edit     === 'true' ||
            queryHash.edit === '1' || queryHash.edit === 1 || queryHash.edit === true || queryHash.edit === 'true';

        this.divRef      = React.createRef();
        this.progressRef = React.createRef();
        this.progressShown = true;

        // init translations
        const translations = {
            en: require('@iobroker/adapter-react-v5/i18n/en'),
            de: require('@iobroker/adapter-react-v5/i18n/de'),
            ru: require('@iobroker/adapter-react-v5/i18n/ru'),
            pt: require('@iobroker/adapter-react-v5/i18n/pt'),
            nl: require('@iobroker/adapter-react-v5/i18n/nl'),
            fr: require('@iobroker/adapter-react-v5/i18n/fr'),
            it: require('@iobroker/adapter-react-v5/i18n/it'),
            es: require('@iobroker/adapter-react-v5/i18n/es'),
            pl: require('@iobroker/adapter-react-v5/i18n/pl'),
            uk: require('@iobroker/adapter-react-v5/i18n/uk'),
            'zh-cn': require('@iobroker/adapter-react-v5/i18n/zh-cn'),
        };

        const ownTranslations = {
            en: require('./i18n/en'),
            de: require('./i18n/de'),
            ru: require('./i18n/ru'),
            pt: require('./i18n/pt'),
            nl: require('./i18n/nl'),
            fr: require('./i18n/fr'),
            it: require('./i18n/it'),
            es: require('./i18n/es'),
            pl: require('./i18n/pl'),
            uk: require('./i18n/uk'),
            'zh-cn': require('./i18n/zh-cn'),
        };

        // merge together
        Object.keys(translations).forEach(lang => translations[lang] = Object.assign(translations[lang], ownTranslations[lang]));

        I18n.setTranslations(translations);

        if (window.socketUrl && window.socketUrl.startsWith(':')) {
            window.socketUrl = `${window.location.protocol}//${window.location.hostname}${window.socketUrl}`;
        }

        /*
        try {
            this.isIFrame = window.self !== window.top;
        } catch (e) {
            this.isIFrame = true;
        }
        */

        // some people use invalid URL to access charts
        if (window.location.port === '8082' && window.location.pathname.includes('/adapter/echarts/chart/')) {
            this.adminCorrectTimeout = setTimeout(() => {
                this.adminCorrectTimeout = null;
                // Address is wrong. Navigate to /echarts/index.html
                window.location = window.location.href.replace('/adapter/echarts/chart/', '/echarts/');
            }, 2000);
        }

        this.socket = new Connection({
            name: window.adapterName,
            onProgress: progress => {
                if (progress === PROGRESS.CONNECTING) {
                    if (this.state.seriesData) {
                        if (this.divRef.current) {
                            this.divRef.current.style.opacity = 0.5;
                        }
                        if (this.progressRef.current) {
                            this.progressRef.current.style.display = 'block';
                        }
                    } else {
                        this.setState({ connected: false });
                    }
                } else if (progress === PROGRESS.READY) {
                    this.setState({ connected: true });
                    this.restoreAfterReconnection();
                } else {
                    this.setState({ connected: true });
                    this.restoreAfterReconnection();
                }
            },
            onReady: () => {
                this.adminCorrectTimeout && clearTimeout(this.adminCorrectTimeout);
                this.adminCorrectTimeout = null;
                I18n.setLanguage(this.socket.systemLang);

                if (this.inEdit) {
                    window.addEventListener('message', this.onReceiveMessage);
                    if (window.self !== window.parent) {
                        try {
                            window.parent.postMessage('chartReady', '*');
                        } catch (e) {
                            console.warn('Cannot send ready event to parent window');
                            console.error(e);
                        }
                    }
                } else {
                    this.createChartData();
                }
            },
            onError: err => {
                console.error(err);
                this.showError(err);
            },
        });
    }

    restoreAfterReconnection() {
        this.divRef.current && (this.divRef.current.style.opacity = 1);
        this.progressRef.current && !this.progressShown && (this.progressRef.current.style.display = 'none');
        if (this.state.seriesData && !this.state.seriesData.find(series => series.length)) {
            this.chartData.setNewRange();
        }
    }

    createChartData(config) {
        this.chartData = new ChartModel(this.socket, config, { compact: this.state.compact });
        this.chartData.onError(err => {
            if (err === ERRORS.NOT_CONNECTED) {
                this.divRef.current && (this.divRef.current.style.opacity = 0.5);
                this.progressRef.current && (this.progressRef.current.style.display = 'block');
            } else {
                this.showError(I18n.t(err));
            }
        });
        this.chartData.onReading(reading => this.showProgress(reading));
        this.chartData.onUpdate((seriesData, actualValues, categories) => {
            const newState = { connected: true, dataLoaded: true };
            if (seriesData) {
                newState.seriesData = seriesData;
                newState.categories = categories; // used for bar charts and pie charts
            }
            if (actualValues) {
                newState.actualValues = actualValues;
            }
            this.setState(newState, () =>
                this.showProgress(false));
        });
    }

    showProgress(isShow) {
        this.progressShown = isShow;
        if (this.progressRef.current) {
            this.progressRef.current.style.display = isShow ? 'block' : 'none';
        }
    }

    componentWillUnmount() {
        this.inEdit && window.removeEventListener('message', this.onReceiveMessage, false);
        this.chartData && this.chartData.destroy();
    }

    onReceiveMessage = message => {
        if (message && message.data !== 'chartReady') {
            try {
                const config = JSON.parse(message.data);
                if (!this.chartData) {
                    this.createChartData(config);
                } else {
                    this.chartData.setConfig(config);
                }
            } catch (e) {
                console.log(`Cannot parse ${message.data}`);
            }
        }
    };

    /**
     * Get a theme
     * @param {string} name Theme name
     * @returns {Theme}
     */
    static createTheme(name = '') {
        return Theme(Utils.getThemeName(name));
    }

    /**
     * Get the theme type
     * @param {Theme} theme_ Theme
     * @returns {string} Theme type
     */
    static getThemeType(theme_) {
        return theme_.palette.mode;
    }

    showError(text) {
        this.setState({ errorText: text });
    }

    renderError() {
        if (!this.state.errorText) {
            return null;
        }
        return <DialogError text={this.state.errorText} onClose={() => this.setState({ errorText: '' })} />;
    }

    componentDidUpdate(/* prevProps, prevState, snapshot */) {
        if (!this.progressShown && this.progressRef.current && this.progressRef.current.style.display !== 'none') {
            this.progressRef.current.style.display = 'none';
        }
    }

    render() {
        if (!this.state.connected || !this.state.seriesData) {
            if (this.state.noLoader) {
                return null;
            }
            return <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <Loader themeType={this.state.themeType} />
                </ThemeProvider>
            </StyledEngineProvider>;
        }

        const config = this.chartData.getConfig();
        // get IDs hash
        const hash = MD5(JSON.stringify(((config && config.l && config.l.map(item => item.id)) || []).sort())).toString();

        if (this.state.seriesData && config.debug) {
            console.log(`seriesData: ${JSON.stringify(this.state.seriesData)}`);
        }

        return <StyledEngineProvider injectFirst>
            <ThemeProvider theme={this.state.theme}>
                <div
                    ref={this.divRef}
                    style={{
                        ...states.root,
                        width: config.width,
                        height: config.height,
                        background: this.state.noBackground || config.noBackground ? undefined : this.state.theme.palette.background.default,
                        color: this.state.theme.palette.text.primary,
                    }}
                >
                    <LinearProgress ref={this.progressRef} style={{ display: 'block' }} state={states.progress} />
                    <ChartView
                        key={hash}
                        socket={this.socket}
                        t={I18n.t}
                        noAnimation={this.state.noLoader}
                        data={this.state.seriesData}
                        actualValues={this.state.actualValues}
                        categories={this.state.categories || []} // used for bar charts and pie charts
                        config={config}
                        compact={this.state.compact}
                        lang={I18n.getLanguage()}
                        themeType={this.state.themeType}
                        onRangeChange={options => this.chartData.setNewRange(options)}
                        exportData={(from, to, excludes) => this.chartData.exportData(from, to, excludes)}
                    />
                    {this.renderError()}
                </div>
            </ThemeProvider>
        </StyledEngineProvider>;
    }
}

export default withWidth()(App);
