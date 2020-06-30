import React from 'react';

import Tabs from '@material-ui/core/Tabs';
import TabList from '@material-ui/lab/TabList';
import Tab from '@material-ui/core/Tab';
import TabPanel from '@material-ui/lab/TabPanel';
import TabContext from '@material-ui/lab/TabContext';
import AppBar from '@material-ui/core/AppBar';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect} from './Fields';
import Line from './Line';
import Mark from './Mark';

class PresetTabs extends React.Component {
    state = {};

    render() {
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
                    <Line/>
                </TabPanel>
                <TabPanel value="1">
                    Markings
                    <Mark/>
                </TabPanel>
                <TabPanel value="2">
                    Time
                    <IOSelect label="Type"/>
                    <IOSelect label="Step type"/>
                    <IOTextField label="Counts" />
                    <IOTextField label="Use X-ticks from" />
                </TabPanel>
                <TabPanel value="3">
                    Options
                    <IOSelect label="Show legend"/>
                    <IOTextField label="Legend columns" />
                    <IOTextField label="Legend opacity" />
                    <IOColorPicker value={this.state.windowBackground} onChange={(color)=>{this.setState({windowBackground: color})}} label="Legend background" />
                    <IOCheckbox label={'Hover details'}/>
                    <IOSelect label="Time format"/>
                    <IOCheckbox label={'Use comma'}/>
                    <IOCheckbox label={'Enable zoom and pan'}/>
                    <IOCheckbox label={'Hide edit button'}/>
                    <IOSelect label="Animation"/>
                </TabPanel>
                <TabPanel value="4">
                    Title
                    <IOTextField label="Title" />
                    <IOSelect label="Title position"/>
                    <IOColorPicker value={this.state.windowBackground} onChange={(color)=>{this.setState({windowBackground: color})}} label="Title size" />
                    <IOTextField label="Title size" />
                </TabPanel>
                <TabPanel value="5">
                    Appearance
                    <IOTextField label="Width" />
                    <IOTextField label="Height" />
                    <IOSelect label="No border"/>
                    <IOColorPicker value={this.state.windowBackground} onChange={(color)=>{this.setState({windowBackground: color})}} label="Window background" />
                    <IOCheckbox label={'Custom chart background'}/>
                    <IOSelect label="Chart background"/>
                    <IOColorPicker value={this.state.windowBackground} onChange={(color)=>{this.setState({windowBackground: color})}} label="X labels color" />
                    <IOColorPicker value={this.state.windowBackground} onChange={(color)=>{this.setState({windowBackground: color})}} label="Y labels color" />
                    <IOColorPicker value={this.state.windowBackground} onChange={(color)=>{this.setState({windowBackground: color})}} label="Border color" />
                    <IOColorPicker value={this.state.windowBackground} onChange={(color)=>{this.setState({windowBackground: color})}} label="Grid color" />
                    <IOTextField label="Border width" />
                    <IOColorPicker value={this.state.windowBackground} onChange={(color)=>{this.setState({windowBackground: color})}} label="Fill color" />
                    <IOSelect label="Show labels"/>
                    <IOTextField label="Bars width" />
                    <IOTextField label="Label font size" />
                    <IOColorPicker value={this.state.windowBackground} onChange={(color)=>{this.setState({windowBackground: color})}} label="Label color" />
                </TabPanel>
            </div>
        </TabContext>
    }
}

export default PresetTabs