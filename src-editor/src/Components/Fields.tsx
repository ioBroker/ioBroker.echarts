import React, { useState } from 'react';

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

import { Subject as IconSelectID, Close as ClearIcon, Help as HelpIcon } from '@mui/icons-material';

import { I18n, DialogSelectID, type AdminConnection, type IobTheme } from '@iobroker/adapter-react-v5';

const styles: Record<string, React.CSSProperties> = {
    fieldContainer: {
        paddingTop: 10,
        whiteSpace: 'nowrap',
    },
    checkBoxLabel: {
        fontSize: '0.8rem',
        whiteSpace: 'break-spaces',
    },
    objectContainer: { display: 'flex', alignItems: 'center' },
    objectField: { flex: 1 },
    objectButton: {
        marginTop: 'auto',
        paddingLeft: 0,
        maxHeight: 29,
        height: 29,
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

interface IOProps {
    label: string;

    disabled?: boolean;
    tooltip?: string;
    styles?: Record<string, React.CSSProperties>;
    style?: React.CSSProperties;
    fullWidth?: boolean;
}

interface IOSelectProps extends Omit<IOProps, 'updateValue'> {
    value: string;
    updateValue: (value: string) => void;
    options: Record<string, string>;
    colors?: Record<string, string>;
    icons?: Record<string, React.JSX.Element>;
    minWidth?: number;
    width?: string | number;
    noTranslate?: boolean;
    renderValue?: (value: any) => React.JSX.Element;
}

export const IOSelect = (props: IOSelectProps): React.JSX.Element => {
    const label = I18n.t(props.label);
    return (
        <div
            style={{
                ...(props.fullWidth ? { width: '100%' } : undefined),
                ...(props.styles?.fieldContainer || styles.fieldContainer),
                ...props.style,
            }}
        >
            <Tooltip
                title={props.tooltip ? I18n.t(props.tooltip) : null}
                slotProps={{ popper: { style: styles.tooltip } }}
            >
                <FormControl
                    fullWidth={props.fullWidth}
                    style={{ minWidth: props.minWidth || 200, width: props.width }}
                    variant="standard"
                >
                    <InputLabel shrink>{label}</InputLabel>
                    <Select
                        fullWidth={props.fullWidth}
                        variant="standard"
                        disabled={!!props.disabled}
                        label={label}
                        style={{
                            color: props.colors ? props.colors[props.value] || undefined : undefined,
                        }}
                        onChange={e => props.updateValue(e.target.value)}
                        value={props.value || ''}
                        renderValue={props.renderValue}
                        displayEmpty
                    >
                        {props.options
                            ? Object.keys(props.options).map(key =>
                                  props.options[key] === undefined ? null : (
                                      <MenuItem
                                          key={key}
                                          value={key}
                                          style={{ color: props.colors ? props.colors[key] || undefined : undefined }}
                                      >
                                          {props.icons && props.icons[key] ? (
                                              <span style={styles.selectIcon}>{props.icons[key]}</span>
                                          ) : null}
                                          {props.noTranslate
                                              ? props.options[key]
                                              : props.options[key] !== '' &&
                                                  props.options[key] !== null &&
                                                  props.options[key] !== undefined
                                                ? props.options[key].startsWith('-')
                                                    ? `-${I18n.t(props.options[key].substring(1))}`
                                                    : I18n.t(props.options[key])
                                                : ''}
                                      </MenuItem>
                                  ),
                              )
                            : null}
                    </Select>
                </FormControl>
            </Tooltip>
        </div>
    );
};

interface IOCheckboxProps extends Omit<IOProps, 'updateValue'> {
    value: boolean;
    updateValue: (value: boolean) => void;
}
export const IOCheckbox = (props: IOCheckboxProps): React.JSX.Element => (
    <div
        style={{
            ...(props.fullWidth ? { width: '100%' } : undefined),
            ...(props.styles?.fieldContainer || styles.fieldContainer),
        }}
    >
        <FormControlLabel
            style={{ paddingTop: 10 }}
            label={<span style={styles.checkBoxLabel}>{I18n.t(props.label)}</span>}
            control={
                <Checkbox
                    disabled={!!props.disabled}
                    onChange={e => props.updateValue(e.target.checked)}
                    checked={props.value || false}
                />
            }
        />
    </div>
);

interface IOTextFieldProps extends IOProps {
    value: string;
    updateValue: (value: string) => void;
    helperLink?: string | (() => void);
    width?: number;
    minWidth?: number | string;
}

export const IOTextField = (props: IOTextFieldProps): React.JSX.Element => (
    <div
        style={{
            ...(props.fullWidth ? { width: '100%' } : undefined),
            ...(props.styles?.fieldContainer || styles.fieldContainer),
        }}
    >
        <TextField
            variant="standard"
            disabled={!!props.disabled}
            fullWidth
            style={{
                minWidth: props.minWidth,
            }}
            label={I18n.t(props.label)}
            onChange={e => props.updateValue(e.target.value)}
            value={props.value || ''}
            type="text"
            title={props.tooltip || ''}
            slotProps={{
                inputLabel: {
                    shrink: true,
                },
                input: {
                    startAdornment:
                        !props.disabled && props.helperLink ? (
                            <IconButton
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
                            </IconButton>
                        ) : undefined,

                    endAdornment:
                        !props.disabled && props.value ? (
                            <IconButton
                                size="small"
                                onClick={() => props.updateValue('')}
                            >
                                <ClearIcon />
                            </IconButton>
                        ) : undefined,
                },
            }}
        />
    </div>
);

interface IONumberFieldProps extends IOProps {
    value: number;
    updateValue: (value: number) => void;
    min?: number;
    max?: number;
    width?: number;
}

export const IONumberField = (props: IONumberFieldProps): React.JSX.Element => (
    <div
        style={{
            ...(props.fullWidth ? { width: '100%' } : undefined),
            ...(props.styles?.fieldContainer || styles.fieldContainer),
        }}
    >
        <TextField
            variant="standard"
            disabled={!!props.disabled}
            fullWidth={props.fullWidth}
            style={{
                width: props.width || '100%',
            }}
            label={I18n.t(props.label)}
            onChange={e => props.updateValue(parseInt(e.target.value))}
            value={props.value || ''}
            type="number"
            title={props.tooltip || ''}
            slotProps={{
                inputLabel: {
                    shrink: true,
                },
                htmlInput: {
                    min: props.min,
                    max: props.max,
                },
            }}
        />
    </div>
);

interface IODateTimeFieldProps extends Omit<IOProps, 'updateValue'> {
    date: string;
    time: string;
    updateValue: (date: string, time: string) => void;
}

export const IODateTimeField = (props: IODateTimeFieldProps): React.JSX.Element => (
    <div
        style={{
            ...(props.fullWidth ? { width: '100%' } : undefined),
            ...(props.styles?.fieldContainer || styles.fieldContainer),
        }}
    >
        <TextField
            variant="standard"
            type="datetime-local"
            label={I18n.t(props.label)}
            fullWidth={props.fullWidth}
            slotProps={{
                inputLabel: {
                    shrink: true,
                },
            }}
            onChange={e => {
                const date = e.target.value.split('T');
                props.updateValue(date[0], date[1]);
            }}
            value={props.date ? `${props.date}T${props.time}` : ''}
        />
    </div>
);

interface IOObjectFieldProps extends IOProps {
    name: string;
    value: string;
    updateValue: (value: string) => void;
    socket: AdminConnection;
    customFilter?: Record<string, any>;
    width?: number | string;
    theme: IobTheme;
    minWidth?: string | number;
    ref?: React.RefObject<HTMLInputElement>;
}
export const IOObjectField = (props: IOObjectFieldProps): React.JSX.Element => {
    const [showDialog, setShowDialog] = useState(false);

    return (
        <div
            style={{
                ...(props.fullWidth ? { width: '100%' } : undefined),
                ...(props.styles?.fieldContainer || styles.fieldContainer),
                width: props.width,
                minWidth: props.minWidth,
            }}
        >
            <div
                style={{
                    ...(props.fullWidth ? { width: '100%' } : undefined),
                    ...(props.styles?.objectContainer || styles.objectContainer),
                }}
            >
                <TextField
                    variant="standard"
                    disabled={!!props.disabled}
                    style={props.styles?.objectField}
                    label={I18n.t(props.label)}
                    fullWidth
                    ref={props.ref}
                    slotProps={{
                        inputLabel: {
                            shrink: true,
                        },
                        input: {
                            endAdornment:
                                !props.disabled && props.value ? (
                                    <IconButton
                                        size="small"
                                        onClick={() => props.updateValue('')}
                                    >
                                        <ClearIcon />
                                    </IconButton>
                                ) : undefined,
                        },
                    }}
                    value={props.value || ''}
                    onChange={e => props.updateValue(e.target.value)}
                />
                <IconButton
                    disabled={!!props.disabled}
                    size="small"
                    onClick={() => setShowDialog(true)}
                    style={styles.objectButton}
                >
                    <IconSelectID />
                </IconButton>
            </div>
            {showDialog ? (
                <DialogSelectID
                    theme={props.theme}
                    imagePrefix="../.."
                    key={`selectDialog_${props.name}`}
                    socket={props.socket}
                    dialogName={props.name}
                    customFilter={props.customFilter}
                    title={`${I18n.t('Select for')} ${props.label}`}
                    selected={props.value}
                    onOk={(e: string | string[]): void => {
                        if (Array.isArray(e)) {
                            props.updateValue(e[0] || '');
                        } else {
                            props.updateValue(e);
                        }
                        setShowDialog(false);
                    }}
                    onClose={() => setShowDialog(false)}
                />
            ) : null}
        </div>
    );
};

interface IOSliderProps extends IOProps {
    value: number;
    updateValue: (value: number) => void;
    min: number;
    max: number;
    step: number;
}
export const IOSlider = (props: IOSliderProps): React.JSX.Element => (
    <div
        style={{
            ...(props.styles?.fieldContainer || styles.fieldContainer),
            ...(props.styles?.sliderContainer || styles.sliderContainer),
        }}
    >
        <Typography style={props.styles?.sliderLabel || styles.sliderLabel}>{props.label}</Typography>
        <Slider
            disabled={!!props.disabled}
            style={props.styles?.sliderRoot || styles.sliderRoot}
            value={parseFloat((props.value as unknown as string) || (props.min as unknown as string)) || 0}
            // getAriaValueText={(props.formData[props.name] || '').toString()}
            step={
                parseFloat(props.step as unknown as string) ||
                (parseFloat(props.max as unknown as string) || 1) -
                    (parseFloat(props.min as unknown as string) || 0) / 10 ||
                0.1
            }
            marks
            onChange={(_e, value) => props.updateValue(value as number)}
            min={parseFloat(props.min as unknown as string) || 0}
            max={parseFloat(props.max as unknown as string) || 1}
            valueLabelDisplay="auto"
        />
    </div>
);
