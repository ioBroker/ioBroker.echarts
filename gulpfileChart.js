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
    buildReact,
}   = require('@iobroker/build-tools');

const dir = `${__dirname}/src-chart/src/i18n/`;

module.exports = function init(gulp) {
    gulp.task('[chart]i18n=>flat', done => {
        const files = fs.readdirSync(dir).filter(name => name.match(/\.json$/));
        const index = {};
        const langs = [];
        files.forEach(file => {
            const lang = file.replace(/\.json$/, '');
            langs.push(lang);
            const text = require(dir + file);

            for (const id in text) {
                if (text.hasOwnProperty(id)) {
                    index[id] = index[id] || {};
                    index[id][lang] = text[id] === undefined ? id : text[id];
                }
            }
        });

        const keys = Object.keys(index);
        keys.sort();

        if (!fs.existsSync(`${dir}/flat/`)) {
            fs.mkdirSync(`${dir}/flat/`);
        }

        langs.forEach(lang => {
            const words = [];
            keys.forEach(key => {
                words.push(index[key][lang]);
            });
            fs.writeFileSync(`${dir}/flat/${lang}.txt`, words.join('\n'));
        });
        fs.writeFileSync(`${dir}/flat/index.txt`, keys.join('\n'));
        done();
    });

    gulp.task('[chart]flat=>i18n', done => {
        if (!fs.existsSync(`${dir}/flat/`)) {
            console.error(`${dir}/flat/ directory not found`);
            return done();
        }
        const keys = fs.readFileSync(`${dir}/flat/index.txt`).toString().split(/[\r\n]/);
        while (!keys[keys.length - 1]) keys.splice(keys.length - 1, 1);

        const files = fs.readdirSync(`${dir}/flat/`).filter(name => name.match(/\.txt$/) && name !== 'index.txt');
        const index = {};
        const langs = [];
        files.forEach(file => {
            const lang = file.replace(/\.txt$/, '');
            langs.push(lang);
            const lines = fs.readFileSync(`${dir}/flat/${file}`).toString().split(/[\r\n]/);
            lines.forEach((word, i) => {
                index[keys[i]] = index[keys[i]] || {};
                index[keys[i]][lang] = word;
            });
        });
        langs.forEach(lang => {
            const words = {};
            keys.forEach((key, line) => {
                if (!index[key]) {
                    console.log(`No word ${key}, ${lang}, line: ${line}`);
                }
                words[key] = index[key][lang];
            });
            fs.writeFileSync(`${dir}/${lang}.json`, JSON.stringify(words, null, 2));
        });
        done();
    });

    gulp.task('[chart]clean', done => {
        deleteFoldersRecursive(`${__dirname}/admin/chart`);
        deleteFoldersRecursive(`${__dirname}/src-chart/build`);
        done();
    });

    gulp.task('[chart]2-npm', () => {
        if (fs.existsSync(`${__dirname}/src-chart/node_modules`)) {
            return Promise.resolve();
        }
        return npmInstall(`${__dirname.replace(/\\/g, '/')}/src-chart/`);
    });

    gulp.task('[chart]2-npm-dep', gulp.series('[chart]clean', '[chart]2-npm'));

    gulp.task('[chart]3-build', () => buildReact(`${__dirname}/src-chart/`, { rootDir: __dirname }));

    gulp.task('[chart]3-build-dep', gulp.series('[chart]2-npm', '[chart]3-build'));

    function copyFiles() {
        deleteFoldersRecursive(`${__dirname}/admin/chart`);

        return Promise.all([
            gulp.src([
                'src-chart/build/**/*',
                '!src-chart/build/index.html',
                '!src-chart/build/static/js/main.*.chunk.js',
                '!src-chart/build/static/media/*.svg',
                '!src-chart/build/static/media/*.txt',
                '!src-chart/build/i18n/**/*',
                '!src-chart/build/i18n',
            ])
                .pipe(gulp.dest('admin/chart/')),

            gulp.src([
                'src-chart/build/index.html',
            ])
                .pipe(gulp.dest('admin/chart/')),

            gulp.src([
                'src-chart/build/static/js/main.*.chunk.js',
            ])
                .pipe(gulp.dest('admin/chart/static/js/')),
        ]);
    }

    gulp.task('[chart]5-copy', () => copyFiles());

    gulp.task('[chart]5-copy-dep', gulp.series('[chart]3-build-dep', '[chart]5-copy'));

    gulp.task('[chart]6-patch', () => new Promise(resolve => {
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
        resolve();
    }));

    gulp.task('[chart]6-patch-dep',  gulp.series('[chart]5-copy-dep', '[chart]6-patch'));

    function checkChart(resolve, reject, start) {
        if (!resolve) {
            return new Promise((resolve, reject) =>
                checkChart(resolve, reject, Date.now()));
        } else {
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
    gulp.task('[chart]7-copy-www', () =>
        copyFilesToWWW());

    gulp.task('[chart]7-copy-www-dep',  gulp.series('[chart]6-patch-dep', '[chart]7-copy-www'));
};
