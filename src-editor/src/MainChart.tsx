import React from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import ChartSettings from './Components/ChartSettings';
import ChartFrame from './Components/ChartFrame';
import type { ChartConfigMore, SelectedChart } from '../../src/types';
import type { IobTheme } from '@iobroker/adapter-react-v5';

const styles: Record<'container' | 'heightWithoutToolbar' | 'height100', React.CSSProperties> = {
    container: {
        height: '100%',
        width: '100%',
        overflow: 'hidden',
    },
    heightWithoutToolbar: {
        height: 'calc(100% - 48px)',
    },
    height100: {
        height: '100%',
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

class MainChart extends React.Component<MainChartProps> {
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
            <div
                style={{
                    ...(typeof this.props.selectedId !== 'string' ? styles.heightWithoutToolbar : styles.height100),
                    display: this.props.visible ? 'block' : 'none',
                }}
            >
                {this.props.visible ? (
                    <ChartFrame
                        src={`${URL}index.html?edit=1`}
                        presetData={data}
                        theme={this.props.theme}
                    />
                ) : null}
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
