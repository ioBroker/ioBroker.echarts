import React from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import {withStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect, IOObjectField, IODateTimeField} from './Fields';
import I18n from '@iobroker/adapter-react/i18n';

let styles = {
    fieldsContainer: {
        '& > div': {
            display: "inline-block",
            paddingRight: "20px",
        }
    },
    hintButton: {
        marginTop: 8,
        marginRight: 20,
        float: 'right'
    }
};

class ChartSettings extends React.Component {
    
    updateField = (name, value)=>{
        this.props.onChange(update(this.props.presetData, {[name]: {$set: value}}));
    }
    render() {
        return <>
            <div>
                <Grid container>
                    <Grid item xs={6} className={this.props.classes.fieldsContainer}>
                        <h4>{I18n.t('Time Span')}</h4>
                        <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="timeType" label="Type" options={{
                            'relative': 'relative',
                            'static': 'static',
                        }}/>
                        { this.props.presetData.timeType == 'static' ?
                            <>
                                <IODateTimeField formData={this.props.presetData} updateValue={this.updateField} name="start" label="Start" />
                                <IODateTimeField formData={this.props.presetData} updateValue={this.updateField} name="end" label="End" />
                            </> : <>
                                <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="relativeEnd" label="End" options={{
                                    'now': 'now',
                                    '1minute': 'end of minute',
                                    '5minutes': 'end of 5 minutes',
                                    '10minutes': 'end of 10 minutes',
                                    '30minutes': 'end of 30 minutes',
                                    '1hour': 'end of hour',
                                    '2hours': 'end of 2 hours',
                                    '3hours': 'end of 3 hours',
                                    '4hours': 'end of 4 hours',
                                    '6hours': 'end of 6 hours',
                                    '8hours': 'end of 8 hours',
                                    '12hours': 'end of 12 hours',
                                    'today': 'end of day',
                                    'weekEurope': 'end of sunday',
                                    'weekUsa': 'end of saturday',
                                    'month': 'this month',
                                    'year': 'this year',
                                }}/>
                                <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="range" label="Range" options={{
                                    '10': '10 minutes',
                                    '30': '30 minutes',
                                    '60': '1 hour',
                                    '120': '2 hours',
                                    '180': '3 hours',
                                    '360': '6 hours',
                                    '720': '12 hours',
                                    '1440': '1 day',
                                    '2880': '2 days',
                                    '4320': '3 days',
                                    '10080': '7 days',
                                    '20160': '14 days',
                                    '1m': '1 month',
                                    '2m': '2 months',
                                    '3m': '3 months',
                                    '6m': '6 months',
                                    '1y': '1 year',
                                    '2y': '2 years',
                                }}/>
                                <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="live" label="Live update every" options={{
                                    '': 'none',
                                    '5': '5 seconds',
                                    '10': '10 seconds',
                                    '15': '15 seconds',
                                    '20': '20 seconds',
                                    '30': '30 seconds',
                                    '60': '1 minute',
                                    '120': '2 minutes',
                                    '300': '5 minutes',
                                    '600': '10 minutes',
                                    '900': '15 minutes',
                                    '1200': '20 minutes',
                                    '1800': '30 minutes',
                                    '3600': '1 hour',
                                    '7200': '2 hours',
                                    '10800': '3 hours',
                                    '21600': '6 hours',
                                    '43200': '12 hours',
                                    '86400': '1 day',
                                }}/>
                            </>
                        }
                    </Grid>
                    <Grid item xs={6} className={this.props.classes.fieldsContainer}>
                        <Button variant="contained" color="primary" className={this.props.classes.hintButton} onClick={this.props.enablePresetMode}>
                            {I18n.t('Edit mode')}
                        </Button>
                        <h4>{I18n.t('Aggregate')}</h4>
                        <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="aggregateType" label="Step type" options={{
                            'count': 'counts',
                            'step': 'seconds',
                        }}/>
                        <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="aggregateSpan" 
                            label={this.props.presetData.aggregateType == 'step' ? 'Seconds' : 'Counts'}  
                        />
                        <IOObjectField socket={this.props.socket} formData={this.props.presetData} updateValue={this.updateField} name="ticks" label="Use X-ticks from" />
                    </Grid>
                </Grid>
            </div>
        </>
    }
}

ChartSettings.propTypes = {
    onChange: PropTypes.func,
    presetData: PropTypes.object,
    socket: PropTypes.object,
    instances: PropTypes.array,
};

export default withStyles(styles)(ChartSettings)