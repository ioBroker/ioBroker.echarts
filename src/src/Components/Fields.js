import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

import IconSelectID from '@mui/icons-material/Subject';
import ClearIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';

import { I18n, Utils } from '@iobroker/adapter-react-v5';
import DialogSelectID from '@iobroker/adapter-react-v5/Dialogs/SelectID';

import ColorPicker from './ColorPicker';

const styles = theme => ({
    fieldContainer: {
        paddingTop: 10,
        whiteSpace: 'nowrap',
    },
    checkBoxLabel: {
        fontSize: '0.8rem',
    },
    objectContainer: { display: 'flex' },
    objectField: { flex: 1 },
    objectButton: {
        marginTop: 'auto',
        paddingLeft: 0,
    },
    colorPicker: {
        left: -200,
        top: 60,
        position: 'relative',
    },
    sliderContainer: {
        position: 'relative',
        // height: theme.spacing(3),
    },
    sliderLabel: {
        position: 'absolute',
        top: 0,
        left: 0,
        fontSize: 'small',
    },
    sliderRoot: {
        paddingBottom: 0,
        paddingTop: theme.spacing(2),
    },
    selectIcon: {
        paddingRight: 4,
    },
});

const IOSelectClass = props => {
    const label = I18n.t(props.label);
    return <div className={Utils.clsx(props.classes.fieldContainer, props.className)}>
        <FormControl style={{ minWidth: props.minWidth || 200, width: props.width }} variant="standard">
            <InputLabel shrink>{label}</InputLabel>
            <Select
                variant="standard"
                disabled={!!props.disabled}
                label={label}
                style={{ color: props.colors ? props.colors[props.formData[props.name]] || undefined : undefined }}
                onChange={e => props.updateValue(props.name, e.target.value)}
                value={props.formData[props.name] || ''}
                renderValue={props.renderValue}
                displayEmpty
            >
                {
                    props.options ?
                        Object.keys(props.options).map(key =>
                            <MenuItem
                                key={key}
                                value={key}
                                style={{ color: props.colors ? props.colors[key] || undefined : undefined }}
                            >
                                {props.icons && props.icons[key] ? <span className={props.classes.selectIcon}>{props.icons[key]}</span> : null}
                                {props.noTranslate ?
                                    props.options[key] :
                                    (props.options[key] !== '' && props.options[key] !== null && props.options[key] !== undefined ?
                                        I18n.t(props.options[key].startsWith('-') ? `-${props.options[key].substring(1)}` : props.options[key]) : '')}
                            </MenuItem>) : null
                }
            </Select>
        </FormControl>
    </div>;
};
IOSelectClass.propTypes = {
    disabled: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string,
    formData: PropTypes.object,
    options: PropTypes.object,
    colors: PropTypes.object,
    icons: PropTypes.object,
};
const IOSelect = withStyles(styles)(IOSelectClass);
export { IOSelect };

const IOCheckboxClass = props => <div className={props.classes.fieldContainer}>
    <FormControlLabel
        style={{ paddingTop: 10 }}
        label={<span className={props.classes.checkBoxLabel}>{I18n.t(props.label)}</span>}
        control={
            <Checkbox
                disabled={!!props.disabled}
                onChange={e => props.updateValue(props.name, e.target.checked)}
                checked={props.formData[props.name] || false}
            />
        }
    />
</div>;
IOCheckboxClass.propTypes = {
    disabled: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string,
    formData: PropTypes.object,
};
const IOCheckbox = withStyles(styles)(IOCheckboxClass);
export { IOCheckbox };

const IOTextFieldClass = props => <div className={props.classes.fieldContainer}>
    <TextField
        variant="standard"
        disabled={!!props.disabled}
        style={{ width: props.formData[props.name] ? (props.width ? props.width - 30 : 'calc(100% - 30px)') : (props.width || '100%') }}
        label={I18n.t(props.label)}
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: props.min, max: props.max }}
        onChange={e => props.updateValue(props.name, e.target.value)}
        value={props.formData[props.name] || ''}
        type={props.type}
        title={props.title || ''}
        // eslint-disable-next-line react/jsx-no-duplicate-props
        InputProps={{
            startAdornment: !props.disabled && props.helperLink ? <IconButton
                size="small"
                onClick={() => {
                    if (typeof props.helperLink === 'function') {
                        props.helperLink();
                    } else {
                        window.open(props.helperLink, '_blank');
                    }
                }}
            >
                <HelpIcon />
            </IconButton> : undefined,

            endAdornment: !props.disabled && props.formData[props.name] ?
                <IconButton
                    size="small"
                    onClick={() => props.updateValue(props.name, '')}
                >
                    <ClearIcon />
                </IconButton>
                : undefined,
        }}
    />
</div>;

IOTextFieldClass.propTypes = {
    disabled: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string,
    formData: PropTypes.object,
    type: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    helperLink: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    width: PropTypes.number,
};
const IOTextField = withStyles(styles)(IOTextFieldClass);
export { IOTextField };

const IODateTimeFieldClass = props => <div className={props.classes.fieldContainer}>
    <TextField
        variant="standard"
        type="datetime-local"
        label={I18n.t(props.label)}
        InputLabelProps={{ shrink: true }}
        onChange={e => {
            const date = e.target.value.split('T');
            props.updateValue(props.name, date[0], date[1]);
        }}
        value={props.formData[props.name] ? `${props.formData[props.name]}T${props.formData[`${props.name}_time`]}` : ''}
    />
</div>;
IODateTimeFieldClass.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    formData: PropTypes.object,
};
const IODateTimeField = withStyles(styles)(IODateTimeFieldClass);
export { IODateTimeField };

const IOObjectFieldClass = props => {
    const [state, setState] = useState({});

    return <div className={props.classes.fieldContainer} style={{ width: props.width }}>
        <div className={props.classes.objectContainer}>
            <TextField
                variant="standard"
                disabled={!!props.disabled}
                className={props.classes.objectField}
                label={I18n.t(props.label)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={props.formData[props.name] || ''}
                onChange={e => props.updateValue(props.name, e.target.value)}
            />
            <IconButton
                disabled={!!props.disabled}
                size="small"
                onClick={() => setState({ showDialog: true })}
                className={props.classes.objectButton}
            >
                <IconSelectID />
            </IconButton>
        </div>
        {state.showDialog ? <DialogSelectID
            key={`selectDialog_${props.name}`}
            socket={props.socket}
            dialogName={props.name}
            customFilter={props.customFilter}
            title={I18n.t('Select for ') + props.label}
            selected={props.formData[props.name]}
            onOk={e => {
                props.updateValue(props.name, e);
                setState({ showDialog: false });
            }}
            onClose={() => setState({ showDialog: false })}
        /> : null}
    </div>;
};
IOObjectFieldClass.propTypes = {
    disabled: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string,
    formData: PropTypes.object,
    socket: PropTypes.object,
    customFilter: PropTypes.object,
};
const IOObjectField = withStyles(styles)(IOObjectFieldClass);
export { IOObjectField };

const IOColorPickerClass = props => <div className={props.classes.fieldContainer}>
    <ColorPicker
        disabled={!!props.disabled}
        variant="standard"
        label={I18n.t(props.label)}
        pickerClassName={props.classes.colorPicker}
        inputProps={{
            style: { backgroundColor: props.formData[props.name] },
        }}
        // eslint-disable-next-line react/jsx-no-duplicate-props
        InputProps={{
            endAdornment: !props.disabled && props.formData[props.name] ?
                <IconButton
                    size="small"
                    onClick={() => props.updateValue(props.name, '')}
                >
                    <ClearIcon />
                </IconButton>
                : undefined,
        }}
        onChange={color => props.updateValue(props.name, color)}
        InputLabelProps={{ shrink: true }}
        value={props.formData[props.name] || ''}
    />
</div>;
IOColorPickerClass.propTypes = {
    disabled: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string,
    formData: PropTypes.object,
};
const IOColorPicker = withStyles(styles)(IOColorPickerClass);
export { IOColorPicker };

const IOSliderClass = props => <div className={Utils.clsx(props.classes.fieldContainer, props.classes.sliderContainer)}>
    <Typography className={props.classes.sliderLabel}>{props.label}</Typography>
    <Slider
        disabled={!!props.disabled}
        classes={{ root: props.classes.sliderRoot }}
        value={parseFloat(props.formData[props.name] || props.min || 0) || 0}
        // getAriaValueText={(props.formData[props.name] || '').toString()}
        step={parseFloat(props.step || (((props.max || 1) - (props.min || 0)) / 10)) || 0.1}
        marks
        onChange={(e, value) => props.updateValue(props.name, value)}
        min={parseFloat(props.min || 0)}
        max={parseFloat(props.max || 1)}
        valueLabelDisplay="auto"
    />
</div>;
IOSliderClass.propTypes = {
    disabled: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    formData: PropTypes.object,
};
const IOSlider = withStyles(styles)(IOSliderClass);
export { IOSlider };
