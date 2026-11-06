/**
 * echarts with exactly the parts the option of `ChartOption.ts` can contain - not the whole library. The module of
 * the component bundles it, because no host shares echarts.
 *
 * - charts: line, scatter and bar (time axis), radar, pie (donut), gauge
 * - components: grid and axes, tooltip (with the axis pointer), title, legend, mark lines and areas, the piecewise
 *   visual map (lines in two colors) and the graphic (the text in the hole of a donut)
 * - renderers: SVG, and the canvas for touch devices with zoom
 * - the themes the preset editor offers; each registers itself by its name
 */
import { init, use } from 'echarts/core';
import { BarChart, GaugeChart, LineChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts';
import {
    GraphicComponent,
    GridComponent,
    LegendPlainComponent,
    MarkAreaComponent,
    MarkLineComponent,
    TitleComponent,
    TooltipComponent,
    VisualMapPiecewiseComponent,
} from 'echarts/components';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';

import 'echarts/theme/azul';
import 'echarts/theme/bee-inspired';
import 'echarts/theme/blue';
import 'echarts/theme/dark';
import 'echarts/theme/dark-blue';
import 'echarts/theme/dark-bold';
import 'echarts/theme/gray';
import 'echarts/theme/green';
import 'echarts/theme/infographic';
import 'echarts/theme/macarons';
import 'echarts/theme/red';
import 'echarts/theme/red-velvet';
import 'echarts/theme/roma';
import 'echarts/theme/royal';
import 'echarts/theme/shine';
import 'echarts/theme/tech-blue';
import 'echarts/theme/vintage';

use([
    LineChart,
    ScatterChart,
    BarChart,
    RadarChart,
    PieChart,
    GaugeChart,
    GridComponent,
    TooltipComponent,
    TitleComponent,
    LegendPlainComponent,
    MarkLineComponent,
    MarkAreaComponent,
    VisualMapPiecewiseComponent,
    GraphicComponent,
    SVGRenderer,
    CanvasRenderer,
]);

export { init };
export type { ECharts } from 'echarts/core';
