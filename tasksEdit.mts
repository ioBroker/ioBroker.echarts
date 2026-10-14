/**
 * Copyright 2018-2025 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { deleteFoldersRecursive, npmInstall, buildReact, copyFiles } from '@iobroker/build-tools';

const rootDir = import.meta.dirname;

function copyAllFiles(): void {
    deleteFoldersRecursive(`${rootDir}/admin`, ['chart', 'preview']);

    copyFiles(
        [
            'src-editor/build/**/*',
            '!src-editor/build/vendor/*',
            '!src-editor/build/index.html',
            '!src-editor/build/static/js/main.*.chunk.js',
            '!src-editor/build/static/media/*.svg',
            '!src-editor/build/static/media/*.txt',
            '!src-editor/build/i18n/**/*',
            '!src-editor/build/i18n',
        ],
        'admin/',
    );

    copyFiles('admin-config/*', 'admin/');

    copyFileSync(`${rootDir}/src-editor/build/index.html`, `${rootDir}/admin/tab.html`);
    copyFiles('src-editor/build/static/js/main.*.chunk.js', 'admin/static/js/');
}

function patchTabHtml(): void {
    if (existsSync(`${rootDir}/admin/tab.html`)) {
        let code = readFileSync(`${rootDir}/admin/tab.html`).toString('utf8');
        code = code.replace(
            /<script>\n?\s*var script\s?=\s?document\.createElement\('script'\)[^<]+?<\/script>/,
            `<script type="text/javascript" onerror="setTimeout(function(){window.location.reload()}, 5000)" src="../../lib/js/socket.io.js"></script>`,
        );

        writeFileSync(`${rootDir}/admin/tab.html`, code);
    }
}

deleteFoldersRecursive(`${rootDir}/admin`, ['chart', 'preview']);
deleteFoldersRecursive(`${rootDir}/src-editor/build`);

if (!existsSync(`${rootDir}/src-editor/node_modules`)) {
    await npmInstall(`${rootDir.replace(/\\/g, '/')}/src-editor/`);
}
await buildReact(`${rootDir}/src-editor/`, { rootDir: `${rootDir}/src-editor/`, vite: true, tsc: true });
copyAllFiles();
patchTabHtml();
