/**
 * What the themes of echarts (`echarts/theme/*.js`) need of echarts: `registerTheme`, nothing else. They are UMD files
 * that `require('echarts/lib/echarts')`, and that entry would add the full API to the module (datasets, maps, the
 * default canvas renderer). The build points that path here (`vite.config.ts`), so the themes register themselves in
 * the tree-shaken echarts of `echarts.ts`.
 */
export { registerTheme } from 'echarts/core';
