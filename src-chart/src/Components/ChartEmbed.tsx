import React from 'react';

import type { Connection } from '@iobroker/gui-components';
import type { ChartConfig, ChartConfigMore, ChartRangeOptions } from '../../../src/types';

import ChartModel, { type BarAndLineSeries, type ChartTimeRangeOverride, type SeriesData } from './ChartModel';
import ChartView from './ChartView';

interface ChartEmbedProps {
    /** A preset ID, or a whole configuration for a chart that is built out of a single object */
    config: ChartConfig | string;
    socket: Connection;
    themeType: 'light' | 'dark';
    /** The range an "E-Charts time range" widget picked, if there is one */
    timeRange?: ChartTimeRangeOverride | null;
}

interface ChartEmbedState {
    seriesData: BarAndLineSeries[] | null;
    actualValues: number[];
    categories: number[];
    error: string;
}

/**
 * The chart, ready to be drawn into another application instead of into an iframe.
 *
 * An iframe brings a second React app, a second echarts and above all a second socket connection for
 * every chart on a page. Here the caller hands over the connection it already holds, and the view
 * draws into its tree - so the theme, the fonts and the MUI of the host are the ones of the chart.
 *
 * It ties the model to the view and does nothing else. Everything the stand-alone page does around
 * them - reading the query string, its own theme, its own socket - stays in `App.tsx`. The vis-2
 * widget set and the widget for ioBroker.devices both embed this component.
 */
export default class ChartEmbed extends React.Component<ChartEmbedProps, ChartEmbedState> {
    private chartData: ChartModel | null = null;

    constructor(props: ChartEmbedProps) {
        super(props);
        this.state = {
            seriesData: null,
            actualValues: [],
            categories: [],
            error: '',
        };
    }

    componentDidMount(): void {
        this.createChartData();
    }

    componentDidUpdate(prevProps: ChartEmbedProps): void {
        // A new preset or another object means a new model: the old one is subscribed to the wrong
        // states and would keep writing into a chart that is not shown any more
        if (JSON.stringify(prevProps.config) !== JSON.stringify(this.props.config)) {
            this.createChartData();
            return;
        }
        // Without an iframe there is no URL a range could travel through, so it is handed over
        if (JSON.stringify(prevProps.timeRange) !== JSON.stringify(this.props.timeRange)) {
            this.applyTimeRange();
        }
    }

    componentWillUnmount(): void {
        this.chartData?.destroy();
        this.chartData = null;
    }

    private applyTimeRange(): void {
        if (this.props.timeRange && Object.keys(this.props.timeRange).length) {
            this.chartData?.setTimeRange(this.props.timeRange);
        }
    }

    private createChartData(): void {
        this.chartData?.destroy();

        const chartData = new ChartModel(this.props.socket, this.props.config, { updateTimeout: 300 });
        this.chartData = chartData;

        chartData.onError((err: Error): void => this.setState({ error: err.toString() }));
        chartData.onUpdate(
            (
                seriesData: BarAndLineSeries[],
                actualValues?: (number | null | boolean | string)[],
                categories?: number[],
            ): void => {
                // The model sends `null` as data when only a current value changed
                const newState: Partial<ChartEmbedState> = {};
                if (seriesData) {
                    newState.seriesData = seriesData;
                    newState.categories = categories || [];
                }
                if (actualValues) {
                    newState.actualValues = actualValues as number[];
                }
                this.setState(newState as ChartEmbedState);
            },
        );

        this.applyTimeRange();
    }

    render(): React.JSX.Element | null {
        if (this.state.error) {
            return <div style={{ padding: 8, color: '#f44336' }}>{this.state.error}</div>;
        }
        if (!this.state.seriesData || !this.chartData) {
            return null;
        }

        const config: ChartConfigMore = this.chartData.getConfig();

        return (
            // The chart measures the box it stands in and draws itself that high. Inside an iframe
            // that box is the window, but here it is a div of the host - and if the height of the
            // host follows its content, the chart measures itself and grows with every round. The
            // inner box is taken out of the flow, so it can read the size of the outer one without
            // ever adding to it. `minHeight` keeps a chart visible whose host gives it no height.
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 100, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0 }}>
                    <ChartView
                        config={config}
                        data={this.state.seriesData}
                        actualValues={this.state.actualValues}
                        categories={this.state.categories}
                        themeType={this.props.themeType}
                        onRangeChange={(options?: { stopLive?: boolean; start?: number; end?: number }): void =>
                            this.chartData?.setNewRange(options)
                        }
                        onRangeSelectorChange={(range: ChartRangeOptions): void => this.chartData?.setRange(range)}
                        exportData={(
                            from: number,
                            to: number,
                            excludes?: string[],
                        ): Promise<{ [objectId: string]: SeriesData[] }> =>
                            this.chartData ? this.chartData.exportData(from, to, excludes) : Promise.resolve({})
                        }
                    />
                </div>
            </div>
        );
    }
}
