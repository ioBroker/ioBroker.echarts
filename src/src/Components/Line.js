import React from 'react';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect} from './Fields';

class Line extends React.Component {
    state = {};
    
    render() {
        return <>
            <IOSelect label="Instance"/>
            <IOTextField label="ID" />
            <IOSelect label="Type"/>
            <IOSelect label="Chart type"/>
            <IOTextField label="Fill" />
            <IOCheckbox label="Points"/>
            <IOColorPicker value={this.state.windowBackground} onChange={(color)=>{this.setState({windowBackground: color})}} label="Legend background" />
            <IOTextField label="Min" />
            <IOTextField label="Max" />
            <IOTextField label="Unit" />
            <IOSelect label="Y Axis"/>
            <IOSelect label="X Axis"/>
            <IOTextField label="Name"/>
            <IOSelect label="X-Offset"/>
            <IOTextField label="Y-Offset"/>
            <IOTextField label="X-Axis ticks"/>
            <IOTextField label="Y-Axis ticks"/>
            <IOTextField label="ØL"/>
            <IOTextField label="ØS"/>
            <IOSelect label="Common Y Axis"/>
            <IOSelect label="NULL as"/>
            <IOTextField label="Smoothing"/>
            <IOTextField label="After comma"/>
            <IOCheckbox label="Dashes"/>
            <IOTextField label="Dashes length"/>
            <IOTextField label="Space length"/>
        </>
    }
}

export default Line;