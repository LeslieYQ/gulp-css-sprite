/**
 *
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2014-12-04 16:26:45
 * @version $Id$
 */

var _ = require('underscore');
var through2 = require('through2');
var path = require('path');
var Readable = require('stream').Readable;
var gutil = require('gulp-util');



function fixPath(path) {
	return String(path).replace(/\\/g, '/').replace(/\/$/, '');
}

/**
 * [sourcsMap 获取传入css中，符合要求的css路径地址]
 * @author yuqiu
 * @date   2014-12-05T11:09:09+0800
 * @return {[type]}                 [返回css路径地址]
 */
function sourcsMap() {
	var cssPath = [];
	var onData = function(file, encoding, cb) {
		cssPath.push(fixPath(path.relative(file.cwd, file.path)));
		cb();
	};

	var onEnd = function(cb) {
		var cssFile = new gutil.File({
        path: 'source.path',
        contents: new Buffer(cssPath.join(','))
      });
		this.push(cssFile);
		cb();
	};

	var retStream = through2.obj(onData, onEnd);
	return retStream;
};

module.exports = sourcsMap;