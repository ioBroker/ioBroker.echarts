import React, { Component } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { StylesProvider, createGenerateClassName, withStyles, withTheme } from '@mui/styles';
import MD5 from 'crypto-js/md5';

import LinearProgress from '@mui/material/LinearProgress';

import { withWidth } from '@iobroker/adapter-react-v5';
import Utils from '@iobroker/adapter-react-v5/Components/Utils';
import Loader from '@iobroker/adapter-react-v5/Components/Loader'
import I18n from '@iobroker/adapter-react-v5/i18n';
import Connection, { PROGRESS, ERRORS } from '@iobroker/adapter-react-v5/Connection';
import DialogError from '@iobroker/adapter-react-v5/Dialogs/Error';
import theme from '@iobroker/adapter-react-v5/Theme';

import '@iobroker/adapter-react-v5/index.css';

import ChartModel from './Components/ChartModel';
import ChartView from './Components/ChartView';

const generateClassName = createGenerateClassName({
    productionPrefix: 'iob-app',
});

const styles = theme => ({
    root: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    progress: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    }
});

class App extends Component {
    constructor(props) {
        super(props);

        const themeInstance = this.createTheme();

        const query     = Utils.parseQuery(window.location.search);
        const queryHash = Utils.parseQuery((window.location.hash || '').replace(/^#/,''));

        this.state = {
            connected:  false,
            seriesData: null,
            actualValues: null,
            noLoader:   query.noLoader || queryHash.noLoader || false,
            theme:      themeInstance,
            themeName:  this.getThemeName(themeInstance),
            themeType:  this.getThemeType(themeInstance),
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
            'en': require('@iobroker/adapter-react-v5/i18n/en'),
            'de': require('@iobroker/adapter-react-v5/i18n/de'),
            'ru': require('@iobroker/adapter-react-v5/i18n/ru'),
            'pt': require('@iobroker/adapter-react-v5/i18n/pt'),
            'nl': require('@iobroker/adapter-react-v5/i18n/nl'),
            'fr': require('@iobroker/adapter-react-v5/i18n/fr'),
            'it': require('@iobroker/adapter-react-v5/i18n/it'),
            'es': require('@iobroker/adapter-react-v5/i18n/es'),
            'pl': require('@iobroker/adapter-react-v5/i18n/pl'),
            'zh-cn': require('@iobroker/adapter-react-v5/i18n/zh-cn'),
        };

        const ownTranslations = {
            'en': require('./i18n/en'),
            'de': require('./i18n/de'),
            'ru': require('./i18n/ru'),
            'pt': require('./i18n/pt'),
            'nl': require('./i18n/nl'),
            'fr': require('./i18n/fr'),
            'it': require('./i18n/it'),
            'es': require('./i18n/es'),
            'pl': require('./i18n/pl'),
            'zh-cn': require('./i18n/zh-cn'),
        };

        // merge together
        Object.keys(translations).forEach(lang => translations[lang] = Object.assign(translations[lang], ownTranslations[lang]));

        I18n.setTranslations(translations);

        try {
            this.isIFrame = window.self !== window.top;
        } catch (e) {
            this.isIFrame = true;
        }

        this.socket = new Connection({
            name: window.adapterName,
            onProgress: progress => {
                if (progress === PROGRESS.CONNECTING) {
                    if (this.state.seriesData) {
                        this.divRef.current && (this.divRef.current.style.opacity = 0.5);
                        this.progressRef.current && (this.progressRef.current.style.display = 'block');
                    } else {
                        this.setState({connected: false});
                    }
                } else if (progress === PROGRESS.READY) {
                    this.setState({connected: true});
                    this.restoreAfterReconnection();
                } else {
                    this.setState({connected: true});
                    this.restoreAfterReconnection();
                }
            },
            onReady: (objects, scripts) => {
                I18n.setLanguage(this.socket.systemLang);

                this.socket.getSystemConfig()
                    .then(systemConfig => {
                        this.systemLang   = systemConfig?.common?.language || 'en';
                        this.isFloatComma = systemConfig?.common?.isFloatComma || false;
                        if (this.inEdit) {
                            window.addEventListener('message', this.onReceiveMessage);
                            if (window.self !== window.parent) {
                                try {
                                    window.parent.postMessage('chartReady','*');
                                } catch (e) {
                                    console.warn('Cannot send ready event to parent window');
                                    console.error(e);
                                }
                            }
                        } else {
                            this.createChartData();
                        }
                    })
                    .catch(err => {
                        if (err === ERRORS.NOT_CONNECTED) {
                            this.setState({connected: false});
                        } else {
                            this.showError(I18n.t(err));
                        }
                    })
            },
            onError: err => {
                console.error(err);
                this.showError(err);
            }
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
        this.chartData = new ChartModel(this.socket, config, {compact: this.state.compact});
        this.chartData.onError(err => {
            if (err === ERRORS.NOT_CONNECTED) {
                this.divRef.current && (this.divRef.current.style.opacity = 0.5);
                this.progressRef.current && (this.progressRef.current.style.display = 'block');
            } else {
                this.showError(I18n.t(err));
            }
        });
        this.chartData.onReading(reading => this.showProgress(reading));
        this.chartData.onUpdate((seriesData, actualValues) => {
            const newState = {connected: true, dataLoaded: true};
            seriesData   && (newState.seriesData   = seriesData);
            actualValues && (newState.actualValues = actualValues);
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
                return console.log('Cannot parse ' + message.data);
            }
        }
    };

    /**
     * Get a theme
     * @param {string} name Theme name
     * @returns {Theme}
     */
    createTheme(name = '') {
        return theme(Utils.getThemeName(name));
    }

    /**
     * Get the theme name
     * @param {Theme} theme Theme
     * @returns {string} Theme name
     */
    getThemeName(theme) {
        return theme.name;
    }

    /**
     * Get the theme type
     * @param {Theme} theme Theme
     * @returns {string} Theme type
     */
    getThemeType(theme) {
        return theme.palette.mode;
    }

    showError(text) {
        this.setState({errorText: text});
    }

    renderError() {
        if (!this.state.errorText) {
            return null;
        } else {
            return <DialogError classes={{}} text={this.state.errorText} onClose={() => this.setState({errorText: ''})}/>;
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (!this.progressShown && this.progressRef.current && this.progressRef.current.style.display !== 'none') {
            this.progressRef.current.style.display = 'none';
        }
    }

    render() {
        if (!this.state.connected || !this.state.seriesData) {
            if (this.state.noLoader) {
                return null;
            } else {
                return <StylesProvider generateClassName={generateClassName}>
                    <StyledEngineProvider injectFirst>
                        <ThemeProvider theme={this.state.theme}>
                            <Loader theme={this.state.themeType}/>
                        </ThemeProvider>
                    </StyledEngineProvider>
                </StylesProvider>;
            }
        }

        const config = this.chartData.getConfig();
        // get IDs hash
        const hash = MD5(JSON.stringify(((config && config.l && config.l.map(item => item.id)) || []).sort())).toString();

        if (this.state.seriesData && config.debug) {
            console.log('seriesData: ' + JSON.stringify(this.state.seriesData));
        }

        return <StylesProvider generateClassName={generateClassName}>
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <div ref={this.divRef}
                         className={this.props.classes.root}
                         style={{
                             width: config.width,
                             height: config.height,
                             background: this.state.noBackground || config.noBackground ? undefined : this.state.theme.palette.background.default,
                             color: this.state.theme.palette.text.primary
                         }}>
                        <LinearProgress ref={this.progressRef} style={{display: 'block'}} className={this.props.classes.progress}/>
                        <ChartView
                            key={hash}
                            socket={this.socket}
                            t={I18n.t}
                            noAnimation={this.state.noLoader}
                            data={this.state.seriesData}
                            actualValues={this.state.actualValues}
                            config={config}
                            compact={this.state.compact}
                            lang={I18n.getLanguage()}
                            themeType={this.state.themeType}
                            onRangeChange={options => this.chartData.setNewRange(options)}
                        />
                        {this.renderError()}
                    </div>
                </ThemeProvider>
            </StyledEngineProvider>
        </StylesProvider>;
    }
}

export default withWidth()(withStyles(styles)(withTheme(App)));
