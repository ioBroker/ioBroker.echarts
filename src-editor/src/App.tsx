import React from 'react';
import ReactSplit, { SplitDirection } from '@devbookhq/splitter';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import { DragDropContext, type DropResult } from 'react-beautiful-dnd';

import { Dialog, DialogTitle, Button, DialogActions, Box } from '@mui/material';

// icons
import {
    MdClose as IconCancel,
    MdSave as IconSave,
    MdMenu as IconMenuClosed,
    MdArrowBack as IconMenuOpened,
} from 'react-icons/md';

import { I18n, Loader, withWidth, GenericApp, type IobTheme } from '@iobroker/adapter-react-v5';

import enLang from './i18n/en.json';
import deLang from './i18n/de.json';
import ruLang from './i18n/ru.json';
import ptLang from './i18n/pt.json';
import nlLang from './i18n/nl.json';
import frLang from './i18n/fr.json';
import itLang from './i18n/it.json';
import esLang from './i18n/es.json';
import plLang from './i18n/pl.json';
import ukLang from './i18n/uk.json';
import zhLang from './i18n/zh-cn.json';

import '@iobroker/adapter-react-v5/build/index.css';

import SettingsEditor from './SettingsEditor';
import MainChart from './MainChart';
import getUrlQuery from './utils/getUrlQuery';
import { getDefaultPreset, getDefaultLine } from './Components/DefaultPreset';
import MenuList from './MenuList';
import flotConverter from './utils/flotConverter';
import type { GenericAppProps, GenericAppSettings, GenericAppState } from '@iobroker/adapter-react-v5/build/types';
import type {
    ChartAggregateType,
    ChartConfigMore,
    ChartLineConfigMore,
    ChartRangeOptions,
    ChartRelativeEnd,
    ChartType,
    SelectedChart,
} from '../../src/types';

const styles: Record<string, any> = {
    root: (theme: IobTheme): React.CSSProperties => ({
        width: '100%',
        height: '100%',
        background: theme.palette.background.default,
        color: theme.palette.mode === 'dark' ? '#FFF' : '#000',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    }),
    menuDiv: {
        overflow: 'hidden',
    },
    content: (theme: IobTheme): React.CSSProperties => ({
        width: '100%',
        height: '100%',
        backgroundColor: theme.palette.background.default,
        position: 'relative',
    }),
    menuDivWithoutMenu: {
        '&>div:first-child': {
            display: 'none',
        },
        '&>.layout-splitter': {
            display: 'none',
        },
    },
    progress: {
        margin: 100,
    },
    menuOpenCloseButton: (theme: IobTheme): any => ({
        position: 'absolute',
        left: 0,
        borderRadius: '0 5px 5px 0',
        top: 6,
        pt: '8px',
        cursor: 'pointer',
        zIndex: 1,
        height: 25,
        width: 20,
        background: theme.palette.secondary.main,
        color: theme.palette.primary.main,
        pl: '3px',
        '&:hover': {
            color: 'white',
        },
    }),
    buttonsContainer: {
        '& button': {
            whiteSpace: 'nowrap',
        },
    },
};

const FORBIDDEN_CHARS = /[.\][*,;'"`<>\\?]/g;

function loadChartParamN(name: string, defaultValue: number): number {
    const val: string | null = window.localStorage.getItem(`App.echarts.__${name}`);
    return val ? parseFloat(val) : defaultValue;
}
function loadChartParamS(name: string, defaultValue: string): string {
    const val: string | null = window.localStorage.getItem(`App.echarts.__${name}`);
    return val || defaultValue;
}
function loadChartParam<T>(name: string, defaultValue: T): T {
    const val: string | null = window.localStorage.getItem(`App.echarts.__${name}`);
    return (val as T) || defaultValue;
}

function parseHash(): Record<string, any> | null {
    if (window.location.hash) {
        const result: Record<string, any> = {};
        window.location.hash
            .replace(/^#/, '')
            .split('&')
            .forEach(line => {
                const [name, val] = line.split('=');
                result[name] = window.decodeURIComponent(val);
                if (name === 'instance' && !result[name].startsWith('system.adapter')) {
                    result[name] = `system.adapter.${result[name]}`;
                }
            });
        return result;
    }
    return null;
}

interface AppState extends GenericAppState {
    autoSave: boolean;
    chartsList: { id: string; instance: string }[] | null;
    discardChangesConfirmDialog: false | 'chart' | 'preset' | 'folder';
    instances: ioBroker.InstanceObject[];
    logHorzLayout: boolean;
    menuOpened: boolean;
    menuSizes: [number, number];
    originalPresetData: null | string;
    presetData: null | ChartConfigMore;
    progress: 0 | 1 | 2 | 3;
    ready: boolean;
    resizing: boolean;
    scrollToSelect: boolean;
    selectedId: SelectedChart;
    selectedPresetChanged: boolean;
    splitSizes: [number, number];
    systemConfig: ioBroker.SystemConfigObject;
}

class App extends GenericApp<GenericAppProps, AppState> {
    private config: { preset: string } | { id: string; instance: string; menuOpened: boolean } | null;

    private objects: Record<string, ioBroker.StateObject | null> = {};

    private confirmCB: ((confirmed: boolean) => void) | null = null;

    constructor(props: GenericAppProps) {
        const settings: GenericAppSettings = { socket: {} };
        const query = getUrlQuery();
        settings.socket.port =
            (query.port as string) ||
            (parseInt(window.location.port) >= 3000 && parseInt(window.location.port) <= 3020
                ? 8081
                : window.location.port);
        settings.socket.host = (query.host as string) || window.location.hostname;
        settings.translations = {
            en: enLang,
            de: deLang,
            ru: ruLang,
            pt: ptLang,
            nl: nlLang,
            fr: frLang,
            it: itLang,
            es: esLang,
            pl: plLang,
            uk: ukLang,
            'zh-cn': zhLang,
        };
        settings.sentryDSN = window.sentryDSN;

        if (window.location.port === '3000') {
            settings.socket = { port: '8081' };
        }
        if (window.socketUrl && window.socketUrl.startsWith(':')) {
            window.socketUrl = `${window.location.protocol}//${window.location.hostname}${window.socketUrl}`;
        }

        super(props, settings);

        this.config = parseHash() as { preset: string } | { id: string; instance: string; menuOpened: boolean };
    }

    onHashChanged(): void {
        super.onHashChanged();
        const config: { preset: string } | { id: string; instance: string } = parseHash() as
            | { preset: string }
            | { id: string; instance: string };

        if (
            ((config as { preset: string }).preset &&
                this.state.selectedId !== (config as { preset: string }).preset) ||
            ((config as { id: string; instance: string }).id &&
                typeof this.state.selectedId === 'object' &&
                (this.state.selectedId?.id !== (config as { id: string; instance: string }).id ||
                    this.state.selectedId?.instance !== (config as { id: string; instance: string }).instance))
        ) {
            void this.loadChartOrPreset(
                (config as { preset: string }).preset || (config as { id: string; instance: string }),
            ).then(() => this.setState({ scrollToSelect: true }, () => this.setState({ scrollToSelect: false })));
        }
    }

    async onConnectionReady(): Promise<void> {
        const selectedIdStr = window.localStorage.getItem('App.echarts.selectedId');

        let selectedId: SelectedChart;

        if (selectedIdStr) {
            try {
                selectedId = JSON.parse(selectedIdStr);
            } catch {
                selectedId = null;
            }
        }

        if (!selectedId && (this.config as { preset: string })?.preset) {
            selectedId = (this.config as { preset: string }).preset;
        } else if (!selectedId && (this.config as { id: string; instance: string })?.id) {
            selectedId = {
                id: (this.config as { id: string; instance: string }).id,
                instance: (this.config as { id: string; instance: string }).instance,
            };
        }

        const splitSizesStr = window.localStorage.getItem('App.echarts.settingsSizes');
        let splitSizes: [number, number] = [25, 75];
        if (splitSizesStr) {
            try {
                splitSizes = JSON.parse(splitSizesStr);
            } catch {
                // ignore
            }
        }
        splitSizes = splitSizes || [25, 75];
        const menuSizesStr = window.localStorage.getItem('App.echarts.menuSizes');
        let menuSizes: [number, number] = [25, 75];
        if (menuSizesStr) {
            try {
                menuSizes = JSON.parse(menuSizesStr);
            } catch {
                // ignore
            }
        }

        menuSizes = menuSizes || [25, 75];
        const newState: Partial<AppState> = {
            ready: false,
            instances: [],
            splitSizes,
            menuSizes,

            selectedId,
            selectedPresetChanged: false,
            presetData: null,
            originalPresetData: null,
            chartsList: null,
            progress: 0,
            autoSave: window.localStorage.getItem('App.echarts.autoSave') === 'true',

            discardChangesConfirmDialog: false,

            resizing: false,
            menuOpened: window.localStorage.getItem('App.echarts.menuOpened') !== 'false',
            logHorzLayout: window.localStorage.getItem('App.echarts.logHorzLayout') === 'true',
        };

        this.objects = {};

        const systemConfig = await this.socket.getSystemConfig();
        newState.systemConfig = systemConfig;
        newState.presetData = getDefaultPreset(systemConfig);

        if ((this.config as { id: string; instance: string; menuOpened: boolean })?.id) {
            const stateConfig: { id: string; instance: string; menuOpened: boolean } = this.config as {
                id: string;
                instance: string;
                menuOpened: boolean;
            };
            newState.selectedId = { id: stateConfig.id, instance: stateConfig.instance };
            if (stateConfig.menuOpened !== undefined) {
                newState.menuOpened = stateConfig.menuOpened === true;
            }
            this.config = null;
        }

        this.setState(newState as AppState, async (): Promise<void> => {
            flotConverter(this.socket, this.instance);
            try {
                // get only history adapters
                const allInstances = await this.socket.getAdapterInstances('');
                const instances = allInstances.filter(entry => entry?.common?.getHistory && entry.common.enabled);
                this.setState({ ready: true, instances });
            } catch (e) {
                this.onError(e, 'Cannot read system config');
            }
        });
    }

    async getNewPresetName(parentId: string, prefix?: string, index?: string): Promise<string> {
        index = index || (prefix ? '' : '1');
        prefix = prefix || 'preset_';

        let obj: ioBroker.Object | null | undefined;
        do {
            try {
                obj = await this.socket.getObject(
                    `${this.adapterName}.${this.instance}.${parentId ? `${parentId}.` : ''}${prefix}${index}`,
                );
            } catch {
                return prefix + index;
            }

            if (!obj) {
                return prefix + index;
            }
            if (!index) {
                index = '2';
            } else {
                index = (parseInt(index, 10) + 1).toString();
            }
        } while (obj);
    }

    async getUniqueId(id: string, name: string): Promise<{ id: string; name: string }> {
        let count = 0;
        let obj: ioBroker.Object | null | undefined;
        do {
            const newId = `${id}_${I18n.t('copy')}${count ? `_${count}` : ''}`;
            const newName = `${name} ${I18n.t('copy')}${count ? ` ${count}` : ''}`;
            try {
                obj = await this.socket.getObject(newId);
            } catch {
                // ignore
            }

            if (!obj) {
                return { name: newName, id: newId };
            }
            count++;
        } while (count < 100);

        throw new Error(I18n.t('Cannot create unique ID'));
    }

    onCopyPreset = async (presetId: string): Promise<void> => {
        try {
            const obj: ioBroker.Object | null | undefined = await this.socket.getObject(presetId);
            if (obj) {
                const { id, name } = await this.getUniqueId(
                    presetId,
                    typeof obj.common.name === 'object'
                        ? obj.common.name[I18n.getLanguage()] || obj.common.name.en
                        : obj.common.name,
                );
                obj._id = id;
                obj.common.name = name;
                try {
                    await this.socket.setObject(obj._id, obj);
                    void this.loadChartOrPreset(id);
                } catch (e) {
                    this.onError(e, 'Cannot save object');
                }
            }
        } catch (e) {
            this.onError(e, 'Cannot save object');
        }
    };

    onCreatePreset = async (isFromCurrentSelection: boolean, parentId?: string): Promise<void> => {
        let template: ioBroker.ChartObject;
        let id: string;
        if (isFromCurrentSelection === true) {
            let name = '';
            const selectedId: { id: string; instance: string } = this.state.selectedId as {
                id: string;
                instance: string;
            };

            const chartsList: { id: string; instance: string }[] = JSON.parse(
                JSON.stringify(this.state.chartsList || []),
            );
            if (!chartsList.find(item => item.id === selectedId.id && item.instance === selectedId.instance)) {
                chartsList.push(selectedId);
            }

            // Todo> Detect if all ids are from one enum

            let obj: ioBroker.ChartObject | null = null;
            // create from list selectedId
            if (chartsList.length === 1) {
                obj = (await this.socket.getObject(chartsList[0].id)) as ioBroker.ChartObject | null | undefined;
            }

            if (obj && obj?.common?.name) {
                name =
                    typeof obj.common.name === 'object'
                        ? (obj.common.name[I18n.getLanguage()] || obj.common.name.en || '').trim()
                        : obj.common.name;
            }

            const _name = await this.getNewPresetName(parentId, name);
            id = `${this.adapterName}.0.${parentId ? `${parentId}.` : ''}${name.replace(FORBIDDEN_CHARS, '_')}`;

            template = {
                _id: id,
                common: {
                    name: _name,
                    expert: true,
                },
                native: {
                    data: JSON.parse(JSON.stringify(this.state.presetData)),
                },
                type: 'chart',
            };
        } else {
            // create empty preset
            const name = await this.getNewPresetName(parentId);
            id = `${this.adapterName}.0.${parentId ? `${parentId}.` : ''}${name.replace(FORBIDDEN_CHARS, '_')}`;
            template = {
                _id: id,
                common: {
                    name,
                },
                native: {
                    url: '',
                    data: getDefaultPreset(this.state.systemConfig, null, null, I18n.getLanguage()),
                },
                type: 'chart',
            };
        }

        try {
            await this.socket.setObject(id, template);
            void this.loadChartOrPreset(id);
        } catch (e) {
            this.onError(e, 'Cannot save object');
        }
    };

    onError(e: Error | string, comment?: string): void {
        if (comment) {
            console.error(comment);
        }
        this.showError(e.toString());
    }

    savePreset = async (): Promise<void> => {
        if (!this.state.presetData) {
            this.showError(I18n.t('Empty preset cannot be saved!'));
            throw new Error(I18n.t('Empty preset cannot be saved!'));
        }
        try {
            const obj = await this.socket.getObject(this.state.selectedId as string);
            if (!obj?.native) {
                this.showError(I18n.t('Invalid object'));
                return;
            }
            obj.native.data = this.state.presetData;
            try {
                await this.socket.setObject(obj._id, obj);
            } catch (e) {
                this.onError(e, 'Cannot save object');
            }
            this.setState({
                originalPresetData: JSON.stringify(this.state.presetData),
                selectedPresetChanged: false,
            });
        } catch (e) {
            this.onError(e, 'Cannot read object');
        }
    };

    static normalizePreset(presetData: ChartConfigMore): void {
        // @ts-expect-error deprecated
        if (presetData.lines) {
            // @ts-expect-error deprecated
            presetData.l = presetData.lines;
            // @ts-expect-error deprecated
            delete presetData.lines;
        }
        if (
            typeof presetData.range === 'string' &&
            !presetData.range.includes('m') &&
            !presetData.range.includes('y')
        ) {
            presetData.range = parseInt(presetData.range, 10);
        }

        presetData.l?.forEach(line => {
            if (typeof line.commonYAxis === 'string') {
                if (line.commonYAxis === '') {
                    delete line.commonYAxis;
                } else {
                    line.commonYAxis = parseInt(line.commonYAxis as unknown as string, 10);
                }
            }
            if (typeof line.fill === 'string') {
                if (line.fill === '') {
                    delete line.fill;
                } else {
                    line.fill = parseFloat(line.fill as unknown as string);
                }
            }
        });
    }

    async loadChartOrPreset(selectedId: SelectedChart): Promise<void> {
        window.localStorage.setItem('App.echarts.selectedId', JSON.stringify(selectedId));

        if (selectedId && typeof selectedId === 'object') {
            // load chart
            if (this.state.chartsList) {
                for (const item of this.state.chartsList) {
                    if (this.objects[item.id] === undefined) {
                        this.objects[item.id] =
                            ((await this.socket.getObject(item.id)) as ioBroker.StateObject) || null;
                    }
                }
            } else {
                this.objects = {};
            }

            if (this.objects[selectedId.id] === undefined) {
                this.objects[selectedId.id] =
                    ((await this.socket.getObject(selectedId.id)) as ioBroker.StateObject) || null;
            }

            const lines: ChartLineConfigMore[] = (this.state.chartsList || []).map(item =>
                getDefaultLine(this.state.systemConfig, item.instance, this.objects[item.id], I18n.getLanguage()),
            );

            if (
                !this.state.chartsList?.find(item => item.id === selectedId.id && item.instance === selectedId.instance)
            ) {
                lines.push(
                    getDefaultLine(
                        this.state.systemConfig,
                        selectedId.instance,
                        this.objects[selectedId.id],
                        I18n.getLanguage(),
                    ),
                );
            }

            // combine same units together: e.g., if line1 and line2 are in percent => use same yAxis
            if (lines.length > 1) {
                // Find first non-empty
                // ignore all booleans
                const first = lines.find(item => !item.isBoolean);
                if (first) {
                    const iFirst = lines.indexOf(first);
                    // set it to left
                    first.yaxe = 'left';
                    // find all lines with the same unit and place them to the left
                    if (first.unit) {
                        for (let k = iFirst + 1; k < lines.length; k++) {
                            if (lines[k].unit === first.unit) {
                                lines[k].commonYAxis = iFirst;
                            }
                        }
                    }
                    for (let k = iFirst + 1; k < lines.length; k++) {
                        if (lines[k].unit && lines[k].unit !== first.unit) {
                            lines[k].yaxe = 'right';
                            // combine all the following lines to one axis
                            for (let j = k + 1; j < lines.length; j++) {
                                if (lines[k].unit === lines[j].unit && lines[j].commonYAxis === undefined) {
                                    lines[k].commonYAxis = j;
                                }
                            }
                        }
                    }
                }
            }

            const presetData: ChartConfigMore = {
                marks: [],
                l: lines,
                zoom: true,
                hoverDetail: true,
                hoverBackground: loadChartParamS<string>('aggregate', undefined),
                aggregate: loadChartParam<ChartAggregateType>('aggregate', 'minmax'),
                chartType: loadChartParam<ChartType>('chartType', 'auto'),
                live: loadChartParamN('live', 30),
                timeType: loadChartParam<'relative' | 'static'>('timeType', 'relative'),
                aggregateType: loadChartParam<'step' | 'count'>('aggregateType', 'step'),
                aggregateSpan: loadChartParamN('aggregateSpan', 300),
                ticks: loadChartParamS('ticks', ''),
                range: loadChartParam<ChartRangeOptions>('range', 1440),
                relativeEnd: loadChartParam<ChartRelativeEnd>('relativeEnd', 'now'),
                start: loadChartParamS('start', ''),
                end: loadChartParamS('end', ''),
                start_time: loadChartParamS('start_time', ''),
                end_time: loadChartParamS('end_time', ''),
                noBorder: 'noborder',
                noedit: false,
                animation: 0,
                legend: lines.length > 1 ? 'nw' : '',
            };

            App.normalizePreset(presetData);

            await new Promise<void>(resolve => {
                this.setState(
                    {
                        presetData,
                        originalPresetData: '',
                        selectedPresetChanged: false,
                        selectedId,
                    },
                    () => {
                        const hash = `#id=${selectedId.id}&instance=${selectedId.instance.replace(/^system\.adapter\./, '')}`;
                        if (window.location.hash !== hash) {
                            window.location.hash = hash;
                        }
                        resolve();
                    },
                );
            });
        } else if (selectedId) {
            // load preset
            const obj = await this.socket.getObject(selectedId as string);
            if (obj?.native?.data) {
                const hash = `#preset=${selectedId as string}`;
                if (window.location.hash !== hash) {
                    window.location.hash = hash;
                }

                const newState = {
                    presetData: obj.native.data,
                    originalPresetData: JSON.stringify(obj.native.data),
                    selectedPresetChanged: false,
                    selectedId,
                };

                App.normalizePreset(newState.presetData);

                await new Promise<void>(resolve => this.setState(newState, () => resolve()));
            }
        } else {
            await new Promise<void>(resolve => {
                this.setState(
                    {
                        presetData: null,
                        originalPresetData: '',
                        selectedPresetChanged: false,
                        selectedId: null,
                    },

                    () => resolve(),
                );
            });
        }
    }

    discardChangesConfirmDialog(): React.JSX.Element | null {
        return this.state.discardChangesConfirmDialog ? (
            <Dialog
                maxWidth="lg"
                fullWidth
                open={!0}
                key="discardChangesConfirmDialog"
                onClose={() =>
                    this.setState({ discardChangesConfirmDialog: false }, () => this.confirmCB && this.confirmCB(false))
                }
            >
                <DialogTitle>
                    {this.state.discardChangesConfirmDialog === 'chart'
                        ? I18n.t('Are you sure for loading the chart and discard unsaved changes?')
                        : this.state.discardChangesConfirmDialog === 'preset'
                          ? I18n.t('Are you sure for loading the preset and discard unsaved changes?')
                          : I18n.t('Are you sure for closing folder and discard unsaved changes?')}
                </DialogTitle>
                <DialogActions sx={{ ...styles.alignRight, ...styles.buttonsContainer }}>
                    <Button
                        color="grey"
                        variant="outlined"
                        onClick={() =>
                            this.setState(
                                { discardChangesConfirmDialog: false },
                                () => this.confirmCB && this.confirmCB(true),
                            )
                        }
                    >
                        {I18n.t('Load without save')}
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        autoFocus
                        onClick={() =>
                            this.savePreset().then(() =>
                                this.setState(
                                    { discardChangesConfirmDialog: false },
                                    () => this.confirmCB && this.confirmCB(true),
                                ),
                            )
                        }
                        startIcon={<IconSave />}
                    >
                        {I18n.t('Save current preset and load')}
                    </Button>
                    <Button
                        color="grey"
                        variant="contained"
                        onClick={() =>
                            this.setState(
                                { discardChangesConfirmDialog: false },
                                () => this.confirmCB && this.confirmCB(false),
                            )
                        }
                        startIcon={<IconCancel />}
                    >
                        {I18n.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        ) : null;
    }

    renderMain(): React.JSX.Element[] {
        let settingsEditor: React.JSX.Element | null = null;
        let mainChart: React.JSX.Element | null = null;
        if (this.state.presetData && this.state.selectedId && typeof this.state.selectedId === 'string') {
            settingsEditor = (
                <SettingsEditor
                    socket={this.socket}
                    key="Editor"
                    width={window.innerWidth}
                    theme={this.state.theme}
                    onChange={presetData => {
                        if (this.state.autoSave) {
                            this.setState({ presetData }, () => this.savePreset());
                        } else {
                            this.setState({
                                presetData,
                                selectedPresetChanged: JSON.stringify(presetData) !== this.state.originalPresetData,
                            });
                        }
                    }}
                    presetData={this.state.presetData}
                    selectedId={this.state.selectedId}
                    instances={this.state.instances}
                    systemConfig={this.state.systemConfig}
                    selectedPresetChanged={this.state.selectedPresetChanged}
                    savePreset={this.savePreset}
                    autoSave={this.state.autoSave}
                    onAutoSave={autoSave => {
                        window.localStorage.setItem('App.echarts.autoSave', autoSave ? 'true' : 'false');
                        if (autoSave && this.state.selectedPresetChanged) {
                            void this.savePreset().then(() => this.setState({ autoSave }));
                        } else {
                            this.setState({ autoSave });
                        }
                    }}
                    windowWidth={this.state.menuSizes[1]}
                />
            );
        }

        if (this.state.selectedId) {
            mainChart = (
                <MainChart
                    key="MainChart"
                    visible={!this.state.resizing}
                    theme={this.state.theme}
                    onChange={presetData => this.setState({ presetData })}
                    presetData={this.state.presetData}
                    selectedId={this.state.selectedId}
                    onCreatePreset={this.onCreatePreset}
                    windowWidth={this.state.menuSizes[1]}
                />
            );
        }
        let splitter: React.JSX.Element;
        if (mainChart && settingsEditor) {
            splitter = (
                <ReactSplit
                    direction={this.state.logHorzLayout ? SplitDirection.Horizontal : SplitDirection.Vertical}
                    initialSizes={this.state.splitSizes}
                    minWidths={[100, 450]}
                    onResizeStarted={() => this.setState({ resizing: true })}
                    onResizeFinished={(_gutterIdx: number, splitSizes: [number, number]): void => {
                        this.setState({ resizing: false, splitSizes });
                        window.localStorage.setItem('App.echarts.settingsSizes', JSON.stringify(splitSizes));
                    }}
                    // theme={this.props.themeType === 'dark' ? GutterTheme.Dark : GutterTheme.Light}
                    gutterClassName={this.state.themeType === 'dark' ? 'Dark visGutter' : 'Light visGutter'}
                >
                    {mainChart}
                    {settingsEditor}
                </ReactSplit>
            );
        } else {
            splitter = mainChart;
        }

        return [
            <Box
                component="div"
                sx={styles.content}
                className="iobVerticalSplitter"
                key="confirmdialog"
            >
                <Box
                    component="div"
                    key="confirmdiv"
                    sx={styles.menuOpenCloseButton}
                    onClick={() => {
                        window.localStorage.setItem('App.echarts.menuOpened', this.state.menuOpened ? 'false' : 'true');
                        this.setState({ menuOpened: !this.state.menuOpened, resizing: true });
                        setTimeout(() => this.setState({ resizing: false }), 300);
                    }}
                >
                    {this.state.menuOpened ? <IconMenuOpened /> : <IconMenuClosed />}
                </Box>
                {splitter}
            </Box>,
        ];
    }

    onDragEnd = async (result: DropResult): Promise<void> => {
        const { source, destination, draggableId } = result;

        if (destination && draggableId.includes('***') && source.droppableId === 'Lines') {
            // Add new line to preset
            const [instance, stateId] = draggableId.split('***');
            try {
                const obj: ioBroker.StateObject | null | undefined = (await this.socket.getObject(stateId)) as
                    | ioBroker.StateObject
                    | null
                    | undefined;
                // const len = this.state.presetData.lines.length;
                // const color = (obj && obj.common && obj.common.color) || PREDEFINED_COLORS[len % PREDEFINED_COLORS.length];
                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.state.presetData));
                const newLine: ChartLineConfigMore = getDefaultLine(
                    this.state.systemConfig,
                    instance,
                    obj,
                    I18n.getLanguage(),
                );
                // correct commonYAxis
                for (let i = 0; i < presetData.l.length; i++) {
                    if (!presetData.l[i].commonYAxis && presetData.l[i].commonYAxis !== 0) {
                        continue;
                    }
                    if (presetData.l[i].commonYAxis >= destination.index) {
                        presetData.l[i].commonYAxis = presetData.l[i].commonYAxis + 1;
                    }
                }

                // todo inform PresetTabs about change of order of linesOpened

                presetData.l.splice(destination.index, 0, newLine);

                if (presetData.l.length > 1) {
                    // combine new unit with the existing one
                    if (newLine.unit) {
                        for (let i = 0; i < presetData.l.length; i++) {
                            if (newLine !== presetData.l[i] && presetData.l[i].unit === newLine.unit) {
                                newLine.commonYAxis = i;
                                break;
                            }
                        }
                    }
                    if (presetData.l.find(item => item.chartType === 'bar')) {
                        newLine.chartType = 'bar';
                    } else if (presetData.l.find(item => item.chartType === 'polar')) {
                        newLine.chartType = 'polar';
                        newLine.aggregate = 'current';
                    }
                }

                this.setState({
                    presetData,
                    selectedPresetChanged: JSON.stringify(presetData) !== this.state.originalPresetData,
                });
            } catch (e) {
                this.onError(e, 'Cannot read object');
            }
        } else if (destination && source.droppableId === destination.droppableId) {
            // switch lines order in the current preset
            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.state.presetData));

            // correct commonYAxis
            for (let i = 0; i < presetData.l.length; i++) {
                if (!presetData.l[i].commonYAxis && presetData.l[i].commonYAxis !== 0) {
                    continue;
                }
                if (presetData.l[i].commonYAxis === source.index) {
                    presetData.l[i].commonYAxis = destination.index;
                } else if (presetData.l[i].commonYAxis === destination.index) {
                    presetData.l[i].commonYAxis = source.index;
                }
            }

            // todo inform PresetTabs about change of order of linesOpened

            const [removed] = presetData.l.splice(source.index, 1);
            presetData.l.splice(destination.index, 0, removed);
            this.setState({
                presetData,
                selectedPresetChanged: JSON.stringify(presetData) !== this.state.originalPresetData,
            });
        }
    };

    renderMenu(): React.JSX.Element {
        return (
            <MenuList
                key="menuList"
                scrollToSelect={this.state.scrollToSelect}
                socket={this.socket}
                theme={this.state.theme}
                adapterName={this.adapterName}
                instances={this.state.instances}
                systemConfig={this.state.systemConfig}
                onShowToast={(toast: string): void => this.showToast(toast)}
                selectedPresetChanged={this.state.selectedPresetChanged}
                chartsList={this.state.chartsList}
                selectedId={this.state.selectedId}
                onCopyPreset={this.onCopyPreset}
                onCreatePreset={this.onCreatePreset}
                onChangeList={(chartsList: { id: string; instance: string }[]): void => {
                    // if some deselected
                    let selectedId = this.state.selectedId;
                    if (
                        chartsList &&
                        this.state.chartsList &&
                        chartsList.length &&
                        chartsList.length < this.state.chartsList.length
                    ) {
                        const removedLine = this.state.chartsList.find(
                            item => !chartsList.find(it => it.id === item.id && it.instance === item.instance),
                        );
                        const index = this.state.chartsList.indexOf(removedLine);
                        if (this.state.chartsList[index + 1]) {
                            selectedId = this.state.chartsList[index + 1];
                        } else if (this.state.chartsList[index - 1]) {
                            selectedId = this.state.chartsList[index - 1];
                        } else {
                            selectedId = chartsList[0];
                        }
                    }
                    this.setState({ chartsList }, () => this.loadChartOrPreset(selectedId));
                }}
                onSelectedChanged={(
                    selectedId: SelectedChart | null,
                    cb?: (presetId: false | SelectedChart) => void,
                ): void => {
                    if (this.state.selectedPresetChanged) {
                        this.confirmCB = (confirmed: boolean): void => {
                            if (confirmed) {
                                void this.loadChartOrPreset(selectedId).then(() => cb && cb(selectedId));
                            } else {
                                cb && cb(false); // cancel
                            }
                            this.confirmCB = null;
                        };

                        this.setState({
                            discardChangesConfirmDialog:
                                selectedId && typeof selectedId === 'object'
                                    ? 'chart'
                                    : selectedId
                                      ? 'preset'
                                      : 'folder',
                        });
                    } else {
                        void this.loadChartOrPreset(selectedId);
                    }
                }}
            />
        );
    }

    render(): React.JSX.Element {
        if (!this.state.ready) {
            return (
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <Loader themeType={this.state.themeType} />
                    </ThemeProvider>
                </StyledEngineProvider>
            );
        }

        let splitter: React.JSX.Element | React.JSX.Element[];
        if (this.state.menuOpened) {
            splitter = (
                // @ts-expect-error idk
                <DragDropContext onDragEnd={this.onDragEnd}>
                    <ReactSplit
                        direction={SplitDirection.Horizontal}
                        initialSizes={this.state.menuSizes}
                        minWidths={[307, 300]}
                        onResizeStarted={() => this.setState({ resizing: true })}
                        onResizeFinished={(_gutterIdx: number, menuSizes: [number, number]): void => {
                            this.setState({ resizing: false, menuSizes: [menuSizes[0], 100 - menuSizes[0]] });
                            window.localStorage.setItem('App.echarts.menuSizes', JSON.stringify(menuSizes));
                        }}
                        gutterClassName={this.state.themeType === 'dark' ? 'Dark visGutter' : 'Light visGutter'}
                    >
                        {this.renderMenu()}
                        {this.renderMain()}
                    </ReactSplit>
                </DragDropContext>
            );
        } else {
            splitter = splitter = (
                // @ts-expect-error idk
                <DragDropContext onDragEnd={this.onDragEnd}>{this.renderMain()}</DragDropContext>
            );
        }

        return (
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <Box sx={styles.root}>{splitter}</Box>
                    {this.discardChangesConfirmDialog()}
                    {this.renderError()}
                    {this.renderToast()}
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}

export default withWidth()(App);
