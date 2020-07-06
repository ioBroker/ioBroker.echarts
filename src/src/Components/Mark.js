import React from 'react';

import I18n from '@iobroker/adapter-react/i18n';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect} from './Fields';

import {MdDelete as IconDelete} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';
import IconButton from '@material-ui/core/IconButton';

class Marks extends React.Component {
    state = []

    constructor(props) {
        super(props);
        this.state = props.marks;
    }

    updateField = (name, value)=>{
        let update = [];
        update[name] = value;
        this.setState(update, () => {
            this.props.updateField(this.props.name, this.state);
        });
    }
    
    render() {
        return this.props.marks.map((mark, key) => <Mark key={key} name={key} mark={mark} updateField={this.updateField} />);
    }
}

class Mark extends React.Component {
    state = {
        "lineId":"0",
        "upperValueOrId":"20",
        "fill":"1",
        "color":"#FF0000",
        "ol":"1",
        "os":"0",
        "text":"11",
        "textPosition":"l",
        "textOffset":"2",
        "textColor":"#FF0000",
        "textSize":"2",
        "lowerValueOrId":"20"
      };

      constructor(props) {
        super(props);
        this.state = props.mark;
    }

    updateField = (name, value)=>{
        let update = {};
        update[name] = value;
        this.setState(update, () => {
            this.props.updateField(this.props.name, this.state);
        });
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
            <IOSelect formData={this.state} updateValue={this.updateField} name="lineId" label="Line ID" options={{
                
            }}/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="upperValueOrId" label="Upper value or ID" />
            <IOTextField formData={this.state} updateValue={this.updateField} name="lowerValueOrId" label="Lower value or ID" />
            <IOColorPicker formData={this.state} updateValue={this.updateField} name="color" label="Color" />
            <IOCheckbox formData={this.state} updateValue={this.updateField} name="fill" label="Fill"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="ol" label="ØL"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="os" label="ØS"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="text" label="Text"/>
            <IOSelect formData={this.state} updateValue={this.updateField} name="textPosition" label="Text position" options={{
                'l': 'Left',
                'r': 'Right',
            }}/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="textOffset" label="Text offset"/>
            <IOTextField formData={this.state} updateValue={this.updateField} name="textSize" label="Text size"/>
            <IOColorPicker formData={this.state} updateValue={this.updateField} name="textColor" label="Text color" />
        </>
    }
}

export default Marks;