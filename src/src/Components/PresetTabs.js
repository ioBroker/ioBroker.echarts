import React from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import {withStyles} from '@material-ui/core/styles';
import clsx from 'clsx';
import { Droppable, Draggable } from "react-beautiful-dnd";

import IconButton from '@material-ui/core/IconButton';
import TabList from '@material-ui/lab/TabList';
import Tab from '@material-ui/core/Tab';
import TabPanel from '@material-ui/lab/TabPanel';
import TabContext from '@material-ui/lab/TabContext';
import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';

import {MdAdd as IconAdd} from 'react-icons/md';
import {MdSave as IconSave} from 'react-icons/md';

import I18n from '@iobroker/adapter-react/i18n';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect, IOObjectField,IODateTimeField} from './Fields';
import Line from './Line';
import Mark from './Mark';
import getDefaultPreset from './DefaultPreset';

const styles = theme => ({
    tabsBody: {
        overflowY: 'auto',
        flex: 1
    },
    tabsContainer: {
        flexDirection: 'row'
    },
    tabContent: {
        paddingTop: theme.spacing(1),
        position: 'relative',
        minHeight: 'calc(100% - 32px)'
    },
    buttonAdd: {
        position: 'absolute',
        top: theme.spacing(1),
        right: theme.spacing(1),
    },
    buttonSave: {
        color: theme.type === 'dark' ? '#CC0000' : '#CC0000'
    },
    shortFields: {
        '& > div': {
            display: 'inline-flex',
            paddingRight: 20,
            width: 200,
        }
    },
    noContent : {
        padding: theme.spacing(1),
        height: 64,
        verticalAlign: 'middle',
        lineHeight: '64px',
        width: '100%',
    },
    dragHint: {
        paddingLeft: theme.spacing(1),
        fontSize: 10,
        fontStyle: 'italic',
        opacity: 0.8,
    }
});

const PREDEFINED_COLORS_MARKS = [
    '#144578',
    '#1868A8',
    '#665191',
    '#a05195',
    '#d45087',
    '#f95d6a',
    '#ff7c43',
    '#ffa600',
];

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: "none",
    width: '100%',
    // change background colour if dragging
    background: isDragging ? "lightgreen" : "grey",
    // styles we need to apply on draggables
    ...draggableStyle
});

class PresetTabs extends React.Component {
    state = {
        presetData: getDefaultPreset(this.props.systemConfig),
        selectedTab: window.localStorage.getItem('PresetTabs.selectedTab') !== null ? window.localStorage.getItem('PresetTabs.selectedTab') : '0',
        linesOpened: window.localStorage.getItem('Lines.opened') !== null ? JSON.parse(window.localStorage.getItem('Lines.opened')) : [],
        marksOpened: window.localStorage.getItem('Marks.opened') !== null ? JSON.parse(window.localStorage.getItem('Marks.opened')) : [],
        deleteLineDialog: null,
        deleteMarkDialog: null,
    };

    lineOpenToggle = (index) => {
        let opened = typeof this.state.linesOpened[index] !== 'undefined' && this.state.linesOpened[index] === true;
        let newState = update(this.state, {linesOpened: {[index]: {$set: !opened}}});
        this.setState(newState);
        window.localStorage.setItem('Lines.opened', JSON.stringify(newState.linesOpened));
    };

    markOpenToggle = (index) => {
        let opened = typeof this.state.marksOpened[index] !== 'undefined' && this.state.marksOpened[index] === true;
        let newState = update(this.state, {marksOpened: {[index]: {$set: !opened}}});
        this.setState(newState);
        window.localStorage.setItem('Marks.opened', JSON.stringify(newState.marksOpened));
    };

    updateField = (name, value, time)=>{
        let updateObject = {[name]: {$set: value}};
        if (time) {
            updateObject[name + '_time'] = {$set: time};
        }
        this.props.onChange(update(this.props.presetData, updateObject));
    };

    updateMark = (index, markData) => {
        let newMarks = update(this.props.presetData.marks, {[index]: {$set: markData}});
        this.updateField('marks', newMarks);
    };

    updateLine = (index, lineData) => {
        let newLines = update(this.props.presetData.lines, {[index]: {$set: lineData}});
        this.updateField('lines', newLines);
    };

    addMark = () => {
        const len = this.props.presetData.marks.length;
        const color = PREDEFINED_COLORS_MARKS[len % PREDEFINED_COLORS_MARKS.length];

        let newPresetData = update(this.props.presetData, {
            marks: {
                $push: [{
                    color
                }]
            }
        });
        this.props.onChange(newPresetData);
    };

    deleteMark = (index) => {
        let newPresetData = update(this.props.presetData, {
            marks: {
                $splice: [[index, 1]]
            },
        });
        this.props.onChange(newPresetData);
        let newState = update(this.state, {
            marksOpened: {
                $splice: [[index, 1]]
            }
        });
        this.setState(newState);
    };

    addLine = () => {
        const len = this.props.presetData.lines.length;
        const color = this.props.PREDEFINED_COLORS[len % this.props.PREDEFINED_COLORS.length];

        let newPresetData = update(this.props.presetData, {
            lines: {
                $push: [{
                    instance: 'system.adapter.' + this.props.systemConfig.common.defaultHistory,
                    color,
                    xaxe: !len ? undefined : 'off',
                    chartType: 'auto',
                    aggregate: 'minmax'
                }]
            }
        });
        this.props.onChange(newPresetData);
    };

    deleteLine = (index) => {
        let newPresetData = update(this.props.presetData, {
            lines: {
                $splice: [[index, 1]]
            }
        });
        this.props.onChange(newPresetData);
        let newState = update(this.state, {
            linesOpened: {
                $splice: [[index, 1]]
            }
        });
        this.setState(newState);
    };

    renderDeleteLineDialog() {
        return this.state.deleteLineDialog !== null ? <Dialog
            open={ true }
            key="deleteLineDialog"
            onClose={ () => this.setState({deleteLineDialog: null}) }
        >
            <DialogTitle>{ I18n.t('Are you sure for delete this line?') }</DialogTitle>
            <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={ () => this.setState({deleteLineDialog: null}) }>
                    {I18n.t('Cancel')}
                </Button>
                <Button variant="contained" color="secondary" onClick={() => {
                    this.deleteLine(this.state.deleteLineDialog);
                    this.setState({deleteLineDialog: null});
                }}>
                    { I18n.t('Delete') }
                </Button>
            </DialogActions>
        </Dialog> : null;
    }

    renderDeleteMarkDialog() {
        return this.state.deleteMarkDialog !== null ? <Dialog
            open={ true }
            key="deleteMarkDialog"
            onClose={ () => this.setState({deleteMarkDialog: null}) }
        >
            <DialogTitle>{ I18n.t('Are you sure for delete this mark?') }</DialogTitle>
            <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={ () => this.setState({deleteMarkDialog: null}) }>
                    {I18n.t('Cancel')}
                </Button>
                <Button variant="contained" color="secondary" onClick={() => {
                    this.deleteMark(this.state.deleteMarkDialog);
                    this.setState({deleteMarkDialog: null});
                }}>
                    { I18n.t('Delete') }
                </Button>
            </DialogActions>
        </Dialog> : null;
    }

    renderTabLines() {
        return <Droppable droppableId="droppable">
            {(provided, snapshot) =>
                <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{
                        background: snapshot.isDraggingOver ? this.props.theme.palette.secondary.dark : undefined,
                        width: '100%',
                        minHeight: '100%',
                    }}
                >
                    <TabPanel value="0" classes={{root: this.props.classes.tabContent}}>
                        <Fab onClick={this.addLine} size="small" color="secondary" className={this.props.classes.buttonAdd} title={I18n.t('Add line to chart')}>
                            <IconAdd/>
                        </Fab>
                        {this.props.presetData.lines.length ? this.props.presetData.lines.map((line, index) =>
                            <Draggable key={line.id + '_' + index} draggableId={line.id + '_' + index} index={index}>
                                {(provided, snapshot) =>
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                                    >
                                        <Line
                                            provided={provided}
                                            snapshot={snapshot}
                                            theme={this.props.theme}
                                            instances={this.props.instances}
                                            line={line}
                                            width={this.props.width}
                                            updateLine={this.updateLine}
                                            deleteLine={index => this.setState({deleteLineDialog: index})}
                                            index={index}
                                            key={index}
                                            socket={this.props.socket}
                                            opened={typeof this.state.linesOpened[index] !== 'undefined' && this.state.linesOpened[index] === true}
                                            lineOpenToggle={this.lineOpenToggle}
                                        />
                                    </div>
                                }
                            </Draggable>)
                        :
                            <div className={this.props.classes.noContent}>
                                {I18n.t('Create a new line with a "+" on the right.')}
                            </div>
                        }
                        <div className={this.props.classes.dragHint}>{I18n.t('You can drag and drop simple lines from the left list.')}</div>
                    </TabPanel>
                </div>}
            </Droppable>;
    }

    renderTabMarkings() {
        return <TabPanel value="1" classes={{root: this.props.classes.tabContent}}>
            <Fab onClick={this.addMark} size="small" color="secondary" className={this.props.classes.buttonAdd} title={I18n.t('Add marking line to chart')}>
                <IconAdd/>
            </Fab>
            {
                this.props.presetData.marks.length ?
                    this.props.presetData.marks.map((mark, index) => <Mark
                        mark={mark}
                        presetData={this.props.presetData}
                        updateMark={this.updateMark}
                        deleteMark={(index) => {this.setState({deleteMarkDialog: index})}}
                        index={index}
                        key={index}
                        socket={this.props.socket}
                        opened={typeof this.state.marksOpened[index] !== 'undefined' && this.state.marksOpened[index] === true}
                        markOpenToggle={this.markOpenToggle}
                    />) :
                    <div className={this.props.classes.noContent}>
                        {I18n.t('You can create a new markings with a "+" on the right.')}
                    </div>
            }
        </TabPanel>;
    }

    renderTabTime() {
        return <TabPanel value="2" classes={{root: this.props.classes.tabContent}}>
            <Grid container>
                <Grid item xs={6} className={this.props.classes.shortFields}>
                    <h4>{I18n.t('Time Span')}</h4>
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="timeType" label="Type" options={{
                        'relative': 'relative',
                        'static': 'static',
                    }}/>
                    { this.props.presetData.timeType === 'static' ?
                        <>
                            <IODateTimeField formData={this.props.presetData} updateValue={this.updateField} name="start" label="Start" />
                            <IODateTimeField formData={this.props.presetData} updateValue={this.updateField} name="end" label="End" />
                        </> : <>
                            <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="relativeEnd" label="End" options={{
                                'now': 'now',
                                '1minute': 'end of minute',
                                '5minutes': 'end of 5 minutes',
                                '10minutes': 'end of 10 minutes',
                                '30minutes': 'end of 30 minutes',
                                '1hour': 'end of hour',
                                '2hours': 'end of 2 hours',
                                '3hours': 'end of 3 hours',
                                '4hours': 'end of 4 hours',
                                '6hours': 'end of 6 hours',
                                '8hours': 'end of 8 hours',
                                '12hours': 'end of 12 hours',
                                'today': 'end of day',
                                'weekEurope': 'end of sunday',
                                'weekUsa': 'end of saturday',
                                'month': 'this month',
                                'year': 'this year',
                            }}/>
                            <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="range" label="Range" options={{
                                '10': '10 minutes',
                                '30': '30 minutes',
                                '60': '1 hour',
                                '120': '2 hours',
                                '180': '3 hours',
                                '360': '6 hours',
                                '720': '12 hours',
                                '1440': '1 day',
                                '2880': '2 days',
                                '4320': '3 days',
                                '10080': '7 days',
                                '20160': '14 days',
                                '1m': '1 month',
                                '2m': '2 months',
                                '3m': '3 months',
                                '6m': '6 months',
                                '1y': '1 year',
                                '2y': '2 years',
                            }}/>
                            <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="live" label="Live update every" options={{
                                '': 'none',
                                '5': '5 seconds',
                                '10': '10 seconds',
                                '15': '15 seconds',
                                '20': '20 seconds',
                                '30': '30 seconds',
                                '60': '1 minute',
                                '120': '2 minutes',
                                '300': '5 minutes',
                                '600': '10 minutes',
                                '900': '15 minutes',
                                '1200': '20 minutes',
                                '1800': '30 minutes',
                                '3600': '1 hour',
                                '7200': '2 hours',
                                '10800': '3 hours',
                                '21600': '6 hours',
                                '43200': '12 hours',
                                '86400': '1 day',
                            }}/>
                        </>
                    }
                    <br/>
                    <IOObjectField socket={this.props.socket} formData={this.props.presetData} updateValue={this.updateField} name="ticks" label="Use X-ticks from" />
                </Grid>
                {this.props.presetData.lines.find(line => line.aggregate !== 'onchange') ? <Grid item xs={6} className={this.props.classes.shortFields}>
                    <h4>{I18n.t('Aggregate')}</h4>
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="aggregateType" label="Step type" options={{
                        'count': 'counts',
                        'step': 'seconds',
                    }}/>
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="aggregateSpan"
                                 label={this.props.presetData.aggregateType === 'step' ? 'Seconds' : 'Counts'}
                    />
                </Grid> : null }
            </Grid>
        </TabPanel>;
    }

    renderTabOptions() {
        return <TabPanel value="3" className={clsx(this.props.classes.tabContent, this.props.classes.shortFields)}>
                <IOSelect formData={this.props.presetData} updateValue={this.updateField} label="Show legend" name="legend" options={{
                    '': 'none',
                    'nw': 'Top, left',
                    'ne': 'Top, right',
                    'sw': 'Bottom, left',
                    'se': 'Bottom, right',
                }}/>
                {this.props.presetData.legend ?
                <>
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} label="Legend columns" name="legColumns" min="1" type="number" />
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} label="Legend opacity (0-1)" name="legBgOpacity" />
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} label="Legend background" name="legBg" />
                </> : null}
                <br/>
                <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Hover details'} name="hoverDetail" />
                <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Use comma'} name="useComma" />
                <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Enable zoom and pan'} name="zoom" />
                {/*<IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Hide edit button'} name="noedit" />*/}
                <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Show export button'} name="export" />
                <br/>
                <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label="Custom time format" name="timeFormatCustom" />
                {!this.props.presetData.timeFormatCustom ?
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} label="Time format" name="timeFormat" options={{
                        '': 'Default',
                        'HH:mm DD.MM': 'HH:MM dd.mm',
                        'HH:mm DD.MM.': 'HH:MM dd.mm.',
                        'HH:mm <br> DD.MM': 'HH:MM / dd.mm',
                        'HH:mm <br> DD.MM.': 'HH:MM / dd.mm.',
                        'HH:mm <br> DD.MM.YY': 'HH:MM / dd.mm.yy',
                        'HH:mm:ss DD.MM.YY': 'HH:MM:SS dd.mm.yy',
                        'HH:mm DD.MM.YY': 'HH:MM dd.mm.yy',
                        'hh:mm:ss MM/DD/YY a': 'HH:MM:SS mm/dd/yy am (US)',
                        'HH:mm:ss DD/MM/YY': 'HH:MM:SS dd/mm/yy (UK)',
                        'HH:mm:ss MM.DD.YY': 'HH:MM:SS mm.dd.yy',
                        'HH:mm ddd': 'HH:MM dow',
                        'HH:mm:ss ddd': 'HH:MM:SS dow',
                        'HH:mm MM.DD': 'HH:MM mm.dd',
                        'HH:mm:ss': 'HH:MM:SS',
                        'HH:mm': 'HH:MM',
                        'DD.MM': 'dd.mm',
                        'DD.MM.': 'dd.mm.',
                        'MM/DD': 'mm/dd',
                        'DD': 'dd',
                        'MM': 'mm',
                        'YY': 'y',
                        'HH': 'HH',
                        'mm': 'MM',
                        'ddd': 'dow',
                        'DD.MM.YY': 'dd.mm.yy',
                    }}/> :
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} label="Time format" name="timeFormat" helperLink="https://momentjs.com/docs/#/displaying/format/"/> }

                {/*<IOSelect formData={this.props.presetData} updateValue={this.updateField} label="Animation" name="animation" options={{
                            '0': 'no',
                            '300': '300ms',
                            '500': '500ms',
                            '1000': '1 second',
                            '2000': '2 seconds',
                            '3000': '3 seconds',
                            '5000': '5 seconds',
                            '10000': '10 seconds',
                        }}/>*/}
            </TabPanel>;
    }

    renderTabTitle() {
        return <TabPanel value="4" classes={{root: this.props.classes.tabContent}} className={this.props.classes.shortFields}>
            <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="title" label="Title"/>
            {this.props.presetData.title ?
                <>
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="titlePos" label="Title position" options={{
                        '': 'none',
                        'top:35;left:65': 'Top, left, inside',
                        'top:35;right:5': 'Top, right, inside',
                        'top:35;left:50': 'Top, center, inside',
                        'top:50;left:65': 'Middle, left, inside',
                        'top:50;right:5': 'Middle, right, inside',
                        'bottom:5;left:65': 'Bottom, left, inside',
                        'bottom:5;right:5': 'Bottom, right, inside',
                        'bottom:5;left:50': 'Bottom, center, inside',
                        /*'top:5;right:-5': 'Top, right, outside',
                        'top:50;right:-5': 'Middle, right, outside',
                        'bottom:5;right:-5': 'Bottom, right, outside',
                        'bottom:-5;left:50': 'Bottom, center, outside',*/
                    }}/>
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="titleColor" label="Title color" />
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="titleSize" label="Title size" min="0" type="number" />
                </>
                : null}
        </TabPanel>;
    }

    renderTabAppearance() {
        return <TabPanel value="5" classes={{root: this.props.classes.tabContent}}>
            <Grid container>
                <Grid item sm={6} xs={12} className={this.props.classes.shortFields}>
                    <h4>{I18n.t('Appearance')}</h4>
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="width" label="Width" type="number" />
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="height" label="Height" type="number" />
                    <br/>
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="window_bg" label="Window background" />
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="bg_custom" label="Chart background"/>
                    <br/>
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="x_labels_color" label="X labels color" />
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="y_labels_color" label="Y labels color" />
                    <br/>
                    <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} name="grid_hideX" label="Hide X grid" />
                    <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} name="grid_hideY" label="Hide Y grid" />
                    {!this.props.presetData.grid_hideX || !this.props.presetData.grid_hideY ?
                        <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="grid_color" label="Grid color" />
                        : null }
                    <br/>
                        <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="noBorder" label="Border" options={{
                            '': 'With border',
                            'noborder': 'Without border',
                        }}/>
                    {this.props.presetData.noBorder !== 'noborder' ?
                        <>
                            <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="border_color" label="Border color" />
                            <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="border_width" label="Border width" min="0" type="number"/>
                        </> : null}
                </Grid>
                {
                    !!this.props.presetData.lines.find(line => line.chartType === 'bar') ?
                        <Grid item sm={6} xs={12} className={this.props.classes.shortFields}>
                            <h4>{I18n.t('Bar settings')}</h4>
                            <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="barColor" label="Fill color" />
                            <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="barLabels" label="Show labels" options={{
                                '': 'none',
                                'topover': 'top over',
                                'topunder': 'top under',
                                'bottom': 'bottom',
                                'middle': 'middle',
                            }}/>
                            <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="barWidth" label="Bars width" min="0" type="number"/>
                            <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="barFontSize" label="Label font size" min="0" type="number"/>
                            <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="barFontColor" label="Label color" />
                        </Grid>
                        : null
                }
            </Grid>
        </TabPanel>;
    }

    render() {
        return <>
            <TabContext value={this.state.selectedTab}>
                <AppBar position="static" className={this.props.classes.tabsContainer}>
                    <IconButton
                        className={this.props.classes.buttonSave}
                        style={{visibility: this.props.selectedPresetChanged ? 'visible' : 'hidden'}}
                        onClick={() =>
                            this.props.savePreset(this.props.selectedPresetId)}
                    >
                        <IconSave/>
                    </IconButton>
                    <TabList
                        onChange={(event, newValue)=>{
                            window.localStorage.setItem('PresetTabs.selectedTab', newValue);
                            this.setState({selectedTab: newValue})
                        }}
                        variant="scrollable"
                        scrollButtons="on"
                    >
                        <Tab label={I18n.t('Data')} value="0"/>
                        <Tab label={I18n.t('Markings')} value="1"/>
                        <Tab label={I18n.t('Time')} value="2"/>
                        <Tab label={I18n.t('Options')} value="3"/>
                        <Tab label={I18n.t('Title')} value="4"/>
                        <Tab label={I18n.t('Appearance')} value="5"/>
                    </TabList>
                </AppBar>
                <div className={this.props.classes.tabsBody}>
                    {this.state.selectedTab === '0' ? this.renderTabLines() : null}
                    {this.state.selectedTab === '1' ? this.renderTabMarkings() : null}
                    {this.state.selectedTab === '2' ? this.renderTabTime() : null}
                    {this.state.selectedTab === '3' ? this.renderTabOptions() : null}
                    {this.state.selectedTab === '4' ? this.renderTabTitle() : null}
                    {this.state.selectedTab === '5' ? this.renderTabAppearance() : null}
                </div>
            </TabContext>
            {this.renderDeleteLineDialog()}
            {this.renderDeleteMarkDialog()}
        </>
    }
}

PresetTabs.propTypes = {
    onChange: PropTypes.func,
    presetData: PropTypes.object,
    socket: PropTypes.object,
    instances: PropTypes.array,
    selectedPresetId: PropTypes.string,
    savePreset: PropTypes.func,
    selectedPresetChanged: PropTypes.bool,
    width: PropTypes.number,
    PREDEFINED_COLORS: PropTypes.array,
    theme: PropTypes.object,
    systemConfig: PropTypes.object,
};

export default withStyles(styles)(PresetTabs)