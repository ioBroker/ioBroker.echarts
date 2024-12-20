/**
 * Copyright 2018-2024 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const fs   = require('node:fs');
const {
    deleteFoldersRecursive,
    npmInstall,
    copyFolderRecursiveSync,
    buildReact, copyFiles,
}   = require('@iobroker/build-tools');

function copyAllFiles() {
    deleteFoldersRecursive(`${__dirname}/admin/chart`);

    copyFiles([
        'src-chart/build/*',
        '!src-chart/build/index.html',
        '!src-chart/build/static/js/main.*.chunk.js',
        '!src-chart/build/static/media/*.svg',
        '!src-chart/build/static/media/*.txt',
        '!src-chart/build/i18n/**/*',
        '!src-chart/build/i18n',
    ],'admin/chart/');

    copyFiles([
        'src-chart/build/index.html',
    ], 'admin/chart/');

    copyFiles([
        'src-chart/build/static/js/main.*.chunk.js',
    ], 'admin/chart/static/js/');
}

function checkChart(resolve, reject, start) {
    if (!resolve) {
        return new Promise((resolve, reject) =>
            checkChart(resolve, reject, Date.now()));
    }
    console.log('Check src-chart/build/service-worker.js');
    if (fs.existsSync(`${__dirname}/src-chart/build/index.html`)) {
        console.log('Exists src-chart/build/index.html');
        setTimeout(() => resolve(), 500);
    } else {
        if (Date.now() - start > 30000) {
            reject('timeout');
        } else {
            console.log('Wait for src-chart/build/index.html');
            setTimeout(() => checkChart(resolve, reject, start), 500);
        }
    }
}

function copyFilesToWWW() {
    deleteFoldersRecursive(`${__dirname}/www`);

    return checkChart()
        .then(() =>
            copyFolderRecursiveSync(`${__dirname}/admin/chart/`, `${__dirname}/www`, ['.svg', '.txt']))
        .then(() =>
            new Promise(resolve => {
                if (fs.existsSync(`${__dirname}/www/index.html`)) {
                    let code = fs.readFileSync(`${__dirname}/www/index.html`).toString('utf8');
                    code = code.replace(/<script>var script=document\.createElement\("script"\).+?<\/script>/,
                        `<script type="text/javascript" src="./../lib/js/socket.io.js"></script>`);
                    code = code.replace('<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>',
                        `<script type="text/javascript" src="./../lib/js/socket.io.js"></script>`);

                    if (!code.includes('_socket/info.js')) {
                        code = code.replace('<script type="text/javascript" src="./../lib/js/socket.io.js"></script>', '<script type="text/javascript" src="./../lib/js/socket.io.js"></script><script type="text/javascript" src="_socket/info.js"></script>');
                    }

                    fs.writeFileSync(`${__dirname}/www/index.html`, code);
                }

                resolve();
            }));
}

deleteFoldersRecursive(`${__dirname}/admin/chart`);
deleteFoldersRecursive(`${__dirname}/src-chart/build`);

let installPromise;
if (!fs.existsSync(`${__dirname}/src-chart/node_modules`)) {
    installPromise = npmInstall(`${__dirname.replace(/\\/g, '/')}/src-chart/`);
} else {
    installPromise = Promise.resolve();
}

installPromise
    .then(() => {
        if (fs.existsSync(`${__dirname}/src-widgets/node_modules/@iobroker/adapter-react-v5/build`)) {
            fs.copyFileSync(`${__dirname}/src-widgets/node_modules/@iobroker/adapter-react-v5/build/index.css`, `${__dirname}/src-widgets/node_modules/@iobroker/adapter-react-v5/index.css`);
        }
    })
    .then(() => buildReact(`${__dirname}/src-chart/`, { rootDir: __dirname }))
    .then(() => copyAllFiles())
    .then(() => {
        if (fs.existsSync(`${__dirname}/admin/chart/index.html`)) {
            let code = fs.readFileSync(`${__dirname}/admin/chart/index.html`).toString('utf8');
            code = code.replace(/<script>var script=document\.createElement\("script"\).+?<\/script>/,
                `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`);

            fs.writeFileSync(`${__dirname}/admin/chart/index.html`, code);
        }
        if (fs.existsSync(`${__dirname}/src-chart/build/index.html`)) {
            let code = fs.readFileSync(`${__dirname}/src-chart/build/index.html`).toString('utf8');
            code = code.replace(/<script>var script=document\.createElement\("script"\).+?<\/script>/,
                `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`);

            fs.writeFileSync(`${__dirname}/src-chart/build/index.html`, code);
        }
    })
    .then(() => copyFilesToWWW());
