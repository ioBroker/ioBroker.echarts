import React from 'react';
import PropTypes from 'prop-types';
import {MuiThemeProvider, withStyles} from '@material-ui/core/styles';

import ChartSettings from './Components/ChartSettings';
import ChartFrame from './Components/ChartFrame';
import getUrlQuery from './utils/getUrlQuery';

const styles = theme => ({

    toolbar: {
        //a: console.log(JSON.stringify(theme)),
        minHeight: theme.mixins.toolbar.minHeight,
        boxShadow: '0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12)'
    },
    toolbarButtons: {
        padding: 4,
        marginLeft: 4
    },
    editorDiv: {
        height: `calc(100% - ${theme.mixins.toolbar.minHeight + 38 + 1}px)`,
        width: '100%',
        overflow: 'hidden',
        position: 'relative'
    },
    textButton: {
        marginRight: 10,
        minHeight: 24,
        padding: '6px 16px'
    },
    tabIcon: {
        width: 24,
        height: 24,
        verticalAlign: 'middle',
        marginBottom: 2,
        marginRight: 2,
        borderRadius: 3
    },
    hintIcon: {
        //fontSize: 32,
        padding: '0 8px 0 8px'
    },
    hintText: {
        //fontSize: 18
    },
    tabMenuButton: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    tabChanged: {
        color: theme.palette.secondary.main
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
        fontSize: 16
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 0,
        zIndex: 10,
        padding: 8,
        cursor: 'pointer'
    },
    notRunning: {
        color: '#ffbc00'
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
        marginRight: 5
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
    }
});

class MainChart extends React.Component {
    renderToolbar() {
        return this.props.presetMode ? null :
            <ChartSettings
                onChange={this.props.onChange}
                enablePresetMode={this.props.enablePresetMode}
                presetData={this.props.presetData}
                socket={this.props.socket}
                createPreset={this.props.createPreset}
            />;
    }

    getUrlParameters() {
        let translate = {
            'lines': 'l',
            'marks': 'm'
        };
        let translateObject = {
            'lines': {},
            'marks': {
                'lineId': 'l',
                'upperValueOrId': 'v',
                'lowerValueOrId': 'vl',
                'color': 'c',
                'fill': 'f',
                'ol': 't',
                'os': 's',
                'text': 'd',
                'textPosition': 'p',
                'textOffset': 'py',
                'textColor': 'fc',
                'textSize': 'fs',
            },
        };
        let url = '';
        for (let k in this.props.presetData) {
            let v = this.props.presetData[k];
            let translateCurrentObject = translateObject[k];

            if (k === 'chartType' || k === 'aggregate') {
                continue;
            }


            if (translate[k]) {
                k = translate[k];
            }
            if (Array.isArray(v)) {
                for (let i = 0; i < v.length; i++) {
                    const arrayObject = v[i];
                    for (let k2 in arrayObject) {
                        if (arrayObject.hasOwnProperty(k2)) {
                            let v2 = arrayObject[k2];
                            if (v2 !== undefined && v2 !== null && v2 !== '') {
                                if (!this.props.presetMode && (k2 === 'chartType' || k2 === 'aggregate') && this.props.presetData[k2]) {
                                    v2 = this.props.presetData[k2];
                                }

                                if (translateCurrentObject[k2]) {
                                    k2 = translateCurrentObject[k2];
                                }

                                url += encodeURIComponent(k + '[' + i + '][' + k2 + ']') + '=' + encodeURIComponent(v2) + '&';
                            }
                        }
                    }
                }
            } else if (v !== undefined && v !== null && v !== '') {
                url += encodeURIComponent(k) + '=' + encodeURIComponent(v) + '&';
            }
        }

        return url;
    }


    getUrl() {
        if (this.props.presetMode) {
            return '/flot/index.html?' + this.getUrlParameters();
            //return '/flot/index.html?preset=' + encodeURIComponent(this.props.selectedPresetId);
        } else {
            return '/flot/index.html?' + this.getUrlParameters();
        }
    }

    getChartFrame() {
        return <div style={{display: this.props.visible ? 'block' : 'none'}} className={!this.props.presetMode ? this.props.classes.heightWithoutToolbar : this.props.classes.height100}>
            <ChartFrame src={this.getUrl()}
        /></div>;
    }

    render() {
        return <MuiThemeProvider theme={this.props.theme}>
            <div className={this.props.classes.container}>
                {this.renderToolbar()}
                {this.getChartFrame()}
                {/* <div style={{height: '200px', overflow: 'auto'}}>
                    <pre>{this.getUrlParameters()}</pre>
                    <pre>{JSON.stringify(this.props.presetData, null, 2)}</pre>
                </div> */}
            </div>
        </MuiThemeProvider>
    }
}

MainChart.propTypes = {
    onChange: PropTypes.func.isRequired,
    visible: PropTypes.bool,
    runningInstances: PropTypes.object,
    socket: PropTypes.object,
    presetData: PropTypes.object,
    presetMode: PropTypes.bool,
    selectedPresetId: PropTypes.string,
    enablePresetMode: PropTypes.func,
    createPreset: PropTypes.func,
    theme: PropTypes.object
};

export default withStyles(styles)(MainChart);
