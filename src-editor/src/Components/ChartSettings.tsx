import React from 'react';

import {
    Box,
    Toolbar,
    Button,
    Select,
    MenuItem,
    Popover,
    Dialog,
    DialogActions,
    IconButton,
    DialogContent,
} from '@mui/material';
import {
    Close,
    Add as IconPlus,
    Refresh as IconRefresh,
    ArrowDropDown as IconDropDown,
    AccessTime as IconTime,
    MoreVert,
} from '@mui/icons-material';

import { I18n, type IobTheme } from '@iobroker/adapter-react-v5';

import { IOSelect, IODateTimeField, IONumberField } from './Fields';
import IconAggregate from './IconAggregate';
import type {
    ChartAggregateType,
    ChartConfigMore,
    ChartRangeOptions,
    ChartRelativeEnd,
    ChartType,
} from '../../../src/types';

const WIDTHS = {
    timeSpan: 200,
    aggregate: 250,
    autoRefresh: 150,
    bigButton: 200,
};

const styles: Record<string, any> = {
    mainDiv: {
        gap: 2,
    },
    fieldsContainer: {
        '& > div': {
            display: 'flex',
            pr: '20px',
            width: 200,
        },
    },
    popOver: {
        padding: 16,
    },
    refreshSelect: {
        display: 'inline-block',
        '& > div:before': {
            borderWidth: 0,
        },
        '& > div:hover:before': {
            borderBottom: 0,
        },
    },
    refreshSelectButtonTitle: {
        display: 'inline-flex',
        paddingTop: 6,
    },
    settingsButton: {
        color: 'currentColor',
        fontSize: 16,
        textTransform: 'inherit',
        flexGrow: 1,
    },
    grow1: {
        flexGrow: 2,
    },
    aggregateIcon: {
        marginTop: 4,
    },
    divider: (theme: IobTheme): React.CSSProperties => ({
        borderLeftColor: theme.palette.mode === 'dark' ? '#CCC' : '#444',
        borderLeftStyle: 'dotted',
        borderLeftWidth: '1px',
        width: '1px',
        height: '80%',
    }),
};

interface RefreshSelectProps {
    value: number;
    updateValue: (value: number) => void;
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
            onChange={e => props.updateValue(parseInt(e.target.value, 10))}
            value={props.value.toString() || ''}
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
    windowWidth: number;
}

interface ChartSettingsState {
    timeSpanOpened: boolean;
    aggregateOpened: boolean;
    clientWidth: number;
    showMore: boolean;
}

class ChartSettings extends React.Component<ChartSettingsProps, ChartSettingsState> {
    private windowWidth: number;
    private readonly toolbarRef: React.RefObject<HTMLDivElement>;

    constructor(props: ChartSettingsProps) {
        super(props);

        this.windowWidth = this.props.windowWidth;

        this.state = {
            timeSpanOpened: false,
            aggregateOpened: false,
            clientWidth: 0,
            showMore: false,
        };

        this.toolbarRef = React.createRef();
    }

    componentDidMount(): void {
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount(): void {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize = (): void => {
        if (this.toolbarRef.current && this.toolbarRef.current.clientWidth !== this.state.clientWidth) {
            this.setState({ clientWidth: this.toolbarRef.current.clientWidth });
        }
    };

    componentDidUpdate(): void {
        if (this.toolbarRef.current && this.toolbarRef.current.clientWidth !== this.state.clientWidth) {
            // This one is just to trigger the update of component if width of a menu changed
            this.windowWidth = this.props.windowWidth;
            this.setState({ clientWidth: this.toolbarRef.current.clientWidth });
        }
    }

    renderShowMore(): React.JSX.Element | null {
        if (!this.state.showMore) {
            return null;
        }
        return (
            <Dialog
                maxWidth="xs"
                fullWidth
                open={!0}
                onClose={() => this.setState({ showMore: false })}
            >
                <DialogContent>
                    {this.renderTimeSpanElements()}
                    {this.renderAggregateElements()}
                    {this.renderAutoRefresh()}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => this.setState({ showMore: false })}
                        startIcon={<Close />}
                    >
                        {I18n.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    renderTimeSpanElements(): (React.JSX.Element | null)[] {
        return [
            <IOSelect
                fullWidth
                key="time-type"
                value={this.props.presetData.timeType}
                updateValue={(value: string): void => {
                    const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                    presetData.timeType = value as 'relative' | 'static';
                    this.props.onChange(presetData);
                    window.localStorage.setItem(`App.echarts.__timeType`, value.toString());
                }}
                label="Type"
                options={{
                    relative: 'relative',
                    static: 'static',
                }}
            />,
            this.props.presetData.timeType === 'static' ? (
                <IODateTimeField
                    fullWidth
                    key="static-start"
                    date={this.props.presetData.start.toString()}
                    time={this.props.presetData.start_time}
                    updateValue={(date: string, time: string): void => {
                        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                        presetData.start = date;
                        presetData.start_time = time;
                        this.props.onChange(presetData);
                        window.localStorage.setItem(`App.echarts.__start`, date);
                        window.localStorage.setItem(`App.echarts.__start_time`, time);
                    }}
                    label="Start"
                />
            ) : null,
            this.props.presetData.timeType === 'static' ? (
                <IODateTimeField
                    fullWidth
                    key="static-end"
                    date={this.props.presetData.end.toString()}
                    time={this.props.presetData.end_time}
                    updateValue={(date: string, time: string): void => {
                        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                        presetData.end = date;
                        presetData.end_time = time;
                        this.props.onChange(presetData);
                        window.localStorage.setItem(`App.echarts.__end`, date);
                        window.localStorage.setItem(`App.echarts.__end_time`, time);
                    }}
                    label="End"
                />
            ) : null,
            this.props.presetData.timeType !== 'static' ? (
                <IOSelect
                    fullWidth
                    key="non-static-end"
                    value={this.props.presetData.relativeEnd}
                    updateValue={(value: string): void => {
                        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                        presetData.relativeEnd = value as ChartRelativeEnd;
                        this.props.onChange(presetData);
                        window.localStorage.setItem(`App.echarts.__relativeEnd`, value);
                    }}
                    label="End"
                    options={relativeEndOptions}
                />
            ) : null,
            this.props.presetData.timeType !== 'static' ? (
                <IOSelect
                    fullWidth
                    key="non-static-range"
                    value={this.props.presetData.range.toString()}
                    updateValue={(value: string): void => {
                        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                        presetData.range = value as ChartRangeOptions;
                        this.props.onChange(presetData);
                        window.localStorage.setItem(`App.echarts.__range`, value);
                    }}
                    label="Range"
                    options={rangeOptions}
                />
            ) : null,
        ];
    }

    renderTimeSpan(): React.JSX.Element {
        return (
            <>
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
                <Box sx={styles.divider} />
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
                            {this.renderTimeSpanElements()}
                        </Box>
                    </div>
                </Popover>
            </>
        );
    }

    renderAggregateElements(): (React.JSX.Element | null)[] {
        return [
            <IOSelect
                key="chart-type"
                fullWidth
                value={this.props.presetData.chartType}
                updateValue={(value: string): void => {
                    const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                    presetData.chartType = value as ChartType;
                    this.props.onChange(presetData);
                    window.localStorage.setItem(`App.echarts.__chartType`, value);
                }}
                label="Chart type"
                options={CHART_TYPES}
            />,
            this.props.presetData.chartType !== 'auto' ? (
                <IOSelect
                    key="aggregate"
                    fullWidth
                    value={this.props.presetData.aggregate}
                    updateValue={(value: string): void => {
                        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                        presetData.aggregate = value as ChartAggregateType;
                        this.props.onChange(presetData);
                        window.localStorage.setItem(`App.echarts.__aggregate`, value);
                    }}
                    label="Aggregate"
                    options={AGGREGATES}
                />
            ) : null,
            this.props.presetData.aggregate !== 'onchange' ? (
                <IOSelect
                    key="aggregateType"
                    fullWidth
                    value={this.props.presetData.aggregateType}
                    updateValue={(value: string): void => {
                        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
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
            ) : null,
            this.props.presetData.aggregate !== 'onchange' ? (
                <IONumberField
                    key="aggregateSpan"
                    fullWidth
                    value={this.props.presetData.aggregateSpan}
                    updateValue={(value: number): void => {
                        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                        presetData.aggregateSpan = value;
                        this.props.onChange(presetData);
                        window.localStorage.setItem(`App.echarts.__aggregateSpan`, value.toString());
                    }}
                    label={this.props.presetData.aggregateType === 'step' ? 'Seconds' : 'Counts'}
                />
            ) : null,
        ];
    }

    renderAggregate(): React.JSX.Element {
        return (
            <>
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
                <Box sx={styles.divider} />
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
                            {this.renderAggregateElements()}
                        </Box>
                    </div>
                </Popover>
            </>
        );
    }

    renderAutoRefresh(): React.JSX.Element | null {
        if (this.props.presetData.timeType !== 'relative') {
            return null;
        }
        return (
            <RefreshSelect
                sx={styles.refreshSelect}
                value={this.props.presetData.live}
                updateValue={(value: number): void => {
                    const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                    presetData.live = value;
                    this.props.onChange(presetData);
                    window.localStorage.setItem(`App.echarts.__live`, value.toString());
                }}
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
        );
    }

    render(): React.JSX.Element {
        const visible = {
            timeSpan: false,
            aggregate: false,
            autoRefresh: false,
            bigButton: false,
        };
        let showMore = false;

        const windowWidth = (this.state.clientWidth || 1024) - 32 - 40 - 20; // 32 is padding, width of folder icon is 40, 20 is drag handle
        const padding = 4;
        const refreshVisible = this.props.presetData.timeType === 'relative' ? 1 : 0;

        if (
            windowWidth >=
            WIDTHS.timeSpan + WIDTHS.aggregate + WIDTHS.autoRefresh * refreshVisible + WIDTHS.bigButton + padding * 3
        ) {
            visible.timeSpan = true;
            visible.aggregate = true;
            visible.autoRefresh = true;
            visible.bigButton = true;
        } else if (
            windowWidth >=
            WIDTHS.timeSpan +
                WIDTHS.aggregate +
                WIDTHS.autoRefresh * refreshVisible +
                48 + // small button
                padding * 3
        ) {
            visible.timeSpan = true;
            visible.aggregate = true;
            visible.autoRefresh = !!refreshVisible;
            visible.bigButton = false;
        } else if (
            windowWidth >=
            WIDTHS.timeSpan +
                WIDTHS.aggregate +
                48 + // small button
                padding * 2
        ) {
            visible.timeSpan = true;
            visible.aggregate = true;
            showMore = !!refreshVisible;
        } else if (
            windowWidth >=
            WIDTHS.timeSpan +
                48 + // small button
                padding
        ) {
            visible.timeSpan = true;
            showMore = true;
        } else {
            showMore = true;
        }

        return (
            <Toolbar
                ref={this.toolbarRef}
                style={styles.mainDiv}
                variant="dense"
            >
                {this.renderShowMore()}
                {visible.timeSpan ? this.renderTimeSpan() : null}
                {visible.aggregate ? this.renderAggregate() : null}
                {visible.autoRefresh ? (
                    <>
                        {this.renderAutoRefresh()}
                        <Box sx={styles.divider} />
                    </>
                ) : null}
                <div style={styles.grow1} />
                {showMore ? (
                    <IconButton
                        size="small"
                        title={I18n.t('Show controls')}
                        onClick={() => this.setState({ showMore: true })}
                    >
                        <MoreVert />
                    </IconButton>
                ) : null}
                {!visible.bigButton ? (
                    <IconButton
                        size="small"
                        color="primary"
                        title={I18n.t('Create preset')}
                        onClick={() => this.props.onCreatePreset(true)}
                    >
                        <IconPlus />
                    </IconButton>
                ) : (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => this.props.onCreatePreset(true)}
                        startIcon={<IconPlus />}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {I18n.t('Create preset')}
                    </Button>
                )}
            </Toolbar>
        );
    }
}

export default ChartSettings;
