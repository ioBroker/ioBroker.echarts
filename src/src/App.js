import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import SplitterLayout from 'react-splitter-layout';
import {MdMenu as IconMenuClosed} from 'react-icons/md';
import {MdArrowBack as IconMenuOpened} from 'react-icons/md';

import 'react-splitter-layout/lib/index.css';

import Connection from '@iobroker/adapter-react/Connection';
import {PROGRESS} from '@iobroker/adapter-react/Connection';
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

class App extends Component {
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
            themeType: window.localStorage ? window.localStorage.getItem('App.theme') || 'light' : 'light',
        };
        // this.logIndex = 0;
        this.logSize = window.localStorage ? parseFloat(window.localStorage.getItem('App.logSize')) || 150 : 150;
        this.menuSize = window.localStorage ? parseFloat(window.localStorage.getItem('App.menuSize')) || 500 : 500;
        this.scripts = {};
        this.hosts = [];
        this.importFile = null;

        const query = getUrlQuery();

        this.socket = new Connection({
            host: query.host ? query.host : 'localhost',
            port: 8081,
            autoSubscribes: ['script.*', 'system.adapter.javascript.*'],
            autoSubscribeLog: true,
            //port: 8082, // debug port
            onProgress: progress => {
                if (progress === PROGRESS.CONNECTING) {
                    this.setState({connected: false});
                } else if (progress === PROGRESS.READY) {
                    this.setState({connected: true, progress: 100});
                } else {
                    this.setState({connected: true, progress: Math.round(PROGRESS.READY / progress * 100)});
                }
            },
            onReady: (objects, scripts) => {
                I18n.setLanguage(this.socket.systemLang);
                window.systemLang = this.socket.systemLang;
                this.onObjectChange(objects, scripts, true, () => this.getStorageInstances());
            },
            onObjectChange: (objects, scripts) => this.onObjectChange(objects, scripts),
            onError: err => console.error(err)
        });
    }

    getEnabledDPs(id, cb) {
        let timer = setTimeout(() => {
            timer = null;
            cb && cb(null);
            cb = null;
        }, 500);

        this.socket.sendTo(id, 'getEnabledDPs', {}, result => {
            timer && clearTimeout(timer);
            timer = null;
            cb && cb(result);
            cb = null;
        });
    }

    getStorageInstances() {
        this.socket.getAdapterInstances('')
            .then(instances => instances.filter(entry => entry && entry.common && entry.common.getHistory && entry.common.enabled))
            .then(instances => {
                let cnt = 0;
                instances.forEach(instObj => {
                    let dbInstance = instObj._id.replace('system.adapter.', '');

                    cnt++;
                    this.getEnabledDPs(dbInstance, result => {
                        instObj.enabledDP = result || {'no answer': {obj: {common: {name: I18n.t('No answer')}}}};

                        Object.keys(instObj.enabledDP).forEach(id => {
                            if (id === 'no answer') {
                                return;
                            }
                            cnt++;
                            this.socket.getObject(id)
                                .then (res => {
                                    instObj.enabledDP[id].obj = res;
                                    !--cnt && this.setState({instances});
                                });
                        });

                        !--cnt && this.setState({instances});
                    });
                });
            })
            .then(instances => instances && this.setState({instances}));
    }

    onObjectChange(objects, scripts, isReady, cb) {
        this.objects = objects;
        // extract scripts and instances
        const nScripts = {};
        const newState = {};

        scripts.list.forEach(id => nScripts[id] = objects[id]);
        scripts.groups.forEach(id => nScripts[id] = objects[id]);
        this.hosts = scripts.hosts;

        if (window.localStorage && window.localStorage.getItem('App.expertMode') !== 'true' && window.localStorage.getItem('App.expertMode') !== 'false') {
            // detect if some global scripts exists
            if (scripts.list.find(id => id.startsWith('script.js.global.'))) {
                newState.expertMode = true;
            }
        }

        if (isReady !== undefined) {
            newState.ready = isReady;
        }
        this.setState(newState, cb && cb);
    }

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

    renderMain() {
        const {classes} = this.props;
        const errorDialog = this.state.errorText ? (<DialogError key="dialogerror" onClose={() => this.setState({errorText: ''})} text={this.state.errorText}/>) : null;
        return [
            this.state.message ? (<DialogMessage key="dialogmessage" onClose={() => this.setState({message: ''})} text={this.state.message}/>) : null,
            errorDialog,
            this.state.importFile ? (<DialogImportFile key="dialogimportfile" onClose={data => this.onImport(data)} />) : null,
            this.state.confirm ? (<DialogConfirm
                key="confirmdialog"
                onClose={result => {
                    this.state.confirm && this.setState({confirm: ''});
                    this.confirmCallback && this.confirmCallback(result);
                    this.confirmCallback = null;
                }}
                text={this.state.confirm}/>) : null,
            (<div className={classes.content + ' iobVerticalSplitter'} key="confirmdialog">
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
                        onChange={(id, common) => this.onUpdateScript(id, common)}
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
                        onRestart={id => this.socket.extendObject(id, {})}
                        selected={this.state.selected && this.objects[this.state.selected] && this.objects[this.state.selected].type === 'script' ? this.state.selected : ''}
                        objects={this.objects}
                    />
                    <SettingsEditor
                        key="Editor"
                        onChange={(id, common) => this.onUpdatePreset(id, common)}
                        verticalLayout={!this.state.logHorzLayout} onLayoutChange={() => this.toggleLogLayout()} connection={this.socket} selected={this.state.selected}/>
                </SplitterLayout>
            </div>),
        ];
    }

    render() {
        const {classes} = this.props;

        if (!this.state.ready) {
            // return (<CircularProgress className={classes.progress} size={50} />);
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
                            update={this.state.updateScripts}
                            onRename={this.onRename.bind(this)}
                            onSelect={this.onSelect.bind(this)}
                            connection={this.socket}
                            selectId={this.state.menuSelectId}
                            onEdit={this.onEdit.bind(this)}
                            expertMode={this.state.expertMode}
                            theme={this.state.themeType}
                            onThemeChange={theme => {
                                window.localStorage && window.localStorage.setItem('App.theme', theme);
                                this.setState({themeType: theme}, () => this.props.onThemeChange(theme))
                            }}
                            onExpertModeChange={this.onExpertModeChange.bind(this)}
                            onDelete={this.onDelete.bind(this)}
                            onAddNew={this.onAddNew.bind(this)}
                            onEnableDisable={this.onEnableDisable.bind(this)}
                            onExport={this.onExport.bind(this)}
                            width={this.menuSize}
                            onImport={() => this.setState({importFile: true})}
                        />
                    </div>
                    {this.renderMain()}
                </SplitterLayout>
            </div>
        );
    }
}

export default withStyles(styles)(App);