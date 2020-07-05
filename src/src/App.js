import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import SplitterLayout from 'react-splitter-layout';
import {MdMenu as IconMenuClosed} from 'react-icons/md';
import {MdArrowBack as IconMenuOpened} from 'react-icons/md';

import 'react-splitter-layout/lib/index.css';
import clsx from 'clsx';

import DialogMessage from '@iobroker/adapter-react/Dialogs/Message';
import DialogConfirm from '@iobroker/adapter-react/Dialogs/Confirm';
import Utils from '@iobroker/adapter-react/Components/Utils';
import GenericApp from '@iobroker/adapter-react/GenericApp';
import Loader from '@iobroker/adapter-react/Components/Loader'
import I18n from '@iobroker/adapter-react/i18n';

import SideMenu from './SideMenu';
import SettingsEditor from './SettingsEditor';
import MainChart from './MainChart';
import Theme from './Theme';
import DialogError from './Dialogs/Error';
import DialogImportFile from './Dialogs/ImportFile';
import getUrlQuery from './utils/getUrlQuery';

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

        this.state = {
            connected: false,
            progress: 0,
            ready: false,
            updateScripts: 0,

            instances: [],
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
        };

        // this.logIndex = 0;
        this.logSize  = window.localStorage ? parseFloat(window.localStorage.getItem('App.logSize')) || 150 : 150;
        this.menuSize = window.localStorage ? parseFloat(window.localStorage.getItem('App.menuSize')) || 500 : 500;
        this.scripts = {};
        this.hosts = [];
        this.importFile = null;

        this.subscribes = [];
    }

    onConnectionReady() {
        this.socket.getSystemConfig()
            .then(systemConfig =>
                this.getAllData()
                    .then(() => this.setState({ready: true, systemConfig})))
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

    loadPresets() {
        return new Promise(resolve =>
            this.socket._socket.emit('getObjectView', 'chart', 'chart', {
                startkey: this.adapterName + '.',
                endkey: this.adapterName + '.\u9999'
            }, (err, objs) => {
                if (!err && objs) {
                    const instances = JSON.parse(JSON.stringify(this.state.instances));
                    instances.presets.enabledDP = objs;
                    this.setState({instances});
                    console.log('Presets: ' + JSON.stringify(objs));
                }
                resolve();
            }));
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
        return this.socket._socket.emit('getObjectView', 'custom', 'state', {}, (err, objs) => {
            const ids = objs.rows.map(item => item.id);
            this.getObjects(ids, objs => {
                const ids = instances.map(obj => obj._id.substring('system.adapter.'.length));
                const _instances = {};
                _instances.presets = {_id: 'presets', common: {name: I18n.t('Presets')}, enabledDP: {}}
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

    onRename(oldId, newId, newName, newInstance) {
        console.log(`Rename ${oldId} => ${newId}`);
        let promise;
        this.setState({updating: true});
        if (this.scripts[oldId] && this.scripts[oldId].type === 'script') {
            const common = JSON.parse(JSON.stringify(this.scripts[oldId].common));
            common.name = newName || common.name;
            if (newInstance !== undefined) {
                common.engine = 'system.adapter.javascript.' + newInstance;
            }
            promise = this.socket.updateScript(oldId, newId, common);
        } else {
            promise = this.socket.renameGroup(oldId, newId, newName);
        }

        promise
            .then(() => this.setState({updating: false}))
            .catch(err => err !== 'canceled' && this.showError(err));
    }

    onUpdatePreset(id, common) {
        if (this.scripts[id] && this.scripts[id].type === 'script') {
            this.socket.updateScript(id, id, common)
                .then(() => {})
                .catch(err => err !== 'canceled' && this.showError(err));
        }
    }

    onSelect(selected) {
        if (this.objects[selected] && this.objects[selected].common && this.objects[selected].type === 'script') {
            this.setState({selected, menuSelectId: selected}, () =>
                setTimeout(() => this.setState({menuSelectId: ''})), 300);
        }
    }

    onExpertModeChange(expertMode) {
        if (this.state.expertMode !== expertMode) {
            window.localStorage && window.localStorage.setItem('App.expertMode', expertMode ? 'true' : 'false');
            this.setState({expertMode});
        }
    }

    showError(err) {
        this.setState({errorText: err});
    }

    showMessage(message) {
        this.setState({message});
    }

    onDelete(id) {
        this.socket.delObject(id)
            .then(() => {})
            .catch(err => {
                this.showError(err);
            });
    }

    onEdit(id) {
        if (this.state.selected !== id) {
            this.setState({selected: id});
        }
    }

    onAddNew(id, name, isFolder, instance, type, source) {
        const reg = new RegExp(`^${id}\\.`);

        if (Object.keys(this.objects).find(_id => id === _id || reg.test(id))) {
            this.showError(I18n.t('Yet exists!'));
            return;
        }

        if (isFolder) {
            this.socket.setObject(id, {
                common: {
                    name,
                    expert: true
                },
                type: 'channel'
            }).then(() => {
                setTimeout(() => this.setState({menuSelectId: id}, () =>
                    setTimeout(() => this.setState({menuSelectId: ''})), 300), 1000);
            }).catch(err => {
                this.showError(err);
            });
        } else {
            this.socket.setObject(id, {
                common: {
                    name,
                    expert: true,
                    engineType: type,
                    engine: 'system.adapter.javascript.' + (instance || 0),
                    source: source || '',
                    debug: false,
                    verbose: false
                },
                type: 'script'
            }).then(() => {
                setTimeout(() => this.onSelect(id), 1000);
            }).catch(err => {
                this.showError(err);
            });
        }
    }

    onEnableDisable(id, enabled) {
        if (this.scripts[id] && this.scripts[id].type === 'script') {
            const common = this.objects[id].common;
            common.enabled = enabled;
            common.expert = true;
            this.socket.updateScript(id, id, common)
                .then(() => {})
                .catch(err => err !== 'canceled' && this.showError(err));
        }
    }

    getLiveHost(cb, _list) {
        if (!_list) {
            _list = JSON.parse(JSON.stringify(this.hosts)) || [];
        }

        if (_list.length) {
            const id = _list.shift();
            this.socket.getState(id + '.alive', (err, state) => {
                if (!err && state && state.val) {
                    cb(id);
                } else {
                    setTimeout(() => this.getLiveHost(cb, _list));
                }
            });
        } else {
            cb();
        }
    }

    onExport() {
        this.getLiveHost(host => {
            if (!host) {
                this.showError(I18n.t('No active host found'));
                return;
            }

            const d = new Date();
            let date = d.getFullYear();
            let m = d.getMonth() + 1;
            if (m < 10) m = '0' + m;
            date += '-' + m;
            m = d.getDate();
            if (m < 10) m = '0' + m;
            date += '-' + m + '-';

            this.socket.socket.emit('sendToHost', host, 'readObjectsAsZip', {
                adapter: 'javascript',
                id: 'script.js',
                link: date + 'scripts.zip' // request link to file and not the data itself
            }, data => {
                if (typeof data === 'string') {
                    // it is a link to created file
                    const a = document.createElement('a');
                    a.href = '/zip/' + date + 'scripts.zip';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } else {
                    data.error && this.showError(data.error);
                    if (data.data) {
                        const a = document.createElement('a');
                        a.href = 'data: application/zip;base64,' + data.data;
                        a.download = date + 'scripts.zip';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                    }
                }
            });
        });
    }

    onImport(data) {
        this.importFile = data;
        if (data) {
            this.confirmCallback = this.onImportConfirmed.bind(this);
            this.setState({importFile: false, confirm: I18n.t('Existing scripts will be overwritten.')});
        } else {
            this.setState({importFile: false});
        }
    }

    onImportConfirmed(ok) {
        let data = this.importFile;
        this.importFile = null;
        if (ok && data) {
            data = data.split(',')[1];
            this.getLiveHost(host => {
                if (!host) {
                    this.showError(I18n.t('No active host found'));
                    return;
                }
                this.socket.socket.emit('sendToHost', host, 'writeObjectsAsZip', {
                    data: data,
                    adapter: 'javascript',
                    id: 'script.js'
                }, data => {
                    if (data === 'permissionError') {
                        this.showError(I18n.t(data));
                    } else if (!data || data.error) {
                        this.showError(data ? I18n.t(data.error) : I18n.t('Unknown error'));
                    } else {
                        this.showMessage(I18n.t('Done'));
                    }
                });
            });
        }
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
                        onChange={(id, common) => this.onUpdatePreset(id, common)}
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
                        <SideMenu
                            key="sidemenu"
                            scripts={this.scripts}
                            objects={this.objects}
                            instances={this.state.instances}
                            /*
                            update={this.state.updateScripts}
                            onRename={this.onRename.bind(this)}
                            onSelect={this.onSelect.bind(this)}
                            onEdit={this.onEdit.bind(this)}
                            onExpertModeChange={this.onExpertModeChange.bind(this)}
                            onDelete={this.onDelete.bind(this)}
                            onAddNew={this.onAddNew.bind(this)}
                            onEnableDisable={this.onEnableDisable.bind(this)}
                            onExport={this.onExport.bind(this)}
                            onImport={() => this.setState({importFile: true})}
                            onThemeChange={theme => {
                                window.localStorage && window.localStorage.setItem('App.theme', theme);
                                this.setState({themeType: theme}, () => this.props.onThemeChange(theme))
                            }}
                            */
                            connection={this.socket}
                            selectId={this.state.menuSelectId}
                            expertMode={this.state.expertMode}
                            theme={this.state.themeType}
                            width={this.menuSize}
                        />
                    </div>
                    {this.renderMain()}
                </SplitterLayout>
            </div>
        );
    }
}

export default withStyles(styles)(App);