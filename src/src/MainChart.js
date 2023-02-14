import React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { withStyles, StylesProvider, createGenerateClassName } from '@mui/styles';

import ChartSettings from './Components/ChartSettings';
import ChartFrame from './Components/ChartFrame';

const generateClassName = createGenerateClassName({
    productionPrefix: 'iob-ch',
});

const styles = theme => ({
    toolbar: {
        // a: console.log(JSON.stringify(theme)),
        minHeight: theme.mixins.toolbar.minHeight,
        boxShadow: '0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12)',
    },
    toolbarButtons: {
        padding: 4,
        marginLeft: 4,
    },
    editorDiv: {
        height: `calc(100% - ${theme.mixins.toolbar.minHeight + 38 + 1}px)`,
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
    },
    textButton: {
        marginRight: 10,
        minHeight: 24,
        padding: '6px 16px',
    },
    tabIcon: {
        width: 24,
        height: 24,
        verticalAlign: 'middle',
        marginBottom: 2,
        marginRight: 2,
        borderRadius: 3,
    },
    hintIcon: {
        // fontSize: 32,
        padding: '0 8px 0 8px',
    },
    hintText: {
        // fontSize: 18
    },
    tabMenuButton: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    tabChanged: {
        color: theme.palette.secondary.main,
    },
    tabText: {
        maxWidth: 130,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        display: 'inline-block',
        verticalAlign: 'middle',
    },
    tabChangedIcon: {
        color: '#FF0000',
        fontSize: 16,
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 0,
        zIndex: 10,
        padding: 8,
        cursor: 'pointer',
    },
    notRunning: {
        color: '#ffbc00',
    },
    tabButton: {

    },
    tabButtonWrapper: {
        display: 'inline-block',
    },
    menuIcon: {
        width: 18,
        height: 18,
        borderRadius: 2,
        marginRight: 5,
    },
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
});

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

        return <div style={{ display: this.props.visible ? 'block' : 'none' }} className={typeof this.props.selectedId !== 'string' ? this.props.classes.heightWithoutToolbar : this.props.classes.height100}>
            <ChartFrame
                src={`${URL}index.html?edit=1`}
                presetData={data}
            />
        </div>;
    }

    render() {
        return <StylesProvider generateClassName={generateClassName}>
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.props.theme}>
                    <div className={this.props.classes.container}>
                        {this.renderToolbar()}
                        {this.getChartFrame()}
                    </div>
                </ThemeProvider>
            </StyledEngineProvider>
        </StylesProvider>;
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

export default withStyles(styles)(MainChart);
