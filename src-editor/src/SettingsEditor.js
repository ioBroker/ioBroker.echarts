import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '@mui/material';
import PresetTabs from './Components/PresetTabs';

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
};

class SettingsEditor extends React.Component {
    render() {
        return <div style={styles.logBox}>
            <Box component="div" sx={styles.logBoxInner}>
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
