/**
 * Copyright 2023-2024 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const fs   = require('node:fs');
const gulpHelper  = require('@iobroker/vis-2-widgets-react-dev/gulpHelper');
const adapterName = require('./package.json').name.split('.').pop();

module.exports = function init(gulp) {
    gulp.task('[widgets]clean', done => {
        gulpHelper.deleteFoldersRecursive(`${__dirname}/widgets`, ['echarts.html', 'Prev_tplEchartsChart.png']);
        gulpHelper.deleteFoldersRecursive(`${__dirname}/src-widgets/build`);
        done();
    });

    gulp.task('[widgets]2-npm', async () => gulpHelper.npmInstall(`${__dirname}/src-widgets/`));

    gulp.task('[widgets]2-npm-dep', gulp.series('[widgets]clean', '[widgets]2-npm'));

    gulp.task('[widgets]3-build', async () => gulpHelper.buildWidgets(__dirname, `${__dirname}/src-widgets/`));

    gulp.task('[widgets]3-build-dep', gulp.series('[widgets]2-npm', '[widgets]3-build'));

    gulp.task('[widgets]5-copy', () => Promise.all([
        gulp.src([`src-widgets/build/*.js`]).pipe(gulp.dest(`widgets/${adapterName}`)),
        gulp.src([`src-widgets/build/img/*`]).pipe(gulp.dest(`widgets/${adapterName}/img`)),
        gulp.src([`src-widgets/build/*.map`]).pipe(gulp.dest(`widgets/${adapterName}`)),
        gulp.src([
            `src-widgets/build/static/**/*`,
            ...gulpHelper.ignoreFiles(`${__dirname}/src-widgets/`),
        ]).pipe(gulp.dest(`widgets/${adapterName}/static`)),
        gulp.src([
            ...gulpHelper.copyFiles(`${__dirname}/src-widgets/`),
        ]).pipe(gulp.dest(`widgets/${adapterName}/static/js`)),
        gulp.src([`src-widgets/src/i18n/*.json`]).pipe(gulp.dest(`widgets/${adapterName}/i18n`)),
        new Promise(resolve =>
            setTimeout(() => {
                if (fs.existsSync(`widgets/${adapterName}/static/media`) &&
                    !fs.readdirSync(`widgets/${adapterName}/static/media`).length
                ) {
                    fs.rmdirSync(`widgets/${adapterName}/static/media`);
                }
                resolve(null);
            }, 500)
        )
    ]));
    gulp.task('[widgets]5-copy-dep', gulp.series('[widgets]3-build-dep', '[widgets]5-copy'));
};
