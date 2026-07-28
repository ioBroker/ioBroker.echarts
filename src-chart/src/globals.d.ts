// Ambient module declarations for assets and untyped side-effect imports.
// This file must stay free of top-level import/export so it is treated as a global
// script — wildcard `declare module` is only valid in an ambient context.

declare module '*.css';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';

// echarts ships its built-in themes as plain JS without type declarations
declare module 'echarts/theme/*';

// moment locale bundles are plain JS side-effect modules
declare module 'moment/dist/locale/*';
