/**
 * Copyright 2023-2025 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const { existsSync, unlinkSync, rmdirSync } = require('node:fs');
const { deleteFoldersRecursive, npmInstall, copyFiles, buildReact } = require('@iobroker/build-tools');
const adapterName = require('./package.json').name.split('.').pop();

deleteFoldersRecursive(`${__dirname}/widgets`, ['echarts.html', 'Prev_tplEchartsChart.png']);
deleteFoldersRecursive(`${__dirname}/src-widgets/build`);

npmInstall(`${__dirname}/src-widgets/`)
    .then(() => buildReact(`${__dirname}/src-widgets/`, { vite: true }))
    .then(() => {
        copyFiles(
            [
                `src-widgets/build/**/*`,
                '!src-widgets/build/_socket/info.js',
                '!src-widgets/build/index.html',
                '!src-widgets/build/.vite/**/*',
                '!src-widgets/build/mf-manifest.json',
            ],
            `widgets/${adapterName}/`,
        );
        if (existsSync(`${__dirname}/widgets${adapterName}/_socket/info.js`)) {
            unlinkSync(`${__dirname}/widgets/${adapterName}/_socket/info.js`);
        }
        if (existsSync(`${__dirname}/widgets/${adapterName}/_socket`)) {
            rmdirSync(`${__dirname}/widgets/${adapterName}/_socket`, { recursive: true, force: true });
        }
    });
