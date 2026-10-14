/**
 * Copyright 2018-2025 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
    deleteFoldersRecursive,
    npmInstall,
    buildReact,
    copyFolderRecursiveSync,
    copyFiles,
} from '@iobroker/build-tools';

const rootDir = import.meta.dirname;

function copyAllFiles(): void {
    deleteFoldersRecursive(`${rootDir}/admin/preview`);

    copyFiles(['src-preview/build/**/*'], 'admin/preview/');
}

async function waitForPreview(): Promise<void> {
    const start = Date.now();
    console.log('Check src-preview/build/index.html');
    while (!existsSync(`${rootDir}/src-preview/build/index.html`)) {
        if (Date.now() - start > 30000) {
            throw new Error('timeout');
        }
        console.log('Wait for src-preview/build/index.html');
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('Exists src-preview/build/index.html');
    await new Promise(resolve => setTimeout(resolve, 500));
}

function patchAdminHtml(): void {
    // we cannot use patchHtml because we need ../.. in path
    if (existsSync(`${rootDir}/admin/preview/index.html`)) {
        let code = readFileSync(`${rootDir}/admin/preview/index.html`).toString('utf8');
        code = code.replace(
            /<script>\n?\s*var script\s?=\s?document\.createElement\('script'\)[^<]+?<\/script>/,
            `<script type="text/javascript" onerror="setTimeout(function(){window.location.reload()}, 5000)" src="../../../lib/js/socket.io.js"></script>`,
        );

        writeFileSync(`${rootDir}/admin/preview/index.html`, code);
    }
}

async function copyFilesToWWW(): Promise<void> {
    deleteFoldersRecursive(`${rootDir}/www/preview`);

    await waitForPreview();
    copyFolderRecursiveSync(`${rootDir}/admin/preview/`, `${rootDir}/www/preview`, ['.svg', '.txt']);
}

deleteFoldersRecursive(`${rootDir}/admin/preview`);
deleteFoldersRecursive(`${rootDir}/src-preview/build`);

if (!existsSync(`${rootDir}/src-preview/node_modules`)) {
    await npmInstall(`${rootDir.replace(/\\/g, '/')}/src-preview/`);
}
await buildReact(`${rootDir}/src-preview/`, { rootDir: `${rootDir}/src-preview/`, vite: true, tsc: true });
copyAllFiles();
patchAdminHtml();
await copyFilesToWWW();
