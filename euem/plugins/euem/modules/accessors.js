/*!
 * Geneos End User Experience Monitoring (EUEM)
 * Copyright (c) 2012 ITRS Group Plc
 *
 */

var utils = require('utils');
var messages = geneos('messages').create();

exports.create = function create(g, options) {
    return new AccessorJS(g, options);
};
/**
 * AccessorJS constructor
 */
var AccessorJS = function(g, options) {
    this.geneos = g;
};

AccessorJS.prototype.storeVariable = function(value, name) {
    geneos.result.variables.user[name] = value;
};

AccessorJS.prototype.getVariable = function(name) {
    value = this.geneos.result.variables.user[name];
};

AccessorJS.prototype.store = function(name, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        geneos.accessors.storeVariable(name, value);
        geneos.endStep();
    }).then(hook);
};

AccessorJS.prototype.storeLocation = function(name, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        loc = this.getCurrentUrl();
        geneos.accessors.storeVariable(loc, name);
        geneos.endStep();
    }).then(hook);
};

AccessorJS.prototype.storeHtmlSource = function(name, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        text = this.evaluate(function() {
            return document.querySelector('html').innerHTML;
        });

        geneos.accessors.storeVariable(text, name);
        geneos.endStep();
    }).then(hook);
};

AccessorJS.prototype.storeTitle = function(name, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        title = this.getTitle();
        geneos.accessors.storeVariable(title, name);
        geneos.endStep();
    }).then(hook);
};

AccessorJS.prototype.storeBodyText = function(name, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        pagecontent = geneos.accessors.getBodyText();
        geneos.accessors.storeVariable(pagecontent, name);
        geneos.endStep();
    }).then(hook);
};

AccessorJS.prototype.getBodyText = function() {
    return this.geneos.casper.page.content;
};

AccessorJS.prototype.storeAllLinks = function(name, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        links = this.evaluate(function() {
            var links = document.querySelectorAll('a');
            return Array.prototype.map.call(links, function(e) {
                return e.getAttribute('id');
            });
        });

        geneos.accessors.storeVariable(links, name);
        geneos.endStep();
    }).then(hook);
};

AccessorJS.prototype.storeAllFields = function(name, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        fields = this.evaluate(function() {
            var fields = document.querySelectorAll('input');
            return Array.prototype.map.call(fields, function(e) {
                return e.getAttribute('id');
            });
        });

        geneos.accessors.storeVariable(fields, name);
        geneos.endStep();
    }).then(hook);
};

AccessorJS.prototype.storeAllButtons = function(name, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        fields = this.evaluate(function() {
            var fields = document.querySelectorAll('button');
            return Array.prototype.map.call(fields, function(e) {
                return e.getAttribute('id');
            });
        });

        geneos.accessors.storeVariable(fields, name);
        geneos.endStep();
    }).then(hook);
};

AccessorJS.prototype.storeTextPresent = function(name, pattern, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        ispresent = geneos.assert.doVerifyTextPresent(pattern);
        geneos.accessors.storeVariable(ispresent, name);
        geneos.endStep();
    }).then(hook);
};

AccessorJS.prototype.storeText = function(locator, name, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var data = this.evaluate(function(locator) {
            var elem = webhelper.getElement(locator);
            if (elem === undefined || elem === null) {
                return elem;
            } else {
                var textdata = elem.innerText;
                return textdata;
            }
        }, {
            locator : locator
        });
        
        if(data) {
            geneos.accessors.storeVariable(data, name);
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_GEN_LOCATOR_NOT_FOUND', locator));
        }
        
    }).then(hook);
};
/**
 * Determines whether some option in a drop-down menu is selected. True if some
 * option has been selected, false otherwise
 * 
 * @param locator -
 *            an element locator identifying a drop-down menu
 * @param varName -
 *            name of variable
 * @param hook -
 *            a custom function to be executed after the function
 */
AccessorJS.prototype.storeSomethingSelected = function(locator, varName, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var selection = this.evaluate(function(locator) {
            var elem = webhelper.getElement(locator);
            if (elem == undefined || elem == null) {
                return false;
            }
            /*if (elem.selectedIndex == null)
                return false;
            return true;*/
            return elem.selectedIndex;
        }, {
            locator : locator
        });

        if(!selection) {
            geneos.endStep(false, messages.getMessage('ERROR_GEN_LOCATOR_NOT_FOUND', locator));
        } else {
            geneos.accessors.storeVariable(selection > -1, varName);
            geneos.endStep();
        }
    });
};
/**
 * Stores the text from a cell of a table. The cellAddress syntax
 * tableLocator.row.column, where row and column start at 0.
 * 
 * @param locator -
 *            a cell address, e.g. "foo.1.4"
 * @param varName -
 *            name of variable
 * @param hook -
 *            an instance of casperjs
 */
AccessorJS.prototype.storeTable = function(locator, varName, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var array = locator.split('.');

        var text = this.evaluate(function(locator, r, c) {
            var elem = webhelper.getElement(locator);
            if (elem == undefined || elem == null) {
                return 'ELEMENT NOT FOUND';
            }

            var cell = elem.rows[r].cells[c];
            return cell.firstChild.data;
        }, {
            locator : array[0],
            r : array[1],
            c : array[2]
        });

        if (text == 'ELEMENT NOT FOUND') {
            geneos.endStep(false, messages.getMessage('ERROR_GEN_LOCATOR_NOT_FOUND', locator));
        } else if (text == null) {
            geneos.endStep(false, messages.getMessage('ERROR_TEXT_IS_NULL'));
        } else {
            geneos.accessors.storeVariable(text, varName);
            geneos.endStep();
        }
    });
};
/**
 * helper function to the check related actions
 * 
 * @param host
 *            is an instance of casperjs
 * @param locator
 *            is an element reference
 * @returns if element is checkbox or not
 */
AccessorJS.prototype.isChecked = function(host, locator) {

    var result = host.evaluate(function(locator) {
        var message = "";
        var passed;
        var elem = webhelper.getElement(locator);

        if (elem !== null) {
            if (elem.checked)
                passed = true;
            else if (elem.checked == false)
                passed = false;
            else {
                passed = false;
                message = 'ERROR_NOT_CHECKBOX_RADIO';
            }
        } else {
            passed = false;
            message = ['ERROR_GEN_LOCATOR_NOT_FOUND', locator];
        }

        return {
            passed : passed,
            message : message
        };
    }, {
        locator : locator
    });
    
    return {
        passed: result.passed,
        message: messages.getMessage(result.message)
    };
};
/**
 * Stores whether a toggle-button (checkbox/radio) is checked. Fails if the
 * specified element doesn't exist or isn't a toggle-button.
 * 
 * @param locator
 *            is a reference pointing to a checkbox or radio button
 * @param varName
 *            is a variable name
 * @param hook
 *            is a custom function to run after the function
 */
AccessorJS.prototype.storeChecked = function(locator, varName, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        
        if( geneos.web.isElementExists(locator) ){
            var result = geneos.accessors.isChecked(this, locator);
            if (result.passed !== null) {
                geneos.accessors.storeVariable(result.passed, varName);
                geneos.endStep();
            } else {
                geneos.endStep(false, result.message);
            }
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_GEN_LOCATOR_NOT_FOUND', locator));
        }
        
    }).then(hook);
};

/**
 * Stores true if the element is present, false otherwise Verifies that the
 * specified element is somewhere on the page.
 * 
 * @param locator
 *            is an element reference
 * @param varName
 *            is a variable name
 * @param hook
 *            is a custom function to be executed after the function
 */
AccessorJS.prototype.storeElementPresent = function(locator, varName, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var passed = geneos.web.isElementExists(locator);
        geneos.accessors.storeVariable(passed, varName);
        
        if (passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_GEN_LOCATOR_NOT_FOUND', locator));
        }
        
    }).then(hook);
};

/**
 * Stores the element's value, or "on/off" for checkbox/radio elements
 * 
 * @param locator
 *            is an element reference
 * @param varName
 *            is a variable name
 * @param hook
 *            is a custom function to be executed after the function
 */
AccessorJS.prototype.storeValue = function(locator, varName, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        if( geneos.web.isElementExists(locator) ){
        
            var value = this.evaluate(function(locator) {
                var elem = webhelper.getElement(locator);
                var val = elem.value;
                
                if (elem instanceof HTMLInputElement) {
                    var type = elem.getAttribute('type');
                    switch(type.toLowerCase()) {
                        case "checkbox":
                        case "radio":
                            val = elem.checked ? 'ON' : 'OFF';
                            break;
                    }
                }
                
                return val;
            }, {
                locator : locator
            });
            
            geneos.accessors.storeVariable(value, varName);
            geneos.endStep();
            
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_GEN_LOCATOR_NOT_FOUND', locator));
        }
    }).then(hook);

};
/**
 * Stores the expression in the first parameter into a variable
 * 
 * @param exp
 *            is the value to return
 * @param value
 *            is the variable name
 * @param hook
 *            is a custom function to be executed after the function
 */
AccessorJS.prototype.storeExpression = function(exp, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var passed = true;
        if (exp == null) {
            passed = false;
        }
        if (value == null || value == "")
            passed = false;
        try {
            geneos.accessors.storeVariable(exp, value);
        } catch (err) {
            passed = false;
        }
        if (passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_INVALID_EXPRESSION'));
        }
    }, {
        exp : exp,
        value : value
    }).then(hook);

};
/**
 * Gets the value of an element attribute.
 * 
 * @param locator
 * is an element reference followed by an @ sign and then the name of the
 *            attribute, e.g. "foo@bar" where "foo" is the element reference and
 *            "bar" is the attribute
 * @param value
 *            is the name of a variable
 * @param hook
 *            is a custom function to be executed after the function
 */
AccessorJS.prototype.storeAttribute = function(locator, value, hook) {
    this.geneos.casper.then(
            function() {
                geneos.startStep();
                var array = locator.split('@');
                
                if( geneos.web.isElementExists(array[0]) ){
                    var attrValue = this.evaluate(function(locator, attributeName) {
                        var elem = webhelper.getElement(locator);
                        return elem.getAttribute(attributeName);
                    }, {
                        locator : array[0],
                        attributeName: array[1]
                    });
                    
                    if( null === attrValue || '' === attrValue) {
                        geneos.endStep(false, messages.getMessage('ERROR_ASSERT_ATTRIBUTE_NOT_EXISTS'));
                    } else {
                        geneos.accessors.storeVariable(attrValue, value);
                        geneos.endStep();
                    }
                } else {
                    geneos.endStep(false, messages.getMessage('ERROR_GEN_LOCATOR_NOT_FOUND', array[0]));
                }
                
            }).then(hook);

};
/**
 * Stores the result of evaluating the specified JavaScript snippet
 * 
 * @param script
 *            is the JavaScript snippet to run
 * @param varName
 *            is the name of a variable
 * @param hook
 *            is a custom function to be executed after the function
 */
AccessorJS.prototype.storeEval = function(script, varName, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var passed = true;
        try {
            geneos.accessors.storeVariable(eval(script), varName);
        } catch (err) {
            passed = false;
        }
        if (passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_INVALID_EVAL_CODE'));
        }
    }).then(hook);

};

exports.AccessorJS = AccessorJS;
