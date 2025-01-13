/**
 * Copyright 2023-2025 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const { existsSync, rmdirSync, readdirSync } = require('node:fs');
const gulpHelper  = require('@iobroker/vis-2-widgets-react-dev/gulpHelper');
const { deleteFoldersRecursive, npmInstall, copyFiles, buildReact }   = require('@iobroker/build-tools');
const adapterName = require('./package.json').name.split('.').pop();

deleteFoldersRecursive(`${__dirname}/widgets`, ['echarts.html', 'Prev_tplEchartsChart.png']);
deleteFoldersRecursive(`${__dirname}/src-widgets/build`);

npmInstall(`${__dirname}/src-widgets/`)
    .then(() => buildReact(`${__dirname}/src-widgets/`, { craco: true }))
    .then(() => {
        copyFiles([`src-widgets/build/*.js`], `widgets/${adapterName}`);
        copyFiles([`src-widgets/build/img/**/*`], `widgets/${adapterName}/img`);
        copyFiles([`src-widgets/build/*.map`], `widgets/${adapterName}`);

        copyFiles([
            `src-widgets/build/static/**/*`,
            ...gulpHelper.ignoreFiles(`${__dirname}/src-widgets/`),
        ], `widgets/${adapterName}/static`)

        copyFiles([
            ...gulpHelper.copyFiles(`${__dirname}/src-widgets/`),
        ], `widgets/${adapterName}/static/js`);

        copyFiles([`src-widgets/src/i18n/*.json`], `widgets/${adapterName}/i18n`);

        return new Promise(resolve =>
            setTimeout(() => {
                if (existsSync(`widgets/${adapterName}/static/media`) &&
                    !readdirSync(`widgets/${adapterName}/static/media`).length
                ) {
                    rmdirSync(`widgets/${adapterName}/static/media`);
                }
                resolve(null);
            }, 500)
        )
    });
