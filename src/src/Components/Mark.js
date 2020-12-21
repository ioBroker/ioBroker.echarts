import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import I18n from '@iobroker/adapter-react/i18n';

import {IOTextField, IOSelect, IOObjectField, IOSlider} from './Fields';

import {MdContentCopy as IconCopy, MdContentPaste as IconPaste, MdDelete as IconDelete} from 'react-icons/md';
import IconButton from '@material-ui/core/IconButton';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import {withStyles} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

import {FaFolder as IconFolderClosed} from 'react-icons/all';
import {FaFolderOpen as IconFolderOpened} from 'react-icons/all';
import ClearIcon from '@material-ui/icons/Close';

import ColorPicker from '@iobroker/adapter-react/Components/ColorPicker';
import Utils from '@iobroker/adapter-react/Components/Utils';

const WIDTHS = {
    lineId: 100,
    upperValueOrId: 100,
    lowerValueOrId: 100,
    color: 100,
    fill: 100,
    text: 200,
    buttons: 100
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
            paddingRight: 20
        },
        paddingRight: 20
    },
    shortFields: {
        display: 'block',
        '& > div': {
            display: 'inline-flex',
            paddingRight: 20,
            width: 200
        },
        paddingBottom: theme.spacing(2),
        borderBottom: '1px dotted ' + theme.palette.grey[400]
    },
    shortFieldsLast: {
        borderBottom: 0,
        paddingBottom: 0,
        position: 'relaitve',
    },
    shortLineIdField: {
        display: 'inline-flex',
        minWidth: WIDTHS.lineId,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: LINE_HEIGHT + 'px',
        verticalAlign: 'top',
        paddingRight: 10
    },
    shortUpperValueOrIdField: {
        display: 'inline-flex',
        minWidth: WIDTHS.upperValueOrId,
        paddingTop: 0,
        lineHeight: LINE_HEIGHT + 'px',
        verticalAlign: 'top',
        paddingRight: 10
    },
    shortLowerValueOrIdField: {
        lineHeight: LINE_HEIGHT + 'px',
        display: 'inline-flex',
        minWidth: WIDTHS.lowerValueOrId,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        verticalAlign: 'top',
        paddingRight: 10
    },
    shortColorField: {
        display: 'inline-flex',
        minWidth: WIDTHS.color,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: LINE_HEIGHT + 'px',
        verticalAlign: 'top',
        paddingRight: 10
    },
    shortFillField: {
        display: 'inline-flex',
        width: WIDTHS.fill,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: LINE_HEIGHT + 'px',
        verticalAlign: 'top',
        paddingRight: 10
    },
    sliderRoot: {
        marginTop: 10,
    },
    shortTextField: {
        display: 'inline-flex',
        minWidth: WIDTHS.text,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: LINE_HEIGHT + 'px',
        verticalAlign: 'top',
        paddingRight: 10
    },
    shortButtonsField: {
        display: 'inline-flex',
        minWidth: WIDTHS.buttons,
        marginLeft: theme.spacing(1),
        paddingTop: 0,
        lineHeight: LINE_HEIGHT + 'px',
        verticalAlign: 'top',
    },
    lineClosed: {
        display: 'inline-flex',
        flexFlow: 'column wrap',
        overflow: 'hidden',
        flexDirection: 'row',
        flex: 1,
        height: LINE_HEIGHT
    },
    lineClosedContainer: {
        display: 'flex'
    },
    deleteButton: {
        float: 'right',
        marginRight: 12
    },
    deleteButtonFull: {
        float: 'right',
        marginRight: 12
    },
    copyButtonFull: {
        float: 'right',
        marginRight: 0
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
        paddingRight: 40,
    },
});

class Mark extends React.Component {
    state = {
        /*
            'lineId':'0',
            'upperValueOrId':'20',
            'fill':'1',
            'color':'#FF0000',
            'ol':'1',
            'os':'0',
            'text':'11',
            'textPosition':'l',
            'textOffset':'2',
            'textColor':'#FF0000',
            'textSize':'2',
            'lowerValueOrId':'20'
        */
      };

    updateField = (name, value) => {
        const mark = JSON.parse(JSON.stringify(this.props.mark));
        mark[name] = value;
        this.props.updateMark(this.props.index, mark);
    };

    renderColorField(formData, onUpdate, label, name, minWidth, className) {
        let textColor = Utils.isUseBright(formData[name], null);
        if (textColor === null) {
            textColor = undefined;
        }

        return <div className={className}>
            <TextField
                disabled={!!this.props.onPaste}
                style={{minWidth, width: 'calc(100% - 8px)'}}
                label={I18n.t(label)}
                value={formData[name]}
                onClick={() =>
                    !this.props.onPaste && this.setState({['_' + name]: formData[name]}, () =>
                        this.props.onSelectColor(this.state['_' + name], color =>
                            this.setState({['_' + name]: color}, () =>
                                onUpdate(name, ColorPicker.getColor(color, true)))))
                }
                onChange={e => {
                    const color = e.target.value;
                    this.setState({['_' + name]: color}, () =>
                        onUpdate(name, color));
                }}
                inputProps={{style: {paddingLeft: 8, backgroundColor: formData[name], color: textColor ? '#FFF' : '#000'}}}
                InputProps={{
                    endAdornment: !this.props.onPaste && formData[name] ?
                        <IconButton
                            size="small"
                            onClick={e => {
                                e.stopPropagation();
                                this.setState({['_' + name]: ''}, () => onUpdate(name, ''));
                            }}>
                            <ClearIcon />
                        </IconButton>
                        : undefined,
                }}
                InputLabelProps={{shrink: true}}
            />
        </div>;
    }

    renderClosedLine(lines, colors) {
        return <div className={this.props.classes.lineClosedContainer}>
            <div className={this.props.classes.lineClosed}>
                {this.props.onPaste && this.props.onPaste ?
                    <IconButton
                        title={I18n.t('Paste')}
                        onClick={() => this.props.onPaste()}>
                        <IconPaste/>
                    </IconButton>
                    :
                    <IconButton
                        title={ I18n.t('Edit') }
                        onClick={() => this.props.markOpenToggle(this.props.index)}>
                        <IconFolderClosed/>
                    </IconButton>
                }
                <IOSelect
                    disabled={!!this.props.onPaste}
                    noTranslate={true}
                    formData={this.props.mark}
                    updateValue={this.updateField}
                    name="lineId"
                    label="Line ID"
                    options={lines}
                    colors={colors}
                    classes={{fieldContainer: this.props.classes.shortLineIdField}}
                    minWidth={WIDTHS.lineId}
                />
                {this.props.mark.lineId !== null && this.props.mark.lineId !== undefined && this.props.mark.lineId !== '' ?
                    <IOObjectField
                        disabled={!!this.props.onPaste}
                        formData={this.props.mark}
                        updateValue={this.updateField}
                        name="upperValueOrId"
                        label="Upper value or ID"
                        socket={this.props.socket}
                        classes={{fieldContainer: this.props.classes.shortUpperValueOrIdField}}
                        minWidth={WIDTHS.upperValueOrId}
                    /> : null}
                {this.props.mark.lineId !== null && this.props.mark.lineId !== undefined && this.props.mark.lineId !== '' &&
                 this.props.mark.upperValueOrId !== null && this.props.mark.upperValueOrId !== undefined && this.props.mark.upperValueOrId !== '' ?
                    <IOObjectField
                        disabled={!!this.props.onPaste}
                        formData={this.props.mark}
                        updateValue={this.updateField}
                        name="lowerValueOrId"
                        label="Upper value or ID"
                        socket={this.props.socket}
                        classes={{fieldContainer: this.props.classes.shortLowerValueOrIdField}}
                        minWidth={WIDTHS.lowerValueOrId}
                    /> : null}
                {this.props.mark.lineId !== null && this.props.mark.lineId !== undefined && this.props.mark.lineId !== '' &&
                this.props.mark.upperValueOrId !== null && this.props.mark.upperValueOrId !== undefined && this.props.mark.upperValueOrId !== '' ?
                    this.renderColorField(this.props.mark, this.updateField, 'Color', 'color', WIDTHS.color, this.props.classes.shortColorField) : null}
                {this.props.mark.lineId !== null && this.props.mark.lineId !== undefined && this.props.mark.lineId !== ''  &&
                 this.props.mark.upperValueOrId !== null && this.props.mark.upperValueOrId !== undefined && this.props.mark.upperValueOrId !== '' &&
                 this.props.mark.lowerValueOrId !== null && this.props.mark.lowerValueOrId !== undefined && this.props.mark.lowerValueOrId !== ''?
                    <IOSlider
                        disabled={!!this.props.onPaste}
                        formData={this.props.mark}
                        updateValue={this.updateField}
                        minWidth={WIDTHS.dataType}
                        classes={{fieldContainer: this.props.classes.shortFillField, sliderRoot: this.props.classes.sliderRoot}}
                        name="fill"
                        label="Fill (from 0 to 1)"
                    /> : null}
                {this.props.mark.lineId !== null && this.props.mark.lineId !== undefined && this.props.mark.lineId !== '' &&
                 this.props.mark.upperValueOrId !== null && this.props.mark.upperValueOrId !== undefined && this.props.mark.upperValueOrId !== '' ?
                    <IOTextField
                        disabled={!!this.props.onPaste}
                        formData={this.props.mark}
                        updateValue={this.updateField}
                        name="text"
                        label="Text"
                        classes={{fieldContainer: this.props.classes.shortTextField}}
                        minWidth={WIDTHS.fill}
                    /> : null}
            </div>
            <IconButton
                style={{ marginLeft: 5 }} aria-label="Delete" title={I18n.t('Delete')}
                onClick={() => this.props.deleteMark(this.props.index)}>
                <IconDelete/>
            </IconButton>
        </div>
    }

    renderOpenedCard(lines, colors) {
        return <>
            <div>
                <IconButton title={ I18n.t('Edit') }
                            onClick={() => this.props.markOpenToggle(this.props.index)
                            }><IconFolderOpened/></IconButton>
                {I18n.t('Mark')} {this.props.index + 1}{this.props.mark.text ? ' - ' + this.props.mark.text : ''}
                <IconButton
                    className={this.props.classes.deleteButtonFull}
                    aria-label="Delete"
                    title={I18n.t('Delete')}
                    onClick={() => this.props.deleteMark(this.props.index)}>
                    <IconDelete/>
                </IconButton>
                <IconButton
                    className={this.props.classes.copyButtonFull}
                    aria-label="Copy"
                    title={I18n.t('Copy')}
                    onClick={() => this.props.onCopy(this.props.mark)}>
                    <IconCopy/>
                </IconButton>
            </div>
            <div className={this.props.classes.shortFields}>
                <p className={this.props.classes.title}>{I18n.t('Limits')}</p>
                <IOSelect
                    formData={this.props.mark}
                    updateValue={this.updateField}
                    name="lineId"
                    noTranslate={true}
                    label="Line ID"
                    options={lines}
                    colors={colors}
                />

                {this.props.mark.lineId !== null && this.props.mark.lineId !== undefined && this.props.mark.lineId !== '' ?
                    <IOObjectField
                        formData={this.props.mark}
                        updateValue={this.updateField}
                        name="upperValueOrId"
                        label="Upper value or ID"
                        socket={this.props.socket}
                    /> : null }

                {this.props.mark.upperValueOrId !== null && this.props.mark.upperValueOrId !== undefined && this.props.mark.upperValueOrId !== '' ?
                    <IOObjectField
                        formData={this.props.mark}
                        updateValue={this.updateField}
                        name="lowerValueOrId"
                        label="Lower value or ID"
                        socket={this.props.socket}
                    /> : null }
            </div>

            {(this.props.mark.upperValueOrId !== null && this.props.mark.upperValueOrId !== undefined && this.props.mark.upperValueOrId !== '') ||
            (this.props.mark.lowerValueOrId !== null && this.props.mark.lowerValueOrId !== undefined && this.props.mark.lowerValueOrId !== '') ?
                <div className={this.props.classes.shortFields}>
                    <p className={this.props.classes.title}>{I18n.t('Style')}</p>
                    {this.renderColorField(this.props.mark, this.updateField, 'Color', 'color')}

                    <IOTextField
                        formData={this.props.mark}
                        updateValue={this.updateField} name="ol" label="ØL Line thickness" type="number"/>

                    <IOTextField formData={this.props.mark} updateValue={this.updateField} name="os" label="ØS Shadow size" type="number"/>

                    <IOSelect formData={this.props.mark} updateValue={this.updateField} name="lineStyle" label="Line style" options={{
                        'solid': 'solid',
                        'dashed': 'dashed',
                        'dotted': 'dotted',
                    }}/>

                    {(this.props.mark.upperValueOrId !== null && this.props.mark.upperValueOrId !== undefined && this.props.mark.upperValueOrId !== '') &&
                    (this.props.mark.lowerValueOrId !== null && this.props.mark.lowerValueOrId !== undefined && this.props.mark.lowerValueOrId !== '') ?
                        <IOSlider formData={this.props.mark} updateValue={this.updateField} name="fill" label="Fill (from 0 to 1)"/> : null}
                </div> : null}

            {(this.props.mark.upperValueOrId !== null && this.props.mark.upperValueOrId !== undefined && this.props.mark.upperValueOrId !== '') ||
            (this.props.mark.lowerValueOrId !== null && this.props.mark.lowerValueOrId !== undefined && this.props.mark.lowerValueOrId !== '') ?
                <div className={clsx(this.props.classes.shortFields, this.props.classes.shortFieldsLast)}>
                    <p className={this.props.classes.title}>{I18n.t('Label')}</p>
                    <IOTextField formData={this.props.mark} updateValue={this.updateField} name="text" label="Text"/>
                    {this.props.mark.text ?
                        <IOSelect formData={this.props.mark} updateValue={this.updateField} name="textPosition" label="Text position" options={{
                            'l': 'Left',
                            'r': 'Right',
                        }}/> : null}
                    {this.props.mark.text ? <IOTextField formData={this.props.mark} updateValue={this.updateField} name="textOffset" label="Text offset" type="number"/> : null}
                    {this.props.mark.text ? <IOTextField formData={this.props.mark} updateValue={this.updateField} name="textSize" label="Text size" type="number"/> : null}
                    {this.props.mark.text ? this.renderColorField(this.props.mark, this.updateField, 'Text color', 'textColor') : null}
                </div> : null }
        </>;
    }

    render() {
        let lines = {};
        let colors = {};
        this.props.presetData && this.props.presetData.lines.forEach((line, index) => {
            lines[index] = index + ' - ' + (line.id || I18n.t('No ID yet'));
            colors[index] = line.color;
        });
        return <Card className={clsx(this.props.classes.card, this.props.onPaste && this.props.classes.cardPaste)}>
            <CardContent className={this.props.classes.cardContent}>
                { this.props.opened && !this.props.onPaste ? this.renderOpenedCard(lines, colors) : this.renderClosedLine(lines, colors)}
            </CardContent>
        </Card>
    }
}

Mark.propTypes = {
    mark: PropTypes.object,
    socket: PropTypes.object,
    updateMark: PropTypes.func,
    index: PropTypes.number,
    opened: PropTypes.bool,
    instances: PropTypes.array,
    markOpenToggle: PropTypes.func,
    onSelectColor: PropTypes.func,
    onCopy: PropTypes.func,
    onPaste: PropTypes.func,
};

export default withStyles(styles)(Mark);