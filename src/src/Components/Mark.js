import React from 'react';
import update from 'immutability-helper';

import I18n from '@iobroker/adapter-react/i18n';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect,IOObjectField} from './Fields';

import {MdDelete as IconDelete} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';
import IconButton from '@material-ui/core/IconButton';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import {withStyles} from '@material-ui/core/styles';

let styles = {
    card: {
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: 'lightgrey',
    }
};

class Mark extends React.Component {
    state = {
        /*
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
        */
      };

    updateField = (name, value)=>{
        let newMark = update(this.props.mark, {[name]: {$set: value}});
        this.props.updateMark(this.props.index, newMark);
    }
    
    render() {
        let lines = {};
        this.props.presetData.lines.forEach((line, index) => {
            lines[index] = index + " - " + line.id;
        });
        return <Card className={this.props.classes.card}><CardContent>
            <div>
                <IconButton title={ I18n.t('Edit') }><IconEdit/></IconButton>
                <IconButton
                    size="small"
                    style={{ marginLeft: 5 }} aria-label="Delete" title={I18n.t('Delete')}
                    onClick={()=>{
                        this.props.deleteMark(this.props.index);
                    }}>
                    <IconDelete/>
                </IconButton>
            </div>
            <IOSelect formData={this.props.mark} updateValue={this.updateField} name="lineId" label="Line ID" options={lines}/>
            <IOObjectField formData={this.props.mark} updateValue={this.updateField} name="upperValueOrId" label="Upper value or ID" socket={this.props.socket} />
            <IOObjectField formData={this.props.mark} updateValue={this.updateField} name="lowerValueOrId" label="Lower value or ID" socket={this.props.socket} />
            <IOColorPicker formData={this.props.mark} updateValue={this.updateField} name="color" label="Color" />
            <IOCheckbox formData={this.props.mark} updateValue={this.updateField} name="fill" label="Fill"/>
            <IOTextField formData={this.props.mark} updateValue={this.updateField} name="ol" label="ØL" type="number"/>
            <IOTextField formData={this.props.mark} updateValue={this.updateField} name="os" label="ØS" type="number"/>
            <IOTextField formData={this.props.mark} updateValue={this.updateField} name="text" label="Text"/>
            <IOSelect formData={this.props.mark} updateValue={this.updateField} name="textPosition" label="Text position" options={{
                'l': 'Left',
                'r': 'Right',
            }}/>
            <IOTextField formData={this.props.mark} updateValue={this.updateField} name="textOffset" label="Text offset" type="number"/>
            <IOTextField formData={this.props.mark} updateValue={this.updateField} name="textSize" label="Text size" type="number"/>
            <IOColorPicker formData={this.props.mark} updateValue={this.updateField} name="textColor" label="Text color" />
            </CardContent></Card>
    }
}

export default withStyles(styles)(Mark);