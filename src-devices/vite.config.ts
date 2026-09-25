import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
import vitetsConfigPaths from 'vite-tsconfig-paths';
import { federation } from '@module-federation/vite';
import { moduleFederationShared } from '@iobroker/dm-widgets/modulefederation.devices.config';
import path from 'node:path';
import pack from './package.json';

// `npm run start` (Vite serve) sets command='serve'; production federation build uses 'build'.
// We re-route `@iobroker/dm-widgets` to a dev wrapper ONLY during serve, so the standalone dev
// harness gets a fully populated MUI/React bridge without depending on `window.__iobrokerShared__`
// being set in time. Production builds still resolve to the real package — the federation host
// supplies the bridge values at runtime.
const isDevServe = process.env.NODE_ENV !== 'production' && !process.argv.includes('build');

const config = {
    plugins: [
        federation({
            manifest: true,
            name: 'DevicesWidgetEchartsSet',
            filename: 'customDevices.js',
            exposes: {
                './Components': './src/Components.tsx',
                './translations': './src/translations',
            },
            remotes: {},
            shared: moduleFederationShared(pack),
            dts: false,
        }),
        react(),
        vitetsConfigPaths(),
        commonjs(),
    ],
    resolve: {
        alias: [
            // The chart renderer of src-chart, drawn into the widget instead of into an iframe. It is
            // reached through an alias and not by a relative path, so this app does not type-check the
            // chart sources: they are not strict, this one is. What the widget expects of them stands
            // in src/chart-modules.d.ts.
            {
                find: /^@chart-renderer\//,
                replacement: `${path.resolve(__dirname, '../src-chart/src/Components')}/`,
            },
            // Use a regex with `^...$` so we don't accidentally also intercept sub-path
            // imports like `@iobroker/dm-widgets/modulefederation.devices.config` (used in
            // this very vite.config above).
            ...(isDevServe
                ? [
                      {
                          find: /^@iobroker\/dm-widgets$/,
                          replacement: path.resolve(__dirname, 'src/dev-dm-widgets.ts'),
                      },
                  ]
                : []),
        ],
        // The chart brings its own node_modules. Without this its bare imports would resolve there,
        // and the widget would carry a second React and a second MUI beside the ones of the host
        dedupe: ['react', 'react-dom', '@emotion/react', '@mui/material', '@mui/system', '@mui/icons-material'],
    },
    server: {
        port: 3000,
        proxy: {
            '/files': 'http://localhost:8081',
            '/adapter': 'http://localhost:8081',
            '/session': 'http://localhost:8081',
            '/log': 'http://localhost:8081',
            '/lib': 'http://localhost:8081',
        },
    },
    base: './',
    build: {
        target: 'chrome89',
        outDir: './build',
        rollupOptions: {
            onwarn(warning: { code: string }, warn: (warning: { code: string }) => void): void {
                // Suppress "Module level directives cause errors when bundled" warnings
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
                    return;
                }
                warn(warning);
            },
        },
    },
};

export default config;
