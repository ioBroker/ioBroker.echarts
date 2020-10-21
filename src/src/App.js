import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import { withTheme } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import clsx from 'clsx';
import SplitterLayout from 'react-splitter-layout';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { DragDropContext} from "react-beautiful-dnd";

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';

// icons
import {MdClose as IconCancel} from 'react-icons/md';
import {MdSave as IconSave} from 'react-icons/md';
import {MdMenu as IconMenuClosed} from 'react-icons/md';
import {MdArrowBack as IconMenuOpened} from 'react-icons/md';

import 'react-splitter-layout/lib/index.css';

import GenericApp from '@iobroker/adapter-react/GenericApp';
import Loader from '@iobroker/adapter-react/Components/Loader'
import I18n from '@iobroker/adapter-react/i18n';
import '@iobroker/adapter-react/index.css';

import SettingsEditor from './SettingsEditor';
import MainChart from './MainChart';
import getUrlQuery from './utils/getUrlQuery';
import DefaultPreset from './Components/DefaultPreset';
import MenuList from './MenuList';
import Utils from "@iobroker/adapter-react/Components/Utils";

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
    buttonIcon: {
        marginRight: theme.spacing(0.5),
    },
});

const FORBIDDEN_CHARS = /[.\][*,;'"`<>\\?]/g;

function loadChartParam(name, defaultValue) {
    return window.localStorage.getItem('Chart.' + name) ? window.localStorage.getItem('Chart.' + name) : defaultValue;
}

class App extends GenericApp {
    constructor(props) {
        let settings = {socket: {}};
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
            'zh-cn': require('./i18n/zh-cn'),
        };
        super(props, settings);
    }

    onConnectionReady() {
        let selectedId = window.localStorage.getItem('App.selectedId') || null;
        if (selectedId) {
            try {
                selectedId = JSON.parse(selectedId)
            } catch (e) {
                selectedId = null;
            }
        }

        const newState = {
            ready: false,
            instances: [],

            selectedId,
            selectedPresetChanged: false,
            presetData: null,
            originalPresetData: null,
            chartsList: null,
            addPresetDialog: null,
            progress: 0,

            discardChangesConfirmDialog: false,

            resizing: false,
            menuOpened: window.localStorage.getItem('App.menuOpened') !== 'false',
            menuSelectId: '',
            logHorzLayout: window.localStorage.getItem('App.logHorzLayout') === 'true',
        };

        this.settingsSize = window.localStorage ? parseFloat(window.localStorage.getItem('App.settingsSize')) || 150 : 150;
        this.menuSize = window.localStorage ? parseFloat(window.localStorage.getItem('App.menuSize')) || 500 : 500;

        this.objects = {};

        this.socket.getSystemConfig()
            .then(systemConfig => {
                newState.systemConfig = systemConfig;
                newState.presetData = DefaultPreset.getDefaultPreset(systemConfig);
                this.setState(newState);
                return Promise.resolve();
            })
            .then(() => this.socket.getAdapterInstances(''))
            // get only history adapters
            .then(instances => instances.filter(entry => entry && entry.common && entry.common.getHistory && entry.common.enabled))
            .then(instances => this.setState({ready: true, instances}))
            .catch(e => this.showError(e));
    }

    getNewPresetName(prefix, index) {
        index  = index  || (prefix ? '' : '1');
        prefix = prefix || 'preset_';

        return this.socket.getObject(prefix + index)
            .then(obj => {
                if (!obj) {
                    return prefix + index;
                } else {
                    if (!index) {
                        index = 2;
                    } else {
                        index++;
                    }
                    return this.getNewPresetName(prefix, index);
                }
            })
            .catch(e => prefix + index);
    }

    onCreatePreset = (name, parentId, historyInstance, stateId) => {
        return new Promise(resolve => {
            if (stateId) {
                return this.socket.getObject(stateId)
                    .then(obj => resolve(obj));
            } else {
                resolve(null);
            }
        })
            .then(obj => {
                name = (name || (obj && obj.common && obj.common.name ? Utils.getObjectNameFromObj(obj, null, {language: I18n.getLanguage()}) : '')).trim();

                this.getNewPresetName(name)
                    .then(name => {
                        let template = {
                            common: {
                                name,
                            },
                            native: {
                                url: '',
                                data: DefaultPreset.getDefaultPreset(this.state.systemConfig, historyInstance, obj, I18n.getLanguage()),
                            },
                            type: 'chart'
                        };

                        let id = `${this.adapterName}.0.${parentId ? parentId + '.' : ''}${name.replace(FORBIDDEN_CHARS, '_')}`;

                        return this.socket.setObject(id, template)
                            .then(() => this.loadChartOrPreset(id));
                    })
                    .catch(e => this.showError(e));
            });
    };

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
                        this.socket.setObject(obj._id, obj)
                            .then(() => this.setState({originalPresetData: JSON.stringify(this.state.presetData), selectedPresetChanged: false}))
                            .catch(e => this.showError(e));
                    }
                });
        }
    };

    loadChartOrPreset(selectedId, chartsList) {
        window.localStorage.setItem('App.selectedId', JSON.stringify(selectedId));

        if (selectedId && typeof selectedId === 'object') {
            // load chart
            const promises = [];
            chartsList = chartsList || this.state.chartsList;
            if (chartsList) {
                chartsList.forEach(item => !this.objects[item.id] && promises.push(this.socket.getObject(item.id)));
                !this.objects[selectedId.id] && !this.state.chartsList.find(item => item.id === selectedId.id) && promises.push(this.socket.getObject(selectedId.id));
            } else {
                this.objects = {};
                promises.push(this.socket.getObject(selectedId.id));
            }

            return Promise.all(promises)
                .then(results => {
                    results.forEach(obj => this.objects[obj._id] = obj);
                    const lines = (chartsList || []).map(item => DefaultPreset.getDefaultLine(this.state.systemConfig, item.instance, this.objects[item.id], I18n.getLanguage()));
                    (!chartsList || !chartsList.find(item => item.id === selectedId.id && item.instance === selectedId.instance)) &&
                        lines.push(DefaultPreset.getDefaultLine(this.state.systemConfig, selectedId.instance, this.objects[selectedId.id], I18n.getLanguage()));

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
                        animation:      0
                    };

                    this.setState({
                        chartsList,
                        presetData,
                        originalPresetData: '',
                        selectedPresetChanged: false,
                        selectedId: selectedId,
                    });
                });
        } else if (selectedId) {
            // load preset
            return this.socket.getObject(selectedId)
                .then(obj => {
                    if (obj && obj.native && obj.native.data) {

                        const newState = {
                            presetData: obj.native.data,
                            originalPresetData: JSON.stringify(obj.native.data),
                            selectedPresetChanged: false,
                            selectedId,
                        };

                        if (chartsList) {
                            newState.chartsList = chartsList;
                        }

                        this.setState(newState);
                    }
                });
        } else {
            this.setState({
                presetData: null,
                originalPresetData: '',
                selectedPresetChanged: false,
                selectedId: null,
            });
        }
    }

    discardChangesConfirmDialog() {
        return this.state.discardChangesConfirmDialog ? <Dialog
            maxWidth="lg"
            fullWidth={true}
            open={ true }
            key="discardChangesConfirmDialog"
            onClose={ () => this.setState({discardChangesConfirmDialog: false}, () => this.confirmCB && this.confirmCB(false)) }>
                <DialogTitle>{
                    this.state.discardChangesConfirmDialog === 'chart' ? I18n.t('Are you sure for loading the chart and discard unsaved changes?')
                    : (this.state.discardChangesConfirmDialog === 'preset' ? I18n.t('Are you sure for loading the preset and discard unsaved changes?') :
                        I18n.t('Are you sure for closing folder and discard unsaved changes?'))
                }</DialogTitle>
                <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button variant="contained" onClick={() =>
                        this.setState({discardChangesConfirmDialog: false}, () => this.confirmCB && this.confirmCB(false))}>
                        <IconCancel className={ this.props.classes.buttonIcon }/>
                        { I18n.t('Cancel') }
                    </Button>
                    <Button variant="contained" color="secondary" onClick={() => {
                        this.savePreset()
                            .then(() => this.setState({discardChangesConfirmDialog: false}, () => this.confirmCB && this.confirmCB(true)));
                    }}>
                        <IconSave className={ this.props.classes.buttonIcon }/>
                        { I18n.t('Save current preset and load') }
                    </Button>
                    <Button variant="contained" onClick={() =>
                        this.setState({discardChangesConfirmDialog: false}, () => this.confirmCB && this.confirmCB(true))}>
                        { I18n.t('Load without save') }
                    </Button>
                </DialogActions>
            </Dialog> : null;
    };

    renderMain() {
        const {classes} = this.props;
        return [
            <div className={clsx(classes.content, 'iobVerticalSplitter')} key="confirmdialog">
                <div key="confirmdiv" className={classes.menuOpenCloseButton} onClick={() => {
                    window.localStorage && window.localStorage.setItem('App.menuOpened', this.state.menuOpened ? 'false' : 'true');
                    this.setState({menuOpened: !this.state.menuOpened, resizing: true});
                    setTimeout(() => this.setState({resizing: false}), 300);
                }}>
                    {this.state.menuOpened ? <IconMenuOpened /> : <IconMenuClosed />}
                </div>
                <SplitterLayout
                    key="MainSplitter"
                    vertical={!this.state.logHorzLayout}
                    primaryMinSize={100}
                    secondaryInitialSize={this.settingsSize}
                    //customClassName={classes.menuDiv + ' ' + classes.splitterDivWithoutMenu}
                    onDragStart={() => this.setState({resizing: true})}
                    onSecondaryPaneSizeChange={size => this.settingsSize = parseFloat(size)}
                    onDragEnd={() => {
                        this.setState({resizing: false});
                        window.localStorage && window.localStorage.setItem('App.settingsSize', this.settingsSize.toString());
                    }}
                >
                    { this.state.selectedId ? <MainChart
                        key="MainChart"
                        visible={!this.state.resizing}
                        theme={this.state.theme}
                        onChange={presetData => this.setState({presetData})}
                        presetData={this.state.presetData}
                        selectedId={this.state.selectedId}
                        onCreatePreset={this.onCreatePreset}
                        chartsList={this.state.chartsList}
                        createPreset={() => this.setState({addPresetDialog: this.state.selectedId})}
                    /> : null}
                    {
                        this.state.presetData && this.state.selectedId && typeof this.state.selectedId === 'string' ? <SettingsEditor
                            socket={this.socket}
                            key="Editor"
                            width={window.innerWidth - this.menuSize}
                            theme={this.state.theme}
                            onChange={presetData => this.setState({presetData, selectedPresetChanged: JSON.stringify(presetData) !== this.state.originalPresetData})}
                            presetData={this.state.presetData}
                            verticalLayout={!this.state.logHorzLayout}
                            onLayoutChange={() => this.toggleLogLayout()}
                            connection={this.socket}
                            instances={this.state.instances}
                            systemConfig={this.state.systemConfig}
                            selectedPresetChanged={this.state.selectedPresetChanged}
                            savePreset={this.savePreset}
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

                    this.setState({presetData, selectedPresetChanged: JSON.stringify(presetData) !== this.state.originalPresetData});
                });
        } else if (destination && source.droppableId === destination.droppableId) {
            const presetData = JSON.parse(JSON.stringify(this.state.presetData));
            const [removed] = presetData.lines.splice(source.index, 1);
            presetData.lines.splice(destination.index, 0, removed);
            this.setState({presetData, selectedPresetChanged: JSON.stringify(presetData) !== this.state.originalPresetData});
        }
    };

    toggleLogLayout() {
        window.localStorage && window.localStorage.setItem('App.logHorzLayout', this.state.logHorzLayout ? 'false' : 'true');
        this.setState({logHorzLayout: !this.state.logHorzLayout});
    }

    render() {
        const {classes} = this.props;

        if (!this.state.ready) {
            return <MuiThemeProvider theme={this.state.theme}>
                <Loader theme={this.state.themeType}/>
            </MuiThemeProvider>;
        }

        return <MuiThemeProvider theme={this.state.theme}>
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
                            customClassName={classes.splitterDivs + ' ' + (!this.state.menuOpened ? classes.menuDivWithoutMenu : '')}
                            onDragStart={() => this.setState({resizing: true})}
                            onSecondaryPaneSizeChange={size => this.menuSize = parseFloat(size)}
                            onDragEnd={() => {
                                this.setState({resizing: false});
                                window.localStorage && window.localStorage.setItem('App.menuSize', this.menuSize.toString());
                            }}
                        >
                            <MenuList
                                key="menuList"
                                socket={this.socket}
                                theme={this.state.theme}
                                adapterName={this.adapterName}
                                instances={this.state.instances}
                                systemConfig={this.state.systemConfig}
                                onShowToast={toast => this.showToast(toast)}
                                selectedPresetChanged={this.state.selectedPresetChanged}
                                chartsList={this.state.chartsList}
                                selectedId={this.state.selectedId}
                                onCreatePreset={this.onCreatePreset}
                                onChangeList={chartsList => this.loadChartOrPreset(this.state.selectedId, chartsList)}
                                onSelectedChanged={(selectedId, cb) => {
                                    if (cb && this.state.selectedPresetChanged) {
                                        this.confirmCB = confirmed => {
                                            if (confirmed) {
                                                cb(selectedId);
                                                this.loadChartOrPreset(selectedId);
                                            } else {
                                                cb(false); // cancel
                                            }
                                            this.confirmCB = null;
                                        };
                                        this.setState({discardChangesConfirmDialog: selectedId && typeof selectedId === 'object' ? 'chart' : (selectedId ? 'preset' : 'folder')});
                                    } else {
                                        cb && cb(selectedId);
                                        this.loadChartOrPreset(selectedId);
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
        </MuiThemeProvider>;
    }
}

export default withWidth()(withStyles(styles)(withTheme(App)));
