import React, {Component} from "react";
import PropTypes from 'prop-types';
import withWidth from "@material-ui/core/withWidth";
import {withStyles, withTheme} from "@material-ui/core/styles";
import clsx from 'clsx';
import { Droppable, Draggable } from "react-beautiful-dnd";

import IconButton from '@material-ui/core/IconButton';
import ListItemText from '@material-ui/core/ListItemText';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Switch from '@material-ui/core/Switch';

// icons
import {MdExpandLess as IconCollapse} from 'react-icons/md';
import {MdExpandMore as IconExpand} from 'react-icons/md';
import {MdAdd as IconAdd} from 'react-icons/md';
import {FaFolder as IconFolderClosed} from 'react-icons/all';
import {FaFolderOpen as IconFolderOpened} from 'react-icons/all';
import {AiOutlineAreaChart as IconChart} from 'react-icons/ai';
import {FaWaveSquare as IconBooleanChart} from 'react-icons/fa';

import I18n from '@iobroker/adapter-react/i18n';
import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';
import Utils from '@iobroker/adapter-react/Components/Utils';

function sortObj(a, b) {
    const aid = typeof a === 'object' ? a._id.replace('system.adapter.', '') : a.replace('system.adapter.', '');
    const bid = typeof b === 'object' ? b._id.replace('system.adapter.', '') : b.replace('system.adapter.', '');
    if (aid > bid) {
        return 1;
    } else if (aid < bid) {
        return -1;
    } else {
        return 0;
    }
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
        width: '100%'
    },
    itemIconFolder: {
        cursor: 'pointer'
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
    listItemSubTitle: {
        fontSize: 'smaller',
        opacity: 0.7,
        fontStyle: 'italic'
    },
    adapterIcon: {
        width: 20,
        height: 20,
        borderRadius: 2,
    }
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
            chartsOpened
        };

        this.adapterPromises = {};

        this.getAllEnums()
            .then(newState => this.getAllCharts(newState))
            .then(newState => this.setState(newState, () =>
                this.props.selectedId && this.props.onSelectedChanged(this.props.selectedId)));
    }

    getAllEnums(newState) {
        newState = newState || {};
        return this.props.socket.getEnums()
            .then(enums => {
                newState.enums = [];
                Object.keys(enums).forEach(id => {
                    if ((id.startsWith('enum.functions.') || id.startsWith('enum.rooms.')) && enums[id] && enums[id].common && enums[id].common.members && enums[id].common.members.length)  {
                        newState.enums[id] = {
                            common: {
                                members: [...enums[id].common.members],
                                name: Utils.getObjectNameFromObj(enums[id], null, {language: I18n.getLanguage()}),
                            }
                        };
                    }
                });
                return newState;
            });
    }

    getAdapterIcon(groupId, id) {
        const p = id.split('.');

        if (p.length < 2 || (p[0] === '0_userdata')) {
            return Promise.resolve();
        } else {
            let instanceId;
            if (p[0] === 'system') {
                p.splice(4);
                instanceId = p.join('.')
            } else {
                p.splice(2);
                instanceId = 'system.adapter.' + p.join('.')
            }

            this.adapterPromises[instanceId] = this.adapterPromises[instanceId] || this.props.socket.getObject(instanceId);

            return this.adapterPromises[instanceId]
                .then(obj => {
                    if (obj && obj.common && obj.common.icon) {
                        return Promise.resolve({groupId, id, img: Utils.getObjectIcon(obj)});
                    } else {
                        return Promise.resolve();
                    }
                });
        }
    }

    getChartIcon(groupId, obj) {
        if (!obj) {
            return Promise.resolve();
        } else
        if (obj.common && obj.common.icon) {
            return Promise.resolve({groupId, id: obj._id, img: Utils.getObjectIcon(obj)});
        } else {
            // try to read parent
            const id = obj._id;
            const channelID = Utils.getParentId(obj._id);
            if (channelID && channelID.split('.').length > 2) {
                return this.props.socket.getObject(channelID)
                    .then(obj => {
                        if (obj && (obj.type === 'channel' || obj.type === 'device') && obj.common && obj.common.icon) {
                            return Promise.resolve({groupId, id, img: Utils.getObjectIcon(obj)});
                        } else {
                            const deviceID = Utils.getParentId(channelID);
                            if (deviceID && deviceID.split('.').length > 2) {
                                return this.props.socket.getObject(deviceID)
                                    .then(obj => {
                                        if (obj && (obj.type === 'channel' || obj.type === 'device') && obj.common && obj.common.icon) {
                                            return Promise.resolve({
                                                groupId,
                                                id,
                                                img: Utils.getObjectIcon(obj)
                                            });
                                        } else {
                                            const adapterID = Utils.getParentId(deviceID);
                                            if (adapterID && adapterID.split('.').length > 2) {
                                                return this.props.socket.getObject(adapterID)
                                                    .then(obj => {
                                                        if (obj && (obj.type === 'channel' || obj.type === 'device') && obj.common && obj.common.icon) {
                                                            return Promise.resolve({
                                                                groupId,
                                                                id,
                                                                img: Utils.getObjectIcon(obj)
                                                            });
                                                        } else {
                                                            // get Adapter Icon
                                                            if (obj && (obj.type === 'channel' || obj.type === 'device') && obj.common && obj.common.icon) {
                                                                return Promise.resolve({
                                                                    groupId,
                                                                    id,
                                                                    img: Utils.getObjectIcon(obj)
                                                                });
                                                            } else {
                                                                return this.getAdapterIcon(groupId, id);
                                                            }
                                                        }
                                                    });
                                            } else {
                                                return this.getAdapterIcon(groupId, id);
                                            }
                                        }
                                    });
                            } else {
                                return this.getAdapterIcon(groupId, id);
                            }
                        }
                    });
            } else {
                return this.getAdapterIcon(groupId, id);
            }
        }
    }

    getAllCharts(newState) {
        newState = newState || {};
        return new Promise(resolve =>
            this.props.socket._socket.emit('getObjectView', 'custom', 'state', {}, (err, objs) => {
                // console.log(objs);
                const ids = ((objs && objs.rows) || []).map(item => item.id);
                this.getObjects(ids, objs => {
                    const ids = this.props.instances.map(obj => obj._id.substring('system.adapter.'.length));
                    const _instances = {};
                    newState.enums = newState.enums || this.state.enums;
                    const iconPromises = [];
                    Object.values(objs).forEach(obj => {
                        const id = obj && obj.common && obj.common.custom && ids.find(id => Object.keys(obj.common.custom).includes(id));
                        if (id) {
                            const instanceObj = this.props.instances.find(obj => obj._id.endsWith(id));
                            _instances[id] = _instances[id] || {_id: 'system.adapter.' + id, enabledDP: {}, names: {}, statesEnums: {}, icon: instanceObj.common.icon, name: instanceObj.common.name || '', types: {}, icons: {}};
                            _instances[id].enabledDP[obj._id] = obj;
                            _instances[id].names[obj._id] = Utils.getObjectNameFromObj(obj, null, {language: I18n.getLanguage()});
                            _instances[id].types[obj._id] = obj.common.type === 'boolean' ? 'boolean' : 'number';
                            _instances[id].statesEnums[obj._id] = getEnumsForId(newState.enums, obj._id);
                            iconPromises.push(this.getChartIcon(id, obj));
                        }
                    });

                    let chartsOpened = JSON.parse(JSON.stringify(this.state.chartsOpened));
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
                        const otherFuncs = {common: {members: [], name: I18n.t('Others')}};
                        const otherRooms = {common: {members: [], name: I18n.t('Others')}};
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
                            obj.enums.push('enum.functions.' + obj._id);
                            newState.enums['enum.functions.' + obj._id] = otherFuncs;
                        }
                        if (otherRooms.common.members.length) {
                            obj.enums = obj.enums || [];
                            obj.enums.push('enum.rooms.' + obj._id);
                            newState.enums['enum.rooms.' + obj._id] = otherRooms;
                        }

                        obj.enums && obj.enums.sort((a, b) => newState.enums[a].common.name > newState.enums[b].common.name ? 1 : (newState.enums[a].common.name < newState.enums[b].common.name ? -1 : 0));

                        return obj;
                    });

                    insts.sort(sortObj);

                    if (!this.props.selectedId) {
                        // find first chart
                        let selectedChartId = Object.keys(insts).length && Object.keys(insts[0].enabledDP).length ? Object.keys(insts[0].enabledDP)[0] : null;
                        if (selectedChartId) {
                            setTimeout(() => this.props.onSelectedChanged({id: selectedChartId, instance: insts[0]._id}), 500);
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
                                    if (res && res.groupId) {
                                        const inst = instances.find(ins => ins._id === 'system.adapter.' + res.groupId);
                                        if (inst) {
                                            inst.icons[res.id] = res.img;
                                            changed = true;
                                        }
                                    }
                                });
                                changed && this.setState({instances});
                            });
                    }, 100);

                    resolve(newState);
                });
            }));
    }

    getObjects(ids, cb, result) {
        result = result || {};
        if (!ids || !ids.length) {
            cb(result);
        } else {
            const id = ids.shift();
            this.props.socket.getObject(id)
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

    toggleChartFolder = id => {
        const chartsOpened = JSON.parse(JSON.stringify(this.state.chartsOpened));
        chartsOpened[id] = !chartsOpened[id];
        window.localStorage.setItem('App.echarts.opened', JSON.stringify(chartsOpened));
        const newState = {chartsOpened};

        let loadChart = null;

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
                                    return this.props.onShowToast(I18n.t('Already enabled'));
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

    renderListItem(group, id, dragging, level) {
        const instance = group._id;
        return <ListItem
            key={instance + '_' + id}
            classes={ {gutters: this.props.classes.noGutters} }
            button
            style={{paddingLeft: LEVEL_PADDING * level + this.props.theme.spacing(1)}}
            selected={
                this.props.selectedId &&
                typeof this.props.selectedId === 'object' &&
                this.props.selectedId.id === id &&
                this.props.selectedId.instance === instance
            }
            onClick={dragging ? undefined : () => this.props.onSelectedChanged({id, instance})}
        >
            <ListItemIcon classes={{root: this.props.classes.itemIconRoot}}>
                {group.types[id] === 'boolean' ?
                    <IconBooleanChart className={this.props.classes.itemIcon}/>
                    :
                    <IconChart className={this.props.classes.itemIcon}/>
                }
            </ListItemIcon>
            <ListItemText
                classes={{
                    primary: this.props.classes.listItemTitle,
                    secondary: this.props.classes.listItemSubTitle
                }}
                primary={
                    <span>
                        {Utils.getIcon({icon: group.icons[id], prefix: '../../'}, {width: 20, height: 20, borderRadius: 2})}
                        {group.names[id]}
                    </span>
                }
                secondary={id.replace('system.adapter.', '')}
            />
            {!dragging && this.props.multiple && this.props.chartsList ? <ListItemSecondaryAction>
                <Switch
                    edge="end"
                    onChange={e => {
                        const chartsList = JSON.parse(JSON.stringify(this.props.chartsList));
                        const item = chartsList.find(item => item.id === id && item.instance === instance);
                        if (e.target.checked && !item) {
                            chartsList.push({id, instance});
                            chartsList.sort((a, b) => {
                                if (a.instance > b.instance) {
                                    return 1;
                                } else if (a.instance < b.instance) {
                                    return -1;
                                } else {
                                    if (a.id > b.id) {
                                        return 1;
                                    } else if (a.id < b.id) {
                                        return -1;
                                    } else {
                                        return 0;
                                    }
                                }
                            });
                            // if no charts selected => select this one
                            if (typeof this.props.selectedId !== 'object') {
                                this.props.onSelectedChanged({id, instance}, () =>
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
                /> </ListItemSecondaryAction>: null}
        </ListItem>
    }

    renderListItems(group, ids, enumId, renderContext) {
        renderContext.gIndex = renderContext.gIndex || 0;

        if (!ids || !ids.length) {
            return null;
        }
        const instance = group._id;

        if (!enumId) {
            return ids.map(id=>
                <Draggable
                    isDragDisabled={!this.props.selectedId || typeof this.props.selectedId === 'object'}
                    key={instance + '_' + id}
                    draggableId={instance + '***' + id}
                    index={renderContext.gIndex++}>
                    {(provided, snapshot) =>
                        [
                            <div
                                key={instance + '_' + id + '_item'}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style}
                                className="drag-items"
                            >
                                {this.renderListItem(group, id, false, 2)}
                            </div>,
                            snapshot.isDragging ?
                                <div className="react-beatiful-dnd-copy" key={instance + '_' + id + '_dnd'}>
                                    {this.renderListItem(group, id, true)}
                                </div>: null
                        ]
                    }
                </Draggable>
            );
        }  else {
            const key = instance + '///' + enumId;
            const opened = this.state.chartsOpened[key];
            if (opened) {
                ids = ids.filter(id => this.state.enums[enumId].common.members.includes(id));
            }
            return [
                <ListItem
                    key={key}
                    style={{paddingLeft: LEVEL_PADDING * 2 + this.props.theme.spacing(1)}}
                    classes={ {gutters: this.props.classes.noGutters} }
                    className={ clsx(this.props.classes.width100, this.props.classes.folderItem) }
                >
                    <ListItemIcon classes={ {root: this.props.classes.itemIconRoot} } onClick={ () => this.toggleChartFolder(key) }>{ opened ?
                        <IconFolderOpened className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/> :
                        <IconFolderClosed className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/>
                    }</ListItemIcon>
                    <ListItemText primary={this.state.enums[enumId].common.name}/>
                    <ListItemSecondaryAction>
                        <IconButton onClick={ () => this.toggleChartFolder(key) } title={ opened ? I18n.t('Collapse') : I18n.t('Expand')  }>
                            { opened ? <IconCollapse/> : <IconExpand/> }
                        </IconButton>
                    </ListItemSecondaryAction>
                </ListItem>,
                opened ? <List key={key + '_LIST'}>
                    {ids.map(id=>
                        <Draggable
                            isDragDisabled={!this.props.selectedId || typeof this.props.selectedId === 'object'}
                            key={instance + '_' + id}
                            draggableId={instance + '***' + id}
                            index={renderContext.gIndex++}>
                            {(provided, snapshot) =>
                                [
                                    <div
                                        key={instance + '_' + id + '_item'}
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={provided.draggableProps.style}
                                        className="drag-items"
                                    >
                                        {this.renderListItem(group, id, false, 3)}
                                    </div>,
                                    snapshot.isDragging ?
                                        <div className="react-beatiful-dnd-copy" key={instance + '_' + id + '_dnd'}>
                                            {this.renderListItem(group, id, true)}
                                        </div>: null
                                ]
                            }
                        </Draggable>
                    )}
                </List> : null
            ]
        }
    }

    render() {
        const renderContext = {gIndex: 0};
        return [
            this.renderSelectIdDialog(),
            <Droppable droppableId="Lines" isDropDisabled={true} key="charts">
                {(provided, snapshot) =>
                    <div ref={provided.innerRef} key="chartListDiv">
                        <List className={ this.props.classes.scroll } key="chartList">
                            {
                                this.state.instances.map(group => {
                                    let opened = this.state.chartsOpened[group._id];
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
                                            children = (group.enums || []).filter(id => id.startsWith('enum.' + this.props.groupBy + '.')).map(eID =>
                                                this.renderListItems(group, ids, eID, renderContext));
                                        }
                                    }

                                    return [
                                        <ListItem
                                            key={group._id}
                                            classes={ {gutters: this.props.classes.noGutters} }
                                            className={ clsx(this.props.classes.width100, this.props.classes.folderItem) }
                                        >
                                            <ListItemIcon classes={ {root: this.props.classes.itemIconRoot} } onClick={ () => this.toggleChartFolder(group._id) }>
                                                { opened ?
                                                    <IconFolderOpened className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/> :
                                                    <IconFolderClosed className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/>
                                                }
                                            </ListItemIcon>
                                            <ListItemText primary={
                                                <span>
                                                    <img className={ this.props.classes.adapterIcon } alt="" src={`../../adapter/${group.name}/${group.icon}`}/>
                                                    {group._id.replace('system.adapter.', '')}
                                                </span>
                                            }/>
                                                <ListItemSecondaryAction>
                                                {opened ? <IconButton
                                                        onClick={() => this.setState({showAddStateDialog: group._id})}
                                                        title={ I18n.t('Enable logging for new state') }
                                                    ><IconAdd/></IconButton> : null}
                                                <IconButton onClick={ () => this.toggleChartFolder(group._id) } title={ opened ? I18n.t('Collapse') : I18n.t('Expand')  }>
                                                    { opened ? <IconCollapse/> : <IconExpand/> }
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>,
                                        children
                                    ];
                                }
                            )}
                            {provided.placeholder}
                        </List>
                    </div> }
            </Droppable>
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
    selectedId: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string
    ]),
    onSelectedChanged: PropTypes.func.isRequired,
};

export default withWidth()(withStyles(styles)(withTheme(ChartsTree)));
