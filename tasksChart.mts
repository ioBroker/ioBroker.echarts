/**
 * Copyright 2018-2026 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import {
    deleteFoldersRecursive,
    npmInstall,
    copyFolderRecursiveSync,
    buildReact,
    copyFiles,
} from '@iobroker/build-tools';

const rootDir = import.meta.dirname;
const SOCKET_IO_ADMIN = `<script type="text/javascript" onerror="setTimeout(function(){window.location.reload()}, 5000)" src="../../../lib/js/socket.io.js"></script>`;
const SOCKET_IO_WWW = `<script type="text/javascript" onerror="setTimeout(function(){window.location.reload()}, 5000)" src="../../lib/js/socket.io.js"></script>`;

/** Writes the chart model and options into the backend, so that the server can render the same charts */
function copyReactFilesToBackEnd(): void {
    let chartOptions = readFileSync(`${rootDir}/src-chart/src/Components/ChartOption.ts`).toString('utf8');
    let chartModel = readFileSync(`${rootDir}/src-chart/src/Components/ChartModel.ts`).toString('utf8');

    chartModel = chartModel
        .replace("import type { Connection } from '@iobroker/gui-components';\n", '')
        .replace("'../../../src/types';", "'../types';")
        .replace('ChartRangeOptions,', 'ChartRangeOptions,\n    Connection,');
    chartOptions = chartOptions.replace("'../../../src/types';", "'../types';");

    writeFileSync(`${rootDir}/src/lib/ChartOption.ts`, chartOptions);
    writeFileSync(`${rootDir}/src/lib/ChartModel.ts`, chartModel);
}

function copyAllFiles(): void {
    deleteFoldersRecursive(`${rootDir}/admin/chart`);

    copyReactFilesToBackEnd();

    copyFiles(['src-chart/build/**/*'], 'admin/chart/');
}

async function waitForChart(): Promise<void> {
    const start = Date.now();
    console.log('Check src-chart/build/index.html');
    while (!existsSync(`${rootDir}/src-chart/build/index.html`)) {
        if (Date.now() - start > 30000) {
            throw new Error('timeout');
        }
        console.log('Wait for src-chart/build/index.html');
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('Exists src-chart/build/index.html');
    await new Promise(resolve => setTimeout(resolve, 500));
}

function patchAdminHtml(): void {
    if (existsSync(`${rootDir}/admin/chart/index.html`)) {
        let code = readFileSync(`${rootDir}/admin/chart/index.html`).toString('utf8');
        code = code.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/, SOCKET_IO_ADMIN);

        writeFileSync(`${rootDir}/admin/chart/index.html`, code);
    }
}

async function copyFilesToWWW(): Promise<void> {
    deleteFoldersRecursive(`${rootDir}/www`);

    await waitForChart();
    copyFolderRecursiveSync(`${rootDir}/admin/chart/`, `${rootDir}/www`, ['.svg', '.txt']);

    if (existsSync(`${rootDir}/www/index.html`)) {
        let code = readFileSync(`${rootDir}/www/index.html`).toString('utf8');
        code = code.replace(SOCKET_IO_ADMIN, SOCKET_IO_WWW);

        if (!code.includes('_socket/info.js')) {
            code = code.replace(
                SOCKET_IO_WWW,
                `${SOCKET_IO_WWW}<script type="text/javascript" src="_socket/info.js"></script>`,
            );
        }

        writeFileSync(`${rootDir}/www/index.html`, code);
    }
}

deleteFoldersRecursive(`${rootDir}/admin/chart`);
deleteFoldersRecursive(`${rootDir}/src-chart/build`);

if (!existsSync(`${rootDir}/src-chart/node_modules`)) {
    await npmInstall(`${rootDir.replace(/\\/g, '/')}/src-chart/`);
}
await buildReact(`${rootDir}/src-chart/`, { rootDir: `${rootDir}/src-chart/`, vite: true, tsc: true });
copyAllFiles();
patchAdminHtml();
await copyFilesToWWW();
