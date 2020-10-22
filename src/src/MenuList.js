import React, {Component} from "react";
import PropTypes from 'prop-types';
import withWidth from "@material-ui/core/withWidth";
import {withStyles, withTheme} from "@material-ui/core/styles";

import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Toolbar from '@material-ui/core/Toolbar';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

// icons
import {MdAdd as IconAdd} from 'react-icons/md';
import {RiFolderAddLine as IconFolderAdd} from 'react-icons/ri';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Close';

import I18n from '@iobroker/adapter-react/i18n';
import PresetsTree from './Components/PresetsTree';
import ChartsTree from "./Components/ChartsTree";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";

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
    secondaryToolbar: {
        background: '#888',
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
        };
    }

    renderListToolbar() {
        return <Toolbar key="toolbar" variant="dense" className={ this.props.classes.mainToolbar }>
            <IconButton
                onClick={ () => this.props.onCreatePreset(false) }
                title={ I18n.t('Create new preset') }
            ><IconAdd/></IconButton>

            <IconButton
                onClick={ () => this.setState({addPresetFolderDialog: true}) }
                title={ I18n.t('Create new folder') }
            ><IconFolderAdd/></IconButton>

            <span className={this.props.classes.right}>
                <IconButton onClick={() => this.setState({showSearch: !this.state.showSearch, search: ''})}>
                    <SearchIcon/>
                </IconButton>
            </span>
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
        </Toolbar>;
    }

    renderFooter() {
        return <Toolbar key="toolbarBottom" variant="dense" className={ this.props.classes.secondaryToolbar }>
            <FormGroup row>
                {!this.props.selectedPresetChanged ? <FormControlLabel
                    control={<Switch checked={this.state.multiple} onChange={e => {
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
                    onCreatePreset={this.props.onCreatePreset}
                    adapterName={this.props.adapterName}
                    selectedPresetChanged={this.state.selectedPresetChanged}
                    onShowToast={toast => this.props.onShowToast(toast)}
                    onShowError={toast => this.props.onShowToast(toast)}
                    search={this.state.search}
                    selectedId={this.props.selectedId}
                    systemConfig={this.props.systemConfig}
                    onSelectedChanged={(selectedId, cb) => this.props.onSelectedChanged(selectedId, cb)}
                />
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
                    onChangeList={this.props.onChangeList}
                    chartsList={this.props.chartsList}
                    onSelectedChanged={(selectedId, cb) => this.props.onSelectedChanged(selectedId, cb)}
                />
            </div>
            {this.renderFooter()}
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
    selectedId: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string
    ]),
    selectedPresetChanged: PropTypes.bool,
};

export default withWidth()(withStyles(styles)(withTheme(MenuList)));
