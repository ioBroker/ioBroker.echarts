import React from 'react';

import { Box } from '@mui/material';
import PresetTabs from './Components/PresetTabs';
import type { AdminConnection, IobTheme } from '@iobroker/adapter-react-v5';
import type { ChartConfigMore } from '../../src/types';

const TOOLBOX_WIDTH = 0; // 34;

const styles: Record<'logBox' | 'logBoxInner', any> = {
    logBox: {
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    logBoxInner: (theme: IobTheme): React.CSSProperties => ({
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

interface SettingsEditorProps {
    socket: AdminConnection;
    selectedId: string;
    presetData: ChartConfigMore;
    instances: ioBroker.InstanceObject[];
    onChange: (presetData: ChartConfigMore) => void;
    savePreset: () => void;
    selectedPresetChanged: boolean;
    width: number;
    theme: IobTheme;
    onAutoSave: (autoSave: boolean) => void;
    autoSave: boolean;
    systemConfig: ioBroker.SystemConfigObject;
    windowWidth: number;
}

class SettingsEditor extends React.Component<SettingsEditorProps> {
    render(): React.JSX.Element {
        return (
            <div style={styles.logBox}>
                <Box
                    component="div"
                    sx={styles.logBoxInner}
                >
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
                        windowWidth={this.props.windowWidth}
                    />
                </Box>
            </div>
        );
    }
}

export default SettingsEditor;
