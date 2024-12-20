/**
 * Copyright 2023-2024 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const fs   = require('node:fs');
const gulpHelper  = require('@iobroker/vis-2-widgets-react-dev/gulpHelper');
const { deleteFoldersRecursive, npmInstall, copyFiles}   = require('@iobroker/build-tools');
const adapterName = require('./package.json').name.split('.').pop();

deleteFoldersRecursive(`${__dirname}/widgets`, ['echarts.html', 'Prev_tplEchartsChart.png']);
deleteFoldersRecursive(`${__dirname}/src-widgets/build`);
npmInstall(`${__dirname}/src-widgets/`)
    .then(() => {
        if (fs.existsSync(`${__dirname}/src-widgets/node_modules/@iobroker/adapter-react-v5/build`)) {
            fs.copyFileSync(`${__dirname}/src-widgets/node_modules/@iobroker/adapter-react-v5/build/index.css`, `${__dirname}/src-widgets/node_modules/@iobroker/adapter-react-v5/index.css`);
        }
    })
    .then(() => gulpHelper.buildWidgets(__dirname, `${__dirname}/src-widgets/`))
    .then(() => {
        copyFiles([`src-widgets/build/*.js`], `widgets/${adapterName}`);
        copyFiles([`src-widgets/build/img/*`], `widgets/${adapterName}/img`);
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
                if (fs.existsSync(`widgets/${adapterName}/static/media`) &&
                    !fs.readdirSync(`widgets/${adapterName}/static/media`).length
                ) {
                    fs.rmdirSync(`widgets/${adapterName}/static/media`);
                }
                resolve(null);
            }, 500)
        )
    });
