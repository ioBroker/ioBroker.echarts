import React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import ChartSettings from './Components/ChartSettings';
import ChartFrame from './Components/ChartFrame';

const styles = {
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

class MainChart extends React.Component {
    renderToolbar() {
        return this.props.selectedId && typeof this.props.selectedId === 'string' ? null :
            <ChartSettings
                onChange={this.props.onChange}
                enablePresetMode={this.props.enablePresetMode}
                presetData={this.props.presetData}
                onCreatePreset={(name, parentId, historyInstance, stateId) => this.props.onCreatePreset(name, parentId, historyInstance, stateId)}
            />;
    }

    getChartFrame() {
        const URL = (window.location.search || '').includes('dev=true') ? 'http://localhost:3000/' : 'chart/';

        const data = JSON.parse(JSON.stringify(this.props.presetData));

        if (typeof this.props.selectedId === 'object') {
            // fast chart
            // remove settings from line
            delete data.lines[0].aggregate;
            delete data.lines[0].chartType;
        }

        return <div
            style={{
                ...(typeof this.props.selectedId !== 'string' ? styles.heightWithoutToolbar : styles.height100),
                display: this.props.visible ? 'block' : 'none',
            }}
        >
            <ChartFrame
                src={`${URL}index.html?edit=1`}
                presetData={data}
                theme={this.props.theme}
            />
        </div>;
    }

    render() {
        return <StyledEngineProvider injectFirst>
            <ThemeProvider theme={this.props.theme}>
                <div style={styles.container}>
                    {this.renderToolbar()}
                    {this.getChartFrame()}
                </div>
            </ThemeProvider>
        </StyledEngineProvider>;
    }
}

MainChart.propTypes = {
    onChange: PropTypes.func.isRequired,
    onCreatePreset: PropTypes.func.isRequired,
    visible: PropTypes.bool,
    presetData: PropTypes.object,
    selectedId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object]),
    theme: PropTypes.object,
};

export default MainChart;
