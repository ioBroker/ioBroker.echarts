import React, { Component } from 'react';

import { Droppable, Draggable } from 'react-beautiful-dnd';

import { IconButton, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';

// icons
import { MdExpandMore as IconExpand, MdAdd as IconAdd } from 'react-icons/md';
import {
    FaFolder as IconFolderClosed,
    FaFolderOpen as IconFolderOpened,
    FaWaveSquare as IconBooleanChart,
} from 'react-icons/fa';

import { AiOutlineAreaChart as IconChart } from 'react-icons/ai';

import {
    I18n,
    Utils,
    withWidth,
    DialogSelectID,
    type IobTheme,
    type AdminConnection,
} from '@iobroker/adapter-react-v5';
import Switch from './Switch';

function sortObj(a: CustomInstance | string, b: CustomInstance | string): 1 | -1 | 0 {
    const aid = typeof a === 'object' ? a._id.replace('system.adapter.', '') : a.replace('system.adapter.', '');
    const bid = typeof b === 'object' ? b._id.replace('system.adapter.', '') : b.replace('system.adapter.', '');
    if (aid > bid) {
        return 1;
    }
    if (aid < bid) {
        return -1;
    }
    return 0;
}

function getEnumsForId(enums: Record<string, ioBroker.EnumObject>, id: string): string[] {
    const result: string[] = [];
    Object.keys(enums).forEach(eID => {
        const en = enums[eID];
        if (en.common.members.includes(id) && !result.includes(eID)) {
            result.push(eID);
        }
    });
    return result;
}

const LEVEL_PADDING = 16;

const styles: Record<string, any> = {
    noGutters: {
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        width: '100%',
    },
    itemIconFolder: {
        cursor: 'pointer',
        marginLeft: 8,
    },
    width100: {
        width: '100%',
    },
    itemIcon: {
        width: 32,
        height: 32,
        marginRight: 4,
    },
    itemIconRoot: {
        minWidth: 24,
    },
    itemNameDiv: {
        marginTop: 5,
    },
    itemName: {
        verticalAlign: 'top',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: 'calc(100% - 26px)',
        display: 'inline-block',
    },
    itemName0: {},
    itemName1: {
        fontSize: 14,
        opacity: 0.6,
    },
    itemName2: {
        fontSize: 12,
        opacity: 0.6,
    },
    itemName3: {
        fontSize: 10,
        opacity: 0.6,
    },
    itemName4: {
        fontSize: 8,
        opacity: 0.6,
    },
    itemName5: {
        fontSize: 6,
        opacity: 0.6,
    },
    groupName: {
        verticalAlign: 'top',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: 'calc(100% - 66px)',
        display: 'inline-block',
    },
    itemSecondaryName: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
        fontSize: 'smaller',
        opacity: 0.6,
        fontStyle: 'italic',
        whiteSpace: 'nowrap',
        display: 'inline-block',
    },
    listItemSubTitle: {
        fontSize: 'smaller',
        opacity: 0.6,
        fontStyle: 'italic',
    },
    adapterIcon: {
        width: 20,
        height: 20,
        borderRadius: 2,
        marginRight: 4,
    },
    mainList: {
        width: '100%',
    },
    listItemSecondaryAction: {
        marginRight: 4,
    },
    folderItem: (theme: IobTheme): any => ({
        backgroundColor: theme.palette.secondary.main,
        pl: '8px',
    }),
};

interface ChartsTreeProps {
    socket: AdminConnection;
    instances: ioBroker.InstanceObject[];
    adapterName: string;
    onShowToast: (message: string) => void;
    onShowError: (error: string) => void;
    onChangeList: (list: { id: string; instance: string }[]) => void;
    chartsList: { id: string; instance: string }[];
    theme: IobTheme;
    multiple: boolean;
    search: string;
    groupBy: '' | 'rooms' | 'functions';
    scrollToSelect: boolean;
    selectedId: { id: string; instance: string };
    onSelectedChanged: (selectedId: { id: string; instance: string } | null, cb?: () => void) => void;
}

type CustomInstance = {
    _id: string;
    enabledDP: Record<string, ioBroker.StateObject & { group?: string }>;
    names: Record<string, string | string[]>;
    statesEnums: Record<string, string[]>;
    icon: string;
    name: string;
    types: Record<string, string>;
    icons: Record<string, string>;
    enums?: string[];
};

interface ChartsTreeState {
    instances: CustomInstance[];
    chartsOpened: Record<string, boolean>;
    enums: Record<string, ioBroker.EnumObject> | null;
    showAddStateDialog: string;
}

class ChartsTree extends Component<ChartsTreeProps, ChartsTreeState> {
    private readonly refSelected: React.RefObject<HTMLDivElement>;
    private scrollToSelect = false;
    private adapterPromises: Record<string, Promise<ioBroker.Object>> = {};

    constructor(props: ChartsTreeProps) {
        super(props);

        let chartsOpened;
        try {
            chartsOpened = JSON.parse(window.localStorage.getItem('App.echarts.opened')) || {};
        } catch {
            chartsOpened = {};
        }

        this.state = {
            instances: [], // chart folders
            chartsOpened,
            enums: null,
            showAddStateDialog: '',
        };

        this.refSelected = React.createRef();

        void this.getAllEnums()
            .then(newState => this.getAllCharts(newState))
            .then(newState =>
                this.setState(
                    newState as ChartsTreeState,
                    () => this.props.selectedId && this.props.onSelectedChanged(this.props.selectedId),
                ),
            );
    }

    UNSAFE_componentWillReceiveProps(nextProps: ChartsTreeProps /* , nextContext */): void {
        if (nextProps.scrollToSelect !== this.scrollToSelect) {
            this.scrollToSelect = nextProps.scrollToSelect;

            this.scrollToSelect &&
                setTimeout(() => {
                    this.refSelected.current?.scrollIntoView({
                        behavior: 'auto',
                        block: 'center',
                        inline: 'center',
                    });
                }, 100);
        }
    }

    async getAllEnums(newState?: Partial<ChartsTreeState>): Promise<Partial<ChartsTreeState>> {
        newState = newState || ({} as Partial<ChartsTreeState>);
        try {
            const enums = await this.props.socket.getEnums();
            newState.enums = {};
            Object.keys(enums).forEach(id => {
                if (
                    (id.startsWith('enum.functions.') || id.startsWith('enum.rooms.')) &&
                    enums[id]?.common?.members?.length
                ) {
                    newState.enums[id] = {
                        _id: id,
                        common: {
                            members: [...enums[id].common.members],
                            name: Utils.getObjectNameFromObj(enums[id], null, { language: I18n.getLanguage() }),
                        },
                        type: 'enum',
                        native: {},
                    };
                }
            });
            return newState;
        } catch (e) {
            this.onError(e, 'Cannot read enums');
            return {} as Partial<ChartsTreeState>;
        }
    }

    async getAdapterIcon(id: string): Promise<string | null> {
        const p = id.split('.');

        if (p.length < 2 || p[0] === '0_userdata') {
            return null;
        }
        let instanceId;
        if (p[0] === 'system') {
            p.splice(4);
            instanceId = p.join('.');
        } else {
            p.splice(2);
            instanceId = `system.adapter.${p.join('.')}`;
        }

        if (!(this.adapterPromises[instanceId] instanceof Promise)) {
            this.adapterPromises[instanceId] = this.props.socket.getObject(instanceId);
        }

        try {
            const obj = await this.adapterPromises[instanceId];
            if (obj?.common?.icon) {
                return Utils.getObjectIcon(obj);
            }
        } catch (e) {
            this.onError(e, `Cannot read object ${instanceId}`);
        }
        return null;
    }

    onError(e: Error | string, comment?: string): void {
        if (comment) {
            console.error(comment);
        }
        this.props.onShowError(e.toString());
    }

    async getChartIconAndName(
        groupId: string,
        obj: ioBroker.StateObject,
    ): Promise<{ groupId: string; id: string; img: string; name: string[] }> {
        let icon;
        const name = [];
        if (!obj) {
            return null;
        }
        const language = I18n.getLanguage();
        const id = obj._id;

        if (obj.common) {
            if (obj.common.icon) {
                icon = Utils.getObjectIcon(obj);
            }
            name.push(Utils.getObjectNameFromObj(obj, null, { language }));
        }
        // try to read parent
        const channelID = Utils.getParentId(obj._id);
        if (channelID?.split('.').length > 2) {
            try {
                const channelObj = await this.props.socket.getObject(channelID);
                if (
                    channelObj &&
                    (channelObj.type === 'channel' || channelObj.type === 'device') &&
                    channelObj.common
                ) {
                    if (!icon && channelObj.common.icon) {
                        icon = Utils.getObjectIcon(channelObj);
                    }
                    name.push(Utils.getObjectNameFromObj(channelObj, null, { language }));
                    const deviceID = Utils.getParentId(channelID);
                    if (deviceID?.split('.').length > 2) {
                        const deviceObj = await this.props.socket.getObject(deviceID);
                        if (
                            deviceObj &&
                            (deviceObj.type === 'channel' || deviceObj.type === 'device') &&
                            deviceObj.common
                        ) {
                            if (!icon && deviceObj.common.icon) {
                                icon = Utils.getObjectIcon(deviceObj);
                            }
                            name.push(Utils.getObjectNameFromObj(deviceObj, null, { language }));

                            const adapterID = Utils.getParentId(deviceID);
                            if (adapterID?.split('.').length > 2) {
                                const adapterObj = await this.props.socket.getObject(adapterID);
                                if (
                                    adapterObj &&
                                    (adapterObj.type === 'channel' || adapterObj.type === 'device') &&
                                    adapterObj.common
                                ) {
                                    if (!icon && adapterObj.common.icon) {
                                        icon = Utils.getObjectIcon(adapterObj);
                                    }
                                    name.push(Utils.getObjectNameFromObj(adapterObj, null, { language }));
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(`Cannot read object: ${e}`);
            }
        }

        // name.reverse();

        icon = icon || (await this.getAdapterIcon(id));
        return {
            groupId,
            id,
            img: icon,
            name: name.filter(a => a),
        };
    }

    async getAllCharts(newState?: Partial<ChartsTreeState>): Promise<Partial<ChartsTreeState>> {
        newState = newState || ({} as Partial<ChartsTreeState>);
        const instancesIds = this.props.instances.map(obj => obj._id.substring('system.adapter.'.length));
        const objs: Record<string, ioBroker.Object> = (await this.props.socket.getObjectViewSystem(
            // @ts-expect-error custom is not implemented in AdminConnection
            'custom-full',
            '',
            '',
        )) as Record<string, ioBroker.Object>;

        const _instances: Record<string, CustomInstance> = {};
        newState.enums = newState.enums || this.state.enums;
        const iconPromises: Promise<{ groupId: string; id: string; img: string; name: string[] }>[] = [];
        Object.values(objs).forEach((obj: ioBroker.StateObject): void => {
            // find first instance with history
            const id = instancesIds.find(_id => Object.keys(obj.common.custom).includes(_id));
            if (id) {
                const instanceObj = this.props.instances.find(iObj => iObj._id.endsWith(id));
                _instances[id] = _instances[id] || {
                    _id: `system.adapter.${id}`,
                    enabledDP: {},
                    names: {},
                    statesEnums: {},
                    icon: instanceObj.common.icon,
                    name: instanceObj.common.name || '',
                    types: {},
                    icons: {},
                };
                _instances[id].enabledDP[obj._id] = obj;
                _instances[id].names[obj._id] = Utils.getObjectNameFromObj(obj, null, { language: I18n.getLanguage() });
                _instances[id].types[obj._id] = obj.common.type === 'boolean' ? 'boolean' : 'number';
                _instances[id].statesEnums[obj._id] = getEnumsForId(newState.enums, obj._id);
                iconPromises.push(this.getChartIconAndName(id, obj));
            }
        });

        const chartsOpened: Record<string, boolean> = JSON.parse(JSON.stringify(this.state.chartsOpened));
        const funcIds = Object.keys(newState.enums).filter(id => id.startsWith('enum.functions.'));
        const roomIds = Object.keys(newState.enums).filter(id => id.startsWith('enum.rooms.'));

        const insts = Object.values(_instances).map(obj => {
            const enabledDP: Record<string, ioBroker.StateObject & { group?: string }> = {};
            Object.keys(obj.enabledDP).forEach(id => {
                enabledDP[id] = obj.enabledDP[id];
                enabledDP[id].group = obj._id;
            });
            obj.enabledDP = enabledDP;
            chartsOpened[obj._id] =
                chartsOpened[obj._id] !== undefined ? this.state.chartsOpened[obj._id] || false : true;

            // Build for every instance the list of enums
            Object.keys(newState.enums).forEach(eID => {
                if (Object.keys(enabledDP).find(id => newState.enums[eID].common.members.includes(id))) {
                    obj.enums = obj.enums || [];
                    if (!obj.enums.includes(eID)) {
                        obj.enums.push(eID);
                    }
                }
            });

            // Collect all enum-loss IDs in enum
            const otherFuncs: ioBroker.EnumObject = {
                _id: `enum.functions.${obj._id}`,
                type: 'enum',
                common: { members: [], name: I18n.t('Others') },
                native: {},
            };
            const otherRooms: ioBroker.EnumObject = {
                _id: `enum.rooms.${obj._id}`,
                type: 'enum',
                common: { members: [], name: I18n.t('Others') },
                native: {},
            };
            Object.keys(enabledDP).forEach(id => {
                if (!funcIds.find(eID => newState.enums[eID].common.members.includes(id))) {
                    otherFuncs.common.members.push(id);
                }
                if (!roomIds.find(eID => newState.enums[eID].common.members.includes(id))) {
                    otherRooms.common.members.push(id);
                }
            });
            if (otherFuncs.common.members.length) {
                obj.enums = obj.enums || [];
                obj.enums.push(`enum.functions.${obj._id}`);
                newState.enums[`enum.functions.${obj._id}`] = otherFuncs;
            }
            if (otherRooms.common.members.length) {
                obj.enums = obj.enums || [];
                obj.enums.push(`enum.rooms.${obj._id}`);
                newState.enums[`enum.rooms.${obj._id}`] = otherRooms;
            }

            obj.enums?.sort((a, b) =>
                newState.enums[a].common.name > newState.enums[b].common.name
                    ? 1
                    : newState.enums[a].common.name < newState.enums[b].common.name
                      ? -1
                      : 0,
            );

            return obj;
        });

        insts.sort(sortObj);

        if (!this.props.selectedId) {
            // find first chart
            const selectedChartId =
                Object.keys(insts).length && Object.keys(insts[0].enabledDP).length
                    ? Object.keys(insts[0].enabledDP)[0]
                    : null;
            if (selectedChartId) {
                setTimeout(
                    () =>
                        this.props.onSelectedChanged({
                            id: selectedChartId,
                            instance: insts[0]._id,
                        }),
                    500,
                );
            }
        }
        newState.instances = insts;
        newState.chartsOpened = chartsOpened;

        // update icons asynchronous
        setTimeout(() => {
            void Promise.all(iconPromises).then(result => {
                const instances: CustomInstance[] = JSON.parse(JSON.stringify(this.state.instances));
                let changed = false;
                result.forEach(res => {
                    if (res?.groupId) {
                        const inst = instances.find(ins => ins._id === `system.adapter.${res.groupId}`);
                        if (inst) {
                            if (res.img) {
                                inst.icons[res.id] = res.img;
                            }
                            if (res.name) {
                                inst.names[res.id] = res.name;
                            }
                            changed = true;
                        }
                    }
                });

                changed && this.setState({ instances });
            });
        }, 100);

        return newState;
    }

    toggleChartFolder = (id: string): void => {
        const chartsOpened: Record<string, boolean> = JSON.parse(JSON.stringify(this.state.chartsOpened));
        chartsOpened[id] = !chartsOpened[id];
        window.localStorage.setItem('App.echarts.opened', JSON.stringify(chartsOpened));
        const newState = { chartsOpened };

        // const loadChart: string | null = null;

        if (!chartsOpened[id]) {
            const instance = id.split('///')[0];
            if (
                this.props.selectedId &&
                typeof this.props.selectedId === 'object' &&
                this.props.selectedId.instance === instance
            ) {
                // TODO: Take next nearest opened chart folder
            }
        }

        this.setState(newState, () => this.props.onSelectedChanged(null));
    };

    renderSelectIdDialog(): React.JSX.Element | null {
        if (!this.state.showAddStateDialog) {
            return null;
        }
        return (
            <DialogSelectID
                key="selectDialog_add"
                theme={this.props.theme}
                imagePrefix="../.."
                socket={this.props.socket}
                dialogName="Add"
                title={I18n.t('Enable logging for state')}
                onOk={ids => {
                    const id: string = Array.isArray(ids) ? ids[0] : ids;
                    console.log(`Selected ${JSON.stringify(id)}`);
                    const instance = this.state.showAddStateDialog.replace('system.adapter.', '');
                    if (id) {
                        this.props.socket
                            .getObject(id)
                            .then((obj: ioBroker.StateObject): void => {
                                if (!obj?.common) {
                                    this.props.onShowError(I18n.t('Invalid object'));
                                    return;
                                }
                                if (obj.common.custom?.[instance]) {
                                    this.props.onShowToast(I18n.t('Already enabled'));
                                    return;
                                }
                                obj.common.custom = obj.common.custom || {};
                                obj.common.custom[instance] = {
                                    enabled: true,
                                };
                                this.props.socket
                                    .setObject(id, obj)
                                    .then(() => {
                                        const instances: CustomInstance[] = JSON.parse(
                                            JSON.stringify(this.state.instances),
                                        );
                                        const inst = instances.find(item => item._id === `system.adapter.${instance}`);
                                        inst.enabledDP = inst.enabledDP || {};
                                        inst.enabledDP[obj._id] = obj;
                                        this.setState({ instances }, () => this.getAllCharts());
                                    })
                                    .catch(e => this.onError(e, `Cannot read object ${id}`));
                            })
                            .catch(e => this.onError(e, `Cannot read object ${id}`));
                    }
                    this.setState({ showAddStateDialog: '' });
                }}
                onClose={() => this.setState({ showAddStateDialog: '' })}
            />
        );
    }

    renderListItem(group: CustomInstance, id: string, dragging?: boolean, level?: number): React.JSX.Element {
        level = level || 0;
        const instance = group._id;
        const selected =
            this.props.selectedId &&
            typeof this.props.selectedId === 'object' &&
            this.props.selectedId.id === id &&
            this.props.selectedId.instance === instance;

        let rxName: React.JSX.Element;
        if (typeof group.names[id] === 'object') {
            const names: string[] = [...group.names[id]];
            rxName = (
                <span
                    style={styles.itemName}
                    title={names.join(' / ')}
                >
                    {names.map((name, i) => (
                        <span
                            key={i}
                            style={styles[`itemName${i}`]}
                        >
                            {(i ? ' / ' : '') + name}
                        </span>
                    ))}
                </span>
            );
        } else {
            const name: string = (group.names[id] || '').toString();
            rxName = (
                <span
                    style={styles.itemName}
                    title={name}
                >
                    {name}
                </span>
            );
        }

        return (
            <ListItemButton
                key={`${instance}_${id}`}
                ref={selected ? this.refSelected : null}
                sx={{ '&.MuiListItemButton-gutters': styles.noGutters }}
                style={{ paddingLeft: LEVEL_PADDING * level, height: 48, position: 'relative' }}
                selected={selected}
                onClick={dragging ? undefined : () => this.props.onSelectedChanged({ id, instance })}
            >
                <ListItemIcon style={styles.itemIconRoot}>
                    {group.types[id] === 'boolean' ? (
                        <IconBooleanChart style={styles.itemIcon} />
                    ) : (
                        <IconChart style={styles.itemIcon} />
                    )}
                </ListItemIcon>
                <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                    <div style={styles.itemNameDiv}>
                        {Utils.getIcon(
                            { icon: group.icons[id], prefix: '../../' },
                            {
                                width: 20,
                                height: 20,
                                borderRadius: 2,
                                marginRight: 4,
                            },
                        )}
                        {rxName}
                    </div>
                    <div
                        style={styles.itemSecondaryName}
                        title={id}
                    >
                        {id.replace('system.adapter.', '')}
                    </div>
                </div>
                {!dragging && this.props.multiple && this.props.chartsList ? (
                    <div style={styles.listItemSecondaryAction}>
                        <Switch
                            size="small"
                            theme={this.props.theme}
                            onChange={(checked: boolean): void => {
                                const chartsList: { id: string; instance: string }[] = JSON.parse(
                                    JSON.stringify(this.props.chartsList),
                                );
                                const item = chartsList.find(_item => _item.id === id && _item.instance === instance);
                                if (checked && !item) {
                                    chartsList.push({ id, instance });
                                    chartsList.sort((a, b) => {
                                        if (a.instance > b.instance) {
                                            return 1;
                                        }
                                        if (a.instance < b.instance) {
                                            return -1;
                                        }
                                        if (a.id > b.id) {
                                            return 1;
                                        }
                                        if (a.id < b.id) {
                                            return -1;
                                        }
                                        return 0;
                                    });
                                    // if no charts selected => select this one
                                    if (typeof this.props.selectedId !== 'object') {
                                        this.props.onSelectedChanged({ id, instance }, () =>
                                            this.props.onChangeList(chartsList),
                                        );
                                    } else {
                                        this.props.onChangeList(chartsList);
                                    }
                                } else if (!checked && item) {
                                    chartsList.splice(chartsList.indexOf(item), 1);
                                    this.props.onChangeList(chartsList);
                                }
                            }}
                            checked={!!this.props.chartsList.find(item => item.id === id && item.instance === instance)}
                        />{' '}
                    </div>
                ) : null}
            </ListItemButton>
        );
    }

    renderListItems(
        group: CustomInstance,
        ids: string[],
        enumId: string | null,
        renderContext?: { gIndex: number },
    ): React.ReactNode[] {
        renderContext.gIndex = renderContext.gIndex || 0;

        if (!ids?.length) {
            return null;
        }
        const instance = group._id;

        const level = 1;

        if (!enumId) {
            return ids.map(id => (
                // @ts-expect-error no idea how to fix it
                <Draggable
                    isDragDisabled={!this.props.selectedId || typeof this.props.selectedId === 'object'}
                    key={`${instance}_${id}`}
                    draggableId={`${instance}***${id}`}
                    index={renderContext.gIndex++}
                >
                    {(provided, snapshot) => (
                        <>
                            <div
                                key={`${instance}_${id}_item`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style}
                                className="drag-items"
                            >
                                {this.renderListItem(group, id, false, level)}
                            </div>
                            {snapshot.isDragging ? (
                                <div
                                    className="react-beautiful-dnd-copy"
                                    key={`${instance}_${id}_dnd`}
                                >
                                    {this.renderListItem(group, id, true)}
                                </div>
                            ) : null}
                        </>
                    )}
                </Draggable>
            ));
        }
        const key = `${instance}///${enumId}`;
        const opened = this.state.chartsOpened[key];
        if (opened) {
            ids = ids.filter(id => this.state.enums[enumId].common.members.includes(id));
        }
        const nameObj: ioBroker.StringOrTranslated = this.state.enums[enumId].common.name;
        const name = typeof nameObj === 'object' ? nameObj[I18n.getLanguage()] || nameObj.en : nameObj;

        return [
            <ListItem
                key={key}
                style={{ ...styles.width100, paddingLeft: LEVEL_PADDING * level, height: 48 }}
                sx={Utils.getStyle(this.props.theme, styles.folderItem, { '&.MuiListItem-gutters': styles.noGutters })}
                secondaryAction={
                    <IconButton
                        size="small"
                        onClick={() => this.toggleChartFolder(key)}
                        title={opened ? I18n.t('Collapse') : I18n.t('Expand')}
                    >
                        <IconExpand
                            style={{
                                transform: opened ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease-in-out',
                            }}
                        />
                    </IconButton>
                }
            >
                <ListItemIcon
                    style={styles.itemIconRoot}
                    onClick={() => this.toggleChartFolder(key)}
                >
                    {opened ? (
                        <IconFolderOpened style={{ ...styles.itemIcon, ...styles.itemIconFolder }} />
                    ) : (
                        <IconFolderClosed style={{ ...styles.itemIcon, ...styles.itemIconFolder }} />
                    )}
                </ListItemIcon>
                <ListItemText primary={name} />
            </ListItem>,
            opened ? (
                <List key={`${key}_LIST`}>
                    {ids.map(id => (
                        // @ts-expect-error no idea how to fix it
                        <Draggable
                            isDragDisabled={!this.props.selectedId || typeof this.props.selectedId === 'object'}
                            key={`${instance}_${id}`}
                            draggableId={`${instance}***${id}`}
                            index={renderContext.gIndex++}
                        >
                            {(provided, snapshot) => (
                                <>
                                    <div
                                        key={`${instance}_${id}_item`}
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={provided.draggableProps.style}
                                        className="drag-items"
                                    >
                                        {this.renderListItem(group, id, false, 2)}
                                    </div>
                                    {snapshot.isDragging ? (
                                        <div
                                            className="react-beautiful-dnd-copy"
                                            key={`${instance}_${id}_dnd`}
                                        >
                                            {this.renderListItem(group, id, true)}
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </Draggable>
                    ))}
                </List>
            ) : null,
        ];
    }

    render(): React.ReactNode {
        const renderContext = { gIndex: 0 };
        return (
            <>
                {this.renderSelectIdDialog()}
                {/* @ts-expect-error no idea how to fix it */}
                <Droppable
                    droppableId="Lines"
                    isDropDisabled
                    key="charts"
                >
                    {(provided /* , snapshot */) => (
                        <div
                            ref={provided.innerRef}
                            key="chartListDiv"
                        >
                            <List
                                style={{ ...styles.scroll, ...styles.mainList }}
                                key="chartList"
                            >
                                <>
                                    {this.state.instances.map(group => {
                                        const opened = this.state.chartsOpened[group._id];
                                        let children = null;

                                        // if instance opened
                                        if (opened) {
                                            // no groupBy
                                            const ids: string[] = Object.keys(group.enabledDP).filter(
                                                id =>
                                                    !this.props.search ||
                                                    id.includes(this.props.search) ||
                                                    group.names[id].includes(this.props.search),
                                            );

                                            if (!this.props.groupBy) {
                                                ids.sort(sortObj);
                                                children = this.renderListItems(group, ids, null, renderContext);
                                            } else {
                                                children = (group.enums || [])
                                                    .filter(id => id.startsWith(`enum.${this.props.groupBy}.`))
                                                    .map(eID => this.renderListItems(group, ids, eID, renderContext));
                                            }
                                        }

                                        return [
                                            <ListItem
                                                key={group._id}
                                                sx={Utils.getStyle(
                                                    this.props.theme,
                                                    styles.width100,
                                                    styles.folderItem,
                                                    {
                                                        height: 48,
                                                        color:
                                                            this.props.theme.palette.mode === 'dark'
                                                                ? undefined
                                                                : '#FFF',
                                                    },
                                                    {
                                                        '&.MuiListItem-gutters': styles.noGutters,
                                                    },
                                                )}
                                                secondaryAction={
                                                    <>
                                                        {opened ? (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    this.setState({ showAddStateDialog: group._id })
                                                                }
                                                                style={{
                                                                    color:
                                                                        this.props.theme.palette.mode === 'dark'
                                                                            ? undefined
                                                                            : '#FFF',
                                                                }}
                                                                title={I18n.t('Enable logging for new state')}
                                                            >
                                                                <IconAdd />
                                                            </IconButton>
                                                        ) : null}
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => this.toggleChartFolder(group._id)}
                                                            title={opened ? I18n.t('Collapse') : I18n.t('Expand')}
                                                            style={{
                                                                color:
                                                                    this.props.theme.palette.mode === 'dark'
                                                                        ? undefined
                                                                        : '#FFF',
                                                            }}
                                                        >
                                                            <IconExpand
                                                                style={{
                                                                    transform: opened
                                                                        ? 'rotate(180deg)'
                                                                        : 'rotate(0deg)',
                                                                    transition: 'transform 0.2s ease-in-out',
                                                                }}
                                                            />
                                                        </IconButton>
                                                    </>
                                                }
                                            >
                                                <ListItemIcon
                                                    style={styles.itemIconRoot}
                                                    sx={{
                                                        color:
                                                            this.props.theme.palette.mode === 'dark'
                                                                ? undefined
                                                                : '#FFF',
                                                    }}
                                                    onClick={() => this.toggleChartFolder(group._id)}
                                                >
                                                    {opened ? (
                                                        <IconFolderOpened
                                                            style={{ ...styles.itemIcon, ...styles.itemIconFolder }}
                                                        />
                                                    ) : (
                                                        <IconFolderClosed
                                                            style={{ ...styles.itemIcon, ...styles.itemIconFolder }}
                                                        />
                                                    )}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <div style={styles.itemNameDiv}>
                                                            <img
                                                                style={styles.adapterIcon}
                                                                alt=""
                                                                src={`../../adapter/${group.name}/${group.icon}`}
                                                            />
                                                            <div style={styles.groupName}>
                                                                {group._id.replace('system.adapter.', '')}
                                                            </div>
                                                        </div>
                                                    }
                                                />
                                            </ListItem>,
                                            children,
                                        ];
                                    })}
                                    {provided.placeholder}
                                </>
                            </List>
                        </div>
                    )}
                </Droppable>
            </>
        );
    }
}

// @ts-expect-error to be fixed
export default withWidth()(ChartsTree);
