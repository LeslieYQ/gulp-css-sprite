/**
 * 
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2014-12-03 19:49:37
 * @version $Id$
 */


var css2json = require('./css2json.js');
var _ = require('underscore');

var cssReplace = {
	map : {},

	cssImage: function(cssData){
		var cssObj = css2json(cssData);
		var self = this;
		self.map = {};
		_.each(cssObj, function(value, key, obj){
			var name =_.find(_.values(value), function(item){
				return item.replace(/.*\/([^\/]+)\..+/,'$1');
			});
			name = name.replace(/.*\/([^\/]+)\..+/,'$1');
			self.map[name] = key;
		});
	},

	cssReplaceSprite: function(sourceCss, spriteCss){
		var self = this;
		var sourceCssObj = css2json(sourceCss);
		var spriteCssObj = css2json(spriteCss);
		_.each(spriteCssObj, function(value, key, obj){
			var mapKey = _.find(_.keys(self.map), function(item){
				return key.split('-')[1] === item;
			});
			_.each(value, function(val, k, o){
				sourceCssObj[self.map[mapKey]][k] = val;
			});
		});
		return self.json2css(sourceCssObj);
	},

	json2css: function(cssJson){
		var newCssJson = _.map(cssJson, function(item, key, list){
			var value = _.pairs(item).map(function(num){
				return num.join(': ');
			});
			value = value.join(';\n\t') + ';';
			return key + '{\n\t' + value + '\n}\n';
		});
		return newCssJson.join('\n');
	}
};

module.exports =  cssReplace;