/**
 * Copyright 2018-2025 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const { readFileSync, existsSync, writeFileSync } = require('node:fs');
const {
    deleteFoldersRecursive,
    npmInstall,
    copyFolderRecursiveSync,
    buildReact,
    copyFiles,
} = require('@iobroker/build-tools');

function copyAllFiles() {
    deleteFoldersRecursive(`${__dirname}/admin/chart`);

    copyReactFilesToBackEnd();

    copyFiles(['src-chart/build/**/*'], 'admin/chart/');
}

function checkChart(resolve, reject, start) {
    if (!resolve) {
        return new Promise((resolve, reject) => checkChart(resolve, reject, Date.now()));
    }
    console.log('Check src-chart/build/service-worker.js');
    if (existsSync(`${__dirname}/src-chart/build/index.html`)) {
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
        .then(() => copyFolderRecursiveSync(`${__dirname}/admin/chart/`, `${__dirname}/www`, ['.svg', '.txt']))
        .then(
            () =>
                new Promise(resolve => {
                    if (existsSync(`${__dirname}/www/index.html`)) {
                        let code = readFileSync(`${__dirname}/www/index.html`).toString('utf8');
                        code = code.replace(
                            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/,
                            `<script type="text/javascript" src="./../lib/js/socket.io.js"></script>`,
                        );
                        code = code.replace(
                            '<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>',
                            `<script type="text/javascript" src="./../lib/js/socket.io.js"></script>`,
                        );

                        if (!code.includes('_socket/info.js')) {
                            code = code.replace(
                                '<script type="text/javascript" src="./../lib/js/socket.io.js"></script>',
                                '<script type="text/javascript" src="./../lib/js/socket.io.js"></script><script type="text/javascript" src="_socket/info.js"></script>',
                            );
                        }

                        writeFileSync(`${__dirname}/www/index.html`, code);
                    }

                    resolve();
                }),
        );
}

deleteFoldersRecursive(`${__dirname}/admin/chart`);
deleteFoldersRecursive(`${__dirname}/src-chart/build`);

function copyReactFilesToBackEnd() {
    let chartOptions = readFileSync(`${__dirname}/src-chart/src/Components/ChartOption.ts`).toString('utf8');
    let chartModel = readFileSync(`${__dirname}/src-chart/src/Components/ChartModel.ts`).toString('utf8');

    chartModel = chartModel
        .replace(
            "'@iobroker/adapter-react-v5';",
            "'../types';",
        )
        .replace(
            "'../../../src/types';",
            "'../types';",
        );
    chartOptions = chartOptions.replace(
        "'../../../src/types';",
        "'../types';",
    );

    writeFileSync(`${__dirname}/src/lib/ChartOption.ts`, chartOptions);
    writeFileSync(`${__dirname}/src/lib/ChartModel.ts`, chartModel);
}

let installPromise;
if (!existsSync(`${__dirname}/src-chart/node_modules`)) {
    installPromise = npmInstall(`${__dirname.replace(/\\/g, '/')}/src-chart/`);
} else {
    installPromise = Promise.resolve();
}

installPromise
    .then(() => buildReact(`${__dirname}/src-chart/`, { vite: true, tsc: true }))
    .then(() => copyAllFiles())
    .then(() => {
        if (existsSync(`${__dirname}/admin/chart/index.html`)) {
            let code = readFileSync(`${__dirname}/admin/chart/index.html`).toString('utf8');
            code = code.replace(
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/,
                `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`,
            );

            writeFileSync(`${__dirname}/admin/chart/index.html`, code);
        }
        if (existsSync(`${__dirname}/src-chart/build/index.html`)) {
            let code = readFileSync(`${__dirname}/src-chart/build/index.html`).toString('utf8');
            code = code.replace(
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/,
                `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`,
            );

            writeFileSync(`${__dirname}/src-chart/build/index.html`, code);
        }
    })
    .then(() => copyFilesToWWW());
