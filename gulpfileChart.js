/**
 * Copyright 2018-2022 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const fs         = require('fs');
const path       = require('path');
const del        = require('del');
const cp         = require('child_process');

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

        if (!fs.existsSync(dir + '/flat/')) {
            fs.mkdirSync(dir + '/flat/');
        }

        langs.forEach(lang => {
            const words = [];
            keys.forEach(key => {
                words.push(index[key][lang]);
            });
            fs.writeFileSync(dir + '/flat/' + lang + '.txt', words.join('\n'));
        });
        fs.writeFileSync(dir + '/flat/index.txt', keys.join('\n'));
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

    gulp.task('[chart]clean', () => {
        return del([
            // 'src/node_modules/**/*',
            'admin/chart/**/*',
            'admin/chart/*',
            'src-chart/build/**/*'
        ]).then(del([
            // 'src/node_modules',
            'src-chart/build',
        ]));
    });

    function npmInstall() {
        return new Promise((resolve, reject) => {
            // Install node modules
            const cwd = __dirname.replace(/\\/g, '/') + '/src-chart/';

            const cmd = `npm install -f`;
            console.log(`"${cmd} in ${cwd}`);

            // System call used for update of js-controller itself,
            // because during installation npm packet will be deleted too, but some files must be loaded even during the install process.
            const exec = require('child_process').exec;
            const child = exec(cmd, {cwd});

            child.stderr.pipe(process.stderr);
            child.stdout.pipe(process.stdout);

            child.on('exit', (code /* , signal */) => {
                // code 1 is strange error that cannot be explained. Everything is installed but error :(
                if (code && code !== 1) {
                    reject(`Cannot install: ${code}`);
                } else {
                    console.log(`"${cmd} in ${cwd} finished.`);
                    // command succeeded
                    resolve();
                }
            });
        });
    }

    gulp.task('[chart]2-npm', () => {
        if (fs.existsSync(`${__dirname}/src-chart/node_modules`)) {
            return Promise.resolve();
        } else {
            return npmInstall();
        }
    });

    gulp.task('[chart]2-npm-dep', gulp.series('[chart]clean', '[chart]2-npm'));

    function build() {
        return new Promise((resolve, reject) => {
            const options = {
                stdio: 'pipe',
                cwd:   `${__dirname}/src-chart/`
            };

            const version = JSON.parse(fs.readFileSync(__dirname + '/package.json').toString('utf8')).version;
            const data = JSON.parse(fs.readFileSync(__dirname + '/src-chart/package.json').toString('utf8'));
            data.version = version;
            fs.writeFileSync(`${__dirname}/src-chart/package.json`, JSON.stringify(data, null, 2));

            console.log(options.cwd);

            let script = `${__dirname}/src-chart/node_modules/react-scripts/scripts/build.js`;
            if (!fs.existsSync(script)) {
                script = `${__dirname}/node_modules/react-scripts/scripts/build.js`;
            }
            if (!fs.existsSync(script)) {
                console.error(`Cannot find execution file: ${script}`);
                reject(`Cannot find execution file: ${script}`);
            } else {
                const child = cp.fork(script, [], options);
                child.stdout.on('data', data => console.log(data.toString()));
                child.stderr.on('data', data => console.log(data.toString()));
                child.on('close', code => {
                    console.log(`child process exited with code ${code}`);
                    code ? reject(`Exit code: ${code}`) : resolve();
                });
            }

            let widget = fs.readFileSync(`${__dirname}/widgets/echarts.html`).toString('utf8');
            widget = widget.replace(/version: "\d+\.\d+\.\d+"/, `version: "${version}"`);
            fs.writeFileSync(`${__dirname}/widgets/echarts.html`, widget);
        });
    }

    gulp.task('[chart]3-build', () => build());

    gulp.task('[chart]3-build-dep', gulp.series('[chart]2-npm', '[chart]3-build'));

    function copyFiles() {
        return del([
            'admin/chart/**/*'
        ]).then(() => {
            return Promise.all([
                gulp.src([
                    'src-chart/build/**/*',
                    '!src-chart/build/index.html',
                    '!src-chart/build/static/js/main.*.chunk.js',
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
        });
    }

    gulp.task('[chart]5-copy', () => copyFiles());

    gulp.task('[chart]5-copy-dep', gulp.series('[chart]3-build-dep', '[chart]5-copy'));

    gulp.task('[chart]6-patch', () => new Promise(resolve => {
        if (fs.existsSync(__dirname + '/admin/chart/index.html')) {
            let code = fs.readFileSync(__dirname + '/admin/chart/index.html').toString('utf8');
            code = code.replace(/<script>var script=document\.createElement\("script"\).+?<\/script>/,
                `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`);

            fs.writeFileSync(__dirname + '/admin/chart/index.html', code);
        }
        if (fs.existsSync(__dirname + '/src-chart/build/index.html')) {
            let code = fs.readFileSync(__dirname + '/src-chart/build/index.html').toString('utf8');
            code = code.replace(/<script>var script=document\.createElement\("script"\).+?<\/script>/,
                `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`);

            fs.writeFileSync(__dirname + '/src-chart/build/index.html', code);
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
            if (fs.existsSync(__dirname + '/src-chart/build/index.html')) {
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

    function checkWWW(resolve, reject, start) {
        if (!resolve) {
            return new Promise((resolve, reject) =>
                checkChart(resolve, reject, Date.now()));
        } else {
            console.log('Check www/index.html');
            if (fs.existsSync(__dirname + '/www/index.html')) {
                console.log('Exists www/index.html');
                setTimeout(() => resolve(), 500);
            } else {
                if (Date.now() - start > 30000) {
                    reject('timeout');
                } else {
                    console.log('Wait for www/index.html');
                    setTimeout(() => checkChart(resolve, reject, start), 500);
                }
            }
        }
    }

    /*function copyFileSync(source, target) {
        let targetFile = target;

        // If target is a directory, a new file with the same name will be created
        if (fs.existsSync(target)) {
            if (fs.lstatSync(target).isDirectory()) {
                targetFile = path.join(target, path.basename(source));
            }
        }

        fs.writeFileSync(targetFile, fs.readFileSync(source));
    }

    function copyFolderRecursiveSync(source, target) {
        let files = [];

        // Copy
        if (fs.lstatSync(source).isDirectory()) {
            files = fs.readdirSync(source);
            files.forEach(file => {
                const targetFolder = path.join(target, path.basename(source));
                if (!fs.existsSync(targetFolder)) {
                    fs.mkdirSync(targetFolder);
                }

                const curSource = path.join(source, file);
                if (fs.lstatSync(curSource).isDirectory() ) {
                    copyFolderRecursiveSync(curSource, targetFolder);
                } else {
                    copyFileSync(curSource, targetFolder);
                }
            });
        }
    }*/
    function copyFolderRecursiveSync(src, dest) {
        const stats = fs.existsSync(src) && fs.statSync(src);
        if (stats && stats.isDirectory()) {
            !fs.existsSync(dest) && fs.mkdirSync(dest);
            fs.readdirSync(src).forEach(childItemName=> {
                copyFolderRecursiveSync(
                    path.join(src, childItemName),
                    path.join(dest, childItemName));
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    }

    function copyFilesToWWW() {
        return del([
            'www/**/*'
        ]).then(() => {
            return checkChart()
                .then(() =>
                    copyFolderRecursiveSync(__dirname + '/admin/chart/', __dirname + '/www'))
                .then(() =>
                    new Promise(resolve => {
                        if (fs.existsSync(__dirname + '/www/index.html')) {
                            let code = fs.readFileSync(__dirname + '/www/index.html').toString('utf8');
                            code = code.replace(/<script>var script=document\.createElement\("script"\).+?<\/script>/,
                                `<script type="text/javascript" src="./../lib/js/socket.io.js"></script>`);
                            code = code.replace('<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>',
                                `<script type="text/javascript" src="./../lib/js/socket.io.js"></script>`);

                            if (!code.includes('_socket/info.js')) {
                                code = code.replace('<script type="text/javascript" src="./../lib/js/socket.io.js"></script>', '<script type="text/javascript" src="./../lib/js/socket.io.js"></script><script type="text/javascript" src="_socket/info.js"></script>');
                            }

                            fs.writeFileSync(__dirname + '/www/index.html', code);
                        }

                        resolve();
                    }));
        });
    }
    gulp.task('[chart]7-copy-www', () =>
        copyFilesToWWW());

    gulp.task('[chart]7-copy-www-dep',  gulp.series('[chart]6-patch-dep', '[chart]7-copy-www'));

};