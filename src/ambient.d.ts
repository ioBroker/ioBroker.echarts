// Ambient declarations for untyped side-effect imports.
// Must stay free of top-level import/export so it is treated as a global script —
// wildcard `declare module` is only valid in an ambient context.

// moment locale bundles are plain JS side-effect modules with no declarations
declare module 'moment/locale/*';
