import React from 'react';

import I18n from '@iobroker/adapter-react/i18n';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect,IOObjectField} from './Fields';

import {MdDelete as IconDelete} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';
import IconButton from '@material-ui/core/IconButton';

class Line extends React.Component {
    state = {
        "id":"system.adapter.admin.0.cpu",
        "offset":"0",
        "aggregate":"minmax",
        "color":"#FF0000",
        "thickness":"3",
        "shadowsize":"3",
        "name":"Line 1",
        "xaxe":"off",
        "ignoreNull":"false",
        "afterComma":"2",
        "dashes":"true",
        "dashLength":"10",
        "spaceLength":"10",
        "min":"-0.1",
        "max":"1",
        "points":"true",
        "fill":"4",
        "unit":"2",
        "yaxe":"left",
        "yOffset":"1",
        "xticks":"2",
        "yticks":"3",
        "smoothing":"4"
      };

    updateField = (name, value)=>{
        let update = {};
        update[name] = value;
        this.setState(update);
    }
    
    render() {
        return <>
            <div>
                <IconButton title={ I18n.t('Edit') }><IconEdit/></IconButton>
                <IconButton
                    size="small"
                    style={{ marginLeft: 5 }} aria-label="Delete" title={I18n.t('Delete')}
                    onClick={()=>{
                        this.props.deleteLine(this.props.index);
                    }}>
                    <IconDelete/>
                </IconButton>
            </div>
            <IOSelect formData={this.state} updateValue={this.updateField} name="instance" label="Instance"/>
            <IOObjectField formData={this.state} updateValue={this.updateField} name="id" label="ID" socket={this.props.socket}/>
            <IOSelect formData={this.state} updateValue={this.updateField} name="aggregate" label="Type" options={{
                minmax: 'minmax',
                average: 'average',
                min: 'min',
                max: 'max',
                total: 'total',
                onchange: 'on change',
            }}/>
            <IOSelect formData={this.state} updateValue={this.updateField} name="chartType" label="Chart type" options={{
                line: 'Line',
                bar: 'Bar',
                scatterplot: 'Scatter plot',
                steps: 'Steps',
                spline: 'Spline',
            }}/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="fill" label="Fill" />
            <IOCheckbox formData={this.state} updateValue={this.updateField} name="points" label="Points"/>
            <IOColorPicker formData={this.state} updateValue={this.updateField} name="aggregateType" label="Color" />
            <IOTextField formData={this.state} updateValue={this.updateField} name="min" label="Min" />
            <IOTextField formData={this.state} updateValue={this.updateField} name="max" label="Max" />
            <IOTextField formData={this.state} updateValue={this.updateField} name="unit" label="Unit" />
            <IOSelect formData={this.state} updateValue={this.updateField} name="yaxe" label="Y Axis" options={{
                '': '',
                off: 'off',
                left: 'left',
                right: 'right',
                leftColor: 'left colored',
                rightColor: 'right colored',
            }}/>
            <IOSelect formData={this.state} updateValue={this.updateField} name="xaxe" label="X Axis" options={{
                '': '',
                off: 'off',
                left: 'left',
                right: 'right',
                topColor: 'top colored',
                bottomColor: 'bottom colored',
            }}/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="name" label="Name"/>
            <IOSelect formData={this.state} updateValue={this.updateField} name="offset" label="X-Offset" options={{
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
            <IOTextField formData={this.state} updateValue={this.updateField} name="yOffset" label="Y-Offset"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="xticks" label="X-Axis ticks"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="yticks" label="Y-Axis ticks"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="thickness" label="ØL"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="shadowsize" label="ØS"/>
            <IOSelect formData={this.state} updateValue={this.updateField} name="commonYAxis" label="Common Y Axis" options={{
                '': 'default',
                '1': '1',
                '2': '2',
                '3': '3',
                '4': '4',
                '5': '5',
            }}/>
            <IOSelect formData={this.state} updateValue={this.updateField} name="ignoreNull" label="NULL as" options={{
                'false': 'default',
                'true': 'ignore null values',
                '0': 'use 0 instead of null values',
            }}/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="smoothing" label="Smoothing"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="afterComma" label="After comma"/>
            <IOCheckbox formData={this.state} updateValue={this.updateField} name="dashes" label="Dashes"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="dashLength" label="Dashes length"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="spaceLength" label="Space length"/>
        </>
    }
}

export default Line;