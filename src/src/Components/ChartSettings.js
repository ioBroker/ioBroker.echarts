import React from 'react';
import update from 'immutability-helper';
import {withStyles} from '@material-ui/core/styles';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect, IOObjectField} from './Fields';

let styles = {
    fieldsContainer: {
        '& div': {
            display: "inline-block"
        }
    }
};

class ChartSettings extends React.Component {
    
    updateField = (name, value)=>{
        this.props.onChange(update(this.props.presetData, {[name]: {$set: value}}));
    }
    render() {
        return <>
            <div className={this.props.classes.fieldsContainer}>
                <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="timeType" label="Type" options={{
                    'relative': 'relative',
                    'static': 'static',
                }}/>
                <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="aggregateType" label="Step type" options={{
                    'count': 'counts',
                    'step': 'seconds',
                }}/>
                <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="aggregateSpan" 
                    label={this.props.presetData.aggregateType == "step" ? "Seconds" : "Counts"}  
                />
                <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="ticks" label="Use X-ticks from" />
            </div>
        </>
    }
}

export default withStyles(styles)(ChartSettings)