import React from 'react';
import PropTypes from 'prop-types';

import IconButton from '@material-ui/core/IconButton';

import I18n from '@iobroker/adapter-react/i18n';
import {withStyles} from '@material-ui/core/styles/index';

import PresetTabs from './Components/PresetTabs';

// replace later with MdHorizontalSplit and MdVerticalSplit
const IconVerticalSplit   = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgAQMAAADYVuV7AAAABlBMVEUAAAAzMzPI8eYgAAAAAXRSTlMAQObYZgAAACFJREFUeAFjAIJRwP////8PYIKWHCigNQdKj/pn1D+jAABTG16wVQqVpQAAAABJRU5ErkJggg==';
const IconHorizontalSplit = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgAQMAAADYVuV7AAAABlBMVEUAAAAzMzPI8eYgAAAAAXRSTlMAQObYZgAAABtJREFUeAFjAIJRwP8fCj7QkENn/4z6Z5QzCgBjbWaoyx1PqQAAAABJRU5ErkJggg==';

const TOOLBOX_WIDTH = 34;

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
        overflow: 'auto',
        position: 'relative'
    },
    info: {
        background: theme.palette.type === 'dark' ? 'darkgrey' : 'lightgrey',
        color: theme.palette.type === 'dark' ?  'black' : 'black'
    },
    error: {
        background: '#FF0000',
        color: theme.palette.type === 'dark' ?  'black' : 'white'
    },
    warn: {
        background: '#FF8000',
        color: theme.palette.type === 'dark' ?  'black' : 'white'
    },
    debug: {
        background: 'gray',
        opacity: 0.8,
        color: theme.palette.type === 'dark' ?  'black' : 'white'
    },
    silly: {
        background: 'gray',
        opacity: 0.6,
        color: theme.palette.type === 'dark' ? 'black' : 'white'
    },
    table: {
        fontFamily: 'monospace',
        width: '100%',

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
    trTime: {
        width: 90
    },
    trSeverity: {
        width: 40,
        fontWeight: 'bold'
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
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className={this.props.classes.logBox}>
                 <div className={this.props.classes.toolbox} key="toolbox">
                    {this.props.onLayoutChange ? (<IconButton className={this.props.classes.iconButtons} onClick={() => this.props.onLayoutChange()} title={I18n.t('Change layout')}><img className={this.props.classes.layoutIcon} alt="split" src={this.props.verticalLayout ? IconVerticalSplit : IconHorizontalSplit} /></IconButton>) : null}
                </div>
                <div className={this.props.classes.logBoxInner} key="logList">
                    <PresetTabs/>
                </div>
            </div>
        );
    }
}

SettingsEditor.propTypes = {
    selected: PropTypes.string,
    onLayoutChange: PropTypes.func,
    verticalLayout: PropTypes.bool
};

export default withStyles(styles)(SettingsEditor);
