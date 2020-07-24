/**
 * Copyright 2018-2020 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const gulp       = require('gulp');
const fs         = require('fs');

const pkg       = require('./package.json');
const iopackage = require('./io-package.json');
const version   = (pkg && pkg.version) ? pkg.version : iopackage.common.version;

require('./gulpfileChart')(gulp);
require('./gulpfileEdit')(gulp);

gulp.task('updatePackages', done => {
    iopackage.common.version = pkg.version;
    iopackage.common.news = iopackage.common.news || {};
    if (!iopackage.common.news[pkg.version]) {
        const news = iopackage.common.news;
        const newNews = {};

        newNews[pkg.version] = {
            en: 'news',
            de: 'neues',
            ru: 'новое'
        };
        iopackage.common.news = Object.assign(newNews, news);
    }
    fs.writeFileSync('io-package.json', JSON.stringify(iopackage, null, 4));
    done();
});

gulp.task('updateReadme', done => {
    const readme = fs.readFileSync('README.md').toString();
    const pos = readme.indexOf('## Changelog\n');
    if (pos !== -1) {
        const readmeStart = readme.substring(0, pos + '## Changelog\n'.length);
        const readmeEnd   = readme.substring(pos + '## Changelog\n'.length);

        if (readme.indexOf(version) === -1) {
            const timestamp = new Date();
            const date = timestamp.getFullYear() + '-' +
                ('0' + (timestamp.getMonth() + 1).toString(10)).slice(-2) + '-' +
                ('0' + (timestamp.getDate()).toString(10)).slice(-2);

            let news = '';
            if (iopackage.common.news && iopackage.common.news[pkg.version]) {
                news += '* ' + iopackage.common.news[pkg.version].en;
            }

            fs.writeFileSync('README.md', readmeStart + '### ' + version + ' (' + date + ')\n' + (news ? news + '\n\n' : '\n') + readmeEnd);
        }
    }
    done();
});

gulp.task('default', gulp.series('updateReadme', '[edit]6-patch-dep', '[chart]6-patch-dep'));
