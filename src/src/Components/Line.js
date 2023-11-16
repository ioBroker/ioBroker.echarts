import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';

import {
    MdDelete as IconDelete,
    MdEdit as IconEdit,
    MdContentCopy as IconCopy,
    MdMenu as IconDrag, MdContentPaste as IconPaste,
    MdClose as IconClose,
} from 'react-icons/md';

import { FaFolder as IconFolderClosed, FaFolderOpen as IconFolderOpened } from 'react-icons/fa';

import { I18n, Utils } from '@iobroker/adapter-react-v5';
import ColorPicker from '@iobroker/adapter-react-v5/Components/ColorPicker';

import TextField from '@mui/material/TextField';
import ClearIcon from '@mui/icons-material/Close';
import {
    IOTextField, IOCheckbox, IOSelect, IOObjectField, IOSlider,
} from './Fields';

import LineDialog from './LineDialog';
import EditStatesDialog from './EditStatesDialog';

const WIDTHS = {
    instance: 100,
    id: 200,
    chartType: 120,
    dataType: 110,
    color: 100,
    name: 200,
    buttons: 50 + 50 + 16 + 50,
};

const LINE_HEIGHT = 48;

const styles = theme => ({
    card: {
        borderStyle: 'dashed',
        borderWidth: 1,
        marginBottom: theme.spacing(1),
        padding: theme.spacing(1),
        borderColor: theme.palette.grey['600'],
        overflow: 'initial',
    },
    cardPaste: {
        borderColor: theme.type === 'dark' ? theme.palette.grey['400'] : theme.palette.grey['800'],
        backgroundColor: 'rgba(0,0,0,0)',
        opacity: 0.8,
    },
    cardContent: {
        padding: 0,
        margin: 0,
        '&:last-child': {
            padding: 0,
        },
    },
    shortFields: {
        display: 'block',
        '& > div': {
            display: 'inline-flex',
            paddingRight: 20,
            width: 200,
        },
        position: 'relative',
        paddingBottom: theme.spacing(2),
        borderBottom: `1px dotted ${theme.palette.grey[400]}`,
    },
    lineClosed: {
        display: 'flex',
    },
    title: {
        width: 'inherit',
        position: 'absolute',
        whiteSpace: 'nowrap',
        right: 0,
        fontSize: 48,
        opacity: 0.1,
        lineHeight: '48px',
        padding: 0,
        marginTop: 20,
        marginLeft: 0,
        marginRight: 0,
        marginBottom: 0,
        paddingRight: 10,
    },
    shortFieldsLast: {
        borderBottom: '0px',
        paddingBottom: 0,
    },
    shortInstanceField: {
        display: 'inline-block',
        minWidth: WIDTHS.instance,
        paddingTop: 0,
        lineHeight: `${LINE_HEIGHT}px`,
        verticalAlign: 'top',
    },
    shortIdField: {
        display: 'inline-block',
        minWidth: WIDTHS.id,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: `${LINE_HEIGHT}px`,
        verticalAlign: 'top',
    },
    shortDataTypeField: {
        lineHeight: `${LINE_HEIGHT}px`,
        display: 'inline-block',
        minWidth: WIDTHS.dataType,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        verticalAlign: 'top',
    },
    shortChartTypeField: {
        display: 'inline-block',
        minWidth: WIDTHS.chartType,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: `${LINE_HEIGHT}px`,
        verticalAlign: 'top',
    },
    shortColorField: {
        display: 'inline-block',
        minWidth: WIDTHS.color,
        width: WIDTHS.color,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: `${LINE_HEIGHT}px`,
        verticalAlign: 'top',
    },
    shortNameField: {
        display: 'inline-block',
        minWidth: WIDTHS.name,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: `${LINE_HEIGHT}px`,
        verticalAlign: 'top',
    },
    shortButtonsField: {
        display: 'inline-block',
        minWidth: WIDTHS.buttons,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: `${LINE_HEIGHT}px`,
        verticalAlign: 'top',
    },
    editButton: {
        float: 'right',
    },
    deleteButton: {
        float: 'right',
        marginRight: 12,
    },
    editButtonFull: {
        float: 'right',
    },
    deleteButtonFull: {
        float: 'right',
        marginRight: 12,
    },
    copyButtonFull: {
        float: 'right',
        marginRight: 0,
    },
    fullWidth: {
        width: '100%',
        minWidth: 200,
    },
    paste: {
        opacity: 0.3,
    },
    emptyDrag: {
        display: 'inline-block',
        width: 16,
    },

    chapterMain: {
        backgroundColor: 'rgba(3,104,255,0.1)',
    },
    chapterTexts: {
        backgroundColor: 'rgba(101,253,0,0.1)',
    },
    chapterLine: {
        backgroundColor: 'rgba(255,20,0,0.1)',
    },
    chapterAxis: {
        backgroundColor: 'rgba(179,2,255,0.1)',
    },
    chapterOther: {
        backgroundColor: 'rgba(255,146,0,0.1)',
    },
    states: {
        verticalAlign: 'top',
        marginTop: 12,
    },
    state: {
        textAlign: 'center',
        marginRight: 8,
    },
    stateValue: {
        fontSize: 10,
    },
    stateText: {
        fontSize: 12,
        fontStyle: 'italic',
        display: 'block',
        whiteSpace: 'nowrap',
    },
});

class LineComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            width: this.props.width,
            dialogOpen: false,
            showConvertHelp: false,
            isBoolean: false,
            withStates: null,
        };

        if (this.props.line.id) {
            this.props.socket.getObject(this.props.line.id)
                .then(obj => {
                    let newState = null;
                    if (obj?.common?.type === 'boolean') {
                        newState = { isBoolean: true };
                    }
                    // we expect states only for enums, like: {0: 'OFF', 1: 'ON', '-1': 'whatever'}
                    if (obj?.common?.states && !Array.isArray(obj.common.states) && !obj.common.unit) {
                        newState = newState || {};
                        newState.withStates = obj.common.states;
                        newState.originalStates = JSON.stringify(obj.common.states);
                        if (this.props.line.states) {
                            Object.assign(newState.withStates, this.props.line.states);
                        } else if (this.props.line.states === false) {
                            newState.withStates = false;
                        }
                    }

                    if (newState) {
                        this.setState(newState);
                    }
                })
                .catch(() => { /* ignore */ });
        }
    }

    updateField = (name, value) => {
        const line = JSON.parse(JSON.stringify(this.props.line));
        line[name] = value;

        if (name === 'id') {
            // If ID changed => read unit and name
            if (this.props.line.id !== value) {
                this.props.socket.getObject(value)
                    .then(obj => {
                        if (obj && obj.common && obj.common.name) {
                            name = Utils.getObjectNameFromObj(obj, null, { language: I18n.getLanguage() });
                        } else {
                            const _name = value.split('.');
                            name = _name.length ? _name[_name.length - 1] : '';
                        }
                        if (obj && obj.common && obj.common.unit) {
                            line.unit = obj.common.unit;
                        }
                        if (obj && obj.common && (obj.common.type === 'boolean' || obj.common.type === 'number')) {
                            line.chartType = 'auto';
                            line.aggregate = '';
                        }

                        const newState = { isBoolean: obj?.common?.type === 'boolean' };
                        // we expect states only for enums, like: {0: 'OFF', 1: 'ON', '-1': 'whatever'}
                        if (obj?.common?.states && !Array.isArray(obj.common.states) && !obj.common.unit) {
                            newState.withStates = obj.common.states;
                            newState.originalStates = JSON.stringify(obj.common.states);
                            // merge with existing states
                            if (line.states) {
                                Object.assign(newState.withStates, line.states);
                            } else if (line.states === false) {
                                newState.withStates = false;
                            }
                        } else {
                            newState.withStates = null;
                            delete line.states;
                        }

                        if (newState.isBoolean !== this.state.isBoolean ||
                            JSON.stringify(this.state.withStates) !== JSON.stringify(newState.withStates) ||
                            this.state.originalStates !== newState.originalStates
                        ) {
                            setTimeout(_newState => this.setState(_newState), 50, newState);
                        }
                    })
                    .catch(e => {
                        console.error(e);
                        const _name = value.split('.');
                        name = _name.length ? _name[_name.length - 1] : '';
                    })
                    .then(() => {
                        line.name = name;
                        this.props.updateLine(this.props.index, line);
                    });
                return;
            }
        } else if (name === 'fill' && value < 0.01 && !parseFloat(line.thickness)) {
            line.thickness = 1;
        } else if (name === 'aggregate' && value === 'percentile' && (line.percentile === undefined || line.percentile < 0 || line.percentile > 100)) {
            line.percentile = 50;
        } else if (name === 'aggregate' && value === 'integral') {
            line.integralUnit = line.integralUnit || 60;
            line.integralInterpolation = line.integralInterpolation || 'none';
        }

        this.props.updateLine(this.props.index, line);
    };

    static getDerivedStateFromProps(props, state) {
        if (props.width !== state.width) {
            return { width: props.width };
        }
        return null;
    }

    renderClosedLine() {
        const visible = {};

        const windowWidth = this.props.width - 95;
        const padding = 8;

        let idWidth;
        if (windowWidth >= WIDTHS.instance + WIDTHS.id + WIDTHS.chartType + WIDTHS.dataType + WIDTHS.color + WIDTHS.name + WIDTHS.buttons + padding * 6) {
            idWidth = `calc(100% - ${WIDTHS.instance + WIDTHS.chartType + WIDTHS.dataType + WIDTHS.color + WIDTHS.name + WIDTHS.buttons + padding * 6}px)`;
            visible.chartType = true;
            visible.dataType = true;
            visible.color = true;
            visible.name = true;
        } else if (windowWidth >= WIDTHS.instance + WIDTHS.id + WIDTHS.chartType + WIDTHS.dataType + WIDTHS.color + WIDTHS.buttons + padding * 5) {
            idWidth = `calc(100% - ${WIDTHS.buttons + WIDTHS.instance + WIDTHS.chartType + WIDTHS.dataType + WIDTHS.color + padding * 5}px)`;
            visible.chartType = true;
            visible.dataType = true;
            visible.color = true;
        } else if (windowWidth >= WIDTHS.instance + WIDTHS.id + WIDTHS.chartType + WIDTHS.dataType + WIDTHS.buttons + padding * 4) {
            idWidth = `calc(100% - ${WIDTHS.buttons + WIDTHS.instance + WIDTHS.chartType + WIDTHS.dataType + padding * 4}px)`;
            visible.chartType = true;
            visible.dataType = true;
        } else if (windowWidth >= WIDTHS.instance + WIDTHS.id + WIDTHS.chartType + WIDTHS.buttons + padding * 3) {
            // nothing visible
            idWidth = `calc(100% - ${WIDTHS.buttons + WIDTHS.instance + WIDTHS.chartType + padding * 3}px)`;
            visible.chartType = true;
        } else {
            // nothing visible
            idWidth = `calc(100% - ${WIDTHS.buttons + WIDTHS.instance + padding * 2}px)`;
        }

        const hasBar = this.props.presetData.lines.find(line => line.chartType === 'bar');
        const aggregateTypes = {
            minmax: 'minmax',
            average: 'average',
            min: 'min',
            max: 'max',
            total: 'total',
            onchange: 'raw',
            percentile: 'percentile',
            integral: 'integral',
        };

        if (hasBar) {
            delete aggregateTypes.minmax;
        }

        return <div className={this.props.classes.lineClosed}>
            {this.props.provided ? <span title={I18n.t('Drag me')} {...this.props.provided.dragHandleProps}><IconDrag /></span> : <div className={this.props.classes.emptyDrag} /> }
            {this.props.onPaste && this.props.onPaste ?
                <IconButton
                    title={I18n.t('Paste')}
                    onClick={() => this.props.onPaste()}
                >
                    <IconPaste />
                </IconButton>
                :
                <IconButton
                    title={I18n.t('Edit')}
                    onClick={() => this.props.lineOpenToggle(this.props.index)}
                >
                    <IconFolderClosed />
                </IconButton>}
            <IOSelect
                disabled={!!this.props.onPaste}
                formData={this.props.line}
                updateValue={this.updateField}
                name="instance"
                label="Source"
                noTranslate
                options={(() => {
                    const result = { '': I18n.t('standard') };
                    this.props.instances.forEach(instance => result[instance._id] = instance._id.replace('system.adapter.', ''));
                    result.json = 'JSON';
                    return result;
                })()}
                minWidth={WIDTHS.instance}
                classes={{ fieldContainer: Utils.clsx(this.props.classes.shortInstanceField, this.props.onPaste && this.props.classes.paste) }}
            />
            <IOObjectField
                disabled={!!this.props.onPaste}
                formData={this.props.line}
                updateValue={this.updateField}
                name="id"
                width={idWidth}
                label="ID"
                customFilter={this.props.line.instance !== 'json' ? {
                    common: {
                        custom: this.props.line.instance ? this.props.line.instance.replace('system.adapter.', '') : this.props.systemConfig.common.defaultHistory || true,
                    },
                } : null}
                classes={{ fieldContainer: Utils.clsx(this.props.classes.shortIdField, this.props.onPaste && this.props.classes.paste) }}
                socket={this.props.socket}
            />
            {visible.chartType ? <IOSelect
                disabled={!!this.props.onPaste}
                formData={this.props.line}
                updateValue={this.updateField}
                minWidth={WIDTHS.chartType}
                name="chartType"
                label="Chart type"
                options={{
                    auto: 'Auto',
                    line: 'Line',
                    bar: 'Bar',
                    scatterplot: 'Scatter plot',
                    steps: 'Steps',
                    stepsStart: 'Steps on start',
                    spline: 'Spline',
                }}
                classes={{ fieldContainer: Utils.clsx(this.props.classes.shortChartTypeField, this.props.onPaste && this.props.classes.paste) }}
            /> : null}
            {this.props.line.instance !== 'json' && visible.dataType && this.props.line.chartType !== 'auto' ? <IOSelect
                disabled={!!this.props.onPaste}
                formData={this.props.line}
                updateValue={this.updateField}
                minWidth={WIDTHS.dataType}
                name="aggregate"
                label="Type"
                options={aggregateTypes}
                classes={{ fieldContainer: Utils.clsx(this.props.classes.shortDataTypeField, this.props.onPaste && this.props.classes.paste) }}
            /> : null}
            {visible.color ? this.renderColorField(this.props.line, this.updateField, 'Color', 'color', WIDTHS.color, Utils.clsx(this.props.classes.shortColorField, this.props.onPaste && this.props.classes.paste), true) : null}
            {visible.name ? <IOTextField
                disabled={!!this.props.onPaste}
                width={WIDTHS.name}
                formData={this.props.line}
                updateValue={this.updateField}
                name="name"
                label="Name"
                classes={{ fieldContainer: Utils.clsx(this.props.classes.shortNameField, this.props.onPaste && this.props.classes.paste) }}
            /> : null}
            <IconButton
                className={this.props.classes.deleteButton}
                aria-label="Delete"
                title={I18n.t('Delete')}
                onClick={() => this.props.deleteLine(this.props.index)}
            >
                <IconDelete />
            </IconButton>
            {this.props.line.chartType !== 'scatterplot' && this.props.line.chartType !== 'bar' ? <IconButton
                className={this.props.classes.editButton}
                aria-label="Edit"
                title={I18n.t('Edit')}
                onClick={() => this.setState({ dialogOpen: true })}
            >
                <IconEdit />
            </IconButton> : null}
        </div>;
    }

    renderColorField(formData, onUpdate, label, name, minWidth, className, noPadding) {
        let textColor = Utils.isUseBright(formData[name], null);
        if (textColor === null) {
            textColor = undefined;
        }
        return <div className={className}>
            <TextField
                variant="standard"
                disabled={!!this.props.onPaste}
                style={{ minWidth, width: 'calc(100% - 8px)' }}
                label={I18n.t(label)}
                value={formData[name] || ''}
                onClick={() =>
                    !this.props.onPaste && this.setState({ [`_${name}`]: formData[name] }, () =>
                        this.props.onSelectColor(this.state[`_${name}`], color =>
                            this.setState({ [`_${name}`]: color }, () =>
                                onUpdate(name, ColorPicker.getColor(color, true)))))}
                onChange={e => {
                    const color = e.target.value;
                    this.setState({ [`_${name}`]: color }, () =>
                        onUpdate(name, color));
                }}
                inputProps={{ style: { paddingLeft: noPadding ? 0 : 8, backgroundColor: formData[name], color: textColor ? '#FFF' : '#000' } }}
                // eslint-disable-next-line react/jsx-no-duplicate-props
                InputProps={{
                    endAdornment: formData[name] ?
                        <IconButton
                            disabled={!!this.props.onPaste}
                            size="small"
                            onClick={e => {
                                e.stopPropagation();
                                this.setState({ [`_${name}`]: '' }, () => onUpdate(name, ''));
                            }}
                        >
                            <ClearIcon />
                        </IconButton>
                        : undefined,
                }}
                InputLabelProps={{ shrink: true }}
            />
        </div>;
    }

    showConvertHelp = () => this.setState({ showConvertHelp: true });

    renderConvertHelp() {
        if (!this.state.showConvertHelp) {
            return null;
        }

        return <Dialog
            open={!0}
            onClose={() => this.setState({ showConvertHelp: false })}
        >
            <DialogTitle></DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {I18n.t('convert_help')}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    onClick={() => this.setState({ showConvertHelp: false })}
                    color="primary"
                    startIcon={<IconClose />}
                >
                    {I18n.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    renderStates() {
        if (this.state.withStates === null) {
            return null;
        }
        return <div className={this.props.classes.states}>
            {this.state.withStates ?
                Object.keys(this.state.withStates)
                    .map(val =>
                        <div key={val} className={this.props.classes.state}>
                            <span className={this.props.classes.stateValue}>{val}</span>
                            ↓
                            <span className={this.props.classes.stateText}>{this.state.withStates[val]}</span>
                        </div>)
                :
                <div className={this.props.classes.state}>
                    <span className={this.props.classes.stateText}>{I18n.t('Text values not used')}</span>
                </div>}
            <Button
                variant="outlined"
                onClick={() => this.setState({ showStatesEdit: true })}
                startIcon={<IconEdit />}
                title={I18n.t('Edit state names')}
            >
                ...
            </Button>

            {this.state.showStatesEdit ? <EditStatesDialog
                withStates={this.state.withStates}
                originalStates={this.state.originalStates}
                isBoolean={this.state.isBoolean}
                onClose={withStates => {
                    if (withStates !== undefined) {
                        this.setState({ showStatesEdit: false, withStates: JSON.parse(JSON.stringify(withStates)) });
                        if (withStates) {
                            const states = JSON.parse(JSON.stringify(withStates));
                            const originalStates = JSON.parse(this.state.originalStates);
                            Object.keys(states).forEach(val => {
                                if (states[val] === originalStates[val]) {
                                    delete states[val];
                                }
                            });
                            this.updateField('states', states);
                        } else {
                            this.updateField('states', false);
                        }
                    } else {
                        this.setState({ showStatesEdit: false });
                    }
                }}
            /> : null}
        </div>;
    }

    renderOpenedLine() {
        const xAxisOptions = {
            '': I18n.t('own axis'),
        };
        for (let i = 0; i < this.props.maxLines; i++) {
            if (i !== this.props.index) {
                if (this.props.presetData.lines[i].commonYAxis === undefined || this.props.presetData.lines[i].commonYAxis === '') {
                    xAxisOptions[i] = I18n.t('From line %s', i + 1);
                }
            }
        }
        const hasBar = this.props.presetData.lines.find(line => line.chartType === 'bar');

        const chartTypes = {
            auto: 'Auto (Line or Steps)',
            line: 'Line',
            bar: 'Bar',
            scatterplot: 'Scatter plot',
            steps: 'Steps',
            stepsStart: 'Steps on start',
            spline: 'Spline',
        };

        const aggregateTypes = {
            minmax: 'minmax',
            average: 'average',
            min: 'min',
            max: 'max',
            total: 'total',
            onchange: 'raw',
            percentile: 'percentile',
            integral: 'integral',
        };

        if (hasBar) {
            delete aggregateTypes.minmax;
        }

        const ownYAxis = this.props.line.commonYAxis === '' || this.props.line.commonYAxis === undefined;
        return <>
            <div>
                {this.props.provided ? <span title={I18n.t('Drag me')} {...this.props.provided.dragHandleProps}><IconDrag /></span> : null }
                <IconButton
                    title={I18n.t('Edit')}
                    onClick={() => this.props.lineOpenToggle(this.props.index)}
                >
                    <IconFolderOpened />
                </IconButton>
                {I18n.t('Line')}
                {' '}
                {this.props.index + 1}
                {this.props.line.name ? ` - ${this.props.line.name}` : ''}
                <IconButton
                    className={this.props.classes.deleteButtonFull}
                    aria-label="Delete"
                    title={I18n.t('Delete')}
                    onClick={() => this.props.deleteLine(this.props.index)}
                >
                    <IconDelete />
                </IconButton>
                {this.props.line.chartType !== 'scatterplot' && this.props.line.chartType !== 'bar' ? <IconButton
                    className={this.props.classes.editButtonFull}
                    aria-label="Edit"
                    title={I18n.t('Edit')}
                    onClick={() => this.setState({ dialogOpen: true })}
                >
                    <IconEdit />
                </IconButton> : null}
                <IconButton
                    className={this.props.classes.copyButtonFull}
                    aria-label="Copy"
                    title={I18n.t('Copy')}
                    onClick={() => this.props.onCopy(this.props.line)}
                >
                    <IconCopy />
                </IconButton>
            </div>
            <div className={this.props.classes.shortFields}>
                <IOSelect
                    formData={this.props.line}
                    updateValue={this.updateField}
                    name="instance"
                    label="Source"
                    noTranslate
                    options={(() => {
                        const result = {};
                        this.props.instances.forEach(instance => result[instance._id] = instance._id.replace('system.adapter.', ''));
                        result.json = 'JSON';
                        return result;
                    })()}
                />
                <IOObjectField
                    formData={this.props.line}
                    classes={{ objectContainer: this.props.classes.fullWidth }}
                    updateValue={this.updateField}
                    name="id"
                    label="ID"
                    width="calc(100% - 250px)"
                    customFilter={this.props.line.instance !== 'json' ? {
                        common: {
                            custom: this.props.line.instance ? this.props.line.instance.replace('system.adapter.', '') : this.props.systemConfig.common.defaultHistory || true,
                        },
                    } : undefined}
                    socket={this.props.socket}
                />
            </div>
            <div className={Utils.clsx(this.props.classes.shortFields, this.props.classes.chapterMain)}>
                <p className={this.props.classes.title}>{I18n.t('Main')}</p>
                {this.renderColorField(this.props.line, this.updateField, 'Color', 'color')}
                <IOSelect
                    formData={this.props.line}
                    updateValue={this.updateField}
                    name="chartType"
                    label="Chart type"
                    options={chartTypes}
                />
                {this.props.line.instance !== 'json' && this.props.line.chartType !== 'auto' ?
                    <IOSelect formData={this.props.line} updateValue={this.updateField} name="aggregate" label="Type" options={aggregateTypes} /> : null}
                {this.props.line.chartType === 'bar' ? <IOSelect
                    formData={this.props.line}
                    updateValue={this.updateField}
                    name="postProcessing"
                    label="Processing"
                    options={{
                        '': 'non-processed',
                        diff: 'difference',
                    }}
                /> : null }
                {this.props.line.aggregate === 'percentile' ? <IOSlider formData={this.props.line} updateValue={this.updateField} name="percentile" step={5} max={100} label="Percentile" /> : null }
                {this.props.line.aggregate === 'integral' ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="integralUnit" label="Integral unit" min={1} type="number" title={I18n.t('In seconds')} /> : null }
                {this.props.line.aggregate === 'integral' ? <IOSelect
                    formData={this.props.line}
                    updateValue={this.updateField}
                    name="integralInterpolation"
                    label="Interpolation method"
                    options={{
                        none: 'none_no',
                        linear: 'linear',
                    }}
                /> : null }
                {this.props.line.chartType === 'scatterplot' || this.props.line.points ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="symbolSize" label="Point size" min={1} type="number" /> : null }
                {this.props.line.chartType !== 'scatterplot' && this.props.line.chartType !== 'bar' ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="validTime" label="Valid time (sec)" min={0} type="number" title={I18n.t('If the current value is not older than X seconds, assume it is still the same.')} /> : null }
                {this.props.presetData.legend ? <IOCheckbox formData={this.props.line} updateValue={this.updateField} name="hide" label="Show only in legend" /> : null}
            </div>
            <div className={Utils.clsx(this.props.classes.shortFields, this.props.classes.chapterTexts)}>
                <p className={this.props.classes.title}>{I18n.t('Texts')}</p>
                <IOTextField formData={this.props.line} updateValue={this.updateField} name="name" label="Name" />
                {!this.state.isBoolean && ownYAxis ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="unit" label="Unit" /> : null}
                {this.state.isBoolean && this.state.withStates === null ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="falseText" label="Text by false" /> : null}
                {this.state.isBoolean && this.state.withStates === null ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="trueText" label="Text by true" /> : null}
                {this.renderStates()}
            </div>
            {this.props.line.chartType !== 'scatterplot' && this.props.line.chartType !== 'bar' ? <div className={Utils.clsx(this.props.classes.shortFields, this.props.classes.chapterLine)}>
                <p className={this.props.classes.title}>{I18n.t('Line and area')}</p>
                <IOSlider formData={this.props.line} updateValue={this.updateField} name="fill" label="Fill (from 0 to 1)" />
                <IOCheckbox formData={this.props.line} updateValue={this.updateField} name="points" label="Show points" />
                {this.props.line.points ?
                    <IOTextField formData={this.props.line} updateValue={this.updateField} name="symbolSize" label="Point size" min={1} type="number" /> : null}
                <IOTextField formData={this.props.line} updateValue={this.updateField} name="thickness" label="ØL - Line thickness" min={this.props.line.fill > 0.01 ? 0 : 1} type="number" />
                <IOTextField formData={this.props.line} updateValue={this.updateField} name="shadowsize" label="ØS - Shadow size" min={0} type="number" />
            </div> : null}
            <div className={Utils.clsx(this.props.classes.shortFields, this.props.classes.chapterAxis)}>
                <p className={this.props.classes.title}>{I18n.t('Axis')}</p>
                {!this.props.index ? <IOSelect
                    formData={this.props.line}
                    updateValue={this.updateField}
                    name="xaxe"
                    label="X Axis position"
                    options={{
                        '': 'bottom',
                        top: 'top',
                        off: 'off',
                    /* off: 'off',
                    left: 'left',
                    right: 'right',
                    topColor: 'top colored',
                    bottomColor: 'bottom colored', */
                    }}
                /> : null }
                {!this.props.index ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="xticks" label="X-Axis ticks" type="number" /> : null}
                <IOSelect
                    formData={this.props.line}
                    updateValue={this.updateField}
                    tooltip={I18n.t('This time offset will be added to the request by reading data from DB')}
                    name="offset"
                    label="X-Offset"
                    options={{
                        0: '0 seconds',
                        10: '10 seconds',
                        30: '30 seconds',
                        60: '60 seconds',
                        120: '2 minutes',
                        180: '3 minutes',
                        240: '4 minutes',
                        300: '5 minutes',
                        600: '10 minutes',
                        900: '15 minutes',
                        1800: '30 minutes',
                        2700: '45 minutes',
                        3600: '1 hour',
                        7200: '2 hours',
                        21600: '6 hours',
                        43200: '12 hours',
                        86400: '1 day',
                        172800: '2 days',
                        259200: '3 days',
                        345600: '4 days',
                        604800: '1 week',
                        1209600: '2 weeks',
                        '1m': '1 month',
                        '2m': '2 months',
                        '3m': '3 months',
                        '6m': '6 months',
                        '1y': '1 year',
                        '2y': '2 years',
                        '-10': '-10 seconds',
                        '-30': '-30 seconds',
                        '-60': '-60 seconds',
                        '-120': '-2 minutes',
                        '-180': '-3 minutes',
                        '-240': '-4 minutes',
                        '-300': '-5 minutes',
                        '-600': '-10 minutes',
                        '-900': '-15 minutes',
                        '-1800': '-30 minutes',
                        '-2700': '-45 minutes',
                        '-3600': '-1 hour',
                        '-7200': '-2 hours',
                        '-21600': '-6 hours',
                        '-43200': '-12 hours',
                        '-86400': '-1 day',
                        '-172800': '-2 days',
                        '-259200': '-3 days',
                        '-345600': '-4 days',
                        '-604800': '-1 week',
                        '-1209600': '-2 weeks',
                        '-1m': '-1 month',
                        '-2m': '-2 months',
                        '-3m': '-3 months',
                        '-6m': '-6 months',
                        '-1y': '-1 year',
                        '-2y': '-2 years',

                    }}
                />
                <IOSelect
                    formData={this.props.line}
                    updateValue={this.updateField}
                    tooltip={I18n.t('This time offset will be added to the X label by displaying data on the chart')}
                    name="xLabelShift"
                    label="X-Label-Offset"
                    options={{
                        0: '0 seconds',
                        10: '10 seconds',
                        30: '30 seconds',
                        60: '60 seconds',
                        120: '2 minutes',
                        180: '3 minutes',
                        240: '4 minutes',
                        300: '5 minutes',
                        600: '10 minutes',
                        900: '15 minutes',
                        1800: '30 minutes',
                        2700: '45 minutes',
                        3600: '1 hour',
                        7200: '2 hours',
                        21600: '6 hours',
                        43200: '12 hours',
                        86400: '1 day',
                        172800: '2 days',
                        259200: '3 days',
                        345600: '4 days',
                        604800: '1 week',
                        1209600: '2 weeks',
                        '1m': '1 month',
                        '2m': '2 months',
                        '3m': '3 months',
                        '6m': '6 months',
                        '1y': '1 year',
                        '2y': '2 years',
                        '-10': '-10 seconds',
                        '-30': '-30 seconds',
                        '-60': '-60 seconds',
                        '-120': '-2 minutes',
                        '-180': '-3 minutes',
                        '-240': '-4 minutes',
                        '-300': '-5 minutes',
                        '-600': '-10 minutes',
                        '-900': '-15 minutes',
                        '-1800': '-30 minutes',
                        '-2700': '-45 minutes',
                        '-3600': '-1 hour',
                        '-7200': '-2 hours',
                        '-21600': '-6 hours',
                        '-43200': '-12 hours',
                        '-86400': '-1 day',
                        '-172800': '-2 days',
                        '-259200': '-3 days',
                        '-345600': '-4 days',
                        '-604800': '-1 week',
                        '-1209600': '-2 weeks',
                        '-1m': '-1 month',
                        '-2m': '-2 months',
                        '-3m': '-3 months',
                        '-6m': '-6 months',
                        '-1y': '-1 year',
                        '-2y': '-2 years',

                    }}
                />
                <IOTextField formData={this.props.line} updateValue={this.updateField} name="yOffset" label="Y-Offset" type="number" />

                <br />
                <IOSelect formData={this.props.line} updateValue={this.updateField} name="commonYAxis" label="Common Y Axis" noTranslate options={xAxisOptions} />

                {ownYAxis ? <IOSelect
                    formData={this.props.line}
                    updateValue={this.updateField}
                    name="yaxe"
                    label="Y Axis position"
                    options={{
                        '': '',
                        off: 'off',
                        left: 'left',
                        right: 'right',
                        leftColor: 'left colored',
                        rightColor: 'right colored',
                    }}
                /> : null}
                {ownYAxis ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="min" label="Min" /> : null}
                {ownYAxis ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="max" label="Max" /> : null}
                {ownYAxis ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="yticks" label="Y-Axis ticks" type="number" /> : null}
            </div>
            <div className={Utils.clsx(this.props.classes.shortFields, this.props.classes.chapterOther)}>
                <p className={this.props.classes.title}>{I18n.t('Others')}</p>
                <IOSelect
                    formData={this.props.line}
                    updateValue={this.updateField}
                    name="ignoreNull"
                    label="NULL as"
                    options={{
                        false: 'default',
                        true: 'ignore null values',
                        0: 'use 0 instead of null values',
                    }}
                />
                {/* <IOTextField formData={this.props.line} updateValue={this.updateField} name="smoothing" label="Smoothing" type="number" min={0} /> */}
                <IOTextField formData={this.props.line} updateValue={this.updateField} name="afterComma" label="Digits after comma" type="number" min={0} />
                {this.props.line.chartType !== 'bar' ? <IOSelect
                    formData={this.props.line}
                    updateValue={this.updateField}
                    name="lineStyle"
                    label="Line style"
                    options={{
                        solid: 'solid',
                        dashed: 'dashed',
                        dotted: 'dotted',
                    }}
                /> : null}
                <IOTextField formData={this.props.line} updateValue={this.updateField} name="convert" label="Convert formula" helperLink={this.showConvertHelp} />
            </div>
            {/* <div className={Utils.clsx(this.props.classes.shortFields, this.props.classes.shortFieldsLast)}>
                <IOCheckbox formData={this.props.line} updateValue={this.updateField} name="dashes" label="Dashes" />
                {this.props.line.dashes ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="dashLength" label="Dashes length" min={1} type="number" /> : null}
                {this.props.line.dashes ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="spaceLength" label="Space length" min={1} type="number" /> : null}
            </div> */}
        < />;
    }

    render() {
        return <Card
            className={Utils.clsx(this.props.classes.card, this.props.onPaste && this.props.classes.cardPaste)}
            style={{ background: this.props.snapshot && this.props.snapshot.isDragging ? this.props.theme.palette.secondary.light : undefined }}
        >
            <CardContent className={this.props.classes.cardContent}>
                {this.props.opened && !this.props.onPaste ? this.renderOpenedLine() : this.renderClosedLine()}
                <LineDialog
                    open={this.state.dialogOpen}
                    onClose={() => this.setState({ dialogOpen: false })}
                    line={this.props.line}
                    index={this.props.index}
                    updateField={this.updateField}
                />
            </CardContent>
            {this.renderConvertHelp()}
        </Card>;
    }
}

LineComponent.propTypes = {
    line: PropTypes.object,
    maxLines: PropTypes.number,
    socket: PropTypes.object,
    updateLine: PropTypes.func,
    provided: PropTypes.object,
    snapshot: PropTypes.object,
    index: PropTypes.number,
    opened: PropTypes.bool,
    instances: PropTypes.array,
    lineOpenToggle: PropTypes.func,
    width: PropTypes.number,
    theme: PropTypes.object,
    presetData: PropTypes.object,
    onSelectColor: PropTypes.func,
    systemConfig: PropTypes.object.isRequired,
    onCopy: PropTypes.func,
    onPaste: PropTypes.func,
};

const Line = withStyles(styles)(LineComponent);
export default Line;
export { Line };
