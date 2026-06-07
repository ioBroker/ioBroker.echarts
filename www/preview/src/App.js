import React, { Component } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { Breadcrumbs, Link, Toolbar, AppBar, IconButton, Stack, Slider, Snackbar, Menu, MenuItem, Box, LinearProgress, } from '@mui/material';
import { FaFolder as IconFolderClosed } from 'react-icons/fa';
import { ImageNotSupported, KeyboardReturn, Photo, AddPhotoAlternate, ContentCopy, Refresh, ArrowCircleLeft, Close as IconClose, } from '@mui/icons-material';
import { Loader, I18n, Utils, Error as DialogError, Theme, ToggleThemeMenu, Connection, PROGRESS, } from '@iobroker/adapter-react-v5';
import '@iobroker/adapter-react-v5/build/index.css';
import logo from './assets/echarts.svg';
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
const styles = {
    root: (theme) => ({
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
    folderIcon: (theme) => ({
        '& svg': {
            width: 'calc(100% - 28px)',
            height: 'auto',
            color: theme.palette.primary.main,
        },
    }),
    active: (theme) => ({
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
class App extends Component {
    adminCorrectTimeout = null;
    isWeb;
    socket;
    timeout = {};
    snapShotQueue = [];
    toastTimeout = null;
    iconsCache = {};
    isMounted_ = false;
    aliveSubscribed = false;
    static ICONS_CACHE_LIMIT = 200;
    constructor(props) {
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
            iconSize: (() => {
                const parsed = parseInt(window.localStorage.getItem('echarts.iconSize') || '', 10);
                return Number.isFinite(parsed) && parsed >= 64 ? parsed : 128;
            })(),
            showSlider: false,
            alive: false,
            toast: '',
            webInstances: [],
            webMenu: null,
            forceRefresh: false,
            presets: null,
            errorText: null,
            done: false,
            currentInstance: '',
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
        Object.keys(translations).forEach(lang => Object.assign(translations[lang], ownTranslations[lang]));
        I18n.setTranslations(translations);
        if (window.socketUrl && window.socketUrl.startsWith(':')) {
            window.socketUrl = `${window.location.protocol}//${window.location.hostname}${window.socketUrl}`;
        }
        // some people use invalid URL to access charts
        if (window.location.port === '8082' && window.location.pathname.includes('/adapter/echarts/preview/')) {
            this.adminCorrectTimeout = setTimeout(() => {
                this.adminCorrectTimeout = null;
                // The address is wrong. Navigate to /echarts/index.html
                window.location.href = window.location.href.replace('/adapter/echarts/preview/', '/echarts/preview/');
            }, 2000);
        }
        this.isWeb = Connection.isWeb();
        this.socket = new Connection({
            name: window.adapterName,
            onProgress: progress => {
                if (progress === PROGRESS.CONNECTING) {
                    this.setState({ connected: false });
                }
                else {
                    this.setState({ connected: true });
                }
            },
            onReady: async () => {
                if (this.adminCorrectTimeout) {
                    clearTimeout(this.adminCorrectTimeout);
                    this.adminCorrectTimeout = null;
                }
                this.socket.getRawSocket().emit('getCurrentInstance', (_err, instance) => {
                    if (!this.isMounted_) {
                        return;
                    }
                    this.setState({ currentInstance: instance || '' });
                });
                I18n.setLanguage(this.socket.systemLang);
                const state = await this.socket
                    .getState('system.adapter.echarts.0.alive')
                    .catch(() => null); // ignore error
                if (!this.isMounted_) {
                    return;
                }
                this.setState({ alive: !!state?.val });
                // Track adapter alive state so snapshots recover when echarts.0 comes back up
                try {
                    await this.socket.subscribeState('system.adapter.echarts.0.alive', this.onAliveChanged);
                    this.aliveSubscribed = true;
                }
                catch (e) {
                    console.warn(`Cannot subscribe to alive state: ${e instanceof Error ? e.message : String(e)}`);
                }
                const webInstances = await this.getWebInstances();
                if (!this.isMounted_) {
                    return;
                }
                this.setState({ webInstances });
                const newState = await this.getAllPresets();
                if (!this.isMounted_) {
                    return;
                }
                this.setState(newState);
            },
            onError: err => {
                console.error(err);
                this.showError(err);
            },
        });
        window.addEventListener('hashchange', this.onHashChanged);
    }
    async getWebInstances() {
        const instances = await this.socket.getObjectViewSystem('instance', 'system.adapter.web.', 'system.adapter.web.\u9999');
        return Object.keys(instances).map(id => {
            const obj = instances[id];
            return {
                port: obj.native.port,
                bind: obj.native.bind,
                id: obj._id.replace('system.adapter.', ''),
                enabled: !!obj.common.enabled,
                protocol: obj.native.secure ? 'https://' : 'http://',
            };
        });
    }
    componentDidMount() {
        this.isMounted_ = true;
        window.addEventListener('message', this.onReceiveMessage, false);
        this.requestMissingSnapshots();
    }
    componentDidUpdate() {
        this.requestMissingSnapshots();
    }
    requestMissingSnapshots() {
        if (!this.state.presetFolders) {
            return;
        }
        const folder = this.getFolder(this.state.location);
        if (!folder?.presets) {
            return;
        }
        Object.keys(folder.presets).forEach(name => {
            const preset = folder.presets[name];
            if (preset?._id && !this.state.icons[preset._id] && !this.snapShotQueue.includes(preset._id)) {
                this.getSnapshot(preset._id);
            }
        });
    }
    componentWillUnmount() {
        this.isMounted_ = false;
        window.removeEventListener('message', this.onReceiveMessage, false);
        window.removeEventListener('hashchange', this.onHashChanged);
        if (this.adminCorrectTimeout) {
            clearTimeout(this.adminCorrectTimeout);
            this.adminCorrectTimeout = null;
        }
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
            this.toastTimeout = null;
        }
        // cancel all pending snapshot timeouts
        Object.keys(this.timeout).forEach(id => {
            if (this.timeout[id]) {
                clearTimeout(this.timeout[id]);
                this.timeout[id] = null;
            }
        });
        this.snapShotQueue = [];
        if (this.aliveSubscribed) {
            this.socket.unsubscribeState('system.adapter.echarts.0.alive', this.onAliveChanged);
            this.aliveSubscribed = false;
        }
    }
    onAliveChanged = (_id, state) => {
        const aliveNow = !!state?.val;
        if (this.state.alive !== aliveNow) {
            this.setState({ alive: aliveNow }, () => {
                if (this.state.alive && !this.state.done) {
                    const icons = { ...this.state.icons };
                    let changed = false;
                    Object.keys(icons).forEach(id => {
                        if (icons[id] === 'error:not alive') {
                            changed = true;
                            delete icons[id];
                        }
                    });
                    if (changed) {
                        this.setState({ icons });
                    }
                }
            });
        }
    };
    onReceiveMessage = (message) => {
        // Only accept theme updates from same-origin (e.g. parent admin frame)
        if (message?.origin && message.origin !== window.location.origin) {
            return;
        }
        if (message?.data === 'updateTheme') {
            const newThemeName = Utils.getThemeName();
            const theme = App.createTheme(newThemeName);
            this.setState({
                theme,
                themeName: App.getThemeName(theme),
                themeType: App.getThemeType(theme),
            });
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
     *
     * @param name Theme name
     */
    static createTheme(name) {
        return Theme(Utils.getThemeName(name));
    }
    /**
     * Get the theme name
     *
     * @param theme Theme
     */
    static getThemeName(theme) {
        return theme.name;
    }
    /**
     * Get the theme type
     *
     * @param theme Theme
     */
    static getThemeType(theme) {
        return theme.palette.mode;
    }
    toggleTheme() {
        const themeName = this.state.themeName;
        // dark => blue => colored => light => dark
        const newThemeName = themeName === 'dark' ? 'light' : 'dark';
        Utils.setThemeName(newThemeName);
        const theme = Theme(newThemeName);
        this.setState({
            theme,
            themeName: theme.name,
            themeType: theme.palette.mode,
        });
    }
    showError(text) {
        this.setState({ errorText: text });
    }
    renderError() {
        if (!this.state.errorText) {
            return null;
        }
        return (React.createElement(DialogError, { text: this.state.errorText, onClose: () => this.setState({ errorText: '' }) }));
    }
    static buildPresetTree(presets, emptyFolders) {
        const aPresets = Object.values(presets);
        const presetFolders = {
            subFolders: {},
            presets: {},
            id: '',
            prefix: '',
        };
        // create missing folders
        aPresets.forEach(preset => {
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
        if (emptyFolders?.length) {
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
        if (presetFolders.id /* && !Object.keys(presetFolders.subFolders).length && !Object.keys(presetFolders.presets).length */) {
            const __path = [..._path];
            __path.push(presetFolders.id);
            _result.push(__path.join('.'));
        }
        if (presetFolders.subFolders) {
            Object.keys(presetFolders.subFolders).forEach(name => this.getEmptyFolders(presetFolders.subFolders[name], _path, _result));
        }
        return _result;
    }
    async getAllPresets(newState) {
        newState = newState || {};
        const presets = {};
        const res = await this.socket.getObjectViewSystem('chart', 'echarts.', 'echarts.\u9999');
        if (res) {
            Object.values(res).forEach(preset => {
                if (preset?._id && !preset._id.toString().endsWith('.')) {
                    presets[preset._id] = preset;
                }
            });
        }
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
    cacheIcon(id, value) {
        // Bounded cache: drop the oldest entries when the limit is reached
        const keys = Object.keys(this.iconsCache);
        if (keys.length >= App.ICONS_CACHE_LIMIT && !this.iconsCache[id]) {
            delete this.iconsCache[keys[0]];
        }
        this.iconsCache[id] = value;
    }
    getSnapshot(id) {
        if (this.iconsCache[id]) {
            const icons = { ...this.state.icons };
            icons[id] = this.iconsCache[id];
            this.setState({ icons });
            return;
        }
        if (!this.state.alive) {
            const icons = { ...this.state.icons };
            icons[id] = 'error:not alive';
            this.setState({ icons });
            return;
        }
        this.snapShotQueue.push(id);
        if (this.snapShotQueue.length === 1) {
            this.getSnapshotNext();
        }
    }
    getSnapshotNext() {
        if (!this.isMounted_) {
            return;
        }
        if (!this.snapShotQueue.length) {
            if (this.state.forceRefresh) {
                this.setState({ forceRefresh: false });
            }
            return;
        }
        const id = this.snapShotQueue[0];
        this.timeout[id] = setTimeout(() => {
            this.timeout[id] = null;
            if (!this.isMounted_) {
                return;
            }
            const icons = { ...this.state.icons };
            if (!icons[id]) {
                icons[id] = 'error:timeout';
            }
            this.cacheIcon(id, icons[id]);
            if (this.snapShotQueue[0] === id) {
                this.snapShotQueue.shift();
            }
            this.setState({ icons, done: true });
            this.getSnapshotNext();
        }, 5000);
        this.socket.getRawSocket().emit('sendTo', 'echarts.0', 'send', {
            preset: id,
            cache: 600 /* 5 minutes */,
            forceRefresh: this.state.forceRefresh,
        }, (result) => {
            if (this.timeout[id]) {
                clearTimeout(this.timeout[id]);
                this.timeout[id] = null;
            }
            if (!this.isMounted_) {
                return;
            }
            const icons = { ...this.state.icons };
            if (result.error) {
                icons[id] = `error:${result.error}`;
            }
            else {
                icons[id] = result.data;
            }
            this.cacheIcon(id, icons[id]);
            if (this.snapShotQueue[0] === id) {
                this.snapShotQueue.shift();
            }
            this.setState({ icons, done: true });
            this.getSnapshotNext();
        });
    }
    renderFolder(parent) {
        const reactItems = [];
        if (this.state.location.length > 1) {
            reactItems.push(React.createElement(Box, { component: "div", style: styles.button, key: "__back__", onClick: () => {
                    const location = [...this.state.location];
                    location.pop();
                    window.location.hash = `#${location.join('/')}`;
                }, sx: styles.folderIcon },
                React.createElement(KeyboardReturn, null),
                React.createElement("div", { style: styles.folderName }, I18n.t('back'))));
        }
        if (parent.subFolders && Object.keys(parent.subFolders).length) {
            Object.keys(parent.subFolders).forEach(name => {
                if (name === '_consumption_') {
                    return;
                }
                reactItems.push(React.createElement(Box, { component: "div", style: styles.button, key: name, onClick: () => {
                        const location = [...this.state.location];
                        location.push(name);
                        window.location.hash = `#${location.join('/')}`;
                    }, sx: styles.folderIcon },
                    React.createElement(IconFolderClosed, null),
                    React.createElement("div", { style: styles.folderName }, name)));
            });
        }
        if (parent.presets && Object.keys(parent.presets).length) {
            const parts = window.location.pathname.split('/');
            parts.pop();
            parts.pop();
            if (this.isWeb) {
                // goto from /echarts/preview/index.html to /echarts/index.html
                parts.push('index.html');
            }
            else {
                // goto from /adapter/echarts/preview/index.html to /adapter/echarts/chart/index.html
                parts.push('chart/index.html');
            }
            let instances;
            if (this.state.webInstances.find(i => i.enabled) || this.state.currentInstance.startsWith('admin.')) {
                instances = this.state.webInstances.filter(i => i.enabled);
            }
            else {
                // Just take all if no one enabled
                instances = this.state.webInstances;
            }
            const webUrls = instances.map(inst => ({
                url: `${inst.protocol}${inst.bind === '0.0.0.0' ? window.location.hostname : inst.bind}:${inst.port}/echarts/index.html?preset=`,
                port: inst.port,
            }));
            if (this.state.currentInstance.startsWith('admin.')) {
                webUrls.unshift({
                    url: '../chart/index.html?preset=',
                    port: window.location.port,
                });
            }
            reactItems.push(React.createElement("div", { key: "br", style: styles.break }));
            Object.keys(parent.presets).forEach(name => {
                const preset = parent.presets[name];
                // Snapshot fetching is triggered in componentDidUpdate, not during render
                reactItems.push(React.createElement("div", { key: name, style: { ...styles.button, width: this.state.iconSize }, onClick: e => {
                        if (webUrls.length > 1) {
                            this.setState({
                                webMenu: {
                                    id: preset._id,
                                    webUrls,
                                    copy: false,
                                    anchorEl: e.currentTarget,
                                },
                            });
                        }
                        else {
                            window.open(webUrls[0].url + preset._id, preset._id);
                        }
                    } },
                    this.state.icons[preset._id] ? (this.state.icons[preset._id].startsWith('error:') ? (React.createElement(ImageNotSupported, { style: styles.presetIcon })) : (React.createElement("img", { style: styles.presetIcon, src: this.state.icons[preset._id], alt: preset._id }))) : (React.createElement(LinearProgress, { style: styles.presetIcon })),
                    React.createElement("div", { style: styles.presetName }, typeof preset.common.name === 'object'
                        ? preset.common.name[I18n.getLanguage()] || preset.common.name.en || ''
                        : preset.common.name),
                    this.state.icons[preset._id] && this.state.icons[preset._id].startsWith('error:') ? (React.createElement("div", { style: styles.presetError }, this.state.icons[preset._id].substring(6))) : null,
                    React.createElement(IconButton, { size: "small", title: I18n.t('Copy URL to clipboard'), style: styles.copyButton, onClick: e => {
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
                            }
                            else {
                                this.onCopyUrl(webUrls[0].url + preset._id);
                            }
                        } },
                        React.createElement(ContentCopy, null))));
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
            return (React.createElement(Stack, { spacing: 2, direction: "row", style: { width: 200 }, alignItems: "center" },
                React.createElement("span", null, this.state.iconSize),
                React.createElement(Photo, { style: { width: 14, height: 14, marginLeft: 4 } }),
                React.createElement(Slider, { min: 64, max: 512, style: styles.slider, value: this.state.iconSize, onChange: (_e, iconSize) => {
                        window.localStorage.setItem('echarts.iconSize', iconSize.toString());
                        this.setState({ iconSize });
                    } }),
                React.createElement(Photo, { style: { width: 24, height: 24 } })));
        }
        return null;
    }
    /**
     * Renders the toast.
     */
    renderToast() {
        if (!this.state.toast) {
            return null;
        }
        return (React.createElement(Snackbar, { anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
            }, open: true, autoHideDuration: 6000, onClose: () => this.setState({ toast: '' }), ContentProps: { 'aria-describedby': 'message-id' }, message: React.createElement("span", { id: "message-id" }, this.state.toast), action: [
                React.createElement(IconButton, { key: "close", "aria-label": "Close", color: "inherit", onClick: () => this.setState({ toast: '' }), size: "large" },
                    React.createElement(IconClose, null)),
            ] }));
    }
    renderWebMenu() {
        if (!this.state.webMenu) {
            return null;
        }
        return (React.createElement(Menu, { anchorEl: this.state.webMenu.anchorEl, open: true, onClose: () => this.setState({ webMenu: null }) }, this.state.webMenu.webUrls.map(inst => (React.createElement(MenuItem, { key: `${inst.url}-${inst.port}`, onClick: () => {
                if (this.state.webMenu.copy) {
                    this.onCopyUrl(inst.url + this.state.webMenu.id);
                }
                else {
                    window.open(inst.url + this.state.webMenu.id, this.state.webMenu.id);
                }
                this.setState({ webMenu: null });
            } },
            ":",
            inst.port)))));
    }
    render() {
        if (!this.state.connected) {
            return (React.createElement(StyledEngineProvider, { injectFirst: true },
                React.createElement(ThemeProvider, { theme: this.state.theme },
                    React.createElement(Loader, { themeType: this.state.themeType }))));
        }
        const folder = this.getFolder(this.state.location);
        const location = [];
        return (React.createElement(StyledEngineProvider, { injectFirst: true },
            React.createElement(ThemeProvider, { theme: this.state.theme },
                React.createElement(AppBar, { position: "static", style: styles.appBar },
                    React.createElement(Toolbar, { variant: "dense" },
                        this.isWeb ? null : (React.createElement(IconButton, { title: I18n.t('Back to editor'), onClick: () => {
                                const parts = window.location.pathname.split('/');
                                parts.pop();
                                parts.pop();
                                parts.push('tab.html');
                                window.location.href = `${window.location.protocol}//${window.location.host}${parts.join('/')}`;
                            } },
                            React.createElement(ArrowCircleLeft, null))),
                        React.createElement("img", { src: logo, alt: "echarts", style: { width: 32, marginRight: 8 } }),
                        React.createElement(Breadcrumbs, { "aria-label": "breadcrumb" }, this.state.location.map((name, i) => {
                            location.push(name);
                            return (React.createElement(Link, { key: i, underline: this.state.location.length - 1 === i ? 'none' : 'hover', color: "inherit", href: `#${location.join('/')}` }, name || I18n.t('root')));
                        })),
                        React.createElement("div", { style: { flexGrow: 1 } }),
                        this.renderSlider(),
                        React.createElement(IconButton, { onClick: () => this.setState({ showSlider: !this.state.showSlider }), title: I18n.t('Change size'), sx: this.state.showSlider ? styles.active : undefined }, this.state.showSlider ? React.createElement(ImageNotSupported, null) : React.createElement(AddPhotoAlternate, null)),
                        React.createElement(IconButton, { style: { color: this.state.alive ? '#0F0' : '#FF0' }, onClick: () => {
                                Object.keys(this.iconsCache).forEach(key => {
                                    delete this.iconsCache[key];
                                });
                                this.setState({ icons: {}, forceRefresh: true });
                            }, title: this.state.alive
                                ? I18n.t('Refresh snapshots')
                                : `${I18n.t('Refresh snapshots')}, ${I18n.t('but instance is offline')}` },
                            React.createElement(Refresh, null)),
                        this.isWeb && this.state.themeName !== 'PT' && this.state.themeName !== 'DX' ? (React.createElement(ToggleThemeMenu, { toggleTheme: () => this.toggleTheme(), themeName: this.state.themeName, t: I18n.t })) : null,
                        React.createElement("h4", { style: styles.toolbarTitle }, I18n.t('Echarts viewer')))),
                React.createElement(Box, { component: "div", sx: styles.root }, folder ? this.renderFolder(folder) : null),
                this.renderError(),
                this.renderToast(),
                this.renderWebMenu())));
    }
}
export default App;
//# sourceMappingURL=App.js.map