(function(exports) {
    exports.create = function() {
        return new WebHelper();
    };

    /**
     * Web Content Helper Utilities
     */
    WebHelper = function() {

        /**
         * Performs open Windows
         * @param url
         * @param name
         */
        this.openWindow = function(url, name) {
        };

        /**
         * Search for web element and return instance based on locator strategy
         *
         * @param  String  locator based on Selenium locator reference
         * @return DOM Element
         */
        this.getElement = function(locator) {
            var xpathQuery = null;

            // locate by link via xpath
            if (this.startsWith(locator, "link=")) {
                locator = "//a[contains(text(),'" + locator.substr(5) + "')]";
            }

            // locate by css selector
            if (this.startsWith(locator, "css=")) {
                var locstring = locator.substr(4);
                locstring = this.trim(locstring);
                if (this.endsWith(locstring, ".")) {
                    locstring = locstring.substr(0, locstring.length - 2);
                }

                return document.querySelector(locstring);
            }

            // locate by id selector
            if (this.startsWith(locator, "id=")) {
                // return document.querySelector(locator.substr(3));
                return document.getElementById(locator.substr(3));
            }

            // locate by element name
            if (this.startsWith(locator, "name=")) {
                var name = locator.substr(5);
                var elements = document.getElementsByTagName("*");
                var selectedElements = [];
                for ( var i = 0; i < elements.length; i++) {
                    if (elements[i].name == name) {
                        selectedElements.push(elements[i]);
                    }
                }
                return selectedElements[0];
            }

            // locate by tag
            if (this.startsWith(locator, "tag=")) {
                var elements = document.getElementsByTagName(locator.substr(4));
                if (elements.length != 0) {
                    return elements[0];
                }

                return null;
            }

            // locate by document object
            if (this.startsWith(locator, "document.")) {
                eval("var elem = " + locator);
                return elem;
            }

            // locate by xpath
            if (this.startsWith(locator, "//") || this.startsWith(locator, 'xpath=')) {

                if (this.startsWith(locator, 'xpath=')) {
                    locator = locator.substr(6);
                }

                xpathQuery = locator;

                // var iterator = document.evaluate(xpathQuery, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                // var node = iterator.iterateNext();
                var node = document.evaluate(xpathQuery, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                return node;
            }

            return null;
        };

        /**
         * Locate element by traversing all element and comparing
         * element name 
         * @param name
         * @returns
         */
        this.locateByName = function(name) {
            var elements = document.getElementsByTagName("*");
            var selectedElements = [];
            for ( var i = 0; i < elements.length; i++) {
                if (elements[i].name === name) {
                    selectedElements.push(elements[i]);
                }
            }
            return selectedElements[0];
        };

        /**
         * Returns true if the source string starts with the value in str
         */
        this.startsWith = function(source, str) {
            return (source.match("^" + str) == str);
        };

        /**
         * Returns true if the source string ends with the value in str
         */
        this.endsWith = function(source, str) {
            return (source.match(str + "$") == str);
        };

        /**
         * Returns trimmed string
         */
        this.trim = function(source) {
            return (source.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, ""));
        };

        /** 
         * Returns true if the object passed is undefined or not an instance of object
         * @param obj
         * @returns {Boolean}
         */
        this.isUndefined = function(obj) {
            return (typeof obj != "object");
        };

        /**
         * Returns String instance listing all of the object properties
         * @param obj
         * @returns {String}
         */
        this.toPropertyString = function(obj) {
            var str = '';
            for ( var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    str += p + '::' + obj[p] + '\n';
                }
            }

            str += 'instanceof::' + this.getInstanceType(obj) + '\n';
            return str;
        };

        /**
         * Returns the instance type of the object
         * 
         * @param obj
         * @returns String 
         */
        this.getInstanceType = function(obj) {
            if (obj === null)
                return "[object Null]";
            return Object.prototype.toString.call(obj);
        };
    };
    
    exports.WebHelper = WebHelper;
    exports.webhelper = new exports.WebHelper();
})(typeof exports === "object" ? exports : window);
