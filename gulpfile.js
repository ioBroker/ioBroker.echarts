/**
 * Copyright 2018-2022 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const gulp = require('gulp');

require('./gulpfileChart')(gulp);
require('./gulpfileEdit')(gulp);
require('./gulpfilePreview')(gulp);
require('./gulpfileWidgets')(gulp);

gulp.task('default', gulp.series('[edit]6-patch-dep', '[chart]7-copy-www-dep', '[preview]7-copy-www-dep', '[widgets]5-copy-dep'));
