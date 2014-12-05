// Load our dependencies
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var Readable = require('stream').Readable;
var _ = require('underscore');
var gutil = require('gulp-util');
var json2css = require('json2css');
var spritesmith = require('spritesmith');
var through2 = require('through2');
var url = require('url2');
var cssreplace = require('./css-replace.js');
var rbgs = /background(?:-image)?\s*:[^;]*?url\((["\']?)([^\)]+)\1\)[^};]*;?/ig;

//修正路径，替换 \\ \ 为 /
function fixPath(path) {
  return String(path).replace(/\\/g, '/').replace(/\/$/, '');
}

/**
 * [ExtFormat  判断函数，需要先添加判断的文件格式，然后使用get获取文件格式]
 * @author yuqiu
 * @date   2014-12-05T10:47:53+0800
 */
function ExtFormat() {
  this.formatObj = {};
}
ExtFormat.prototype = {
  'add': function(name, val) {
    this.formatObj[name] = val;
  },
  'get': function(filepath) {
    // 返回路径的后缀 带.的,并且转小写字母
    var ext = path.extname(filepath),
      lowerExt = ext.toLowerCase();

    // 然后返回后缀对应的文件格式
    var formatObj = this.formatObj,
      format = formatObj[lowerExt];
    return format;
  }
};

// 创建 img 和 css的格式对象
var imgFormats = new ExtFormat();
var cssFormats = new ExtFormat();

// 添加 img 格式
imgFormats.add('.png', 'png');
imgFormats.add('.jpg', 'jpeg');
imgFormats.add('.jpeg', 'jpeg');

// 添加 css 格式
cssFormats.add('.styl', 'stylus');
cssFormats.add('.stylus', 'stylus');
cssFormats.add('.sass', 'sass');
cssFormats.add('.scss', 'scss');
cssFormats.add('.less', 'less');
cssFormats.add('.json', 'json');
cssFormats.add('.css', 'css');


// 主体函数，获取源css，使用 spritesmith 拼合图片，生成新的css，并替换源css.
function gulpCssSprite(params) {
  params = params || {};
  var imgNameArray = params.imgName.split('.');
  // 生成的图片名称都是加上 index的数字，好区分。
  var imgName = imgNameArray.join('_' + params.index + '.') || 'sprite.png';
  var cssName = params.cssName || 'sprite.css';
  assert(imgName, 'An `imgName` parameter was not provided  (required)');
  assert(cssName, 'A `cssName` parameter was not provided  (required)');

  // 定义我们自己子文件流
  var imgStream = new Readable({
    objectMode: true
  });
  imgStream._read = function imgRead() {
    // Do nothing, let the `finish` handler take care of this
  };
  var cssStream = new Readable({
    objectMode: true
  });
  cssStream._read = function cssRead() {
    // Do nothing, let the `finish` handler take care of this
  };
  var sourceFile = {} ;

  // 处理源CSS
  var images = [], imagesPath = {};
  var onData = function(file, encoding, cb) {
    sourceFile.contents = file.contents;
    var filepath = file.path;
    var cssData = file.contents.toString();
    var cssPathAbsolute = path.relative(file.cwd, filepath);
    var cssPath = path.dirname(cssPathAbsolute);
    sourceFile.name = cssPathAbsolute;
    // 处理css内容，把图片路径地址找出来。
    cssData.replace(rbgs, function(css, b, uri) {
      images.push(fixPath(path.resolve(cssPath, uri)));
      imagesPath.relative = path.dirname(uri);
      imagesPath.absolute = path.dirname(fixPath(path.join(cssPath, uri)));
    });
    // 对应图片和 css类名的关系
    cssreplace.cssImage(cssData);
    cb();
  };

  // 完成输入
  var onEnd = function(cb) {
    // If there are no images present, exit early
    // DEV: This is against the behavior of `spritesmith` but pro-gulp
    // DEV: See https://github.com/twolfson/gulp.spritesmith/issues/17
    if (images.length === 0) {
      imgStream.push(null);
      cssStream.push(null);
      return cb();
    }

    // 自定义的图片参数
    var imgOpts = params.imgOpts || {};
    var imgFormat = imgOpts.format || imgFormats.get(imgName) || 'png';

    // Set up the defautls for imgOpts
    imgOpts = _.defaults({}, imgOpts, {
      'format': imgFormat
    });

    // Run through spritesmith
    var spritesmithParams = {
      'src': images,
      'engine': params.engine || 'auto',
      'algorithm': params.algorithm || 'top-down',
      'padding': params.padding || 0,
      'algorithmOpts': params.algorithmOpts || {},
      'engineOpts': params.engineOpts || {},
      'exportOpts': imgOpts
    };
    var self = this;

    spritesmith(spritesmithParams, function(err, result) {
      // If an error occurred, emit it
      if (err) {
        return cb(err);
      }
      // Otherwise, write out the image
      var imgFile = new gutil.File({
        path: imagesPath.absolute + '/' + imgName,
        contents: new Buffer(result.image, 'binary')
      });
      self.push(imgFile);
      imgStream.push(imgFile);
      imgStream.push(null);
      // START OF BARELY MODIFIED SECTION FROM grunt-spritesmith@1.22.0
      // Generate a listing of CSS variables
      var coordinates = result.coordinates;
      var properties = result.properties;
      var spritePath = params.imgPath || url.relative(fixPath(sourceFile.name), imagesPath.absolute + '/' + imgName);
      var cssVarMap = params.cssVarMap || function noop() {};
      var cleanCoords = [];
      // Clean up the file name of the file
      Object.getOwnPropertyNames(coordinates).sort().forEach(function(file) {
        // Extract the image name (exlcuding extension)
        var fullname = path.basename(file);
        var nameParts = fullname.split('.');

        // If there is are more than 2 parts, pop the last one
        if (nameParts.length >= 2) {
          nameParts.pop();
        }

        // Extract out our name
        var name = nameParts.join('.');
        var coords = coordinates[file];
        // Specify the image for the sprite
        coords.name = name;
        coords.source_image = file;
        coords.image = spritePath;
        coords.total_width = properties.width;
        coords.total_height = properties.height;

        // Map the coordinates through cssVarMap
        coords = cssVarMap(coords) || coords;
        // Save the cleaned name and coordinates
        cleanCoords.push(coords);
      });

      // Render the variables via json2css
      var cssFormat = params.cssFormat || cssFormats.get(cssName) || 'json';
      var cssTemplate = params.cssTemplate;

      // If there's a custom template, use it
      if (cssTemplate) {
        cssFormat = 'spritesmith-custom';
        if (typeof cssTemplate === 'function') {
          json2css.addTemplate(cssFormat, cssTemplate);
        } else {
          json2css.addMustacheTemplate(cssFormat, fs.readFileSync(cssTemplate, 'utf8'));
        }
      }
      var cssStr = json2css(cleanCoords, {
        'format': cssFormat,
        'formatOpts': params.cssOpts || {}
      });

      // 替换源css文件用新的拼合css。
      var newCssStr = cssreplace.cssReplaceSprite(sourceFile.contents.toString(), cssStr);

      var cssFile = new gutil.File({
        path: sourceFile.name,
        contents: new Buffer(newCssStr)
      });
      self.push(cssFile);
      cssStream.push(cssFile);
      cssStream.push(null);
      cb();
    });
  };

  // Return output stream with two sub-streams:
  // - master stream includes all files
  // - 'css' stream for css only
  // - 'img' stream for images only
  var retStream = through2.obj(onData, onEnd);
  retStream.css = cssStream;
  retStream.img = imgStream;
  return retStream;
}


module.exports = gulpCssSprite;