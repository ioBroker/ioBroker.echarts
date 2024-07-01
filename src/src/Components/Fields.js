import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
    FormControl,
    Select,
    TextField,
    InputLabel,
    FormControlLabel,
    Checkbox,
    MenuItem,
    IconButton,
    Slider,
    Typography,
    Tooltip,
} from '@mui/material';

import {
    Subject as IconSelectID,
    Close as ClearIcon,
    Help as HelpIcon,
} from '@mui/icons-material';

import { I18n, SelectID as DialogSelectID, ColorPicker } from '@iobroker/adapter-react-v5';

const styles = {
    fieldContainer: {
        paddingTop: 10,
        whiteSpace: 'nowrap',
    },
    checkBoxLabel: {
        fontSize: '0.8rem',
        whiteSpace: 'break-spaces',
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
        paddingTop: 16,
    },
    selectIcon: {
        paddingRight: 4,
    },
    tooltip: {
        pointerEvents: 'none',
    },
};

const IOSelect = props => {
    const label = I18n.t(props.label);
    return <div style={{ ...(props.styles?.fieldContainer || styles.fieldContainer), ...props.style }}>
        <Tooltip
            title={props.tooltip ? I18n.t(props.tooltip) : null}
            componentsProps={{ popper: { sx: styles.tooltip } }}
        >
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
                                    {props.icons && props.icons[key] ? <span style={styles.selectIcon}>{props.icons[key]}</span> : null}
                                    {props.noTranslate ?
                                        props.options[key] :
                                        (props.options[key] !== '' && props.options[key] !== null && props.options[key] !== undefined ?
                                            (props.options[key].startsWith('-') ? `-${I18n.t(props.options[key].substring(1))}` : I18n.t(props.options[key])) : '')}
                                </MenuItem>) : null
                    }
                </Select>
            </FormControl>
        </Tooltip>
    </div>;
};
IOSelect.propTypes = {
    disabled: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string,
    formData: PropTypes.object,
    options: PropTypes.object,
    colors: PropTypes.object,
    icons: PropTypes.object,
};
export { IOSelect };

const IOCheckbox = props => <div style={props.styles?.fieldContainer || styles.fieldContainer}>
    <FormControlLabel
        style={{ paddingTop: 10 }}
        label={<span style={styles.checkBoxLabel}>{I18n.t(props.label)}</span>}
        control={
            <Checkbox
                disabled={!!props.disabled}
                onChange={e => props.updateValue(props.name, e.target.checked)}
                checked={props.formData[props.name] || false}
            />
        }
    />
</div>;
IOCheckbox.propTypes = {
    disabled: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string,
    formData: PropTypes.object,
};
export { IOCheckbox };

const IOTextField = props => <div style={props.styles?.fieldContainer || styles.fieldContainer}>
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

IOTextField.propTypes = {
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
export { IOTextField };

const IODateTimeField = props => <div style={props.styles?.fieldContainer || styles.fieldContainer}>
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
IODateTimeField.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    formData: PropTypes.object,
};
export { IODateTimeField };

const IOObjectField = props => {
    const [state, setState] = useState({});

    return <div style={{ ...(props.styles?.fieldContainer || styles.fieldContainer), width: props.width }}>
        <div style={props.styles?.objectContainer || styles.objectContainer}>
            <TextField
                variant="standard"
                disabled={!!props.disabled}
                style={props.styles?.objectField}
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
                style={styles.objectButton}
            >
                <IconSelectID />
            </IconButton>
        </div>
        {state.showDialog ? <DialogSelectID
            theme={props.theme}
            imagePrefix="../.."
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
IOObjectField.propTypes = {
    disabled: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string,
    formData: PropTypes.object,
    socket: PropTypes.object,
    customFilter: PropTypes.object,
};
export { IOObjectField };

const IOColorPicker = props => <div style={props.styles?.fieldContainer || styles.fieldContainer}>
    <ColorPicker
        disabled={!!props.disabled}
        variant="standard"
        label={I18n.t(props.label)}
        pickerStyle={styles.colorPicker}
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
IOColorPicker.propTypes = {
    disabled: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string,
    formData: PropTypes.object,
};
export { IOColorPicker };

const IOSlider = props => <div style={{ ...(props.styles?.fieldContainer || styles.fieldContainer), ...(props.styles?.sliderContainer || styles.sliderContainer) }}>
    <Typography style={props.styles?.sliderLabel || styles.sliderLabel}>{props.label}</Typography>
    <Slider
        disabled={!!props.disabled}
        style={props.styles?.sliderRoot || styles.sliderRoot}
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
IOSlider.propTypes = {
    disabled: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    formData: PropTypes.object,
};
export { IOSlider };
