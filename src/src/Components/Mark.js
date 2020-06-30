import React from 'react';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect} from './Fields';

class Mark extends React.Component {
    state = {};
    
    render() {
        return <>
            <IOSelect label="Line ID"/>
            <IOTextField label="Upper value or ID" />
            <IOTextField label="Lower value or ID" />
            <IOColorPicker value={this.state.windowBackground} onChange={(color)=>{this.setState({windowBackground: color})}} label="Color" />
            <IOCheckbox label="Fill"/>
            <IOTextField label="ØL"/>
            <IOTextField label="ØS"/>
            <IOTextField label="Text"/>
            <IOSelect label="Text position"/>
            <IOTextField label="Text offset"/>
            <IOTextField label="Text size"/>
            <IOColorPicker value={this.state.windowBackground} onChange={(color)=>{this.setState({windowBackground: color})}} label="Text color" />
        </>
    }
}

export default Mark;