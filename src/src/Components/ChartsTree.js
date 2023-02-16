import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles, withTheme } from '@mui/styles';
import { Droppable, Draggable } from 'react-beautiful-dnd';

import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemIcon from '@mui/material/ListItemIcon';
import Switch from '@mui/material/Switch';

// icons
import {
    MdExpandLess as IconCollapse,
    MdExpandMore as IconExpand,
    MdAdd as IconAdd,
} from 'react-icons/md';
import {
    FaFolder as IconFolderClosed,
    FaFolderOpen as IconFolderOpened,
    FaWaveSquare as IconBooleanChart,
} from 'react-icons/fa';

import { AiOutlineAreaChart as IconChart } from 'react-icons/ai';

import { I18n, Utils, withWidth } from '@iobroker/adapter-react-v5';
import DialogSelectID from '@iobroker/adapter-react-v5/Dialogs/SelectID';

function sortObj(a, b) {
    const aid = typeof a === 'object' ? a._id.replace('system.adapter.', '') : a.replace('system.adapter.', '');
    const bid = typeof b === 'object' ? b._id.replace('system.adapter.', '') : b.replace('system.adapter.', '');
    if (aid > bid) {
        return 1;
    } if (aid < bid) {
        return -1;
    }
    return 0;
}

function getEnumsForId(enums, id) {
    const result = [];
    Object.keys(enums).forEach(eID => {
        const en = enums[eID];
        if (en.common.members.includes(id) && !result.includes(eID)) {
            result.push(eID);
        }
    });
    return result;
}

const LEVEL_PADDING = 16;

const styles = theme => ({
    noGutters: {
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        width: '100%',
    },
    itemIconFolder: {
        cursor: 'pointer',
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
        lineHeight: '22px',
        height: 22,
    },
    itemName: {
        verticalAlign: 'top',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: 'calc(100% - 26px)',
        display: 'inline-block',
    },
    itemName0: {

    },
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
        whiteSpace: 'nowrap',
        display: 'inline-block',
    },
    listItemSubTitle: {
        fontSize: 'smaller',
        opacity: 0.7,
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
        right: 7,
    },
    folderItem: {
        backgroundColor: theme.palette.secondary.main,
        paddingLeft: theme.spacing(1),
    },
});

class ChartsTree extends Component {
    constructor(props) {
        super(props);

        let chartsOpened;
        try {
            chartsOpened = JSON.parse(window.localStorage.getItem('App.echarts.opened')) || {};
        } catch (e) {
            chartsOpened = {};
        }

        this.state = {
            instances: [], // chart folders
            chartsOpened,
        };

        this.refSelected = React.createRef();
        this.scrollToSelect = false;
        this.adapterPromises = {};

        this.getAllEnums()
            .then(newState => this.getAllCharts(newState))
            .then(newState => this.setState(newState, () =>
                this.props.selectedId && this.props.onSelectedChanged(this.props.selectedId)));
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

    getAllEnums(newState) {
        newState = newState || {};
        return this.props.socket.getEnums()
            .then(enums => {
                newState.enums = [];
                Object.keys(enums).forEach(id => {
                    if ((id.startsWith('enum.functions.') || id.startsWith('enum.rooms.')) && enums[id] && enums[id].common && enums[id].common.members && enums[id].common.members.length) {
                        newState.enums[id] = {
                            common: {
                                members: [...enums[id].common.members],
                                name: Utils.getObjectNameFromObj(enums[id], null, { language: I18n.getLanguage() }),
                            },
                        };
                    }
                });
                return newState;
            })
            .catch(e => this.onError(e, 'Cannot read enums'));
    }

    async getAdapterIcon(id) {
        const p = id.split('.');

        if (p.length < 2 || (p[0] === '0_userdata')) {
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

        this.adapterPromises[instanceId] = this.adapterPromises[instanceId] || this.props.socket.getObject(instanceId);

        try {
            const obj = await this.adapterPromises[instanceId];
            if (obj && obj.common && obj.common.icon) {
                return Utils.getObjectIcon(obj);
            }
        } catch (e) {
            this.onError(e, `Cannot read object ${instanceId}`);
        }
        return null;
    }

    onError(e, comment) {
        comment && console.error(comment);
        this.props.onShowError(e);
    }

    async getChartIconAndName(groupId, obj) {
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
                if (channelObj && (channelObj.type === 'channel' || channelObj.type === 'device') && channelObj.common) {
                    if (!icon && channelObj.common.icon) {
                        icon = Utils.getObjectIcon(channelObj);
                    }
                    name.push(Utils.getObjectNameFromObj(channelObj, null, { language }));
                    const deviceID = Utils.getParentId(channelID);
                    if (deviceID?.split('.').length > 2) {
                        const deviceObj = await this.props.socket.getObject(deviceID);
                        if (deviceObj && (deviceObj.type === 'channel' || deviceObj.type === 'device') && deviceObj.common) {
                            if (!icon && deviceObj.common.icon) {
                                icon = Utils.getObjectIcon(deviceObj);
                            }
                            name.push(Utils.getObjectNameFromObj(deviceObj, null, { language }));

                            const adapterID = Utils.getParentId(deviceID);
                            if (adapterID?.split('.').length > 2) {
                                const adapterObj = await this.props.socket.getObject(adapterID);
                                if (adapterObj && (adapterObj.type === 'channel' || adapterObj.type === 'device') && adapterObj.common) {
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

    async getAllCharts(newState) {
        newState = newState || {};
        const useFullCustom = await this.props.socket.checkFeatureSupported('CUSTOM_FULL_VIEW');
        const instancesIds = this.props.instances.map(obj => obj._id.substring('system.adapter.'.length));
        let objs;
        if (!useFullCustom) {
            const customObjs = await this.props.socket.getObjectViewSystem('custom', '', '');
            // console.log(objs);
            const ids = Object.keys(customObjs)
                .filter(id => customObjs[id] && instancesIds.find(_id => Object.keys(customObjs[id]).includes(_id)))
                .map(id => id);

            objs = await new Promise(resolve => {
                this.getObjects(ids, resolve);
            });
        } else {
            objs = await this.props.socket.getObjectViewSystem('custom-full', '', '');
        }

        const _instances = {};
        newState.enums = newState.enums || this.state.enums;
        const iconPromises = [];
        Object.values(objs)
            .forEach(obj => {
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

        const chartsOpened = JSON.parse(JSON.stringify(this.state.chartsOpened));
        const funcIds = Object.keys(newState.enums).filter(id => id.startsWith('enum.functions.'));
        const roomIds = Object.keys(newState.enums).filter(id => id.startsWith('enum.rooms.'));

        const insts = Object.values(_instances).map(obj => {
            const enabledDP = {};
            Object.keys(obj.enabledDP).forEach(id => {
                enabledDP[id] = obj.enabledDP[id];
                enabledDP[id].group = obj._id;
            });
            obj.enabledDP = enabledDP;
            chartsOpened[obj._id] = chartsOpened[obj._id] !== undefined ? (this.state.chartsOpened[obj._id] || false) : true;

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
            const otherFuncs = { common: { members: [], name: I18n.t('Others') } };
            const otherRooms = { common: { members: [], name: I18n.t('Others') } };
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

            obj.enums && obj.enums.sort((a, b) => (newState.enums[a].common.name > newState.enums[b].common.name ? 1 : (newState.enums[a].common.name < newState.enums[b].common.name ? -1 : 0)));

            return obj;
        });

        insts.sort(sortObj);

        if (!this.props.selectedId) {
            // find first chart
            const selectedChartId = Object.keys(insts).length && Object.keys(insts[0].enabledDP).length ? Object.keys(insts[0].enabledDP)[0] : null;
            if (selectedChartId) {
                setTimeout(() => this.props.onSelectedChanged({
                    id: selectedChartId,
                    instance: insts[0]._id,
                }), 500);
            }
        }
        newState.instances = insts;
        newState.chartsOpened = chartsOpened;

        // update icons asynchronous
        setTimeout(() => {
            Promise.all(iconPromises)
                .then(result => {
                    const instances = JSON.parse(JSON.stringify(this.state.instances));
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

    getObjects(ids, cb, result) {
        result = result || {};
        if (!ids || !ids.length) {
            cb(result);
        } else {
            const id = ids.shift();
            this.props.socket.getObject(id)
                .catch(e => {
                    console.error(`Cannot read ${id}: ${e}`);
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

    toggleChartFolder = id => {
        const chartsOpened = JSON.parse(JSON.stringify(this.state.chartsOpened));
        chartsOpened[id] = !chartsOpened[id];
        window.localStorage.setItem('App.echarts.opened', JSON.stringify(chartsOpened));
        const newState = { chartsOpened };

        const loadChart = null;

        if (!chartsOpened[id]) {
            const instance = id.split('///')[0];
            if (this.props.selectedId && typeof this.props.selectedId === 'object' && this.props.selectedId.instance === instance) {
                // TODO: Take next nearest opened chart folder
            }
        }

        this.setState(newState, () => this.props.onSelectedChanged(loadChart));
    };

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
                                this.props.onShowToast(I18n.t('Already enabled'));
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
                                .catch(e => this.onError(e, `Cannot read object ${id}`));
                        })
                        .catch(e => this.onError(e, `Cannot read object ${id}`));
                }
                this.setState({ showAddStateDialog: false });
            }}
            onClose={() => this.setState({ showAddStateDialog: false })}
        />;
    }

    renderListItem(group, id, dragging, level) {
        level = level || 0;
        const instance = group._id;
        const selected = this.props.selectedId &&
            typeof this.props.selectedId === 'object' &&
            this.props.selectedId.id === id &&
            this.props.selectedId.instance === instance;

        return <ListItemButton
            key={`${instance}_${id}`}
            ref={selected ? this.refSelected : null}
            classes={{ gutters: this.props.classes.noGutters }}
            style={{ paddingLeft: LEVEL_PADDING * level }}
            selected={selected}
            onClick={dragging ? undefined : () => this.props.onSelectedChanged({ id, instance })}
        >
            <ListItemIcon classes={{ root: this.props.classes.itemIconRoot }}>
                {group.types[id] === 'boolean' ?
                    <IconBooleanChart className={this.props.classes.itemIcon} />
                    :
                    <IconChart className={this.props.classes.itemIcon} />}
            </ListItemIcon>
            <ListItemText
                classes={{
                    primary: this.props.classes.listItemTitle,
                    secondary: this.props.classes.listItemSubTitle,
                }}
                primary={
                    <span className={this.props.classes.itemNameDiv}>
                        {Utils.getIcon({ icon: group.icons[id], prefix: '../../' }, {
                            width: 20,
                            height: 20,
                            borderRadius: 2,
                            marginRight: 4,
                        })}
                        {Array.isArray(group.names[id]) ?
                            <span className={this.props.classes.itemName} title={group.names[id].join(' / ')}>
                                {group.names[id].map((name, i) => <span key={i} className={this.props.classes[`itemName${i}`]}>{(i ? ' / ' : '') + name}</span>)}
                            </span> :
                            <span className={this.props.classes.itemName} title={group.names[id]}>{group.names[id]}</span>}
                    </span>
                }
                secondary={<span className={this.props.classes.itemSecondaryName} title={id}>{id.replace('system.adapter.', '')}</span>}
            />
            {!dragging && this.props.multiple && this.props.chartsList ? <ListItemSecondaryAction className={this.props.classes.listItemSecondaryAction}>
                <Switch
                    size="small"
                    edge="end"
                    onChange={e => {
                        const chartsList = JSON.parse(JSON.stringify(this.props.chartsList));
                        const item = chartsList.find(_item => _item.id === id && _item.instance === instance);
                        if (e.target.checked && !item) {
                            chartsList.push({ id, instance });
                            chartsList.sort((a, b) => {
                                if (a.instance > b.instance) {
                                    return 1;
                                } if (a.instance < b.instance) {
                                    return -1;
                                }
                                if (a.id > b.id) {
                                    return 1;
                                } if (a.id < b.id) {
                                    return -1;
                                }
                                return 0;
                            });
                            // if no charts selected => select this one
                            if (typeof this.props.selectedId !== 'object') {
                                this.props.onSelectedChanged({ id, instance }, () =>
                                    this.props.onChangeList(chartsList));
                            } else {
                                this.props.onChangeList(chartsList);
                            }
                        } else if (!e.target.checked && item) {
                            chartsList.splice(chartsList.indexOf(item), 1);
                            this.props.onChangeList(chartsList);
                        }
                    }}
                    checked={!!this.props.chartsList.find(item => item.id === id && item.instance === instance)}
                />
                {' '}
            </ListItemSecondaryAction> : null}
        </ListItemButton>;
    }

    renderListItems(group, ids, enumId, renderContext) {
        renderContext.gIndex = renderContext.gIndex || 0;

        if (!ids || !ids.length) {
            return null;
        }
        const instance = group._id;

        const level = 1;

        if (!enumId) {
            return ids.map(id =>
                <Draggable
                    isDragDisabled={!this.props.selectedId || typeof this.props.selectedId === 'object'}
                    key={`${instance}_${id}`}
                    draggableId={`${instance}***${id}`}
                    index={renderContext.gIndex++}
                >
                    {(provided, snapshot) =>
                        [
                            <div
                                key={`${instance}_${id}_item`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style}
                                className="drag-items"
                            >
                                {this.renderListItem(group, id, false, level)}
                            </div>,
                            snapshot.isDragging ?
                                <div className="react-beautiful-dnd-copy" key={`${instance}_${id}_dnd`}>
                                    {this.renderListItem(group, id, true)}
                                </div> : null,
                        ]}
                </Draggable>);
        }
        const key = `${instance}///${enumId}`;
        const opened = this.state.chartsOpened[key];
        if (opened) {
            ids = ids.filter(id => this.state.enums[enumId].common.members.includes(id));
        }
        return [
            <ListItem
                key={key}
                style={{ paddingLeft: LEVEL_PADDING * level }}
                classes={{ gutters: this.props.classes.noGutters }}
                className={Utils.clsx(this.props.classes.width100, this.props.classes.folderItem)}
            >
                <ListItemIcon
                    classes={{ root: this.props.classes.itemIconRoot }}
                    onClick={() => this.toggleChartFolder(key)}
                >
                    {opened ?
                        <IconFolderOpened
                            className={Utils.clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder)}
                        /> :
                        <IconFolderClosed
                            className={Utils.clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder)}
                        />}
                </ListItemIcon>
                <ListItemText primary={this.state.enums[enumId].common.name} />
                <ListItemSecondaryAction className={this.props.classes.listItemSecondaryAction}>
                    <IconButton
                        size="small"
                        onClick={() => this.toggleChartFolder(key)}
                        title={opened ? I18n.t('Collapse') : I18n.t('Expand')}
                    >
                        {opened ? <IconCollapse /> : <IconExpand />}
                    </IconButton>
                </ListItemSecondaryAction>
            </ListItem>,
            opened ? <List key={`${key}_LIST`}>
                {ids.map(id =>
                    <Draggable
                        isDragDisabled={!this.props.selectedId || typeof this.props.selectedId === 'object'}
                        key={`${instance}_${id}`}
                        draggableId={`${instance}***${id}`}
                        index={renderContext.gIndex++}
                    >
                        {(provided, snapshot) =>
                            [
                                <div
                                    key={`${instance}_${id}_item`}
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={provided.draggableProps.style}
                                    className="drag-items"
                                >
                                    {this.renderListItem(group, id, false, 2)}
                                </div>,
                                snapshot.isDragging ?
                                    <div className="react-beautiful-dnd-copy" key={`${instance}_${id}_dnd`}>
                                        {this.renderListItem(group, id, true)}
                                    </div> : null,
                            ]}
                    </Draggable>)}
            </List> : null,
        ];
    }

    render() {
        const renderContext = { gIndex: 0 };
        return [
            this.renderSelectIdDialog(),
            <Droppable droppableId="Lines" isDropDisabled key="charts">
                {(provided /* , snapshot */) =>
                    <div ref={provided.innerRef} key="chartListDiv">
                        <List className={Utils.clsx(this.props.classes.scroll, this.props.classes.mainList)} key="chartList">
                            {
                                this.state.instances.map(group => {
                                    const opened = this.state.chartsOpened[group._id];
                                    let children = null;

                                    // if instance opened
                                    if (opened) {
                                        // no groupBy
                                        const ids = Object.keys(group.enabledDP)
                                            .filter(id => !this.props.search || id.includes(this.props.search) || group.names[id].includes(this.props.search));

                                        if (!this.props.groupBy) {
                                            ids.sort(sortObj);
                                            children = this.renderListItems(group, ids, null, renderContext);
                                        } else {
                                            children = (group.enums || []).filter(id => id.startsWith(`enum.${this.props.groupBy}.`))
                                                .map(eID =>
                                                    this.renderListItems(group, ids, eID, renderContext));
                                        }
                                    }

                                    return [
                                        <ListItem
                                            key={group._id}
                                            classes={{ gutters: this.props.classes.noGutters }}
                                            className={Utils.clsx(this.props.classes.width100, this.props.classes.folderItem)}
                                        >
                                            <ListItemIcon
                                                classes={{ root: this.props.classes.itemIconRoot }}
                                                onClick={() => this.toggleChartFolder(group._id)}
                                            >
                                                {opened ?
                                                    <IconFolderOpened
                                                        className={Utils.clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder)}
                                                    /> :
                                                    <IconFolderClosed
                                                        className={Utils.clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder)}
                                                    />}
                                            </ListItemIcon>
                                            <ListItemText primary={
                                                <div className={this.props.classes.itemNameDiv}>
                                                    <img
                                                        className={this.props.classes.adapterIcon}
                                                        alt=""
                                                        src={`../../adapter/${group.name}/${group.icon}`}
                                                    />
                                                    <div className={this.props.classes.groupName}>{group._id.replace('system.adapter.', '')}</div>
                                                </div>
                                            }
                                            />
                                            <ListItemSecondaryAction className={this.props.classes.listItemSecondaryAction}>
                                                {opened ? <IconButton
                                                    size="small"
                                                    onClick={() => this.setState({ showAddStateDialog: group._id })}
                                                    title={I18n.t('Enable logging for new state')}
                                                >
                                                    <IconAdd />
                                                </IconButton> : null}
                                                <IconButton
                                                    size="small"
                                                    onClick={() => this.toggleChartFolder(group._id)}
                                                    title={opened ? I18n.t('Collapse') : I18n.t('Expand')}
                                                >
                                                    {opened ? <IconCollapse /> : <IconExpand />}
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>,
                                        children,
                                    ];
                                })
                            }
                            {provided.placeholder}
                        </List>
                    </div>}
            </Droppable>,
        ];
    }
}

ChartsTree.propTypes = {
    socket: PropTypes.object,
    instances: PropTypes.array,
    adapterName: PropTypes.string.isRequired,
    onShowToast: PropTypes.func,
    onShowError: PropTypes.func,
    onChangeList: PropTypes.func,
    chartsList: PropTypes.array,
    theme: PropTypes.object,
    multiple: PropTypes.bool,
    search: PropTypes.string,
    groupBy: PropTypes.string,
    scrollToSelect: PropTypes.bool,
    selectedId: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
    ]),
    onSelectedChanged: PropTypes.func.isRequired,
};

export default withWidth()(withStyles(styles)(withTheme(ChartsTree)));
