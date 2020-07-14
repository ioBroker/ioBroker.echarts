import React from 'react';
import update from 'immutability-helper';

import Tabs from '@material-ui/core/Tabs';
import TabList from '@material-ui/lab/TabList';
import Tab from '@material-ui/core/Tab';
import TabPanel from '@material-ui/lab/TabPanel';
import TabContext from '@material-ui/lab/TabContext';
import AppBar from '@material-ui/core/AppBar';
import {MdAdd as IconAdd} from 'react-icons/md';
import IconButton from '@material-ui/core/IconButton';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect, IOObjectField,IODateTimeField} from './Fields';

import Line from './Line';
import Mark from './Mark';

class PresetTabs extends React.Component {
    state = {
                presetData: {
                    "lines":[
                    /*
                    {
                        "id":"system.adapter.admin.0.cpu",
                        "offset":"0",
                        "aggregate":"minmax",
                        "color":"#FF0000",
                        "thickness":"3",
                        "shadowsize":"3",
                        "name":"Line 1",
                        "xaxe":"off",
                        "ignoreNull":"false",
                        "afterComma":"2",
                        "dashes":"true",
                        "dashLength":"10",
                        "spaceLength":"10",
                        "min":"-0.1",
                        "max":"1",
                        "points":"true",
                        "fill":"4",
                        "unit":"2",
                        "yaxe":"left",
                        "yOffset":"1",
                        "xticks":"2",
                        "yticks":"3",
                        "smoothing":"4"
                    },
                    {
                        "id":"system.adapter.admin.0.memHeapTotal",
                        "offset":"0",
                        "aggregate":"minmax",
                        "color":"#00FF00",
                        "thickness":"3",
                        "shadowsize":"3",
                        "min":"-0.1",
                        "points":"false"
                    },
                    {
                        "id":"system.adapter.admin.0.memRss",
                        "offset":"0",
                        "aggregate":"minmax",
                        "color":"#0000FF",
                        "thickness":"3",
                        "shadowsize":"3",
                        "xaxe":"off",
                        "min":"-0.1"
                    }
                    */
                    ],
                    "marks":[
                    /*
                    {
                        "lineId":"0",
                        "upperValueOrId":"20",
                        "fill":"1",
                        "color":"#FF0000",
                        "ol":"1",
                        "os":"0",
                        "text":"11",
                        "textPosition":"l",
                        "textOffset":"2",
                        "textColor":"#FF0000",
                        "textSize":"2",
                        "lowerValueOrId":"20"
                    }
                    */
                    ],
                    /*
                    "timeType":"relative",
                    "relativeEnd":"10minutes",
                    "range":"120",
                    "aggregateType":"count",
                    "aggregateSpan":"300",
                    "legend":"ne",
                    "hoverDetail":"true",
                    "useComma":"true",
                    "zoom":"true",
                    "noedit":"true",
                    "animation":"2000",
                    "live":"15",
                    "ticks":"22",
                    "width":"1",
                    "height":"0",
                    "noBorder":"noborder",
                    "window_bg":"#000000",
                    "bg":"0",
                    "x_labels_color":"#000000",
                    "y_labels_color":"#010303",
                    "border_color":"#000000",
                    "grid_color":"#000000",
                    "border_width":"11",
                    "barColor":"#002222",
                    "barLabels":"topover",
                    "barWidth":"22",
                    "barFontSize":"22",
                    "barFontColor":"#002222",
                    "title":"11",
                    "titlePos":"top:35;left:50",
                    "titleColor":"#002222",
                    "titleSize":"22",
                    "legColumns":"2",
                    "legBgOpacity":"2",
                    "legBg":"#002222",
                    "timeFormat":"%H:%M:%S %d.%m.%y",
                    */
        },
        selectedTab: "0",
        linesOpened: {},
        marksOpened: {},
    };

    lineOpenToggle = (index) => {
        let opened = typeof this.state.linesOpened[index] === "undefined" || this.state.linesOpened[index] === true;
        this.setState(update(this.state, {linesOpened: {[index]: {$set: !opened}}}))
    }

    markOpenToggle = (index) => {
        let opened = typeof this.state.marksOpened[index] === "undefined" || this.state.marksOpened[index] === true;
        this.setState(update(this.state, {marksOpened: {[index]: {$set: opened}}}))
    }

    updateField = (name, value, time)=>{
        let updateObject = {[name]: {$set: value}};
        if (time) {
            updateObject[name + '_time'] = {$set: time};
        }
        this.props.onChange(update(this.props.presetData, updateObject));
    }

    updateMark = (index, markData) => {
        let newMarks = update(this.props.presetData.marks, {[index]: {$set: markData}});
        this.updateField('marks', newMarks);
    }

    updateLine = (index, lineData) => {
        let newLines = update(this.props.presetData.lines, {[index]: {$set: lineData}});
        this.updateField('lines', newLines);
    }
    
    addMark = () => {
        let newPresetData = update(this.props.presetData, {
            marks: {
                $push: [{}]
            }
        })        
        this.props.onChange(newPresetData);
    }

    deleteMark = (index) => {
        let newPresetData = update(this.props.presetData, {
            marks: {
                $splice: [[index, 1]]
            }
        })        
        this.props.onChange(newPresetData);
    }

    addLine = () => {
        let newPresetData = update(this.props.presetData, {
            lines: {
                $push: [{}]
            }
        })
        this.props.onChange(newPresetData);
    }

    deleteLine = (index) => {
        let newPresetData = update(this.props.presetData, {
            lines: {
                $splice: [[index, 1]]
            }
        })        
        this.props.onChange(newPresetData);
    }

    render() {
        return <TabContext value={this.state.selectedTab}>
            <AppBar position="static">
                <TabList 
                    onChange={(event, newValue)=>{this.setState({selectedTab: newValue})}}
                    variant="scrollable"
                    scrollButtons="on"
                >
                    <Tab label="Data" value="0"/>
                    <Tab label="Markings" value="1"/>
                    <Tab label="Time" value="2"/>
                    <Tab label="Options" value="3"/>
                    <Tab label="Title" value="4"/>
                    <Tab label="Appearance" value="5"/>
                </TabList>
            </AppBar>
            <div>
                <TabPanel value="0">
                    <div>
                        <IconButton onClick={this.addLine}>
                            <IconAdd/>
                        </IconButton>
                    </div>
                    {
                        this.props.presetData.lines.map((line, key) => <Line 
                            instances={this.props.instances} 
                            line={line} 
                            updateLine={this.updateLine} 
                            deleteLine={this.deleteLine} 
                            index={key} 
                            key={key} 
                            socket={this.props.socket}
                            opened={typeof this.state.linesOpened[key] === "undefined" || this.state.linesOpened[key] === true}
                            lineOpenToggle={this.lineOpenToggle}
                        />)
                    }
                </TabPanel>
                <TabPanel value="1">
                    <div>
                        <IconButton onClick={this.addMark}>
                            <IconAdd/>
                        </IconButton>
                    </div>
                    {
                        this.props.presetData.marks.map((mark, key) => <Mark 
                            mark={mark} 
                            presetData={this.props.presetData}
                            updateMark={this.updateMark} 
                            deleteMark={this.deleteMark} 
                            index={key} 
                            key={key} 
                            socket={this.props.socket}
                        />)
                    }
                </TabPanel>
                <TabPanel value="2">
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="timeType" label="Type" options={{
                        'relative': 'relative',
                        'static': 'static',
                    }}/>
                    { this.props.presetData.timeType == 'static' ?
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
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="aggregateType" label="Step type" options={{
                        'count': 'counts',
                        'step': 'seconds',
                    }}/>
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="aggregateSpan"
                        label={this.props.presetData.aggregateType == "step" ? "Seconds" : "Counts"}
                    />
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="ticks" label="Use X-ticks from" />
                </TabPanel>
                <TabPanel value="3">
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} label="Show legend" name="legend" options={{
                        '': 'none',
                        'nw': 'Top, left',
                        'ne': 'Top, right',
                        'sw': 'Bottom, left',
                        'se': 'Bottom, right',
                    }}/>
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} label="Legend columns" name="legColumns" type="number" />
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} label="Legend opacity" name="legBgOpacity" />
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} label="Legend background" name="legBg" />
                    <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Hover details'} name="hoverDetail" />
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} label="Time format" name="timeFormat" options={{
                        '': 'Default',
                        '%H:%M %d.%m': 'HH:MM dd.mm',
                        '%H:%M %d.%m.': 'HH:MM dd.mm.',
                        '%H:%M <br> %d.%m': 'HH:MM / dd.mm',
                        '%H:%M <br> %d.%m.': 'HH:MM / dd.mm.',
                        '%H:%M <br> %d.%m.%y': 'HH:MM / dd.mm.yy',
                        '%H:%M:%S %d.%m.%y': 'HH:MM:SS dd.mm.yy',
                        '%H:%M %d.%m.%y': 'HH:MM dd.mm.yy',
                        '%I:%M:%S %x %p': 'HH:MM:SS mm/dd/yy am (US)',
                        '%H:%M:%S %d/%m/%y': 'HH:MM:SS dd/mm/yy (UK)',
                        '%H:%M:%S %m.%d.%y': 'HH:MM:SS mm.dd.yy',
                        '%H:%M %a': 'HH:MM dow',
                        '%H:%M:%S %a': 'HH:MM:SS dow',
                        '%H:%M %m.%d': 'HH:MM mm.dd',
                        '%H:%M:%S': 'HH:MM:SS',
                        '%H:%M': 'HH:MM',
                        '%d.%m': 'dd.mm',
                        '%d.%m.': 'dd.mm.',
                        '%m/%d': 'mm/dd',
                        '%d': 'dd',
                        '%m': 'mm',
                        '%y': 'y',
                        '%H': 'HH',
                        '%M': 'MM',
                        '%a': 'dow',
                        '%d.%m.%y': 'dd.mm.yy',
                    }}/>
                    <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Use comma'} name="useComma" />
                    <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Enable zoom and pan'} name="zoom" />
                    <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Hide edit button'} name="noedit" />
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} label="Animation" name="animation" options={{
                        '0': 'no',
                        '300': '300ms',
                        '500': '500ms',
                        '1000': '1 second',
                        '2000': '2 seconds',
                        '3000': '3 seconds',
                        '5000': '5 seconds',
                        '10000': '10 seconds',
                    }}/>
                </TabPanel>
                <TabPanel value="4">
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="title" label="Title"/>
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
                        'top:5;right:-5': 'Top, right, outside',
                        'top:50;right:-5': 'Middle, right, outside',
                        'bottom:5;right:-5': 'Bottom, right, outside',
                        'bottom:-5;left:50': 'Bottom, center, outside',
                    }}/>
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="titleColor" label="Title size" />
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="titleSize" label="Title size" />
                </TabPanel>
                <TabPanel value="5">
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="width" label="Width" type="number" />
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="options_height" label="Height" type="number" />
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="options_noborder" label="No border" options={{
                        '': '',
                        'noborder': 'yes',
                    }}/>
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="options_window_bg" label="Window background" />
                    <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} name="options_bg_custom" label={'Custom chart background'}/>
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="options_bg" label="Chart background" options={{
                        '': 'default',
                        '0': 'Portrait',
                        '1': 'Instagram',
                        '2': 'ServQuick',
                        '3': 'Metallic Toad',
                        '4': 'Clouds',
                        '5': 'Mirage',
                        '6': 'Steel Gray',
                        '7': 'Horizon',
                        '8': 'Koko Caramel',
                        '9': 'Turquoise flow',
                    }}/>
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="options_x_labels_color" label="X labels color" />
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="options_y_labels_color" label="Y labels color" />
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="options_border_color" label="Border color" />
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="options_grid_color" label="Grid color" />
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="options_border_width" label="Border width" />
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="barColor" label="Fill color" />
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="options_barLabels" label="Show labels" options={{
                        '': 'none',
                        'topover': 'top over',
                        'topunder': 'top under',
                        'bottom': 'bottom',
                        'middle': 'middle',
                    }}/>
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="options_barWidth" label="Bars width"/>
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="options_barFontSize" label="Label font size" />
                    <IOColorPicker formData={this.props.presetData} updateValue={this.updateField} name="options_barFontColor" label="Label color" />
                </TabPanel>
            </div>
        </TabContext>
    }
}

export default PresetTabs