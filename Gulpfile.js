/**
 *
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2014-11-24 15:32:13
 * @version $Id$
 *
 * 需要自行安装：
 * npm install through-gulp thenjs.
 * 
 */

var gulp = require('gulp');
var gulpCssSprite = require('./lib/index.js');
var path = require('path');
var through = require('through-gulp');
var thenjs = require('thenjs');
var sourceCss = [];


gulp.task('default', ['example'], function() {
	console.log('success!!!');
});


// 获取所有符合规则的css路径数组
gulp.task('source', function() {
	sourceCss = [];
	var stream = gulp.src('example/{,**/}sprite.css')
		.pipe(gulpCssSprite.map())
		.pipe(through.map(function(file) {
			sourceCss = file.contents.toString().split(',');
			return file;
		}));
	return stream;
});


// 把所有需要合并图片的css 处理一遍，依赖上一步的路径地址
gulp.task('example', ['source'], function() {
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