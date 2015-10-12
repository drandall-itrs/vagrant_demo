/*!
 * Geneos End User Experience Monitoring (EUEM)
 * Copyright (c) 2012 ITRS Group Plc
 *
 */

var utils = require('utils');
var messages = geneos('messages').create();

exports.create = function create(g, options) {
    return new AssertJS(g, options);
};

/**
 * AssertJS constructor
 */
var AssertJS = function(g, options) {
    this.geneos = g;
};

/**
 * Retrieves the message of a JavaScript alert generated during the previous action, or fail if there were no alerts.
 * 
 * @param pattern
 *            the text message of a JavaScript alert to assert against
 */
AssertJS.prototype.assertAlert = function(message) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        alertmessage = geneos.alerts[0];
        if (alertmessage === message) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_ASSERT_ALERT', message, alertmessage), '', true);
        }

        geneos.alerts.remove(0);
    });
};

/**
 * Returns true if there is an alert present.
 * 
 */
AssertJS.prototype.assertAlertPresent = function(message) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        if (geneos.alerts.length > 0) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_ASSERT_ALERT_PRESENT'), '', true);
        }

        geneos.alerts.remove(0);
    });
};

/**
 * Returns true if there is no alert present.
 * 
 */
AssertJS.prototype.assertAlertNotPresent = function(message) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        if (geneos.alerts.length === 0) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_ASSERT_ALERT_NOT_PRESENT'), '', true);
        }

        geneos.alerts.remove(0);
    });
};

/**
 * Gets the absolute URL of the current page and compares it against the pattern supplied by the user.
 * 
 * @param pattern
 *            the URL to assert against, for example: http://www.google.com
 */
AssertJS.prototype.assertLocation = function(pattern) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        current_url = this.getCurrentUrl();
        if (pattern === current_url) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_ASSERT_LOCATION', pattern, current_url), '', true);
        }
    });
};

/**
 * Gets the title of the current web page and compares it against the pattern supplied
 * by the user.
 * 
 * @param pattern
 *            the text pattern to assert against, representing the title of the web page
 */
AssertJS.prototype.assertTitle = function(pattern) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        current_title = this.getTitle();
        if (pattern === current_title) {
            geneos.endStep();
        } else {
            geneos.endStep(false,  messages.getMessage('ERROR_DIFFERENT_PAGE_TITLE', pattern, current_title), '', true);
        }
    });
};

/**
 * Verifies tha the specified text pattern appears somewhere on the rendered page shown to the user.
 * Returns true if the pattern matches the text, false otherwise.
 * 
 * @param pattern
 *            the text pattern to match with the text of the page
 */
AssertJS.prototype.assertTextPresent = function(pattern) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        if (geneos.assert.doVerifyTextPresent(pattern)) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_ASSERT_TEXT_NOT_PRESENT'), '', true);
        }
    });
};

/**
 * Verifies that the specified text pattern does not appear somewhere on the rendered page
 * shown to the  user. Returns true if the pattern does not match the text, false otherwise.
 * 
 * @param pattern
 *            a text pattern to match with the text of the page
 */
AssertJS.prototype.assertTextNotPresent = function(pattern) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        if (!geneos.assert.doVerifyTextPresent(pattern)) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_ASSERT_TEXT_PRESENT'), '', true);
        }
    });
};

/**
 * true if the element is present, false otherwise Verifies that the specified
 * element is somewhere on the page.
 * 
 * @param locator
 *            is an element reference
 * @param hook
 *            is a custom function to be executed after the function
 */
AssertJS.prototype.assertElementPresent = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var passed = geneos.web.isElementExists(locator);
        if (passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_GEN_LOCATOR_NOT_FOUND', locator), '', true);
        }
    }).then(hook);

};

/**
 * true if the element is not present, false otherwise Verifies that the specified
 * element is somewhere on the page.
 * 
 * @param locator
 *            is an element reference
 * @param hook
 *            is a custom function to be executed after the function
 */
AssertJS.prototype.assertElementNotPresent = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var passed = !geneos.web.isElementExists(locator);
        if (passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_ASSERT_ELEMENT_PRESENT'), '', true);
        }
    }).then(hook);

};

/**
 * true if the checkbox is checked, false otherwise Gets whether a toggle-button
 * (checkbox/radio) is checked. Fails if the specified element doesn't exist or
 * isn't a toggle-button.
 * 
 * @param locator
 *            is an element reference pointing to a checkbox or radio button
 * @param hook
 *            is a custom function to be executed after the function
 */
AssertJS.prototype.assertChecked = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var passed = this.evaluate(function(locator) {
            var elem = webhelper.getElement(locator);
            if (elem !== null) {
                return elem.checked;
            }
        }, {
            locator : locator
        });
        if (passed === null) {
            geneos.endStep(false, messages.getMessage('ERROR_GEN_LOCATOR_NOT_FOUND', locator), '', true);
        } else if (passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_ASSERT_NOT_CHECKED'), '', true);
        }
    }).then(hook);
};

/**
 * function that checks the visibility of an element
 * 
 * @param host
 *            is the casper
 * @param locator
 *            is an element locator
 * @returns true if visible, false if not
 */
AssertJS.prototype.doCheckVisibility = function(host, locator) {
    var result =  host.evaluate(function(locator) {
        var passed = false;
        var message = "";
        var obj = webhelper.getElement(locator);
        if (obj !== null) {
            var visibility = getComputedStyle(obj).getPropertyValue('visibility');
            var display = getComputedStyle(obj).getPropertyValue('display');
            if (visibility == "hidden" || display == "none") {
                message = 'ERROR_ASSERT_NOT_VISIBLE';
            } else {
                passed = true;
            }
        } else {
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
 * Check the visibility of an element
 * 
 * @param locator
 *            is an element locator
 * @param hook
 *            is a custom function to be executed after the function
 */
AssertJS.prototype.assertVisible = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.assert.doCheckVisibility(this, locator);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message, '', true);
        }
    }).then(hook);
};

/**
 * A Function that compares the value of an element to a given value
 * 
 * @param host
 *            is the casper
 * @param locator
 *            is an element locator
 * @param value
 *            is a value to be compared to
 * @returns false and an error message when not equal
 */
AssertJS.prototype.doCompareValue = function(host, locator, value) {
    var result = host.evaluate(function(locator, value) {
        var passed = false;
        var message = [];
        
        var obj = webhelper.getElement(locator);
        if (obj !== null) {
            var elementValue = obj.value;
            
            if (obj instanceof HTMLInputElement) {
                if( obj.type === "checkbox" || obj.type === "radio" ) {
                    elementValue = obj.checked ? 'on' : 'off';
                }
            }
            
            if (elementValue == value) {
                passed = true;
            } else {
                message = ["ERROR_ASSERT_VALUE", value, elementValue];
            }
            
        } else {
            message = ['ERROR_GEN_LOCATOR_NOT_FOUND', locator]; 
        }
        
        return {
            passed : passed,
            message : message
        };
    }, {
        locator : locator,
        value : value
    });
    
    return {
        passed: result.passed,
        message: messages.getMessage(result.message)
    };
};

/**
 * Compares the value of an element
 * 
 * @param locator
 *            is an element locator
 * @param value
 *            is a value to be compared to
 * @param hook
 *            is a custom function to be executed after the function
 */
AssertJS.prototype.assertValue = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.assert.doCompareValue(this, locator, value);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message, '', true);
        }
    }).then(hook);
};

/**
 * A Function that compares the text of an element to a given text
 * 
 * @param host
 *            is the casper
 * @param locator
 *            is an element locator
 * @param value
 *            is a text to be compared to
 * @returns false and an error message when not equal
 */
AssertJS.prototype.doCompareText = function(host, locator, value) {
    var result = host.evaluate(function(locator, value) {
        var passed = false;
        var message = "";
        var obj = webhelper.getElement(locator);
        if (obj !== null) {
            var expectedText = obj.textContent.stripAll();
            if (expectedText == value) {
                passed = true;
            } else {
                message = ["ERROR_ASSERT_TEXT", value, expectedText];
            }

        } else {
            message = ['ERROR_GEN_LOCATOR_NOT_FOUND', locator];
        }
        return {
            passed : passed,
            message : message
        };
    }, {
        locator : locator,
        value : value
    });
    
    return {
        passed: result.passed,
        message: messages.getMessage(result.message)
    };
};

/**
 * Compares the text of an element to a given text pattern.
 * 
 * @param locator
 *            is an element locator
 * @param pattern
 *            is text to be compared to
 * @param hook
 *            a custom function to be executed after the function
 */
AssertJS.prototype.assertText = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.assert.doCompareText(this, locator, value);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message, '', true);
        }
    }).then(hook);
};

/**
 * Compares the text of a webpage to a given text
 * 
 * @param locator
 *            is a text to compare the body text to
 * @param hook
 *            is a custom function to be executed after the function
 */
AssertJS.prototype.assertBodyText = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var value = this.page.content;
        var passed = this.evaluate(function(locator, value) {
            return (locator == value);
        }, {
            locator : locator,
            value : value
        });
        if (passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_ASSERT_DIFFERENT_BODY_TEXT'), '', true);
        }
    }).then(hook);
};


AssertJS.prototype.verifyTextPresent = function(text) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        if (geneos.assert.doVerifyTextPresent(text)) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_ASSERT_TEXT_NOT_PRESENT'));
        }
    });
};

AssertJS.prototype.verifyTextNotPresent = function(text) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        if (!geneos.assert.doVerifyTextPresent(text)) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_ASSERT_TEXT_PRESENT'));
        }
    });
};

AssertJS.prototype.verifyTitle = function(title) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var currentTitle = this.getTitle();
        if ( currentTitle === title) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_DIFFERENT_PAGE_TITLE', title, currentTitle));
        }
    });
};

AssertJS.prototype.verifyNotTitle = function(title) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        if (this.getTitle() != title) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_SAME_PAGE_TITLE'));
        }
    });
};

/**
 * true if the element is present, false otherwise Verifies that the specified
 * element is somewhere on the page
 * 
 * @param locator
 *            is an element reference
 * @param hook
 *            is a custom function to be executed after the function
 */
AssertJS.prototype.verifyElementPresent = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var passed = geneos.web.isElementExists(locator);
        if (passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_GEN_LOCATOR_NOT_FOUND', locator));
        }
    }).then(hook);
};

/**
 * 
 * @param exp
 *            is the JavaScript snippet to run
 * @param test
 *            is the expected result
 * @param hook
 *            is a custom function to be executed after the function
 */
AssertJS.prototype.verifyEval = function(exp, test, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var passed = this.evaluate(function(exp, test) {
            if (exp == null || test == null || exp == "" || test == "")
                return false;
            return (eval(exp) == test);
        }, {
            exp : exp,
            test : test
        });
        
        if (passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_INVALID_EVAL_CODE'));
        }
    }).then(hook);

};

/**
 * Verifies the expression
 * 
 * @param exp
 *            is the value to verify
 * @param value
 *            is the expected result
 * @param hook
 *            is a custom function to be executed after the function
 */
AssertJS.prototype.verifyExpression = function(exp, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var passed = this.evaluate(function(exp, value) {
            if (exp == null || value == null)
                return false;
            return (exp == value);
        }, {
            exp : exp,
            value : value
        });
        if (passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_INVALID_EXPRESSION'));
        }
    }).then(hook);
};

/**
 * Compares the value parameter with the text of an element. This works for any
 * element that contains text.
 * 
 * @param locator
 *            is an element reference
 * @param value
 *            is the text of the element
 * @param hook
 *            is a custom function to be executed after the function
 */
AssertJS.prototype.verifyText = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.assert.doCompareText(this, locator, value);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message);
        }
    }).then(hook);
};

/**
 * Compares the element value, or "on/off" for checkbox/radio elements
 * 
 * @param locator
 *            is an element locator
 * @param value
 *            is a value to be compared to
 * @param hook
 *            is a custom function to be executed after the function
 */
AssertJS.prototype.verifyValue = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.assert.doCompareValue(this, locator, value);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message);
        }
    }).then(hook);
};

/**
 * Checks the visibility of an element
 * 
 * @param locator
 *            is an element locator
 * @param hook
 *            is a custom function to be executed after the function
 */
AssertJS.prototype.verifyVisible = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.assert.doCheckVisibility(this, locator);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message);
        }
    }).then(hook);
};

/**
 * Verify/Assert Selection/s
 *
 * @param selectionType     mode of selection; allowed types are value, text (for labels), id, index
 * @param hardAssert        true if assertion and false if verify
 * @param allowMultiple     true if allow multiple selected items, and false otherwise, if false and selection contains 
 *                          selection of of multiple items, it will fail the step and generate corresponding error message.
 * @param locator           element locator
 * @param pattern           pattern of string to compare to selected items
 */
AssertJS.prototype.verifySelection = function(selectionType, hardAssert, allowMultiple, locator, pattern, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        if( geneos.web.isElementExists(locator) ) {
            var selections = geneos.assert.getSelections(this, locator, selectionType);
            if(selections === false) {
                geneos.endStep(false,
                    messages.getMessage('ERROR_NOT_SELECT_ELEMENT'), '', hardAssert);
            } else if(!allowMultiple && (selections.length > 1)) {
                geneos.endStep(false, 
                    messages.getMessage('ERROR_SELECTED_IS_MORE_THAN_ONE'), '', hardAssert);
            } else {
                var selectedValue = selections.join(',');
                if (pattern === selectedValue) {
                    geneos.endStep();
                } else {
                    geneos.endStep(false, 
                        messages.getMessage('ERROR_SELECTED_NOT_MATCH', selectedValue, pattern), 
                        '', hardAssert);
                }
            }
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_GEN_LOCATOR_NOT_FOUND', locator), '', hardAssert);
        }
    }).then(hook);
};

/**
 * Get Selections by Type
 * @returns 
 */
AssertJS.prototype.getSelections = function(host, locator, selectionType) {           
    var selections = host.evaluate(function(locator, selectionType) {
        var obj = webhelper.getElement(locator);
        var selections = [];
        if (obj !== null) {
            if (obj instanceof HTMLSelectElement) {
                for (var i = 0; i < obj.options.length; i++) {
                    if (obj.options[i].selected)
                    {
                        var value = obj.options[i][selectionType];
                        selections.push(value);
                    }
                }
            } else {
                return false;
            }
        } 
        return selections;
    }, {
        locator : locator,
        selectionType : selectionType
    });
    
    return selections;
};

// ------------------------------------------------------------------
AssertJS.prototype.doVerifyTextPresent = function(text) {
    var isInPlainText =  this.geneos.casper.page.plainText.match(text) !== null;
    if(!isInPlainText) {
        return this.geneos.casper.page.content.match(text) !== null;
    }
    
    return true;
};

exports.AssertJS = AssertJS;
