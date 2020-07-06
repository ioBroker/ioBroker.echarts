import React from 'react';

import Tabs from '@material-ui/core/Tabs';
import TabList from '@material-ui/lab/TabList';
import Tab from '@material-ui/core/Tab';
import TabPanel from '@material-ui/lab/TabPanel';
import TabContext from '@material-ui/lab/TabContext';
import AppBar from '@material-ui/core/AppBar';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect, IOObjectField} from './Fields';

import Line from './Line';
import Marks from './Mark';

class PresetTabs extends React.Component {
    state = {
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
        selectedTab: "4"
    };

    componentDidMount() {
        this.setState(this.props.presetData);
    }

    componentWillReceiveProps(nextProps) {
        this.setState(nextProps.presetData);
    }

    updateField = (name, value)=>{
        let update = {};
        update[name] = value;
        this.setState(update, () => {
            this.props.onChange(this.state);
        });
    }

    render() {
        console.log(this.state.marks);
        return <TabContext value={this.state.selectedTab}>
            <AppBar position="static">
                <TabList aria-label="simple tabs example" onChange={(event, newValue)=>{this.setState({selectedTab: newValue})}}>
                    <Tab label="Data" value="0"/>
                    <Tab label="Markings" value="1"/>
                    <Tab label="Time" value="2"/>
                    <Tab label="Options" value="3"/>
                    <Tab label="Title" value="4"/>
                    <Tab label="Appearance" value="5"/>
                </TabList>
            </AppBar>
            <div style={{columnWidth: "200px", columnCount: 4, marginTop: "20px"}}>
                <TabPanel value="0">
                    Data
                    {
                        this.state.lines.map((line, key) => <Line key={key} socket={this.props.socket}/>)
                    }
                </TabPanel>
                <TabPanel value="1">
                    Markings
                    <Marks name="marks" marks={this.state.marks} updateField={this.updateField}/>
                </TabPanel>
                <TabPanel value="2">
                    Time
                    <IOSelect formData={this.state} updateValue={this.updateField} name="timeType" label="Type" options={{
                        'relative': 'relative',
                        'static': 'static',
                    }}/>
                    <IOSelect formData={this.state} updateValue={this.updateField} name="aggregateType" label="Step type" options={{
                        'count': 'counts',
                        'step': 'seconds',
                    }}/>
                    <IOTextField formData={this.state} updateValue={this.updateField} name="aggregateSpan" label="Counts" />
                    <IOTextField formData={this.state} updateValue={this.updateField} name="ticks" label="Use X-ticks from" />
                </TabPanel>
                <TabPanel value="3">
                    Options
                    <IOSelect formData={this.state} updateValue={this.updateField} label="Show legend" name="legend" options={{
                        '': 'none',
                        'nw': 'Top, left',
                        'ne': 'Top, right',
                        'sw': 'Bottom, left',
                        'se': 'Bottom, right',
                    }}/>
                    <IOTextField formData={this.state} updateValue={this.updateField} label="Legend columns" name="legColumns" />
                    <IOTextField formData={this.state} updateValue={this.updateField} label="Legend opacity" name="legBgOpacity" />
                    <IOColorPicker formData={this.state} updateValue={this.updateField} label="Legend background" name="legBg" />
                    <IOCheckbox formData={this.state} updateValue={this.updateField} label={'Hover details'} name="hoverDetail" />
                    <IOSelect formData={this.state} updateValue={this.updateField} label="Time format" name="timeFormat" options={{
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
                    <IOCheckbox formData={this.state} updateValue={this.updateField} label={'Use comma'} name="useComma" />
                    <IOCheckbox formData={this.state} updateValue={this.updateField} label={'Enable zoom and pan'} name="zoom" />
                    <IOCheckbox formData={this.state} updateValue={this.updateField} label={'Hide edit button'} name="noedit" />
                    <IOSelect formData={this.state} updateValue={this.updateField} label="Animation" name="animation" options={{
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
                    Title
                    <IOObjectField formData={this.state} updateValue={this.updateField} name="title" label="Title" socket={this.props.socket}/>
                    <IOSelect formData={this.state} updateValue={this.updateField} name="titlePos" label="Title position" options={{
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
                    <IOColorPicker formData={this.state} updateValue={this.updateField} name="titleColor" label="Title size" />
                    <IOTextField formData={this.state} updateValue={this.updateField} name="titleSize" label="Title size" />
                </TabPanel>
                <TabPanel value="5">
                    Appearance
                    <IOTextField formData={this.state} updateValue={this.updateField} name="width" label="Width" />
                    <IOTextField formData={this.state} updateValue={this.updateField} name="options_height" label="Height" />
                    <IOSelect formData={this.state} updateValue={this.updateField} name="options_noborder" label="No border" options={{
                        '': '',
                        'noborder': 'yes',
                    }}/>
                    <IOColorPicker formData={this.state} updateValue={this.updateField} name="options_window_bg" label="Window background" />
                    <IOCheckbox formData={this.state} updateValue={this.updateField} name="options_bg_custom" label={'Custom chart background'}/>
                    <IOSelect formData={this.state} updateValue={this.updateField} name="options_bg" label="Chart background" options={{
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
                    <IOColorPicker formData={this.state} updateValue={this.updateField} name="options_x_labels_color" label="X labels color" />
                    <IOColorPicker formData={this.state} updateValue={this.updateField} name="options_y_labels_color" label="Y labels color" />
                    <IOColorPicker formData={this.state} updateValue={this.updateField} name="options_border_color" label="Border color" />
                    <IOColorPicker formData={this.state} updateValue={this.updateField} name="options_grid_color" label="Grid color" />
                    <IOTextField formData={this.state} updateValue={this.updateField} name="options_border_width" label="Border width" />
                    <IOColorPicker formData={this.state} updateValue={this.updateField} name="barColor" label="Fill color" />
                    <IOSelect formData={this.state} updateValue={this.updateField} name="options_barLabels" label="Show labels" options={{
                        '': 'none',
                        'topover': 'top over',
                        'topunder': 'top under',
                        'bottom': 'bottom',
                        'middle': 'middle',
                    }}/>
                    <IOTextField formData={this.state} updateValue={this.updateField} name="options_barWidth" label="Bars width"/>
                    <IOTextField formData={this.state} updateValue={this.updateField} name="options_barFontSize" label="Label font size" />
                    <IOColorPicker formData={this.state} updateValue={this.updateField} name="options_barFontColor" label="Label color" />
                </TabPanel>
            </div>
        </TabContext>
    }
}

export default PresetTabs