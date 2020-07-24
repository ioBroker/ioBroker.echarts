import React from 'react';
import update from 'immutability-helper';
import {withStyles} from '@material-ui/core/styles';
import { withTheme } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import clsx from 'clsx';
import SplitterLayout from 'react-splitter-layout';
import { MuiThemeProvider } from '@material-ui/core/styles';

import IconButton from '@material-ui/core/IconButton';
import ListItemText from '@material-ui/core/ListItemText';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import CircularProgress from '@material-ui/core/CircularProgress';
import Toolbar from '@material-ui/core/Toolbar';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

// icons
import {MdExpandLess as IconCollapse} from 'react-icons/md';
import {MdExpandMore as IconExpand} from 'react-icons/md';
import {MdAdd as IconAdd} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';
import {RiFolderAddLine as IconFolderAdd} from 'react-icons/ri';
import {MdClose as IconCancel} from 'react-icons/md';
import {MdCheck as IconCheck} from 'react-icons/md';
import {MdSave as IconSave} from 'react-icons/md';
import {MdDelete as IconDelete} from 'react-icons/md';
import {FaScroll as IconScript} from 'react-icons/all';
import {FaFolder as IconFolderClosed} from 'react-icons/all';
import {FaFolderOpen as IconFolderOpened} from 'react-icons/all';
import {MdMenu as IconMenuClosed} from 'react-icons/md';
import {MdArrowBack as IconMenuOpened} from 'react-icons/md';
import SearchIcon from '@material-ui/icons/Search';
// import {MdFileUpload as IconImport} from 'react-icons/md';
import {BsFolderSymlink as IconMoveToFolder} from 'react-icons/bs';
import {AiOutlineAreaChart as IconChart} from 'react-icons/ai';
import ClearIcon from '@material-ui/icons/Close';

import 'react-splitter-layout/lib/index.css';

import GenericApp from '@iobroker/adapter-react/GenericApp';
import Utils from '@iobroker/adapter-react/Components/Utils';
import Loader from '@iobroker/adapter-react/Components/Loader'
import I18n from '@iobroker/adapter-react/i18n';
import '@iobroker/adapter-react/index.css';

import SettingsEditor from './SettingsEditor';
import MainChart from './MainChart';
import getUrlQuery from './utils/getUrlQuery';

const LEVEL_PADDING = 16;
const FORBIDDEN_CHARS = /[.\][*,;'"`<>\\?]/g;

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
    leftMenuItem: {
        width: '100%',
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
    mainListDiv: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
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
    mainToolbar: {
        background: theme.palette.primary.main,
    },
    noGutters: {
        paddingTop: 0,
        paddingBottom: 0,
    },
    heightMinusToolbar: {
        height: 'calc(100% - 38px)',
        overflow: 'auto'
    },
    itemIconFolder: {
        cursor: 'pointer'
    },
    buttonsContainer: {
        '& button': {
            whiteSpace: 'nowrap'
        }
    }
});

function getFolderPrefix(presetId) {
    let result = presetId.split('.');
    result.shift();
    result.shift();
    result.pop();
    result = result.join('.');
    return result;
}

function getFolderList(folder) {
    let result = [];
    result.push(folder);
    Object.values(folder.subFolders).forEach(subFolder =>
        result = result.concat(getFolderList(subFolder)));

    return result;
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
        this.objects = {};
    }

    onConnectionReady() {
        let opened;
        try {
            opened = JSON.parse(window.localStorage.getItem('Presets.opened')) || [];
        } catch (e) {
            opened = [];
        }
        let chartsOpened;
        try {
            chartsOpened = JSON.parse(window.localStorage.getItem('Charts.opened')) || {};
        } catch (e) {
            chartsOpened = {};
        }

        const newState = {
            lang: this.socket.systemLang,
            ready: false,
            selectedPresetId: window.localStorage.getItem('Presets.selectedPresetId') || '',
            opened,
            presets: {},
            folders: null,
            presetMode: false,
            chartFolders: chartsOpened,
            search: null,
            addFolderDialog: null,
            addFolderDialogTitle: null,
            editFolderDialog: null,
            editFolderDialogTitle: null,
            changingPreset: '',
            showSearch: null,
            instances: [],
            selectedChartId: null,
            selectedPresetChanged: false,
            deleteDialog: null,
            moveDialog: null,
            newFolder: '',
            selectedPresetData: null,
            presetData: {
                lines: [],
                marks: [],
            },
            loadedPresetData: null,

            progress: 0,

            resizing: false,
            selected: null,
            menuOpened: window.localStorage.getItem('App.menuOpened') !== 'false',
            menuSelectId: '',
            logHorzLayout: window.localStorage.getItem('App.logHorzLayout') === 'true',
            confirm: '',
            searchText: '',
            themeType: window.localStorage.getItem('App.theme') || 'light',
        };
        this.settingsSize = window.localStorage ? parseFloat(window.localStorage.getItem('App.settingsSize')) || 150 : 150;
        this.menuSize = window.localStorage ? parseFloat(window.localStorage.getItem('App.menuSize')) || 500 : 500;

        this.socket.getSystemConfig()
            .then(systemConfig => {
                newState.systemConfig = systemConfig;
                this.setState(newState);
                return Promise.resolve();
            })
            .then(() => this.getAllData())
            .then(() => this.refreshData())
            .then(() => {
                if (window.localStorage.getItem('App.selectedPresetId')) {
                    this.loadPreset(window.localStorage.getItem('App.selectedPresetId'))
                } else if (window.localStorage.getItem('App.selectedChartId')) {
                    this.loadChart(window.localStorage.getItem('App.selectedChartId'), window.localStorage.getItem('App.selectedInstance'))
                }
            })
            .catch(e => this.showError(e));
    }

    getData() {
        let presets = {};
        let th = this;
        return new Promise((resolve, reject) =>
            this.socket._socket.emit('getObjectView', 'chart', 'chart', {
                startkey: 'flot.',
                endkey: 'flot.\u9999'
            }, (err, res) => {
                res && res.rows && res.rows.forEach(preset => presets[preset.value._id] = preset.value);
                resolve({presets, folders: th.buildTree(presets)});
            }));
    }

    refreshData(changingPreset) {
        const that = this;
        return new Promise(resolve => {
            if (changingPreset) {
                this.setState({changingPreset}, () => resolve());
            } else {
                //this.setState({ready: false}, () => resolve());
                resolve();
            }
        })
            .then(() => this.getData())
            .then(newState => {
                newState.ready = true;
                newState.changingPreset = '';
                //newState.selectedPresetChanged = false;

                // Fill missing data
                Object.keys(newState.presets).forEach(id => {
                    const presetObj = newState.presets[id];
                    presetObj.common = presetObj.common || {};
                    presetObj.native = presetObj.native || {};
                });

                if (!newState.presets[this.state.selectedPresetId]) {
                    //newState.selectedPresetId = Object.keys(newState.presets).shift() || '';
                }

                if ((newState.selectedPresetId || that.state.selectedPresetId) &&
                    newState.presets[newState.selectedPresetId || that.state.selectedPresetId]) {
                    newState.selectedPresetData = JSON.parse(JSON.stringify(newState.presets[newState.selectedPresetId || that.state.selectedPresetId]));
                } else {
                    newState.selectedPresetData = null;
                }

                that.setState(newState);
            });
    }

    getObjects(ids, cb, result) {
        result = result || {};
        if (!ids || !ids.length) {
            cb(result);
        } else {
            const id = ids.shift();
            this.socket.getObject(id)
                .catch(e => {
                    console.error('Cannot read ' + id + ': ' + e);
                    return null;
                })
                .then(obj => {
                    if (obj) {
                        result[id] = obj;
                    }
                    setTimeout(() => this.getObjects(ids, cb, result), 0);
                });
        }
    }

    getAllCustoms(instances) {
        return new Promise(resolve =>
            this.socket._socket.emit('getObjectView', 'custom', 'state', {}, (err, objs) => {
                console.log(objs);
                const ids = ((objs && objs.rows) || []).map(item => item.id);
                this.getObjects(ids, objs => {
                    const ids = instances.map(obj => obj._id.substring('system.adapter.'.length));
                    const _instances = {};
                    Object.values(objs).forEach(obj => {
                        const id = obj && obj.common && obj.common.custom && ids.find(id => Object.keys(obj.common.custom).includes(id));
                        if (id) {
                            _instances[id] = _instances[id] || {_id: 'system.adapter.' + id, enabledDP: {}};
                            _instances[id].enabledDP[obj._id] = obj;
                        }
                    });

                    let chartFolders = {};

                    const insts = Object.values(_instances).map(obj => {
                        const enabledDP = {};
                        Object.keys(obj.enabledDP).sort().forEach(id => {enabledDP[id] = obj.enabledDP[id]; enabledDP[id].group = obj._id});
                        obj.enabledDP = enabledDP;
                        chartFolders[obj._id] = typeof this.state.chartFolders[obj._id] !== 'undefined' ? this.state.chartFolders[obj._id] : true;
                        return obj;
                    });

                    let selectedChartId = Object.keys(insts).length && Object.keys(insts[0].enabledDP).length ? Object.keys(insts[0].enabledDP)[0] : null;

                    this.setState({instances: insts, chartFolders: chartFolders}, () => {
                        if (selectedChartId && !window.localStorage.getItem('App.selectedPresetId') && !window.localStorage.getItem('App.selectedChartId')) {
                            this.loadChart(selectedChartId, insts[0]._id);
                        }
                    });

                    console.log(insts);
                    resolve();
                });
            }));
    }

    getAllData() {
        return this.socket.getAdapterInstances('')
            .then(instances => instances.filter(entry => entry && entry.common && entry.common.getHistory && entry.common.enabled))
            .then(instances => this.getAllCustoms(instances))
    }

    onObjectChange = (id, obj, oldObj) => {
        console.log('Changed ' + id);
    };


    toggleLogLayout() {
        window.localStorage && window.localStorage.setItem('App.logHorzLayout', this.state.logHorzLayout ? 'false' : 'true');
        this.setState({logHorzLayout: !this.state.logHorzLayout});
    }

    buildTree(presets) {
        console.log(presets);
        presets = Object.values(presets);

        let folders = {subFolders: {}, presets: {}, id: '', prefix: ''};

        // create missing folders
        presets.forEach((preset) => {
            let id = preset._id;
            const parts = id.split('.');
            parts.shift();
            parts.shift();
            let currentFolder = folders;
            let prefix = '';
            for (let i = 0; i < parts.length - 1; i++) {
                if (prefix) {
                    prefix = prefix + '.';
                }
                prefix = prefix + parts[i];
                if (!currentFolder.subFolders[parts[i]]) {
                    currentFolder.subFolders[parts[i]] = {
                        subFolders: {},
                        presets: {},
                        id: parts[i],
                        prefix,
                    }
                }
                currentFolder = currentFolder.subFolders[parts[i]];
            }
            currentFolder.presets[id] = preset;
        });

        return folders;
    }

    findFolder(parent, folder) {
        if (parent.prefix === folder.prefix) {
            return parent;
        }
        for (let index in parent.subFolders) {
            let result = this.findFolder(parent.subFolders[index], folder);
            if (result) {
                return result;
            }
        }
    }

    addFolder(parentFolder, id) {
        let folders = JSON.parse(JSON.stringify(this.state.folders));
        let _parentFolder = this.findFolder(folders, parentFolder);

        let opened = JSON.parse(JSON.stringify(this.state.opened));

        _parentFolder.subFolders[id] = {
            presets: {},
            subFolders: {},
            id,
            prefix: _parentFolder.prefix ? _parentFolder.prefix + '.' + id : id
        };

        opened.push(id);

        this.setState({folders, opened});
    }

    addPresetToFolderPrefix = (preset, folderPrefix, noRefresh) => {
        let oldId = preset._id;
        let presetId = preset._id.split('.').pop();
        preset._id = 'flot.0.' + folderPrefix + (folderPrefix ? '.' : '') + presetId;

        return this.socket.delObject(oldId)
            .then(() => {
                console.log('Deleted ' + oldId);
                return this.socket.setObject(preset._id, preset)
            })
            .then(() => {
                console.log('Set new ID: ' + preset._id);
                return !noRefresh && this.refreshData(presetId)
            })
            .catch(e => this.showError(e));
    };

    renameFolder(folder, newName) {
        return new Promise(resolve => this.setState({changingPreset: folder}, () => resolve()))
            .then(() => {
                let newSelectedId;
                let pos;
                // if selected folder opened, replace its ID in this.state.opened
                if ((pos = this.state.opened.indexOf(folder.prefix)) !== -1) {
                    const opened = [...this.state.opened];
                    opened.splice(pos, 1);
                    opened.push(newName);
                    opened.sort();
                    this.setState({opened});
                }

                let prefix = folder.prefix.split('.');
                prefix[prefix.length - 1] = newName;
                prefix = prefix.join('.');

                if (Object.keys(folder.presets).find(id => id === this.state.selectedPresetId)) {
                    newSelectedId = 'preset.0.' + prefix + '.' + this.state.selectedPresetId.split('.').pop();
                }

                const promises = Object.keys(folder.presets).map(presetId =>
                    this.addPresetToFolderPrefix(folder.presets[presetId], prefix, true));

                return Promise.all(promises)
                    .then(() => this.refreshData(folder))
                    .then(() => newSelectedId && this.setState({selectedPresetId: newSelectedId}));
            });
    }

    getNewPresetId() {
        let newId = 0;

        for (const id in this.state.presets) {
            let shortId = id.split('.').pop();
            let matches = shortId.match(/^preset([0-9]+)$/);
            if (matches && parseInt(matches[1], 10) >= newId) {
                newId = parseInt(matches[1]) + 1;
            }
        }

        return 'preset' + newId;
    };

    createPreset(name, parentId) {
        let template = {
            common: {
                name: '',
            },
            native: {
                url: '',
                data: this.state.presetData,
            },
            type: 'chart'
        };

        template.common.name = name;
        let id = 'flot.0.' + (parentId ? parentId + '.' : '') + template.common.name;

        this.setState({changingPreset: id}, () =>
            this.socket.setObject(id, template)
                .then(() => this.refreshData(id))
                .then(() => this.loadPreset(id))
                .catch(e => this.showError(e))
        );
    };

    deletePreset = (id) => {
        return this.socket.delObject(id)
            .then(() => {
                window.localStorage.setItem('App.selectedPresetId', '');
                return this.refreshData(id);
            })
            .catch(e => this.showError(e));
    };

    toggleChartFolder = (id) => {
        let newState = update(this.state, {
            chartFolders: {
                [id]: {
                    $set : !(this.state.chartFolders[id])
                }
            }
        });
        this.setState(newState);

        window.localStorage.setItem('Charts.opened', JSON.stringify(newState.chartFolders));
    };

    renderSimpleHistory() {
        return <List className={ this.props.classes.scroll }>
            {
                this.state.instances.map((group, key) =>
                    {
                        let opened = this.state.chartFolders[group._id];
                        return <React.Fragment key={key}>
                            <ListItem
                                classes={ {gutters: this.props.classes.noGutters} }
                                className={ clsx(this.props.classes.width100, this.props.classes.folderItem) }
                            >
                                <ListItemIcon classes={ {root: this.props.classes.itemIconRoot} } onClick={ () => this.toggleChartFolder(group._id) }>{ opened ?
                                    <IconFolderOpened className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/> :
                                    <IconFolderClosed className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/>
                                }</ListItemIcon>
                                <ListItemText>{ group._id.replace('system.adapter.', '') }</ListItemText>
                                <ListItemSecondaryAction>
                                    <IconButton onClick={ () => this.toggleChartFolder(group._id) } title={ opened ? I18n.t('Collapse') : I18n.t('Expand')  }>
                                        { opened ? <IconCollapse/> : <IconExpand/> }
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                            {
                                opened ? Object.values(group.enabledDP).map((chart, key)=> {
                                    if ((this.state.search && !chart._id.includes(this.state.search))) {
                                        return null;
                                    }
                                    return <ListItem
                                        key={key}
                                        button
                                        style={{paddingLeft: LEVEL_PADDING * 2 + this.props.theme.spacing(1)}}
                                        selected={this.state.selectedChartId === chart._id}
                                        onClick={
                                        () => {
                                            this.state.presetMode && this.state.selectedPresetChanged ?
                                            this.setState({loadChartDialog: chart._id, loadChartDialogInstance: group._id}) :
                                            this.loadChart(chart._id, group._id)
                                        }
                                    }>
                                        <ListItemIcon classes={ {root: this.props.classes.itemIconRoot} }><IconChart className={ this.props.classes.itemIcon }/></ListItemIcon>
                                        <ListItemText
                                            classes={ {primary: this.props.classes.listItemTitle, secondary: this.props.classes.listItemSubTitle} }
                                            primary={ chart._id.replace('system.adapter.', '') }
                                        />
                                    </ListItem>
                                }) : null
                            }
                        </React.Fragment>
                    }
                )}
            </List>
    }

    renderTreePreset = (item, level) => {
        const preset = this.state.presets[item._id];
        if (!preset || (this.state.search && !item.common.name.includes(this.state.search))) {
            return null;
        }

        level = level || 0;

        return <ListItem
            classes={ {gutters: this.props.classes.noGutters} }
            style={ {paddingLeft: level * LEVEL_PADDING + this.props.theme.spacing(1)} }
            key={ item._id }
            selected={item._id === this.state.selectedPresetId}
            button
            onClick={ () =>
                this.state.presetMode && this.state.selectedPresetChanged ?
                this.setState({loadPresetDialog: preset._id}) :
                this.loadPreset(preset._id)
            }>
            <ListItemIcon classes={ {root: this.props.classes.itemIconRoot} }><IconScript className={ this.props.classes.itemIcon }/></ListItemIcon>
            <ListItemText
                classes={ {primary: this.props.classes.listItemTitle, secondary: this.props.classes.listItemSubTitle} }
                primary={ <>
                    { Utils.getObjectNameFromObj(preset, null, {language: I18n.getLanguage()}) }
                    <IconButton
                        size="small"
                        aria-label="Rename"
                        title={ I18n.t('Rename') }
                        onClick={ (e) => {
                            e.stopPropagation();
                            this.setState({renameDialog: preset._id, renamePresetDialogTitle: item.common.name})
                        }}
                    >
                        <IconEdit/>
                    </IconButton>
                </>}
                secondary={ Utils.getObjectNameFromObj(preset, null, {language: I18n.getLanguage()}, true) }
                />
            <ListItemSecondaryAction>
                {this.state.changingPreset === preset._id ?
                    <CircularProgress size={ 24 }/>
                    :
                    <>
                        <div>
                            <IconButton size="small" aria-label="Move to folder" title={ I18n.t('Move to folder') } onClick={ () => this.setState({moveDialog: preset._id, newFolder: getFolderPrefix(preset._id)}) }><IconMoveToFolder/></IconButton>
                            <IconButton size="small" aria-label="Delete" title={ I18n.t('Delete') } onClick={ () => this.setState({deleteDialog: preset._id}) }><IconDelete/></IconButton>
                        </div>
                    </>
                }
            </ListItemSecondaryAction>
        </ListItem>;
    };

    toggleFolder(folder) {
        const opened = [...this.state.opened];
        const pos = opened.indexOf(folder.prefix);
        if (pos === -1) {
            opened.push(folder.prefix);
        } else {
            opened.splice(pos, 1);

            // If active preset is inside this folder select the first preset
            if (Object.keys(folder.presets).includes(this.state.selectedPresetId)) {
                // To do ask question
                if (this.state.selectedPresetChanged) {
                    this.confirmCb = () => {
                        //this.setState({selectedPresetId: '', selectedPresetData: null, selectedPresetChanged: false, opened});
                        //window.localStorage.setItem('Presets.opened', JSON.stringify(opened));
                    };
                    return this.setState({presetChangeDialog: 'empty'});
                }

                //this.setState({selectedPresetId: '', selectedPresetData: null, selectedPresetChanged: false});
            }
        }

        window.localStorage.setItem('Presets.opened', JSON.stringify(opened));

        this.setState({opened});
    }

    renderTree(parent, level) {
        let result = [];
        level = level || 0;
        let opened = this.state.opened ? this.state.opened.includes(parent.prefix) : false;

        // Show folder item
        parent && parent.id && result.push(<ListItem
            key={ parent.prefix }
            classes={ {gutters: this.props.classes.noGutters } }
            className={ clsx(this.props.classes.width100, this.props.classes.folderItem) }
            style={ {paddingLeft: level * LEVEL_PADDING + this.props.theme.spacing(1)} }
        >
            <ListItemIcon classes={ {root: this.props.classes.itemIconRoot} } onClick={ () => this.toggleFolder(parent) }>{ opened ?
                <IconFolderOpened className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/> :
                <IconFolderClosed className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/>
            }</ListItemIcon>
            <ListItemText>{ parent.id }
                <IconButton onClick={ () => this.setState({editFolderDialog: parent, editFolderDialogTitle: parent.id, editFolderDialogTitleOrigin: parent.id}) }
                            title={ I18n.t('Edit folder name') }
                ><IconEdit/></IconButton>
            </ListItemText>
            <ListItemSecondaryAction>
                {parent && parent.id && opened ? <IconButton
                    onClick={() => this.createPreset(this.getNewPresetId(), parent.id) }
                    title={ I18n.t('Create new preset') }
                ><IconAdd/></IconButton> : null}
                <IconButton onClick={ () => this.toggleFolder(parent) } title={ opened ? I18n.t('Collapse') : I18n.t('Expand')  }>
                    { opened ? <IconCollapse/> : <IconExpand/> }
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>);

        if (parent && (opened || !parent.id)) { // root cannot be closed and have id === ''
            const values = Object.values(parent.presets);
            const subFolders = Object.values(parent.subFolders);

            // add first sub-folders
            result.push(subFolders.sort((a, b) => a.id > b.id ? 1 : (a.id < b.id ? -1 : 0)).map(subFolder =>
                this.renderTree(subFolder, level + 1)));

            // Add as second the presets
            result.push(<ListItem
                key={ 'items_' + parent.prefix }
                classes={ {gutters: this.props.classes.noGutters} }
                className={ this.props.classes.width100 }>
                <List
                    className={ this.props.classes.list }
                    classes={ {root: clsx(this.props.classes.leftMenuItem, this.props.classes.noGutters)} }
                    style={ {paddingLeft: level * LEVEL_PADDING + this.props.theme.spacing(1)} }
                >
                    { values.length ?
                        values.sort((a, b) => a._id > b._id ? 1 : (a._id < b._id ? -1 : 0)).map(preset => this.renderTreePreset(preset, level))
                        :
                        (!subFolders.length ? <ListItem classes={ {gutters: this.props.classes.noGutters} }><ListItemText className={ this.props.classes.folderItem}>{ I18n.t('No presets created yet')}</ListItemText></ListItem> : '')
                    }
                </List>
            </ListItem>);
        }

        return result;
    };

    savePreset = id => {
        let preset = JSON.parse(JSON.stringify(this.state.presets[id]));
        preset.native.data = JSON.parse(JSON.stringify(this.state.presetData));
        this.setState({loadedPresetData: this.state.presetData, selectedPresetChanged: false});
        this.socket.setObject(id, preset)
            .then(() => this.refreshData())
            .catch(e => this.showError(e));
    };

    renamePreset(id, newTitle) {
        let preset = JSON.parse(JSON.stringify(this.state.presets[id]));
        preset.common.name = newTitle;
        this.socket.delObject(id);
        let newId = id.split('.');
        newId.splice(-1, 1);
        newId.push(newTitle.replace(FORBIDDEN_CHARS, '_'));
        newId = newId.join('.');
        this.socket.setObject(newId, preset)
            .then(() => this.refreshData())
            .then(() => {
                if (this.state.selectedPresetId == id) {
                    this.loadPreset(newId);
                }
            })
            .catch(e => this.showError(e));
    }

    loadPreset(id) {
        if (!this.state.presets[id]) {
            return;
        }
        let preset = JSON.parse(JSON.stringify(this.state.presets[id]));
        window.localStorage.setItem('App.selectedPresetId', id);
        window.localStorage.setItem('App.selectedChartId', '');
        window.localStorage.setItem('App.selectedInstance', '');
        this.setState({
            presetData: preset.native.data,
            selectedPresetData: preset.native.data,
            selectedPresetChanged: false,
            presetMode: true,
            selectedChartId: null,
            selectedPresetId: id
        });
    }

    loadChartParam(name, defaultValue) {
        return window.localStorage.getItem('Chart.' + name) ? window.localStorage.getItem('Chart.' + name) : defaultValue;
    }

    loadChart(id, instance) {
        let presetData = {
            marks: [],
            lines: [{
                id,
                instance,
                offset: 0,
                aggregate: 'minmax',
                color: '#1868a8',
                chartType: 'auto',
                thickness: 1,
                shadowsize: 1,
                smoothing: 0,
                afterComma: 0,
                ignoreNull: false,
            }],
            zoom: true,
            axeX: 'lines',
            axeY: 'inside',
            hoverDetail: true,
            aggregate: 'minmax',
            chartType: 'auto',
            live: this.loadChartParam('live', '30'),
            timeType: this.loadChartParam('timeType', 'relative'),
            aggregateType: this.loadChartParam('aggregateType', 'step'),
            aggregateSpan: this.loadChartParam('aggregateSpan', 300),
            ticks: this.loadChartParam('ticks', ''),
            range: this.loadChartParam('range', 1440),
            relativeEnd: this.loadChartParam('relativeEnd', 'now'),
            start: this.loadChartParam('start', ''),
            end: this.loadChartParam('end', ''),
            start_time: this.loadChartParam('start_time', ''),
            end_time: this.loadChartParam('end_time', ''),
            noBorder: 'noborder',
            bg: '#00000000',
            timeFormat: '%H:%M',
            useComma: undefined,
            noedit: false,
            animation: 0
        };

        window.localStorage.setItem('App.selectedChartId', id);
        window.localStorage.setItem('App.selectedInstance', instance);
        window.localStorage.setItem('App.selectedPresetId', '');

        this.setState({presetData, presetMode: false, selectedChartId: id, selectedPresetId: null, selectedPresetChanged: false});
    }

    enablePresetMode = () => {
        this.setState({presetMode: true, selectedChartId: null});
    };

    renderListToolbar() {
        return <Toolbar key="toolbar" variant="dense" className={ this.props.classes.mainToolbar }>
                <IconButton
                    onClick={ () => this.createPreset(this.getNewPresetId()) }
                    title={ I18n.t('Create new preset') }
                ><IconAdd/></IconButton>

                <IconButton
                    onClick={ () => this.setState({addFolderDialog: this.state.folders, addFolderDialogTitle: ''}) }
                    title={ I18n.t('Create new folder') }
                ><IconFolderAdd/></IconButton>

                <span className={this.props.classes.right}>
                                            <IconButton
                                                onClick={() =>
                                                    this.setState({showSearch: !this.state.showSearch, search: ''})
                                                }>
                                                <SearchIcon/>
                                            </IconButton>
                                        </span>
                {this.state.showSearch ?
                    <TextField
                        value={ this.state.search }
                        className={ this.props.classes.textInput }
                        onChange={ e => this.setState({search: e.target.value}) }
                        InputProps={{
                            endAdornment: this.state.search ? (
                                <IconButton
                                    onClick={() => this.setState({ search: '' })}>
                                    <ClearIcon />
                                </IconButton>
                            ) : undefined,
                        }}
                    /> : null
                }
            </Toolbar>;
    }

    renderAddFolderDialog() {
        return this.state.addFolderDialog ?
            <Dialog
                open={ !!this.state.addFolderDialog }
                onClose={ () => this.setState({addFolderDialog: null}) }
            >
                <DialogTitle>{I18n.t('Create folder')}</DialogTitle>
                <DialogContent className={ this.props.classes.p }>
                    <TextField
                        label={ I18n.t('Title') }
                        value={ this.state.addFolderDialogTitle }
                        onChange={ e =>
                            this.setState({addFolderDialogTitle: e.target.value.replace(FORBIDDEN_CHARS, '_')})
                        }
                        onKeyPress={(e) => {
                            if (this.state.addFolderDialogTitle && e.which === 13) {
                                this.addFolder(this.state.addFolderDialog, this.state.addFolderDialogTitle);
                                this.setState({addFolderDialog: null});
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button variant="contained" onClick={ () => this.setState({addFolderDialog: null}) }>
                        <IconCancel className={ this.props.classes.buttonIcon }/>
                        { I18n.t('Cancel') }
                    </Button>
                    <Button variant="contained" disabled={!this.state.addFolderDialogTitle || Object.keys(this.state.folders.subFolders).find(name => name === this.state.addFolderDialogTitle)} onClick={() => {
                        this.addFolder(this.state.addFolderDialog, this.state.addFolderDialogTitle);
                        this.setState({addFolderDialog: null});
                    }} color="primary" autoFocus>
                        <IconCheck className={ this.props.classes.buttonIcon }/>
                        {I18n.t('Create')}
                    </Button>
                </DialogActions>
            </Dialog> : null;
    }

    renderEditFolderDialog() {
        const isUnique = !Object.keys(this.state.folders.subFolders).find(folder => folder.id === this.state.editFolderDialogTitle);

        return this.state.editFolderDialog ? <Dialog open={ !!this.state.editFolderDialog } onClose={ () => this.setState({editFolderDialog: null}) }>
            <DialogTitle>{ I18n.t('Edit folder') }</DialogTitle>
            <DialogContent>
                <TextField
                    label={ I18n.t('Title') }
                    value={ this.state.editFolderDialogTitle }
                    onKeyPress={(e) => {
                        if (this.state.editFolderDialogTitle && e.which === 13) {
                            this.renameFolder(this.state.editFolderDialog, this.state.editFolderDialogTitle)
                                .then(() => this.setState({editFolderDialog: null}));
                        }
                    }}
                    onChange={ e => this.setState({editFolderDialogTitle: e.target.value.replace(FORBIDDEN_CHARS, '_')}) }/>
            </DialogContent>
            <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={ () => this.setState({editFolderDialog: null}) }>
                    <IconCancel className={ this.props.classes.buttonIcon }/>
                    { I18n.t('Cancel') }
                </Button>
                <Button
                    variant="contained"
                    disabled={ !this.state.editFolderDialogTitle || this.state.editFolderDialogTitleOrigin === this.state.editFolderDialogTitle || !isUnique}
                    onClick={ () => {
                        this.renameFolder(this.state.editFolderDialog, this.state.editFolderDialogTitle)
                            .then(() => this.setState({editFolderDialog: null}));
                    }}
                    color="primary"
                    autoFocus
                >
                    <IconCheck className={ this.props.classes.buttonIcon }/>
                    { I18n.t('Apply') }
                </Button>
            </DialogActions>
        </Dialog> : null;
    }

    renderMoveDialog() {
        if (!this.state.moveDialog) {
            return null;
        }

        const newFolder = this.state.newFolder === '__root__' ? '' : this.state.newFolder;
        const presetId = this.state.moveDialog;
        const newId = 'preset.0.' + newFolder + (newFolder ? '.' : '') + presetId;

        const isIdUnique = !Object.keys(this.state.presets).find(id => id === newId);

        return <Dialog
            open={ true }
            key="moveDialog"
            onClose={ () => this.setState({moveDialog: null}) }
        >
            <DialogTitle>{ I18n.t('Move to folder') }</DialogTitle>
            <DialogContent>
                <FormControl classes={ {root: this.props.classes.width100} }>
                    <InputLabel shrink={ true }>{ I18n.t('Folder') }</InputLabel>
                    <Select
                        className={ this.props.classes.width100 }
                        value={ this.state.newFolder || '__root__' }
                        onChange={e => this.setState({newFolder: e.target.value}) }
                        onKeyPress={e => e.which === 13 && this.setState({moveDialog: null}, () =>
                                    this.addPresetToFolderPrefix(this.state.presets[presetId], this.state.newFolder === '__root__' ? '' : this.state.newFolder))
                        }
                    >
                        { getFolderList(this.state.folders).map(folder =>
                            <MenuItem
                                key={ folder.prefix }
                                value={ folder.prefix || '__root__' }
                            >
                                { folder.prefix ? folder.prefix.replace('.', ' > ') : I18n.t('Root') }
                            </MenuItem>)
                        }
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={ () => this.setState({moveDialog: null}) }>
                    { I18n.t('Cancel') }
                </Button>
                <Button
                    variant="contained"
                    disabled={ !isIdUnique }
                    color="primary" onClick={ e =>
                        this.setState({moveDialog: null}, () =>
                            this.addPresetToFolderPrefix(this.state.presets[presetId], this.state.newFolder === '__root__' ? '' : this.state.newFolder))
                    }
                >
                    { I18n.t('Move to folder') }
                </Button>
            </DialogActions>
        </Dialog>;
    }

    renderRenameDialog() {
        if (!this.state.renameDialog) {
            return null;
        }

        const presetId = this.state.renameDialog;

        let newId = presetId.split('.');
        newId.splice(-1, 1);
        newId.push(this.state.renamePresetDialogTitle.replace(FORBIDDEN_CHARS, '_'));
        newId = newId.join('.');
        let disabled =  !!this.state.presets[newId];

        return <Dialog
            open={ true }
            key="renameDialog"
            onClose={ () => this.setState({renameDialog: null}) }
        >
            <DialogTitle>{ I18n.t('Rename preset') }</DialogTitle>
            <DialogContent>
                <FormControl classes={ {root: this.props.classes.width100} }>
                    <TextField
                        label={ I18n.t('Title') }
                        value={ this.state.renamePresetDialogTitle }
                        onChange={ e =>
                            this.setState({renamePresetDialogTitle: e.target.value })
                        }
                        onKeyPress={(e) => {
                            if (!disabled && this.state.renamePresetDialogTitle && e.which === 13) {
                                this.setState({renameDialog: null}, () =>
                                    this.renamePreset(presetId, this.state.renamePresetDialogTitle)
                                )
                            }
                        }}
                    />
                </FormControl>
            </DialogContent>
            <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={ () => this.setState({renameDialog: null}) }>
                    { I18n.t('Cancel') }
                </Button>
                <Button
                    variant="contained"
                    disabled={ disabled }
                    color="primary" onClick={ e =>
                        this.setState({renameDialog: null}, () =>
                            this.renamePreset(presetId, this.state.renamePresetDialogTitle)
                        )
                    }
                >
                    { I18n.t('Rename') }
                </Button>
            </DialogActions>
        </Dialog>;
    }

    renderDeleteDialog() {
        return this.state.deleteDialog ? <Dialog
            open={ true }
            key="deleteDialog"
            onClose={ () => this.setState({deleteDialog: false}) }
        >
            <DialogTitle>{ I18n.t('Are you sure for delete this preset?') }</DialogTitle>
            <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={ () => this.setState({deleteDialog: false}) }>
                    {I18n.t('Cancel')}
                </Button>
                <Button variant="contained" color="secondary" onClick={e => {
                    this.deletePreset(this.state.deleteDialog);
                    this.setState({deleteDialog: false});
                }}>
                    { I18n.t('Delete') }
                </Button>
            </DialogActions>
        </Dialog> : null;
    }

    renderLoadChartDialog() {
        return this.state.loadChartDialog ? <Dialog
            open={ true }
            key="loadChartDialog"
            onClose={ () => this.setState({loadChartDialog: ''}) }>
                <DialogTitle>{ I18n.t('Are you sure for load chart and cancel unsaved changes?') }</DialogTitle>
                <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button variant="contained" onClick={() => {
                        this.setState({loadChartDialog: ''});
                    }}>
                        <IconCancel/> { I18n.t('Cancel') }
                    </Button>
                    <Button variant="contained" color="secondary" onClick={() => {
                        this.savePreset(this.state.selectedPresetId);
                        this.loadChart(this.state.loadChartDialog, this.state.loadChartDialogInstance);
                        this.setState({loadChartDialog: ''});
                    }}>
                        <IconSave/> { I18n.t('Save current preset and load') }
                    </Button>
                    <Button variant="contained" color="secondary" onClick={e => {
                        this.loadChart(this.state.loadChartDialog, this.state.loadChartDialogInstance);
                        this.setState({loadChartDialog: ''});
                    }}>
                        { I18n.t('Load chart') }
                    </Button>
                </DialogActions>
            </Dialog> : null;
    };

    renderLoadPresetDialog() {
        return this.state.loadPresetDialog ? <Dialog
            open={ true }
            key="loadPresetDialog"
            onClose={ () => this.setState({loadPresetDialog: ''}) }>
                <DialogTitle>{ I18n.t('Are you sure for load preset and cancel unsaved changes?') }</DialogTitle>
                <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button variant="contained" onClick={() => {
                        this.setState({loadPresetDialog: ''});
                    }}>
                        <IconCancel/> { I18n.t('Cancel') }
                    </Button>
                    <Button variant="contained" color="secondary" onClick={() => {
                        this.savePreset(this.state.selectedPresetId);
                        this.loadPreset(this.state.loadPresetDialog);
                        this.setState({loadPresetDialog: ''});
                    }}>
                        <IconSave/> { I18n.t('Save current preset and load') }
                    </Button>
                    <Button variant="contained" color="secondary" onClick={() => {
                        this.loadPreset(this.state.loadPresetDialog);
                        this.setState({loadPresetDialog: ''});
                    }}>
                        { I18n.t('Load preset') }
                    </Button>
                </DialogActions>
            </Dialog> : null;
    };

    renderSavePresetDialog() {
        return this.state.savePresetDialog ? <Dialog
            open={ true }
            key="savePresetDialog"
            onClose={ () => this.setState({savePresetDialog: ''}) }>
                <DialogTitle>{ I18n.t('Are you sure for rewrite preset and lost previous settings?') }</DialogTitle>
                <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button variant="contained" onClick={() => {
                        this.setState({savePresetDialog: ''});
                    }}>
                        <IconCancel/> { I18n.t('Cancel') }
                    </Button>
                    <Button variant="contained" color="secondary" onClick={() => {
                        this.savePreset(this.state.savePresetDialog);
                        this.setState({savePresetDialog: ''});
                    }}>
                        <IconSave/> { I18n.t('Save preset') }
                    </Button>
                </DialogActions>
            </Dialog> : null;
    };

    onUpdatePreset = presetData => {
        this.setState({selectedPresetChanged: JSON.stringify(presetData) !== JSON.stringify(this.state.loadedPresetData)});
        this.setState({presetData})
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
                    { this.state.selectedPresetId || this.state.selectedChartId ? <MainChart
                        key="MainChart"
                        visible={!this.state.resizing}
                        theme={this.state.theme}
                        themeType={this.state.themeType}
                        onChange={this.onUpdatePreset}
                        presetData={this.state.presetData}
                        enablePresetMode={this.enablePresetMode}
                        presetMode={this.state.presetMode}
                        selectedPresetId={this.state.selectedPresetId}
                        socket={this.socket}
                        createPreset={()=>{this.createPreset(this.getNewPresetId())}}
                    /> : null}
                    {
                        this.state.presetMode ? <SettingsEditor
                            socket={this.socket}
                            key="Editor"
                            width={window.innerWidth - this.menuSize}
                            onChange={this.onUpdatePreset}
                            presetData={this.state.presetData}
                            verticalLayout={!this.state.logHorzLayout}
                            onLayoutChange={() => this.toggleLogLayout()}
                            connection={this.socket}
                            selected={this.state.selected}
                            instances={this.state.instances}
                            systemConfig={this.state.systemConfig}
                            selectedPresetId={this.state.selectedPresetId}
                            selectedPresetChanged={this.state.selectedPresetChanged}
                            savePreset={this.savePreset}
                        /> : null
                    }
                </SplitterLayout>
            </div>
        ];
    }

    renderLeftList() {
        return <div className={this.props.classes.mainListDiv} key="mainMenuDiv">
            {this.renderListToolbar()}
            <div className={ this.props.classes.heightMinusToolbar }>
                <div key="listPresets">
                    <List className={ this.props.classes.scroll }>
                        { this.renderTree(this.state.folders) }
                    </List>
                </div>
                <div key="list">
                    { this.renderSimpleHistory() }
                </div>
            </div>
        </div>;
    }

    render() {
        const {classes} = this.props;

        if (!this.state.ready) {
            return <MuiThemeProvider theme={this.state.theme}>
                <Loader theme={this.state.themeType}/>
            </MuiThemeProvider>;
        }

        return (
            <MuiThemeProvider theme={this.state.theme}>
                <React.Fragment>
                    <div className={classes.root} key="divside">
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
                            {this.renderLeftList()}
                            {this.renderMain()}
                        </SplitterLayout>
                    </div>
                    { this.renderAddFolderDialog() }
                    { this.renderEditFolderDialog() }
                    { this.renderDeleteDialog() }
                    { this.renderMoveDialog() }
                    { this.renderRenameDialog() }
                    { this.renderLoadChartDialog() }
                    { this.renderLoadPresetDialog() }
                    { this.renderError() }
                    { this.renderToast() }
                    { this.renderSavePresetDialog() }
                </React.Fragment>
            </MuiThemeProvider>
        );
    }
}

export default withWidth()(withStyles(styles)(withTheme(App)));
