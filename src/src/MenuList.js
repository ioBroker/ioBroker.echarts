import React, {Component} from "react";
import PropTypes from 'prop-types';
import withWidth from "@material-ui/core/withWidth";
import {withStyles, withTheme} from "@material-ui/core/styles";

import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Toolbar from '@material-ui/core/Toolbar';

// icons
import {MdAdd as IconAdd} from 'react-icons/md';
import {RiFolderAddLine as IconFolderAdd} from 'react-icons/ri';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Close';

import I18n from '@iobroker/adapter-react/i18n';
import PresetsTree from './Components/PresetsTree';
import ChartsTree from "./Components/ChartsTree";

const styles = theme => ({
    mainToolbar: {
        background: theme.palette.primary.main,
    },
    heightMinusToolbar: {
        height: 'calc(100% - 38px)',
        overflow: 'auto'
    },
});

class MenuList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            search: null,
            showSearch: null,
            addPresetFolderDialog: false,
            addPresetDialog: false,
        };
    }

    renderListToolbar() {
        return <Toolbar key="toolbar" variant="dense" className={ this.props.classes.mainToolbar }>
            <IconButton
                onClick={ () => this.setState({addPresetDialog: true}) }
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

    render() {
        return <div className={this.props.classes.mainListDiv} key="mainMenuDiv">
            {this.renderListToolbar()}
            <div className={ this.props.classes.heightMinusToolbar }>
                <PresetsTree
                    socket={this.props.socket}
                    addPresetFolderDialog={this.state.addPresetFolderDialog}
                    addPresetDialog={this.state.addPresetDialog}
                    onAddDialogDone={() => (this.state.addPresetFolderDialog || this.state.addPresetDialog) && this.setState({addPresetFolderDialog: false, addPresetDialog: false})}
                    adapterName={this.props.adapterName}
                    selectedPresetChanged={this.state.selectedPresetChanged}
                    onShowToast={toast => this.props.onShowToast(toast)}
                    onShowError={toast => this.props.onShowToast(toast)}
                    systemConfig={this.props.systemConfig}
                    onSelectedChanged={(selectedId, cb) => this.props.onSelectedChanged(selectedId, cb)}
                />
                <ChartsTree
                    socket={this.props.socket}
                    instances={this.props.instances}
                    adapterName={this.props.adapterName}
                    onShowToast={toast => this.props.onShowToast(toast)}
                    onShowError={toast => this.props.onShowToast(toast)}
                    theme={this.props.theme}
                    onSelectedChanged={(selectedId, cb) => this.props.onSelectedChanged(selectedId, cb)}
                />
            </div>
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
    selectedPresetChanged: PropTypes.bool,
};

export default withWidth()(withStyles(styles)(withTheme(MenuList)));
