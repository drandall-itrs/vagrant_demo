/*
 * Copyright 2012 ITRS Group Plc
 *
 * Toolkit Module
 * --------------------------------------------------------------
 * Requires: 
 * --------------------------------------------------------------
 */
exports.create = function create() {
    return new Toolkit();
};

/**
 * Collection of each to use functions
 */
var Toolkit = function() {

    /**
     * Extract the duration of step (either totalTime if present or just the
     * elapse time)
     * 
     * @param message
     * @returns
     */
    this.getStepDuration = function getStepDuration(step) {
        if ("totalTime" in step) {
            return step.totalTime;
        } else {
            return step.elapse;
        }
    };

    /**
     * Creates a result message
     */
    this.createResult = function(isPassed, message) {
        return {
            isPassed : isPassed,
            message : message
        };
    };

    /**
     * strip commas
     * 
     * @param string
     * @returns
     */
    this.stripComma = function stripComma(data) {
        return data.replace(/[,]/g, "&#44;");
    };

    /**
     * strip carriage returns and line feeds
     * 
     * @param string
     * @returns
     */
    this.stripCRLF = function stripCRLF(data) {
        return data.replace(/[\n\r]/g, "");
    };

    /**
     * Strip non-valid characters for filename
     * 
     * @param source
     * @returns
     */
    this.stripForFilename = function stripForFilename(source) {
        var stripped_source = source.replace(/[\\]/g, "_SLASH_");
        v = stripped_source.replace(/[\-]/g, "_HYPEN_");

        return stripped_source;
    };

    this.extractOptions = function extractOptions(data) {
        var options = data.split(",");
        var settings = {};
        for ( var i = 0; i < options.length; i++) {
            var opt = options[i].trim();
            var idx = 0;
            if ((idx = opt.indexOf("=")) > 0) {
                var key = opt.substr(0, idx);
                var value = opt.substr(idx + 1);
                
                if( !isNaN(value) ) {
                    value = parseInt(value, 10);
                }

                settings[key] = value;
            }
        }

        return settings;
    };
    
    this.padWithLeadingZeros = function padWithLeadingZeros(string) {
        return new Array(5 - string.length).join("0") + string;
    };

    this.unicodeCharEscape = function unicodeCharEscape(charCode) {
        return "\\u" + Toolkit.padWithLeadingZeros(charCode.toString(16));
    };

    this.encodeEntities = function encodeEntities(string) {
        return string.split("")
                     .map(function (char) {
                        function entityCharEscape(charCode) {
                            return "&#" + charCode + ";";
                        };
                        
                         var charCode = char.charCodeAt(0);
                         return charCode > 127 ? entityCharEscape(charCode) : char;
                     })
                     .join("");
    };
};
exports.Toolkit = Toolkit;