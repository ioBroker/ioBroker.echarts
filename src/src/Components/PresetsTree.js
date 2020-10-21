import React, {Component} from "react";
import PropTypes from 'prop-types';
import withWidth from "@material-ui/core/withWidth";
import {withStyles, withTheme} from "@material-ui/core/styles";
import clsx from 'clsx';

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
import {MdClose as IconCancel} from 'react-icons/md';
import {MdCheck as IconCheck} from 'react-icons/md';
import {MdDelete as IconDelete} from 'react-icons/md';
import {FaScroll as IconScript} from 'react-icons/all';
import {FaFolder as IconFolderClosed} from 'react-icons/all';
import {FaFolderOpen as IconFolderOpened} from 'react-icons/all';
import {BsFolderSymlink as IconMoveToFolder} from 'react-icons/bs';

import I18n from '@iobroker/adapter-react/i18n';
import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';
import Utils from '@iobroker/adapter-react/Components/Utils';
import DefaultPreset from './DefaultPreset';

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

const LEVEL_PADDING = 16;
const FORBIDDEN_CHARS = /[.\][*,;'"`<>\\?]/g;

const styles = theme => ({
    noGutters: {
        paddingTop: 0,
        paddingBottom: 0,
        width: '100%'
    },
    changed: {
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            top: 2,
            right: 2,
            width: 5,
            height: 5,
            borderRadius: 5,
            background: theme.type === 'dark' ? '#CC0000' : '#CC0000',
        }
    },
    itemIconFolder: {
        cursor: 'pointer'
    },
    buttonsContainer: {
        '& button': {
            whiteSpace: 'nowrap'
        }
    },
    itemIconPreset: {
        color: theme.type === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark
    },
    folderIconPreset: {
        color: theme.type === 'dark' ? theme.palette.secondary.dark : theme.palette.secondary.light
    },
    width100: {
        width: '100%',
    },
    buttonIcon: {
        marginRight: theme.spacing(0.5),
    },
    itemIconRoot: {
        minWidth: 24,
    },
    listItemSubTitle: {
        fontSize: 'smaller',
        opacity: 0.7,
        fontStyle: 'italic'
    }
});

class MenuList extends Component {
    constructor(props) {
        super(props);

        let presetsOpened;
        try {
            presetsOpened = JSON.parse(window.localStorage.getItem('Presets.opened')) || [];
        } catch (e) {
            presetsOpened = [];
        }

        let selectedId = window.localStorage.getItem('App.selectedId') || null;
        if (selectedId) {
            try {
                selectedId = JSON.parse(selectedId)
            } catch (e) {
                selectedId = null;
            }
        }

        this.state = {
            presetsOpened,

            presets: {},
            presetFolders: null,
            changingPreset: '',

            selectedId: selectedId && typeof selectedId === 'string' ? selectedId : null,

            deletePresetDialog: null,
            movePresetDialog: null,
            newPresetFolder: '',
            addPresetFolderDialog: null,
            addPresetFolderName: null,
            editPresetFolderDialog: null,
            editPresetFolderName: null,
        };

        this.getAllPresets()
            .then(newState => this.setState(newState, () =>
                this.state.selectedId && this.props.onSelectedChanged(this.state.selectedId)));
    }

    getAllPresets(newState) {
        newState = newState || {};
        let presets = {};
        return new Promise((resolve, reject) =>
            this.props.socket._socket.emit('getObjectView', 'chart', 'chart', {
                startkey: this.props.adapterName + '.',
                endkey: this.props.adapterName + '.\u9999'
            }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    res && res.rows && res.rows.forEach(preset => presets[preset.value._id] = preset.value);
                    newState.presets = presets;
                    newState.changingPreset = '';

                    // fill missing info
                    Object.keys(newState.presets).forEach(id => {
                        const presetObj = newState.presets[id];
                        presetObj.common = presetObj.common || {};
                        presetObj.native = presetObj.native || {};
                    });

                    newState.presetFolders = this.buildPresetTree(presets);
                    resolve(newState);
                }
            }));
    }

    renderPresetsTree(parent, level) {
        let result = [];
        level = level || 0;
        let presetsOpened = this.state.presetsOpened && parent ? this.state.presetsOpened.includes(parent.prefix) : false;

        // Show folder item
        parent && parent.id && result.push(<ListItem
            key={ parent.prefix }
            classes={ {gutters: this.props.classes.noGutters } }
            className={ clsx(this.props.classes.width100, this.props.classes.folderItem) }
            style={ {paddingLeft: level * LEVEL_PADDING} }
        >
            <ListItemIcon classes={ {root: clsx(this.props.classes.itemIconRoot, this.props.classes.folderIconPreset)} } onClick={ () => this.togglePresetsFolder(parent) }>{ presetsOpened ?
                <IconFolderOpened className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/> :
                <IconFolderClosed className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/>
            }</ListItemIcon>
            <ListItemText>{ parent.id }</ListItemText>
            <ListItemSecondaryAction>
                {parent && parent.id && presetsOpened ? <IconButton
                    onClick={() => this.createPreset(null, parent.id) }
                    title={ I18n.t('Create new preset') }
                ><IconAdd/></IconButton> : null}
                <IconButton onClick={ () => this.setState({editPresetFolderDialog: parent, editPresetFolderName: parent.id, editFolderDialogTitleOrigin: parent.id}) }
                            title={ I18n.t('Edit folder name') }
                ><IconEdit/></IconButton>
                <IconButton onClick={ () => this.togglePresetsFolder(parent) } title={ presetsOpened ? I18n.t('Collapse') : I18n.t('Expand')  }>
                    { presetsOpened ? <IconCollapse/> : <IconExpand/> }
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>);

        if (parent && (presetsOpened || !parent.id)) { // root cannot be closed and have id = ''
            const values     = Object.values(parent.presets);
            const subFolders = Object.values(parent.subFolders);

            // add first sub-folders
            result.push(subFolders.sort((a, b) => a.id > b.id ? 1 : (a.id < b.id ? -1 : 0)).map(subFolder =>
                this.renderPresetsTree(subFolder, level + 1)));

            // Add as second the presets
            result.push(<ListItem
                key={ 'items_' + parent.prefix }
                classes={ {gutters: this.props.classes.noGutters} }
                className={ this.props.classes.width100 }>
                <List
                    className={ this.props.classes.list }
                    classes={ {root: clsx(this.props.classes.leftMenuItem, this.props.classes.noGutters)} }
                    style={ {paddingLeft: level * LEVEL_PADDING} }
                >
                    { values.length ?
                        values.sort((a, b) => a._id > b._id ? 1 : (a._id < b._id ? -1 : 0)).map(preset => this.renderTreePreset(preset, level, subFolders.length))
                        :
                        (!subFolders.length ? <ListItem classes={ {gutters: this.props.classes.noGutters} }><ListItemText className={ this.props.classes.folderItem}>{ I18n.t('No presets created yet')}</ListItemText></ListItem> : '')
                    }
                </List>
            </ListItem>);
        }

        return result;
    };

    renamePresetFolder(folder, newName) {
        return new Promise(resolve => this.setState({changingPreset: folder}, () => resolve()))
            .then(() => {
                let newSelectedId;
                let pos;
                // if selected folder opened, replace its ID in this.state.opened
                if ((pos = this.state.presetsOpened.indexOf(folder.prefix)) !== -1) {
                    const presetsOpened = [...this.state.presetsOpened];
                    presetsOpened.splice(pos, 1);
                    presetsOpened.push(newName);
                    presetsOpened.sort();
                    this.setState({presetsOpened});
                }

                let prefix = folder.prefix.split('.');
                prefix[prefix.length - 1] = newName;
                prefix = prefix.join('.');

                if (Object.keys(folder.presets).find(id => id === this.state.selectedId)) {
                    newSelectedId = 'preset.0.' + prefix + '.' + this.state.selectedId.split('.').pop();
                }

                const promises = Object.keys(folder.presets).map(presetId =>
                    this.addPresetToFolderPrefix(folder.presets[presetId], prefix, true));

                return Promise.all(promises)
                    .then(() => this.getAllPresets())
                    .then(newState => {
                        if (newSelectedId) {
                            newState.selectedId = newSelectedId;
                        }
                        this.setState(newState);
                    });
            });
    }

    isNameUnique(name) {
        return !Object.keys(this.state.presets).find(id => this.state.presets[id].common.name === name);
    }

    getNewPresetName(prefix) {
        let index = prefix ? '' : '1';
        prefix = prefix || 'preset_';

        while(!this.isNameUnique(prefix + index)) {
            if (!index) {
                index = 2;
            } else {
                index++;
            }
        }

        return prefix + index;
    };

    buildPresetTree(presets) {
        // console.log(presets);
        presets = Object.values(presets);

        let presetFolders = {subFolders: {}, presets: {}, id: '', prefix: ''};

        // create missing folders
        presets.forEach((preset) => {
            let id = preset._id;
            const parts = id.split('.');
            parts.shift();
            parts.shift();
            let currentFolder = presetFolders;
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

        return presetFolders;
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
        let presetFolders = JSON.parse(JSON.stringify(this.state.presetFolders));
        parentFolder = parentFolder || presetFolders;
        let _parentFolder = this.findFolder(presetFolders, parentFolder);

        let presetsOpened = JSON.parse(JSON.stringify(this.state.presetsOpened));

        _parentFolder.subFolders[id] = {
            presets: {},
            subFolders: {},
            id,
            prefix: _parentFolder.prefix ? _parentFolder.prefix + '.' + id : id
        };

        presetsOpened.push(id);

        return new Promise(resolve =>
            this.setState({presetFolders, presetsOpened}, () => resolve()));
    }

    createPreset(name, parentId, historyInstance, stateId) {
        return new Promise(resolve => {
            if (stateId) {
                return this.props.socket.getObject(stateId)
                    .then(obj => resolve(obj));
            } else {
                resolve(null);
            }
        })
            .then(obj => {
                name = (name || (obj && obj.common && obj.common.name ? Utils.getObjectNameFromObj(obj, null, {language: I18n.getLanguage()}) : '')).trim();

                name = this.getNewPresetName(name);

                let template = {
                    common: {
                        name,
                    },
                    native: {
                        url: '',
                        data: DefaultPreset.getDefaultPreset(this.props.systemConfig, historyInstance, obj, I18n.getLanguage()),
                    },
                    type: 'chart'
                };

                let id = `${this.props.adapterName}.0.${parentId ? parentId + '.' : ''}${name.replace(FORBIDDEN_CHARS, '_')}`;

                this.setState({changingPreset: id}, () =>
                    this.props.socket.setObject(id, template)
                        .then(() => {
                            this.getAllPresets()
                                .then(newState =>
                                    this.setState(newState, () =>
                                        this.props.onSelectedChanged(id, selectedId => {
                                            if (selectedId) {
                                                window.localStorage.setItem('App.selectedId', JSON.stringify(id));
                                                this.setState({selectedId}, () => this.props.onAddDialogDone());
                                            } else {
                                                this.props.onAddDialogDone();
                                            }
                                        })));
                        })
                        .catch(e => this.props.onShowError(e))
                );
            });
    };

    renderTreePreset(item, level, anySubFolders) {
        const preset = this.state.presets[item._id];
        if (!preset || (this.state.search && !item.common.name.includes(this.state.search))) {
            return null;
        }

        level = level || 0;

        return <ListItem
            classes={ {gutters: clsx(this.props.classes.noGutters, this.state.selectedId === preset._id && this.props.selectedPresetChanged && this.props.classes.changed)} }
            style={ {paddingLeft: level * LEVEL_PADDING } }
            key={ item._id }
            selected={this.state.selectedId === item._id}
            button
            onClick={() => this.props.onSelectedChanged(preset._id, selectedId =>
                selectedId !== false && this.setState({selectedId}))
            }
        >
            <ListItemIcon classes={ {root: clsx(this.props.classes.itemIconRoot, this.props.classes.itemIconPreset)} }><IconScript className={ this.props.classes.itemIcon }/></ListItemIcon>
            <ListItemText
                classes={ {primary: this.props.classes.listItemTitle, secondary: this.props.classes.listItemSubTitle} }
                primary={ <>
                    { Utils.getObjectNameFromObj(preset, null, {language: I18n.getLanguage()}) }
                </>}
                secondary={ Utils.getObjectNameFromObj(preset, null, {language: I18n.getLanguage()}, true) }
            />
            <ListItemSecondaryAction>
                {this.state.changingPreset === preset._id ?
                    <CircularProgress size={ 24 }/>
                    :
                    <>
                        {this.state.selectedId !== preset._id || !this.props.selectedPresetChanged ? <IconButton
                            size="small"
                            aria-label="Rename"
                            title={ I18n.t('Rename') }
                            onClick={ (e) => {
                                e.stopPropagation();
                                this.setState({renameDialog: preset._id, renamePresetDialogTitle: item.common.name})
                            }}
                        >
                            <IconEdit/>
                        </IconButton> : null }
                        {level || anySubFolders ?
                            <IconButton
                                size="small"
                                aria-label="Move to folder"
                                title={ I18n.t('Move to folder') }
                                onClick={ () => this.setState({movePresetDialog: preset._id, newPresetFolder: getFolderPrefix(preset._id)}) }>
                                <IconMoveToFolder/>
                            </IconButton> : null}
                        <IconButton size="small" aria-label="Delete" title={ I18n.t('Delete') } onClick={ () => this.setState({deletePresetDialog: preset._id}) }><IconDelete/></IconButton>
                    </>
                }
            </ListItemSecondaryAction>
        </ListItem>;
    }

    togglePresetsFolder(folder) {
        const presetsOpened = [...this.state.presetsOpened];
        const pos = presetsOpened.indexOf(folder.prefix);
        if (pos === -1) {
            presetsOpened.push(folder.prefix);
        } else {
            presetsOpened.splice(pos, 1);

            // If active preset is inside this folder select the first preset
            if (Object.keys(folder.presets).includes(this.state.selectedId)) {
                return this.props.onSelectedChanged(null, allowedId => {
                    if (allowedId !== false) {
                        window.localStorage.setItem('Presets.opened', JSON.stringify(presetsOpened));
                        this.setState({presetsOpened, selectedId: null});
                    }
                });
            }
        }

        window.localStorage.setItem('Presets.opened', JSON.stringify(presetsOpened));

        this.setState({presetsOpened});
    }

    renderAddFolderDialog() {
        return this.state.addPresetFolderDialog || this.props.addPresetFolderDialog ?
            <Dialog
                maxWidth="md"
                fullWidth={true}
                open={ true }
                onClose={ () => this.setState({addPresetFolderDialog: null}, () => this.props.onAddDialogDone())}
            >
                <DialogTitle>{I18n.t('Create folder')}</DialogTitle>
                <DialogContent className={ this.props.classes.p }>
                    <TextField
                        fullWidth={true}
                        label={ I18n.t('Title') }
                        value={ this.state.addPresetFolderName }
                        onChange={ e => this.setState({addPresetFolderName: e.target.value.replace(FORBIDDEN_CHARS, '_').trim()})}
                        onKeyPress={e => {
                            if (this.state.addPresetFolderName && e.which === 13) {
                                this.addFolder(this.state.addPresetFolderDialog, this.state.addPresetFolderName);
                                this.setState({addPresetFolderDialog: null});
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button variant="contained" onClick={() => this.setState({addPresetFolderDialog: null}, () => this.props.onAddDialogDone())}>
                        <IconCancel className={ this.props.classes.buttonIcon }/>
                        { I18n.t('Cancel') }
                    </Button>
                    <Button
                        variant="contained"
                        disabled={!this.state.addPresetFolderName || Object.keys(this.state.presetFolders.subFolders).find(name => name === this.state.addPresetFolderName)}
                        onClick={() =>
                            this.addFolder(this.state.addPresetFolderDialog, this.state.addPresetFolderName)
                                .then(() => this.setState({addPresetFolderDialog: null}, () =>
                                    this.props.onAddDialogDone()))
                        }
                        color="primary" autoFocus
                    >
                        <IconCheck className={ this.props.classes.buttonIcon }/>
                        {I18n.t('Create')}
                    </Button>
                </DialogActions>
            </Dialog> : null;
    }

    renderRenameFolderDialog() {
        if (!this.state.editPresetFolderDialog) {
            return null;
        }

        const isUnique = !Object.keys(this.state.presetFolders.subFolders).find(folder => folder.id === this.state.editPresetFolderName);

        return <Dialog
            maxWidth="md"
            fullWidth={true}
            open={ !!this.state.editPresetFolderDialog }
            onClose={ () => this.setState({editPresetFolderDialog: null}) }
        >
            <DialogTitle>{ I18n.t('Edit folder') }</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth={true}
                    label={ I18n.t('Title') }
                    value={ this.state.editPresetFolderName }
                    onKeyPress={e => {
                        if (this.state.editPresetFolderName && e.which === 13) {
                            this.renamePresetFolder(this.state.editPresetFolderDialog, this.state.editPresetFolderName)
                                .then(() => this.setState({editPresetFolderDialog: null}));
                        }
                    }}
                    onChange={ e => this.setState({editPresetFolderName: e.target.value.replace(FORBIDDEN_CHARS, '_').trim()}) }/>
            </DialogContent>
            <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={ () => this.setState({editPresetFolderDialog: null}) }>
                    <IconCancel className={ this.props.classes.buttonIcon }/>
                    { I18n.t('Cancel') }
                </Button>
                <Button
                    variant="contained"
                    disabled={ !this.state.editPresetFolderName || this.state.editFolderDialogTitleOrigin === this.state.editPresetFolderName || !isUnique}
                    onClick={ () => {
                        this.renamePresetFolder(this.state.editPresetFolderDialog, this.state.editPresetFolderName)
                            .then(() => this.setState({editPresetFolderDialog: null}));
                    }}
                    color="primary"
                    autoFocus
                >
                    <IconCheck className={ this.props.classes.buttonIcon }/>
                    { I18n.t('Rename') }
                </Button>
            </DialogActions>
        </Dialog>;
    }

    renderMoveDialog() {
        if (!this.state.movePresetDialog) {
            return null;
        }

        const newPresetFolder = this.state.newPresetFolder === '__root__' ? '' : this.state.newPresetFolder;
        const presetId = this.state.movePresetDialog;
        const newId = 'preset.0.' + newPresetFolder + (newPresetFolder ? '.' : '') + presetId;

        const isIdUnique = !Object.keys(this.state.presets).find(id => id === newId);

        return <Dialog
            maxWidth="md"
            fullWidth={true}
            open={ true }
            key="movePresetDialog"
            onClose={ () => this.setState({movePresetDialog: null}) }
        >
            <DialogTitle>{ I18n.t('Move to folder') }</DialogTitle>
            <DialogContent>
                <FormControl classes={ {root: this.props.classes.width100} }>
                    <InputLabel shrink={ true }>{ I18n.t('Folder') }</InputLabel>
                    <Select
                        fullWidth={true}
                        className={ this.props.classes.width100 }
                        value={ this.state.newPresetFolder || '__root__' }
                        onChange={e => this.setState({newPresetFolder: e.target.value}) }
                        onKeyPress={e => e.which === 13 && this.setState({movePresetDialog: null}, () =>
                            this.addPresetToFolderPrefix(this.state.presets[presetId], this.state.newPresetFolder === '__root__' ? '' : this.state.newPresetFolder))
                        }
                    >
                        { getFolderList(this.state.presetFolders).map(folder =>
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
                <Button variant="contained" onClick={ () => this.setState({movePresetDialog: null}) }>
                    <IconCancel className={ this.props.classes.buttonIcon }/>
                    { I18n.t('Cancel') }
                </Button>
                <Button
                    variant="contained"
                    disabled={ !isIdUnique }
                    color="primary" onClick={() =>
                    this.setState({movePresetDialog: null}, () =>
                        this.addPresetToFolderPrefix(this.state.presets[presetId], this.state.newPresetFolder === '__root__' ? '' : this.state.newPresetFolder))
                }
                >
                    <IconCheck className={ this.props.classes.buttonIcon }/>
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

        return <Dialog
            maxWidth="md"
            fullWidth={true}
            open={ true }
            key="renameDialog"
            onClose={ () => this.setState({renameDialog: null}) }
        >
            <DialogTitle>{ I18n.t('Rename preset') }</DialogTitle>
            <DialogContent>
                <FormControl classes={ {root: this.props.classes.width100} }>
                    <TextField
                        fullWidth={true}
                        label={ I18n.t('Name') }
                        value={ this.state.renamePresetDialogTitle }
                        onChange={ e => this.setState({renamePresetDialogTitle: e.target.value})}
                        onKeyPress={e => {
                            if (this.isNameUnique(this.state.renamePresetDialogTitle) && this.state.renamePresetDialogTitle && e.which === 13) {
                                this.setState({renameDialog: null}, () =>
                                    this.renamePreset(presetId, this.state.renamePresetDialogTitle));
                            }
                        }}
                    />
                </FormControl>
            </DialogContent>
            <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={ () => this.setState({renameDialog: null}) }>
                    <IconCancel className={ this.props.classes.buttonIcon }/>
                    { I18n.t('Cancel') }
                </Button>
                <Button
                    variant="contained"
                    disabled={ !this.state.renamePresetDialogTitle || !this.isNameUnique(this.state.renamePresetDialogTitle) }
                    color="primary" onClick={() =>
                    this.setState({renameDialog: null}, () =>
                        this.renamePreset(presetId, this.state.renamePresetDialogTitle))
                }
                >
                    <IconCheck className={ this.props.classes.buttonIcon }/>
                    { I18n.t('Rename') }
                </Button>
            </DialogActions>
        </Dialog>;
    }

    renderDeleteDialog() {
        return this.state.deletePresetDialog ? <Dialog
            open={ true }
            key="deletePresetDialog"
            onClose={ () => this.setState({deletePresetDialog: false}) }
        >
            <DialogTitle>{ I18n.t('Are you sure for delete this preset?') }</DialogTitle>
            <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={ () => this.setState({deletePresetDialog: false}) }>
                    <IconCancel className={ this.props.classes.buttonIcon }/>
                    {I18n.t('Cancel')}
                </Button>
                <Button variant="contained" color="secondary" onClick={() => {
                    this.deletePreset(this.state.deletePresetDialog);
                    this.setState({deletePresetDialog: false});
                }}>
                    <IconDelete className={ this.props.classes.buttonIcon }/>
                    { I18n.t('Delete') }
                </Button>
            </DialogActions>
        </Dialog> : null;
    }

    renderSelectIdDialog() {
        if (!this.state.showAddStateDialog) {
            return null;
        } else {
            return <DialogSelectID
                key={'selectDialog_add'}
                socket={ this.props.socket }
                dialogName={'Add'}
                type={'state'}
                title={ I18n.t('Enable logging for state')}
                onOk={id => {
                    console.log('Selected ' + id);
                    const instance = this.state.showAddStateDialog.replace('system.adapter.', '');
                    if (id) {
                        this.props.socket.getObject(id)
                            .then(obj => {
                                if (!obj || !obj.common) {
                                    return this.props.onShowError(I18n.t('Invalid object'));
                                }
                                if (obj.common.custom && obj.common.custom[instance]) {
                                    return this.showToast(I18n.t('Already enabled'));
                                } else {
                                    obj.common.custom = obj.common.custom || {};
                                    obj.common.custom[instance] = {
                                        enabled: true,
                                    };
                                    this.props.socket.setObject(id, obj)
                                        .then(() => {
                                            const instances = JSON.parse(JSON.stringify(this.state.instances));
                                            const inst = instances.find(item => item._id === 'system.adapter.' + instance);
                                            inst.enabledDP = inst.enabledDP || {};
                                            inst.enabledDP[obj._id] = obj;
                                            this.setState({instances});
                                        });
                                }
                            })
                    }
                    this.setState({showAddStateDialog: false});
                } }
                onClose={ () => this.setState({showAddStateDialog: false}) }
            />;
        }
    }

    deletePreset = id => {
        return this.props.socket.delObject(id)
            .then(() => {
                window.localStorage.setItem('App.selectedPresetId', '');
                this.getAllPresets()
                    .then(newState => {
                        newState.selectedId = null;
                        this.setState(newState, () =>
                            this.props.onSelectedChanged(null));
                    });
            })
            .catch(e => this.props.onShowError(e));
    };

    renamePreset(id, newTitle) {
        let preset;
        return this.props.socket.getObject(id)
            .then(obj => {
                preset = obj;
                preset.common.name = newTitle;
                let newId = id.split('.');
                newId.splice(-1, 1);
                newId.push(newTitle.replace(FORBIDDEN_CHARS, '_').trim());
                newId = newId.join('.');

                preset._id = newId;
                return this.props.socket.delObject(id);
            })
            .then(() => this.props.socket.setObject(preset._id, preset))
            .then(() => this.getAllPresets())
            .then(newState => {
                if (id === this.state.selectedId) {
                    newState.selectedId = preset._id;
                    this.setState(newState, () =>
                        this.props.onSelectedChanged(preset._id));
                } else {
                    this.setState(newState);
                }
            })
            .catch(e => this.props.onShowError(e));
    }

    addPresetToFolderPrefix = (preset, folderPrefix, noRefresh) => {
        let oldId = preset._id;
        let presetId = preset._id.split('.').pop();
        preset._id = this.props.adapterName + '.0.' + folderPrefix + (folderPrefix ? '.' : '') + presetId;

        return this.props.socket.delObject(oldId)
            .then(() => {
                console.log('Deleted ' + oldId);
                return this.props.socket.setObject(preset._id, preset)
            })
            .then(() => {
                console.log('Set new ID: ' + preset._id);
                return !noRefresh && this.refreshData(presetId)
            })
            .catch(e => this.props.onShowError(e));
    };

    render() {
        if (this.props.addPresetDialog) {
            this.createPreset()
                .then(() => this.props.onAddDialogDone());
        }

        return <List className={ this.props.classes.scroll }>
            { this.renderPresetsTree(this.state.presetFolders) }
            { this.renderAddFolderDialog() }
            { this.renderRenameFolderDialog() }
            { this.renderDeleteDialog() }
            { this.renderMoveDialog() }
            { this.renderRenameDialog() }
        </List>;
    }
}

MenuList.propTypes = {
    onChange: PropTypes.func,
    socket: PropTypes.object,
    addPresetFolderDialog: PropTypes.bool,
    addPresetDialog: PropTypes.bool,
    onAddDialogDone: PropTypes.func,
    adapterName: PropTypes.string.isRequired,
    onShowError: PropTypes.func,
    onSelectedChanged: PropTypes.func.isRequired,
    systemConfig: PropTypes.object,
    selectedPresetChanged: PropTypes.bool,
};

export default withWidth()(withStyles(styles)(withTheme(MenuList)));
