import type { WebComponentSocket } from '@iobroker/web-components';

import type { ChartConfig } from '../../src/types';
import type { ChartSettings } from './constants';

/**
 * The chart of a single state without a preset - built as the vis-2 widget builds it out of its attributes
 * (`Echarts.createChartFromLine` in `src-widgets/src/Echarts.tsx`), so both draw the same chart.
 *
 * The vis-2 widget lets the user pick the history instance among the data sources. A web component cannot offer
 * that list in every host, so the instance comes from the state itself: the default history if it records the
 * state, else the first instance in `common.custom` that can be read (`common.getHistory`).
 */

/**
 * The history instance that records a state, or null if there is none
 *
 * @param socket the connection
 * @param obj the object of the state
 * @param defaultHistory `common.defaultHistory` of `system.config`
 */
export async function findHistoryInstance(
    socket: WebComponentSocket,
    obj: ioBroker.Object,
    defaultHistory: string | undefined,
): Promise<string | null> {
    const custom = (obj.common as ioBroker.StateCommon).custom || {};
    const enabled = Object.keys(custom).filter(instance => (custom[instance] as { enabled?: boolean })?.enabled);
    if (defaultHistory && enabled.includes(defaultHistory)) {
        return defaultHistory;
    }
    for (const instance of enabled) {
        try {
            const adapter = await socket.getObject(`system.adapter.${instance}`);
            if ((adapter?.common as ioBroker.InstanceCommon | undefined)?.getHistory) {
                return instance;
            }
        } catch {
            // an instance that cannot be read is no source
        }
    }
    return null;
}

/**
 * The name of an object in a language
 *
 * @param obj the object
 * @param lang the language
 */
function getName(obj: ioBroker.Object, lang: ioBroker.Languages): string {
    const name = obj.common?.name;
    if (name && typeof name === 'object') {
        return (name[lang] || name.en || '').trim();
    }
    return (name || '').toString().trim();
}

/**
 * The configuration of the chart, as a preset holds it
 *
 * @param obj the object of the state
 * @param instance the history instance that records it
 * @param defaultHistory the default history instance: the line leaves it out, as the vis-2 widget does
 * @param settings the settings of the component
 * @param lang the language of the names
 */
export function buildStateChart(
    obj: ioBroker.Object,
    instance: string,
    defaultHistory: string | undefined,
    settings: ChartSettings,
    lang: ioBroker.Languages,
): ChartConfig {
    const common = obj.common as ioBroker.StateCommon;
    const isBoolean = common?.type === 'boolean';

    const line: Record<string, unknown> = {
        name: getName(obj, lang),
        id: obj._id,
        instance: instance === defaultHistory ? '' : instance,
        thickness: 2,
        chartType: isBoolean ? 'steps' : 'line',
        aggregate: isBoolean ? 'onchange' : 'minmax',
        isBoolean,
        symbolSize: 3,
        validTime: 35, // seconds
    };
    if (common?.color) {
        line.color = common.color;
    }
    if (common?.unit) {
        line.unit = common.unit;
    }
    if (isBoolean) {
        line.yaxe = 'off';
        line.min = '0';
        line.yticks = 1;
        line.fill = 0.3;
        line.symbolSize = 1;
    }
    // 0 is "automatic" for the slider, empty for the chart. As in the vis-2 widget, this replaces the ticks of a
    // boolean too
    line.xticks = settings.xticks || '';
    line.yticks = settings.yticks || '';

    // the old form of a preset with `lines`: the model converts it as it converts an old preset
    return {
        marks: [],
        lines: [line],
        zoom: true,
        hoverDetail: true,
        aggregate: settings.aggregate || 'minmax',
        chartType: settings.chartType || 'auto',
        live: settings.live ?? '30',
        timeType: 'relative',
        aggregateType: settings.aggregateType || 'step',
        aggregateSpan: settings.aggregateSpan ?? 300,
        ticks: '',
        range: settings.range || '1440',
        relativeEnd: settings.relativeEnd || 'now',
        start: '',
        end: '',
        start_time: '',
        end_time: '',
        noBorder: 'noborder',
        noedit: false,
        animation: 0,
        legend: '',
    } as unknown as ChartConfig;
}
