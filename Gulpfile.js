/**
 *
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2014-11-24 15:32:13
 * @version $Id$
 */

var gulp = require('gulp');
var gulpCssSprite = require('gulp-css-sprite');
var path = require('path');
var through = require('through-gulp');
var thenjs = require('thenjs');
var sourceCss = [];


gulp.task('default', function() {
	gulp.src('src/module/{,**/}sprite.css').pipe(gulp.dest('tmp/test/'));
});


// 获取所有符合规则的css路径数组
gulp.task('test', function() {
	sourceCss = [];
	var stream = gulp.src('src/module/{,**/}sprite.css')
		.pipe(gulpCssSprite.map())
		.pipe(through.map(function(file) {
			sourceCss = file.contents.toString().split(',');
			return file;
		}));
	return stream;
});


// 把所有需要合并图片的css 处理一遍，依赖上一步的路径地址
gulp.task('sample', ['test'], function() {
	thenjs.eachSeries(sourceCss, function(cont, value, index, array) {
		gulp.src(value)
			.pipe(gulpCssSprite.sprite({
				imgName: 'sprite.png',
				cssName: 'sprite_tmp.css',
				index: index
			}))
			.pipe(gulp.dest('tmp/')).on('end', function() {
				cont();
			});
	})

});