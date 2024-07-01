import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '@mui/material';
// import IconButton from '@mui/material/IconButton';

// import I18n from '@iobroker/adapter-react-v5/i18n';
import PresetTabs from './Components/PresetTabs';

// replace later with MdHorizontalSplit and MdVerticalSplit
// const IconVerticalSplit   = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgAQMAAADYVuV7AAAABlBMVEUAAAAzMzPI8eYgAAAAAXRSTlMAQObYZgAAACFJREFUeAFjAIJRwP////8PYIKWHCigNQdKj/pn1D+jAABTG16wVQqVpQAAAABJRU5ErkJggg==';
// const IconHorizontalSplit = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgAQMAAADYVuV7AAAABlBMVEUAAAAzMzPI8eYgAAAAAXRSTlMAQObYZgAAABtJREFUeAFjAIJRwP8fCj7QkENn/4z6Z5QzCgBjbWaoyx1PqQAAAABJRU5ErkJggg==';

const TOOLBOX_WIDTH = 0; // 34;

const styles = {
    logBox: {
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    logBoxInner: theme => ({
        color: theme.palette.mode === 'dark' ? 'white' : 'black',
        width: `calc(100% - ${TOOLBOX_WIDTH}px)`,
        height: '100%',
        marginLeft: TOOLBOX_WIDTH,
        overflow: 'none',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
    }),
    toolbox: {
        position: 'absolute',
        top: 0,
        left: 0,
        marginLeft: 2,
        width: TOOLBOX_WIDTH,
        height: '100%',
        boxShadow: '2px 0px 4px -1px rgba(0, 0, 0, 0.2), 4px 0px 5px 0px rgba(0, 0, 0, 0.14), 1px 0px 10px 0px rgba(0, 0, 0, 0.12)',
    },
    iconButtons: {
        width: 32,
        height: 32,
        padding: 4,
    },
};

class SettingsEditor extends React.Component {
    render() {
        return <div style={styles.logBox}>
            {/* false ? <div style={styles.toolbox} key="toolbox">
                {this.props.onLayoutChange ?
                    (<IconButton
                        style={styles.iconButtons}
                        onClick={() => this.props.onLayoutChange()}
                        title={I18n.t('Change layout')}
                    >
                        <img
                            style={styles.layoutIcon}
                            alt="split"
                            src={this.props.verticalLayout ? IconVerticalSplit : IconHorizontalSplit}
                        />
                    </IconButton>) : null}
            </div> : null */ }
            <Box component="div" sx={styles.logBoxInner} key="logList">
                <PresetTabs
                    width={this.props.width}
                    socket={this.props.socket}
                    presetData={this.props.presetData}
                    selectedId={this.props.selectedId}
                    onChange={this.props.onChange}
                    instances={this.props.instances}
                    systemConfig={this.props.systemConfig}
                    selectedPresetChanged={this.props.selectedPresetChanged}
                    savePreset={this.props.savePreset}
                    theme={this.props.theme}
                    onAutoSave={autoSave => this.props.onAutoSave(autoSave)}
                    autoSave={this.props.autoSave}
                />
            </Box>
        </div>;
    }
}

SettingsEditor.propTypes = {
    socket: PropTypes.object,
    selectedId: PropTypes.string,
    presetData: PropTypes.object,
    instances: PropTypes.array,
    // onLayoutChange: PropTypes.func,
    onChange: PropTypes.func,
    // verticalLayout: PropTypes.bool,
    savePreset: PropTypes.func,
    selectedPresetChanged: PropTypes.bool,
    width: PropTypes.number,
    theme: PropTypes.object,
    onAutoSave: PropTypes.func,
    autoSave: PropTypes.bool,
    systemConfig: PropTypes.object,
};

export default SettingsEditor;
