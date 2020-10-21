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

// icons
import {MdExpandLess as IconCollapse} from 'react-icons/md';
import {MdExpandMore as IconExpand} from 'react-icons/md';
import {MdAdd as IconAdd} from 'react-icons/md';
import {FaFolder as IconFolderClosed} from 'react-icons/all';
import {FaFolderOpen as IconFolderOpened} from 'react-icons/all';
import {AiOutlineAreaChart as IconChart} from 'react-icons/ai';

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
    itemIconRoot: {
        minWidth: 24,
    },
    listItemSubTitle: {
        fontSize: 'smaller',
        opacity: 0.7,
        fontStyle: 'italic'
    }
});

class ChartsTree extends Component {
    constructor(props) {
        super(props);

        let chartsOpened;
        try {
            chartsOpened = JSON.parse(window.localStorage.getItem('Charts.opened')) || {};
        } catch (e) {
            chartsOpened = {};
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
            instances: [], // chart folders
            chartsOpened,
            selectedId: typeof selectedId === 'object' && selectedId ? selectedId : null,
        };

        this.getAllCharts()
            .then(newState => this.setState(newState, () =>
                this.state.selectedId && this.props.onSelectedChanged(this.state.selectedId)));
    }

    getAllCharts() {
        return new Promise(resolve =>
            this.props.socket._socket.emit('getObjectView', 'custom', 'state', {}, (err, objs) => {
                // console.log(objs);
                const ids = ((objs && objs.rows) || []).map(item => item.id);
                this.getObjects(ids, objs => {
                    const ids = this.props.instances.map(obj => obj._id.substring('system.adapter.'.length));
                    const _instances = {};
                    Object.values(objs).forEach(obj => {
                        const id = obj && obj.common && obj.common.custom && ids.find(id => Object.keys(obj.common.custom).includes(id));
                        if (id) {
                            _instances[id] = _instances[id] || {_id: 'system.adapter.' + id, enabledDP: {}};
                            _instances[id].enabledDP[obj._id] = obj;
                        }
                    });

                    let chartsOpened = {};

                    const insts = Object.values(_instances).map(obj => {
                        const enabledDP = {};
                        Object.keys(obj.enabledDP).forEach(id => {
                            enabledDP[id] = obj.enabledDP[id];
                            enabledDP[id].group = obj._id;
                        });
                        obj.enabledDP = enabledDP;
                        chartsOpened[obj._id] = typeof this.state.chartsOpened[obj._id] !== 'undefined' ? this.state.chartsOpened[obj._id] : true;
                        return obj;
                    });

                    insts.sort(sortObj);

                    const newState = {instances: insts, chartsOpened};
                    if (!this.state.selectedId) {
                        // find first chart
                        let selectedChartId = Object.keys(insts).length && Object.keys(insts[0].enabledDP).length ? Object.keys(insts[0].enabledDP)[0] : null;
                        if (selectedChartId) {
                            newState.selectedId = {id: selectedChartId, instance: insts[0]._id};
                        }
                    }

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
        window.localStorage.setItem('Charts.opened', JSON.stringify(chartsOpened));
        const newState = {chartsOpened};

        let loadChart = null;

        if (!chartsOpened[id] && this.state.selectedId && typeof this.state.selectedId === 'object' && this.state.selectedId.instance === id) {
            // TODO: Take next nearest opened chart folder
            newState.selectedId = null;
            loadChart = null;
        }

        this.setState(newState, () => loadChart && this.props.onSelectedChanged(loadChart));
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

    render() {
        let gIndex = 0;
        return [
            this.renderSelectIdDialog(),
            <Droppable droppableId="Lines" isDropDisabled={true} key="charts">
                {(provided, snapshot) =>
                    <div ref={provided.innerRef}>
                        <List className={ this.props.classes.scroll }>
                            {this.state.instances.map((group, index) => {
                                    let chartsOpened = this.state.chartsOpened[group._id];
                                    let ids = null;
                                    if (chartsOpened) {
                                        ids = Object.keys(group.enabledDP)
                                            .filter(id => !this.state.search || id.includes(this.state.search));
                                        ids.sort(sortObj);
                                    }

                                    return <React.Fragment key={index}>
                                        <ListItem
                                            key={index}
                                            classes={ {gutters: this.props.classes.noGutters} }
                                            className={ clsx(this.props.classes.width100, this.props.classes.folderItem) }
                                        >
                                            <ListItemIcon classes={ {root: this.props.classes.itemIconRoot} } onClick={ () => this.toggleChartFolder(group._id) }>{ chartsOpened ?
                                                <IconFolderOpened className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/> :
                                                <IconFolderClosed className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/>
                                            }</ListItemIcon>
                                            <ListItemText primary={group._id.replace('system.adapter.', '')}/>
                                            <ListItemSecondaryAction>
                                                {chartsOpened ? <IconButton
                                                    onClick={() => this.setState({showAddStateDialog: group._id})}
                                                    title={ I18n.t('Enable logging for new state') }
                                                ><IconAdd/></IconButton> : null}
                                                <IconButton onClick={ () => this.toggleChartFolder(group._id) } title={ chartsOpened ? I18n.t('Collapse') : I18n.t('Expand')  }>
                                                    { chartsOpened ? <IconCollapse/> : <IconExpand/> }
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        {
                                            ids ? ids.map(id=>
                                                <Draggable
                                                    isDragDisabled={!this.state.selectedId || typeof this.state.selectedId === 'object'}
                                                    key={group._id + '_' + id}
                                                    draggableId={group._id + '***' + id}
                                                    index={gIndex++}>
                                                    {(provided, snapshot) =>
                                                        <>
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={provided.draggableProps.style}
                                                                className="drag-items"
                                                            >
                                                                <ListItem
                                                                    key={group._id + '_' + id}
                                                                    button
                                                                    style={{paddingLeft: LEVEL_PADDING * 2 + this.props.theme.spacing(1)}}
                                                                    selected={
                                                                        this.state.selectedId &&
                                                                        typeof this.state.selectedId === 'object' &&
                                                                        this.state.selectedId.id === id &&
                                                                        this.state.selectedId.instance === group._id
                                                                    }
                                                                    onClick={() => this.props.onSelectedChanged({id, instance: group._id}, selectedId =>
                                                                        selectedId !== false && this.setState({selectedId}))}
                                                                >
                                                                    <ListItemIcon classes={{root: this.props.classes.itemIconRoot}}>
                                                                        <IconChart className={this.props.classes.itemIcon}/>
                                                                    </ListItemIcon>
                                                                    <ListItemText
                                                                        classes={{
                                                                            primary: this.props.classes.listItemTitle,
                                                                            secondary: this.props.classes.listItemSubTitle
                                                                        }}
                                                                        primary={Utils.getObjectNameFromObj(group.enabledDP[id], null, {language: I18n.getLanguage()})}
                                                                        secondary={id.replace('system.adapter.', '')}
                                                                    />
                                                                </ListItem>

                                                            </div>
                                                            {snapshot.isDragging ?
                                                                <div className="react-beatiful-dnd-copy">
                                                                    <ListItem
                                                                        key={group._id + '_' + id + 'copy'}
                                                                        style={{paddingLeft: LEVEL_PADDING * 2 + this.props.theme.spacing(1)}}
                                                                        selected={
                                                                            this.state.selectedId &&
                                                                            typeof this.state.selectedId === 'object' &&
                                                                            this.state.selectedId.id === id &&
                                                                            this.state.selectedId.instance === group._id
                                                                        }
                                                                    >
                                                                        <ListItemIcon classes={{root: this.props.classes.itemIconRoot}}>
                                                                            <IconChart className={this.props.classes.itemIcon}/>
                                                                        </ListItemIcon>
                                                                        <ListItemText
                                                                            classes={{
                                                                                primary: this.props.classes.listItemTitle,
                                                                                secondary: this.props.classes.listItemSubTitle
                                                                            }}
                                                                            primary={Utils.getObjectNameFromObj(group.enabledDP[id], null, {language: I18n.getLanguage()})}
                                                                            secondary={id.replace('system.adapter.', '')}
                                                                        />
                                                                    </ListItem>
                                                                </div>: null}
                                                        </>
                                                    }
                                                </Draggable>
                                            ) : null
                                        }
                                    </React.Fragment>
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
    theme: PropTypes.object,
    onSelectedChanged: PropTypes.func.isRequired,
};

export default withWidth()(withStyles(styles)(withTheme(ChartsTree)));
