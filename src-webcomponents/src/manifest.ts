/**
 * The manifest of `<iob-echarts-chart>`. Read by the build only (`vite.config.ts`), which writes it as
 * `echarts-chart.json` next to the module - a host reads that file for its palette and its settings without loading
 * the module.
 *
 * The words come from `src/i18n/<lang>.json`; the build hands them over in every language. The name is the label of
 * the native widgets (`E-Charts` in vis-2 and in devices), so a host that has the native widget offers that one.
 *
 * The settings are those of the vis-2 widget that a host can show: a preset, or a state with history and how its
 * chart is built. The vis-2 widget lets the user pick the history instance among the data sources; the component
 * takes the one that records the state (see `stateChart.ts`). The card, its title and the iframe of the vis-2 widget
 * are left out: the host frames the component, and the component always draws directly.
 */
import type { WebComponentManifest, WebComponentSettingOption, WebComponentText } from '@iobroker/web-components';

// with the extension: `vite.config.ts` imports this file, and Vite may load its config natively
import {
    AGGREGATE_TYPES,
    AGGREGATES,
    CHART_TYPES,
    type Choice,
    LIVE,
    MODULE_FILE,
    RANGES,
    RELATIVE_ENDS,
    TAG,
} from './constants.ts';

export { ELEMENT_WORDS, MANIFEST_FILE, MODULE_FILE, MODULE_PATH, TAG } from './constants.ts';

/** Without a preset and with a state: the settings of the chart of the state */
const NO_STATE_CHART = '!!data.preset || !data.historyOid';

/**
 * The manifest
 *
 * @param word a word of `src/i18n/` in every language
 */
export function buildManifest(word: (key: string) => WebComponentText): WebComponentManifest {
    const options = (choices: Choice[]): WebComponentSettingOption[] =>
        choices.map(choice => ({ value: choice.value, label: word(choice.word) }));

    return {
        $schema: 'https://raw.githubusercontent.com/ioBroker/web-components/main/schemas/manifest.json',
        manifestVersion: 1,
        tag: TAG,
        name: word('wc_name'),
        description: word('wc_description'),
        icon: '../echarts.svg',
        module: MODULE_FILE,
        size: { width: 480, height: 300 },
        settings: {
            type: 'panel',
            items: {
                preset: {
                    type: 'objectId',
                    label: word('preset'),
                    help: word('preset_help'),
                    types: 'chart',
                    root: 'echarts.0',
                },
                historyOid: {
                    type: 'objectId',
                    label: word('historyOid'),
                    help: word('historyOid_help'),
                    hidden: '!!data.preset',
                },
                title: {
                    type: 'text',
                    label: word('title'),
                },
                rangeSelector: {
                    type: 'checkbox',
                    label: word('rangeSelector'),
                    help: word('rangeSelector_help'),
                    default: false,
                },
                chartType: {
                    type: 'select',
                    label: word('chartType'),
                    options: options(CHART_TYPES),
                    default: 'auto',
                    hidden: NO_STATE_CHART,
                },
                aggregate: {
                    type: 'select',
                    label: word('aggregate'),
                    options: options(AGGREGATES),
                    default: 'minmax',
                    hidden: `${NO_STATE_CHART} || !data.chartType || data.chartType === "auto"`,
                },
                live: {
                    type: 'select',
                    label: word('live'),
                    options: options(LIVE),
                    default: '30',
                    hidden: NO_STATE_CHART,
                },
                aggregateType: {
                    type: 'select',
                    label: word('aggregateType'),
                    options: options(AGGREGATE_TYPES),
                    default: 'step',
                    hidden: NO_STATE_CHART,
                },
                aggregateSpan: {
                    type: 'number',
                    label: word('aggregateSpan'),
                    help: word('aggregateSpan_help'),
                    min: 0,
                    default: 300,
                    hidden: NO_STATE_CHART,
                },
                xticks: {
                    type: 'slider',
                    label: word('xticks'),
                    help: word('ticks_help'),
                    min: 0,
                    max: 50,
                    step: 1,
                    default: 0,
                    hidden: NO_STATE_CHART,
                },
                yticks: {
                    type: 'slider',
                    label: word('yticks'),
                    help: word('ticks_help'),
                    min: 0,
                    max: 50,
                    step: 1,
                    default: 0,
                    hidden: NO_STATE_CHART,
                },
                range: {
                    type: 'select',
                    label: word('range'),
                    options: options(RANGES),
                    default: '1440',
                    hidden: NO_STATE_CHART,
                },
                relativeEnd: {
                    type: 'select',
                    label: word('relativeEnd'),
                    options: options(RELATIVE_ENDS),
                    default: 'now',
                    hidden: NO_STATE_CHART,
                },
            },
        },
    };
}
