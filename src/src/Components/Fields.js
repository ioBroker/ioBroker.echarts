import React from 'react';

import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import ColorPicker from 'material-ui-color-picker'
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import I18n from '@iobroker/adapter-react/i18n';

export function IOSelect(props) {
    return <div>
        <FormControl>
            <InputLabel shrink={true}>{ I18n.t(props.label) }</InputLabel>
            <Select {...props}>
            </Select>
        </FormControl>
    </div>
}

export function IOCheckbox(props) {
    return <div>
        <FormControlLabel style={{paddingTop: 10}} label={I18n.t(props.label)} control={
            <Checkbox {...props}/>
        }/>
    </div>
}

export function IOTextField(props) {
    return <div>
        <TextField InputLabelProps={{shrink: true}} {...props} />
    </div>    
}

export function IOColorPicker(props) {
    return <div>
        <ColorPicker inputProps={{
           style: {backgroundColor: props.value}
        }} InputLabelProps={{shrink: true}} {...props} />
    </div>
}