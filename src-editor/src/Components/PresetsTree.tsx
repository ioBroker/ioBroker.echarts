import React, { Component } from 'react';

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
    ListItemButton,
    ListItem,
    CircularProgress,
    DialogActions,
    DialogContent,
    ListItemIcon,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
} from '@mui/material';

// icons
import {
    MdExpandMore as IconExpand,
    MdAdd as IconAdd,
    MdModeEdit as IconEdit,
    MdClose as IconCancel,
    MdCheck as IconCheck,
    MdDelete as IconDelete,
} from 'react-icons/md';
import { FaScroll as IconScript, FaFolder as IconFolderClosed, FaFolderOpen as IconFolderOpened } from 'react-icons/fa';

import {
    I18n,
    Utils,
    withWidth,
    DialogConfirm,
    IconCopy,
    type IobTheme,
    type AdminConnection,
} from '@iobroker/adapter-react-v5';

const HIDDEN_FOLDER = '_consumption_';

const hideFolder = !window.location.search.includes('hidden=false');

function getFolderList(folder: PresetFolder): PresetFolder[] {
    let result: PresetFolder[] = [];
    Object.values(folder.subFolders || {}).forEach(subFolder => (result = result.concat(getFolderList(subFolder))));

    return result;
}

interface DroppableProps {
    children: React.JSX.Element;
    onDrop: (name: string) => void;
    droppableId: string;
    name: string;
}

export const Droppable: React.FC<DroppableProps> = (props: DroppableProps): React.JSX.Element => {
    const { onDrop } = props;

    const [{ isOver, isOverAny }, drop] = useDrop({
        accept: 'item',
        drop: (item: any): void => onDrop(item.name),
        collect: monitor => ({
            isOver: monitor.isOver({ shallow: true }),
            isOverAny: monitor.isOver(),
        }),
    });

    return (
        <div
            ref={drop}
            style={{
                background: isOver ? '#40adff' : undefined,
                opacity: isOverAny ? 0.3: undefined,
            }}
        >
            {props.children}
        </div>
    );
};

interface PresetFolder {
    id: string;
    subFolders?: Record<string, PresetFolder>;
    presets?: Record<string, ioBroker.ChartObject>;
    prefix?: string;
}

interface DraggableProps {
    children: React.JSX.Element;
    name: string;
    draggableId: string;
}

export const Draggable = (props: DraggableProps): React.JSX.Element => {
    const { name } = props;
    const [{ opacity }, drag] = useDrag({
        type: 'item',
        item: () => ({ name }),
        collect: monitor => ({ opacity: monitor.isDragging() ? 0.3 : 1 }),
    });

    // About transform: https://github.com/react-dnd/react-dnd/issues/832#issuecomment-442071628
    return (
        <div
            ref={drag}
            style={{ opacity, transform: 'translate3d(0, 0, 0)' }}
        >
            {props.children}
        </div>
    );
};

const LEVEL_PADDING = 16;
const FORBIDDEN_CHARS = /[.\][*,;'"`<>\\?]/g;

const styles: Record<string, any> = {
    noGutters: {
        pt: 0,
        pb: 0,
        width: '100%',
    },
    changed: (theme: IobTheme): any => ({
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            top: 2,
            right: 2,
            width: 5,
            height: 5,
            borderRadius: 5,
            background: theme.palette.mode === 'dark' ? '#CC0000' : '#CC0000',
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
    itemIconPreset: (theme: IobTheme): React.CSSProperties => ({
        color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
        position: 'relative',
    }),
    folderIconPreset: (theme: IobTheme): React.CSSProperties => ({
        color: theme.palette.mode === 'dark' ? theme.palette.secondary.dark : theme.palette.secondary.light,
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
        width: '100%',
    },
    mainList: {
        width: 'calc(100% - 8px)',
        ml: '8px',
    },
    iconCopy: {
        width: 16,
    },
    listItemSecondaryAction: {
        right: 7,
    },
    listItemTitle: {
        lineHeight: 1,
        width: '100%',
    },
    listItemTitleDiv: {
        display: 'inline-block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
    },
    itemIconNumber: (theme: IobTheme): React.CSSProperties => ({
        position: 'absolute',
        fontSize: 12,
        top: 8,
        left: -1,
        width: '100%',
        textAlign: 'center',
        color: theme.palette.mode === 'dark' ? '#000' : '#FFF',
    }),
};

interface PresetsTreeProps {
    socket: AdminConnection;
    onClosePresetFolderDialog: (cb?: () => void) => void;
    onCreatePreset: (parentId: string) => void;
    onCopyPreset: (presetId: string) => void;
    onShowReorder: (reorder: boolean) => void;
    search: string;
    reorder: boolean;
    adapterName: string;
    onShowError: (error: string) => void;
    onSelectedChanged: (presetId: string | null, cb?: (presetId: false | string) => void) => void;
    scrollToSelect: boolean;
    selectedId: string;
    theme: IobTheme;
    selectedPresetChanged: boolean;
    addPresetFolderDialog: boolean;
}

interface PresetsTreeState {
    presetsOpened: string[];
    presets: Record<string, ioBroker.ChartObject>;
    presetFolders: PresetFolder | null;
    changingPreset: string;
    deletePresetDialog: string;
    movePresetDialog: string;
    newPresetFolder: string;
    addPresetFolderName: string;
    editPresetFolderDialog: PresetFolder | null;
    editPresetFolderName: string;
    editFolderDialogTitleOrigin: string;
    renameDialog: string;
    renamePresetDialogTitle: string;
}

class PresetsTree extends Component<PresetsTreeProps, PresetsTreeState> {
    private readonly refSelected: React.RefObject<HTMLDivElement>;
    private scrollToSelect = false;
    private scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(props: PresetsTreeProps) {
        super(props);

        let presetsOpened: string[];
        try {
            presetsOpened = JSON.parse(window.localStorage.getItem('App.echarts.presets.opened')) || [];
        } catch {
            presetsOpened = [];
        }

        this.state = {
            presetsOpened,

            presets: {},
            presetFolders: null,
            changingPreset: '',

            deletePresetDialog: '',
            movePresetDialog: '',
            newPresetFolder: '',
            addPresetFolderName: '',
            editPresetFolderDialog: null,
            editFolderDialogTitleOrigin: '',
            editPresetFolderName: '',
            renameDialog: '',
            renamePresetDialogTitle: '',
        };
        this.refSelected = React.createRef();

        void this.getAllPresets().then(newState => this.setState(newState as PresetsTreeState));
    }

    async componentDidMount(): Promise<void> {
        await this.props.socket.subscribeObject(`${this.props.adapterName}.0.*`, this.onPresetChange);
    }

    async componentWillUnmount(): Promise<void> {
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }
        await this.props.socket.unsubscribeObject(`${this.props.adapterName}.0.*`, this.onPresetChange);
    }

    onPresetChange = (id: string, obj: ioBroker.ChartObject | null | undefined): void => {
        if (!id?.startsWith('echarts.')) {
            return;
        }
        let presets: Record<string, ioBroker.ChartObject>;
        let changed = false;
        if (obj) {
            obj.common = obj.common || ({} as ioBroker.ChartCommon);
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
            const newState: Partial<PresetsTreeState> = {
                presets,
                changingPreset: '',
                presetFolders: PresetsTree.buildPresetTree(presets, emptyFolders),
            };
            setTimeout(() => this.informAboutSubFolders(newState.presetFolders), 200);
            this.setState(newState as PresetsTreeState);
        }
    };

    informAboutSubFolders(presetFolders?: PresetFolder): void {
        presetFolders = presetFolders || this.state.presetFolders || ({} as PresetFolder);
        this.props.onShowReorder(!!Object.keys(presetFolders.subFolders || {}).length);
    }

    getEmptyFolders(presetFolders?: PresetFolder, _path?: string[], _result?: string[]): string[] {
        _result = _result || [];
        _path = _path || [];
        presetFolders = presetFolders || this.state.presetFolders || ({} as PresetFolder);

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

    async getAllPresets(
        newState?: Partial<PresetsTreeState>,
        emptyFolders?: string[],
    ): Promise<Partial<PresetsTreeState>> {
        newState = newState || {};
        const presets: Record<string, ioBroker.ChartObject> = {};

        const res: Record<string, ioBroker.ChartObject> = await this.props.socket.getObjectViewSystem(
            'chart',
            `${this.props.adapterName}.`,
            `${this.props.adapterName}.\u9999`,
        );
        if (res) {
            Object.values(res).forEach(
                preset => preset._id && !preset._id.toString().endsWith('.') && (presets[preset._id] = preset),
            );
        }
        newState.presets = presets;
        newState.changingPreset = '';

        // fill missing info
        Object.keys(newState.presets).forEach(id => {
            const presetObj = newState.presets[id];
            presetObj.common = presetObj.common || ({} as ioBroker.ChartCommon);
            presetObj.native = presetObj.native || {};
        });

        // store all empty folders
        emptyFolders = emptyFolders || this.getEmptyFolders();
        newState.presetFolders = PresetsTree.buildPresetTree(presets, emptyFolders);
        setTimeout(() => this.informAboutSubFolders(newState.presetFolders), 200);
        return newState;
    }

    renderTreePreset(item: ioBroker.ChartObject, level?: number): React.JSX.Element | React.JSX.Element[] | null {
        const preset = this.state.presets[item._id];
        const name =
            typeof item.common.name === 'object'
                ? item.common.name[I18n.getLanguage()] || item.common.name.en
                : item.common.name;

        if (!preset || (this.props.search && !name.includes(this.props.search))) {
            return null;
        }

        level = level || 0;

        const depthPx = (this.props.reorder ? level : level - 1) * LEVEL_PADDING;

        let iconNumber: React.JSX.Element | null = null;
        if ((item.native.data.l || item.native.data.lines)?.length > 1) {
            iconNumber =
                <Box sx={styles.itemIconNumber}>{(item.native.data.l || item.native.data.lines)?.length}</Box>;
        }

        const listItem = (
            <ListItemButton
                sx={{
                    '&.MuiListItemButton-gutters': Utils.getStyle(
                        this.props.theme,
                        styles.noGutters,
                        this.props.selectedId === preset._id && this.props.selectedPresetChanged && styles.changed,
                    ),
                    backgroundColor: (theme: IobTheme): string =>
                        this.props.selectedId === item._id ? theme.palette.secondary.main : undefined,
                }}
                style={{ paddingLeft: depthPx }}
                key={item._id}
                className={this.props.reorder ? 'item-reorder' : ''}
                ref={this.props.selectedId === item._id ? this.refSelected : null}
                onClick={() => this.props.onSelectedChanged(preset._id)}
            >
                <ListItemIcon sx={Utils.getStyle(this.props.theme, styles.itemIconRoot, styles.itemIconPreset)}>
                    <IconScript style={styles.itemIcon} />
                    {iconNumber}
                </ListItemIcon>
                <ListItemText
                    sx={{
                        '& .MuiListItemText-primary': styles.listItemTitle,
                        '& .MuiListItemText-secondary': styles.listItemSubTitle,
                    }}
                    primary={
                        <div style={styles.listItemTitleDiv}>
                            {Utils.getObjectNameFromObj(preset, null, { language: I18n.getLanguage() })}
                        </div>
                    }
                    secondary={Utils.getObjectNameFromObj(preset, null, { language: I18n.getLanguage() }, true)}
                />
                {this.state.changingPreset === preset._id ? (
                    <CircularProgress size={24} />
                ) : !this.props.reorder ? (
                    <>
                        {this.props.selectedId !== preset._id || !this.props.selectedPresetChanged ? (
                            <IconButton
                                size="small"
                                aria-label="Rename"
                                title={I18n.t('Rename')}
                                onClick={e => {
                                    e.stopPropagation();
                                    this.setState({
                                        renameDialog: preset._id,
                                        renamePresetDialogTitle: name,
                                    });
                                }}
                            >
                                <IconEdit />
                            </IconButton>
                        ) : null}
                        {/* level || anySubFolders ?
                            <IconButton
                                size="small"
                                aria-label="Move to folder"
                                title={ I18n.t('Move to folder') }
                                onClick={ () => this.setState({ movePresetDialog: preset._id, newPresetFolder: getFolderPrefix(preset._id) }) }>
                                <IconMoveToFolder />
                            </IconButton> : null */}
                        <IconButton
                            size="small"
                            aria-label="Copy"
                            title={I18n.t('Copy')}
                            onClick={() => this.props.onCopyPreset(preset._id)}
                        >
                            <IconCopy style={styles.iconCopy} />
                        </IconButton>
                        <IconButton
                            size="small"
                            aria-label="Delete"
                            title={I18n.t('Delete')}
                            onClick={() => this.setState({ deletePresetDialog: preset._id })}
                        >
                            <IconDelete />
                        </IconButton>
                    </>
                ) : null}
            </ListItemButton>
        );

        if (this.props.reorder) {
            return (
                <Draggable
                    key={`draggable_${item._id}`}
                    name={item._id}
                    draggableId={item._id}
                >
                    {listItem}
                </Draggable>
            );
        }

        return listItem;
    }

    renderPresetsTree(parent: PresetFolder, level?: number): React.JSX.Element[] {
        const result: React.JSX.Element[] = [];

        level = level || 0;
        const presetsOpened =
            this.props.reorder ||
            (this.state.presetsOpened && parent ? this.state.presetsOpened.includes(parent.prefix) : false);

        const depthPx = (this.props.reorder ? level : level - 1) * LEVEL_PADDING;

        const reactChildren = [];
        if (parent && (presetsOpened || !parent.id)) {
            // root cannot be closed and have id = ''
            const values = Object.values(parent.presets || {});
            const subFolders = Object.values(parent.subFolders || {});

            // add first subfolders
            subFolders
                .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0))
                .filter(subFolder => !(hideFolder && subFolder.id === HIDDEN_FOLDER))
                .forEach(subFolder => reactChildren.push(this.renderPresetsTree(subFolder, level + 1)));

            // Add as second the presets
            if (values.length || subFolders.length) {
                values
                    .sort((a, b) => (a._id > b._id ? 1 : a._id < b._id ? -1 : 0))
                    .forEach(preset => reactChildren.push(this.renderTreePreset(preset, level + 1)));
            } else if (level === 0) {
                reactChildren.push(
                    <ListItem
                        key="no presets"
                        sx={{ '&.MuiListItem-gutters': styles.noGutters }}
                    >
                        <ListItemText style={styles.folderItem}>{I18n.t('No presets created yet')}</ListItemText>
                    </ListItem>,
                );
            }
        }

        // Show folder item
        if (parent && (parent.id || this.props.reorder)) {
            const folder = (
                <ListItem
                    key={parent.prefix}
                    sx={{ '&.MuiListItem-gutters': styles.noGutters }}
                    className={this.props.reorder ? 'folder-reorder' : ''}
                    style={{
                        ...styles.width100,
                        ...styles.folderItem,
                        paddingLeft: depthPx,
                    }}
                    secondaryAction={
                        <>
                            {!this.props.reorder && parent && parent.id && presetsOpened ? (
                                <IconButton
                                    size="small"
                                    onClick={() => this.props.onCreatePreset(parent.id)}
                                    title={I18n.t('Create new preset')}
                                >
                                    <IconAdd />
                                </IconButton>
                            ) : null}
                            {!this.props.reorder ? (
                                <IconButton
                                    size="small"
                                    onClick={() =>
                                        this.setState({
                                            editPresetFolderDialog: parent,
                                            editPresetFolderName: parent.id,
                                            editFolderDialogTitleOrigin: parent.id,
                                        })
                                    }
                                    title={I18n.t('Edit folder name')}
                                >
                                    <IconEdit />
                                </IconButton>
                            ) : null}
                            {!this.props.reorder ? (
                                <IconButton
                                    size="small"
                                    onClick={() => this.togglePresetsFolder(parent)}
                                    title={presetsOpened ? I18n.t('Collapse') : I18n.t('Expand')}
                                >
                                    <IconExpand
                                        style={{
                                            transform: presetsOpened ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s ease-in-out',
                                        }}
                                    />
                                </IconButton>
                            ) : null}
                        </>
                    }
                >
                    <ListItemIcon
                        sx={Utils.getStyle(this.props.theme, styles.itemIconRoot, styles.folderIconPreset)}
                        onClick={() => this.togglePresetsFolder(parent)}
                    >
                        {presetsOpened ? (
                            <IconFolderOpened style={{ ...styles.itemIcon, ...styles.itemIconFolder }} />
                        ) : (
                            <IconFolderClosed style={{ ...styles.itemIcon, ...styles.itemIconFolder }} />
                        )}
                    </ListItemIcon>
                    <ListItemText>{parent.id || I18n.t('Root')}</ListItemText>
                </ListItem>
            );

            if (!this.props.reorder) {
                result.push(folder);
            } else {
                result.push(
                    <Droppable
                        droppableId="tree"
                        key={`droppable_${parent.prefix}`}
                        name={parent.prefix}
                        onDrop={name => this.onDragFinish(name, `echarts.0${parent.prefix ? '.' : ''}${parent.prefix}`)}
                    >
                        {folder}
                    </Droppable>,
                );
            }
        }

        reactChildren.forEach(r => result.push(r));

        return result;
    }

    async renamePresetFolder(folder: PresetFolder, newName: string): Promise<void> {
        this.setState({ changingPreset: folder.id });
        let newSelectedId: string;
        const pos = this.state.presetsOpened.indexOf(folder.prefix);
        // if selected folder opened, replace its ID in this.state.opened
        if (pos !== -1) {
            const presetsOpened = [...this.state.presetsOpened];
            presetsOpened.splice(pos, 1);
            presetsOpened.push(newName);
            presetsOpened.sort();
            this.setState({ presetsOpened });
        }

        const prefix = folder.prefix.split('.');
        prefix[prefix.length - 1] = newName;
        const prefixStr = prefix.join('.');

        if (Object.keys(folder.presets).find(id => id === this.props.selectedId)) {
            newSelectedId = `${this.props.adapterName}.0.${prefixStr}.${this.props.selectedId.split('.').pop()}`;
        }

        const ids = Object.keys(folder.presets);
        for (let i = 0; i < ids.length; i++) {
            await this.addPresetToFolderPrefix(folder.presets[ids[i]], prefixStr, true);
        }
        const emptyFolders = this.getEmptyFolders();
        const _pos = emptyFolders.indexOf(folder.prefix);
        if (_pos !== -1) {
            emptyFolders[_pos] = prefixStr;
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
            this.setState(newState as PresetsTreeState, () => this.props.onSelectedChanged(newSelectedId));
        }, 100);
    }

    isNameUnique(presetId: string, name: string): boolean {
        const len = presetId.split('.').length;
        if (name === HIDDEN_FOLDER) {
            return false;
        }
        return !Object.keys(this.state.presets).find(
            id => len === id.split('.').length && this.state.presets[id].common.name === name,
        );
    }

    static buildPresetTree(presets: Record<string, ioBroker.ChartObject>, emptyFolders: string[]): PresetFolder {
        // console.log(presets);
        const presetsList: ioBroker.ChartObject[] = Object.values(presets);

        const presetFolders: PresetFolder = {
            subFolders: {},
            presets: {},
            id: '',
            prefix: '',
        };

        // create missing folders
        presetsList.forEach(preset => {
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

        emptyFolders?.forEach(id => {
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

        return presetFolders;
    }

    findFolder(parent: PresetFolder, folder: PresetFolder): PresetFolder | null {
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

    addFolder(parentFolder: PresetFolder, id: string): Promise<void> {
        const presetFolders: PresetFolder = JSON.parse(JSON.stringify(this.state.presetFolders));
        parentFolder = parentFolder || presetFolders;
        const _parentFolder = this.findFolder(presetFolders, parentFolder);

        const presetsOpened = [...this.state.presetsOpened];

        _parentFolder.subFolders[id] = {
            presets: {},
            subFolders: {},
            id,
            prefix: _parentFolder.prefix ? `${_parentFolder.prefix}.${id}` : id,
        };

        presetsOpened.push(id);

        return new Promise(resolve => {
            this.setState({ presetFolders, presetsOpened }, () => resolve());
        });
    }

    togglePresetsFolder(folder: PresetFolder): void {
        const presetsOpened = [...this.state.presetsOpened];
        const pos = presetsOpened.indexOf(folder.prefix);
        if (pos === -1) {
            presetsOpened.push(folder.prefix);
        } else {
            presetsOpened.splice(pos, 1);

            // If active preset is inside this folder, select the first preset
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

    renderAddFolderDialog(): React.JSX.Element | null {
        return this.props.addPresetFolderDialog ? (
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
                        onChange={e =>
                            this.setState({ addPresetFolderName: e.target.value.replace(FORBIDDEN_CHARS, '_').trim() })
                        }
                        onKeyUp={e => {
                            if (
                                this.state.addPresetFolderName &&
                                e.key === 'Enter' &&
                                this.state.addPresetFolderName !== HIDDEN_FOLDER
                            ) {
                                e.preventDefault();
                                e.stopPropagation();
                                void this.addFolder(null, this.state.addPresetFolderName).then(() =>
                                    this.props.onClosePresetFolderDialog(() => this.informAboutSubFolders()),
                                );
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions style={{ ...styles.alignRight, ...styles.buttonsContainer }}>
                    <Button
                        variant="contained"
                        disabled={
                            !this.state.addPresetFolderName ||
                            !!Object.keys((this.state.presetFolders && this.state.presetFolders.subFolders) || {}).find(
                                name => name === this.state.addPresetFolderName,
                            ) ||
                            this.state.addPresetFolderName === HIDDEN_FOLDER
                        }
                        onClick={() =>
                            this.addFolder(null, this.state.addPresetFolderName).then(() =>
                                this.props.onClosePresetFolderDialog(() => this.informAboutSubFolders()),
                            )
                        }
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
            </Dialog>
        ) : null;
    }

    renderRenameFolderDialog(): React.JSX.Element | null {
        if (!this.state.editPresetFolderDialog) {
            return null;
        }

        const isUnique = !Object.keys((this.state.presetFolders && this.state.presetFolders.subFolders) || {}).find(
            folder => folder === this.state.editPresetFolderName,
        );

        return (
            <Dialog
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
                            if (
                                this.state.editPresetFolderName &&
                                e.key === 'Enter' &&
                                this.state.editPresetFolderName !== HIDDEN_FOLDER &&
                                this.state.editFolderDialogTitleOrigin !== this.state.editPresetFolderName &&
                                isUnique
                            ) {
                                e.preventDefault();
                                e.stopPropagation();

                                void this.renamePresetFolder(
                                    this.state.editPresetFolderDialog,
                                    this.state.editPresetFolderName,
                                ).then(() => this.setState({ editPresetFolderDialog: null }));
                            }
                        }}
                        onChange={e =>
                            this.setState({ editPresetFolderName: e.target.value.replace(FORBIDDEN_CHARS, '_').trim() })
                        }
                    />
                </DialogContent>
                <DialogActions style={{ ...styles.alignRight, ...styles.buttonsContainer }}>
                    <Button
                        variant="contained"
                        disabled={
                            !this.state.editPresetFolderName ||
                            this.state.editFolderDialogTitleOrigin === this.state.editPresetFolderName ||
                            !isUnique ||
                            this.state.editPresetFolderName === HIDDEN_FOLDER
                        }
                        onClick={() => {
                            void this.renamePresetFolder(
                                this.state.editPresetFolderDialog,
                                this.state.editPresetFolderName,
                            ).then(() => this.setState({ editPresetFolderDialog: null }));
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
            </Dialog>
        );
    }

    renderMoveDialog(): React.JSX.Element | null {
        if (!this.state.movePresetDialog) {
            return null;
        }

        const newPresetFolder = this.state.newPresetFolder === '__root__' ? '' : this.state.newPresetFolder;
        const presetId = this.state.movePresetDialog;
        const newId = `preset.0.${newPresetFolder}${newPresetFolder ? '.' : ''}${presetId}`;

        const isIdUnique = !Object.keys(this.state.presets).find(id => id === newId);

        return (
            <Dialog
                maxWidth="md"
                fullWidth
                open={!0}
                key="movePresetDialog"
                onClose={() => this.setState({ movePresetDialog: null })}
            >
                <DialogTitle>{I18n.t('Move to folder')}</DialogTitle>
                <DialogContent>
                    <FormControl
                        style={styles.width100}
                        variant="standard"
                    >
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
                                        ),
                                    );
                                }
                            }}
                        >
                            {getFolderList(this.state.presetFolders || ({} as PresetFolder)).map(folder => (
                                <MenuItem
                                    key={folder.prefix}
                                    value={folder.prefix || '__root__'}
                                >
                                    {folder.prefix ? folder.prefix.replace('.', ' > ') : I18n.t('Root')}
                                </MenuItem>
                            ))}
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
                                this.addPresetToFolderPrefix(
                                    this.state.presets[presetId],
                                    this.state.newPresetFolder === '__root__' ? '' : this.state.newPresetFolder,
                                ),
                            )
                        }
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
            </Dialog>
        );
    }

    onError(e: Error | string, comment: string): void {
        if (comment) {
            console.error(comment);
        }
        this.props.onShowError(e.toString());
    }

    async onDragFinish(source: string, target: string): Promise<void> {
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
                        this.setState(newState as PresetsTreeState);
                    } catch (e) {
                        this.onError(e, `Cannot delete object ${newId}`);
                    }
                }
            } catch (e) {
                this.onError(e, `Cannot read object ${source}`);
            }
        }
    }

    renderRenameDialog(): React.JSX.Element | null {
        if (!this.state.renameDialog) {
            return null;
        }

        const presetId = this.state.renameDialog;

        return (
            <Dialog
                maxWidth="md"
                fullWidth
                open={!0}
                key="renameDialog"
                onClose={() => this.setState({ renameDialog: null })}
            >
                <DialogTitle>{I18n.t('Rename preset')}</DialogTitle>
                <DialogContent>
                    <FormControl
                        style={styles.width100}
                        variant="standard"
                    >
                        <TextField
                            variant="standard"
                            fullWidth
                            autoFocus
                            label={I18n.t('Name')}
                            value={this.state.renamePresetDialogTitle}
                            onKeyUp={e => {
                                if (
                                    e.keyCode === 13 &&
                                    this.state.renamePresetDialogTitle &&
                                    this.isNameUnique(presetId, this.state.renamePresetDialogTitle)
                                ) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    this.setState({ renameDialog: null }, () =>
                                        this.renamePreset(presetId, this.state.renamePresetDialogTitle),
                                    );
                                }
                            }}
                            onChange={e => this.setState({ renamePresetDialogTitle: e.target.value })}
                        />
                    </FormControl>
                </DialogContent>
                <DialogActions style={{ ...styles.alignRight, ...styles.buttonsContainer }}>
                    <Button
                        variant="contained"
                        disabled={
                            !this.state.renamePresetDialogTitle ||
                            !this.isNameUnique(presetId, this.state.renamePresetDialogTitle)
                        }
                        color="primary"
                        onClick={() =>
                            this.setState({ renameDialog: null }, () =>
                                this.renamePreset(presetId, this.state.renamePresetDialogTitle),
                            )
                        }
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
            </Dialog>
        );
    }

    renderDeleteDialog(): React.JSX.Element | null {
        return this.state.deletePresetDialog ? (
            <DialogConfirm
                title={I18n.t('Please confirm')}
                text={I18n.t('Are you sure for delete this preset?')}
                ok={I18n.t('Delete')}
                cancel={I18n.t('Cancel')}
                suppressQuestionMinutes={3}
                key="deletePresetDialog"
                dialogName="echarts.deletePresetDialog"
                onClose={isYes => {
                    if (isYes) {
                        void this.deletePreset(this.state.deletePresetDialog, () =>
                            this.setState({ deletePresetDialog: '' }),
                        );
                    } else {
                        this.setState({ deletePresetDialog: '' });
                    }
                }}
            />
        ) : null;
    }

    async deletePreset(id: string, cb: () => void): Promise<void> {
        try {
            await this.props.socket.delObject(id);
            const newState = await this.getAllPresets();
            this.setState(newState as PresetsTreeState, () => {
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
        cb();
    }

    async renamePreset(id: string, newTitle: string): Promise<void> {
        try {
            const preset = await this.props.socket.getObject(id);
            preset.common.name = newTitle;
            const newId = id.split('.');
            newId.splice(-1, 1);
            newId.push(newTitle.replace(FORBIDDEN_CHARS, '_').trim());

            preset._id = newId.join('.');
            await this.props.socket.setObject(preset._id, preset);
            await this.props.socket.delObject(id);
            const newState = await this.getAllPresets();
            if (id === this.props.selectedId) {
                this.setState(newState as PresetsTreeState, () => this.props.onSelectedChanged(preset._id));
            } else {
                this.setState(newState as PresetsTreeState);
            }
        } catch (e) {
            this.onError(e, `Cannot get object ${id}`);
        }
    }

    addPresetToFolderPrefix = async (
        preset: ioBroker.ChartObject,
        folderPrefix: string,
        noRefresh?: boolean,
    ): Promise<void> => {
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
                this.setState(newState as PresetsTreeState);
            }
        } catch (e) {
            this.onError(e, `Cannot delete object ${oldId}`);
        }
    };

    render(): React.JSX.Element {
        if (this.scrollToSelect !== this.props.scrollToSelect) {
            this.scrollToSelect = this.props.scrollToSelect;
            if (this.scrollToSelect && !this.scrollTimeout) {
                this.scrollTimeout = setTimeout(() => {
                    this.scrollTimeout = null;
                    this.refSelected.current?.scrollIntoView({
                        behavior: 'auto',
                        block: 'center',
                        inline: 'center',
                    });
                }, 100);
            }
        }

        return (
            <>
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
            </>
        );
    }
}

// @ts-expect-error idk
export default withWidth()(PresetsTree);
