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
    copyFolderRecursiveSync,
}   = require('@iobroker/build-tools');

module.exports = function init(gulp) {
    gulp.task('[preview]clean', done => {
        deleteFoldersRecursive(`${__dirname}/admin/preview`);
        deleteFoldersRecursive(`${__dirname}/src-preview/build`);
        done();
    });

    gulp.task('[preview]2-npm', () => {
        if (fs.existsSync(`${__dirname}/src-preview/node_modules`)) {
            return Promise.resolve();
        }
        return npmInstall(`${__dirname.replace(/\\/g, '/')}/src-preview/`);
    });

    gulp.task('[preview]2-npm-dep', gulp.series('[preview]clean', '[preview]2-npm'));

    gulp.task('[preview]3-build', () => buildReact(`${__dirname}/src-preview/`, { rootDir: __dirname }));

    gulp.task('[preview]3-build-dep', gulp.series('[preview]2-npm', '[preview]3-build'));

    function copyFiles() {
        deleteFoldersRecursive(`${__dirname}/admin/preview`);

        return Promise.all([
            gulp.src([
                'src-preview/build/**/*',
                '!src-preview/build/index.html',
                '!src-preview/build/static/js/main.*.chunk.js',
                '!src-preview/build/static/media/*.svg',
                '!src-preview/build/static/media/*.txt',
                '!src-preview/build/i18n/**/*',
                '!src-preview/build/i18n',
            ])
                .pipe(gulp.dest('admin/preview/')),

            gulp.src([
                'src-preview/build/index.html',
            ])
                .pipe(gulp.dest('admin/preview/')),

            gulp.src([
                'src-preview/build/static/js/main.*.chunk.js',
            ])
                .pipe(gulp.dest('admin/preview/static/js/')),
        ]);
    }

    gulp.task('[preview]5-copy', () => copyFiles());

    gulp.task('[preview]5-copy-dep', gulp.series('[preview]3-build-dep', '[preview]5-copy'));

    gulp.task('[preview]6-patch', () => new Promise(resolve => {
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
        resolve();
    }));

    gulp.task('[preview]6-patch-dep',  gulp.series('[preview]5-copy-dep', '[preview]6-patch'));

    function checkChart(resolve, reject, start) {
        if (!resolve) {
            return new Promise((resolve, reject) =>
                checkChart(resolve, reject, Date.now()));
        } else {
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
    }

    function checkWWW(resolve, reject, start) {
        if (!resolve) {
            return new Promise((resolve, reject) =>
                checkChart(resolve, reject, Date.now()));
        } else {
            console.log('Check www/preview/index.html');
            if (fs.existsSync(`${__dirname}/www/preview/index.html`)) {
                console.log('Exists www/preview/index.html');
                setTimeout(() => resolve(), 500);
            } else {
                if (Date.now() - start > 30000) {
                    reject('timeout');
                } else {
                    console.log('Wait for www/preview/index.html');
                    setTimeout(() => checkChart(resolve, reject, start), 500);
                }
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
    gulp.task('[preview]7-copy-www', () =>
        copyFilesToWWW());

    gulp.task('[preview]7-copy-www-dep',  gulp.series('[preview]6-patch-dep', '[preview]7-copy-www'));

};
