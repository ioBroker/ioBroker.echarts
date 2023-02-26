/**
 * Copyright 2018-2023 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const fs   = require('fs');
const path = require('path');
const cp   = require('child_process');

function deleteFoldersRecursive(path, exceptions) {
    if (fs.existsSync(path)) {
        const files = fs.readdirSync(path);
        for (const file of files) {
            const curPath = `${path}/${file}`;
            if (exceptions && exceptions.find(e => curPath.endsWith(e))) {
                continue;
            }

            const stat = fs.statSync(curPath);
            if (stat.isDirectory()) {
                deleteFoldersRecursive(curPath);
                fs.rmdirSync(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        }
    }
}

function npmInstall() {
    return new Promise((resolve, reject) => {
        // Install node modules
        const cwd = `${__dirname.replace(/\\/g, '/')}/src-preview/`;

        const cmd = `npm install -f`;
        console.log(`"${cmd} in ${cwd}`);

        // System call used for update of js-controller itself,
        // because during installation npm packet will be deleted too, but some files must be loaded even during the install process.
        const child = cp.exec(cmd, {cwd});

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

function build() {
    return new Promise((resolve, reject) => {
        const options = {
            stdio: 'pipe',
            cwd:   `${__dirname}/src-preview/`
        };

        const version = JSON.parse(fs.readFileSync(`${__dirname}/package.json`).toString('utf8')).version;
        const data = JSON.parse(fs.readFileSync(`${__dirname}/src-preview/package.json`).toString('utf8'));
        data.version = version;
        fs.writeFileSync(`${__dirname}/src-preview/package.json`, JSON.stringify(data, null, 2));

        console.log(options.cwd);

        let script = `${__dirname}/src-preview/node_modules/react-scripts/scripts/build.js`;
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

module.exports = function init(gulp) {
    gulp.task('[preview]clean', done => {
        deleteFoldersRecursive(`${__dirname}/admin/preview`);
        deleteFoldersRecursive(`${__dirname}/src-preview/build`);
        done();
    });

    gulp.task('[preview]2-npm', () => {
        if (fs.existsSync(`${__dirname}/src-preview/node_modules`)) {
            return Promise.resolve();
        } else {
            return npmInstall();
        }
    });

    gulp.task('[preview]2-npm-dep', gulp.series('[preview]clean', '[preview]2-npm'));

    gulp.task('[preview]3-build', () => build());

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
    function copyFolderRecursiveSync(src, dest, exclude) {
        const stats = fs.existsSync(src) && fs.statSync(src);
        if (stats && stats.isDirectory()) {
            !fs.existsSync(dest) && fs.mkdirSync(dest);
            fs.readdirSync(src).forEach(childItemName=> {
                copyFolderRecursiveSync(
                    path.join(src, childItemName),
                    path.join(dest, childItemName));
            });
        } else if (!exclude || !exclude.find(ext => src.endsWith(ext))) {
            fs.copyFileSync(src, dest);
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