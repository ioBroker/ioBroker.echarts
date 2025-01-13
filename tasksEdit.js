/**
 * Copyright 2018-2025 bluefox <dogafox@gmail.com>
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
        'src-editor/build/**/*',
        '!src-editor/build/vendor/*',
        '!src-editor/build/index.html',
        '!src-editor/build/static/js/main.*.chunk.js',
        '!src-editor/build/static/media/*.svg',
        '!src-editor/build/static/media/*.txt',
        '!src-editor/build/i18n/**/*',
        '!src-editor/build/i18n',
    ],'admin/');

    copyFiles('admin-config/*', 'admin/');

    fs.copyFileSync(`${__dirname}/src-editor/build/index.html`, `${__dirname}/admin/tab.html`);
    copyFiles('src-editor/build/static/js/main.*.chunk.js', 'admin/static/js/');
}

deleteFoldersRecursive(`${__dirname}/admin`, ['chart', 'preview']);
deleteFoldersRecursive(`${__dirname}/src-editor/build`);

let installPromise;
if (fs.existsSync(`${__dirname}/src-editor/node_modules`)) {
    installPromise = Promise.resolve();
} else {
    installPromise = npmInstall(`${__dirname.replace(/\\/g, '/')}/src-editor/`);
}
installPromise
    .then(() => buildReact(`${__dirname}/src-editor/`, { rootDir: `${__dirname}/src-editor/`, vite: true, tsc: true }))
    .then(() => copyAllFiles())
    .then(() => {
        if (fs.existsSync(`${__dirname}/admin/tab.html`)) {
            let code = fs.readFileSync(`${__dirname}/admin/tab.html`).toString('utf8');
            code = code.replace(/<script>var script=document\.createElement\("script"\).+?<\/script>/,
                `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`);

            fs.writeFileSync(`${__dirname}/admin/tab.html`, code);
        }
        if (fs.existsSync(`${__dirname}/src-editor/build/index.html`)) {
            let code = fs.readFileSync(`${__dirname}/src-editor/build/index.html`).toString('utf8');
            code = code.replace(/<script>var script=document\.createElement\("script"\).+?<\/script>/,
                `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`);

            fs.writeFileSync(`${__dirname}/src-editor/build/index.html`, code);
        }
    });
