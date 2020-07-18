import React from 'react';
import PropTypes from 'prop-types';

import IconButton from '@material-ui/core/IconButton';

import I18n from '@iobroker/adapter-react/i18n';
import {withStyles} from '@material-ui/core/styles/index';

import PresetTabs from './Components/PresetTabs';

// replace later with MdHorizontalSplit and MdVerticalSplit
const IconVerticalSplit   = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgAQMAAADYVuV7AAAABlBMVEUAAAAzMzPI8eYgAAAAAXRSTlMAQObYZgAAACFJREFUeAFjAIJRwP////8PYIKWHCigNQdKj/pn1D+jAABTG16wVQqVpQAAAABJRU5ErkJggg==';
const IconHorizontalSplit = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgAQMAAADYVuV7AAAABlBMVEUAAAAzMzPI8eYgAAAAAXRSTlMAQObYZgAAABtJREFUeAFjAIJRwP8fCj7QkENn/4z6Z5QzCgBjbWaoyx1PqQAAAABJRU5ErkJggg==';

const TOOLBOX_WIDTH = 0;//34;

const styles = theme => ({
    logBox: {
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
    },
    logBoxInner: {
        color: theme.palette.type === 'dark' ? 'white' : 'black',
        width: `calc(100% - ${TOOLBOX_WIDTH}px)`,
        height: '100%',
        marginLeft: TOOLBOX_WIDTH,
        overflow: 'none',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
    },
    toolbox: {
        position: 'absolute',
        top: 0,
        left: 0,
        marginLeft: 2,
        width: TOOLBOX_WIDTH,
        height: '100%',
        boxShadow: '2px 0px 4px -1px rgba(0, 0, 0, 0.2), 4px 0px 5px 0px rgba(0, 0, 0, 0.14), 1px 0px 10px 0px rgba(0, 0, 0, 0.12)'
    },
    iconButtons: {
        width: 32,
        height: 32,
        padding: 4
    },
    layoutIcon: {
        width: 24,
        height: 24,
        background: theme.palette.type === 'dark' ? '#9d9d9d' : undefined,
        borderRadius: theme.palette.type === 'dark' ? 30 : undefined,
    },
});

class SettingsEditor extends React.Component {
    render() {
        return <div className={this.props.classes.logBox}>
            {false ? <div className={this.props.classes.toolbox} key="toolbox">
                {this.props.onLayoutChange ?
                    (<IconButton
                        className={this.props.classes.iconButtons}
                        onClick={() => this.props.onLayoutChange()}
                        title={I18n.t('Change layout')}
                    >
                        <img
                            className={this.props.classes.layoutIcon}
                            alt="split"
                            src={this.props.verticalLayout ? IconVerticalSplit : IconHorizontalSplit}
                        />
                    </IconButton>) : null}
            </div> : null }
            <div className={this.props.classes.logBoxInner} key="logList">
                <PresetTabs
                    socket={this.props.socket}
                    presetData={this.props.presetData}
                    onChange={this.props.onChange}
                    instances={this.props.instances}
                    systemConfig={this.props.systemConfig}
                />
            </div>
        </div>;
    }
}

SettingsEditor.propTypes = {
    socket: PropTypes.object,
    presetData: PropTypes.object,
    instances: PropTypes.array,
    onLayoutChange: PropTypes.func,
    onChange: PropTypes.func,
    verticalLayout: PropTypes.bool
};

export default withStyles(styles)(SettingsEditor);
