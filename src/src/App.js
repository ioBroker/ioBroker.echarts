import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import clsx from 'clsx';
import SplitterLayout from 'react-splitter-layout';
import {MdMenu as IconMenuClosed} from 'react-icons/md';
import {MdArrowBack as IconMenuOpened} from 'react-icons/md';
import Grid from '@material-ui/core/Grid';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import IconButton from '@material-ui/core/IconButton';
import ListItemText from '@material-ui/core/ListItemText';
import SearchIcon from '@material-ui/icons/Search';
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
import Drawer from '@material-ui/core/Drawer';

import { withTheme } from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";

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
import {MdFileDownload as IconExport} from 'react-icons/md';
import {FaScroll as IconScript} from 'react-icons/all';
import {FaFolder as IconFolderClosed} from 'react-icons/all';
import {FaFolderOpen as IconFolderOpened} from 'react-icons/all';
// import {MdFileUpload as IconImport} from 'react-icons/md';
import {FaClone as IconClone} from 'react-icons/fa';
import {FaBars as IconMenu} from 'react-icons/fa';
import {BsFolderSymlink as IconMoveToFolder} from 'react-icons/bs';
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import 'react-splitter-layout/lib/index.css';

import GenericApp from '@iobroker/adapter-react/GenericApp';
import Utils from '@iobroker/adapter-react/Components/Utils';
import Loader from '@iobroker/adapter-react/Components/Loader'
import I18n from '@iobroker/adapter-react/i18n';
import DialogMessage from '@iobroker/adapter-react/Dialogs/Message';
import DialogConfirm from '@iobroker/adapter-react/Dialogs/Confirm';

import SideMenu from './SideMenu';
import SettingsEditor from './SettingsEditor';
import MainChart from './MainChart';
import Theme from './Theme';
import DialogError from './Dialogs/Error';
import DialogImportFile from './Dialogs/ImportFile';
import getUrlQuery from './utils/getUrlQuery';

const LEVEL_PADDING = 16;
const MARGIN_MEMBERS = 20;
const FORBIDDEN_CHARS = /[.\][*,;'"`<>\\?]/g;

const styles = theme => ({
    root: Theme.root,
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
            background: Theme.type === 'dark' ? '#595858' : '#ccc;'
        }
    },
    mainDiv: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    /*appBarWithMenu: {
        width: `calc(100% - ${Theme.menu.width}px)`,
        marginLeft: Theme.menu.width,
    },
    appBarWithoutMenu: {
        width: `100%`,
        marginLeft: 0,
    },*/
    content: {
        width: '100%',
        height: '100%',
        backgroundColor: theme.palette.background.default,
        position: 'relative'
    },
    splitterDivWithMenu: {
        width: `calc(100% - ${Theme.menu.width}px)`,
        height: '100%'
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
        background: Theme.colors.secondary,
        color: Theme.colors.primary,
        paddingLeft: 3,
        '&:hover': {
            color: 'white'
        }
    }
});

class App extends GenericApp {
    constructor(props) {
        super(props);
        this.objects = {};

        // init translations
        I18n.setTranslations({
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
        });

        let opened;
        try {
            opened = JSON.parse(window.localStorage.getItem('Presets.opened')) || [];
        } catch (e) {
            opened = [];
        }

        this.state = {
            lang: this.socket.systemLang,
            ready: false,
            selectedPresetId: window.localStorage.getItem('Presets.selectedPresetId') || '',
            opened,
            presets: {},
            folders: null,
            search: null,
            addFolderDialog: null,
            addFolderDialogTitle: null,
            editFolderDialog: null,
            editFolderDialogTitle: null,
            changingPreset: '',
            showSearch: null,
            instances: [],
            selectedPresetChanged: false,
            deleteDialog: null,
            moveDialog: null,
            newFolder: '',
            selectedPresetData: null,
            exportDialog: false,
            importDialog: false,

            connected: false,
            progress: 0,
            updateScripts: 0,

            updating: false,
            resizing: false,
            selected: null,
            menuOpened: window.localStorage ? window.localStorage.getItem('App.menuOpened') !== 'false' : true,
            menuSelectId: '',
            errorText: '',
            expertMode: window.localStorage ? window.localStorage.getItem('App.expertMode') === 'true' : false,
            logHorzLayout: window.localStorage ? window.localStorage.getItem('App.logHorzLayout') === 'true' : false,
            confirm: '',
            importFile: false,
            message: '',
            searchText: '',
            themeType: window.localStorage ? window.localStorage.getItem('App.theme') || 'light' : 'light',
        };
        // this.logIndex = 0;
        this.logSize = window.localStorage ? parseFloat(window.localStorage.getItem('App.logSize')) || 150 : 150;
        this.menuSize = window.localStorage ? parseFloat(window.localStorage.getItem('App.menuSize')) || 500 : 500;
        this.scripts = {};
        this.hosts = [];
        this.importFile = null;

        this.subscribes = [];
    }

    onConnectionReady() {
        this.socket.getSystemConfig()
            .then(systemConfig => {
                this.setState({systemConfig});
                return Promise.resolve();
            })
            .then(() => this.refreshData())
            .catch(e => this.showError(e));
    }

    processTasks(tasks, cb) {
        if (!tasks || !tasks.length) {
            cb && cb();
        } else {
            const task = tasks.shift();
            if (task.name === 'subscribe') {
                console.log('Subscribe on object change: ' + task.id);
                this.socket.subscribeObject(task.id, this.onObjectChange);
            } else if (task.name === 'unsubscribe') {
                console.log('UNSubscribe on object change: ' + task.id);
                this.socket.unsubscribeObject(task.id, this.onObjectChange);
            } else {
                console.log('Unknown task: ' + JSON.stringify(task));
            }
            setTimeout(() => this.processTasks(tasks, cb), 50);
        }
    }

    syncSubscribes() {
        const subscribed = [];
        const tasks = [];
        Object.values(this.state.instances)
            .forEach(instance =>
                Object.keys(instance.enabledDP).forEach(id => {
                    subscribed.push(id);
                    if (!this.subscribes.includes(id)) {
                        tasks.push({name: 'subscribe', id});
                    }
                }));

        this.state.instances.forEach(id => {
            if (!subscribed.includes(id)) {
                tasks.push({name: 'unsubscribe', id});
            }
        });

        this.processTasks(tasks);
    }

    getData() {
        let presets = {};
        let th = this;
        return new Promise((resolve, reject) => {
            this.socket._socket.emit('getObjectView', 'chart', 'chart', {
                startkey: 'flot.',
                endkey: 'flot.\u9999'
            }, function (err, res) {
                if (!err && res) {
                    res.rows.forEach((preset)=>{
                        presets[preset.value._id] = preset.value;
                    });
                    resolve({presets, folders: th.buildTree(presets)});
                } else {
                    reject(err)
                }
            })
        });
    }

    refreshData(changingPreset) {
        const that = this;
        return new Promise(resolve => {
            if (changingPreset) {
                this.setState({changingPreset}, () => resolve());
            } else {
                this.setState({ready: false}, () => resolve());
            }
        })
            .then(() => this.getData())
            .then(newState => {
                newState.ready = true;
                newState.changingPreset = '';
                newState.selectedPresetChanged = false;

                // Fill missing data
                Object.keys(newState.presets).forEach(id => {
                    const presetObj = newState.presets[id];
                    presetObj.common = presetObj.common || {};
                    presetObj.native = presetObj.native || {};

                    /*
                    // rename attribute
                    if (presetObj.native.burstIntervall !== undefined) {
                        presetObj.native.burstInterval = presetObj.native.burstIntervall;
                        delete presetObj.native.burstIntervall;
                    }

                    presetObj.native.burstInterval = parseInt(presetObj.native.burstInterval || 0, 10);
                    presetObj.native.onFalse = presetObj.native.onFalse || {};
                    presetObj.native.onTrue  = presetObj.native.onTrue  || {};
                    presetObj.native.onFalse.trigger = presetObj.native.onFalse.trigger || {condition: '=='};
                    presetObj.native.onTrue.trigger  = presetObj.native.onTrue.trigger  || {condition: '=='};
                    presetObj.native.members = presetObj.native.members || [];

                    const members = presetObj.native.members;
                    delete presetObj.native.members;
                    presetObj.native.members = members; // place it on the last place

                    delete presetObj.from;
                    delete presetObj.user;
                    delete presetObj.ts;
                    delete presetObj.acl;
                    */
                });

                if (!newState.presets[this.state.selectedPresetId]) {
                    newState.selectedPresetId = Object.keys(newState.presets).shift() || '';
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
        return new Promise(resolve => {
            return this.socket._socket.emit('getObjectView', 'custom', 'state', {}, (err, objs) => {
                const ids = objs.rows.map(item => item.id);
                this.getObjects(ids, objs => {
                    const ids = instances.map(obj => obj._id.substring('system.adapter.'.length));
                    const _instances = {};
                    _instances.presets = {_id: 'presets', common: {name: I18n.t('Presets')}, enabledDP: {}};
                    Object.values(objs).forEach(obj => {
                        const id = obj && obj.common && obj.common.custom && ids.find(id => Object.keys(obj.common.custom).includes(id));
                        if (id) {
                            _instances[id] = _instances[id] || {_id: 'system.adapter.' + id, enabledDP: {}};
                            _instances[id].enabledDP[obj._id] = obj;
                        }
                    });

                    const insts = Object.values(_instances).map(obj => {
                        const enabledDP = {};
                        Object.keys(obj.enabledDP).sort().forEach(id => enabledDP[id] = obj.enabledDP[id]);
                        obj.enabledDP = enabledDP;
                        return obj;
                    });

                    this.setState({instances: insts});

                    console.log(JSON.stringify(insts));
                    resolve();
                });
            });
        });
    }

    getAllData() {
        return this.socket.getAdapterInstances('')
            .then(instances => instances.filter(entry => entry && entry.common && entry.common.getHistory && entry.common.enabled))
            .then(instances => this.getAllCustoms(instances))
            .then(instances => instances && this.setState({instances}))
            .then(() => this.loadPresets())
            .then(() => this.syncSubscribes());
    }

    onObjectChange = (id, obj, oldObj) => {
        console.log('Changed ' + id);
    };

    showError(err) {
        this.setState({errorText: err});
    }

    showMessage(message) {
        this.setState({message});
    }

    toggleLogLayout() {
        window.localStorage && window.localStorage.setItem('App.logHorzLayout', this.state.logHorzLayout ? 'false' : 'true');
        this.setState({logHorzLayout: !this.state.logHorzLayout});
    }

    renderConfirmDialog() {
        return this.state.confirm ? (<DialogConfirm
            key="confirmdialog"
            onClose={result => {
                this.state.confirm && this.setState({confirm: ''});
                this.confirmCallback && this.confirmCallback(result);
                this.confirmCallback = null;
            }}
            text={this.state.confirm}/>) : null;
    }

    renderMessageDialog() {
        return this.state.message ? (<DialogMessage key="dialogmessage" onClose={() => this.setState({message: ''})} text={this.state.message}/>) : null;
    }
    renderErrorDialog() {
        return this.state.errorText ? (<DialogError key="dialogerror" onClose={() => this.setState({errorText: ''})} text={this.state.errorText}/>) : null;
    }
    renderImportDialog() {
        return this.state.importFile ? (<DialogImportFile key="dialogimportfile" onClose={data => this.onImport(data)} />) : null;
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
        preset._id = 'preset.0.' + folderPrefix + (folderPrefix ? '.' : '') + presetId;

        return this.socket.delObject(oldId)
            .then(() => {
                console.log('Deleted ' + oldId);
                return this.socket.setObject(preset._id, preset)
            })
            .then(() => {
                console.log('Set new ID: ' + preset._id);
                return !noRefresh && this.refreshData(presetId)
                    .then(() => this.changeSelectedPreset(preset._id))
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

    renderTreePreset = (item, level) => {
        const preset = this.state.presets[item._id];
        if (!preset || (this.state.search && !item.common.name.includes(this.state.search))) {
            return null;
        }

        level = level || 0;

        const changed = this.state.selectedPresetId && this.state.selectedPresetId === preset._id && this.state.selectedPresetChanged;

        return <ListItem
            style={ {paddingLeft: level * LEVEL_PADDING + this.props.theme.spacing(1)} }
            key={ item._id }
            selected={ this.state.selectedPresetId ? this.state.selectedPresetId === preset._id : false }
            button
            className={ clsx(changed && this.props.classes.changed, !preset.common.enabled && this.props.classes.disabled) }
            onClick={ () =>
                this.loadPreset(preset._id) }>
            <ListItemIcon classes={ {root: this.props.classes.itemIconRoot} }><IconScript className={ this.props.classes.itemIcon }/></ListItemIcon>
            <ListItemText
                classes={ {primary: this.props.classes.listItemTitle, secondary: this.props.classes.listItemSubTitle} }
                primary={ Utils.getObjectNameFromObj(preset, null, {language: I18n.getLanguage()}) }
                secondary={ Utils.getObjectNameFromObj(preset, null, {language: I18n.getLanguage()}, true) }
                />
            <ListItemSecondaryAction>
                {this.state.changingPreset === preset._id ?
                    <CircularProgress size={ 24 }/>
                    :
                    <IconButton onClick={()=>{
                        this.savePreset(item._id);
                    }}>
                        <IconSave/>
                    </IconButton>
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
                        this.setState({selectedPresetId: '', selectedPresetData: null, selectedPresetChanged: false, opened});
                        window.localStorage.setItem('Presets.opened', JSON.stringify(opened));
                    };
                    return this.setState({presetChangeDialog: 'empty'});
                }

                this.setState({selectedPresetId: '', selectedPresetData: null, selectedPresetChanged: false});
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
            classes={ {gutters: this.props.classes.noGutters} }
            className={ clsx(this.props.classes.width100, this.props.classes.folderItem) }
            style={ {paddingLeft: level * LEVEL_PADDING + this.props.theme.spacing(1)} }
        >
            <ListItemIcon classes={ {root: this.props.classes.itemIconRoot} } onClick={ () => this.toggleFolder(parent) }>{ opened ?
                <IconFolderOpened className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/> :
                <IconFolderClosed className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/>
            }</ListItemIcon>
            <ListItemText>{ parent.id }</ListItemText>
            <ListItemSecondaryAction>
                <IconButton onClick={ () => this.toggleFolder(parent) } title={ opened ? I18n.t('Collapse') : I18n.t('Expand')  }>
                    { opened ? <IconCollapse/> : <IconExpand/> }
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>);

        if (parent && (opened || !parent.id)) { // root cannot be closed and have id === ''
            parent.id && result.push(<ListItem key={ 'keys_' + parent.prefix }>
                <ListItemSecondaryAction>
                    <IconButton
                        onClick={() => this.createPreset(this.getNewPresetId(), parent.id) }
                        title={ I18n.t('Create new preset') }
                    ><IconAdd/></IconButton>
                    { /* <IconButton
                        onClick={() => this.setState({addFolderDialog: parent, addFolderDialogTitle: ''})}
                        title={ I18n.t('Create new folder') }
                    ><IconFolderAdd/></IconButton> */ }

                    <IconButton onClick={ () => this.setState({editFolderDialog: parent, editFolderDialogTitle: parent.id, editFolderDialogTitleOrigin: parent.id}) }
                                title={ I18n.t('Edit folder name') }
                    ><IconEdit/></IconButton>
                </ListItemSecondaryAction>
            </ListItem>);

            const values = Object.values(parent.presets);
            const subFolders = Object.values(parent.subFolders);

            // add first sub-folders
            result.push(subFolders.sort((a, b) => a.id > b.id ? 1 : (a.id < b.id ? -1 : 0)).map(subFolder =>
                this.renderTree(subFolder, level + 1)));

            // Add as second presets

            result.push(<ListItem
                key={ 'items_' + parent.prefix }
                classes={ {gutters: this.props.classes.noGutters} }
                className={ this.props.classes.width100 }>
                <List
                    className={ this.props.classes.list }
                    classes={ {root: this.props.classes.leftMenuItem} }
                    style={ {paddingLeft: level * LEVEL_PADDING + this.props.theme.spacing(1)} }
                >
                    { values.length ?
                        values.sort((a, b) => a._id > b._id ? 1 : (a._id < b._id ? -1 : 0)).map(preset => this.renderTreePreset(preset, level))
                        :
                        (!subFolders.length ? <ListItem><ListItemText className={ this.props.classes.folderItem}>{ I18n.t('No presets created yet')}</ListItemText></ListItem> : '')
                    }
                </List>
            </ListItem>);
        }

        return result;
    };

    savePreset(id) {
        let preset = JSON.parse(JSON.stringify(this.state.presets[id]));
        preset.data = JSON.parse(JSON.stringify(this.state.presetData));
        this.socket.setObject(id, preset)
            .then(() => this.refreshData(this.state.selectedSceneId))
            .catch(e => this.showError(e));
    }

    loadPreset(id) {
        let preset = JSON.parse(JSON.stringify(this.state.presets[id]));
        this.setState({presetData: preset.data});
    }

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
                                            <IconButton onClick={() => this.setState({showSearch: !this.state.showSearch}) }>
                                                <SearchIcon/>
                                            </IconButton>
                                        </span>
                {this.state.showSearch ?
                    <TextField
                        value={ this.state.search }
                        className={ this.props.classes.textInput }
                        onChange={ e => this.setState({search: e.target.value}) }/> : null
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
                    <TextField label={ I18n.t('Title') } value={ this.state.addFolderDialogTitle } onChange={ e =>
                        this.setState({addFolderDialogTitle: e.target.value.replace(FORBIDDEN_CHARS, '_')}) }/>
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

    onUpdatePreset = (presetData) => {
        this.setState({presetData: presetData})
    };

    renderMain() {
        const {classes} = this.props;
        return [
            this.renderMessageDialog(),
            this.renderErrorDialog(),
            this.renderConfirmDialog(),
            this.renderImportDialog(),
            <div className={clsx(classes.content, 'iobVerticalSplitter')} key="confirmdialog">
                <div key="confirmdiv" className={classes.menuOpenCloseButton} onClick={() => {
                    window.localStorage && window.localStorage.setItem('App.menuOpened', this.state.menuOpened ? 'false' : 'true');
                    this.setState({menuOpened: !this.state.menuOpened, resizing: true});
                    setTimeout(() => this.setState({resizing: false}), 300);
                }}>
                    {this.state.menuOpened ? (<IconMenuOpened />) : (<IconMenuClosed />)}
                </div>
                <SplitterLayout
                    key="MainSplitter"
                    vertical={!this.state.logHorzLayout}
                    primaryMinSize={100}
                    secondaryInitialSize={this.logSize}
                    //customClassName={classes.menuDiv + ' ' + classes.splitterDivWithoutMenu}
                    onDragStart={() => this.setState({resizing: true})}
                    onSecondaryPaneSizeChange={size => this.logSize = parseFloat(size)}
                    onDragEnd={() => {
                        this.setState({resizing: false});
                        window.localStorage && window.localStorage.setItem('App.logSize', this.logSize.toString());
                    }}
                >
                    <MainChart
                        key="MainChart"
                        visible={!this.state.resizing}
                        connection={this.socket}
                        onLocate={menuSelectId => this.setState({menuSelectId})}
                        menuOpened={this.state.menuOpened}
                        searchText={this.state.searchText}
                        theme={this.state.themeType}
                        presetData={this.state.presetData}
                        onSelectedChange={(id, editing) => {
                            const newState = {};
                            let changed = false;
                            if (id !== this.state.selected) {
                                changed = true;
                                newState.selected = id;
                            }
                            if (JSON.stringify(editing) !== JSON.stringify(this.state.editing)) {
                                changed = true;
                                newState.editing = JSON.parse(JSON.stringify(editing));
                            }
                            changed && this.setState(newState);
                        }}
                        selected={this.state.selected && this.objects[this.state.selected] && this.objects[this.state.selected].type === 'script' ? this.state.selected : ''}
                        objects={this.objects}
                        /*
                            onRestart={id => this.socket.extendObject(id, {})}
                            onChange={(id, common) => this.onUpdateScript(id, common)}
                        */
                    />
                    <SettingsEditor
                        key="Editor"
                        onChange={this.onUpdatePreset}
                        presetData={this.state.presetData}
                        verticalLayout={!this.state.logHorzLayout} onLayoutChange={() => this.toggleLogLayout()} connection={this.socket} selected={this.state.selected}/>
                </SplitterLayout>
            </div>
        ];
    }

    render() {
        const {classes} = this.props;

        if (!this.state.ready) {
            return (<Loader theme={this.state.themeType}/>);
        }

        return (
            <>
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
                        <div className={classes.mainDiv} key="mainmenudiv">
                            {this.renderListToolbar()}
                            <div key="list" className={ this.props.classes.heightMinusToolbar }>
                                <List className={ this.props.classes.scroll }>
                                    { this.renderTree(this.state.folders) }
                                </List>
                            </div>
                        </div>
                        {this.renderMain()}
                    </SplitterLayout>
                </div>
                { this.renderAddFolderDialog() }
            </>
        );
    }
}

export default withWidth()(withStyles(styles)(withTheme(App)));
