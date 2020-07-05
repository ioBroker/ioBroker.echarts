import React from 'react';
import PropTypes from 'prop-types';
import Toolbar from '@material-ui/core/Toolbar';
import {withStyles} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Badge from '@material-ui/core/Badge';
import Snackbar from '@material-ui/core/Snackbar';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';

import {MdSave as IconSave} from 'react-icons/md';
import {MdCancel as IconCancel} from 'react-icons/md';
import {MdClose as IconClose} from 'react-icons/md';
import {MdRefresh as IconRestart} from 'react-icons/md';
import {MdInput as IconDoEdit} from 'react-icons/md';
import {FaClock as IconCron} from 'react-icons/fa';
import {FaClipboardList as IconSelectId} from 'react-icons/fa';
import {FaFileExport as IconExport} from 'react-icons/fa';
import {FaFileImport as IconImport} from 'react-icons/fa';
import {FaFlagCheckered as IconCheck} from 'react-icons/fa';
import {MdGpsFixed as IconLocate} from 'react-icons/md';
import {MdClearAll as IconCloseAll} from 'react-icons/md';
import {MdBuild as IconDebugMenu} from 'react-icons/md';
import {MdBugReport as IconDebug} from 'react-icons/md';
import {MdPlaylistAddCheck as IconVerbose} from 'react-icons/md';
import {TiAdjustContrast as IconContrast} from 'react-icons/ti'

import I18n from '@iobroker/adapter-react/i18n';
import Theme from './Theme';
import ChartFrame from './Components/ChartFrame';
import DialogConfirm from '@iobroker/adapter-react/Dialogs/Confirm';
import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';
import getUrlQuery from './utils/getUrlQuery';


const MENU_ITEM_HEIGHT = 48;
const COLOR_DEBUG = '#02a102';
const COLOR_VERBOSE = '#70aae9';

const styles = theme => ({

    toolbar: {
        minHeight: 38,//Theme.toolbar.height,
        boxShadow: '0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12)'
    },
    toolbarButtons: {
        padding: 4,
        marginLeft: 4
    },
    editorDiv: {
        height: `calc(100% - ${Theme.toolbar.height + 38/*Theme.toolbar.height */ + 1}px)`,
        width: '100%',
        overflow: 'hidden',
        position: 'relative'
    },
    textButton: {
        marginRight: 10,
        minHeight: 24,
        padding: '6px 16px'
    },
    tabIcon: {
        width: 24,
        height: 24,
        verticalAlign: 'middle',
        marginBottom: 2,
        marginRight: 2,
        borderRadius: 3
    },
    hintIcon: {
        //fontSize: 32,
        padding: '0 8px 0 8px'
    },
    hintText: {
        //fontSize: 18
    },
    hintButton: {
        marginTop: 8,
        marginLeft: 20
    },
    tabMenuButton: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    tabChanged: {
        color: theme.palette.secondary.main
    },
    tabText: {
        maxWidth: 130,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        display: 'inline-block',
        verticalAlign: 'middle',
    },
    tabChangedIcon: {
        color: '#FF0000',
        fontSize: 16
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 0,
        zIndex: 10,
        padding: 8,
        cursor: 'pointer'
    },
    notRunning: {
        color: '#ffbc00'
    },
    tabButton: {

    },
    tabButtonWrapper: {
        display: 'inline-block',
    },
    menuIcon: {
        width: 18,
        height: 18,
        borderRadius: 2,
        marginRight: 5
    },
});

class Editor extends React.Component {
    constructor(props) {
        super(props);

        const selected = window.localStorage.getItem('Editor.selected') || '';
        let editing = window.localStorage.getItem('Editor.editing') || '[]';
        try {
            editing = JSON.parse(editing);
        } catch (e) {
            editing = [];
        }
        if (selected && editing.indexOf(selected) === -1) {
            editing.push(selected);
        }

        this.tabsRef = React.createRef();

        this.state = {
            selected: selected,
            editing: editing, // array of opened scripts
            changed: {}, // for every script
            blockly: null,
            debugEnabled: false,
            verboseEnabled: false,
            showBlocklyCode: false,
            showSelectId: false,
            showCron: false,
            showScript: false,
            insert: '',
            searchText: '',
            theme: this.props.theme,
            visible: props.visible,
            cmdToBlockly: '',
            menuOpened: !!this.props.menuOpened,
            menuTabsOpened: false,
            menuTabsAnchorEl: null,
            runningInstances: this.props.runningInstances || {},
            showDebugMenu: false,
            toast: '',
        };

        this.setChangedInAdmin();

        /* ----------------------- */
        // required by selectIdDialog in Blockly
        this.selectId = {
            initValue: null,
            callback: null
        };
        this.cron = {
            initValue: null,
            callback: null
        };
        this.scriptDialog = {
            initValue: null,
            callback: null,
            args: null,
            isReturn: false
        };

        const instances = [];
        if (this.props.objects) {
            for (let id in this.props.objects) {
                if (this.props.objects.hasOwnProperty(id) && id.startsWith('system.adapter.') && this.props.objects[id] && this.props.objects[id].type === 'instance') {
                    instances.push(id);
                }
            }
        }

        window.systemLang = I18n.getLanguage();
        window.main = {
            objects: this.props.objects,
            instances,
            selectIdDialog: (initValue, cb) => {
                this.selectId.callback = cb;
                this.selectId.initValue = initValue;
                this.setState({showSelectId: true});
            },
            cronDialog: (initValue, cb) => {
                this.cron.callback = cb;
                this.cron.initValue = initValue;
                this.setState({showCron: true});
            },
            showScriptDialog: (value, args, isReturn, cb) => {
                this.scriptDialog.callback = cb;
                this.scriptDialog.initValue = value;
                this.scriptDialog.args = args;
                this.scriptDialog.isReturn = isReturn || false;
                this.setState({showScript: true});
            }
        };
        this.objects = props.objects;
        /* ----------------------- */

        this.scripts = {};

        if (!this.state.selected && this.state.editing.length) {
            this.state.selected = this.state.editing[0];
        }

        // to enable logging
        if (this.props.onSelectedChange && this.state.selected) {
            setTimeout(() => this.props.onSelectedChange(this.state.selected, this.state.editing), 100);
        }
        this.onBrowserCloseBound = this.onBrowserClose.bind(this);
    }

    setChangedInAdmin() {
        const isChanged = Object.keys(this.state.changed).find(id => this.state.changed[id]);

        if (typeof window.parent !== 'undefined' && window.parent) {
            window.parent.configNotSaved = isChanged;
        }
    }

    componentDidMount() {
        window.addEventListener('beforeunload', this.onBrowserCloseBound, false);
    }

    componentWillUnmount() {
        window.removeEventListener('beforeunload', this.onBrowserCloseBound);
    }

    onBrowserClose(e) {
        const isChanged = Object.keys(this.scripts).find(id =>
            JSON.stringify(this.scripts[id]) !== JSON.stringify(this.props.objects[id].common));

        if (!!isChanged) {
            console.log('Script ' + console.log('Script ' + JSON.stringify(this.scripts[isChanged])));
            const message = I18n.t('Configuration not saved.');
            e = e || window.event;
            // For IE and Firefox
            if (e) {
                e.returnValue = message;
            }

            // For Safari
            return message;
        }
    }

    removeNonExistingScripts(nextProps, newState) {
        nextProps = nextProps || this.props;
        newState = newState || {};

        let _changed = false;
        if (this.state.editing && nextProps.objects['system.config']) {
            const isAnyNonExists = this.state.editing.find(id => !nextProps.objects[id]);

            if (isAnyNonExists) {
                // remove non-existing scripts
                const editing = JSON.parse(JSON.stringify(this.state.editing));
                for (let i = editing.length - 1; i >= 0; i--) {
                    if (!this.objects[editing[i]]) {
                        _changed = true;
                        editing.splice(i, 1);
                    }
                }
                if (_changed) {
                    newState.editing = editing;
                }
                if (this.state.selected && !this.objects[this.state.selected]) {
                    _changed = true;
                    newState.selected = editing[0] || '';
                    if (this.scripts[newState.selected]) {
                        if (this.state.blockly !== (this.scripts[newState.selected].engineType === 'Blockly')) {
                            newState.blockly = this.scripts[newState.selected].engineType === 'Blockly';
                            _changed = true;
                        }
                        if (this.state.verboseEnabled !== this.scripts[newState.selected].verbose) {
                            newState.verboseEnabled = this.scripts[newState.selected].verbose;
                            _changed = true;
                        }
                        if (this.state.debugEnabled !== this.scripts[newState.selected].debug) {
                            newState.debugEnabled = this.scripts[newState.selected].debug;
                            _changed = true;
                        }
                    }
                }
            }
        }
        return _changed;
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        const newState = {};
        let _changed = false;
        if (JSON.stringify(nextProps.runningInstances) !== JSON.stringify(this.state.runningInstances)) {
            _changed = true;
            newState.runningInstances = nextProps.runningInstances;
        }

        if (this.state.menuOpened !== nextProps.menuOpened) {
            newState.menuOpened = nextProps.menuOpened;
            _changed = true;
        }

        if (this.state.theme !== nextProps.theme) {
            newState.theme = nextProps.theme;
            _changed = true;
        }

        // check if all opened files still exists
        if (this.removeNonExistingScripts(nextProps, newState)) {
            _changed = true;
        }

        // update search text
        if (this.state.searchText !== nextProps.searchText) {
            newState.searchText = nextProps.searchText;
            _changed = true;
        }

        // if objects read
        if (this.objects !== nextProps.objects) {
            this.objects = nextProps.objects;
            window.main.objects = nextProps.objects;

            // update all scripts
            for (const id in this.scripts) {
                if (!this.scripts.hasOwnProperty(id)) continue;
                const source = this.scripts[id].source;
                this.scripts[id] = JSON.parse(JSON.stringify(this.objects[id].common));
                this.scripts[id].source = source;
            }

            const instances = [];
            for (let id in window.main.objects) {
                if (window.main.objects.hasOwnProperty(id) && id.startsWith('system.adapter.') && window.main.objects[id] && window.main.objects[id].type === 'instance') {
                    instances.push(id);
                }
            }
            window.main.instances = instances;

            // if script is blockly
            if (this.state.selected && this.objects[this.state.selected]) {
                this.scripts[this.state.selected] = this.scripts[this.state.selected] || JSON.parse(JSON.stringify(this.objects[this.state.selected].common));
                if (this.state.blockly !== (this.scripts[this.state.selected].engineType === 'Blockly')) {
                    newState.blockly = this.scripts[this.state.selected].engineType === 'Blockly';
                    _changed = true;
                }
                if (this.state.verboseEnabled !== this.scripts[this.state.selected].verbose) {
                    newState.verboseEnabled = this.scripts[this.state.selected].verbose;
                    _changed = true;
                }
                if (this.state.debugEnabled !== this.scripts[this.state.selected].debug) {
                    newState.debugEnabled = this.scripts[this.state.selected].debug;
                    _changed = true;
                }
            }

            // remove non-existing scripts
            const editing = JSON.parse(JSON.stringify(this.state.editing));
            for (let i = editing.length - 1; i >= 0; i--) {
                if (!this.objects[editing[i]]) {
                    _changed = true;
                    editing.splice(i, 1);
                    if (this.state.changed[editing[i]] !== undefined) {
                        newState.changed = newState.changed || JSON.parse(JSON.stringify(this.state.changed));
                        delete newState.changed[editing[i]];
                    }
                }
            }
            if (this.state.selected && !this.objects[this.state.selected]) {
                newState.selected = editing[0] || '';
            }
            if (_changed) {
                newState.editing = editing;
            }
        } else {
            // update all scripts
            for (const id in this.scripts) {
                if (!this.scripts.hasOwnProperty(id)) continue;
                if (this.objects[id] && this.objects[id].common) {
                    const oldSource = this.scripts[id].source;
                    const commonLocal = JSON.parse(JSON.stringify(this.scripts[id]));
                    commonLocal.source = this.objects[id].common.source;
                    // if anything except source was changed
                    if (JSON.stringify(commonLocal) !== JSON.stringify(this.objects[id].common)) {
                        this.scripts[id] = JSON.parse(JSON.stringify(this.objects[id].common));
                        this.scripts[id].source = oldSource;
                    }

                    if (oldSource !== this.objects[id].common.source) {
                        // take new script if it not yet changed
                        if (!this.state.changed[id]) {
                            // just use new value
                            this.scripts[id].source = this.objects[id].common.source;
                        } else {
                            if (this.objects[id].from && this.objects[id].from.startsWith('system.adapter.javascript.')) {
                                this.objects[id].from = 'system.adapter.admin.0';
                                // show that script was changed from outside
                                this.setState({toast: I18n.t('Script %s was modified on disk.', id.split('.').pop())});
                            }
                        }
                    } else {
                        if (this.state.changed[id]) {
                            newState.changed = newState.changed || JSON.parse(JSON.stringify(this.state.changed));
                            newState.changed[id] = false;
                            _changed = true;
                        }
                    }
                } else {
                    delete this.scripts[id];
                    if (this.state.selected === id) {
                        if (this.state.editing.indexOf(id) !== -1) {
                            const editing = JSON.parse(JSON.stringify(this.state.editing));
                            const pos = editing.indexOf(id);
                            if (pos !== -1) {
                                editing.splice(pos, 1);
                                newState.editing = editing;
                                _changed = true;
                            }
                        }
                        newState.selected = this.state.editing[0] || '';
                        _changed = true;
                    }
                }
            }
        }

        if (this.state.selected !== nextProps.selected && nextProps.selected) {
            if (nextProps.selected) {
                this.scripts[nextProps.selected] = this.scripts[nextProps.selected] || JSON.parse(JSON.stringify(this.props.objects[nextProps.selected].common));
            }

            const nextCommon = this.props.objects[nextProps.selected] && this.props.objects[nextProps.selected].common;

            const changed = nextCommon && JSON.stringify(this.scripts[nextProps.selected]) !== JSON.stringify(nextCommon);

            const editing = JSON.parse(JSON.stringify(this.state.editing));
            if (nextProps.selected && editing.indexOf(nextProps.selected) === -1) {
                editing.push(nextProps.selected);
                this.props.onSelectedChange(nextProps.selected, editing);
                window.localStorage && window.localStorage.setItem('Editor.editing', JSON.stringify(editing));
            }

            _changed = true;
            newState.changed = newState.changed || JSON.parse(JSON.stringify(this.state.changed));
            newState.changed[nextProps.selected] = changed;
            newState.editing = editing;
            newState.selected = nextProps.selected;
            newState.blockly = this.scripts[nextProps.selected].engineType === 'Blockly';
            newState.verboseEnabled = this.scripts[nextProps.selected].verbose;
            newState.debugEnabled = this.scripts[nextProps.selected].debug;
            newState.showBlocklyCode = false;
        } else {

        }

        if (this.state.visible !== nextProps.visible) {
            _changed = true;
            newState.visible = nextProps.visible;
        }
        _changed && this.setState(newState, () => this.setChangedInAdmin());
    }

    onRestart() {
        this.props.onRestart && this.props.onRestart(this.state.selected);
    }

    onSave() {
        if (this.state.changed[this.state.selected]) {
            const changed = JSON.parse(JSON.stringify(this.state.changed));
            changed[this.state.selected] = false;
            this.setState({changed}, () => {
                this.setChangedInAdmin();
                this.props.onChange && this.props.onChange(this.state.selected, this.scripts[this.state.selected]);
            });
        }
    }

    onCancel() {
        this.scripts[this.state.selected] = JSON.parse(JSON.stringify(this.props.objects[this.state.selected].common));

        const changed = JSON.parse(JSON.stringify(this.state.changed));
        changed[this.state.selected] = false;

        this.setState({changed}, () => this.setChangedInAdmin());
    }

    onRegisterSelect(func) {
        this.getSelect = func;
    }

    onConvert2JS() {
        this.showConfirmDialog(I18n.t('It will not be possible to revert this operation.'), result => {
            if (result) {
                this.scripts[this.state.selected].engineType = 'Javascript/js';
                let source = this.scripts[this.state.selected].source;
                const lines = source.split('\n');
                lines.pop();
                this.scripts[this.state.selected].source = lines.join('\n');
                const nowSelected = this.state.selected;

                const changed = JSON.parse(JSON.stringify(this.state.changed));
                changed[this.state.selected] = true;

                this.setState({changed, blockly: false, selected: ''}, () => {
                    this.setChangedInAdmin();
                    // force update of the editor
                    setTimeout(() => this.setState({selected: nowSelected}), 100);
                });
            }
        });
    }

    onChange(options) {
        options = options || {};
        if (options.script !== undefined) {
            this.scripts[this.state.selected].source = options.script;
        }
        if (options.debug !== undefined) {
            this.scripts[this.state.selected].debug = options.debug;
        }
        if (options.verbose !== undefined) {
            this.scripts[this.state.selected].verbose = options.verbose;
        }
        const _changed = JSON.stringify(this.scripts[this.state.selected]) !== JSON.stringify(this.props.objects[this.state.selected].common);
        if (_changed !== (this.state.changed[this.state.selected] || false)) {

            const changed = JSON.parse(JSON.stringify(this.state.changed));
            changed[this.state.selected] = _changed;
            this.objects[this.state.selected].from = 'system.adapter.admin.0';
            this.setState({changed}, () => this.setChangedInAdmin());

        }
    }

    onTabChange(event, selected) {
        window.localStorage && window.localStorage.setItem('Editor.selected', selected);
        const common = this.scripts[selected] || (this.props.objects[selected] && this.props.objects[selected].common);
        this.setState({selected, blockly: common.engineType === 'Blockly', showBlocklyCode: false, verboseEnabled: common.verbose, debugEnabled: common.debug});
        this.props.onSelectedChange && this.props.onSelectedChange(selected, this.state.editing);
    }

    isScriptChanged(id) {
        return this.scripts[id] && this.props.objects[id] && JSON.stringify(this.scripts[id]) !== JSON.stringify(this.props.objects[id].common);
    }

    onTabClose(id, e) {
        e && e.stopPropagation();

        const pos = this.state.editing.indexOf(id);
        if (this.state.editing.indexOf(id) !== -1) {
            if (this.isScriptChanged(id)) {
                this.showConfirmDialog(I18n.t('Discard changes for %s', this.props.objects[id].common.name), ok => {
                    if (ok) {
                        delete this.scripts[id];
                        this.onTabClose(id);
                    }
                });
            } else {
                const editing = JSON.parse(JSON.stringify(this.state.editing));
                editing.splice(pos, 1);
                const newState = {editing};
                if (id === this.state.selected) {
                    if (editing.length) {
                        if (pos === 0 || editing.length === 1) {
                            newState.selected = editing[0];
                        } else {
                            newState.selected = editing[pos - 1];
                        }
                    } else {
                        newState.selected = '';
                    }
                } else if (this.state.selected && !editing.length) {
                    newState.selected = '';
                }
                window.localStorage && window.localStorage.setItem('Editor.editing', JSON.stringify(editing));
                if (newState.selected !== undefined) {
                    newState.changed = newState.changed || JSON.parse(JSON.stringify(this.state.changed));
                    newState.changed[newState.selected] = this.isScriptChanged(newState.selected);
                    const common = newState.selected && (this.scripts[newState.selected] || (this.props.objects[newState.selected] && this.props.objects[newState.selected].common));
                    newState.blockly = common ? common.engineType === 'Blockly' : false;
                    newState.verboseEnabled = common ? common.verbose : false;
                    newState.debugEnabled = common ? common.debug : false;
                    newState.showBlocklyCode = false;
                }

                this.setState(newState, () =>  {
                    this.setChangedInAdmin();

                    if (newState.selected !== undefined) {
                        this.props.onSelectedChange && this.props.onSelectedChange(newState.selected, this.state.editing);
                        window.localStorage && window.localStorage.setItem('Editor.selected', newState.selected);
                    } else {
                        this.props.onSelectedChange && this.props.onSelectedChange(this.state.selected, this.state.editing);
                    }
                });
            }
        }
    }

    showConfirmDialog(question, cb) {
        this.confirmCallback = cb;
        this.setState({confirm: question});
    }

    sendCommandToBlockly(cmd) {
        this.setState({cmdToBlockly: cmd}, () =>
            setTimeout(() =>
                this.setState({cmdToBlockly: ''}), 200));
    }

    getTabs() {
        if (this.state.editing.length) {
            return [(<Tabs
                    component={'div'}
                    key="tabs1"
                    value={this.state.selected}
                    onChange={(event, value) => this.onTabChange(event, value)}
                    indicatorColor="primary"
                    style={{position: 'relative', width: this.state.editing.length > 1 ? 'calc(100% - 50px)' : '100%', display: 'inline-block'}}
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {this.state.editing.map(id => {
                        if (!this.props.objects[id]) {
                            const label = [
                                (<div key="text" className={this.props.classes.tabText + ' ' + (this.isScriptChanged(id) ? this.props.classes.tabChanged : '')}>{id.split('.').pop()}</div>),
                                (<span key="icon" className={this.props.classes.closeButton}><IconClose key="close" onClick={e => this.onTabClose(id, e)} fontSize="small"/></span>)];
                            return (<Tab
                                component={'div'}
                                href={'#' + id}
                                key={id}
                                label={label}
                                value={id}
                                classes={{wrapper: this.props.classes.tabButtonWrapper}}
                            />);
                        } else {
                            let text = this.props.objects[id].common.name;
                            let title = '';
                            if (text.length > 18) {
                                title = text;
                                text = text.substring(0, 15) + '...';
                            }
                            const changed = this.props.objects[id].common && this.scripts[id] && this.props.objects[id].common.source !== this.scripts[id].source;
                            const label = [
                                /*(<img key="icon" alt={""} src={images[this.props.objects[id].common.engineType] || images.def} className={this.props.classes.tabIcon}/>),*/
                                (<div key="text" className={this.props.classes.tabText + ' ' + (this.isScriptChanged(id) ? this.props.classes.tabChanged : '')}>{text}</div>),
                                changed ? (<span key="changedSign" className={this.props.classes.tabChangedIcon}>▣</span>) : null,
                                (<span key="icon2" className={this.props.classes.closeButton}><IconClose key="close" onClick={e => this.onTabClose(id, e)} fontSize="small"/></span>)];

                            return (<Tab
                                component={'div'}
                                href={'#' + id}
                                key={id}
                                label={label}
                                className={this.props.classes.tabButton}
                                value={id}
                                title={title}
                                classes={{wrapper: this.props.classes.tabButtonWrapper}}
                            />);
                        }
                    })}
                </Tabs>),
                this.state.editing.length > 1 ? (<IconButton
                    key="menuButton"
                    href="#"
                    aria-label="Close all but current"
                    className={this.props.classes.tabMenuButton}
                    title={I18n.t('Close all but current')}
                    aria-haspopup="false"
                    onClick={_event => {
                        const editing = [this.state.selected];
                        // Do not close not saved tabs
                        Object.keys(this.scripts).forEach(id =>
                            id !== this.state.selected &&
                            JSON.stringify(this.scripts[id]) !== JSON.stringify(this.props.objects[id].common) &&
                            editing.push(id)
                        );

                        window.localStorage && window.localStorage.setItem('Editor.editing', JSON.stringify(editing));
                        this.setState({menuTabsOpened: false, menuTabsAnchorEl: null, editing: editing});
                    }}
                >
                    <IconCloseAll />
                </IconButton>) : null
            ];
        } else {
            return (<div key="tabs2" className={this.props.classes.toolbar}>
                <Button key="select1" disabled={true} className={this.props.classes.hintButton} href="">
                    <span key="select2">{I18n.t('Click on this icon')}</span>
                    <IconDoEdit key="select3" className={this.props.classes.hintIcon}/>
                    <span key="select4">{I18n.t('for edit or create script')}</span>
                </Button>
            </div>);
        }
    }

    getDebugMenu() {
        if (!this.state.showDebugMenu) return null;

        return (<Menu
            key="menuDebug"
            id="menu-debug"
            anchorEl={this.state.menuDebugAnchorEl}
            open={this.state.showDebugMenu}
            onClose={() => this.setState({showDebugMenu: false, menuDebugAnchorEl: null})}
            PaperProps={{
                style: {
                    maxHeight: MENU_ITEM_HEIGHT * 7.5,
                },
            }}
        >
            <MenuItem key="debugEnabled"
                      title={I18n.t('debug_help')}
                      onClick={event => {
                          event.stopPropagation();
                          event.preventDefault();
                          this.setState({showDebugMenu: false, menuDebugAnchorEl: null, debugEnabled: !this.state.debugEnabled}, () => this.onChange({debug: this.state.debugEnabled}));
                      }}>
                <Checkbox checked={this.state.debugEnabled}/>
                <IconDebug className={this.props.classes.menuIcon} style={{color: COLOR_DEBUG}}/>
                {I18n.t('debug')}
            </MenuItem>
            <MenuItem key="verboseEnabled"
                      title={I18n.t('verbose_help')}
                      onClick={event => {
                          event.stopPropagation();
                          event.preventDefault();
                          this.setState({showDebugMenu: false, menuDebugAnchorEl: null, verboseEnabled: !this.state.verboseEnabled}, () => this.onChange({verbose: this.state.verboseEnabled}));
                      }}>
                <Checkbox checked={this.state.verboseEnabled}/>
                <IconVerbose className={this.props.classes.menuIcon} style={{color: COLOR_VERBOSE}}/>
                {I18n.t('verbose')}
            </MenuItem>
        </Menu>);
    }

    getDebugBadge() {
        return [
            this.state.debugEnabled && this.state.verboseEnabled  && (<IconDebug key="DebugVerbose" className={this.props.classes.menuIcon} style={{color: COLOR_VERBOSE}}/>),
            this.state.debugEnabled && !this.state.verboseEnabled && (<IconDebug key="DebugNoVerbose" className={this.props.classes.menuIcon} style={{color: COLOR_DEBUG}}/>),
            !this.state.debugEnabled && this.state.verboseEnabled && (<IconVerbose key="noDebugVerbose" className={this.props.classes.menuIcon} style={{color: COLOR_VERBOSE}}/>),
        ]
    }

    getToolbar() {
        return null;
    }

    getChartFrame() {
        const query = getUrlQuery();
        const host = query.host ? query.host : 'localhost'
        return (<div style={{display: this.state.visible ? "inline" : "none"}}><ChartFrame
            src={"http://" + host + ":8082/flot/index.html?l%5B0%5D%5Bid%5D=system.adapter.admin.0.memHeapTotal&l%5B0%5D%5Boffset%5D=0&l%5B0%5D%5Baggregate%5D=minmax&l%5B0%5D%5Bcolor%5D=%23FF0000&l%5B0%5D%5Bthickness%5D=3&l%5B0%5D%5Bshadowsize%5D=3&l%5B1%5D%5Bid%5D=system.adapter.admin.0.memHeapUsed&l%5B1%5D%5Boffset%5D=0&l%5B1%5D%5Baggregate%5D=minmax&l%5B1%5D%5Bcolor%5D=%2300FF00&l%5B1%5D%5Bthickness%5D=3&l%5B1%5D%5Bshadowsize%5D=3&timeType=relative&relativeEnd=now&range=10&aggregateType=count&aggregateSpan=300&hoverDetail=false&useComma=false&zoom=true&noedit=false&animation=0"}
        /></div>);
    }

    getConfirmDialog() {
        if (this.state.confirm) {
            return (<DialogConfirm
                key="dialogConfirm1"
                text={this.state.confirm}
                onClose={result => {
                    if (this.confirmCallback) {
                        const cb = this.confirmCallback;
                        this.confirmCallback = null;
                        cb(result);
                    }
                    this.setState({confirm: ''});
                }}
            />);
        } else {
            return null;
        }
    }

    getSelectIdDialog() {
        if (this.state.showSelectId) {
            return (<DialogSelectID
                key="dialogSelectID1"
                prefix={'../..'}
                theme={this.props.theme}
                connection={this.props.connection}
                selected={this.selectId.callback ? this.selectId.initValue || '' : this.getSelect ? this.getSelect() : ''}
                statesOnly={true}
                onClose={() => this.setState({showSelectId: false})}
                onOk={(selected, name) => {
                    this.selectId.initValue = null;
                    if (this.selectId.callback) {
                        this.selectId.callback(selected);
                        this.selectId.callback = null;
                    } else {
                        this.setState({insert: `'${selected}'/*${name}*/`})
                    }
                }}
            />);
        } else {
            return null;
        }
    }

    getToast() {
        return (<Snackbar
            key="toast"
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            open={!!this.state.toast}
            autoHideDuration={6000}
            onClose={() => this.setState({toast: ''})}
            ContentProps={{'aria-describedby': 'message-id',}}
            message={<span id="message-id">{this.state.toast}</span>}
            action={[
                <IconButton
                    key="close"
                    aria-label="close"
                    color="inherit"
                    className={this.props.classes.closeToast}
                    onClick={() => this.setState({toast: ''})}
                ><IconClose />
                </IconButton>,
            ]}
        />);
    }

    render() {
        if (this.state.selected && this.props.objects[this.state.selected] && this.state.blockly === null) {
            this.scripts[this.state.selected] = this.scripts[this.state.selected] || JSON.parse(JSON.stringify(this.props.objects[this.state.selected].common));
            setTimeout(() => {
                const newState = {
                    blockly: this.scripts[this.state.selected].engineType === 'Blockly',
                    showBlocklyCode: false,
                    debugEnabled: this.scripts[this.state.selected].debug,
                    verboseEnabled: this.scripts[this.state.selected].verbose,
                };

                // check if all opened files still exists
                this.removeNonExistingScripts(null, newState);
                this.setState(newState);
            }, 100);
        }

        return [
            this.getTabs(),
            this.getToolbar(),
            this.getChartFrame(),
            this.getConfirmDialog(),
            this.getSelectIdDialog(),
            this.getDebugMenu(),
            this.getToast(),
        ];
    }
}

Editor.propTypes = {
    objects: PropTypes.object.isRequired,
    selected: PropTypes.string.isRequired,
    onSelectedChange: PropTypes.func.isRequired,
    onRestart: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    visible: PropTypes.bool,
    menuOpened: PropTypes.bool,
    onLocate: PropTypes.func,
    runningInstances: PropTypes.object,
    connection: PropTypes.object,
    searchText: PropTypes.string,
    theme: PropTypes.string
};

export default withStyles(styles)(Editor);
