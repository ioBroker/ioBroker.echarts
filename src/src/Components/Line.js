import React from 'react';

import I18n from '@iobroker/adapter-react/i18n';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect} from './Fields';

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
                    style={{ marginLeft: 5 }} aria-label="Delete" title={I18n.t('Delete')}>
                    <IconDelete/>
                </IconButton>
            </div>
            <IOSelect formData={this.state} updateValue={this.updateField} name="instance" label="Instance"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="id" label="ID" />
            <IOSelect formData={this.state} updateValue={this.updateField} name="aggregate" label="Type"/>
            <IOSelect formData={this.state} updateValue={this.updateField} name="chartType" label="Chart type"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="fill" label="Fill" />
            <IOCheckbox formData={this.state} updateValue={this.updateField} name="points" label="Points"/>
            <IOColorPicker formData={this.state} updateValue={this.updateField} name="aggregateType" label="Color" />
            <IOTextField formData={this.state} updateValue={this.updateField} name="min" label="Min" />
            <IOTextField formData={this.state} updateValue={this.updateField} name="max" label="Max" />
            <IOTextField formData={this.state} updateValue={this.updateField} name="unit" label="Unit" />
            <IOSelect formData={this.state} updateValue={this.updateField} name="yaxe" label="Y Axis"/>
            <IOSelect formData={this.state} updateValue={this.updateField} name="xaxe" label="X Axis"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="name" label="Name"/>
            <IOSelect formData={this.state} updateValue={this.updateField} name="offset" label="X-Offset"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="yOffset" label="Y-Offset"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="xticks" label="X-Axis ticks"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="yticks" label="Y-Axis ticks"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="thickness" label="ØL"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="shadowsize" label="ØS"/>
            <IOSelect formData={this.state} updateValue={this.updateField} name="commonYAxis" label="Common Y Axis"/>
            <IOSelect formData={this.state} updateValue={this.updateField} name="ignoreNull" label="NULL as"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="smoothing" label="Smoothing"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="afterComma" label="After comma"/>
            <IOCheckbox formData={this.state} updateValue={this.updateField} name="dashes" label="Dashes"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="dashLength" label="Dashes length"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="spaceLength" label="Space length"/>
        </>
    }
}

export default Line;