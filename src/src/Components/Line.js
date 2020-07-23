import React from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';

import I18n from '@iobroker/adapter-react/i18n';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect,IOObjectField} from './Fields';

import {MdDelete as IconDelete} from 'react-icons/md';
import IconButton from '@material-ui/core/IconButton';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import {withStyles} from '@material-ui/core/styles';

import {FaFolder as IconFolderClosed} from 'react-icons/all';
import {FaFolderOpen as IconFolderOpened} from 'react-icons/all';

const WIDTHS = {
    instance: 100,
    id: 200,
    chartType: 120,
    dataType: 110,
    color: 100,
    name: 200,
    buttons: 50 + 50
};

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
        display: 'inline-block',
        '& > div': {
            display: 'inline-flex',
            paddingRight: 20,
            width: 200,
        }
    },
    shortInstanceField: {
        display: 'inline-block',
        minWidth: WIDTHS.instance,
        paddingTop: 0,
        lineHeight: '48px',
        verticalAlign: 'top',
    },
    shortIdField: {
        display: 'inline-block',
        minWidth: WIDTHS.id,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: '48px',
        verticalAlign: 'top',
    },
    shortDataTypeField: {
        lineHeight: '48px',
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
        lineHeight: '48px',
        verticalAlign: 'top',
    },
    shortColorField: {
        display: 'inline-block',
        minWidth: WIDTHS.color,
        width: WIDTHS.color,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: '48px',
        verticalAlign: 'top',
    },
    shortNameField: {
        display: 'inline-block',
        minWidth: WIDTHS.name,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: '48px',
        verticalAlign: 'top',
    },
    shortButtonsField: {
        display: 'inline-block',
        minWidth: WIDTHS.buttons,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: '48px',
        verticalAlign: 'top',
    },
    deleteButton: {

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
        this.props.updateLine(this.props.index, newLine);
    };

    static getDerivedStateFromProps(props, state) {
        if (props.width !== state.width) {
            return {width: props.width};
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
                    auto: 'Auto (Line or Steps)',
                    line: 'Line',
                    bar: 'Bar',
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
                    onchange: 'on change',
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
        return <Card className={this.props.classes.card}>
            <CardContent className={this.props.classes.cardContent}>
                { this.props.opened ?
                    <>
                        <div>
                            <IconButton title={ I18n.t('Edit') }
                                        onClick={() => this.props.lineOpenToggle(this.props.index)
                                        }><IconFolderOpened/></IconButton>
                            {I18n.t('Line')} {this.props.index}{this.props.line.name ? ' - ' + this.props.line.name : ''}
                            <IconButton
                                size="small"
                                style={{ marginLeft: 5 }} aria-label="Delete" title={I18n.t('Delete')}
                                onClick={() => this.props.deleteLine(this.props.index)}>
                                <IconDelete/>
                            </IconButton>
                        </div>
                        <div className={this.props.classes.shortFields}>
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="instance" label="Instance" options={
                                (() => {
                                    let result = {};
                                    this.props.instances.forEach(instance => result[instance._id] = instance._id);
                                    return result;
                                })()
                            }/>
                            <IOObjectField formData={this.props.line} updateValue={this.updateField} name="id" label="ID" customFilter={{common: {custom: this.props.line.instance ? this.props.line.instance.replace('system.adapter.', '') : true}}} socket={this.props.socket}/>
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="aggregate" label="Type" options={{
                                minmax: 'minmax',
                                average: 'average',
                                min: 'min',
                                max: 'max',
                                total: 'total',
                                onchange: 'on change',
                            }}/>
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="chartType" label="Chart type" options={{
                                auto: 'Auto (Line or Steps)',
                                line: 'Line',
                                bar: 'Bar',
                                scatterplot: 'Scatter plot',
                                steps: 'Steps',
                                spline: 'Spline',
                            }}/>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="fill" label="Fill" />
                            <IOCheckbox formData={this.props.line} updateValue={this.updateField} name="points" label="Points"/>
                            <IOColorPicker formData={this.props.line} updateValue={this.updateField} name="color" label="Color" />
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="min" label="Min" />
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="max" label="Max" />
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="unit" label="Unit" />
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
                        </div>
                        <div className={this.props.classes.shortFields}>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="name" label="Name"/>
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
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="thickness" label="ØL" type="number"/>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="shadowsize" label="ØS" type="number"/>
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="commonYAxis" label="Common Y Axis" options={{
                                '': 'default',
                                '1': '1',
                                '2': '2',
                                '3': '3',
                                '4': '4',
                                '5': '5',
                            }}/>
                            <IOSelect formData={this.props.line} updateValue={this.updateField} name="ignoreNull" label="NULL as" options={{
                                'false': 'default',
                                'true': 'ignore null values',
                                '0': 'use 0 instead of null values',
                            }}/>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="smoothing" label="Smoothing" type="number"/>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="afterComma" label="After comma" type="number"/>
                            <IOCheckbox formData={this.props.line} updateValue={this.updateField} name="dashes" label="Dashes"/>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="dashLength" label="Dashes length" type="number"/>
                            <IOTextField formData={this.props.line} updateValue={this.updateField} name="spaceLength" label="Space length" type="number"/>
                        </div>
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
    index: PropTypes.number,
    opened: PropTypes.bool,
    instances: PropTypes.array,
    lineOpenToggle: PropTypes.func,
    width: PropTypes.number,
};

export default withStyles(styles)(Line);