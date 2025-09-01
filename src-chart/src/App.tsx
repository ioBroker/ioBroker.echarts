import React, { Component } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import MD5 from 'crypto-js/md5';

import { LinearProgress } from '@mui/material';

import {
    Connection,
    PROGRESS,
    ERRORS,
    Loader,
    I18n,
    Utils,
    withWidth,
    Error as DialogError,
    Theme,
    type IobTheme,
    type ThemeName,
    type ThemeType,
} from '@iobroker/adapter-react-v5';

import '@iobroker/adapter-react-v5/build/index.css';

import enGlobLang from '@iobroker/adapter-react-v5/i18n/en.json';
import deGlobLang from '@iobroker/adapter-react-v5/i18n/de.json';
import ruGlobLang from '@iobroker/adapter-react-v5/i18n/ru.json';
import ptGlobLang from '@iobroker/adapter-react-v5/i18n/pt.json';
import nlGlobLang from '@iobroker/adapter-react-v5/i18n/nl.json';
import frGlobLang from '@iobroker/adapter-react-v5/i18n/fr.json';
import itGlobLang from '@iobroker/adapter-react-v5/i18n/it.json';
import esGlobLang from '@iobroker/adapter-react-v5/i18n/es.json';
import plGlobLang from '@iobroker/adapter-react-v5/i18n/pl.json';
import ukGlobLang from '@iobroker/adapter-react-v5/i18n/uk.json';
import zhGlobLang from '@iobroker/adapter-react-v5/i18n/zh-cn.json';

import enLang from './i18n/en.json';
import deLang from './i18n/de.json';
import ruLang from './i18n/ru.json';
import ptLang from './i18n/pt.json';
import nlLang from './i18n/nl.json';
import frLang from './i18n/fr.json';
import itLang from './i18n/it.json';
import esLang from './i18n/es.json';
import plLang from './i18n/pl.json';
import ukLang from './i18n/uk.json';
import zhLang from './i18n/zh-cn.json';

import ChartModel, { type SeriesData, type BarAndLineSeries, type ChartConfigOld } from './Components/ChartModel';
import ChartView from './Components/ChartView';
import type { ChartConfig, ChartConfigMore } from '../../src/types';

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        grey: true;
    }
}

const styles: Record<string, React.CSSProperties> = {
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
        display: 'block',
    },
};

type AppProps = object;

interface AppState {
    connected: boolean;
    seriesData: BarAndLineSeries[] | null;
    categories: number[] | undefined | null;
    actualValues: number[] | null;
    noLoader: boolean;
    theme: IobTheme;
    themeType: ThemeType;
    noBackground: boolean;
    compact: boolean;
    errorText?: string;
    dataLoaded: boolean;
}

class App extends Component<AppProps, AppState> {
    private readonly socket: Connection;
    private chartData: ChartModel;
    private readonly inEdit: boolean;
    private readonly divRef: React.RefObject<HTMLDivElement>;
    private readonly progressRef: React.RefObject<HTMLDivElement>;
    private progressShown: boolean;
    private adminCorrectTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(props: AppProps) {
        super(props);

        const themeInstance = App.createTheme();

        const query = Utils.parseQuery(window.location.search);
        const queryHash = Utils.parseQuery((window.location.hash || '').replace(/^#/, ''));

        this.state = {
            connected: false,
            seriesData: null,
            categories: null, // used for bar and pie charts
            actualValues: null,
            noLoader: !!query.noLoader || !!queryHash.noLoader || false,
            theme: themeInstance,
            themeType: App.getThemeType(themeInstance),
            noBackground: !!query.noBG || !!queryHash.noBG || false,
            compact: !!query.compact || !!queryHash.compact || false,
            dataLoaded: false,
        };

        this.inEdit =
            query.edit === '1' ||
            query.edit === 1 ||
            query.edit === true ||
            query.edit === 'true' ||
            queryHash.edit === '1' ||
            queryHash.edit === 1 ||
            queryHash.edit === true ||
            queryHash.edit === 'true';

        this.divRef = React.createRef();
        this.progressRef = React.createRef();
        this.progressShown = true;

        // init translations
        const translations: Record<ioBroker.Languages, Record<string, string>> = {
            en: enGlobLang,
            de: deGlobLang,
            ru: ruGlobLang,
            pt: ptGlobLang,
            nl: nlGlobLang,
            fr: frGlobLang,
            it: itGlobLang,
            es: esGlobLang,
            pl: plGlobLang,
            uk: ukGlobLang,
            'zh-cn': zhGlobLang,
        };

        const ownTranslations: Record<ioBroker.Languages, Record<string, string>> = {
            en: enLang,
            de: deLang,
            ru: ruLang,
            pt: ptLang,
            nl: nlLang,
            fr: frLang,
            it: itLang,
            es: esLang,
            pl: plLang,
            uk: ukLang,
            'zh-cn': zhLang,
        };

        // merge together
        Object.keys(translations).forEach(
            lang =>
                (translations[lang as ioBroker.Languages] = Object.assign(
                    translations[lang as ioBroker.Languages],
                    ownTranslations[lang as ioBroker.Languages],
                )),
        );

        I18n.setTranslations(translations);

        // window.socketUrl = 'http://192.168.1.67:8081/';

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
                // The address is wrong. Navigate to /echarts/index.html
                window.location.href = window.location.href.replace('/adapter/echarts/chart/', '/echarts/');
            }, 2000);
        }

        this.socket = new Connection({
            name: window.adapterName,
            onProgress: progress => {
                if (progress === PROGRESS.CONNECTING) {
                    if (this.state.seriesData) {
                        if (this.divRef.current) {
                            this.divRef.current.style.opacity = '0.5';
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
                if (this.adminCorrectTimeout) {
                    clearTimeout(this.adminCorrectTimeout);
                    this.adminCorrectTimeout = null;
                }
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

    restoreAfterReconnection(): void {
        if (this.divRef.current) {
            this.divRef.current.style.opacity = '1';
        }
        if (this.progressRef.current && !this.progressShown) {
            this.progressRef.current.style.display = 'none';
        }
        if (this.state.seriesData && !this.state.seriesData.find(series => series.length)) {
            this.chartData.setNewRange();
        }
    }

    createChartData(config?: ChartConfig | ChartConfigOld | string): void {
        this.chartData = new ChartModel(this.socket, config, { compact: this.state.compact });
        this.chartData.onError(err => {
            if (err.toString().includes(ERRORS.NOT_CONNECTED)) {
                if (this.divRef.current) {
                    this.divRef.current.style.opacity = '0.5';
                }
                if (this.progressRef.current) {
                    this.progressRef.current.style.display = 'block';
                }
            } else {
                this.showError(I18n.t(err.toString()));
            }
        });
        this.chartData.onReading(reading => this.showProgress(reading));
        this.chartData.onUpdate(
            (seriesData: BarAndLineSeries[] | null, actualValues?: number[], categories?: number[]): void => {
                const newState: Partial<AppState> = { connected: true, dataLoaded: true };
                if (seriesData) {
                    newState.seriesData = seriesData;
                    newState.categories = categories; // used for bar charts and pie charts
                }
                if (actualValues) {
                    newState.actualValues = actualValues;
                }
                this.setState(newState as AppState, (): void => this.showProgress(false));
            },
        );
    }

    showProgress(isShow: boolean): void {
        this.progressShown = isShow;
        if (this.progressRef.current) {
            this.progressRef.current.style.display = isShow ? 'block' : 'none';
        }
    }

    componentWillUnmount(): void {
        this.inEdit && window.removeEventListener('message', this.onReceiveMessage, false);
        this.chartData && this.chartData.destroy();
    }

    onReceiveMessage = (message?: { data: string }): void => {
        if (message && message.data !== 'chartReady') {
            try {
                const config: ChartConfig | ChartConfigOld = JSON.parse(message.data);
                if (!this.chartData) {
                    this.createChartData(config);
                } else {
                    this.chartData.setConfig(config);
                }
            } catch {
                console.log(`Cannot parse ${message.data}`);
            }
        }
    };

    static createTheme(name?: ThemeName): IobTheme {
        return Theme(Utils.getThemeName(name));
    }

    static getThemeType(_theme: IobTheme): ThemeType {
        return _theme.palette.mode;
    }

    showError(text: string): void {
        this.setState({ errorText: text });
    }

    renderError(): React.JSX.Element | null {
        if (!this.state.errorText) {
            return null;
        }
        return (
            <DialogError
                text={this.state.errorText}
                onClose={() => this.setState({ errorText: '' })}
            />
        );
    }

    componentDidUpdate(/* prevProps, prevState, snapshot */): void {
        if (!this.progressShown && this.progressRef.current && this.progressRef.current.style.display !== 'none') {
            this.progressRef.current.style.display = 'none';
        }
    }

    render(): React.JSX.Element | null {
        if (!this.state.connected || !this.state.seriesData) {
            if (this.state.noLoader) {
                return null;
            }
            return (
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <Loader themeType={this.state.themeType} />
                    </ThemeProvider>
                </StyledEngineProvider>
            );
        }

        const config: ChartConfigMore = this.chartData.getConfig() as ChartConfigMore;
        // get IDs hash
        const hash = MD5(JSON.stringify((config?.l?.map(item => item.id) || []).sort())).toString();

        if (this.state.seriesData && config.debug) {
            console.log(`seriesData: ${JSON.stringify(this.state.seriesData)}`);
        }

        return (
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <div
                        ref={this.divRef}
                        style={{
                            ...styles.root,
                            width: config.width,
                            height: config.height,
                            background:
                                this.state.noBackground || config.noBackground
                                    ? undefined
                                    : this.state.theme.palette.background.default,
                            color: this.state.theme.palette.text.primary,
                        }}
                    >
                        <LinearProgress
                            ref={this.progressRef}
                            style={styles.progress}
                        />
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
                            onRangeChange={(options: { stopLive?: boolean; start?: number; end?: number }): void =>
                                this.chartData.setNewRange(options)
                            }
                            exportData={(
                                from: number,
                                to: number,
                                excludes?: string[],
                            ): Promise<{ [objectId: string]: SeriesData[] }> =>
                                this.chartData.exportData(from, to, excludes)
                            }
                        />
                        {this.renderError()}
                    </div>
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}

export default withWidth()(App);
