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
    buildReact,
    copyFolderRecursiveSync, copyFiles,
}   = require('@iobroker/build-tools');

function copyAllFiles() {
    deleteFoldersRecursive(`${__dirname}/admin/preview`);

    copyFiles([
        'src-preview/build/*',
        '!src-preview/build/index.html',
        '!src-preview/build/static/js/main.*.chunk.js',
        '!src-preview/build/static/media/*.svg',
        '!src-preview/build/static/media/*.txt',
        '!src-preview/build/i18n/*',
        '!src-preview/build/i18n',
    ], 'admin/preview/');

    copyFiles('src-preview/build/index.html', 'admin/preview/');

    copyFiles('src-preview/build/static/js/main.*.chunk.js', 'admin/preview/static/js/');
}

function checkChart(resolve, reject, start) {
    if (!resolve) {
        return new Promise((resolve, reject) =>
            checkChart(resolve, reject, Date.now()));
    }
    console.log('Check src-preview/build/service-worker.js');
    if (fs.existsSync(`${__dirname}/src-preview/build/index.html`)) {
        console.log('Exists src-preview/build/index.html');
        setTimeout(() => resolve(), 500);
    } else {
        if (Date.now() - start > 30000) {
            reject('timeout');
        } else {
            console.log('Wait for src-preview/build/index.html');
            setTimeout(() => checkChart(resolve, reject, start), 500);
        }
    }
}

function copyFilesToWWW() {
    deleteFoldersRecursive(`${__dirname}/www/preview`);

    return checkChart()
        .then(() =>
            copyFolderRecursiveSync(`${__dirname}/admin/preview/`, `${__dirname}/www/preview`), ['.svg', '.txt'])
        .then(() =>
            new Promise(resolve => {
                if (fs.existsSync(`${__dirname}/www/preview/index.html`)) {
                    let code = fs.readFileSync(`${__dirname}/www/preview/index.html`).toString('utf8');
                    code = code.replace(/<script>var script=document\.createElement\("script"\).+?<\/script>/,
                        `<script type="text/javascript" src="./../lib/js/socket.io.js"></script>`);
                    code = code.replace('<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>',
                        `<script type="text/javascript" src="./../lib/js/socket.io.js"></script>`);

                    if (!code.includes('_socket/info.js')) {
                        code = code.replace('<script type="text/javascript" src="./../lib/js/socket.io.js"></script>', '<script type="text/javascript" src="./../lib/js/socket.io.js"></script><script type="text/javascript" src="_socket/info.js"></script>');
                    }

                    fs.writeFileSync(`${__dirname}/www/preview/index.html`, code);
                }

                resolve();
            }));
}

deleteFoldersRecursive(`${__dirname}/admin/preview`);
deleteFoldersRecursive(`${__dirname}/src-preview/build`);

let installPromise;
if (fs.existsSync(`${__dirname}/src-preview/node_modules`)) {
    installPromise = Promise.resolve();
} else {
    installPromise = npmInstall(`${__dirname.replace(/\\/g, '/')}/src-preview/`);
}
installPromise
    .then(() => {
        if (fs.existsSync(`${__dirname}/src-widgets/node_modules/@iobroker/adapter-react-v5/build`)) {
            fs.copyFileSync(`${__dirname}/src-widgets/node_modules/@iobroker/adapter-react-v5/build/index.css`, `${__dirname}/src-widgets/node_modules/@iobroker/adapter-react-v5/index.css`);
        }
    })
    .then(() => buildReact(`${__dirname}/src-preview/`, { rootDir: __dirname }))
    .then(() => copyAllFiles())
    .then(() => {
        if (fs.existsSync(`${__dirname}/admin/preview/index.html`)) {
            let code = fs.readFileSync(`${__dirname}/admin/preview/index.html`).toString('utf8');
            code = code.replace(/<script>var script=document\.createElement\("script"\).+?<\/script>/,
                `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`);

            fs.writeFileSync(`${__dirname}/admin/preview/index.html`, code);
        }
        if (fs.existsSync(`${__dirname}/src-preview/build/index.html`)) {
            let code = fs.readFileSync(`${__dirname}/src-preview/build/index.html`).toString('utf8');
            code = code.replace(/<script>var script=document\.createElement\("script"\).+?<\/script>/,
                `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`);

            fs.writeFileSync(`${__dirname}/src-preview/build/index.html`, code);
        }
    })
    .then(() => copyFilesToWWW());
