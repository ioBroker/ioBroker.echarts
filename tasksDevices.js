/**
 * Copyright 2023-2025 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 * Builds the src-devices module-federation bundle that ioBroker.devices loads
 * to render an Echarts preset as a widget. Output ends up in `admin/dm-widgets/`,
 * which gets shipped with the adapter (see `files` in package.json).
 **/
'use strict';

const { deleteFoldersRecursive, npmInstall, copyFiles, buildReact } = require('@iobroker/build-tools');

const SRC = 'src-devices/';
const src = `${__dirname}/${SRC}`;

deleteFoldersRecursive(`${__dirname}/admin/dm-widgets`);
deleteFoldersRecursive(`${src}build`);

npmInstall(src)
    .then(() => buildReact(src, { rootDir: src, vite: true }))
    .then(() => {
        copyFiles([`${SRC}build/customDevices.js`], 'admin/dm-widgets');
        copyFiles([`${SRC}build/assets/*.*`], 'admin/dm-widgets/assets');
        copyFiles([`${SRC}img/*.*`], 'admin/dm-widgets');
    })
    .catch(e => {
        console.error(`Cannot build devices widget: ${e}`);
        process.exit(1);
    });
