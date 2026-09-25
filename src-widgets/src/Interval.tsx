import React from 'react';

import { MenuItem, TextField } from '@mui/material';

import { I18n } from '@iobroker/gui-components';
import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';

import { type EchartsTimeRange, publishTimeRange } from './timeRangeBus';

/** vis-2 keeps the texts of a widget set under the name of the adapter */
const PREFIX = 'echarts_';

/**
 * vis-2 puts the texts of a widget set under the name of the adapter, and translates the labels of
 * the attributes with that prefix itself. What the widget writes on its own must bring it along.
 */
function t(key: string): string {
    // Never twice: vis-2 hands the labels of the attributes through its own prefix, and a label that
    // already carries it would otherwise be looked up as `echarts_echarts_…` and show up raw
    return I18n.t(key.startsWith(PREFIX) ? key : `${PREFIX}${key}`);
}

/** The ranges of the preset editor, so both offer the user the same steps */
const RANGE_OPTIONS: { value: string; label: string }[] = [
    { value: '10', label: '10 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '120', label: '2 hours' },
    { value: '180', label: '3 hours' },
    { value: '360', label: '6 hours' },
    { value: '720', label: '12 hours' },
    { value: '1440', label: '1 day' },
    { value: '2880', label: '2 days' },
    { value: '4320', label: '3 days' },
    { value: '10080', label: '7 days' },
    { value: '20160', label: '14 days' },
    { value: '1m', label: '1 month' },
    { value: '2m', label: '2 months' },
    { value: '3m', label: '3 months' },
    { value: '6m', label: '6 months' },
    { value: '1y', label: '1 year' },
    { value: '2y', label: '2 years' },
];

const RELATIVE_END_OPTIONS: { value: string; label: string }[] = [
    { value: 'now', label: 'now' },
    { value: '1minute', label: 'end of minute' },
    { value: '5minutes', label: 'end of 5 minutes' },
    { value: '10minutes', label: 'end of 10 minutes' },
    { value: '30minutes', label: 'end of 30 minutes' },
    { value: '1hour', label: 'end of hour' },
    { value: '2hours', label: 'end of 2 hours' },
    { value: '3hours', label: 'end of 3 hours' },
    { value: '4hours', label: 'end of 4 hours' },
    { value: '6hours', label: 'end of 6 hours' },
    { value: '8hours', label: 'end of 8 hours' },
    { value: '12hours', label: 'end of 12 hours' },
    { value: 'today', label: 'end of day' },
    { value: 'weekEurope', label: 'end of sunday' },
    { value: 'weekUsa', label: 'end of saturday' },
    { value: 'month', label: 'this month' },
    { value: 'year', label: 'this year' },
];

const TIME_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: 'relative', label: 'relative' },
    { value: 'static', label: 'static' },
];

/**
 * A copy for the widget info.
 *
 * The lists below serve two masters: the attributes of the widget, whose labels vis-2 translates on
 * its own, and the fields the widget draws itself. They must not be the same objects, or what vis-2
 * writes into them would reach the render.
 */
function copyOptions(options: { value: string; label: string }[]): { value: string; label: string }[] {
    return options.map(option => ({ ...option }));
}

/** How many charts one selector may drive. Enough for a view full of charts, and it keeps the loop short. */
const MAX_CHARTS = 10;

interface IntervalRxData {
    noCard?: boolean;
    widgetTitle?: string;
    horizontal?: boolean;
    variant?: 'standard' | 'outlined' | 'filled';
    remember?: boolean;
    chartsCount?: number | string;

    showType?: boolean;
    timeType?: 'relative' | 'static';
    showEnd?: boolean;
    relativeEnd?: string;
    showRange?: boolean;
    range?: string;

    start?: string;
    start_time?: string;
    end?: string;
    end_time?: string;

    /** `chart1` … `chartN`: the widget IDs of the charts this selector drives */
    [chart: string]: unknown;
}

export interface IntervalState extends VisRxWidgetState {
    timeRange: EchartsTimeRange;
}

export default class Interval extends (window.visRxWidget as typeof VisRxWidget)<IntervalRxData, IntervalState> {
    constructor(props: VisRxWidgetProps) {
        super(props);
        this.state = {
            ...this.state,
            timeRange: {},
        };
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplEchartsInterval',

            visSet: 'echarts',
            visSetLabel: 'set_label',
            visSetColor: '#aa314d',

            visWidgetLabel: 'interval_label',
            visName: 'E-Charts interval',
            visHelp: 'interval_help',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        {
                            name: 'noCard',
                            label: 'without_card',
                            type: 'checkbox',
                            default: true,
                        },
                        {
                            name: 'widgetTitle',
                            label: 'name',
                            hidden: '!!data.noCard',
                        },
                        {
                            name: 'horizontal',
                            label: 'horizontal',
                            type: 'checkbox',
                            default: true,
                        },
                        {
                            name: 'variant',
                            label: 'variant',
                            type: 'select',
                            default: 'standard',
                            options: [
                                { value: 'standard', label: 'variant_standard' },
                                { value: 'outlined', label: 'variant_outlined' },
                                { value: 'filled', label: 'variant_filled' },
                            ],
                        },
                        {
                            name: 'remember',
                            label: 'remember',
                            tooltip: 'remember_tooltip',
                            type: 'checkbox',
                            default: true,
                        },
                    ],
                },
                {
                    name: 'interval',
                    label: 'interval_group',
                    fields: [
                        {
                            name: 'showType',
                            label: 'showType',
                            type: 'checkbox',
                            default: true,
                        },
                        {
                            name: 'timeType',
                            label: 'timeType',
                            type: 'select',
                            default: 'relative',
                            options: copyOptions(TIME_TYPE_OPTIONS),
                        },
                        {
                            name: 'showEnd',
                            label: 'showEnd',
                            type: 'checkbox',
                            default: true,
                        },
                        {
                            name: 'relativeEnd',
                            label: 'relativeEnd',
                            type: 'select',
                            default: 'now',
                            options: copyOptions(RELATIVE_END_OPTIONS),
                            hidden: 'data.timeType === "static"',
                        },
                        {
                            name: 'showRange',
                            label: 'showRange',
                            type: 'checkbox',
                            default: true,
                        },
                        {
                            name: 'range',
                            label: 'range',
                            type: 'select',
                            default: '1440',
                            options: copyOptions(RANGE_OPTIONS),
                            hidden: 'data.timeType === "static"',
                        },
                        {
                            name: 'start',
                            label: 'start',
                            tooltip: 'date_tooltip',
                            hidden: 'data.timeType !== "static"',
                        },
                        {
                            name: 'start_time',
                            label: 'start_time',
                            tooltip: 'time_tooltip',
                            default: '00:00',
                            hidden: 'data.timeType !== "static"',
                        },
                        {
                            name: 'end',
                            label: 'end',
                            tooltip: 'date_tooltip',
                            hidden: 'data.timeType !== "static"',
                        },
                        {
                            name: 'end_time',
                            label: 'end_time',
                            tooltip: 'time_tooltip',
                            default: '23:59',
                            hidden: 'data.timeType !== "static"',
                        },
                    ],
                },
                {
                    name: 'charts',
                    label: 'charts_group',
                    fields: [
                        {
                            name: 'chartsCount',
                            label: 'chartsCount',
                            type: 'number',
                            min: 1,
                            max: MAX_CHARTS,
                            default: 1,
                        },
                    ],
                },
                {
                    name: 'chart',
                    label: 'chart_group',
                    indexFrom: 1,
                    indexTo: 'chartsCount',
                    fields: [
                        {
                            name: 'chart',
                            label: 'chart_widget',
                            type: 'widget',
                            tpl: 'tplEchartsChart',
                        },
                    ],
                },
            ],
            visDefaultStyle: {
                width: '100%',
                height: 80,
                position: 'relative',
            },
            visPrev: 'widgets/echarts/img/prev_echarts_interval.png',
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return Interval.getWidgetInfo();
    }

    /** The key under which the choice of the user survives a reload of the page */
    private get storageKey(): string {
        return `echarts.interval.${this.props.view}.${this.props.id}`;
    }

    /**
     * The range as the widget attributes define it, before the user touched anything.
     *
     * Both kinds are always filled in, also the one the type does not use at the moment: the user may
     * switch the type at runtime, and a static range without a date would leave the chart with an
     * invalid start. Which of the two counts is decided by `timeType` alone.
     */
    private getConfiguredRange(): EchartsTimeRange {
        const data = this.state.rxData;
        const now = new Date();
        const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now
            .getDate()
            .toString()
            .padStart(2, '0')}`;

        return {
            timeType: data.timeType === 'static' ? 'static' : 'relative',
            range: (data.range ?? '1440').toString(),
            relativeEnd: data.relativeEnd || 'now',
            start: data.start || today,
            start_time: data.start_time || '00:00',
            end: data.end || today,
            end_time: data.end_time || '23:59',
        };
    }

    /**
     * The range the widget starts with: what the user picked the last time if it should be remembered,
     * otherwise the one from the attributes. In the editor the attributes always win, or the designer
     * would not see what a change of them does.
     */
    private getInitialRange(): EchartsTimeRange {
        const configured = this.getConfiguredRange();

        if (this.props.editMode || !this.state.rxData.remember) {
            return configured;
        }

        try {
            const stored = window.localStorage.getItem(this.storageKey);
            if (stored) {
                // only the parts the user may change are taken over, the rest follows the attributes
                return { ...configured, ...(JSON.parse(stored) as EchartsTimeRange) };
            }
        } catch {
            // a broken entry is not worth a message, the attributes are a good range as well
        }

        return configured;
    }

    /**
     * The chart widgets this selector drives: the ones that were picked in its settings, and as long
     * as none was picked, every E-Charts widget of the same view - a selector that was just dropped
     * beside a chart works without any further setting.
     */
    private getTargets(): string[] {
        const count = Math.min(parseInt((this.state.rxData.chartsCount ?? 1).toString(), 10) || 1, MAX_CHARTS);
        const targets: string[] = [];

        for (let i = 1; i <= count; i++) {
            const wid = this.state.rxData[`chart${i}`];
            if (typeof wid === 'string' && wid) {
                targets.push(wid);
            }
        }

        if (targets.length) {
            return targets;
        }

        const widgets = this.props.context.views?.[this.props.view]?.widgets;
        return widgets
            ? Object.keys(widgets).filter(
                  wid => (widgets as Record<string, { tpl?: string }>)[wid]?.tpl === 'tplEchartsChart',
              )
            : [];
    }

    private applyRange(timeRange: EchartsTimeRange, remember: boolean): void {
        this.setState({ timeRange });
        publishTimeRange(this.getTargets(), timeRange);

        if (remember && !this.props.editMode && this.state.rxData.remember) {
            try {
                window.localStorage.setItem(this.storageKey, JSON.stringify(timeRange));
            } catch {
                // a full or blocked storage only costs the memory of the choice
            }
        }
    }

    componentDidMount(): void {
        super.componentDidMount();
        this.applyRange(this.getInitialRange(), false);
    }

    onRxDataChanged(): void {
        // In the editor the widget follows its attributes, or the designer would not see what a change
        // of them does. At runtime the choice of the user stands: an update of the data - a binding or
        // a filter, for example - must not throw it away
        if (this.props.editMode) {
            this.applyRange(this.getInitialRange(), false);
        }
    }

    private onChange(part: Partial<EchartsTimeRange>): void {
        // Both kinds of range stand in the state, so a switch of the type needs nothing else
        this.applyRange({ ...this.getConfiguredRange(), ...this.state.timeRange, ...part }, true);
    }

    private renderSelect(
        label: string,
        value: string,
        options: { value: string; label: string }[],
        onChange: (value: string) => void,
    ): React.JSX.Element {
        return (
            <TextField
                variant={this.state.rxData.variant || 'standard'}
                select
                fullWidth
                label={t(label)}
                value={value}
                onChange={e => onChange(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
            >
                {options.map(option => (
                    <MenuItem
                        key={option.value}
                        value={option.value}
                    >
                        {t(option.label)}
                    </MenuItem>
                ))}
            </TextField>
        );
    }

    /** Start and end of a static range, in one field each, as the preset editor shows them */
    private renderDateTime(label: string, which: 'start' | 'end'): React.JSX.Element {
        const date = this.state.timeRange[which] || '';
        const time = this.state.timeRange[`${which}_time`] || (which === 'start' ? '00:00' : '23:59');

        return (
            <TextField
                variant={this.state.rxData.variant || 'standard'}
                type="datetime-local"
                fullWidth
                label={t(label)}
                value={date ? `${date}T${time}` : ''}
                slotProps={{ inputLabel: { shrink: true } }}
                onChange={e => {
                    const parts = e.target.value.split('T');
                    this.onChange({ [which]: parts[0], [`${which}_time`]: parts[1] || '00:00' });
                }}
            />
        );
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element | React.JSX.Element[] | null {
        super.renderWidgetBody(props);

        const isStatic = this.state.timeRange.timeType === 'static';
        const fields: React.JSX.Element[] = [];

        if (this.state.rxData.showType) {
            fields.push(
                <React.Fragment key="type">
                    {this.renderSelect('timeType', isStatic ? 'static' : 'relative', TIME_TYPE_OPTIONS, value =>
                        this.onChange({ timeType: value as 'relative' | 'static' }),
                    )}
                </React.Fragment>,
            );
        }

        // In a static range the "range" slot holds the start date and the "end" slot the end date -
        // the same two fields the preset editor shows instead of range and relative end. The order is
        // the one of the editor: start before end, relative end before range
        if (isStatic) {
            if (this.state.rxData.showRange) {
                fields.push(<React.Fragment key="range">{this.renderDateTime('start', 'start')}</React.Fragment>);
            }
            if (this.state.rxData.showEnd) {
                fields.push(<React.Fragment key="end">{this.renderDateTime('end', 'end')}</React.Fragment>);
            }
        } else {
            if (this.state.rxData.showEnd) {
                fields.push(
                    <React.Fragment key="end">
                        {this.renderSelect(
                            'relativeEnd',
                            this.state.timeRange.relativeEnd || 'now',
                            RELATIVE_END_OPTIONS,
                            value => this.onChange({ relativeEnd: value }),
                        )}
                    </React.Fragment>,
                );
            }
            if (this.state.rxData.showRange) {
                fields.push(
                    <React.Fragment key="range">
                        {this.renderSelect('range', this.state.timeRange.range || '1440', RANGE_OPTIONS, value =>
                            this.onChange({ range: value }),
                        )}
                    </React.Fragment>,
                );
            }
        }

        const content = (
            <div
                style={{
                    display: 'flex',
                    flexDirection: this.state.rxData.horizontal ? 'row' : 'column',
                    alignItems: this.state.rxData.horizontal ? 'flex-end' : 'stretch',
                    gap: 8,
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                    boxSizing: 'border-box',
                }}
            >
                {fields.length ? fields : <div>{t('interval_nothing_visible')}</div>}
            </div>
        );

        if (!this.state.rxData.noCard) {
            return this.wrapContent(content);
        }

        return content;
    }
}
