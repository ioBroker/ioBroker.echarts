import React, {Component} from 'react';
import PropTypes from 'prop-types';
import withWidth from '@material-ui/core/withWidth';
import {withStyles, withTheme} from '@material-ui/core/styles';

import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Toolbar from '@material-ui/core/Toolbar';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
// icons
import {MdAdd as IconAdd} from 'react-icons/md';
import {MdCreateNewFolder as IconFolderAdd} from 'react-icons/md';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Close';
import {MdFullscreen as IconNewWindow} from 'react-icons/md';
import {MdSwapVert as IconReorder} from 'react-icons/md';

import I18n from '@iobroker/adapter-react/i18n';
import PresetsTree from './Components/PresetsTree';
import ChartsTree from './Components/ChartsTree';


const TOOLBAR_HEIGHT = 48;

const styles = theme => ({
    mainListDiv: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    mainToolbar: {
        background: theme.palette.primary.main,
    },
    secondaryColors: {
        background: '#888',
        color: theme.palette.type === 'dark' ? '#000' : '#FFF',
    },
    smallMargin: {
        marginTop: '8px !important',
    },
    heightMinusToolbar: {
        height: 'calc(100% - ' + (TOOLBAR_HEIGHT * 2) + 'px)',
        overflow: 'auto'
    },
});

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
        return <Toolbar key="toolbar" variant="dense" className={ this.props.classes.mainToolbar }>
            {!this.state.reorder ? <IconButton
                onClick={ () => this.props.onCreatePreset(false) }
                title={ I18n.t('Create new preset') }
            ><IconAdd/></IconButton> : null}

            {!this.state.reorder ? <IconButton
                onClick={ () => this.setState({addPresetFolderDialog: true}) }
                title={ I18n.t('Create new folder') }
            ><IconFolderAdd/></IconButton> : null}

            {!this.state.reorder ? <span className={this.props.classes.right}>
                <IconButton onClick={() => this.setState({showSearch: !this.state.showSearch, search: ''})}>
                    <SearchIcon/>
                </IconButton>
            </span> : null}

            {this.state.showSearch ?
                <TextField
                    value={ this.state.search }
                    className={ this.props.classes.textInput }
                    onChange={ e => this.setState({search: e.target.value}) }
                    InputProps={{
                        endAdornment: this.state.search ?
                            <IconButton
                                onClick={() => this.setState({ search: '' })}>
                                <ClearIcon />
                            </IconButton>
                            : undefined,
                    }}
                /> : null
            }
            <div style={{flexGrow: 1}}/>

            {(!this.state.showSearch && this.state.showReorder) || this.state.reorder ? <IconButton
                key="reorder"
                title={I18n.t('Reorder presets in folders')}
                className={this.props.classes.toolbarButtons}
                style={{color: this.state.reorder ? 'red' : 'inherit', float: 'right'}}
                onClick={e => {
                    e.stopPropagation();
                    this.setState({reorder: !this.state.reorder});
                }}
            ><IconReorder/></IconButton> : null }

            {!this.state.showSearch && this.isIFrame ? <IconButton
                onClick={ () => window.open(window.location.href, 'own-echarts') }
                title={ I18n.t('Open in own window') }
                ><IconNewWindow/></IconButton> : null
            }
        </Toolbar>;
    }

    renderFooter() {
        return <Toolbar key="toolbarBottom" variant="dense" className={ this.props.classes.secondaryColors }>
            <FormGroup row>
                {!this.props.selectedPresetChanged ? <FormControlLabel
                    classes={{root: this.props.secondaryColors}}
                    control={<Switch
                        checked={this.state.multiple}
                        classes={{root: this.props.secondaryColors}}
                        onChange={e => {
                        window.localStorage.setItem('App.echarts.multiple', e.target.checked ? 'true' : 'false');
                        if (e.target.checked) {
                            const selectedId = this.props.selectedId;
                            if (selectedId && typeof selectedId === 'object') {
                                this.setState({multiple: true}, () => this.props.onChangeList([JSON.parse(JSON.stringify(selectedId))]));
                            } else {
                                this.setState({multiple: true}, () => this.props.onChangeList([]));
                            }
                        } else {
                            this.setState({multiple: false}, () => this.props.onChangeList(null));
                        }
                    }} />}
                    label={I18n.t('Multiple')}
                /> : null}
                <FormControl>
                    <InputLabel shrink={true} style={{whiteSpace: 'nowrap'}}>{I18n.t('Group by') }</InputLabel>
                    <Select
                        label={I18n.t('Group by')}
                        onChange={e => {
                            window.localStorage.setItem('App.echarts.groupBy', e.target.value);
                            this.setState({groupBy: e.target.value});
                        }}
                        value={this.state.groupBy || ''}
                        className={this.props.classes.smallMargin}
                        displayEmpty
                    >
                        <MenuItem value="">{I18n.t('None')}</MenuItem>
                        <MenuItem value="rooms">{I18n.t('Rooms')}</MenuItem>
                        <MenuItem value="functions">{I18n.t('Functions')}</MenuItem>
                    </Select>
                </FormControl>
            </FormGroup>
        </Toolbar>;
    }

    render() {
        return <div className={this.props.classes.mainListDiv} key="mainMenuDiv">
            {this.renderListToolbar()}
            <div className={ this.props.classes.heightMinusToolbar }>
                <PresetsTree
                    socket={this.props.socket}
                    addPresetFolderDialog={this.state.addPresetFolderDialog}
                    onClosePresetFolderDialog={cb => this.setState({addPresetFolderDialog: false}, cb)}
                    onCreatePreset={(isFromCurrentSelection, parent) => this.props.onCreatePreset(isFromCurrentSelection, parent)}
                    onCopyPreset={id => this.props.onCopyPreset(id)}
                    adapterName={this.props.adapterName}
                    selectedPresetChanged={this.props.selectedPresetChanged}
                    onShowToast={toast => this.props.onShowToast(toast)}
                    onShowError={toast => this.props.onShowToast(toast)}
                    onShowReorder={showReorder => {
                        if (showReorder !== this.props.showReorder) {
                            this.setState({showReorder});
                        }
                    }}
                    search={this.state.search}
                    reorder={this.state.reorder}
                    selectedId={this.props.selectedId}
                    systemConfig={this.props.systemConfig}
                    onSelectedChanged={(selectedId, cb) => this.props.onSelectedChanged(selectedId, cb)}
                />
                {!this.state.reorder ?
                    <ChartsTree
                        socket={this.props.socket}
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
    onChange: PropTypes.func,
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
    selectedId: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string
    ]),
    selectedPresetChanged: PropTypes.bool,
};

export default withWidth()(withStyles(styles)(withTheme(MenuList)));
