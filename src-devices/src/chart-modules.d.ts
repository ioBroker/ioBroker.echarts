/**
 * The contract between the widget and the chart renderer of `src-chart`.
 *
 * The two apps are compiled separately and with different settings: `src-devices` is `strict`, the
 * chart is not (see the note in its tsconfig). Letting the widget type-check the chart sources
 * therefore surfaces the whole backlog of `possibly null` errors that the repository deliberately
 * carries. So the widget does not read those sources at all - it imports them through the alias
 * `@chart-renderer/…`, which TypeScript cannot resolve on its own and takes from the declarations
 * below, while Vite maps it onto `../src-chart/src/Components` and bundles the real code.
 *
 * That makes this file the place where the coupling is visible: what the widget needs from the
 * renderer stands here, and nothing else of the chart app leaks into the widget.
 *
 * The imports stand INSIDE the `declare module` block on purpose: a top-level import would turn
 * this file into a module, and `declare module` would then augment an existing module instead of
 * declaring a new one.
 */

declare module '@chart-renderer/ChartEmbed' {
    import type React from 'react';
    import type { Connection } from '@iobroker/gui-components';
    import type { ChartConfig } from './chartContract';

    export interface ChartTimeRangeOverride {
        range?: number | string;
        relativeEnd?: string;
        timeType?: 'relative' | 'static';
        start?: string;
        start_time?: string;
        end?: string;
        end_time?: string;
    }

    export interface ChartEmbedProps {
        /** A preset ID, or a whole configuration for a chart built out of a single object */
        config: ChartConfig | string;
        /** The connection of the host - the chart opens none of its own */
        socket: Connection;
        themeType: 'light' | 'dark';
        /** A range that is put over the one of the preset, as the URL hash does for the iframe */
        timeRange?: ChartTimeRangeOverride | null;
    }

    /** The chart drawn into the host instead of into an iframe. */
    const ChartEmbed: React.ComponentType<ChartEmbedProps>;
    export default ChartEmbed;
}
