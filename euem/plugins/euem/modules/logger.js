 /*
  * Copyright 2012 ITRS Group Plc
  *
  * Logger Module
  * --------------------------------------------------------------
  * Requires: 
  * --------------------------------------------------------------
  */

exports.create = function create() {
    return new Logger();
};


/**
 * Customise logging utility for Geneos
 */
var Logger = function() {
	
	var level = "debug";
	
	this.setLevel = function setLevel(newLevel) {
		this.level = newLevel;
    };
	
    /**
     * 
     * @param message
     * @returns
     */
	this.debug = function debug(message) {
		if( this.level == "debug") {
			console.debug(["[euem][debug]", message].join(" "));
		}
    };
    
    /**
     * 
     * @param message
     * @returns
     */
	this.info = function info(message) {
		console.debug(["[euem][info]", message].join(" "));
    };
    
    /**
     * 
     * @param message
     * @returns
     */
	this.error = function error(message) {
		console.debug(["[euem][error]", message].join(" "));
    };
    
    /**
     * 
     * @param message
     * @returns
     */
	this.warn = function warn(message) {
		console.debug(["[euem][warn]", message].join(" "));
    };
	
};
exports.Logger = Logger;