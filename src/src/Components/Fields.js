import React, {useState} from 'react';
import PropTypes from 'prop-types';

import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import ColorPicker from 'material-ui-color-picker'
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import {FaFolderOpen as IconFolderOpened} from 'react-icons/all';

import I18n from '@iobroker/adapter-react/i18n';
import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';

const IOSelect = function (props) {
    const label = I18n.t(props.label);
    return <div>
        <FormControl style={{minWidth: '200px'}}>
            <InputLabel shrink={true}>{ label }</InputLabel>
            <Select 
                label={label}
                onChange={(e) => {
                    props.updateValue(props.name, e.target.value)
                }} 
                value={props.formData[props.name] || ''}
                displayEmpty
            >
                {
                    props.options ? 
                    Object.keys(props.options).map((key) =>
                        <MenuItem key={key} value={key}>{I18n.t(props.options[key])}</MenuItem>)
                     : null
                }
            </Select>
        </FormControl>
    </div>
};
IOSelect.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.any,
    formData: PropTypes.object,
    options: PropTypes.object,
};
export {IOSelect};

const IOCheckbox = function (props) {
    return <div>
        <FormControlLabel style={{paddingTop: 10}} label={I18n.t(props.label)} control={
            <Checkbox onChange={(e) => {
                props.updateValue(props.name, e.target.checked)
            }} value={props.formData[props.name] || false}/>
        }/>
    </div>
};
IOCheckbox.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.any,
    formData: PropTypes.object,
};
export {IOCheckbox};

const IOTextField = function (props) {
    return <div>
        <TextField 
            label={I18n.t(props.label)}
            InputLabelProps={{shrink: true}} 
            onChange={(e) => {
                props.updateValue(props.name, e.target.value)
            }} 
            value={props.formData[props.name] || ''}
            type={props.type}
        />
    </div> 
};
IOTextField.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.any,
    formData: PropTypes.object,
    type: PropTypes.string,
};
export {IOTextField};

const IODateTimeField = function (props) {
    return <div>
        <TextField type="datetime-local" label={I18n.t(props.label)} InputLabelProps={{shrink: true}} onChange={(e) => {
            let date = e.target.value.split('T');
            props.updateValue(props.name, date[0], date[1]);
        }} value={props.formData[props.name] ? props.formData[props.name] + 'T' + props.formData[props.name + '_time'] : ''}/>
    </div> 
};
IODateTimeField.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.any,
    formData: PropTypes.object,
};
export {IODateTimeField};

const IOObjectField = function (props) {
    let [state, setState] = useState({});

    return <div>
        <TextField 
            label={I18n.t(props.label)}
            InputLabelProps={{shrink: true}} 
            value={props.formData[props.name] || ''}
            onChange={(e) => {
                props.updateValue(props.name, e.target.value)
            }}
        />
        <IconButton size="small" onClick={()=>{setState({showDialog: true})}} style={{verticalAlign: 'bottom'}}>
            <IconFolderOpened/>
        </IconButton>
        {state.showDialog ? <DialogSelectID
                key="selectDialog"
                socket={ props.socket }
                dialogName={props.name}
                customFilter={props.customFilter}
                title={ I18n.t('Select for ') + props.label}
                selected={ props.formData[props.name] }
                onOk={ (e) => {props.updateValue(props.name, e); setState({showDialog: false});} }
                onClose={ () => setState({showDialog: false}) }
            /> : null
        }
    </div>    
};
IOObjectField.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.any,
    formData: PropTypes.object,
    socket: PropTypes.object,
    customFilter: PropTypes.object,
};
export {IOObjectField};

const IOColorPicker = function (props) {
    return <div>
        <ColorPicker 
            label={I18n.t(props.label)}
            inputProps={{
                style: {backgroundColor: props.formData[props.name]}
            }} 
            onChange={(color) => {
                props.updateValue(props.name, color)
            }} 
            InputLabelProps={{shrink: true}}
            value={props.formData[props.name] || ''}
        />
    </div>
};
IOColorPicker.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.any,
    formData: PropTypes.object,
};
export {IOColorPicker};