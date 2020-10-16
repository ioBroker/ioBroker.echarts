import React from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import clsx from 'clsx';

import I18n from '@iobroker/adapter-react/i18n';

import {IOTextField, IOCheckbox, IOColorPicker, IOSelect, IOObjectField} from './Fields';

import {MdDelete as IconDelete} from 'react-icons/md';
import IconButton from '@material-ui/core/IconButton';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import {withStyles} from '@material-ui/core/styles';

import {FaFolder as IconFolderClosed} from 'react-icons/all';
import {FaFolderOpen as IconFolderOpened} from 'react-icons/all';

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
    cardContent: {
        padding: 0,
        margin: 0,
        '&:last-child': {
            padding: 0,
            paddingRight: '20px'
        },
        paddingRight: '20px'
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
        borderBottom: '0px',
        paddingBottom: 0,
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

    },
    deleteButtonFull: {
        float: 'right',
        marginRight: 12
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

    updateField = (name, value)=>{
        let newMark = update(this.props.mark, {[name]: {$set: value}});
        this.props.updateMark(this.props.index, newMark);
    };

    renderClosedLine(lines, colors) {
        return <div className={this.props.classes.lineClosedContainer}>
            <div className={this.props.classes.lineClosed}>
                <IconButton
                    title={ I18n.t('Edit') }
                    onClick={() => this.props.markOpenToggle(this.props.index)}>
                    <IconFolderClosed/>
                </IconButton>
                <IOSelect
                    formData={this.props.mark}
                    updateValue={this.updateField}
                    name="lineId"
                    label="Line ID"
                    options={lines}
                    colors={colors}
                    classes={{fieldContainer: this.props.classes.shortLineIdField}}
                    minWidth={WIDTHS.lineId}
                />
                <IOObjectField
                    formData={this.props.mark}
                    updateValue={this.updateField}
                    name="upperValueOrId"
                    label="Upper value or ID"
                    socket={this.props.socket}
                    classes={{fieldContainer: this.props.classes.shortUpperValueOrIdField}}
                    minWidth={WIDTHS.upperValueOrId}
                />
                <IOObjectField
                    formData={this.props.mark}
                    updateValue={this.updateField}
                    name="lowerValueOrId"
                    label="Lower value (no ID)"
                    socket={this.props.socket}
                    classes={{fieldContainer: this.props.classes.shortLowerValueOrIdField}}
                    minWidth={WIDTHS.lowerValueOrId}
                />
                <IOColorPicker
                    formData={this.props.mark}
                    updateValue={this.updateField}
                    name="color"
                    label="Color"
                    classes={{fieldContainer: this.props.classes.shortColorField}}
                    minWidth={WIDTHS.color}
                />
                <IOCheckbox
                    formData={this.props.mark}
                    updateValue={this.updateField}
                    name="fill"
                    label="Fill"
                    classes={{fieldContainer: this.props.classes.shortFillField}}
                    minWidth={WIDTHS.dataType}
                />
                <IOTextField
                    formData={this.props.mark}
                    updateValue={this.updateField}
                    name="text"
                    label="Text"
                    classes={{fieldContainer: this.props.classes.shortTextField}}
                    minWidth={WIDTHS.fill}
                />
            </div>
            <IconButton
                style={{ marginLeft: 5 }} aria-label="Delete" title={I18n.t('Delete')}
                onClick={()=>{
                    this.props.deleteMark(this.props.index);
                }}>
                <IconDelete/>
            </IconButton>
        </div>
    }

    render() {
        let lines = {};
        let colors = {};
        this.props.presetData.lines.forEach((line, index) => {
            lines[index] = index + ' - ' + (line.id || I18n.t('No ID yet'));
            colors[index] = line.color;
        });
        return <Card className={this.props.classes.card}><CardContent className={this.props.classes.cardContent}>
            { this.props.opened ? <>
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
                </div>
                <div className={this.props.classes.shortFields}>
                    <IOSelect      formData={this.props.mark} updateValue={this.updateField} name="lineId"         label="Line ID" options={lines} colors={colors}/>
                    <IOObjectField formData={this.props.mark} updateValue={this.updateField} name="upperValueOrId" label="Upper value or ID" socket={this.props.socket} />
                    <IOObjectField formData={this.props.mark} updateValue={this.updateField} name="lowerValueOrId" label="Lower value or ID" socket={this.props.socket} />
                </div>
                <div className={this.props.classes.shortFields}>
                    <IOColorPicker formData={this.props.mark} updateValue={this.updateField} name="color" label="Color" />
                    <IOCheckbox formData={this.props.mark} updateValue={this.updateField} name="fill" label="Fill"/>
                    <IOTextField formData={this.props.mark} updateValue={this.updateField} name="ol" label="ØL Line thickness" type="number"/>
                    <IOTextField formData={this.props.mark} updateValue={this.updateField} name="os" label="ØS Shadow size" type="number"/>
                </div>
                <div className={clsx(this.props.classes.shortFields, this.props.classes.shortFieldsLast)}>
                    <IOTextField formData={this.props.mark} updateValue={this.updateField} name="text" label="Text"/>
                    {this.props.mark.text ?
                        <IOSelect formData={this.props.mark} updateValue={this.updateField} name="textPosition" label="Text position" options={{
                            'l': 'Left',
                            'r': 'Right',
                        }}/> : null}
                    {this.props.mark.text ?<IOTextField formData={this.props.mark} updateValue={this.updateField} name="textOffset" label="Text offset" type="number"/> : null}
                    {this.props.mark.text ?<IOTextField formData={this.props.mark} updateValue={this.updateField} name="textSize" label="Text size" type="number"/> : null}
                    {this.props.mark.text ?<IOColorPicker formData={this.props.mark} updateValue={this.updateField} name="textColor" label="Text color" /> : null}
                </div>
            </> : this.renderClosedLine(lines, colors)}
        </CardContent></Card>
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
};

export default withStyles(styles)(Mark);