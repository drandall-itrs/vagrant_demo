 /*
  * Copyright 2012 ITRS Group Plc
  *
  * Javascript Prototype Hooks on Known Types
  * --------------------------------------------------------------
  * Hooks for:
  * 	String Object
  * 	Date Object
  * --------------------------------------------------------------
  */

/**
 * Date Prototype for Formatting ISO Date String
 */ 
if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function () {
        function pad(n) { return n < 10 ? '0' + n : n; }
        function ms(n) { return n < 10 ? '00'+ n : n < 100 ? '0' + n : n; }
        return this.getUTCFullYear() + '-' +
            pad(this.getUTCMonth() + 1) + '-' +
            pad(this.getUTCDate()) + 'T' +
            pad(this.getUTCHours()) + ':' +
            pad(this.getUTCMinutes()) + ':' +
            pad(this.getUTCSeconds()) + '.' +
            ms(this.getUTCMilliseconds()) + 'Z';
    };
}

if (!Date.prototype.toFileTypeString) {
    Date.prototype.toFileTypeString = function () {
        function pad(n) { return n < 10 ? '0' + n : n; }
        function ms(n) { return n < 10 ? '00'+ n : n < 100 ? '0' + n : n; }
        return this.getUTCFullYear() + '_' +
            pad(this.getUTCMonth() + 1) + '_' +
            pad(this.getUTCDate()) + 'T' +
            pad(this.getUTCHours()) + '_' +
            pad(this.getUTCMinutes()) + '_' +
            pad(this.getUTCSeconds()) + '_' +
            ms(this.getUTCMilliseconds()) + 'Z';
    };
}

/**
 * Pad with Zeros
 */
Number.prototype.padZero = function(length) {
    var str = '' + this;
    while (str.length < length) {
        str = '0' + str;
    }
   
    return str;
};

Number.prototype.format = function(type, format) {
	if (typeof type !== 'string') {return '';}
	
	if(type == "time") {
		return this.formatDuration();
	} else if(type == "data") {
		return this.formatDataSize();
	} else {
		return this.toFixed(3);
	}
};

/**
 * Formats numeric into data size String formats
 * @returns {String}
 */
Number.prototype.formatDataSize = function() {
	dataSize = this;
	
	if( dataSize >= 0 ) {
	    interval = Math.floor(dataSize / 1073741824);
	    if (interval >= 1){
	        dataSize = dataSize / 1073741824; 
	        return dataSize.toFixed(2) + " GB";
	    } 

	    interval = Math.floor(dataSize / 1048576);
	    if (interval >= 1){
	        dataSize = dataSize / 1048576; 
	        return dataSize.toFixed(2) + " MB";
	    } 
	    
	    return (dataSize / 1024).toFixed(2) + " kb";
	}
	
	return "";
};

Number.prototype.formatDuration = function() {
	var duration = "";
	seconds = this;
	
	if( seconds >=0  ) {
    	seconds = seconds / 1000;
       	duration = duration + " " + seconds.toFixed(3) + " s";
	}
	
    return duration.trim();
};

/**
 * Check if certain string is at the beginning of search string
 */
if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(str) {
		return (this.match("^"+str)==str);
	};
}

/**
 * Removes all trailing spaces
 */
if (!String.prototype.trim) {
	String.prototype.trim = function(){
		return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, ""));
	};
}

/**
 * Strip all 
 */
if (!String.prototype.stripAll) {
	String.prototype.stripAll = function(characters, separator, trim) {
        var str = this;
        
        // set defaults
        characters = (characters === undefined) ? ['\n'] : characters;
        separator = (separator === undefined) ? ' ' : separator;
        trim = (trim === undefined) ? true : trim;
    
        if(trim) {
            str = str.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, "");
        }
        
        for(i = 0; i < characters.length; i++ ) {
            if( str.indexOf(characters[i]) > 0 ) {
                var charSplit = str.split(characters[i]);
                
                if(trim) {
                    for(j = 0; j < charSplit.length; j++ ) {
                        charSplit[j] = charSplit[j].replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, "");
                    }
                }
                
                str = charSplit.join(separator);
            }
        }
        
        return str;
    };
}

/**
 * Check if the certain string is ending of the search string 
 */
if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(str) {
		return (this.match(str+"$")==str);
	};
}


//Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
