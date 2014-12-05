/**
 *
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2014-12-04 16:20:45
 * @version $Id$
 *
 * 返回对象，包含两个方法，一个获取符合规则的css路径，一个拼合css文件的图片和替换css文件。
 */
'use strict';
var gulpCssSprite = require('./sprite.js');
var sourceMap = require('./source-map.js');
var GulpCssSprite = {}

GulpCssSprite.sprite = gulpCssSprite;

GulpCssSprite.map = sourceMap;

module.exports =  GulpCssSprite;