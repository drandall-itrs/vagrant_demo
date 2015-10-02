 /*
  * Copyright 2012 ITRS Group Plc
  *
  * AccessorJS Object
  * Accessor Module for Geneos EUEM
  * --------------------------------------------------------------
  * Requires: CasperJS
  * --------------------------------------------------------------
  */

var utils = require('utils');

exports.create = function create(g, options) {
    return new GadgetsJS(g, options);
};

/**
 * GadgetsJS constructor
 */
var GadgetsJS = function(g, options) {
	this.geneos = g;
};

GadgetsJS.prototype.measurePerformance = function(url, path, hook) {
	this.geneos.casper.then(function(){
		geneos.performance.measure({
			address:  url,
			savePath: geneos.current_output_folder + "/" + path
		});
	}).then(hook);
};

exports.GadgetsJS = GadgetsJS;