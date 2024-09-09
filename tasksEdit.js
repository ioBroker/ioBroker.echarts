/**
 * Copyright 2018-2024 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const fs = require('node:fs');
const { deleteFoldersRecursive, npmInstall, buildReact, copyFiles } = require('@iobroker/build-tools');

function copyAllFiles() {
    deleteFoldersRecursive(`${__dirname}/admin`, ['chart', 'preview']);

    copyFiles([
        'src/build/**/*',
        '!src/build/index.html',
        '!src/build/static/js/main.*.chunk.js',
        '!src/build/static/media/*.svg',
        '!src/build/static/media/*.txt',
        '!src/build/i18n/**/*',
        '!src/build/i18n',
    ],'admin/');

    copyFiles('admin-config/*', 'admin/');

    fs.copyFileSync(`${__dirname}/src/build/index.html`, `${__dirname}/admin/tab.html`);
    copyFiles('src/build/static/js/main.*.chunk.js', 'admin/static/js/');
}

deleteFoldersRecursive(`${__dirname}/admin`, ['chart']);
deleteFoldersRecursive(`${__dirname}/src/build`);
let installPromise;
if (fs.existsSync(`${__dirname}/src/node_modules`)) {
    installPromise = Promise.resolve();
} else {
    installPromise = npmInstall(`${__dirname.replace(/\\/g, '/')}/src/`);
}
installPromise
    .then(() => buildReact(`${__dirname}/src/`, { rootDir: __dirname }))
    .then(() => copyAllFiles())
    .then(() => {
        if (fs.existsSync(`${__dirname}/admin/tab.html`)) {
            let code = fs.readFileSync(`${__dirname}/admin/tab.html`).toString('utf8');
            code = code.replace(/<script>var script=document\.createElement\("script"\).+?<\/script>/,
                `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`);

            fs.writeFileSync(`${__dirname}/admin/tab.html`, code);
        }
        if (fs.existsSync(`${__dirname}/src/build/index.html`)) {
            let code = fs.readFileSync(`${__dirname}/src/build/index.html`).toString('utf8');
            code = code.replace(/<script>var script=document\.createElement\("script"\).+?<\/script>/,
                `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`);

            fs.writeFileSync(`${__dirname}/src/build/index.html`, code);
        }
    });
