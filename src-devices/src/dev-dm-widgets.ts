// Dev-only replacement for `@iobroker/dm-widgets` — referenced via a Vite resolve.alias so
// the widget files can use their normal `import { MuiMaterial } from '@iobroker/dm-widgets'`
// syntax and still get a working bridge in standalone dev mode.
//
// Why the import paths look unusual:
//   - The alias in `vite.config.ts` redirects the bare specifier `@iobroker/dm-widgets` to THIS
//     file. If we re-exported from `@iobroker/dm-widgets` (the bare specifier) here, esbuild /
//     Vite would resolve that back to this very file → import cycle.
//   - The alias regex is `^@iobroker\/dm-widgets$` (anchored), so SUB-PATH imports such as
//     `@iobroker/dm-widgets/build/index.js` are NOT intercepted. Pulling the runtime values out
//     of the package via the sub-path gives us the real module without re-entering the alias.
//
// We override only the four host-bridged exports (React / MuiMaterial / MuiIcons / moment) with
// the dev environment's actual modules; everything else (WidgetGeneric class, helpers, types)
// is re-exported as-is so subclasses keep their lifecycle methods, helpers stay typed, etc.

import * as ReactRuntime from 'react';
import * as MuiMaterialAll from '@mui/material';
import * as MuiIconsAll from '@mui/icons-material';
import momentRuntime from 'moment';

// Real package, reached via its sub-path so the bare-specifier alias doesn't loop back here.
export {
    WidgetGeneric,
    default,
    getTileStyles,
    isNeumorphicTheme,
    StateContext,
} from '@iobroker/dm-widgets/build/index.js';
export type {
    WidgetGenericProps,
    WidgetGenericState,
    WidgetSettingsBase,
    WidgetInfo,
    CategoryInfo,
    CustomWidgetBase,
    CustomWidgetPlugin,
    CustomWidgetType,
    DeviceStatus,
    DevicesDetectorState,
    DevicesPatternControl,
    ItemInfo,
    IndicatorValues,
    ChartSeries,
    ExtraInfoEntry,
    StateChangeListener,
    ObjectChangeListener,
} from '@iobroker/dm-widgets/build/index.js';

// Replace the host-bridged values with the dev environment's actual modules. `import * as`
// from real `@mui/material` already gives a namespace where `.Box`, `.Button` etc. are
// own-properties; widget files read them as `MuiMaterial?.Box` which now resolves cleanly.
export const React = ReactRuntime;
export const MuiMaterial = MuiMaterialAll;
export const MuiIcons = MuiIconsAll;
export const moment = momentRuntime;
