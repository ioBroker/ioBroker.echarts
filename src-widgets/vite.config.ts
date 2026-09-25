// @ts-expect-error no types
import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
import { federation } from '@module-federation/vite';
import { resolve } from 'node:path';
import { moduleFederationShared } from '@iobroker/types-vis-2/modulefederation.vis.config';
import { readFileSync } from 'node:fs';
const pack = JSON.parse(readFileSync('./package.json').toString());

const config = {
    plugins: [
        federation({
            manifest: true,
            name: 'echarts',
            filename: 'customWidgets.js',
            exposes: {
                './Echarts': './src/Echarts',
                './Interval': './src/Interval',
                './translations': './src/translations',
            },
            remotes: {},
            shared: moduleFederationShared(pack),
            dts: false,
        }),
        react(),
        commonjs(),
    ],
    resolve: {
        tsconfigPaths: true,
        alias: {
            // The chart renderer of src-chart, drawn into the widget instead of into an iframe.
            // It is imported through an alias and not by a relative path, so the widget does not
            // type-check the chart sources: they are not strict, the widget set is. What the widget
            // expects of them stands in src/chartRenderer.d.ts.
            '@chart-renderer': resolve(__dirname, '../src-chart/src/Components'),
        },
        // Same set as the shared modules above: the fallback copies inside the widget bundle must be unique too
        dedupe: ['react', 'react-dom', '@emotion/react', '@mui/material', '@mui/system', '@mui/icons-material'],
    },
    server: {
        port: 3000,
        proxy: {
            '/_socket': 'http://localhost:8082',
            '/vis.0': 'http://localhost:8082',
            '/adapter': 'http://localhost:8082',
            '/habpanel': 'http://localhost:8082',
            '/vis': 'http://localhost:8082',
            '/widgets': 'http://localhost:8082/vis',
            '/widgets.html': 'http://localhost:8082/vis',
            '/web': 'http://localhost:8082',
            '/state': 'http://localhost:8082',
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
