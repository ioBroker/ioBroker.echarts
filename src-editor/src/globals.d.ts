// Ambient module declarations for assets and untyped side-effect imports.
// This file must stay free of top-level import/export so it is treated as a global
// script — wildcard `declare module` is only valid in an ambient context.

declare module '*.css';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';

// moment locale bundles are plain JS side-effect modules
declare module 'moment/dist/locale/*';
