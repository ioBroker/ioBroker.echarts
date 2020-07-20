import React from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';

import I18n from '@iobroker/adapter-react/i18n';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect,IOObjectField} from './Fields';

import {MdDelete as IconDelete} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';
import IconButton from '@material-ui/core/IconButton';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import {withStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

let styles = {
    card: {
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: 'lightgrey',
    },
    shortFields: {
        display: 'inline-block',
        '& > div': {
            display: 'inline-flex',
            paddingRight: '20px',
            width: '200px'
        }
    }
};

class Line extends React.Component {
    updateField = (name, value) => {
        let newLine = update(this.props.line, {[name]: {$set: value}});
        this.props.updateLine(this.props.index, newLine);
    };
    
    render() {
        return <Card className={this.props.classes.card}><CardContent>
            <div>
                {I18n.t('Line')} {this.props.index} - {this.props.line.name}
                <IconButton title={ I18n.t('Edit') }
                    onClick={()=>{
                        this.props.lineOpenToggle(this.props.index);
                    }
                }><IconEdit/></IconButton>
                <IconButton
                    size="small"
                    style={{ marginLeft: 5 }} aria-label="Delete" title={I18n.t('Delete')}
                    onClick={()=>{
                        this.props.deleteLine(this.props.index);
                    }}>
                    <IconDelete/>
                </IconButton>
            </div>
            { this.props.opened ? <>
            <Grid container>
                <Grid item xs={6}>
                    <div className={this.props.classes.shortFields}>
                        <IOSelect formData={this.props.line} updateValue={this.updateField} name="instance" label="Instance" options={
                            (() => {
                                let result = {};
                                this.props.instances.forEach(instance => result[instance._id] = instance._id);
                                return result;
                            })()
                        }/>
                        <IOObjectField formData={this.props.line} updateValue={this.updateField} name="id" label="ID" customFilter={{common: {custom: this.props.line.instance ? this.props.line.instance.replace('system.adapter.', '') : true}}} socket={this.props.socket}/>
                        <IOSelect formData={this.props.line} updateValue={this.updateField} name="aggregate" label="Type" options={{
                            minmax: 'minmax',
                            average: 'average',
                            min: 'min',
                            max: 'max',
                            total: 'total',
                            onchange: 'on change',
                        }}/>
                        <IOSelect formData={this.props.line} updateValue={this.updateField} name="chartType" label="Chart type" options={{
                            line: 'Line',
                            bar: 'Bar',
                            scatterplot: 'Scatter plot',
                            steps: 'Steps',
                            spline: 'Spline',
                        }}/>
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="fill" label="Fill" />
                        <IOCheckbox formData={this.props.line} updateValue={this.updateField} name="points" label="Points"/>
                        <IOColorPicker formData={this.props.line} updateValue={this.updateField} name="aggregateType" label="Color" />
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="min" label="Min" />
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="max" label="Max" />
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="unit" label="Unit" />
                        <IOSelect formData={this.props.line} updateValue={this.updateField} name="yaxe" label="Y Axis" options={{
                            '': '',
                            off: 'off',
                            left: 'left',
                            right: 'right',
                            leftColor: 'left colored',
                            rightColor: 'right colored',
                        }}/>
                        <IOSelect formData={this.props.line} updateValue={this.updateField} name="xaxe" label="X Axis" options={{
                            '': '',
                            off: 'off',
                            left: 'left',
                            right: 'right',
                            topColor: 'top colored',
                            bottomColor: 'bottom colored',
                        }}/>
                    </div>
                </Grid>
                <Grid item xs={6}>
                    <div className={this.props.classes.shortFields}>
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="name" label="Name"/>
                        <IOSelect formData={this.props.line} updateValue={this.updateField} name="offset" label="X-Offset" options={{
                            '0': '0 seconds',
                            '10': '10 seconds',
                            '30': '30 seconds',
                            '60': '60 seconds',
                            '120': '2 minutes',
                            '180': '3 minutes',
                            '240': '4 minutes',
                            '300': '5 minutes',
                            '600': '10 minutes',
                            '900': '15 minutes',
                            '1800': '30 minutes',
                            '2700': '45 minutes',
                            '3600': '1 hour',
                            '7200': '2 hours',
                            '21600': '6 hours',
                            '43200': '12 hours',
                            '86400': '1 day',
                            '172800': '2 days',
                            '259200': '3 days',
                            '345600': '4 days',
                            '604800': '1 week',
                            '1209600': '2 weeks',
                            '1m': '1 month',
                            '2m': '2 months',
                            '3m': '3 months',
                            '6m': '6 months',
                            '1y': '1 year',
                            '2y': '2 years',
                        }}/>
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="yOffset" label="Y-Offset" type="number"/>
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="xticks" label="X-Axis ticks" type="number"/>
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="yticks" label="Y-Axis ticks" type="number"/>
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="thickness" label="ØL" type="number"/>
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="shadowsize" label="ØS" type="number"/>
                        <IOSelect formData={this.props.line} updateValue={this.updateField} name="commonYAxis" label="Common Y Axis" options={{
                            '': 'default',
                            '1': '1',
                            '2': '2',
                            '3': '3',
                            '4': '4',
                            '5': '5',
                        }}/>
                        <IOSelect formData={this.props.line} updateValue={this.updateField} name="ignoreNull" label="NULL as" options={{
                            'false': 'default',
                            'true': 'ignore null values',
                            '0': 'use 0 instead of null values',
                        }}/>
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="smoothing" label="Smoothing" type="number"/>
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="afterComma" label="After comma" type="number"/>
                        <IOCheckbox formData={this.props.line} updateValue={this.updateField} name="dashes" label="Dashes"/>
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="dashLength" label="Dashes length" type="number"/>
                        <IOTextField formData={this.props.line} updateValue={this.updateField} name="spaceLength" label="Space length" type="number"/>
                    </div>
                </Grid>
            </Grid>
            </> : 
                <div className={this.props.classes.shortFields}>
                    <IOSelect formData={this.props.line} updateValue={this.updateField} name="instance" label="Instance" options={
                        (() => {
                            let result = {};
                            this.props.instances.forEach(instance => result[instance._id] = instance._id);
                            return result;
                        })()
                    }/>
                    <IOObjectField formData={this.props.line} updateValue={this.updateField} name="id" label="ID" customFilter={{common: {custom: this.props.line.instance ? this.props.line.instance.replace('system.adapter.', '') : true}}} socket={this.props.socket}/>
                    <IOSelect formData={this.props.line} updateValue={this.updateField} name="aggregate" label="Type" options={{
                        minmax: 'minmax',
                        average: 'average',
                        min: 'min',
                        max: 'max',
                        total: 'total',
                        onchange: 'on change',
                    }}/>
                    <IOSelect formData={this.props.line} updateValue={this.updateField} name="chartType" label="Chart type" options={{
                        line: 'Line',
                        bar: 'Bar',
                        scatterplot: 'Scatter plot',
                        steps: 'Steps',
                        spline: 'Spline',
                    }}/>
                    <IOTextField formData={this.props.line} updateValue={this.updateField} name="fill" label="Fill" />
                    <IOTextField formData={this.props.line} updateValue={this.updateField} name="name" label="Name"/>
                </div>
            }
        </CardContent></Card>
    }
}

Line.propTypes = {
    line: PropTypes.object,
    socket: PropTypes.object,
    updateLine: PropTypes.func,
    index: PropTypes.number,
    opened: PropTypes.bool,
    instances: PropTypes.array,
    lineOpenToggle: PropTypes.func,
};

export default withStyles(styles)(Line);