import React from 'react';

import { Box, Toolbar, Button, Select, MenuItem, Popover } from '@mui/material';

import { IoMdTime as IconTime, IoMdArrowDropdown as IconDropDown } from 'react-icons/io';
import { FiRefreshCw as IconRefresh } from 'react-icons/fi';

import { MdAdd as IconPlus } from 'react-icons/md';

import { I18n } from '@iobroker/adapter-react-v5';

import { IOSelect, IODateTimeField, IONumberField } from './Fields';
import IconAggregate from './IconAggregate';
import type {
    ChartAggregateType,
    ChartConfigMore,
    ChartRangeOptions,
    ChartRelativeEnd,
    ChartType,
} from '../../../src/types';

const styles: Record<string, any> = {
    mainDiv: {
        paddingLeft: 40,
    },
    fieldsContainer: {
        '& > div': {
            display: 'flex',
            pr: '20px',
            width: 200,
        },
    },
    hintButton: {
        marginRight: 20,
        float: 'right',
    },
    popOver: {
        padding: 16,
    },
    refreshSelect: {
        display: 'inline-block',
        pl: '4px',
        '& > div:before': {
            borderWidth: 0,
        },
        '& > div:hover:before': {
            borderBottom: 0,
        },
        ml: '8px',
    },
    refreshSelectButtonTitle: {
        display: 'inline-flex',
        paddingTop: 6,
    },
    settingsButton: {
        color: 'currentColor',
        fontSize: 16,
        textTransform: 'inherit',
    },
    grow1: {
        flexGrow: 1,
    },
    aggregateIcon: {
        marginTop: 4,
    },
};

interface RefreshSelectProps {
    formData: Record<string, string | number | boolean>;
    updateValue: (name: string, value: any) => void;
    name: string;
    options: Record<string, string>;
    renderValue: () => React.JSX.Element;
    noTranslate?: boolean;
    sx?: Record<string, any>;
    tooltip?: string;
}

const RefreshSelect = (props: RefreshSelectProps): React.JSX.Element => (
    <Box
        component="div"
        sx={props.sx}
        title={props.tooltip}
    >
        <Select
            variant="standard"
            onChange={e => props.updateValue(props.name, e.target.value)}
            value={props.formData[props.name] || ''}
            renderValue={props.renderValue}
            displayEmpty
        >
            {props.options
                ? Object.keys(props.options).map(key => (
                      <MenuItem
                          key={key}
                          value={key}
                      >
                          {props.noTranslate ? props.options[key] : I18n.t(props.options[key])}
                      </MenuItem>
                  ))
                : null}
        </Select>
    </Box>
);

const rangeOptions: Record<ChartRangeOptions, string> = {
    10: '10 minutes',
    30: '30 minutes',
    60: '1 hour',
    120: '2 hours',
    180: '3 hours',
    360: '6 hours',
    720: '12 hours',
    1440: '1 day',
    2880: '2 days',
    4320: '3 days',
    10080: '7 days',
    20160: '14 days',
    '1m': '1 month',
    '2m': '2 months',
    '3m': '3 months',
    '6m': '6 months',
    '1y': '1 year',
    '2y': '2 years',
};

const relativeEndOptions: Record<ChartRelativeEnd, string> = {
    now: 'now',
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
    today: 'end of day',
    weekEurope: 'end of sunday',
    weekUsa: 'end of saturday',
    week2Europe: 'end of previous sunday',
    week2Usa: 'end of previous saturday',
    month: 'this month',
    year: 'this year',
};

const liveOptions: Record<'' | number, string> = {
    '': 'none',
    5: '5 seconds',
    10: '10 seconds',
    15: '15 seconds',
    20: '20 seconds',
    30: '30 seconds',
    60: '1 minute',
    120: '2 minutes',
    300: '5 minutes',
    600: '10 minutes',
    900: '15 minutes',
    1200: '20 minutes',
    1800: '30 minutes',
    3600: '1 hour',
    7200: '2 hours',
    10800: '3 hours',
    21600: '6 hours',
    43200: '12 hours',
    86400: '1 day',
};
const CHART_TYPES: Record<ChartType, string> = {
    auto: 'Auto (Line or Steps)',
    line: 'Line',
    bar: 'Bar',
    polar: 'Polar',
    scatterplot: 'Scatter plot',
    steps: 'Steps',
    stepsStart: 'Steps on start',
    spline: 'Spline',
};

const AGGREGATES: Record<ChartAggregateType, string> = {
    minmax: 'minmax',
    average: 'average',
    min: 'min',
    max: 'max',
    total: 'total',
    onchange: 'raw',
    percentile: 'percentile',
    integral: 'integral',
    count: 'count',
    none: 'none',
    current: 'current',
};

interface ChartSettingsProps {
    onChange: (presetData: ChartConfigMore) => void;
    presetData: ChartConfigMore;
    onCreatePreset: (isFromCurrentSelection: boolean, parentId?: string) => void;
}

interface ChartSettingsState {
    timeSpanOpened: boolean;
    aggregateOpened: boolean;
}

class ChartSettings extends React.Component<ChartSettingsProps, ChartSettingsState> {
    constructor(props: ChartSettingsProps) {
        super(props);
        this.state = {
            timeSpanOpened: false,
            aggregateOpened: false,
        };
    }

    updateField = (name: string, value: string | boolean | number, time?: boolean): void => {
        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
        (presetData as unknown as Record<string, string | boolean | number>)[name] = value;
        if (time) {
            (presetData as unknown as Record<string, string | boolean | number>)[`${name}_time`] = time;
        }
        this.props.onChange(presetData);
        window.localStorage.setItem(`App.echarts.__${name}`, value.toString());
    };

    render(): React.JSX.Element {
        return (
            <Toolbar
                style={styles.mainDiv}
                variant="dense"
            >
                <Button
                    color="grey"
                    title={I18n.t('Time span')}
                    size="small"
                    style={styles.settingsButton}
                    id="timeSpanOpenButton"
                    onClick={() => this.setState({ timeSpanOpened: !this.state.timeSpanOpened })}
                >
                    <IconTime />
                    {this.props.presetData.timeType === 'relative'
                        ? `${I18n.t(rangeOptions[this.props.presetData.range])} ${I18n.t('to')} ${I18n.t(relativeEndOptions[this.props.presetData.relativeEnd])}`
                        : `${this.props.presetData.start} ${this.props.presetData.start_time} - ${this.props.presetData.end} ${this.props.presetData.end_time}`}
                    <IconDropDown />
                </Button>
                <Popover
                    style={styles.popOver}
                    open={this.state.timeSpanOpened}
                    onClose={() => {
                        this.setState({ timeSpanOpened: false });
                    }}
                    anchorEl={() => document.getElementById('timeSpanOpenButton')}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                >
                    <div style={styles.popOver}>
                        <Box
                            component="div"
                            sx={styles.fieldsContainer}
                        >
                            <IOSelect
                                value={this.props.presetData.timeType}
                                updateValue={(value: string): void => {
                                    const presetData: ChartConfigMore = JSON.parse(
                                        JSON.stringify(this.props.presetData),
                                    );
                                    presetData.timeType = value as 'relative' | 'static';
                                    this.props.onChange(presetData);
                                    window.localStorage.setItem(`App.echarts.__timeType`, value.toString());
                                }}
                                label="Type"
                                options={{
                                    relative: 'relative',
                                    static: 'static',
                                }}
                            />
                            {this.props.presetData.timeType === 'static' ? (
                                <>
                                    <IODateTimeField
                                        date={this.props.presetData.start.toString()}
                                        time={this.props.presetData.start_time}
                                        updateValue={(date: string, time: string): void => {
                                            const presetData: ChartConfigMore = JSON.parse(
                                                JSON.stringify(this.props.presetData),
                                            );
                                            presetData.start = date;
                                            presetData.start_time = time;
                                            this.props.onChange(presetData);
                                            window.localStorage.setItem(`App.echarts.__start`, date);
                                            window.localStorage.setItem(`App.echarts.__start_time`, time);
                                        }}
                                        label="Start"
                                    />
                                    <IODateTimeField
                                        date={this.props.presetData.end.toString()}
                                        time={this.props.presetData.end_time}
                                        updateValue={(date: string, time: string): void => {
                                            const presetData: ChartConfigMore = JSON.parse(
                                                JSON.stringify(this.props.presetData),
                                            );
                                            presetData.end = date;
                                            presetData.end_time = time;
                                            this.props.onChange(presetData);
                                            window.localStorage.setItem(`App.echarts.__end`, date);
                                            window.localStorage.setItem(`App.echarts.__end_time`, time);
                                        }}
                                        label="End"
                                    />
                                </>
                            ) : (
                                <>
                                    <IOSelect
                                        value={this.props.presetData.relativeEnd}
                                        updateValue={(value: string): void => {
                                            const presetData: ChartConfigMore = JSON.parse(
                                                JSON.stringify(this.props.presetData),
                                            );
                                            presetData.relativeEnd = value as ChartRelativeEnd;
                                            this.props.onChange(presetData);
                                            window.localStorage.setItem(`App.echarts.__relativeEnd`, value);
                                        }}
                                        label="End"
                                        options={relativeEndOptions}
                                    />
                                    <IOSelect
                                        value={this.props.presetData.range.toString()}
                                        updateValue={(value: string): void => {
                                            const presetData: ChartConfigMore = JSON.parse(
                                                JSON.stringify(this.props.presetData),
                                            );
                                            presetData.range = value as ChartRangeOptions;
                                            this.props.onChange(presetData);
                                            window.localStorage.setItem(`App.echarts.__range`, value);
                                        }}
                                        label="Range"
                                        options={rangeOptions}
                                    />
                                </>
                            )}
                        </Box>
                    </div>
                </Popover>
                <Button
                    color="grey"
                    title={I18n.t('Aggregate')}
                    size="small"
                    style={styles.settingsButton}
                    id="aggregateOpenButton"
                    onClick={() => this.setState({ aggregateOpened: !this.state.aggregateOpened })}
                >
                    <IconAggregate style={styles.aggregateIcon} />
                    {CHART_TYPES[this.props.presetData.chartType]
                        ? I18n.t(CHART_TYPES[this.props.presetData.chartType])
                        : ''}
                    /
                    {AGGREGATES[this.props.presetData.aggregate]
                        ? I18n.t(AGGREGATES[this.props.presetData.aggregate])
                        : ''}
                    <IconDropDown />
                </Button>
                <Popover
                    open={this.state.aggregateOpened}
                    anchorEl={() => document.getElementById('aggregateOpenButton')}
                    onClose={() => {
                        this.setState({ aggregateOpened: false });
                    }}
                >
                    <div style={styles.popOver}>
                        <Box
                            component="div"
                            sx={styles.fieldsContainer}
                        >
                            <IOSelect
                                value={this.props.presetData.chartType}
                                updateValue={(value: string): void => {
                                    const presetData: ChartConfigMore = JSON.parse(
                                        JSON.stringify(this.props.presetData),
                                    );
                                    presetData.chartType = value as ChartType;
                                    this.props.onChange(presetData);
                                    window.localStorage.setItem(`App.echarts.__chartType`, value);
                                }}
                                label="Chart type"
                                options={CHART_TYPES}
                            />
                            {this.props.presetData.chartType !== 'auto' ? (
                                <IOSelect
                                    value={this.props.presetData.aggregate}
                                    updateValue={(value: string): void => {
                                        const presetData: ChartConfigMore = JSON.parse(
                                            JSON.stringify(this.props.presetData),
                                        );
                                        presetData.aggregate = value as ChartAggregateType;
                                        this.props.onChange(presetData);
                                        window.localStorage.setItem(`App.echarts.__aggregate`, value);
                                    }}
                                    label="Aggregate"
                                    options={AGGREGATES}
                                />
                            ) : null}
                            {this.props.presetData.aggregate !== 'onchange' ? (
                                <IOSelect
                                    value={this.props.presetData.aggregateType}
                                    updateValue={(value: string): void => {
                                        const presetData: ChartConfigMore = JSON.parse(
                                            JSON.stringify(this.props.presetData),
                                        );
                                        presetData.aggregateType = value as 'count' | 'step';
                                        this.props.onChange(presetData);
                                        window.localStorage.setItem(`App.echarts.__aggregateType`, value);
                                    }}
                                    label="Step type"
                                    options={{
                                        count: 'counts',
                                        step: 'seconds',
                                    }}
                                />
                            ) : null}
                            {this.props.presetData.aggregate !== 'onchange' ? (
                                <IONumberField
                                    value={this.props.presetData.aggregateSpan}
                                    updateValue={(value: number): void => {
                                        const presetData: ChartConfigMore = JSON.parse(
                                            JSON.stringify(this.props.presetData),
                                        );
                                        presetData.aggregateSpan = value;
                                        this.props.onChange(presetData);
                                        window.localStorage.setItem(`App.echarts.__aggregateSpan`, value.toString());
                                    }}
                                    label={this.props.presetData.aggregateType === 'step' ? 'Seconds' : 'Counts'}
                                />
                            ) : null}
                        </Box>
                    </div>
                </Popover>
                {this.props.presetData.timeType === 'relative' ? (
                    <RefreshSelect
                        sx={styles.refreshSelect}
                        formData={this.props.presetData as unknown as Record<string, string>}
                        updateValue={(_name: string, value: string): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.live = parseInt(value, 10);
                            this.props.onChange(presetData);
                            window.localStorage.setItem(`App.echarts.__live`, value);
                        }}
                        name="live"
                        tooltip={I18n.t('Auto-refresh')}
                        options={liveOptions}
                        renderValue={() => (
                            <div style={styles.refreshSelectButtonTitle}>
                                <IconRefresh />
                                &nbsp;
                                {I18n.t(liveOptions[this.props.presetData.live])}
                            </div>
                        )}
                    />
                ) : null}
                <div style={styles.grow1} />
                <Button
                    variant="contained"
                    color="primary"
                    style={styles.hintButton}
                    onClick={() => this.props.onCreatePreset(true)}
                >
                    <IconPlus style={styles.buttonIcon} />
                    {I18n.t('Create preset')}
                </Button>
            </Toolbar>
        );
    }
}

export default ChartSettings;
