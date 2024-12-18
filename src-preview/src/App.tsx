import React, { Component } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import {
    CircularProgress,
    Breadcrumbs,
    Link,
    Toolbar,
    AppBar,
    IconButton,
    Stack,
    Slider,
    Snackbar,
    Menu,
    MenuItem,
    Box,
} from '@mui/material';

import { FaFolder as IconFolderClosed } from 'react-icons/fa';

import {
    ImageNotSupported,
    KeyboardReturn,
    Photo,
    AddPhotoAlternate,
    ContentCopy,
    Refresh,
    ArrowCircleLeft,
    Close as IconClose,
} from '@mui/icons-material';

import {
    Loader,
    I18n,
    Utils,
    withWidth,
    Error as DialogError,
    Theme,
    ToggleThemeMenu,
    Connection,
    PROGRESS,
    IobTheme,
    ThemeType,
    ThemeName,
} from '@iobroker/adapter-react-v5';

import '@iobroker/adapter-react-v5/build/index.css';
import logo from './assets/echarts.png';

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

const styles: Record<string, any> = {
    root: (theme: IobTheme): React.CSSProperties => ({
        width: '100%',
        height: 'calc(100% - 48px)',
        position: 'relative',
        color: theme.palette.mode === 'dark' ? '#fff' : '#000',
        backgroundColor: theme.palette.mode === 'dark' ? '#000' : '#fff',
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
    }),
    slider: {
        color: '#FFF !important',
    },
    toolbarTitle: {},
    button: {
        width: 128,
        borderRadius: 10,
        border: '1px dashed #888',
        padding: 10,
        margin: 5,
        textAlign: 'center',
        cursor: 'pointer',
        position: 'relative',
    },
    folderIcon: (theme: IobTheme): any => ({
        '& svg': {
            width: 'calc(100% - 28px)',
            height: 'auto',
            color: theme.palette.primary.main,
        },
    }),
    active: (theme: IobTheme): any => ({
        '& svg': {
            color: theme.palette.primary.main,
        },
    }),
    folderName: {
        display: 'block',
        fontSize: 16,
        width: '100%',
        textAlign: 'center',
    },
    presetIcon: {
        width: 'calc(100% - 6px)',
    },
    presetName: {
        display: 'block',
        fontSize: 16,
        width: '100%',
        textAlign: 'center',
    },
    presetError: {
        color: '#FF0000',
        display: 'block',
        fontSize: '0.8em',
        fontStyle: 'italic',
    },
    break: {
        flexBasis: '100%',
        height: 0,
    },
    copyButton: {
        position: 'absolute',
        bottom: 3,
        right: 3,
    },
};

const iconsCache = {};

interface AppState {
    connected: boolean;
    theme: IobTheme;
    themeType: ThemeType;
    themeName: ThemeName;
    location;
    presetFolders: null;
    icons: {};
    iconSize: number;
    showSlider: boolean;
    alive: boolean;
    toast: string;
    webInstances: [];
    webMenu: null;
    forceRefresh: boolean;
}

class App extends Component<object, AppState> {
    private adminCorrectTimeout: ReturnType<typeof setTimeout> | null = null;

    private readonly isWeb: boolean;

    private socket: Connection;

    constructor(props: any) {
        super(props);

        const themeInstance = App.createTheme();

        const queryHash = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
        const location = queryHash.split('/');
        if (!location.length) {
            location.push('');
        }

        this.state = {
            connected: false,
            theme: themeInstance,
            themeType: App.getThemeType(themeInstance),
            themeName: App.getThemeName(themeInstance),
            location,
            presetFolders: null,
            icons: {},
            iconSize: parseInt(window.localStorage.getItem('echarts.iconSize'), 10) || 128,
            showSlider: false,
            alive: true,
            toast: '',
            webInstances: [],
            webMenu: null,
            forceRefresh: false,
        };

        // init translations
        const translations = {
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

        const ownTranslations = {
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
        Object.keys(translations).forEach(lang =>
            Object.assign(
                (translations as Record<ioBroker.Languages, string>)[lang],
                (ownTranslations as Record<ioBroker.Languages, string>)[lang],
            ),
        );

        I18n.setTranslations(translations);

        if (window.socketUrl && window.socketUrl.startsWith(':')) {
            window.socketUrl = `${window.location.protocol}//${window.location.hostname}${window.socketUrl}`;
        }

        // some people uses invalid URL to access charts
        if (window.location.port === '8082' && window.location.pathname.includes('/adapter/echarts/preview/')) {
            this.adminCorrectTimeout = setTimeout(() => {
                this.adminCorrectTimeout = null;
                // Address is wrong. Navigate to /echarts/index.html
                window.location.href = window.location.href.replace('/adapter/echarts/preview/', '/echarts/preview/');
            }, 2000);
        }

        this.isWeb = Connection.isWeb();

        this.socket = new Connection({
            name: window.adapterName,
            onProgress: progress => {
                if (progress === PROGRESS.CONNECTING) {
                    this.setState({ connected: false });
                } else if (progress === PROGRESS.READY) {
                    this.setState({ connected: true });
                } else {
                    this.setState({ connected: true });
                }
            },
            onReady: () => {
                this.adminCorrectTimeout && clearTimeout(this.adminCorrectTimeout);
                this.adminCorrectTimeout = null;

                I18n.setLanguage(this.socket.systemLang);

                void this.socket
                    .getState('system.adapter.echarts.0.alive')
                    .catch(() => null) // ignore error
                    .then(state => {
                        this.setState({ alive: state && state.val });
                        return this.getWebInstances();
                    })
                    .then(webInstances => {
                        this.setState({ webInstances });
                        return this.getAllPresets();
                    })
                    .then(newState => this.setState(newState));
            },
            onError: err => {
                console.error(err);
                this.showError(err);
            },
        });

        window.addEventListener('hashchange', this.onHashChanged);
        this.snapShotQueue = [];
        this.timeout = {};
    }

    async getWebInstances() {
        const instances = await this.socket.getObjectViewSystem(
            'instance',
            'system.adapter.web.',
            'system.adapter.web.\u9999',
        );
        return Object.keys(instances).map(id => {
            const obj = instances[id];
            return {
                port: obj.native.port,
                bind: obj.native.bind,
                id: obj._id.replace('system.adapter.', ''),
                enabled: obj.common.enabled,
                protocol: obj.native.secure ? 'https://' : 'http://',
            };
        });
    }

    componentDidMount() {
        window.addEventListener('message', this.onReceiveMessage, false);
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.onReceiveMessage, false);
        this.toastTimeout && clearTimeout(this.toastTimeout);
        this.toastTimeout = null;
    }

    onReceiveMessage = message => {
        if (message?.data === 'updateTheme') {
            const newThemeName = Utils.getThemeName();
            Utils.setThemeName(Utils.getThemeName());

            const _theme = App.createTheme(newThemeName);

            this.setState(
                {
                    theme: _theme,
                    themeName: App.getThemeName(_theme),
                    themeType: App.getThemeType(_theme),
                },
                () => this.props.onThemeChange && this.props.onThemeChange(newThemeName),
            );
        }
    };

    onHashChanged = () => {
        const queryHash = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
        const location = queryHash.split('/');
        if (!location.length) {
            location.push('');
        }
        if (JSON.stringify(location) !== JSON.stringify(this.state.location)) {
            // clear queue
            this.snapShotQueue = [];
            this.setState({ location });
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
     * Get the theme name
     * @param {Theme} theme_ Theme
     * @returns {string} Theme name
     */
    static getThemeName(theme_) {
        return theme_.name;
    }

    /**
     * Get the theme type
     * @param {Theme} theme_ Theme
     * @returns {string} Theme type
     */
    static getThemeType(theme_) {
        return theme_.palette.mode;
    }

    toggleTheme() {
        const themeName = this.state.themeName;

        // dark => blue => colored => light => dark
        const newThemeName =
            themeName === 'dark'
                ? 'blue'
                : themeName === 'blue'
                  ? 'colored'
                  : themeName === 'colored'
                    ? 'light'
                    : 'dark';

        Utils.setThemeName(newThemeName);

        const _theme = Theme(newThemeName);

        this.setState(
            {
                theme: _theme,
                themeName: _theme.name,
                themeType: _theme.palette.type,
            },
            () => this.props.onThemeChange(_theme.name),
        );
    }

    showError(text) {
        this.setState({ errorText: text });
    }

    renderError() {
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

    static buildPresetTree(presets, emptyFolders) {
        // console.log(presets);
        presets = Object.values(presets);

        const presetFolders = {
            subFolders: {},
            presets: {},
            id: '',
            prefix: '',
        };

        // create missing folders
        presets.forEach(preset => {
            const id = preset._id;
            const parts = id.split('.');
            parts.shift();
            parts.shift();
            let currentFolder = presetFolders;
            let prefix = '';
            for (let i = 0; i < parts.length - 1; i++) {
                if (prefix) {
                    prefix = `${prefix}.`;
                }
                prefix += parts[i];
                if (!currentFolder.subFolders[parts[i]]) {
                    currentFolder.subFolders[parts[i]] = {
                        subFolders: {},
                        presets: {},
                        id: parts[i],
                        prefix,
                    };
                }
                currentFolder = currentFolder.subFolders[parts[i]];
            }
            currentFolder.presets[id] = preset;
        });

        if (emptyFolders && emptyFolders.length) {
            emptyFolders.forEach(id => {
                const parts = id.split('.');
                let currentFolder = presetFolders;
                let prefix = '';
                for (let i = 0; i < parts.length; i++) {
                    if (prefix) {
                        prefix += '.';
                    }
                    prefix += parts[i];
                    if (!currentFolder.subFolders[parts[i]]) {
                        currentFolder.subFolders[parts[i]] = {
                            subFolders: {},
                            presets: {},
                            id: parts[i],
                            prefix,
                        };
                    }
                    currentFolder = currentFolder.subFolders[parts[i]];
                }
            });
        }

        return presetFolders;
    }

    getEmptyFolders(presetFolders, _path, _result) {
        _result = _result || [];
        _path = _path || [];
        presetFolders = presetFolders || this.state.presetFolders || {};

        if (
            presetFolders.id /* && !Object.keys(presetFolders.subFolders).length && !Object.keys(presetFolders.presets).length */
        ) {
            const __path = [..._path];
            __path.push(presetFolders.id);
            _result.push(__path.join('.'));
        }

        if (presetFolders.subFolders) {
            Object.keys(presetFolders.subFolders).forEach(name =>
                this.getEmptyFolders(presetFolders.subFolders[name], _path, _result),
            );
        }

        return _result;
    }

    async getAllPresets(newState) {
        newState = newState || {};
        const presets = {};

        const res = await this.socket.getObjectViewSystem('chart', 'echarts.', 'echarts.\u9999');
        res &&
            Object.values(res).forEach(
                preset => preset._id && !preset._id.toString().endsWith('.') && (presets[preset._id] = preset),
            );
        newState.presets = presets;

        // fill missing info
        Object.keys(newState.presets).forEach(id => {
            const presetObj = newState.presets[id];
            presetObj.common = presetObj.common || {};
            presetObj.native = presetObj.native || {};
        });

        // store all empty folders
        const emptyFolders = this.getEmptyFolders();
        newState.presetFolders = App.buildPresetTree(presets, emptyFolders);
        return newState;
    }

    getSnapshot(id) {
        if (iconsCache[id]) {
            const icons = JSON.parse(JSON.stringify(this.state.icons));
            icons[id] = iconsCache[id];
            setTimeout(() => this.setState({ icons }), 50);
            return;
        }

        if (!this.state.alive) {
            const icons = JSON.parse(JSON.stringify(this.state.icons));
            icons[id] = 'error:not alive';
            setTimeout(() => this.setState({ icons }), 50);
            return;
        }

        this.snapShotQueue.push(id);
        if (this.snapShotQueue.length === 1) {
            this.getSnapshotNext();
        }
    }

    getSnapshotNext() {
        if (!this.snapShotQueue.length) {
            if (this.state.forceRefresh) {
                setTimeout(() => this.setState({ forceRefresh: false }), 50);
            }
            return;
        }
        const id = this.snapShotQueue[0];
        this.timeout[id] = setTimeout(() => {
            const icons = JSON.parse(JSON.stringify(this.state.icons));
            icons[id] = 'error:timeout';
            iconsCache[id] = icons[id];
            if (this.snapShotQueue[0] === id) {
                this.snapShotQueue.shift();
            }
            this.setState({ icons });
            this.getSnapshotNext();
        }, 5000);

        this.socket.getRawSocket().emit(
            'sendTo',
            'echarts.0',
            'send',
            {
                preset: id,
                cache: 600 /* 5 minutes */,
                forceRefresh: this.state.forceRefresh,
            },
            data => {
                this.timeout[id] && clearTimeout(this.timeout[id]);
                this.timeout[id] = null;

                const icons = JSON.parse(JSON.stringify(this.state.icons));
                if (data.error) {
                    icons[id] = `error:${data.error}`;
                } else {
                    icons[id] = data.data;
                }
                iconsCache[id] = icons[id];
                if (this.snapShotQueue[0] === id) {
                    this.snapShotQueue.shift();
                }
                this.setState({ icons });
                this.getSnapshotNext();
            },
        );
    }

    renderFolder(parent) {
        const reactItems = [];
        if (this.state.location.length > 1) {
            reactItems.push(
                <Box
                    component="div"
                    style={styles.button}
                    key="__back__"
                    onClick={() => {
                        const location = [...this.state.location];
                        location.pop();
                        window.location.hash = `#${location.join('/')}`;
                    }}
                    sx={styles.folderIcon}
                >
                    <KeyboardReturn />
                    <div style={styles.folderName}>{I18n.t('back')}</div>
                </Box>,
            );
        }

        if (parent.subFolders && Object.keys(parent.subFolders).length) {
            Object.keys(parent.subFolders).forEach(name => {
                if (name === '_consumption_') {
                    return;
                }
                reactItems.push(
                    <Box
                        component="div"
                        style={styles.button}
                        // style={{ width: this.state.iconSize }}
                        key={name}
                        onClick={() => {
                            const location = [...this.state.location];
                            location.push(name);
                            window.location.hash = `#${location.join('/')}`;
                        }}
                        sx={styles.folderIcon}
                    >
                        <IconFolderClosed />
                        <div style={styles.folderName}>{name}</div>
                    </Box>,
                );
            });
        }

        if (parent.presets && Object.keys(parent.presets).length) {
            const parts = window.location.pathname.split('/');
            parts.pop();
            parts.pop();
            if (this.isWeb) {
                // goto from /echarts/preview/index.html to /echarts/index.html
                parts.push('index.html');
            } else {
                // goto from /adapter/echarts/preview/index.html to /adapter/echarts/chart/index.html
                parts.push('chart/index.html');
            }

            let instances;
            if (this.state.webInstances.find(i => i.enabled)) {
                instances = this.state.webInstances.filter(i => i.enabled);
            } else {
                instances = this.state.webInstances;
            }

            const webUrls = instances.map(inst => ({
                url: `${inst.protocol}${inst.bind === '0.0.0.0' ? window.location.hostname : inst.bind}:${inst.port}/echarts/index.html?preset=`,
                port: inst.port,
            }));

            reactItems.push(
                <div
                    key="br"
                    style={styles.break}
                />,
            );
            Object.keys(parent.presets).forEach(name => {
                const preset = parent.presets[name];
                if (!this.state.icons[preset._id]) {
                    this.getSnapshot(preset._id);
                }

                reactItems.push(
                    <div
                        key={name}
                        style={{ ...styles.button, width: this.state.iconSize }}
                        onClick={e => {
                            if (webUrls.length > 1) {
                                this.setState({
                                    webMenu: {
                                        id: preset._id,
                                        webUrls,
                                        copy: false,
                                        anchorEl: e.currentTarget,
                                    },
                                });
                            } else {
                                window.open(webUrls[0].url + preset._id, preset._id);
                            }
                        }}
                    >
                        {this.state.icons[preset._id] ? (
                            this.state.icons[preset._id].startsWith('error:') ? (
                                <ImageNotSupported style={styles.presetIcon} />
                            ) : (
                                <img
                                    style={styles.presetIcon}
                                    src={this.state.icons[preset._id]}
                                    alt={preset._id}
                                />
                            )
                        ) : (
                            <CircularProgress style={styles.presetIcon} />
                        )}

                        <div style={styles.presetName}>{preset.common.name}</div>
                        {this.state.icons[preset._id] && this.state.icons[preset._id].startsWith('error:') ? (
                            <div style={styles.presetError}>{this.state.icons[preset._id].substring(6)}</div>
                        ) : null}
                        <IconButton
                            size="small"
                            title={I18n.t('Copy URL to clipboard')}
                            style={styles.copyButton}
                            onClick={e => {
                                e.stopPropagation();
                                if (webUrls.length > 1) {
                                    this.setState({
                                        webMenu: {
                                            id: preset._id,
                                            webUrls,
                                            copy: true,
                                            anchorEl: e.currentTarget,
                                        },
                                    });
                                } else {
                                    this.onCopyUrl(webUrls[0].url + preset._id);
                                }
                            }}
                        >
                            <ContentCopy />
                        </IconButton>
                    </div>,
                );
            });
        }

        return reactItems;
    }

    onCopyUrl(url) {
        this.toastTimeout && clearTimeout(this.toastTimeout);
        Utils.copyToClipboard(url);
        this.setState({ toast: `${I18n.t('URL copied to clipboard')}: ${url}` });
        this.toastTimeout = setTimeout(() => {
            this.toastTimeout = null;
            this.setState({ toast: '' });
        }, 4000);
    }

    getFolder(location, parent, _index) {
        _index = _index || 0;
        parent = parent || this.state.presetFolders;
        if (!parent) {
            return this.state.presetFolders;
        }

        if (parent.id !== location[_index]) {
            return this.state.presetFolders;
        }

        if (location.length - 1 === _index) {
            if (parent.id === location[_index]) {
                return parent;
            }
            return this.state.presetFolders;
        }

        if (parent.subFolders[location[_index + 1]]) {
            return this.getFolder(location, parent.subFolders[location[_index + 1]], _index + 1);
        }

        return this.state.presetFolders;
    }

    renderSlider() {
        if (this.state.showSlider) {
            return (
                <Stack
                    spacing={2}
                    direction="row"
                    style={{ width: 200 }}
                    alignItems="center"
                >
                    <span>{this.state.iconSize}</span>
                    <Photo style={{ width: 14, height: 14, marginLeft: 4 }} />
                    <Slider
                        min={64}
                        max={512}
                        style={styles.slider}
                        value={this.state.iconSize}
                        onChange={(e, iconSize) => {
                            window.localStorage.setItem('echarts.iconSize', iconSize.toString());
                            this.setState({ iconSize });
                        }}
                    />
                    <Photo style={{ width: 24, height: 24 }} />
                </Stack>
            );
        }
        return null;
    }

    /**
     * Renders the toast.
     * @returns {JSX.Element | null} The JSX element.
     */
    renderToast() {
        if (!this.state.toast) {
            return null;
        }

        return (
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                open={!0}
                autoHideDuration={6000}
                onClose={() => this.setState({ toast: '' })}
                ContentProps={{ 'aria-describedby': 'message-id' }}
                message={<span id="message-id">{this.state.toast}</span>}
                action={[
                    <IconButton
                        key="close"
                        aria-label="Close"
                        color="inherit"
                        style={styles.close}
                        onClick={() => this.setState({ toast: '' })}
                        size="large"
                    >
                        <IconClose />
                    </IconButton>,
                ]}
            />
        );
    }

    renderWebMenu() {
        if (!this.state.webMenu) {
            return null;
        }
        return (
            <Menu
                anchorEl={this.state.webMenu.anchorEl}
                open={!0}
                onClose={() => this.setState({ webMenu: null })}
            >
                {this.state.webMenu.webUrls.map(inst => (
                    <MenuItem
                        onClick={() => {
                            if (this.state.webMenu.copy) {
                                this.onCopyUrl(inst.url + this.state.webMenu.id);
                            } else {
                                window.open(inst.url + this.state.webMenu.id, this.state.webMenu.id);
                            }
                            this.setState({ webMenu: null });
                        }}
                    >
                        :{inst.port}
                    </MenuItem>
                ))}
            </Menu>
        );
    }

    render() {
        if (!this.state.connected) {
            return (
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <Loader themeType={this.state.themeType} />
                    </ThemeProvider>
                </StyledEngineProvider>
            );
        }

        const folder = this.getFolder(this.state.location);
        const location = [];

        return (
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <AppBar
                        position="static"
                        style={styles.appBar}
                    >
                        <Toolbar variant="dense">
                            {this.isWeb ? null : (
                                <IconButton
                                    title={I18n.t('Back to editor')}
                                    onClick={() => {
                                        const parts = window.location.pathname.split('/');
                                        parts.pop();
                                        parts.pop();
                                        parts.push('tab.html');
                                        window.location = `${window.location.protocol}//${window.location.host}${parts.join('/')}`;
                                    }}
                                >
                                    <ArrowCircleLeft />
                                </IconButton>
                            )}
                            <img
                                src={logo}
                                alt="echarts"
                                style={{ width: 32, marginRight: 8 }}
                            />
                            <Breadcrumbs aria-label="breadcrumb">
                                {this.state.location.map((name, i) => {
                                    location.push(name);
                                    return (
                                        <Link
                                            key={i}
                                            underline={this.state.location.length - 1 === i ? 'none' : 'hover'}
                                            color="inherit"
                                            href={`#${location.join('/')}`}
                                        >
                                            {name || I18n.t('root')}
                                        </Link>
                                    );
                                })}
                            </Breadcrumbs>
                            <div style={{ flexGrow: 1 }} />
                            {this.renderSlider()}
                            <IconButton
                                onClick={() => this.setState({ showSlider: !this.state.showSlider })}
                                title={I18n.t('Change size')}
                                sx={this.state.showSlider ? styles.active : undefined}
                            >
                                {this.state.showSlider ? <ImageNotSupported /> : <AddPhotoAlternate />}
                            </IconButton>
                            <IconButton
                                onClick={() => {
                                    Object.keys(iconsCache).forEach(key => {
                                        delete iconsCache[key];
                                    });
                                    this.setState({ icons: {}, forceRefresh: true });
                                }}
                                title={I18n.t('Refresh snapshots')}
                            >
                                <Refresh />
                            </IconButton>
                            {this.isWeb ? (
                                <ToggleThemeMenu
                                    toggleTheme={() => this.toggleTheme()}
                                    themeName={this.state.themeName}
                                    t={I18n.t}
                                />
                            ) : null}
                            <h4 style={styles.toolbarTitle}>Echarts viewer</h4>
                        </Toolbar>
                    </AppBar>
                    <Box
                        component="div"
                        sx={styles.root}
                    >
                        {folder && this.renderFolder(folder)}
                    </Box>
                    {this.renderError()}
                    {this.renderToast()}
                    {this.renderWebMenu()}
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}

export default withWidth()(App);
