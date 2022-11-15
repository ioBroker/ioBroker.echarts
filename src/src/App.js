import React from 'react';
import { withStyles, withTheme } from '@mui/styles';
import clsx from 'clsx';
import SplitterLayout from 'react-splitter-layout';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { StylesProvider, createGenerateClassName } from '@mui/styles';
import { DragDropContext } from 'react-beautiful-dnd';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';

// icons
import { MdClose as IconCancel } from 'react-icons/md';
import { MdSave as IconSave } from 'react-icons/md';
import { MdMenu as IconMenuClosed } from 'react-icons/md';
import { MdArrowBack as IconMenuOpened } from 'react-icons/md';

import 'react-splitter-layout/lib/index.css';

import GenericApp from '@iobroker/adapter-react-v5/GenericApp';
import Loader from '@iobroker/adapter-react-v5/Components/Loader'
import I18n from '@iobroker/adapter-react-v5/i18n';
import '@iobroker/adapter-react-v5/index.css';
import Utils from '@iobroker/adapter-react-v5/Components/Utils';
import { withWidth } from '@iobroker/adapter-react-v5';

import SettingsEditor from './SettingsEditor';
import MainChart from './MainChart';
import getUrlQuery from './utils/getUrlQuery';
import DefaultPreset from './Components/DefaultPreset';
import MenuList from './MenuList';
import flotConverter from './utils/flotConverter';

const generateClassName = createGenerateClassName({
    productionPrefix: 'iob-app',
});

const styles = theme => ({
    root: {
        flexGrow: 1,
        display: 'flex',
        width: '100%',
        height: '100%',
        background: theme.palette.background.default,
        color: theme.palette.text.primary,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    menuDiv: {
        overflow: 'hidden',
    },
    splitterDivs: {
        '&>div': {
            overflow: 'hidden',
            width: '100%',
            height: '100%',
        },
        '& .layout-splitter': {
            background: theme.type === 'dark' ? '#595858' : '#ccc;'
        }
    },
    content: {
        width: '100%',
        height: '100%',
        backgroundColor: theme.palette.background.default,
        position: 'relative'
    },
    menuDivWithoutMenu: {
        '&>div:first-child': {
            display: 'none'
        },
        '&>.layout-splitter': {
            display: 'none'
        },
    },
    progress: {
        margin: 100
    },
    menuOpenCloseButton: {
        position: 'absolute',
        left: 0,
        borderRadius: '0 5px 5px 0',
        top: 6,
        paddingTop: 8,
        cursor: 'pointer',
        zIndex: 1,
        height: 25,
        width: 20,
        background: theme.palette.secondary.main,
        color: theme.palette.primary.main,
        paddingLeft: 3,
        '&:hover': {
            color: 'white'
        }
    },
    buttonsContainer: {
        '& button': {
            whiteSpace: 'nowrap'
        }
    },
});

const FORBIDDEN_CHARS = /[.\][*,;'"`<>\\?]/g;

function loadChartParam(name, defaultValue) {
    return window.localStorage.getItem(`App.echarts.__${name}`) ? window.localStorage.getItem(`App.echarts.__${name}`) : defaultValue;
}

function parseHash() {
    if (window.location.hash) {
        const result = {};
        window.location.hash
            .replace(/^#/, '')
            .split('&')
            .forEach(line => {
                const [name, val] = line.split('=');
                result[name] = window.decodeURIComponent(val);
                if (name === 'instance' && !result[name].startsWith('system.adapter')) {
                    result[name] = `system.adapter.${result[name]}`;
                }
            });
        return result;
    } else {
        return null;
    }
}

class App extends GenericApp {
    constructor(props) {
        let settings = { socket: {} };
        const query = getUrlQuery();
        settings.socket.port = query.port || (parseInt(window.location.port) >= 3000 && parseInt(window.location.port) <= 3020 ? 8081 : window.location.port);
        settings.socket.host = query.host || window.location.hostname;
        settings.translations = {
            'en': require('./i18n/en'),
            'de': require('./i18n/de'),
            'es': require('./i18n/es'),
            'fr': require('./i18n/fr'),
            'it': require('./i18n/it'),
            'nl': require('./i18n/nl'),
            'pl': require('./i18n/pl'),
            'pt': require('./i18n/pt'),
            'ru': require('./i18n/ru'),
            'uk': require('./i18n/uk'),
            'zh-cn': require('./i18n/zh-cn'),
        };
        settings.sentryDSN = window.sentryDSN;

        super(props, settings);

        this.config = parseHash();
    }

    onHashChanged() {
        super.onHashChanged();
        const config = parseHash();

        if ((config.preset && (this.state.selectedId !== config.preset)) ||
            (config.id && (this.state.selectedId?.id !== config.id || this.state.selectedId?.instance !== config.instance))
        ) {
            this.loadChartOrPreset(config.preset || config, () =>
                this.setState({ scrollToSelect: true }, () =>
                    this.setState({ scrollToSelect: false })));
        }
    }

    onConnectionReady() {
        let selectedId = window.localStorage.getItem('App.echarts.selectedId');
        let presetData = null;

        if (selectedId && typeof selectedId === 'string') {
            try {
                selectedId = JSON.parse(selectedId);
            } catch (e) {
                selectedId = null;
            }
        }

        if (!selectedId && this.config?.preset) {
            selectedId = this.config.preset;
        } else if (!selectedId && this.config?.id) {
            selectedId = { id: this.config.id, instance: this.config.instance };
        }

        const newState = {
            ready: false,
            instances: [],

            selectedId,
            selectedPresetChanged: false,
            presetData,
            originalPresetData: null,
            chartsList: null,
            addPresetDialog: null,
            progress: 0,
            autoSave: window.localStorage.getItem('App.echarts.autoSave') === 'true',

            discardChangesConfirmDialog: false,

            resizing: false,
            menuOpened: window.localStorage.getItem('App.echarts.menuOpened') !== 'false',
            menuSelectId: '',
            logHorzLayout: window.localStorage.getItem('App.echarts.logHorzLayout') === 'true',
        };

        this.settingsSize = window.localStorage ? parseFloat(window.localStorage.getItem('App.echarts.settingsSize')) || 150 : 150;
        this.menuSize = window.localStorage ? parseFloat(window.localStorage.getItem('App.echarts.menuSize')) || 500 : 500;

        this.objects = {};

        this.socket.getSystemConfig()
            .then(systemConfig => {
                newState.systemConfig = systemConfig;
                newState.presetData = DefaultPreset.getDefaultPreset(systemConfig);

                if (this.config && this.config.id) {
                    newState.selectedId = {id: this.config.id, instance: this.config.instance};
                    if (this.config.menuOpened !== undefined) {
                        newState.menuOpened = this.config.menuOpened === 'true' || this.config.menuOpened === true;
                    }
                    this.config = null;
                }

                this.setState(newState);
                return flotConverter(this.socket, this.instance);
            })
            .then(() => this.socket.getAdapterInstances(''))
            // get only history adapters
            .then(instances => instances.filter(entry => entry && entry.common && entry.common.getHistory && entry.common.enabled))
            .then(instances => this.setState({ ready: true, instances }))
            .catch(e => this.onError(e, 'Cannot read system config'));
    }

    getNewPresetName(parentId, prefix, index) {
        index  = index  || (prefix ? '' : '1');
        prefix = prefix || 'preset_';

        return this.socket.getObject(`${this.adapterName}.${this.instance}.${parentId ? `${parentId}.` : ''}${prefix}${index}`)
            .then(obj => {
                if (!obj) {
                    return prefix + index;
                } else {
                    if (!index) {
                        index = 2;
                    } else {
                        index++;
                    }
                    return this.getNewPresetName(parentId, prefix, index);
                }
            })
            .catch(e => prefix + index);
    }

    getUniqueId(id, name, cb, _count) {
        _count = _count || 0;
        const newId = `${id}_${I18n.t('copy')}`;
        const newName = `${name} ${I18n.t('copy')}`;
        this.socket.getObject(newId)
            .then(obj => {
                if (obj) {
                    setTimeout(() => this.getUniqueId(newId, newName, cb, _count + 1));
                } else {
                    cb(null, newId, newName);
                }
            })
            .catch(e => {
                if (_count > 10) {
                    cb(I18n.t('Cannot create unique ID'));
                } else {
                    setTimeout(() => this.getUniqueId(newId, newName, cb, _count + 1));
                }
            })
    }

    onCopyPreset = presetId => {
        this.socket.getObject(presetId)
            .then(obj => {
                this.getUniqueId(presetId, obj.common.name, (err, newId, newName) => {
                    obj._id = newId;
                    obj.common.name = newName;
                    this.socket.setObject(newId, obj)
                        .then(() => this.loadChartOrPreset(newId))
                        .catch(e => this.onError(e, 'Cannot save object'));
                });
            })
            .catch(e => this.onError(e, 'Cannot read object'));
    };

    onCreatePreset = (isFromCurrentSelection, parentId) => {
        if (isFromCurrentSelection === true) {
            let name;

            const chartsList = JSON.parse(JSON.stringify(this.state.chartsList || []));
            if (!chartsList.find(item => item.id === this.state.selectedId.id && item.instance === this.state.selectedId.instance)) {
                chartsList.push(this.state.selectedId);
            }

            // Todo> Detect if all ids are from one enum

            // create from list selectedId
            return new Promise(resolve => {
                if (chartsList.length === 1) {
                    return this.socket.getObject(chartsList[0].id)
                        .then(obj => resolve(obj));
                } else {
                    resolve(null);
                }
            })
                .then(obj => {
                    if (obj) {
                        name = (obj && obj.common && obj.common.name ? Utils.getObjectNameFromObj(obj, null, {language: I18n.getLanguage()}) : '').trim();
                    }

                    return this.getNewPresetName(parentId, name)
                        .then(name => {
                            let template = {
                                common: {
                                    name,
                                    expert: true,
                                },
                                native: {
                                    data: JSON.parse(JSON.stringify(this.state.presetData))
                                },
                                type: 'chart'
                            };
                            let id = `${this.adapterName}.0.${parentId ? `${parentId}.` : ''}${name.replace(FORBIDDEN_CHARS, '_')}`;

                            return this.socket.setObject(id, template)
                                .then(() => this.loadChartOrPreset(id))
                                .catch(e => this.onError(e, 'Cannot save object'));
                        });
                })
                .catch(e => this.onError(e, 'Cannot read object'));

        } else {
            // create empty preset
            return this.getNewPresetName(parentId)
                .then(name => {
                    let template = {
                        common: {
                            name,
                        },
                        native: {
                            url: '',
                            data: DefaultPreset.getDefaultPreset(this.state.systemConfig, null, null, I18n.getLanguage()),
                        },
                        type: 'chart'
                    };

                    let id = `${this.adapterName}.0.${parentId ? `${parentId}.` : ''}${name.replace(FORBIDDEN_CHARS, '_')}`;

                    return this.socket.setObject(id, template)
                        .then(() => this.loadChartOrPreset(id))
                        .catch(e => this.onError(e, 'Cannot save object'));
                })
                .catch(e => this.showError(e));
        }
    };

    onError(e, comment) {
        comment && console.error(comment);
        this.showError(e);
    }

    savePreset = () => {
        if (!this.state.presetData) {
            this.showError(I18n.t('Empty preset cannot be saved!'));
            return Promise.reject();
        } else {
            return this.socket.getObject(this.state.selectedId)
                .then(obj => {
                    if (!obj || !obj.native) {
                        return this.showError(I18n.t('Invalid object'));
                    } else {
                        obj.native.data = this.state.presetData;
                        return this.socket.setObject(obj._id, obj)
                            .then(() => this.setState({ originalPresetData: JSON.stringify(this.state.presetData), selectedPresetChanged: false }))
                            .catch(e => this.onError(e, 'Cannot save object'));
                    }
                })
                .catch(e => this.onError(e, 'Cannot read object'));
        }
    };

    loadChartOrPreset(selectedId, cb) {
        window.localStorage.setItem('App.echarts.selectedId', JSON.stringify(selectedId));

        if (selectedId && typeof selectedId === 'object') {
            // load chart
            const promises = [];
            if (this.state.chartsList) {
                this.state.chartsList.forEach(item => !this.objects[item.id] && promises.push(this.socket.getObject(item.id)));
                !this.objects[selectedId.id] && !this.state.chartsList.find(item => item.id === selectedId.id) && promises.push(this.socket.getObject(selectedId.id));
            } else {
                this.objects = {};
                promises.push(this.socket.getObject(selectedId.id));
            }

            return Promise.all(promises)
                .then(results => {
                    results.forEach(obj => obj && (this.objects[obj._id] = obj));

                    const lines = (this.state.chartsList || []).map(item => DefaultPreset.getDefaultLine(this.state.systemConfig, item.instance, this.objects[item.id], I18n.getLanguage()));

                    (!this.state.chartsList || !this.state.chartsList.find(item => item.id === selectedId.id && item.instance === selectedId.instance)) &&
                        lines.push(DefaultPreset.getDefaultLine(this.state.systemConfig, selectedId.instance, this.objects[selectedId.id], I18n.getLanguage()));

                    // combine same units together: e.g. if line1 and line2 are in percent => use same yAxis
                    if (lines.length > 1) {
                        // Find first non-empty
                        // ignore all booleans
                        const first = lines.find(item => !item.isBoolean);
                        if (first) {
                            const iFirst = lines.indexOf(first);
                            // set it to left
                            first.yaxe = 'left';
                            // find all lines with the same unit and place them to left
                            if (first.unit) {
                                for (let k = iFirst + 1; k < lines.length; k++) {
                                    if (lines[k].unit === first.unit) {
                                        lines[k].commonYAxis = iFirst;
                                    }
                                }
                            }
                            for (let k = iFirst + 1; k < lines.length; k++) {
                                if (lines[k].unit && lines[k].unit !== first.unit) {
                                    lines[k].yaxe = 'right';
                                    // combine all following lines to one axis
                                    for (let j = k + 1; j < lines.length; j++) {
                                        if (lines[k].unit === lines[j].unit && lines[j].commonYAxis === undefined) {
                                            lines[k].commonYAxis = j;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    let presetData = {
                        marks:          [],
                        lines:          lines,
                        zoom:           true,
                        hoverDetail:    true,
                        aggregate:      loadChartParam('aggregate', 'minmax'),
                        chartType:      loadChartParam('chartType', 'auto'),
                        live:           loadChartParam('live', '30'),
                        timeType:       loadChartParam('timeType', 'relative'),
                        aggregateType:  loadChartParam('aggregateType', 'step'),
                        aggregateSpan:  loadChartParam('aggregateSpan', 300),
                        ticks:          loadChartParam('ticks', ''),
                        range:          loadChartParam('range', 1440),
                        relativeEnd:    loadChartParam('relativeEnd', 'now'),
                        start:          loadChartParam('start', ''),
                        end:            loadChartParam('end', ''),
                        start_time:     loadChartParam('start_time', ''),
                        end_time:       loadChartParam('end_time', ''),
                        noBorder:       'noborder',
                        noedit:         false,
                        animation:      0,
                        legend:         lines.length > 1 ? 'nw' : ''
                    };

                    this.setState({
                        presetData,
                        originalPresetData: '',
                        selectedPresetChanged: false,
                        selectedId,
                    }, () => {
                        const hash = `#id=${selectedId.id}&instance=${selectedId.instance.replace(/^system\.adapter\./, '')}`;
                        if (window.location.hash !== hash) {
                            window.location.hash = hash;
                        }
                        cb && cb()
                    });
                })
                .catch(e => this.onError(e, 'Cannot read object'));
        } else if (selectedId) {
            // load preset
            return this.socket.getObject(selectedId)
                .then(obj => {
                    if (obj && obj.native && obj.native.data) {
                        const hash = `#preset=${selectedId}`;
                        if (window.location.hash !== hash) {
                            window.location.hash = hash;
                        }

                        const newState = {
                            presetData: obj.native.data,
                            originalPresetData: JSON.stringify(obj.native.data),
                            selectedPresetChanged: false,
                            selectedId,
                        };

                        this.setState(newState, () => cb && cb());
                    } else {
                        cb && cb();
                    }
                })
                .catch(e => this.onError(e, 'Cannot read object'));
        } else {
            this.setState({
                presetData: null,
                originalPresetData: '',
                selectedPresetChanged: false,
                selectedId: null,
            }, () => cb && cb());
        }
    }

    discardChangesConfirmDialog() {
        return this.state.discardChangesConfirmDialog ? <Dialog
            maxWidth="lg"
            fullWidth={true}
            open={ true }
            key="discardChangesConfirmDialog"
            onClose={ () => this.setState({ discardChangesConfirmDialog: false }, () => this.confirmCB && this.confirmCB(false)) }>
                <DialogTitle>{
                    this.state.discardChangesConfirmDialog === 'chart' ? I18n.t('Are you sure for loading the chart and discard unsaved changes?')
                    : (this.state.discardChangesConfirmDialog === 'preset' ? I18n.t('Are you sure for loading the preset and discard unsaved changes?') :
                        I18n.t('Are you sure for closing folder and discard unsaved changes?'))
                }</DialogTitle>
                <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button
                        color="grey"
                        variant="outlined"
                        onClick={() =>
                            this.setState({ discardChangesConfirmDialog: false }, () =>
                                this.confirmCB && this.confirmCB(true))}
                    >
                            { I18n.t('Load without save')}
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        autoFocus
                        onClick={() => this.savePreset()
                            .then(() => this.setState({ discardChangesConfirmDialog: false }, () =>
                                this.confirmCB && this.confirmCB(true)))}
                        startIcon={<IconSave/>}
                    >

                        { I18n.t('Save current preset and load') }
                    </Button>
                    <Button
                        color="grey"
                        variant="contained"
                        onClick={() => this.setState({ discardChangesConfirmDialog: false }, () =>
                            this.confirmCB && this.confirmCB(false))}
                        startIcon={<IconCancel/>}
                    >
                        { I18n.t('Cancel') }
                    </Button>
                </DialogActions>
            </Dialog> : null;
    };

    renderMain() {
        const {classes} = this.props;
        return [
            <div className={clsx(classes.content, 'iobVerticalSplitter')} key="confirmdialog">
                <div key="confirmdiv" className={classes.menuOpenCloseButton} onClick={() => {
                    window.localStorage && window.localStorage.setItem('App.echarts.menuOpened', this.state.menuOpened ? 'false' : 'true');
                    this.setState({ menuOpened: !this.state.menuOpened, resizing: true });
                    setTimeout(() => this.setState({ resizing: false }), 300);
                }}>
                    {this.state.menuOpened ? <IconMenuOpened /> : <IconMenuClosed />}
                </div>
                <SplitterLayout
                    key="MainSplitter"
                    vertical={!this.state.logHorzLayout}
                    primaryMinSize={100}
                    secondaryInitialSize={this.settingsSize}
                    //customClassName={classes.menuDiv + ' ' + classes.splitterDivWithoutMenu}
                    onDragStart={() => this.setState({ resizing: true })}
                    onSecondaryPaneSizeChange={size => this.settingsSize = parseFloat(size)}
                    onDragEnd={() => {
                        this.setState({ resizing: false });
                        window.localStorage && window.localStorage.setItem('App.echarts.settingsSize', this.settingsSize.toString());
                    }}
                >
                    { this.state.selectedId ? <MainChart
                        key="MainChart"
                        visible={!this.state.resizing}
                        theme={this.state.theme}
                        onChange={presetData => this.setState({ presetData })}
                        presetData={this.state.presetData}
                        selectedId={this.state.selectedId}
                        chartsList={this.state.chartsList}
                        onCreatePreset={this.onCreatePreset}
                        onCopyPreset={this.onCopyPreset}
                    /> : null}
                    {
                        this.state.presetData && this.state.selectedId && typeof this.state.selectedId === 'string' ? <SettingsEditor
                            socket={this.socket}
                            key="Editor"
                            width={window.innerWidth - this.menuSize}
                            theme={this.state.theme}
                            onChange={presetData => {
                                if (this.state.autoSave) {
                                    this.setState({ presetData }, () => this.savePreset());
                                } else {
                                    this.setState({ presetData, selectedPresetChanged: JSON.stringify(presetData) !== this.state.originalPresetData });
                                }
                            }}
                            presetData={this.state.presetData}
                            selectedId={this.state.selectedId}
                            verticalLayout={!this.state.logHorzLayout}
                            onLayoutChange={() => this.toggleLogLayout()}
                            connection={this.socket}
                            instances={this.state.instances}
                            systemConfig={this.state.systemConfig}
                            selectedPresetChanged={this.state.selectedPresetChanged}
                            savePreset={this.savePreset}
                            autoSave={this.state.autoSave}
                            onAutoSave={autoSave => {
                                window.localStorage.setItem('App.echarts.autoSave', autoSave ? 'true' : 'false');
                                if (autoSave && this.state.selectedPresetChanged) {
                                    this.savePreset()
                                        .then(() => this.setState({ autoSave }));
                                } else {
                                    this.setState({ autoSave });
                                }

                            }}
                        /> : null
                    }
                </SplitterLayout>
            </div>
        ];
    }

    onDragEnd = result => {
        const { source, destination, draggableId } = result;
        if (destination && draggableId.includes('***') && source.droppableId === 'Lines') {
            const [instance, stateId] = draggableId.split('***');
            this.socket.getObject(stateId)
                .then(obj => {
                    //const len = this.state.presetData.lines.length;
                    //const color = (obj && obj.common && obj.common.color) || PREDEFINED_COLORS[len % PREDEFINED_COLORS.length];
                    const presetData = JSON.parse(JSON.stringify(this.state.presetData));
                    const newLine = DefaultPreset.getDefaultLine(this.state.systemConfig, instance, obj, I18n.getLanguage());
                    if (!destination) {
                        presetData.lines.push(newLine);
                    } else {
                        presetData.lines.splice(destination.index, 0, newLine);
                    }
                    if (presetData.lines.length > 1) {
                        // combine new unit with existing one
                        if (newLine.unit) {
                            for (let i = 0; i < presetData.lines.length; i++) {
                                if (newLine !== presetData.lines[i] && presetData.lines[i].unit === newLine.unit) {
                                    newLine.commonYAxis = i;
                                    break;
                                }
                            }
                        }
                    }

                    this.setState({ presetData, selectedPresetChanged: JSON.stringify(presetData) !== this.state.originalPresetData });
                })
                .catch(e => this.onError(e, 'Cannot read object'));

        } else if (destination && source.droppableId === destination.droppableId) {
            const presetData = JSON.parse(JSON.stringify(this.state.presetData));
            const [removed] = presetData.lines.splice(source.index, 1);
            presetData.lines.splice(destination.index, 0, removed);
            this.setState({ presetData, selectedPresetChanged: JSON.stringify(presetData) !== this.state.originalPresetData });
        }
    };

    toggleLogLayout() {
        window.localStorage && window.localStorage.setItem('App.echarts.logHorzLayout', this.state.logHorzLayout ? 'false' : 'true');
        this.setState({ logHorzLayout: !this.state.logHorzLayout });
    }

    render() {
        const { classes } = this.props;

        if (!this.state.ready) {
            return <StylesProvider generateClassName={generateClassName}>
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <Loader theme={this.state.themeType}/>
                    </ThemeProvider>
                </StyledEngineProvider>
            </StylesProvider>;
        }

        return <StylesProvider generateClassName={generateClassName}>
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <React.Fragment>
                        <div className={classes.root} key="divSide">
                            <DragDropContext onDragEnd={this.onDragEnd}>
                                <SplitterLayout
                                    key="sidemenuwidth"
                                    vertical={false}
                                    primaryMinSize={300}
                                    primaryIndex={1}
                                    secondaryMinSize={300}
                                    secondaryInitialSize={this.menuSize}
                                    customClassName={clsx(classes.splitterDivs, !this.state.menuOpened ? classes.menuDivWithoutMenu : '')}
                                    onDragStart={() => this.setState({ resizing: true })}
                                    onSecondaryPaneSizeChange={size => this.menuSize = parseFloat(size)}
                                    onDragEnd={() => {
                                        this.setState({ resizing: false });
                                        window.localStorage && window.localStorage.setItem('App.echarts.menuSize', this.menuSize.toString());
                                    }}
                                >
                                    <MenuList
                                        key="menuList"
                                        scrollToSelect={this.state.scrollToSelect}
                                        socket={this.socket}
                                        theme={this.state.theme}
                                        adapterName={this.adapterName}
                                        instances={this.state.instances}
                                        systemConfig={this.state.systemConfig}
                                        onShowToast={toast => this.showToast(toast)}
                                        selectedPresetChanged={this.state.selectedPresetChanged}
                                        chartsList={this.state.chartsList}
                                        selectedId={this.state.selectedId}
                                        onCopyPreset={this.onCopyPreset}
                                        onCreatePreset={this.onCreatePreset}
                                        onChangeList={(chartsList, cb) => {
                                            // if some deselected
                                            let selectedId = this.state.selectedId;
                                            if (chartsList && this.state.chartsList && chartsList.length && chartsList.length < this.state.chartsList.length) {
                                                const removedLine = this.state.chartsList.find(item => !chartsList.find(it => it.id === item.id && it.instance === item.instance));
                                                const index = this.state.chartsList.indexOf(removedLine);
                                                if (this.state.chartsList[index + 1]) {
                                                    selectedId = this.state.chartsList[index + 1];
                                                } else if (this.state.chartsList[index - 1]) {
                                                    selectedId = this.state.chartsList[index - 1];
                                                } else {
                                                    selectedId = chartsList[0];
                                                }
                                            }
                                            this.setState({ chartsList }, () => this.loadChartOrPreset(selectedId, cb));
                                        }}
                                        onSelectedChanged={(selectedId, cb) => {
                                            if (cb && this.state.selectedPresetChanged) {
                                                this.confirmCB = confirmed => {
                                                    if (confirmed) {
                                                        this.loadChartOrPreset(selectedId, () => cb && cb(selectedId));
                                                    } else {
                                                        cb(false); // cancel
                                                    }
                                                    this.confirmCB = null;
                                                };

                                                this.setState({ discardChangesConfirmDialog: selectedId && typeof selectedId === 'object' ? 'chart' : (selectedId ? 'preset' : 'folder') });
                                            } else {
                                                this.loadChartOrPreset(selectedId, () => cb && cb(selectedId));
                                            }
                                        }}
                                    />
                                    {this.renderMain()}
                                </SplitterLayout>
                            </DragDropContext>
                        </div>
                        { this.discardChangesConfirmDialog() }
                        { this.renderError() }
                        { this.renderToast() }
                    </React.Fragment>
                </ThemeProvider>
            </StyledEngineProvider>
        </StylesProvider>;
    }
}

export default withWidth()(withStyles(styles)(withTheme(App)));
