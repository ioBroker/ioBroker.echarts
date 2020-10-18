import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import clsx from 'clsx';

import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';

import IconSelectID from '@material-ui/icons/Subject';

import I18n from '@iobroker/adapter-react/i18n';
import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';
import ColorPicker from './ColorPicker';
import ClearIcon from "@material-ui/icons/Close";
import HelpIcon from "@material-ui/icons/Help";

const styles = theme => ({
    fieldContainer: {
        paddingTop: 10,
        whiteSpace: 'nowrap'
    },
    checkBoxLabel: {
        fontSize: '0.8rem'
    },
    objectContainer: {display: 'flex'},
    objectField: {flex: 1},
    objectButton: {
        marginTop: 'auto',
        paddingLeft: 0
    },
    colorPicker: {
        left: -200,
        top: 60,
        position: 'relative'
    },
    sliderContainer: {
        position: 'relative',
        //height: theme.spacing(3),
    },
    sliderLabel: {
        position: 'absolute',
        top: 0,
        left: 0,
        fontSize: 'small'
    },
    sliderRoot: {
        paddingBottom: 0,
        paddingTop: theme.spacing(2),
    }
});

let IOSelect = function (props) {
    const label = I18n.t(props.label);
    return <div className={clsx(props.classes.fieldContainer, props.className)}>
        <FormControl style={{minWidth: props.minWidth || 200, width: props.width}}>
            <InputLabel shrink={true}>{ label }</InputLabel>
            <Select
                label={label}
                style={{color: props.colors ? props.colors[props.formData[props.name]] || undefined : undefined}}
                onChange={e => props.updateValue(props.name, e.target.value)}
                value={props.formData[props.name] || ''}
                renderValue={props.renderValue}
                displayEmpty
            >{
                props.options ?
                    Object.keys(props.options).map(key =>
                        <MenuItem key={key} value={key} style={{color: props.colors ? props.colors[key] || undefined : undefined}}>{
                            props.noTranslate ? props.options[key] : (props.options[key] !== '' && props.options[key] !== null && props.options[key] !== undefined? I18n.t(props.options[key]) : '')
                        }</MenuItem>)
                     : null
            }
            </Select>
        </FormControl>
    </div>;
};
IOSelect.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.any,
    formData: PropTypes.object,
    options: PropTypes.object,
    colors: PropTypes.object,
};
IOSelect = withStyles(styles)(IOSelect);
export {IOSelect};

let IOCheckbox = function (props) {
    return <div className={props.classes.fieldContainer}>
        <FormControlLabel style={{paddingTop: 10}} label={<span className={props.classes.checkBoxLabel}>{I18n.t(props.label)}</span>} control={
            <Checkbox onChange={e => {
                props.updateValue(props.name, e.target.checked)
            }} checked={props.formData[props.name] || false}/>
        }/>
    </div>;
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
            style={{width: props.formData[props.name] ? (props.width ? props.width - 30 : 'calc(100% - 30px)') : (props.width || '100%')}}
            label={I18n.t(props.label)}
            InputLabelProps={{shrink: true}}
            inputProps={{min: props.min, max: props.max}}
            onChange={e => props.updateValue(props.name, e.target.value)}
            value={props.formData[props.name] || ''}
            type={props.type}
            InputProps={{
                startAdornment: props.helperLink ? <IconButton
                    size="small"
                    onClick={() => window.open(props.helperLink,'_blank')}>
                    <HelpIcon />
                </IconButton> : undefined,

                endAdornment: props.formData[props.name] ?
                    <IconButton
                        size="small"
                        onClick={() => props.updateValue(props.name, '')}>
                        <ClearIcon />
                    </IconButton>
                    : undefined,
            }}
        />
    </div>;
};
IOTextField.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.any,
    formData: PropTypes.object,
    type: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    helperLink: PropTypes.string,
    width: PropTypes.number,
};
IOTextField = withStyles(styles)(IOTextField);
export {IOTextField};

let IODateTimeField = function (props) {
    return <div className={props.classes.fieldContainer}>
        <TextField type="datetime-local" label={I18n.t(props.label)} InputLabelProps={{shrink: true}} onChange={e => {
            let date = e.target.value.split('T');
            props.updateValue(props.name, date[0], date[1]);
        }} value={props.formData[props.name] ? props.formData[props.name] + 'T' + props.formData[props.name + '_time'] : ''}/>
    </div>;
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
                fullWidth={true}
                InputLabelProps={{shrink: true}}
                value={props.formData[props.name] || ''}
                onChange={e => props.updateValue(props.name, e.target.value)}
            />
            <IconButton size="small" onClick={() => setState({showDialog: true})} className={props.classes.objectButton}>
                <IconSelectID/>
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
    </div>;
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
            variant="standard"
            label={I18n.t(props.label)}
            pickerClassName={props.classes.colorPicker}
            inputProps={{
                style: {backgroundColor: props.formData[props.name]}
            }}
            InputProps={{
                endAdornment: props.formData[props.name] ?
                    <IconButton
                        size="small"
                        onClick={() => props.updateValue(props.name, '')}>
                        <ClearIcon />
                    </IconButton>
                    : undefined,
            }}
            onChange={color => props.updateValue(props.name, color)}
            InputLabelProps={{shrink: true}}
            value={props.formData[props.name] || ''}
        />
    </div>;
};
IOColorPicker.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.any,
    formData: PropTypes.object,
};
IOColorPicker = withStyles(styles)(IOColorPicker);
export {IOColorPicker};

let IOSlider = function (props) {
    return <div className={clsx(props.classes.fieldContainer, props.classes.sliderContainer)}>
        <Typography className={props.classes.sliderLabel}>{props.label}</Typography>
        <Slider
            classes={{root: props.classes.sliderRoot}}
            value={parseFloat(props.formData[props.name] || props.min || 0) || 0}
            //getAriaValueText={(props.formData[props.name] || '').toString()}
            step={parseFloat(props.step || (((props.max || 1) - (props.min || 0)) / 10)) || 0.1}
            marks
            onChange={(e, value) => props.updateValue(props.name, value)}
            min={parseFloat(props.min || 0)}
            max={parseFloat(props.max || 1)}
            valueLabelDisplay="auto"
        />
    </div>;
};
IOSlider.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.any,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    formData: PropTypes.object,
};
IOSlider = withStyles(styles)(IOSlider);
export {IOSlider};
