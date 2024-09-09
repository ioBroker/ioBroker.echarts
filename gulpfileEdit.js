/**
 * Copyright 2018-2024 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const fs = require('node:fs');
const { deleteFoldersRecursive, npmInstall, buildReact, copyFiles } = require('@iobroker/build-tools');

const dir = `${__dirname}/src/src/i18n/`;

module.exports = function init(gulp) {
    gulp.task('[edit]i18n=>flat', done => {
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

    gulp.task('[edit]flat=>i18n', done => {
        if (!fs.existsSync(`${dir}/flat/`)) {
            console.error(`${dir}/flat/ directory not found`);
            return done();
        }
        const keys = fs.readFileSync(dir + '/flat/index.txt').toString().split(/[\r\n]/);
        while (!keys[keys.length - 1]) keys.splice(keys.length - 1, 1);

        const files = fs.readdirSync(dir + '/flat/').filter(name => name.match(/\.txt$/) && name !== 'index.txt');
        const index = {};
        const langs = [];
        files.forEach(file => {
            const lang = file.replace(/\.txt$/, '');
            langs.push(lang);
            const lines = fs.readFileSync(dir + '/flat/' + file).toString().split(/[\r\n]/);
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

    gulp.task('[edit]clean', done => {
        deleteFoldersRecursive(`${__dirname}/admin`, ['chart']);
        deleteFoldersRecursive(`${__dirname}/src/build`);
        done();
    });

    gulp.task('[edit]2-npm', () => {
        if (fs.existsSync(`${__dirname}/src/node_modules`)) {
            return Promise.resolve();
        }
        return npmInstall(`${__dirname.replace(/\\/g, '/')}/src/`);
    });

    gulp.task('[edit]2-npm-dep', gulp.series('[edit]clean', '[edit]2-npm'));

    gulp.task('[edit]3-build', () => buildReact(`${__dirname}/src/`, { rootDir: __dirname }));

    gulp.task('[edit]3-build-dep', gulp.series('[edit]2-npm', '[edit]3-build'));

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

    gulp.task('[edit]5-copy', done => {
        copyAllFiles();
        done();
    });

    gulp.task('[edit]5-copy-dep', gulp.series('[edit]3-build-dep', '[edit]5-copy'));

    gulp.task('[edit]6-patch', () => new Promise(resolve => {
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
        resolve();
    }));

    gulp.task('[edit]6-patch-dep',  gulp.series('[edit]5-copy-dep', '[edit]6-patch'));
};
