import React from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { Badge, FormControlLabel, IconButton, Switch } from '@mui/material';
import { Timeline, Refresh as IconRefresh } from '@mui/icons-material';

import { I18n, type IobTheme } from '@iobroker/gui-components';

import ChartSettings, { TOOLBAR_HEIGHT } from './Components/ChartSettings';
import ChartFrame from './Components/ChartFrame';
import type { ChartConfigMore, SelectedChart } from '../../src/types';

const PREVIEW_BAR_HEIGHT = 36;

const styles: Record<
    'container' | 'heightWithoutToolbar' | 'height100' | 'previewBar' | 'frameWithBar',
    React.CSSProperties
> = {
    container: {
        height: '100%',
        width: '100%',
        overflow: 'hidden',
    },
    heightWithoutToolbar: {
        height: `calc(100% - ${TOOLBAR_HEIGHT}px)`,
    },
    height100: {
        height: '100%',
    },
    previewBar: {
        height: PREVIEW_BAR_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 8,
        boxSizing: 'border-box',
    },
    frameWithBar: {
        height: `calc(100% - ${PREVIEW_BAR_HEIGHT}px)`,
    },
};

interface MainChartProps {
    onChange: (presetData: ChartConfigMore) => void;
    onCreatePreset: (isFromCurrentSelection: boolean, parentId?: string) => void;
    visible: boolean;
    presetData: ChartConfigMore;
    selectedId: SelectedChart;
    theme: IobTheme;
    windowWidth: number;
}

interface MainChartState {
    /** If false, the preview is updated only by the button "Update preview" */
    autoUpdate: boolean;
    /** Incremented by the button "Update preview" */
    refreshTrigger: number;
    /** The preview shows not the current settings */
    pending: boolean;
}

class MainChart extends React.Component<MainChartProps, MainChartState> {
    constructor(props: MainChartProps) {
        super(props);

        this.state = {
            autoUpdate: window.localStorage.getItem('echarts.autoPreview') !== 'false',
            refreshTrigger: 0,
            pending: false,
        };
    }

    renderPreviewBar(): React.JSX.Element {
        return (
            <div style={styles.previewBar}>
                <FormControlLabel
                    control={
                        <Switch
                            size="small"
                            checked={this.state.autoUpdate}
                            onChange={e => {
                                window.localStorage.setItem('echarts.autoPreview', e.target.checked ? 'true' : 'false');
                                this.setState({ autoUpdate: e.target.checked });
                            }}
                        />
                    }
                    label={I18n.t('Auto preview')}
                />
                <IconButton
                    size="small"
                    title={I18n.t('Update preview')}
                    onClick={() => this.setState({ refreshTrigger: this.state.refreshTrigger + 1 })}
                >
                    <Badge
                        color="secondary"
                        variant="dot"
                        invisible={this.state.autoUpdate || !this.state.pending}
                    >
                        <IconRefresh />
                    </Badge>
                </IconButton>
            </div>
        );
    }

    renderToolbar(): React.JSX.Element | null {
        return this.props.selectedId && typeof this.props.selectedId === 'string' ? null : (
            <ChartSettings
                windowWidth={this.props.windowWidth}
                onChange={this.props.onChange}
                presetData={this.props.presetData}
                onCreatePreset={(isFromCurrentSelection: boolean, parentId?: string): void =>
                    this.props.onCreatePreset(isFromCurrentSelection, parentId)
                }
            />
        );
    }

    getChartFrame(): React.JSX.Element {
        const URL = (window.location.search || '').includes('dev=true') ? 'http://localhost:3000/' : 'chart/';

        const data: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));

        if (typeof this.props.selectedId === 'object' && data.l) {
            // fast chart
            // remove settings from line and use from root
            delete data.l[0].aggregate;
            delete data.l[0].chartType;
        }

        return (
            <div style={typeof this.props.selectedId !== 'string' ? styles.heightWithoutToolbar : styles.height100}>
                {this.props.visible ? (
                    <>
                        {this.renderPreviewBar()}
                        <div style={styles.frameWithBar}>
                            <ChartFrame
                                src={`${URL}index.html?edit=1`}
                                presetData={data}
                                theme={this.props.theme}
                                autoUpdate={this.state.autoUpdate}
                                refreshTrigger={this.state.refreshTrigger}
                                onPendingChange={(pending: boolean): void => this.setState({ pending })}
                            />
                        </div>
                    </>
                ) : (
                    <Timeline style={{ height: '100%', width: '100%' }} />
                )}
            </div>
        );
    }

    render(): React.JSX.Element {
        return (
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.props.theme}>
                    <div style={styles.container}>
                        {this.renderToolbar()}
                        {this.getChartFrame()}
                    </div>
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}

export default MainChart;
