import React, { Component } from 'react';

import { IconButton, TextField, Toolbar, InputLabel, Select, MenuItem, FormControl } from '@mui/material';

// icons
import {
    MdAdd as IconAdd,
    MdCreateNewFolder as IconFolderAdd,
    MdFullscreen as IconNewWindow,
    MdSwapVert as IconReorder,
} from 'react-icons/md';
import { Search as SearchIcon, Close as ClearIcon, Preview as PreviewIcon } from '@mui/icons-material';

import { type AdminConnection, I18n, type IobTheme, withWidth } from '@iobroker/adapter-react-v5';

import PresetsTree from './Components/PresetsTree';
import ChartsTree from './Components/ChartsTree';
import Switch from './Components/Switch';
import type { ChartConfigMore } from '../../src/types';

const TOOLBAR_HEIGHT = 48;

const styles: Record<string, any> = {
    mainListDiv: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    mainToolbar: (theme: IobTheme): React.CSSProperties => ({
        background: theme.palette.primary.main,
    }),
    secondaryColors: (theme: IobTheme): React.CSSProperties => ({
        background: '#888',
        color: theme.palette.mode === 'dark' ? '#000' : '#FFF',
    }),
    smallMargin: {
        marginTop: '8px !important',
    },
    heightMinusTwoToolbars: {
        height: `calc(100% - ${TOOLBAR_HEIGHT * 2}px)`,
        overflow: 'auto',
    },
    heightMinusToolbar: {
        height: `calc(100% - ${TOOLBAR_HEIGHT}px)`,
        overflow: 'auto',
    },
    textColor: (theme: IobTheme): React.CSSProperties => ({
        color: theme.palette.mode === 'dark' ? '#000 !important' : '#FFF !important',
    }),
};

interface MenuListProps {
    socket: AdminConnection;
    instances: ioBroker.InstanceObject[];
    adapterName: string;
    theme: IobTheme;
    onSelectedChanged: (selectedId: string | null, cb?: (presetId: false | string) => void) => void;
    onShowToast: (text: string) => void;
    systemConfig: ioBroker.SystemConfigObject;
    onChangeList: (changedIds: { id: string; instance: string }[]) => void;
    chartsList: { id: string; instance: string }[];
    onCreatePreset: (isFromCurrentSelection: boolean, parent?: string) => void;
    onCopyPreset: (copyId: string) => void;
    scrollToSelect: boolean;
    selectedId: string | ChartConfigMore;
    selectedPresetChanged: boolean;
    showReorder: boolean;
}

interface MenuListState {
    multiple: boolean;
    search: string | null;
    showSearch: boolean;
    groupBy: 'rooms' | 'functions' | '';
    addPresetFolderDialog: boolean;
    reorder: boolean;
    showReorder: boolean;
}

class MenuList extends Component<MenuListProps, MenuListState> {
    private readonly isIFrame: boolean;

    constructor(props: MenuListProps) {
        super(props);

        this.state = {
            search: null,
            multiple: window.localStorage.getItem('App.echarts.multiple') === 'true',
            showSearch: false,
            groupBy: (window.localStorage.getItem('App.echarts.groupBy') as 'rooms' | 'functions' | '') || '',
            addPresetFolderDialog: false,
            reorder: false,
            showReorder: false,
        };

        try {
            this.isIFrame = window.self !== window.top;
        } catch {
            this.isIFrame = true;
        }

        if (this.state.multiple) {
            const chartListStr = window.localStorage.getItem('App.echarts.chartList') || '[]';
            let chartList: { id: string; instance: string }[];
            try {
                chartList = JSON.parse(chartListStr);
            } catch {
                chartList = [];
            }
            setTimeout(() => this.props.onChangeList(chartList), 100);
        }
    }

    renderListToolbar(): React.JSX.Element {
        return (
            <Toolbar
                key="toolbar"
                variant="dense"
                sx={styles.mainToolbar}
            >
                {!this.state.reorder ? (
                    <IconButton
                        onClick={() => this.props.onCreatePreset(false)}
                        title={I18n.t('Create new preset')}
                    >
                        <IconAdd />
                    </IconButton>
                ) : null}

                {!this.state.reorder ? (
                    <IconButton
                        onClick={() => this.setState({ addPresetFolderDialog: true })}
                        title={I18n.t('Create new folder')}
                    >
                        <IconFolderAdd />
                    </IconButton>
                ) : null}

                {!this.state.reorder ? (
                    <span style={styles.right}>
                        <IconButton onClick={() => this.setState({ showSearch: !this.state.showSearch, search: '' })}>
                            <SearchIcon />
                        </IconButton>
                    </span>
                ) : null}

                {this.state.showSearch ? (
                    <TextField
                        variant="standard"
                        value={this.state.search}
                        style={styles.textInput}
                        onChange={e => this.setState({ search: e.target.value })}
                        InputProps={{
                            endAdornment: this.state.search ? (
                                <IconButton onClick={() => this.setState({ search: '' })}>
                                    <ClearIcon />
                                </IconButton>
                            ) : undefined,
                        }}
                    />
                ) : null}
                <div style={{ flexGrow: 1 }} />

                {(!this.state.showSearch && this.state.showReorder) || this.state.reorder ? (
                    <IconButton
                        key="reorder"
                        title={I18n.t('Reorder presets in folders')}
                        style={{ color: this.state.reorder ? 'red' : 'inherit', float: 'right' }}
                        onClick={e => {
                            e.stopPropagation();
                            this.setState({ reorder: !this.state.reorder });
                        }}
                    >
                        <IconReorder />
                    </IconButton>
                ) : null}

                {!this.state.showSearch && this.isIFrame ? (
                    <IconButton
                        onClick={() => window.open(window.location.href, 'own-echarts')}
                        title={I18n.t('Open in own window')}
                    >
                        <IconNewWindow />
                    </IconButton>
                ) : null}
            </Toolbar>
        );
    }

    renderFooter(): React.JSX.Element {
        return (
            <Toolbar
                key="toolbarBottom"
                variant="dense"
                sx={styles.secondaryColors}
                style={{ gap: 8 }}
            >
                {!this.props.selectedPresetChanged ? (
                    <Switch
                        style={{ width: 58 }}
                        checked={this.state.multiple}
                        theme={this.props.theme}
                        onChange={(checked: boolean): void => {
                            window.localStorage.setItem('App.echarts.multiple', checked ? 'true' : 'false');
                            if (checked) {
                                const selectedId = this.props.selectedId;
                                if (selectedId && typeof selectedId === 'object') {
                                    this.setState({ multiple: true }, () =>
                                        this.props.onChangeList([JSON.parse(JSON.stringify(selectedId))]),
                                    );
                                } else {
                                    this.setState({ multiple: true }, () => this.props.onChangeList([]));
                                }
                            } else {
                                this.setState({ multiple: false }, () => this.props.onChangeList(null));
                            }
                        }}
                        labelOn={I18n.t('Multiple')}
                    />
                ) : /*<FormControlLabel
                        control={
                            <Switch
                                checked={this.state.multiple}
                                onChange={e => {
                                    window.localStorage.setItem(
                                        'App.echarts.multiple',
                                        e.target.checked ? 'true' : 'false',
                                    );
                                    if (e.target.checked) {
                                        const selectedId = this.props.selectedId;
                                        if (selectedId && typeof selectedId === 'object') {
                                            this.setState({ multiple: true }, () =>
                                                this.props.onChangeList([JSON.parse(JSON.stringify(selectedId))]),
                                            );
                                        } else {
                                            this.setState({ multiple: true }, () => this.props.onChangeList([]));
                                        }
                                    } else {
                                        this.setState({ multiple: false }, () => this.props.onChangeList(null));
                                    }
                                }}
                            />
                        }
                        label={I18n.t('Multiple')}
                    />*/
                null}
                <FormControl
                    variant="standard"
                    style={{ minWidth: 100 }}
                    sx={styles.textColor}
                >
                    <InputLabel
                        shrink
                        sx={styles.textColor}
                        style={{ whiteSpace: 'nowrap', top: 5 }}
                    >
                        {I18n.t('Group by')}
                    </InputLabel>
                    <Select
                        variant="standard"
                        label={I18n.t('Group by')}
                        sx={styles.textColor}
                        onChange={e => {
                            window.localStorage.setItem('App.echarts.groupBy', e.target.value);
                            this.setState({ groupBy: e.target.value as '' | 'rooms' | 'functions' });
                        }}
                        value={this.state.groupBy || ''}
                        style={styles.smallMargin}
                        displayEmpty
                    >
                        <MenuItem value="">{I18n.t('None')}</MenuItem>
                        <MenuItem value="rooms">{I18n.t('Rooms')}</MenuItem>
                        <MenuItem value="functions">{I18n.t('Functions')}</MenuItem>
                    </Select>
                </FormControl>
                <div style={{ flex: 1 }} />
                <IconButton
                    size="small"
                    sx={styles.textColor}
                    title={I18n.t('Charts preview')}
                    onClick={() => {
                        const parts = window.location.pathname.split('/');
                        parts.pop();
                        parts.push('preview/index.html');
                        window.location.href = `${window.location.protocol}//${window.location.host}${parts.join('/')}`;
                    }}
                >
                    <PreviewIcon />
                </IconButton>
            </Toolbar>
        );
    }

    render(): React.JSX.Element {
        return (
            <div
                style={styles.mainListDiv}
                key="mainMenuDiv"
            >
                {this.renderListToolbar()}
                <div style={this.state.reorder ? styles.heightMinusToolbar : styles.heightMinusTwoToolbars}>
                    <PresetsTree
                        socket={this.props.socket}
                        scrollToSelect={this.props.scrollToSelect}
                        addPresetFolderDialog={this.state.addPresetFolderDialog}
                        onClosePresetFolderDialog={(cb: () => void): void =>
                            this.setState({ addPresetFolderDialog: false }, cb)
                        }
                        onCreatePreset={(isFromCurrentSelection: boolean, parentId?: string): void =>
                            this.props.onCreatePreset(isFromCurrentSelection, parentId)
                        }
                        onCopyPreset={(id: string): void => this.props.onCopyPreset(id)}
                        adapterName={this.props.adapterName}
                        selectedPresetChanged={this.props.selectedPresetChanged}
                        onShowToast={(toast: string): void => this.props.onShowToast(toast)}
                        onShowError={(toast: string): void => this.props.onShowToast(toast)}
                        onShowReorder={(showReorder: boolean): void => {
                            if (showReorder !== this.props.showReorder) {
                                this.setState({ showReorder });
                            }
                        }}
                        theme={this.props.theme}
                        search={this.state.search}
                        reorder={this.state.reorder}
                        selectedId={this.props.selectedId}
                        systemConfig={this.props.systemConfig}
                        onSelectedChanged={(selectedId: string, cb?: (presetId: false | string) => void): void =>
                            this.props.onSelectedChanged(selectedId, cb)
                        }
                    />
                    {!this.state.reorder ? (
                        <ChartsTree
                            socket={this.props.socket}
                            scrollToSelect={this.props.scrollToSelect}
                            instances={this.props.instances}
                            adapterName={this.props.adapterName}
                            onShowToast={(toast: string): void => this.props.onShowToast(toast)}
                            onShowError={(toast: string): void => this.props.onShowToast(toast)}
                            search={this.state.search}
                            multiple={this.state.multiple && !this.props.selectedPresetChanged}
                            theme={this.props.theme}
                            groupBy={this.state.groupBy}
                            selectedId={this.props.selectedId}
                            onChangeList={(chartList: { id: string; instance: string }[]): void => {
                                window.localStorage.setItem('App.echarts.chartList', JSON.stringify(chartList));
                                this.props.onChangeList(chartList);
                            }}
                            chartsList={this.props.chartsList}
                            onSelectedChanged={(selectedId: string | null, cb?: () => void) =>
                                this.props.onSelectedChanged(selectedId, cb)
                            }
                        />
                    ) : null}
                </div>
                {!this.state.reorder ? this.renderFooter() : null}
            </div>
        );
    }
}

// @ts-expect-error idk
export default withWidth()(MenuList);
