import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';

import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
//import ColorPicker from 'material-ui-color-picker'
import ColorPicker from './ColorPicker';
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import {FaFolderOpen as IconFolderOpened} from 'react-icons/all';

import I18n from '@iobroker/adapter-react/i18n';
import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';

const styles = {
    fieldContainer: {
        paddingTop: '10px',
        whiteSpace: 'nowrap'
    },
    checkBoxLabel: {
        fontSize: '0.8rem'
    },
    objectContainer: {display: 'flex'},
    objectField: {flex: 1},
    objectButton: {
        marginTop: 'auto',
        paddingLeft: '10px'
    },
    colorPicker: {
        left: '-200px',
        top: '60px',
        position: 'relative'
    }
};

let IOSelect = function (props) {
    const label = I18n.t(props.label);
    return <div className={props.classes.fieldContainer}>
        <FormControl style={{minWidth: props.minWidth || 200, width: props.width}}>
            <InputLabel shrink={true}>{ label }</InputLabel>
            <Select 
                label={label}
                onChange={e => props.updateValue(props.name, e.target.value)}
                value={props.formData[props.name] || ''}
                displayEmpty
            >
                {
                    props.options ? 
                        Object.keys(props.options).map((key) =>
                            <MenuItem key={key} value={key}>{props.noTranslate ? props.options[key] : I18n.t(props.options[key])}</MenuItem>)
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
IOSelect = withStyles(styles)(IOSelect);
export {IOSelect};

let IOCheckbox = function (props) {
    return <div className={props.classes.fieldContainer}>
        <FormControlLabel style={{paddingTop: 10}} label={<span className={props.classes.checkBoxLabel}>{I18n.t(props.label)}</span>} control={
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
IOCheckbox = withStyles(styles)(IOCheckbox);
export {IOCheckbox};

let IOTextField = function (props) {
    return <div className={props.classes.fieldContainer}>
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
IOTextField = withStyles(styles)(IOTextField);
export {IOTextField};

let IODateTimeField = function (props) {
    return <div className={props.classes.fieldContainer}>
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
IODateTimeField = withStyles(styles)(IODateTimeField);
export {IODateTimeField};

let IOObjectField = function (props) {
    let [state, setState] = useState({});

    return <div className={props.classes.fieldContainer} style={{width: props.width}}>
        <div className={props.classes.objectContainer}>
            <TextField 
                className={props.classes.objectField}
                label={I18n.t(props.label)}
                InputLabelProps={{shrink: true}} 
                value={props.formData[props.name] || ''}
                onChange={(e) => props.updateValue(props.name, e.target.value)}
            />
            <IconButton size="small" onClick={() => setState({showDialog: true})} className={props.classes.objectButton}>
                <IconFolderOpened/>
            </IconButton>
        </div>
        {state.showDialog ? <DialogSelectID
                key={'selectDialog_' + props.name}
                socket={ props.socket }
                dialogName={props.name}
                customFilter={props.customFilter}
                title={ I18n.t('Select for ') + props.label}
                selected={ props.formData[props.name] }
                onOk={e => {
                    props.updateValue(props.name, e);
                    setState({showDialog: false});
                } }
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
IOObjectField = withStyles(styles)(IOObjectField);
export {IOObjectField};

let IOColorPicker = function (props) {
    return <div className={props.classes.fieldContainer}>
        <ColorPicker 
            label={I18n.t(props.label)}
            pickerClassName={props.classes.colorPicker}
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
IOColorPicker = withStyles(styles)(IOColorPicker);
export {IOColorPicker};