import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
    IconButton,
    TextField,
    Toolbar,
    FormGroup,
    FormControlLabel,
    Switch,
    InputLabel,
    Select,
    MenuItem,
    FormControl,
} from '@mui/material';

// icons
import {
    MdAdd as IconAdd,
    MdCreateNewFolder as IconFolderAdd,
    MdFullscreen as IconNewWindow,
    MdSwapVert as IconReorder,
} from 'react-icons/md';
import {
    Search as SearchIcon,
    Close as ClearIcon,
    Preview as PreviewIcon,
} from '@mui/icons-material';

import { I18n, withWidth } from '@iobroker/adapter-react-v5';

import PresetsTree from './Components/PresetsTree';
import ChartsTree from './Components/ChartsTree';

const TOOLBAR_HEIGHT = 48;

const styles = {
    mainListDiv: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    mainToolbar: theme => ({
        background: theme.palette.primary.main,
    }),
    secondaryColors: theme => ({
        background: '#888',
        color: theme.palette.mode === 'dark' ? '#000' : '#FFF',
    }),
    smallMargin: {
        marginTop: '8px !important',
    },
    heightMinusToolbar: {
        height: `calc(100% - ${TOOLBAR_HEIGHT * 2}px)`,
        overflow: 'auto',
    },
};

class MenuList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            search: null,
            multiple: window.localStorage.getItem('App.echarts.multiple') === 'true',
            showSearch: null,
            groupBy: window.localStorage.getItem('App.echarts.groupBy') || '',
            addPresetFolderDialog: false,
            reorder: false,
            showReorder: false,
        };

        try {
            this.isIFrame = window.self !== window.top;
        } catch (e) {
            this.isIFrame = true;
        }

        if (this.state.multiple) {
            let chartList = window.localStorage.getItem('App.echarts.chartList') || '[]';
            try {
                chartList = JSON.parse(chartList);
            } catch (e) {
                chartList = [];
            }
            setTimeout(() => this.props.onChangeList(chartList), 100);
        }
    }

    renderListToolbar() {
        return <Toolbar key="toolbar" variant="dense" sx={styles.mainToolbar}>
            {!this.state.reorder ? <IconButton
                onClick={() => this.props.onCreatePreset(false)}
                title={I18n.t('Create new preset')}
            >
                <IconAdd />
            </IconButton> : null}

            {!this.state.reorder ? <IconButton
                onClick={() => this.setState({ addPresetFolderDialog: true })}
                title={I18n.t('Create new folder')}
            >
                <IconFolderAdd />
            </IconButton> : null}

            {!this.state.reorder ? <span style={styles.right}>
                <IconButton onClick={() => this.setState({ showSearch: !this.state.showSearch, search: '' })}>
                    <SearchIcon />
                </IconButton>
            </span> : null}

            {this.state.showSearch ?
                <TextField
                    variant="standard"
                    value={this.state.search}
                    style={styles.textInput}
                    onChange={e => this.setState({ search: e.target.value })}
                    InputProps={{
                        endAdornment: this.state.search ?
                            <IconButton
                                onClick={() => this.setState({ search: '' })}
                            >
                                <ClearIcon />
                            </IconButton>
                            : undefined,
                    }}
                /> : null}
            <div style={{ flexGrow: 1 }} />

            {(!this.state.showSearch && this.state.showReorder) || this.state.reorder ? <IconButton
                key="reorder"
                title={I18n.t('Reorder presets in folders')}
                style={{ color: this.state.reorder ? 'red' : 'inherit', float: 'right' }}
                onClick={e => {
                    e.stopPropagation();
                    this.setState({ reorder: !this.state.reorder });
                }}
            >
                <IconReorder />
            </IconButton> : null}

            {!this.state.showSearch && this.isIFrame ? <IconButton
                onClick={() => window.open(window.location.href, 'own-echarts')}
                title={I18n.t('Open in own window')}
            >
                <IconNewWindow />
            </IconButton> : null}
        </Toolbar>;
    }

    renderFooter() {
        return <Toolbar key="toolbarBottom" variant="dense" sx={styles.secondaryColors}>
            <FormGroup row>
                {!this.props.selectedPresetChanged ? <FormControlLabel
                    control={<Switch
                        checked={this.state.multiple}
                        onChange={e => {
                            window.localStorage.setItem('App.echarts.multiple', e.target.checked ? 'true' : 'false');
                            if (e.target.checked) {
                                const selectedId = this.props.selectedId;
                                if (selectedId && typeof selectedId === 'object') {
                                    this.setState({ multiple: true }, () => this.props.onChangeList([JSON.parse(JSON.stringify(selectedId))]));
                                } else {
                                    this.setState({ multiple: true }, () => this.props.onChangeList([]));
                                }
                            } else {
                                this.setState({ multiple: false }, () => this.props.onChangeList(null));
                            }
                        }}
                    />}
                    label={I18n.t('Multiple')}
                /> : null}
                <FormControl variant="standard">
                    <InputLabel shrink style={{ whiteSpace: 'nowrap' }}>{I18n.t('Group by') }</InputLabel>
                    <Select
                        variant="standard"
                        label={I18n.t('Group by')}
                        onChange={e => {
                            window.localStorage.setItem('App.echarts.groupBy', e.target.value);
                            this.setState({ groupBy: e.target.value });
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
            </FormGroup>
            <div style={{ flex: 1 }} />
            <IconButton
                size="small"
                title={I18n.t('Charts preview')}
                onClick={() => {
                    const parts = window.location.pathname.split('/');
                    parts.pop();
                    parts.push('preview/index.html');
                    window.location = `${window.location.protocol}//${window.location.host}${parts.join('/')}`;
                }}
            >
                <PreviewIcon />
            </IconButton>
        </Toolbar>;
    }

    render() {
        return <div style={styles.mainListDiv} key="mainMenuDiv">
            {this.renderListToolbar()}
            <div style={styles.heightMinusToolbar}>
                <PresetsTree
                    socket={this.props.socket}
                    scrollToSelect={this.props.scrollToSelect}
                    addPresetFolderDialog={this.state.addPresetFolderDialog}
                    onClosePresetFolderDialog={cb => this.setState({ addPresetFolderDialog: false }, cb)}
                    onCreatePreset={(isFromCurrentSelection, parent) => this.props.onCreatePreset(isFromCurrentSelection, parent)}
                    onCopyPreset={id => this.props.onCopyPreset(id)}
                    adapterName={this.props.adapterName}
                    selectedPresetChanged={this.props.selectedPresetChanged}
                    onShowToast={toast => this.props.onShowToast(toast)}
                    onShowError={toast => this.props.onShowToast(toast)}
                    onShowReorder={showReorder => {
                        if (showReorder !== this.props.showReorder) {
                            this.setState({ showReorder });
                        }
                    }}
                    theme={this.props.theme}
                    search={this.state.search}
                    reorder={this.state.reorder}
                    selectedId={this.props.selectedId}
                    systemConfig={this.props.systemConfig}
                    onSelectedChanged={(selectedId, cb) => this.props.onSelectedChanged(selectedId, cb)}
                />
                {!this.state.reorder ?
                    <ChartsTree
                        socket={this.props.socket}
                        scrollToSelect={this.props.scrollToSelect}
                        instances={this.props.instances}
                        adapterName={this.props.adapterName}
                        onShowToast={toast => this.props.onShowToast(toast)}
                        onShowError={toast => this.props.onShowToast(toast)}
                        search={this.state.search}
                        multiple={this.state.multiple && !this.props.selectedPresetChanged}
                        theme={this.props.theme}
                        groupBy={this.state.groupBy}
                        selectedId={this.props.selectedId}
                        onChangeList={chartList => {
                            window.localStorage.setItem('App.echarts.chartList', JSON.stringify(chartList));
                            this.props.onChangeList(chartList);
                        }}
                        chartsList={this.props.chartsList}
                        onSelectedChanged={(selectedId, cb) => this.props.onSelectedChanged(selectedId, cb)}
                    /> : null }
            </div>
            {!this.state.reorder ? this.renderFooter() : null}
        </div>;
    }
}

MenuList.propTypes = {
    socket: PropTypes.object,
    instances: PropTypes.array,
    adapterName: PropTypes.string.isRequired,
    theme: PropTypes.object,
    onSelectedChanged: PropTypes.func.isRequired,
    onShowToast: PropTypes.func.isRequired,
    systemConfig: PropTypes.object,
    onChangeList: PropTypes.func,
    chartsList: PropTypes.array,
    onCreatePreset: PropTypes.func,
    onCopyPreset: PropTypes.func,
    scrollToSelect: PropTypes.bool,
    selectedId: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
    ]),
    selectedPresetChanged: PropTypes.bool,
};

export default withWidth()(MenuList);
