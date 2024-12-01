import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { useDrag, useDrop, DndProvider as DragDropContext } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import {
    IconButton,
    ListItemText,
    Dialog,
    DialogTitle,
    TextField,
    Button,
    List,
    ListItem,
    ListItemSecondaryAction,
    CircularProgress,
    DialogActions,
    DialogContent,
    ListItemIcon,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';

// icons
import {
    MdExpandLess as IconCollapse,
    MdExpandMore as IconExpand,
    MdAdd as IconAdd,
    MdModeEdit as IconEdit,
    MdClose as IconCancel,
    MdCheck as IconCheck,
    MdDelete as IconDelete,
} from 'react-icons/md';
import {
    FaScroll as IconScript,
    FaFolder as IconFolderClosed,
    FaFolderOpen as IconFolderOpened,
} from 'react-icons/fa';

import {
    I18n,
    Utils,
    withWidth,
    Confirm as ConfirmDialog,
    IconCopy,
//    SelectID as DialogSelectID,
} from '@iobroker/adapter-react-v5';

/* function getFolderPrefix(presetId) {
    let result = presetId.split('.');
    result.shift();
    result.shift();
    result.pop();
    result = result.join('.');
    return result;
} */
const HIDDEN_FOLDER = '_consumption_';

const hideFolder = !window.location.search.includes('hidden=false');

function getFolderList(folder) {
    let result = [];
    Object.values(folder.subFolders || {})
        .forEach(subFolder =>
            result = result.concat(getFolderList(subFolder)));

    return result;
}

export const Droppable = props => {
    const { onDrop } = props;

    const [{ isOver, isOverAny }, drop] = useDrop({
        accept: 'item',
        drop: e => (isOver ? onDrop(e) : undefined),
        collect: monitor => ({
            isOver: monitor.isOver({ shallow: true }),
            isOverAny: monitor.isOver(),
        }),
    });

    return <div ref={drop} className={Utils.clsx(isOver && 'js-folder-dragover', isOverAny && 'js-folder-dragging')}>
        {props.children}
    </div>;
};

export const Draggable = props => {
    const { name } = props;
    const [{ opacity }, drag] = useDrag({
        type: 'item',
        item: () => ({ name }),
        collect: monitor => ({ opacity: monitor.isDragging() ? 0.3 : 1 }),
    });
    // About transform: https://github.com/react-dnd/react-dnd/issues/832#issuecomment-442071628
    return <div ref={drag} style={{ opacity, transform: 'translate3d(0, 0, 0)' }}>
        {props.children}
    </div>;
};

const LEVEL_PADDING = 16;
const FORBIDDEN_CHARS = /[.\][*,;'"`<>\\?]/g;

const styles = {
    noGutters: {
        pt: 0,
        pb: 0,
        width: '100%',
    },
    changed: theme => ({
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
        },
    }),
    itemIcon: {
        width: 32,
        height: 32,
        marginRight: 4,
    },
    itemIconFolder: {
        cursor: 'pointer',
    },
    buttonsContainer: {
        '& button': {
            whiteSpace: 'nowrap',
        },
    },
    itemIconPreset: theme => ({
        color: theme.type === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
    }),
    folderIconPreset: theme => ({
        color: theme.type === 'dark' ? theme.palette.secondary.dark : theme.palette.secondary.light,
    }),
    width100: {
        width: '100%',
    },
    buttonIcon: {
        marginRight: 4,
    },
    itemIconRoot: {
        minWidth: 24,
    },
    listItemSubTitle: {
        fontSize: 'smaller',
        opacity: 0.7,
        fontStyle: 'italic',
        display: 'inline-block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: 'calc(100% - 32px)',
    },
    mainList: {
        width: 'calc(100% - 8px)',
        ml: '8px',
        '& .js-folder-dragover>li>.folder-reorder': {
            background: '#40adff',
        },
        '& .js-folder-dragging .folder-reorder': {
            opacity: 1,
        },
        '& .js-folder-dragging .item-reorder': {
            opacity: 0.3,
        },
    },
    iconCopy: {
        width: 16,
    },
    listItemSecondaryAction: {
        right: 7,
    },
    listItemTitle: {
        lineHeight: 1,
    },
    listItemTitleDiv: {
        display: 'inline-block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: 'calc(100% - 32px)',
    },
};

class MenuList extends Component {
    constructor(props) {
        super(props);

        let presetsOpened;
        try {
            presetsOpened = JSON.parse(window.localStorage.getItem('App.echarts.presets.opened')) || [];
        } catch (e) {
            presetsOpened = [];
        }

        this.state = {
            presetsOpened,

            presets: {},
            presetFolders: null,
            changingPreset: '',

            deletePresetDialog: null,
            movePresetDialog: null,
            newPresetFolder: '',
            addPresetFolderName: '',
            editPresetFolderDialog: null,
            editPresetFolderName: '',
        };
        this.scrollToSelect = false;
        this.refSelected = React.createRef();

        this.getAllPresets()
            .then(newState => this.setState(newState));
    }

    UNSAFE_componentWillReceiveProps(nextProps/* , nextContext */) {
        if (nextProps.scrollToSelect !== this.scrollToSelect) {
            this.scrollToSelect = nextProps.scrollToSelect;

            this.scrollToSelect && setTimeout(() => {
                this.refSelected.current?.scrollIntoView({
                    behavior: 'auto',
                    block: 'center',
                    inline: 'center',
                });
            }, 100);
        }
    }

    componentDidMount() {
        this.props.socket.subscribeObject(`${this.props.adapterName}.0.*`, this.onPresetChange);
    }

    componentWillUnmount() {
        this.props.socket.unsubscribeObject(`${this.props.adapterName}.0.*`, this.onPresetChange);
    }

    onPresetChange = (id, obj) => {
        if (!id || !id.startsWith('echarts.')) {
            return;
        }
        let presets;
        let changed = false;
        if (obj) {
            obj.common = obj.common || {};
            obj.native = obj.native || {};
            if (JSON.stringify(obj) !== JSON.stringify(this.state.presets[id])) {
                presets = JSON.parse(JSON.stringify(this.state.presets));
                presets[id] = obj;
                changed = true;
            }
        } else if (this.state.presets[id]) {
            presets = JSON.parse(JSON.stringify(this.state.presets));
            delete presets[id];
            changed = true;
        }

        if (changed) {
            const emptyFolders = this.getEmptyFolders();
            const newState = { presets, changingPreset: '', presetFolders: MenuList.buildPresetTree(presets, emptyFolders) };
            setTimeout(() => this.informAboutSubFolders(newState.presetFolders), 200);
            this.setState(newState);
        }
    };

    informAboutSubFolders(presetFolders) {
        presetFolders = presetFolders || this.state.presetFolders || {};
        this.props.onShowReorder(!!Object.keys(presetFolders.subFolders || {}).length);
    }

    getEmptyFolders(presetFolders, _path, _result) {
        _result = _result || [];
        _path   = _path   || [];
        presetFolders = presetFolders || this.state.presetFolders || {};

        if (presetFolders.id/* && !Object.keys(presetFolders.subFolders).length && !Object.keys(presetFolders.presets).length */) {
            const __path = [..._path];
            __path.push(presetFolders.id);
            _result.push(__path.join('.'));
        }

        if (presetFolders.subFolders) {
            Object.keys(presetFolders.subFolders).forEach(name =>
                this.getEmptyFolders(presetFolders.subFolders[name], _path, _result));
        }

        return _result;
    }

    async getAllPresets(newState, emptyFolders) {
        newState = newState || {};
        const presets = {};

        const res = await this.props.socket.getObjectViewSystem('chart', `${this.props.adapterName}.`, `${this.props.adapterName}.\u9999`);
        res && Object.values(res).forEach(preset => preset._id && !preset._id.toString().endsWith('.') && (presets[preset._id] = preset));
        newState.presets = presets;
        newState.changingPreset = '';

        // fill missing info
        Object.keys(newState.presets).forEach(id => {
            const presetObj = newState.presets[id];
            presetObj.common = presetObj.common || {};
            presetObj.native = presetObj.native || {};
        });

        // store all empty folders
        emptyFolders = emptyFolders || this.getEmptyFolders();
        newState.presetFolders = MenuList.buildPresetTree(presets, emptyFolders);
        setTimeout(() => this.informAboutSubFolders(newState.presetFolders), 200);
        return newState;
    }

    renderTreePreset(item, level) {
        const preset = this.state.presets[item._id];
        if (!preset || (this.props.search && !item.common.name.includes(this.props.search))) {
            return null;
        }

        level = level || 0;

        const depthPx = (this.props.reorder ? level : level - 1) * LEVEL_PADDING;

        const listItem = <ListItem
            sx={{ '&.MuiListItem-gutters': Utils.getStyle(this.props.theme, styles.noGutters, this.props.selectedId === preset._id && this.props.selectedPresetChanged && styles.changed) }}
            style={{ paddingLeft: depthPx }}
            key={item._id}
            className={this.props.reorder ? 'item-reorder' : ''}
            ref={this.props.selectedId === item._id ? this.refSelected : null}
            selected={this.props.selectedId === item._id}
            button
            onClick={() => this.props.onSelectedChanged(preset._id)}
        >
            <ListItemIcon sx={Utils.getStyle(this.props.theme, styles.itemIconRoot, styles.itemIconPreset)}>
                <IconScript style={styles.itemIcon} />
            </ListItemIcon>
            <ListItemText
                sx={{
                    '& .MuiListItemText-primary': styles.listItemTitle,
                    '& .MuiListItemText-secondary': styles.listItemSubTitle,
                }}
                primary={<div style={styles.listItemTitleDiv}>{Utils.getObjectNameFromObj(preset, null, { language: I18n.getLanguage() })}</div>}
                secondary={Utils.getObjectNameFromObj(preset, null, { language: I18n.getLanguage() }, true)}
            />
            <ListItemSecondaryAction style={styles.listItemSecondaryAction}>
                {this.state.changingPreset === preset._id ?
                    <CircularProgress size={24} />
                    :
                    (!this.props.reorder ? <>
                        {this.props.selectedId !== preset._id || !this.props.selectedPresetChanged ? <IconButton
                            size="small"
                            aria-label="Rename"
                            title={I18n.t('Rename')}
                            onClick={e => {
                                e.stopPropagation();
                                this.setState({ renameDialog: preset._id, renamePresetDialogTitle: item.common.name });
                            }}
                        >
                            <IconEdit />
                        </IconButton> : null }
                        {/* level || anySubFolders ?
                            <IconButton
                                size="small"
                                aria-label="Move to folder"
                                title={ I18n.t('Move to folder') }
                                onClick={ () => this.setState({ movePresetDialog: preset._id, newPresetFolder: getFolderPrefix(preset._id) }) }>
                                <IconMoveToFolder />
                            </IconButton> : null */}
                        <IconButton size="small" aria-label="Copy" title={I18n.t('Copy')} onClick={() => this.props.onCopyPreset(preset._id)}><IconCopy style={styles.iconCopy} /></IconButton>
                        <IconButton size="small" aria-label="Delete" title={I18n.t('Delete')} onClick={() => this.setState({ deletePresetDialog: preset._id })}><IconDelete /></IconButton>
                    </> : null)}
            </ListItemSecondaryAction>
        </ListItem>;

        if (this.props.reorder) {
            return <Draggable key={`draggable_${item._id}`} name={item._id} draggableId={item._id}>{listItem}</Draggable>;
        }
        return  listItem;
    }

    renderPresetsTree(parent, level) {
        const result = [];

        level = level || 0;
        const presetsOpened = this.props.reorder || (this.state.presetsOpened && parent ? this.state.presetsOpened.includes(parent.prefix) : false);

        const depthPx = (this.props.reorder ? level : level - 1) * LEVEL_PADDING;

        const reactChildren = [];
        if (parent && (presetsOpened || !parent.id)) { // root cannot be closed and have id = ''
            const values     = Object.values(parent.presets || {});
            const subFolders = Object.values(parent.subFolders || {});

            // add first sub-folders
            subFolders
                .sort((a, b) => (a.id > b.id ? 1 : (a.id < b.id ? -1 : 0)))
                .filter(subFolder => !(hideFolder && subFolder.id === HIDDEN_FOLDER))
                .forEach(subFolder =>
                    reactChildren.push(this.renderPresetsTree(subFolder, level + 1)));

            // Add as second the presets
            if (values.length || subFolders.length) {
                values
                    .sort((a, b) => (a._id > b._id ? 1 : (a._id < b._id ? -1 : 0)))
                    .forEach(preset =>
                        reactChildren.push(this.renderTreePreset(preset, level + 1)));
            } else {
                reactChildren.push(<ListItem key="no presets" sx={{ '&.MuiListItem-gutters': styles.noGutters }}>
                    <ListItemText style={styles.folderItem}>{ I18n.t('No presets created yet')}</ListItemText>
                </ListItem>);
            }
        }

        // Show folder item
        if (parent && (parent.id || this.props.reorder)) {
            const folder = <ListItem
                key={parent.prefix}
                sx={{ '&.MuiListItem-gutters': styles.noGutters }}
                className={this.props.reorder ? 'folder-reorder' : ''}
                style={{
                    ...styles.width100,
                    ...styles.folderItem,
                    paddingLeft: depthPx,
                }}
            >
                <ListItemIcon
                    sx={Utils.getStyle(this.props.theme, styles.itemIconRoot, styles.folderIconPreset)}
                    onClick={() => this.togglePresetsFolder(parent)}
                >
                    { presetsOpened ?
                        <IconFolderOpened style={{ ...styles.itemIcon, ...styles.itemIconFolder }} /> :
                        <IconFolderClosed style={{ ...styles.itemIcon, ...styles.itemIconFolder }} />}
                </ListItemIcon>
                <ListItemText>{parent.id || I18n.t('Root')}</ListItemText>
                <ListItemSecondaryAction style={styles.listItemSecondaryAction}>
                    {!this.props.reorder && parent && parent.id && presetsOpened ? <IconButton
                        size="small"
                        onClick={() => this.props.onCreatePreset(null, parent.id)}
                        title={I18n.t('Create new preset')}
                    >
                        <IconAdd />
                    </IconButton> : null}
                    {!this.props.reorder ? <IconButton
                        size="small"
                        onClick={() => this.setState({ editPresetFolderDialog: parent, editPresetFolderName: parent.id, editFolderDialogTitleOrigin: parent.id })}
                        title={I18n.t('Edit folder name')}
                    >
                        <IconEdit />
                    </IconButton> : null}
                    {!this.props.reorder ? <IconButton size="small" onClick={() => this.togglePresetsFolder(parent)} title={presetsOpened ? I18n.t('Collapse') : I18n.t('Expand')}>
                        {presetsOpened ? <IconCollapse /> : <IconExpand />}
                    </IconButton> : null}
                </ListItemSecondaryAction>
            </ListItem>;

            if (!this.props.reorder) {
                result.push(folder);
            } else {
                result.push(<Droppable
                    droppableId="tree"
                    key={`droppable_${parent.prefix}`}
                    name={parent.prefix}
                    onDrop={e => this.onDragFinish(e.name, `echarts.0${parent.prefix ? '.' : ''}${parent.prefix}`)}
                >
                    {folder}
                </Droppable>);
            }
        }

        reactChildren && reactChildren.forEach(r => result.push(r));

        return result;
    }

    async renamePresetFolder(folder, newName) {
        this.setState({ changingPreset: folder });
        let newSelectedId;
        const pos = this.state.presetsOpened.indexOf(folder.prefix);
        // if selected folder opened, replace its ID in this.state.opened
        if (pos !== -1) {
            const presetsOpened = [...this.state.presetsOpened];
            presetsOpened.splice(pos, 1);
            presetsOpened.push(newName);
            presetsOpened.sort();
            this.setState({ presetsOpened });
        }

        let prefix = folder.prefix.split('.');
        prefix[prefix.length - 1] = newName;
        prefix = prefix.join('.');

        if (Object.keys(folder.presets).find(id => id === this.props.selectedId)) {
            newSelectedId = `${this.props.adapterName}.0.${prefix}.${this.props.selectedId.split('.').pop()}`;
        }

        const ids = Object.keys(folder.presets);
        for (let i = 0; i < ids.length; i++) {
            await this.addPresetToFolderPrefix(folder.presets[ids[i]], prefix, true);
        }
        const emptyFolders = this.getEmptyFolders();
        const _pos = emptyFolders.indexOf(folder.prefix);
        if (_pos !== -1) {
            emptyFolders[_pos] = prefix;
            // remove not unique entries
            emptyFolders.sort();
            for (let i = emptyFolders.length - 1; i > 0; i--) {
                if (emptyFolders[i] === emptyFolders[i - 1]) {
                    emptyFolders.splice(i, 1);
                }
            }
        }

        setTimeout(async () => {
            const newState = await this.getAllPresets(null, emptyFolders);
            this.setState(newState, () =>
                this.props.onSelectedChanged(newSelectedId));
        }, 100);
    }

    isNameUnique(presetId, name) {
        const len = presetId.split('.').length;
        if (name === HIDDEN_FOLDER) {
            return false;
        }
        return !Object.keys(this.state.presets)
            .find(id => len === id.split('.').length && this.state.presets[id].common.name === name);
    }

    static buildPresetTree(presets, emptyFolders) {
        // console.log(presets);
        presets = Object.values(presets);

        const presetFolders = {
            subFolders: {}, presets: {}, id: '', prefix: '',
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

    findFolder(parent, folder) {
        if (parent && parent.prefix === folder.prefix) {
            return parent;
        }
        if (parent && parent.subFolders) {
            const ids = Object.keys(parent.subFolders);
            for (let i = 0; i < ids.length; i++) {
                const result = this.findFolder(parent.subFolders[ids[i]], folder);
                if (result) {
                    return result;
                }
            }
        }

        return null;
    }

    addFolder(parentFolder, id) {
        const presetFolders = JSON.parse(JSON.stringify(this.state.presetFolders));
        parentFolder = parentFolder || presetFolders;
        const _parentFolder = this.findFolder(presetFolders, parentFolder);

        const presetsOpened = JSON.parse(JSON.stringify(this.state.presetsOpened));

        _parentFolder.subFolders[id] = {
            presets: {},
            subFolders: {},
            id,
            prefix: _parentFolder.prefix ? `${_parentFolder.prefix}.${id}` : id,
        };

        presetsOpened.push(id);

        return new Promise(resolve => {
            this.setState({ presetFolders, presetsOpened }, () =>
                resolve());
        });
    }

    togglePresetsFolder(folder) {
        const presetsOpened = [...this.state.presetsOpened];
        const pos = presetsOpened.indexOf(folder.prefix);
        if (pos === -1) {
            presetsOpened.push(folder.prefix);
        } else {
            presetsOpened.splice(pos, 1);

            // If active preset is inside this folder select the first preset
            if (Object.keys(folder.presets).includes(this.props.selectedId)) {
                this.props.onSelectedChanged(null, allowedId => {
                    if (allowedId !== false) {
                        window.localStorage.setItem('App.echarts.presets.opened', JSON.stringify(presetsOpened));
                        this.setState({ presetsOpened });
                    }
                });
                return;
            }
        }

        window.localStorage.setItem('App.echarts.presets.opened', JSON.stringify(presetsOpened));

        this.setState({ presetsOpened });
    }

    renderAddFolderDialog() {
        return this.props.addPresetFolderDialog ?
            <Dialog
                maxWidth="md"
                fullWidth
                open={!0}
                onClose={() => this.props.onClosePresetFolderDialog()}
            >
                <DialogTitle>{I18n.t('Create folder')}</DialogTitle>
                <DialogContent style={styles.p}>
                    <TextField
                        variant="standard"
                        fullWidth
                        autoFocus
                        label={I18n.t('Title')}
                        value={this.state.addPresetFolderName}
                        onChange={e => this.setState({ addPresetFolderName: e.target.value.replace(FORBIDDEN_CHARS, '_').trim() })}
                        onKeyUp={e => {
                            if (this.state.addPresetFolderName && e.which === 13 && this.state.addPresetFolderName !== HIDDEN_FOLDER) {
                                e.preventDefault();
                                e.stopPropagation();
                                this.addFolder(null, this.state.addPresetFolderName)
                                    .then(() => this.props.onClosePresetFolderDialog(() =>
                                        this.informAboutSubFolders()));
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions style={{ ...styles.alignRight, ...styles.buttonsContainer }}>
                    <Button
                        variant="contained"
                        disabled={
                            !this.state.addPresetFolderName ||
                            !!Object.keys((this.state.presetFolders && this.state.presetFolders.subFolders) || {}).find(name => name === this.state.addPresetFolderName) ||
                            this.state.addPresetFolderName === HIDDEN_FOLDER
                        }
                        onClick={() =>
                            this.addFolder(null, this.state.addPresetFolderName)
                                .then(() => this.props.onClosePresetFolderDialog(() =>
                                    this.informAboutSubFolders()))}
                        color="primary"
                        autoFocus
                        startIcon={<IconCheck />}
                    >
                        {I18n.t('Create')}
                    </Button>
                    <Button
                        color="grey"
                        variant="contained"
                        onClick={() => this.props.onClosePresetFolderDialog()}
                        startIcon={<IconCancel />}
                    >
                        {I18n.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog> : null;
    }

    renderRenameFolderDialog() {
        if (!this.state.editPresetFolderDialog) {
            return null;
        }

        const isUnique = !Object.keys((this.state.presetFolders && this.state.presetFolders.subFolders) || {})
            .find(folder => folder.id === this.state.editPresetFolderName);

        return <Dialog
            maxWidth="md"
            fullWidth
            open={!!this.state.editPresetFolderDialog}
            onClose={() => this.setState({ editPresetFolderDialog: null })}
        >
            <DialogTitle>{I18n.t('Edit folder')}</DialogTitle>
            <DialogContent>
                <TextField
                    variant="standard"
                    fullWidth
                    autoFocus
                    label={I18n.t('Title')}
                    value={this.state.editPresetFolderName}
                    onKeyUp={e => {
                        if (this.state.editPresetFolderName &&
                            e.which === 13 &&
                            this.state.editPresetFolderName !== HIDDEN_FOLDER &&
                            this.state.editFolderDialogTitleOrigin !== this.state.editPresetFolderName &&
                            isUnique
                        ) {
                            e.preventDefault();
                            e.stopPropagation();

                            this.renamePresetFolder(this.state.editPresetFolderDialog, this.state.editPresetFolderName)
                                .then(() => this.setState({ editPresetFolderDialog: null }));
                        }
                    }}
                    onChange={e => this.setState({ editPresetFolderName: e.target.value.replace(FORBIDDEN_CHARS, '_').trim() })}
                />
            </DialogContent>
            <DialogActions style={{ ...styles.alignRight, ...styles.buttonsContainer }}>
                <Button
                    variant="contained"
                    disabled={!this.state.editPresetFolderName ||
                        this.state.editFolderDialogTitleOrigin === this.state.editPresetFolderName ||
                        !isUnique ||
                        this.state.editPresetFolderName === HIDDEN_FOLDER}
                    onClick={() => {
                        this.renamePresetFolder(this.state.editPresetFolderDialog, this.state.editPresetFolderName)
                            .then(() => this.setState({ editPresetFolderDialog: null }));
                    }}
                    color="primary"
                    startIcon={<IconCheck />}
                >
                    {I18n.t('Rename')}
                </Button>
                <Button
                    color="grey"
                    variant="contained"
                    onClick={() => this.setState({ editPresetFolderDialog: null })}
                    startIcon={<IconCancel />}
                >
                    {I18n.t('Cancel')}
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
        const newId = `preset.0.${newPresetFolder}${newPresetFolder ? '.' : ''}${presetId}`;

        const isIdUnique = !Object.keys(this.state.presets).find(id => id === newId);

        return <Dialog
            maxWidth="md"
            fullWidth
            open={!0}
            key="movePresetDialog"
            onClose={() => this.setState({ movePresetDialog: null })}
        >
            <DialogTitle>{I18n.t('Move to folder')}</DialogTitle>
            <DialogContent>
                <FormControl style={styles.width100} variant="standard">
                    <InputLabel shrink>{I18n.t('Folder')}</InputLabel>
                    <Select
                        variant="standard"
                        autoFocus
                        fullWidth
                        style={styles.width100}
                        value={this.state.newPresetFolder || '__root__'}
                        onChange={e => this.setState({ newPresetFolder: e.target.value })}
                        onKeyUp={e => {
                            if (isIdUnique && e.which === 13) {
                                e.preventDefault();
                                e.stopPropagation();

                                this.setState({ movePresetDialog: null }, () =>
                                    this.addPresetToFolderPrefix(
                                        this.state.presets[presetId],
                                        this.state.newPresetFolder === '__root__' ? '' : this.state.newPresetFolder,
                                    ));
                            }
                        }}
                    >
                        { getFolderList(this.state.presetFolders || {}).map(folder =>
                            <MenuItem
                                key={folder.prefix}
                                value={folder.prefix || '__root__'}
                            >
                                { folder.prefix ? folder.prefix.replace('.', ' > ') : I18n.t('Root') }
                            </MenuItem>)}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions style={{ ...styles.alignRight, ...styles.buttonsContainer }}>
                <Button
                    variant="contained"
                    disabled={!isIdUnique}
                    color="primary"
                    onClick={() =>
                        this.setState({ movePresetDialog: null }, () =>
                            this.addPresetToFolderPrefix(this.state.presets[presetId], this.state.newPresetFolder === '__root__' ? '' : this.state.newPresetFolder))}
                    startIcon={<IconCheck />}
                >
                    {I18n.t('Move to folder')}
                </Button>
                <Button
                    color="grey"
                    variant="contained"
                    onClick={() => this.setState({ movePresetDialog: null })}
                    startIcon={<IconCancel />}
                >
                    <IconCancel style={styles.buttonIcon} />
                    {I18n.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    onError(e, comment) {
        comment && console.error(comment);
        this.props.onShowError(e);
    }

    async onDragFinish(source, target) {
        // new ID
        let newId = `${target}.${source.split('.').pop()}`;
        if (newId !== source) {
            // Check if a source yet exists
            if (this.state.presets[newId]) {
                newId += `_${I18n.t('copy')}`;
            }

            try {
                const obj = await this.props.socket.getObject(source);
                if (obj) {
                    try {
                        await this.props.socket.setObject(newId, obj);
                        await this.props.socket.delObject(source);
                        const newState = await this.getAllPresets();
                        this.setState(newState);
                    } catch (e) {
                        this.onError(e, `Cannot delete object ${newId}`);
                    }
                }
            } catch (e) {
                this.onError(e, `Cannot read object ${source}`);
            }
        }
    }

    renderRenameDialog() {
        if (!this.state.renameDialog) {
            return null;
        }

        const presetId = this.state.renameDialog;

        return <Dialog
            maxWidth="md"
            fullWidth
            open={!0}
            key="renameDialog"
            onClose={() => this.setState({ renameDialog: null })}
        >
            <DialogTitle>{I18n.t('Rename preset')}</DialogTitle>
            <DialogContent>
                <FormControl style={styles.width100} variant="standard">
                    <TextField
                        variant="standard"
                        fullWidth
                        autoFocus
                        label={I18n.t('Name')}
                        value={this.state.renamePresetDialogTitle}
                        onKeyUp={e => {
                            if (e.keyCode === 13 && this.state.renamePresetDialogTitle && this.isNameUnique(presetId, this.state.renamePresetDialogTitle)) {
                                e.stopPropagation();
                                e.preventDefault();
                                this.setState({ renameDialog: null }, () =>
                                    this.renamePreset(presetId, this.state.renamePresetDialogTitle));
                            }
                        }}
                        onChange={e => this.setState({ renamePresetDialogTitle: e.target.value })}
                    />
                </FormControl>
            </DialogContent>
            <DialogActions style={{ ...styles.alignRight, ...styles.buttonsContainer }}>
                <Button
                    variant="contained"
                    disabled={!this.state.renamePresetDialogTitle || !this.isNameUnique(presetId, this.state.renamePresetDialogTitle)}
                    color="primary"
                    onClick={() =>
                        this.setState({ renameDialog: null }, () =>
                            this.renamePreset(presetId, this.state.renamePresetDialogTitle))}
                    startIcon={<IconCheck />}
                >
                    {I18n.t('Rename')}
                </Button>
                <Button
                    color="grey"
                    variant="contained"
                    onClick={() => this.setState({ renameDialog: null })}
                    startIcon={<IconCancel />}
                >
                    {I18n.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    renderDeleteDialog() {
        return this.state.deletePresetDialog ? <ConfirmDialog
            title={I18n.t('Please confirm')}
            text={I18n.t('Are you sure for delete this preset?')}
            ok={I18n.t('Delete')}
            cancel={I18n.t('Cancel')}
            suppressQuestionMinutes={3}
            key="deletePresetDialog"
            dialogName="echarts.deletePresetDialog"
            onClose={isYes => {
                if (isYes) {
                    this.deletePreset(this.state.deletePresetDialog, () =>
                        this.setState({ deletePresetDialog: false }));
                } else {
                    this.setState({ deletePresetDialog: false });
                }
            }}
        /> : null;
    }

    /*
    renderSelectIdDialog() {
        if (!this.state.showAddStateDialog) {
            return null;
        }
        return <DialogSelectID
            key="selectDialog_add"
            socket={this.props.socket}
            dialogName="Add"
            type="state"
            title={I18n.t('Enable logging for state')}
            onOk={id => {
                console.log(`Selected ${id}`);
                const instance = this.state.showAddStateDialog.replace('system.adapter.', '');
                if (id) {
                    this.props.socket.getObject(id)
                        .then(obj => {
                            if (!obj || !obj.common) {
                                this.props.onShowError(I18n.t('Invalid object'));
                                return;
                            }
                            if (obj.common.custom && obj.common.custom[instance]) {
                                this.showToast(I18n.t('Already enabled'));
                                return;
                            }
                            obj.common.custom = obj.common.custom || {};
                            obj.common.custom[instance] = {
                                enabled: true,
                            };
                            this.props.socket.setObject(id, obj)
                                .then(() => {
                                    const instances = JSON.parse(JSON.stringify(this.state.instances));
                                    const inst = instances.find(item => item._id === `system.adapter.${instance}`);
                                    inst.enabledDP = inst.enabledDP || {};
                                    inst.enabledDP[obj._id] = obj;
                                    this.setState({ instances });
                                })
                                .catch(e => this.onError(e, `Cannot save object ${id}`));
                        })
                        .catch(e => this.onError(e, `Cannot read object ${id}`));
                }
                this.setState({ showAddStateDialog: false });
            }}
            onClose={() => this.setState({ showAddStateDialog: false })}
        />;
    }
*/

    async deletePreset(id, cb) {
        try {
            await this.props.socket.delObject(id);
            const newState = await this.getAllPresets();
            this.setState(newState, () => {
                // Todo: find the next preset
                if (id === this.props.selectedId) {
                    const keys = Object.keys(this.state.presets);
                    // first take nearest from the same folder, that any one
                    this.props.onSelectedChanged(keys[0] || null);
                }
            });
        } catch (e) {
            this.onError(e, `Cannot delete object ${id}`);
        }
        cb && cb();
    }

    async renamePreset(id, newTitle) {
        try {
            const preset = await this.props.socket.getObject(id);
            preset.common.name = newTitle;
            let newId = id.split('.');
            newId.splice(-1, 1);
            newId.push(newTitle.replace(FORBIDDEN_CHARS, '_').trim());
            newId = newId.join('.');

            preset._id = newId;
            await this.props.socket.setObject(preset._id, preset);
            await this.props.socket.delObject(id);
            const newState = await this.getAllPresets();
            if (id === this.props.selectedId) {
                this.setState(newState, () =>
                    this.props.onSelectedChanged(preset._id));
            } else {
                this.setState(newState);
            }
        } catch (e) {
            this.onError(e, `Cannot get object ${id}`);
        }
    }

    addPresetToFolderPrefix = async (preset, folderPrefix, noRefresh) => {
        const oldId = preset._id;
        const presetId = preset._id.split('.').pop();
        preset._id = `${this.props.adapterName}.0.${folderPrefix}${folderPrefix ? '.' : ''}${presetId}`;

        try {
            await this.props.socket.setObject(preset._id, preset);
            console.log(`Deleted ${oldId}`);
            await this.props.socket.delObject(oldId);
            console.log(`Set new ID: ${preset._id}`);
            if (!noRefresh) {
                const newState = await this.getAllPresets();
                this.setState(newState);
            }
        } catch (e) {
            this.onError(e, `Cannot delete object ${oldId}`);
        }
    };

    render() {
        return <>
            <DragDropContext backend={HTML5Backend}>
                <List sx={{ ...styles.scroll, ...styles.mainList }}>
                    {this.renderPresetsTree(this.state.presetFolders)}
                </List>
            </DragDropContext>
            {this.renderAddFolderDialog()}
            {this.renderRenameFolderDialog()}
            {this.renderDeleteDialog()}
            {this.renderMoveDialog()}
            {this.renderRenameDialog()}
        </>;
    }
}

MenuList.propTypes = {
    socket: PropTypes.object,
    onClosePresetFolderDialog: PropTypes.func,
    onCreatePreset: PropTypes.func,
    onCopyPreset: PropTypes.func,
    onShowReorder: PropTypes.func,
    search: PropTypes.string,
    reorder: PropTypes.bool,
    adapterName: PropTypes.string.isRequired,
    onShowError: PropTypes.func,
    onSelectedChanged: PropTypes.func.isRequired,
    scrollToSelect: PropTypes.bool,
    selectedId: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
    ]),
    theme: PropTypes.object,
    selectedPresetChanged: PropTypes.bool,
};

export default withWidth()(MenuList);
