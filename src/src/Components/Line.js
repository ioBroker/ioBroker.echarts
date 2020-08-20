import React from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import clsx from 'clsx';
import {withStyles} from '@material-ui/core/styles';

import IconButton from '@material-ui/core/IconButton';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

import {MdDelete as IconDelete} from 'react-icons/md';
import {MdMenu as IconDrag} from 'react-icons/md';
import {FaFolder as IconFolderClosed} from 'react-icons/fa';
import {FaFolderOpen as IconFolderOpened} from 'react-icons/fa';

import Utils from '@iobroker/adapter-react/Components/Utils';
import I18n from '@iobroker/adapter-react/i18n';

import {IOTextField, IOCheckbox, IOColorPicker, IOSelect, IOObjectField, IOSlider} from './Fields';

const WIDTHS = {
    instance: 100,
    id: 200,
    chartType: 120,
    dataType: 110,
    color: 100,
    name: 200,
    buttons: 50 + 50 + 16
};

const LINE_HEIGHT = 48;

let styles = theme => ({
    card: {
        borderStyle: 'dashed',
        borderWidth: 1,
        marginBottom: theme.spacing(1),
        padding: theme.spacing(1),
        borderColor: theme.palette.grey['600'],
        overflow: 'initial'
    },
    cardContent: {
        padding: 0,
        margin: 0,
        '&:last-child': {
            padding: 0,
        }
    },
    shortFields: {
        display: 'block',
        '& > div': {
            display: 'inline-flex',
            paddingRight: 20,
            width: 200,
        },
        paddingBottom: theme.spacing(2),
        borderBottom: '1px dotted ' + theme.palette.grey[400]
    },
    shortFieldsLast: {
        borderBottom: '0px',
        paddingBottom: 0,
    },
    shortInstanceField: {
        display: 'inline-block',
        minWidth: WIDTHS.instance,
        paddingTop: 0,
        lineHeight: LINE_HEIGHT + 'px',
        verticalAlign: 'top',
    },
    shortIdField: {
        display: 'inline-block',
        minWidth: WIDTHS.id,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: LINE_HEIGHT + 'px',
        verticalAlign: 'top',
    },
    shortDataTypeField: {
        lineHeight: LINE_HEIGHT + 'px',
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
        lineHeight: LINE_HEIGHT + 'px',
        verticalAlign: 'top',
    },
    shortColorField: {
        display: 'inline-block',
        minWidth: WIDTHS.color,
        width: WIDTHS.color,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: LINE_HEIGHT + 'px',
        verticalAlign: 'top',
    },
    shortNameField: {
        display: 'inline-block',
        minWidth: WIDTHS.name,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: LINE_HEIGHT + 'px',
        verticalAlign: 'top',
    },
    shortButtonsField: {
        display: 'inline-block',
        minWidth: WIDTHS.buttons,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: LINE_HEIGHT + 'px',
        verticalAlign: 'top',
    },
    deleteButton: {

    },
    deleteButtonFull: {
        float: 'right',
        marginRight: 12
    },
    fullWidth: {
        width: '100%',
        minWidth: 200
    }
});

class Line extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            width: this.props.width
        };
    }
    updateField = (name, value) => {
        let newLine = update(this.props.line, {[name]: {$set: value}});
        if (name === 'id') {
            if (this.props.line.id !== value) {
                return this.props.socket.getObject(value)
                    .then(obj => {
                        if (obj && obj.common && obj.common.name) {
                            name = Utils.getObjectNameFromObj(obj, null, {language: I18n.getLanguage()});
                        } else {
                            let _name = value.split('.');
                            name = _name.length ? _name[_name.length - 1] : '';
                        }
                        if (obj && obj.common && obj.common.unit) {
                            newLine = update(newLine, {unit: {$set: obj.common.unit}});
                        }
                    })
                    .catch(e => {
                        console.error(e);
                        let _name = value.split('.');
                        name = _name.length ? _name[_name.length - 1] : '';
                    })
                    .then(() => {
                        newLine = update(newLine, {name: {$set: name}});
                        this.props.updateLine(this.props.index, newLine);
                    });
            }
        }
        this.props.updateLine(this.props.index, newLine);
    };

    static getDerivedStateFromProps(props, state) {
        if (props.width !== state.width) {
            return {width: props.width};
        } else {
            return null;
        }
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

        return <div className={this.props.classes.lineClosed}>
            {this.props.provided ? <span title={ I18n.t('Drag me') } {...this.props.provided.dragHandleProps}><IconDrag/></span> : null }
            <IconButton
                title={ I18n.t('Edit') }
                onClick={() => this.props.lineOpenToggle(this.props.index)}>
                <IconFolderClosed/>
            </IconButton>
            <IOSelect
                formData={this.props.line}
                updateValue={this.updateField}
                name="instance"
                label="Instance"
                noTranslate={true}
                options={(() => {
                    let result = {};
                    this.props.instances.forEach(instance => result[instance._id] = instance._id.replace('system.adapter.', ''));
                    return result;
                })()}
                minWidth={WIDTHS.instance}
                classes={{fieldContainer: this.props.classes.shortInstanceField}}
            />
            <IOObjectField
                formData={this.props.line}
                updateValue={this.updateField}
                name="id"
                width={idWidth}
                label="ID"
                customFilter={{common: {custom: this.props.line.instance ? this.props.line.instance.replace('system.adapter.', '') : true}}}
                classes={{fieldContainer: this.props.classes.shortIdField}}
                socket={this.props.socket}
            />
            {visible.chartType ? <IOSelect
                formData={this.props.line}
                updateValue={this.updateField}
                minWidth={WIDTHS.chartType}
                name="chartType"
                label="Chart type"
                options={{
                    auto: 'Auto',
                    line: 'Line',
                    //bar: 'Bar',
                    scatterplot: 'Scatter plot',
                    steps: 'Steps',
                    spline: 'Spline',
                }}
                classes={{fieldContainer: this.props.classes.shortChartTypeField}}
            /> : null}
            {visible.dataType ? <IOSelect
                formData={this.props.line}
                updateValue={this.updateField}
                minWidth={WIDTHS.dataType}
                name="aggregate"
                label="Type"
                options={{
                    minmax: 'minmax',
                    average: 'average',
                    min: 'min',
                    max: 'max',
                    total: 'total',
                    onchange: 'raw',
                }}
                classes={{fieldContainer: this.props.classes.shortDataTypeField}}
            /> : null}

            {visible.color ? <IOColorPicker
                minWidth={WIDTHS.color}
                formData={this.props.line}
                updateValue={this.updateField}
                name="color"
                label="Color"
                classes={{fieldContainer: this.props.classes.shortColorField, colorPicker: this.props.classes.shortColorField}}
            /> : null}
            {visible.name ? <IOTextField
                width={WIDTHS.name}
                formData={this.props.line}
                updateValue={this.updateField}
                name="name"
                label="Name"
                classes={{fieldContainer: this.props.classes.shortNameField}}
            /> : null}
            <IconButton
                className={this.props.classes.deleteButton}
                aria-label="Delete"
                title={I18n.t('Delete')}
                onClick={() => this.props.deleteLine(this.props.index)}>
                <IconDelete/>
            </IconButton>
        </div>;
    }

    render() {
        return <Card className={this.props.classes.card}
        style={{background: this.props.snapshot.isDragging ? this.props.theme.palette.secondary.light : undefined}}>
            <CardContent className={this.props.classes.cardContent}>
                { this.props.opened ?
                    <>
                        <div>
                            {this.props.provided ? <span title={ I18n.t('Drag me') } {...this.props.provided.dragHandleProps}><IconDrag/></span> : null }
                            <IconButton title={ I18n.t('Edit') }
                                        onClick={() => this.props.lineOpenToggle(this.props.index)
                                        }><IconFolderOpened/></IconButton>
                            {I18n.t('Line')} {this.props.index + 1}{this.props.line.name ? ' - ' + this.props.line.name : ''}
                            <IconButton
                                className={this.props.classes.deleteButtonFull}
                                aria-label="Delete"
                                title={I18n.t('Delete')}
                                onClick={() => this.props.deleteLine(this.props.index)}>
                                <IconDelete/>
                            </IconButton>
                        </div>
                        <div className={this.props.classes.shortFields}>
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="instance" label="Instance" noTranslate={true} options={
                                (() => {
                                    let result = {};
                                    this.props.instances.forEach(instance => result[instance._id] = instance._id.replace('system.adapter.', ''));
                                    return result;
                                })()
                            }/>
                            <IOObjectField
                                formData={this.props.line}
                                classes={{objectContainer: this.props.classes.fullWidth}}
                                updateValue={this.updateField}
                                name="id"
                                label="ID"
                                width={'calc(100% - 250px)'}
                                customFilter={{common: {custom: this.props.line.instance ? this.props.line.instance.replace('system.adapter.', '') : true}}}
                                socket={this.props.socket}/>
                        </div>
                        <div className={this.props.classes.shortFields}>
                            <IOColorPicker formData={this.props.line} updateValue={this.updateField} name="color" label="Color" />
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="aggregate" label="Type" options={{
                                minmax: 'minmax',
                                average: 'average',
                                min: 'min',
                                max: 'max',
                                total: 'total',
                                onchange: 'raw',
                            }}/>
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="chartType" label="Chart type" options={{
                                auto: 'Auto (Line or Steps)',
                                line: 'Line',
                                //bar: 'Bar',
                                scatterplot: 'Scatter plot',
                                steps: 'Steps',
                                spline: 'Spline',
                            }}/>
                            {this.props.line.chartType === 'scatterplot' ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="symbolSize" label="Point size" min={1} type="number"/> : null }
                        </div>
                        <div className={this.props.classes.shortFields}>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="name" label="Name"/>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="unit" label="Unit" />
                        </div>
                        <div className={this.props.classes.shortFields}>
                            {/*<IOTextField formData={this.props.line} updateValue={this.updateField} name="fill" label="Fill (from 0 to 1)" />*/}
                            <IOSlider formData={this.props.line} updateValue={this.updateField} name="fill" label="Fill (from 0 to 1)" />
                            <IOCheckbox formData={this.props.line} updateValue={this.updateField} name="points" label="Show points"/>
                            {this.props.line.points && this.props.line.chartType !== 'scatterplot' ?
                                <IOTextField formData={this.props.line} updateValue={this.updateField} name="symbolSize" label="Point size" min={1} type="number"/> :
                                null
                            }
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="thickness" label="ØL - Line thickness" min={1} type="number"/>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="shadowsize" label="ØS - Shadow size" min={0} type="number"/>
                        </div>
                        <div className={this.props.classes.shortFields}>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="min" label="Min" />
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="max" label="Max" />
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="yaxe" label="Y Axis" options={{
                                '': '',
                                off: 'off',
                                left: 'left',
                                right: 'right',
                                leftColor: 'left colored',
                                rightColor: 'right colored',
                            }}/>
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="xaxe" label="X Axis" options={{
                                '': '',
                                off: 'off',
                                left: 'left',
                                right: 'right',
                                topColor: 'top colored',
                                bottomColor: 'bottom colored',
                            }}/>
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="offset" label="X-Offset" options={{
                                '0': '0 seconds',
                                '10': '10 seconds',
                                '30': '30 seconds',
                                '60': '60 seconds',
                                '120': '2 minutes',
                                '180': '3 minutes',
                                '240': '4 minutes',
                                '300': '5 minutes',
                                '600': '10 minutes',
                                '900': '15 minutes',
                                '1800': '30 minutes',
                                '2700': '45 minutes',
                                '3600': '1 hour',
                                '7200': '2 hours',
                                '21600': '6 hours',
                                '43200': '12 hours',
                                '86400': '1 day',
                                '172800': '2 days',
                                '259200': '3 days',
                                '345600': '4 days',
                                '604800': '1 week',
                                '1209600': '2 weeks',
                                '1m': '1 month',
                                '2m': '2 months',
                                '3m': '3 months',
                                '6m': '6 months',
                                '1y': '1 year',
                                '2y': '2 years',
                            }}/>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="yOffset" label="Y-Offset" type="number"/>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="xticks" label="X-Axis ticks" type="number"/>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="yticks" label="Y-Axis ticks" type="number"/>
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="commonYAxis" label="Common Y Axis" options={{
                                '': 'default',
                                '1': '1',
                                '2': '2',
                                '3': '3',
                                '4': '4',
                                '5': '5',
                            }}/>
                        </div>
                        <div className={this.props.classes.shortFields}>
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="ignoreNull" label="NULL as" options={{
                                'false': 'default',
                                'true': 'ignore null values',
                                '0': 'use 0 instead of null values',
                            }}/>
                            {/*<IOTextField formData={this.props.line} updateValue={this.updateField} name="smoothing" label="Smoothing" type="number" min={0}/>*/}
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="afterComma" label="Digits after comma" type="number" min={0}/>
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="lineStyle" label="Line style" options={{
                                'solid': 'solid',
                                'dashed': 'dashed',
                                'dotted': 'dotted',
                            }}/>
                        </div>
                        {/*<div className={clsx(this.props.classes.shortFields, this.props.classes.shortFieldsLast)}>
                            <IOCheckbox formData={this.props.line} updateValue={this.updateField} name="dashes" label="Dashes"/>
                            {this.props.line.dashes ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="dashLength" label="Dashes length" min={1} type="number"/> : null}
                            {this.props.line.dashes ? <IOTextField formData={this.props.line} updateValue={this.updateField} name="spaceLength" label="Space length" min={1} type="number"/> : null}
                        </div>*/}
                    </>
                    :
                    this.renderClosedLine()
                }
            </CardContent>
        </Card>
    }
}

Line.propTypes = {
    line: PropTypes.object,
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
};

export default withStyles(styles)(Line);