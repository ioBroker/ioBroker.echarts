/**
 * The types of the chart that the declarations in `chart-modules.d.ts` need.
 *
 * They are re-exported here instead of being imported there directly: inside an ambient
 * `declare module` the type-aware ESLint rules do not resolve the path up out of the app, and the
 * imported types silently degrade to `any`.
 */
export type { ChartConfig } from '../../src/types';
