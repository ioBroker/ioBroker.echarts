// Ambient module declarations for untyped side-effect imports. This file must stay free of top-level import/export,
// so it is a global script: a wildcard `declare module` is only valid in an ambient context.

// echarts ships its themes as plain JS without type declarations; each registers itself by its name
declare module 'echarts/theme/*';

// the locales of moment are plain JS side-effect modules
declare module 'moment/dist/locale/*';
