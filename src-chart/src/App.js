import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import { withTheme } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import { MuiThemeProvider } from '@material-ui/core/styles';

import LinearProgress from '@material-ui/core/LinearProgress';

import Utils from '@iobroker/adapter-react/Components/Utils';
import Loader from '@iobroker/adapter-react/Components/Loader'
import I18n from '@iobroker/adapter-react/i18n';
import Connection, {PROGRESS} from '@iobroker/adapter-react/Connection';
import DialogError from '@iobroker/adapter-react/Dialogs/Error';
import theme from '@iobroker/adapter-react/Theme';

import '@iobroker/adapter-react/index.css';

import ChartModel from './Components/ChartModel';
import ChartView from './Components/ChartView';

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

        this.state = {
            connected:  false,
            seriesData: null,
            noLoader:   Utils.parseQuery(window.location.search).noLoader || Utils.parseQuery((window.location.hash || '').replace(/^#/,'')).noLoader || false,
            theme:      themeInstance,
            themeName:  this.getThemeName(themeInstance),
            themeType:  this.getThemeType(themeInstance),
            noBackground: Utils.parseQuery(window.location.search).noBG || Utils.parseQuery((window.location.hash || '').replace(/^#/,'')).noBG || false,
        };
        this.divRef = React.createRef();
        this.progressRef = React.createRef();

        // init translations
        const translations = {
            'en': require('@iobroker/adapter-react/i18n/en'),
            'de': require('@iobroker/adapter-react/i18n/de'),
            'ru': require('@iobroker/adapter-react/i18n/ru'),
            'pt': require('@iobroker/adapter-react/i18n/pt'),
            'nl': require('@iobroker/adapter-react/i18n/nl'),
            'fr': require('@iobroker/adapter-react/i18n/fr'),
            'it': require('@iobroker/adapter-react/i18n/it'),
            'es': require('@iobroker/adapter-react/i18n/es'),
            'pl': require('@iobroker/adapter-react/i18n/pl'),
            'zh-cn': require('@iobroker/adapter-react/i18n/zh-cn'),
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
                    this.setState({connected: false});
                } else if (progress === PROGRESS.READY) {
                    this.setState({connected: true});
                } else {
                    this.setState({connected: true});
                }
            },
            onReady: (objects, scripts) => {
                I18n.setLanguage(this.socket.systemLang);

                this.socket.getSystemConfig()
                    .then(systemConfig => {
                        this.systemLang   = systemConfig?.common?.language || 'en';
                        this.isFloatComma = systemConfig?.common?.isFloatComma || false;

                        this.chartData = new ChartModel(this.socket);
                        this.chartData.onError(err => this.showError(I18n.t(err)));
                        this.chartData.onReading(reading => this.showProgress(reading));
                        this.chartData.onUpdate(seriesData => this.setState({seriesData}, () => this.showProgress(false)));
                    });
            },
            onError: err => {
                console.error(err);
                this.showError(err);
            }
        });
    }

    showProgress(isShow) {
        if (this.progressRef.current) {
            this.progressRef.current.style.display = isShow ? 'block' : 'none';
        }
    }

    componentWillUnmount() {
        this.chartData && this.chartData.destroy();
    }

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
        return theme.palette.type;
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

    render() {
        if (!this.state.connected || !this.state.seriesData) {
            if (this.state.noLoader) {
                return null;
            } else {
                return <MuiThemeProvider theme={this.state.theme}>
                    <Loader theme={this.state.themeType}/>
                </MuiThemeProvider>;
            }
        }

        const config = this.chartData.getConfig();

        if (this.state.seriesData && config.debug) {
            console.log('seriesData: ' + JSON.stringify(this.state.seriesData));
        }

        return <MuiThemeProvider theme={this.state.theme}>
            <div ref={this.divRef}
                 className={this.props.classes.root}
                 style={{
                     width: config.width,
                     height: config.height,
                     background: this.state.noBackground ? undefined : this.state.theme.palette.background.default,
                     color: this.state.theme.palette.text.primary
                 }}>
                <LinearProgress ref={this.progressRef} style={{display: 'block'}} className={this.props.classes.progress}/>
                <ChartView
                    socket={this.socket}
                    t={I18n.t}
                    noAnimation={this.state.noLoader}
                    data={this.state.seriesData}
                    config={config}
                    lang={I18n.getLanguage()}
                    themeType={this.state.themeType}
                    onRangeChange={options => this.chartData.setNewRange(options)}
                />
                {this.renderError()}
            </div>
        </MuiThemeProvider>;
    }
}

export default withWidth()(withStyles(styles)(withTheme(App)));
