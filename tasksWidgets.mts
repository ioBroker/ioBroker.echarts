/**
 * Copyright 2023-2025 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
import { rmSync } from 'node:fs';
import { deleteFoldersRecursive, npmInstall, copyFiles, buildReact } from '@iobroker/build-tools';
import pack from './package.json' with { type: 'json' };

const rootDir = import.meta.dirname;
const adapterName = pack.name.split('.').pop();

deleteFoldersRecursive(`${rootDir}/widgets`, ['echarts.html', 'Prev_tplEchartsChart.png']);
deleteFoldersRecursive(`${rootDir}/src-widgets/build`);

await npmInstall(`${rootDir}/src-widgets/`);
await buildReact(`${rootDir}/src-widgets/`, { vite: true });
copyFiles(
    [
        `src-widgets/build/**/*`,
        '!src-widgets/build/_socket/info.js',
        '!src-widgets/build/index.html',
        '!src-widgets/build/.vite/**/*',
    ],
    `widgets/${adapterName}/`,
);
// rmdirSync({ recursive }) was removed in Node.js 26
rmSync(`${rootDir}/widgets/${adapterName}/_socket`, { recursive: true, force: true });
