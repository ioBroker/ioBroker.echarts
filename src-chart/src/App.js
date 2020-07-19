import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import { withTheme } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import clsx from 'clsx';
import { MuiThemeProvider } from '@material-ui/core/styles';

import Utils from '@iobroker/adapter-react/Components/Utils';
import Loader from '@iobroker/adapter-react/Components/Loader'
import I18n from '@iobroker/adapter-react/i18n';
import Connection, {PROGRESS} from '@iobroker/adapter-react/Connection';
import DialogError from '@iobroker/adapter-react/Dialogs/Error';
import theme from '@iobroker/adapter-react/Theme';

import '@iobroker/adapter-react/index.css';

import ChartModel from './Components/ChartModel';

const styles = theme => ({

});

class App extends Component {
    constructor(props) {
        super(props);

        const themeInstance = this.createTheme();

        this.state = {
            connected:  false,
            reading:    true,
            seriesData: null,
            theme:      themeInstance,
            themeName:  this.getThemeName(themeInstance),
            themeType:  this.getThemeType(themeInstance),
        };

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

        // merge together
        /*if (settings && settings.translations) {
            Object.keys(settings.translations).forEach(lang => translations[lang] = Object.assign(translations[lang], settings.translations[lang]));
        } else if (props.translations) {
            Object.keys(props.translations).forEach(lang => translations[lang] = Object.assign(translations[lang], props.translations[lang]));
        }*/

        I18n.setTranslations(translations);

        try {
            this.isIFrame = window.self !== window.top;
        } catch (e) {
            this.isIFrame = true;
        }
        
        this.socket = new Connection({
            name: window.adapterName,
            doNotLoadAllObjects: true,
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
                        this.chartData.onReading(reading => this.setState({reading}));
                        this.chartData.onUpdate(seriesData => this.setState({seriesData}));
                    });
            },
            onError: err => {
                console.error(err);
                this.showError(err);
            }
        });
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
        if (!this.state.errorText) return null;
        return (<DialogError text={this.state.errorText} onClose={() => this.setState({errorText: ''})}/>);
    }

    render() {
        if (!this.state.connected) {
            return <MuiThemeProvider theme={this.state.theme}>
                <Loader theme={this.state.themeType}/>
            </MuiThemeProvider>;
        }

        if (this.state.seriesData) {
            console.log('seriesData: ' + JSON.stringify(this.state.seriesData));
        }

        return <MuiThemeProvider theme={this.state.theme}>
                <>
                    {this.renderError()}
                </>
            </MuiThemeProvider>;
    }
}

export default withWidth()(withStyles(styles)(withTheme(App)));
