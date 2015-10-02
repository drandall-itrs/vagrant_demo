/*
 * Copyright 2012 ITRS Group Plc
 *
 * WebJS Object
 * Web Actions Library for Geneos EUEM
 * Performs web related actions, most of these are wrapped CasperJS
 * and PhantomJS actions, which are defined Selenium actions.
 * --------------------------------------------------------------
 * Requires: CasperJS, PhantomJS FS 
 * --------------------------------------------------------------
 */

var fs = require('fs');
var utils = require('utils');
var logger = geneos('logger').create();
var toolkit = geneos('toolkit').create();
var handler = geneos('mimehtml').create();
var messages = geneos('messages').create();

exports.create = function create(g, options) {
    return new WebJS(g, options);
};

/**
 * WebJS constructor
 */
var WebJS = function(g, options) {
    this.geneos = g;

};

WebJS.prototype.doMouseEvent = function(host, mouseEventType, locator) {
    return host.evaluate(function(eventType, locator) {
        return webhelper.doMouseEvent(eventType, locator);
    }, {
        eventType: mouseEventType,
        locator : locator
    });
};

/**
 * @param locator   an element locator
 */
WebJS.prototype.mouseMove = function(locator) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        
        var result = geneos.web.doMouseEvent(this, 'mousemove', locator);
        if( result ) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_MOUSE_MOVE_FAILED'));
        }
    });
};

/**
 * @param locator   an element locator
 */
WebJS.prototype.mouseOver = function(locator) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        
        var result = geneos.web.doMouseEvent(this, 'mouseover', locator);
        if( result ) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_MOUSE_OVER_FAILED'));
        }
    });
};

/**
 * Save current page as MHT format
 *
 * @param locator   an element locator
 * @param value     value to be generated as key press event
 */
WebJS.prototype.saveAsMHT = function(savepath) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var fullPath = geneos.current_output_folder + "/" + savepath;
        
        var location = this.getCurrentUrl();
		var har = geneos.createHar(location, this.getTitle());
                
        handler.save(this, fullPath, 
                     this.page.content, 
                     har);
        
        if (fs.exists(fullPath)) {
            captureSize = fs.size(fullPath);
            geneos.updateStepDownloadSize(captureSize);
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_SAVE_AS_MHT_FAILED'));
        }
    });
};

/**
 * Set focus on the locator element then simulates keypress using the value specified.
 * 
 * @param host      instance of casperjs
 * @param locator   reference to an element that must gain focus
 * @param value     key value to perform or simulate
 * */
WebJS.prototype.doKeyPress = function(host, locator, value) {
    var result = geneos.web.doFocus(host, locator);
    if( result.passed ) {
        // resolve special escaped values
        value = value.replace(/\\b/g, "\b")
                     .replace(/\\t/g, "\t")
                     .replace(/\\n/g, "\n")
                     .replace(/\\033/g, "\033");
        
        var listOfKeys = value.split('');
        for(i=0;i<listOfKeys.length;i++) {
            var charCode = listOfKeys[i].charCodeAt(0);
            switch(charCode) {
                case 8:  
                    host.page.sendEvent('keypress', host.page.event.key.Backspace); 
                    break;
                case 9:  
                    host.page.sendEvent('keypress', host.page.event.key.Tab); 
                    break;
                case 13: 
                    host.page.sendEvent('keypress', host.page.event.key.Enter); 
                    break;
                case 27: 
                    host.page.sendEvent('keypress', host.page.event.key.Escape); 
                    break;
                default:
                    host.page.sendEvent('keypress', String.fromCharCode(charCode));
            }
            
        }
        
        return {
          passed: true,
          message: ''
        };            
    } else {
        return result;    
    }
};

/**
 * Perform focus and simulate keypress. Support for Selenium sendKeys and typeKeys.
 *
 * @param locator   an element locator
 * @param value     value to be generated as key press event
 */
WebJS.prototype.sendKeys = function(locator, value) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        
        var result = geneos.web.doKeyPress(this, locator, value);
        if( result.passed ) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message);
        }
    });
};

/**
 * Perform focus and simulate keypress. Support for Selenium sendKeys and typeKeys. 
 * This waits for the locator to exists until timed out.  
 *
 * @param locator   an element locator
 * @param value     value to be generated as key press event
 */
WebJS.prototype.sendKeysAndWait = function(locator, value) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        this.waitFor(function() {
            var result = geneos.web.doKeyPress(this, locator, value);
            return result.passed;
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });

    }).then(hook);
};


/**
 * Echo message 
 * 
 * @message message to be echo, may contain access to users and system variables
 * @hook custom function to be executed after the step
 */
WebJS.prototype.echo = function(message, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        
        var users_variables = geneos.result.variables.user;
        for(var ukey in users_variables){
            var attrName = ukey;
            var attrValue = users_variables[ukey];
            
            var ure = new RegExp("\\${" + attrName + "}","g");
            message = message.replace(ure, attrValue);
        }
        
        var sys_variables = geneos.result.variables.system;
        for(var skey in sys_variables){
            var attrName = skey;
            var attrValue = sys_variables[skey];
            
            var sre = new RegExp("\\${system." + attrName + "}","g");
            message = message.replace(sre, attrValue);
        }
        
        geneos.endStep(true, "", message);
    });
};

/**
 * Pause execution for a given milliseconds
 * 
 * @durationMS pause duration in milliseconds
 * @hook custom function to be executed after the step
 */
WebJS.prototype.pause = function(durationMS, hook) {
    this.geneos.casper.then(function() {
        logger.debug("Pause execution for " + durationMS + "...");
        geneos.startStep();
        
        this.waitFor(function() {
            return this.wait(durationMS, function() {
                return true;
            });
        }, function() {
            geneos.endStep();
        }, function() {
           var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    });
};

/**
 * Set page viewport of the browser's window
 * 
 * @param width
 * @param height
 * @param hook
 */
WebJS.prototype.setViewport = function(options, hook) {
    var opt = toolkit.extractOptions(options);
    if( !("width" in opt) ) {
        opt.width = 1400;
    } 
    
    if( !("height" in opt) ) {
        opt.height = 1300;
    }
    
    this.geneos.casper.then(function() {
        geneos.startStep();
        this.viewport(opt.width, opt.height);
        geneos.endStep();
    });
};

/**
 * Reload current page
 * 
 * @hook custom function to be executed after the step
 */
WebJS.prototype.refresh = function(hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        this.evaluate(function() {
            window.location.reload();
        });
        geneos.endStep();
    });
};

/**
 * Moves back a step in page navigation history
 * 
 * @hook custom function to be executed after the step
 */
WebJS.prototype.goBack = function(hook) {
    this.geneos.casper.then(function() {
        logger.debug("Move back a step...");
        geneos.startStep();
        this.back();
        geneos.endStep();
    });
};

/**
 * Moves back a step in page navigation history (waits until step is completed)
 * 
 * @hook custom function to be executed after the step
 */
WebJS.prototype.goBackAndWait = function(hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        this.waitFor(function() {
            return this.back();
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};

/**
 * Downloads a file from a given URL, the download file must follow the rules on
 * cross domain file scripting
 * 
 * @hook custom function to be executed after the step
 */
WebJS.prototype.downloadFile = function(urllocation, filename, hook) {
    this.geneos.casper.then(function() {
        logger.debug("Downloading " + filename + " from " + urllocation + "...");
        geneos.startStep();
        
        try {
            var savePath = geneos.current_output_folder + "/" + filename;
            
            this.download(urllocation, savePath);
            if (fs.exists(savePath)) {
                downloadSize = fs.size(savePath);
                geneos.updateStepDownloadSize(downloadSize);
            }
            geneos.endStep();
        } catch (e) {
            geneos.endStep(false, messages.getMessage('ERROR_FILE_DOWNLOAD_FAILED'));
        }
    });
};

/**
 * Opens a URL
 * 
 * @location url of the target page
 * @hook custom function to be executed after the step
 */
WebJS.prototype.open = function(location, hook) {
    instance = this;
    this.geneos.casper.then(function() {
        geneos.resetPerformanceResult();
        geneos.startStep();
        
        var openTimeoutFunc = setTimeout(function(host) {

            host.open(location).then(function() {
                if (!host.openPageLoadFailed) {
                    logger.debug("Open completed successfully. (" + location + ")");

                    var responseCode = 200;
                    var step = instance.result.steps[instance.current_step_index - 1];
                    if ("response" in step) {
                        var resp = step.response;
                        if ("start" in resp) {
                            responseCode = resp.start.status;
                        }
                    }

                    if (responseCode < 400) {
                        geneos.endStep();
                    } else {
                        var httpErrorMessage = messages.getHTTPErrorMessage(responseCode);
                        geneos.endStep(false, httpErrorMessage);
                        logger.error(httpErrorMessage);


                        geneos.saveResults(instance);
                        host.exit(0);
                    }
                }
            });
            
        }, 100, this);
        
        var timeout = this.timeout ? this.timeout : this.defaultWaitTimeout;
        
        this.waitFor(function() {
            return ((!this.pageLoadStarted) && this.newPageLoaded);
        }, function() {
            
        }, function() {
            clearTimeout(openTimeoutFunc);
            logger.debug("Loading State: " + this.loadInProgress);
            if (this.loadInProgress) {
                var defTimeout = this.defaultWaitTimeout * 1;
                geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
                logger.error(messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
                geneos.saveResults(instance);
                this.exit(0);
            } else {
                geneos.endStep();
            }
        }, timeout - 100);
        
    });
};

/**
 * Opens URL with basic authentication
 * 
 * @location url of the target page
 * @auth authentication details. should be in {username}={password} format.
 *       Example: admin=password
 * @hook custom function to be executed after the step
 */
WebJS.prototype.openWithAuthentication = function(location, auth, hook) {
    var credentials = auth.split(":");
    instance = this;
    this.geneos.casper.then(function() {
        geneos.startStep();

        this.setHttpAuth(credentials[0], credentials[1]);
        var loadTimeoutFunc = setTimeout(function(host) {
            logger.debug("Sending authentication " + auth + " to " + location + "...");
            host.open(location).then(function() {
                logger.info("Login successful!");
            });
        }, 1000, this);

        // make timeout double than the regular timeout length
        var timeout = (this.timeout ? this.timeout : this.defaultWaitTimeout) * 2;

        this.authLoadFinished = false;
        this.waitFor(function() {
            return this.authLoadFinished;
        }, function() {
            logger.debug("Authentication successful!");
            geneos.endStep();
        }, function() {
            clearTimeout(loadTimeoutFunc);
            logger.debug("Loading State: " + this.loadInProgress);
            if (this.loadInProgress) {
                // endless wait for authentication;
                // needs to terminate
                geneos.endStep(false, messages.getMessage('ERROR_LOGIN_TIMED_OUT'));
                logger.error(messages.getMessage('ERROR_LOGIN_TIMED_OUT'));
                geneos.saveResults(instance);
                this.exit(0);
            } else {
                geneos.endStep();
            }
        }, timeout);
    });
};

WebJS.prototype.doSelectFrame = function(host, target) {
    var win = this.currentWindow;

    var found = host.evaluate(function(win, target) {
        var found = false;
        if (win && win.frames && win.frames.length) {
            for ( var i = 0; i < win.frames.length; i++) {
                if (win.frames[i].name == target) {
                    // this.currentWindow = win.frames[i];
                    webhelper.currentWindow = win.frames[i];
                    webhelper.currentDocument = win.frames[i].document;
                    webhelper.frameActive = true;
                    // this.frameActive = true;
                    found = true;
                    break;
                }
            }
        } else {
            found = false;
        }

        return found;
    }, {
        win : win,
        target : target
    });

    return found;
};

WebJS.prototype.selectFrame2 = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        // console.log("~~~~~~~~~~~~~~ " + geneos.web.framePath);
        var newPath = this.evaluate(function(locator) {
            return webhelper.selectFrame(locator, this);
        }, {
            locator : locator
        });

        if (newPath) {
            geneos.web.framePath = newPath;
            geneos.endStep();
            // console.log(" +++++++++++++++++ " + newPath);
        } else {
            geneos.endStep(false, 'Failed to select target frame (' + locator + ').');
        }
    }).then(hook);
};

WebJS.prototype.doType = function(host, locator, value) {
    return host.evaluate(function(locator, value) {
        var obj = webhelper.getElement(locator);

        if (obj !== null) {
            if (obj instanceof HTMLInputElement) {
                obj.value = value;
                return true;
            } 

            if (obj instanceof HTMLTextAreaElement) {
                obj.value = value;
                return true;
            }
            
            return false;
        } else {
            return false;
        }
    }, {
        locator : locator,
        value : value
    });
};

WebJS.prototype.type = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        var result = geneos.web.doType(this, locator, value);
        
        if (result) {
            geneos.web.doSetCursorPosition(this, locator, -1);
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_TYPE_FAILED'));
        }
    }).then(hook);
};

WebJS.prototype.findElement = function(locator) {
    return __utils__.findOne(locator);
};

/**
 * Performs checking of checkbox or radio button
 * 
 * @param host
 *            instance of CapserJS
 * @param locator
 * @returns
 */
WebJS.prototype.doCheck = function(host, locator) {
    var result = host.evaluate(function(locator) {
        var actionResult = false;
        var message = "";
        var obj = webhelper.getElement(locator);

        if (obj !== null) {
            obj.setAttribute('checked', true);

            if (obj.hasAttribute('checked')) {
                var currentState = obj.getAttribute('checked');
                if (currentState == "true") {
                    actionResult = true;
                } else {
                    message = 'ERROR_CHECK_FAILED';
                }
            } else {
                message = 'ERROR_NOT_CHECKBOX_RADIO';
            }
        } else {
            message = ['ERROR_GEN_LOCATOR_NOT_FOUND', locator];
        }

        return {
            passed : actionResult,
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
 * 
 * @param locator
 * @param hook
 */
WebJS.prototype.check = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        var result = geneos.web.doCheck(this, locator);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message);
        }
    }).then(hook);
};

/**
 * 
 * @param locator
 * @param hook
 */
WebJS.prototype.checkAndWait = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        this.waitFor(function() {
            var result = geneos.web.doCheck(this, locator);
            return result.passed;
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });

    }).then(hook);
};

/**
 * Performs unchecking of checkbox or radio button
 * 
 * @param host
 *            instance of CapserJS
 * @param locator
 * @returns
 */
WebJS.prototype.doUncheck = function(host, locator) {
    var result = host.evaluate(function(locator) {
        var actionResult = false;
        var message = "";
        var obj = webhelper.getElement(locator);

        if (obj !== null) {
            obj.removeAttribute('checked');

            if (!obj.hasAttribute('checked')) {
                actionResult = true;
            } else {
                message = 'ERROR_UNCHECK_FAILED';
            }
        } else {
            message = ['ERROR_GEN_LOCATOR_NOT_FOUND', locator];
        }

        return {
            passed : actionResult,
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
 * 
 * @param locator
 * @param hook
 */
WebJS.prototype.uncheck = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        var result = geneos.web.doUncheck(this, locator);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message);
        }
    }).then(hook);
};

/**
 * 
 * @param locator
 * @param hook
 */
WebJS.prototype.uncheckAndWait = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        this.waitFor(function() {
            var result = geneos.web.doUncheck(this, locator);
            return result.passed;
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });

    }).then(hook);
};

/**
 * Performs the clicking of the page element, it searches for the element using
 * the locator, and then performs the mouse event clicking to support WebKit
 * current version, since the click method is not available in some HTMLElement
 * instances.
 * 
 * @param host
 * @param locator
 * @returns
 */
WebJS.prototype.doClick = function(host, locator) {
    return host.evaluate(function(locator) {
        if (typeof webhelper === 'undefined') {
            return false;
        }

        var obj = webhelper.getElement(locator);

        if (obj !== null) {
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, obj);
            obj.dispatchEvent(evt);

            return true;
        } else {
            return false;
        }
    }, {
        locator : locator
    });
};

/**
 * Performs clicking of the element based on the locator given
 * 
 * @param locator
 * @param hook
 */
WebJS.prototype.click = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        var result = geneos.web.doClick(this, locator);

        if (result) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_CLICK_FAILED'));
        }
    }).then(hook);
};

/**
 * Performs click and waits until the element was successfully clicked until the
 * process reaches the time out value
 * 
 * @param locator
 * @param hook
 */
WebJS.prototype.clickAndWait = function(locator, hook) {

    this.geneos.casper.then(function() {
        geneos.startStep();

        this.waitFor(function() {
            return geneos.web.doClick(this, locator);
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });

    }).then(hook);
};

/**
 * Capture page screen shot and return false if failed, return true when
 * successfully saves to file.
 * 
 * @param host
 *            Instance of CasperJS
 * @param savepath
 *            location where the captures shot will be saved
 * @returns true if successful and false if failed
 */
WebJS.prototype.captureScreen = function(host, savepath) {
    host.capture(geneos.current_output_folder + "/" + savepath);

    var targetFile = geneos.current_output_folder + "/" + savepath;
    if (fs.exists(targetFile)) {
        captureSize = fs.size(targetFile);
        return captureSize;
    } else {
        return false;
    }
};

/**
 * Capture page screen shot and save it to file
 * 
 * @param savepath
 * @param hook
 */
WebJS.prototype.captureEntirePageScreenshot = function(savepath, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        captureSize = geneos.web.captureScreen(this, savepath);
        if (captureSize === false) {
            geneos.endStep(false, messages.getMessage('ERROR_CAPTURE_FAILED'));
        } else {
            geneos.updateStepDownloadSize(captureSize);
            geneos.endStep();
        }
    }).then(hook);
};

/**
 * Capture current page screen and wait until it was successfully save it to
 * file, or failed when timed out.
 * 
 * @param savepath
 * @param hook
 */
WebJS.prototype.captureEntirePageScreenshotAndWait = function(savepath, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var captureSize = 0.00;
        this.waitFor(function() {
            captureSize = geneos.web.captureScreen(this, savepath);
            return captureSize !== false;
        }, function() {
            geneos.updateStepDownloadSize(captureSize);
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};

/**
 * For Selenium addSelection and removeSelection
 */
WebJS.prototype.toggleSelection = function(locator, optionBy, optionSelection, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        if (!geneos.web.isElementExists(locator)) {
            geneos.endStep(false, messages.getMessage('ERROR_GEN_LOCATOR_NOT_FOUND', locator));
        } else {
            success = geneos.web.toggleSelectionByLabel(locator, optionBy, optionSelection);
            if (success) {
                geneos.endStep();
            } else {
                geneos.endStep(false, messages.getMessage('ERROR_ITEM_SELECTION_FAILED'));
            }
        }
    }).then(hook);
};

/**
 * For Selenium addSelectionAndWait and removeSelectionAndWait
 */
WebJS.prototype.toggleSelectionAndWait = function(locator, optionBy, optionSelection, hook) {
    this.geneos.casper.then(
            function() {
                geneos.startStep();

                this.waitFor(function() {
                    return geneos.web.toggleSelectionByLabel(locator, optionBy, optionSelection);
                }, function() {
                    geneos.endStep();
                }, function() {
                    var defTimeout = this.defaultWaitTimeout * 1;
                    geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
                });

            }).then(hook);
};
/**
 * Simulates submission of the specified form
 * 
 * @param locator
 *            is an element reference for the form you want to submit
 * @param hook
 *            is a custom function to be executed after the function
 */
WebJS.prototype.submit = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var passed = this.evaluate(function(locator) {
            var elem = webhelper.getElement(locator);
            if (elem == undefined || Object.prototype.toString.call(elem) != "[object HTMLFormElement]") {
                return false;
            }
            elem.submit();

            return true;
        }, {
            locator : locator
        });
        if (passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_INVALID_FORM'));
        }
    }).then(hook);
};
/**
 * A helper function for the focus related actions
 * 
 * @param host
 *            is an instance of casperjs
 * @param locator
 *            is reference to an element that must gain focus
 * @returns
 */
WebJS.prototype.doFocus = function(host, locator) {
    var message = "";
    var passed;

    var result = host.evaluate(function(locator, message) {
        var elem = webhelper.getElement(locator);

        if (elem !== null) {
            try {
                elem.focus();
            } catch (err) {
                message = 'ERROR_FOCUS_FAILED';
                passed = false;
            }
            passed = true;
        } else {
            passed = false;
            message = ['ERROR_GEN_LOCATOR_NOT_FOUND', locator];
        }

        return {
            passed : passed,
            message : message
        };
    }, {
        locator : locator,
        message : message
    });

    return {
        passed: result.passed,
        message: messages.getMessage(result.message)
    };
};

/**
 * Move the focus to the specified element; for example, if the element is an
 * input field, move the cursor to that field.
 * 
 * @param locator
 *            is a reference to an element that must gain focus
 * @param hook
 *            is a custom function to be executed after the function
 */
WebJS.prototype.focus = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.web.doFocus(this, locator);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message);
        }
    }).then(hook);

};
/**
 * An INCOMPLETE AND DISFUNCTIONAL helper function to the window related actions
 * 
 * @param host
 *            is an instance of casperjs
 * @param locator
 *            is a reference to a window object
 * @returns
 */
WebJS.prototype.isWindow = function(host, locator) {
    var message = "";
    var passed;

    return host.evaluate(function(locator, message) {
        var win = webhelper.getElement(locator);

        if (win !== null) {
            try {
                win.focus;
            } catch (err) {
                message = "Error while requesting focus on element (" + locator + ")";
                passed = false;
            }
            passed = true;
        } else {
            passed = false;
            message = "Page element (" + locator + ") does not exist";
        }

        return {
            passed : passed,
            message : message
        };
    }, {
        locator : locator,
        message : message
    });

};
/**
 * Helper function to timeout related actions
 * 
 * @param host
 *            is an instance of casperjs
 * @param timeout
 *            is new timeout value
 * @returns {}
 */
WebJS.prototype.doTimeout = function(host, timeout) {
    var passed;
    var message = "";

    try {
        host.defaultWaitTimeout = timeout;
        passed = true;
    } catch (err) {
        passed = false;
        message = messages.getMessage('ERROR_SET_TIMEOUT_FAILED');
    }
    return {
        passed : passed,
        message : message
    };
};
/**
 * Specifies the amount of time that CasperJS will wait for actions to complete.
 * 
 * @param timeout
 *            is time duration in milliseconds, after which the action will
 *            return with an error
 * @param hook
 *            is a custom function to be executed after the function
 */
WebJS.prototype.setTimeout = function(timeout, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.web.doTimeout(this, timeout);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message);
        }

    }).then(hook);
};
/**
 * An INCOMPLETE AND DISFUNCTIONAL helper function to the window related actions
 * 
 * @param locator -
 *            the JavaScript window "name" of the window that will appear (not
 *            the text of the title bar)
 * @param value -
 *            a timeout in milliseconds, after which the action will return with
 *            an error.
 * @param hook -
 *            a custom function to be executed after the function
 */
// error assigning window.open to variable in casper - window.open always
// returns null or undefined, unless within an html page
WebJS.prototype.waitForPopUp = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        if (!geneos.web.isElementExists(locator)) {
            geneos.endStep(false, 'Window, (' + locator + '), does not exist');
        } else {
            this.waitFor(function() {
                return geneos.web.isWindow(this, locator).passed;
            }, function() {
                geneos.endStep();
            }, function() {
                geneos.endStep(false, 'Action timed out');

            }, value);
        }
    }).then(hook);
};

/**
 * Sets the value of an input field, as though you typed it in.
 * 
 * @param locator
 *            is a reference to an element (text area, text field, etc)
 * @param value
 *            the inputted text
 * @param hook
 *            is a custom function to be executed after the function
 */
WebJS.prototype.typeAndWait = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        this.waitFor(function() {
            return geneos.web.doType(this, locator, value);
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};

/**
 * Wait until the pageloaded flag is marked as true
 * 
 * @param timeout
 *            a time duration in milliseconds, after which this command will
 *            return with an error
 * @param hook-
 *            a custom function to be executed after the function
 */
WebJS.prototype.waitForPageToLoad = function(timeout, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        this.waitFor(function() {
            return ((!this.pageLoadStarted) && this.newPageLoaded);
        }, function() {
            geneos.endStep();
        }, function() {
            geneos.endStep(false, 'Timed out: page did not complete loading in ' + (timeout / 1000) + "s");
        }, timeout);
    }).then(hook);
};

/**
 * Waits for the specified element to gain focus, returns false after timeout
 * duration; for example, if the element is an input field, move the cursor to
 * that field.
 * 
 * @param locator
 *            is a reference to an element that must gain focus
 * @param hook
 *            is a custom function to be executed after the function
 */
WebJS.prototype.focusAndWait = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        this.waitFor(function() {
            return geneos.web.doFocus(this, locator).passed;
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);

};

/**
 * An INCOMPLETE AND DISFUNCTIONAL helper function to the window related actions
 * 
 * @param url -
 *            url to load
 * @param winName -
 *            reference to window element
 * @returns {___anonymous18559_18602}
 */
// error assigning window.open to variable in casper - window.open always
// returns null or undefined, unless within an html page
WebJS.prototype.newWindow = function(host, url, winName) {
    return host.evaluate(function(url, name) {
        var obj = webhelper.openWindow(url, name);

        return {
            passed : false,
            message : ""
        }
    }, {
        url : url,
        name : winName
    });
};
/**
 * Opens a popup window. After opening the window, you'll need to select it
 * using the selectWindow command.
 * 
 * @param url
 *            to be opened
 * @param winName
 *            is the JavaScript window ID of the window to select
 * @param hook
 *            is a custom function to be executed after the function
 */
// error assigning window.open to variable in casper - window.open always
// returns null or undefined, unless within an html page
WebJS.prototype.openWindow = function(url, winName, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.web.newWindow(this, url, winName);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message);
        }
    });
};
/**
 * 
 * @param locator
 *            is a reference to the frame
 * @param timeout
 *            a time duration in milliseconds, after which this command will
 *            return with an error
 * @param hook
 *            is a custom function to be executed after the function
 */
WebJS.prototype.waitForFrameToLoad = function(locator, timeout, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();

        this.waitFor(function() {

            return this.evaluate(function(locator) {
                var temp = webhelper.getElement(locator);
                if (temp == null || temp == undefined)
                    return null;

                temp.src = "http://www.google.com";
                return temp;
            }, {
                locator : locator
            });

        }, function() {
            this.capture("frame.png");
            geneos.endStep();
        }, function() {
            geneos.endStep(false, 'Timed out while waiting for  to load');
        }, timeout);
    }).then(hook);
};
/**
 * Selects a frame within the current window.
 * 
 * @param locator
 *            identifies a frame or iframe
 * @param hook
 *            is function to be executed after the function
 */
WebJS.prototype.selectFrame = function(locator, hook) {
    this.geneos.casper.then(
            function() {
                geneos.startStep();

                var passed = this.evaluate(function(locator, value) {
                    var elem = webhelper.getElement(locator);
                    if (elem == undefined || elem == null) {
                        return false;
                    }

                    if (Object.prototype.toString.call(elem) == "[object HTMLIFrameElement]"
                            || Object.prototype.toString.call(elem) == "[object HTMLFrameElement]") {
                        try {
                            elem.focus();
                        } catch (err) {
                            return 0;
                        }
                        if (document.activeElement == elem)
                            return true;
                        else
                            return false;
                    } else
                        return false;

                }, {
                    locator : locator
                });

                if (passed) {
                    geneos.endStep();
                } else if (passed == false) {
                    geneos.endStep(false, 'Page element (' + locator + ') does not exist');
                } else if (passed == 0) {
                    geneos.endStep(false, 'Error in selecting element (' + locator + ')');
                }
            }).then(hook);
};
/**
 * 
 * @param exp
 *            is the JavaScript snippet to run
 * @param test
 *            is the expected result of the exp parameter value
 * @param hook
 *            is a custom function to be executed after the function
 */
WebJS.prototype.waitForEval = function(exp, test, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        this.waitFor(function() {
            var passed = this.evaluate(function(exp, test) {
                if (exp == null || test == null || exp == "" || test == "") {
                    return false;
                }
                return (eval(exp) == test);
            }, {
                exp : exp,
                test : test
            });
            return passed;
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};

/**
 * returns true once the checkbox is checked, false if timeout duration is
 * exceeded Gets whether a toggle-button (checkbox/radio) is checked. Fails if
 * the specified element doesn't exist or isn't a toggle-button.
 * 
 * @param locator
 *            is a reference to a checkbox or radio button
 * @param hook
 *            is a custom function to be executed after the function
 */
WebJS.prototype.waitForChecked = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        this.waitFor(function() {
            return geneos.accessors.isChecked(this, locator).passed;
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};

/**
 * Wiats until the specified element is somewhere on the page. returns false if
 * timeout duration is exceeded
 * 
 * @param locator
 *            references an element
 * @param hook
 *            is a custom function to be executed after the function
 */
WebJS.prototype.waitForElementPresent = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        this.waitFor(function() {
            return geneos.web.isElementExists(locator);
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};

/**
 * Returns true once the specified element has been selected, false if timeout
 * duration is exceeded
 * 
 * @param locator
 *            references a drop-down menu
 * @param value
 *            references an option in the dropdown
 * @param hook
 *            is a custom function to be executed after the function
 */
WebJS.prototype.selectAndWait = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        this.waitFor(function() {
            return geneos.web.doSelect(this, locator, value).passed;
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};
/**
 * 
 * @param locator
 *            identifies a drop-down menu
 * @param value
 *            referemces an option in the dropdown
 * @param hook
 *            is a custom function to be executed after the function
 */
WebJS.prototype.select = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.web.doSelect(this, locator, value);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message);
        }
    }).then(hook);
};
/**
 * An INCOMPLETE AND DISFUNCTIONAL helper function to the context related
 * actions
 * 
 * @param host
 *            an instance of casperjs
 * @param locator
 *            an element locator
 */
WebJS.prototype.doContext = function(host, locator) {
    // var message = "";
    // var passed;

    host.evaluate(function(locator) {
        var el = webhelper.getElement(locator);

        if (el != null) {
            var evt = el.ownerDocument.createEvent("HTMLEvents");
            evt.initEvent('contextmenu', true, true);

            if (document.createEventObject) {
                el.fireEvent('oncontextmenu', evt);
            } else {
                !el.dispatchEvent(evt);
            }
        }

    });
};
/**
 * A helper function to the select related actions
 * 
 * @param host
 *            an instance of casperjs
 * @param locator
 *            references an element
 * @param value
 *            is the item to be selected
 */
WebJS.prototype.doSelect = function(host, locator, value) {
    var message = "";
    var passed;

    var result = host.evaluate(function(locator, message, value) {
        var elem = webhelper.getElement(locator);

        if (elem !== null) {
            var c;
            for (c = 0; c < elem.options.length; c++) {
                if (elem.options[c].text == value)
                    elem.selectedIndex = c;
            }
            if (elem.selectedIndex == webhelper.getElement(locator).selectedIndex) {
                passed = true;

            } else {
                message = 'ERROR_ITEM_SELECTION_FAILED';
                passed = false;
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
        locator : locator,
        message : message,
        value : value
    });

    return {
        passed: result.passed,
        message: messages.getMessage(result.message)
    };
};

/**
 * checks if coordinates given is within an element, then tries to click on it
 * 
 * @param locator
 *            an element locator
 * @param value
 *            coordinates in #,# format (eg. 10,100)
 * @param hook
 *            a custom function to be executed after the function
 */
WebJS.prototype.clickAt = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.web.checkElementCoordinates(locator, value);
        if (result.passed) {
            this.mouse.click(result.coordinates.x, result.coordinates.y);
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message);
        }
    }).then(hook);
};
/**
 * checks if coordinates given is within an element, then tries to click on it
 * until timeout is reached
 * 
 * @param locator
 *            an element locator
 * @param value
 *            coordinates in #,# format (eg. 10,100)
 * @param hook
 *            a custom function to be executed after the function
 */
WebJS.prototype.clickAtAndWait = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = null;
        this.waitFor(function() {
            result = geneos.web.checkElementCoordinates(locator, value);
            if (result.passed) {
                this.mouse.click(result.coordinates.x, result.coordinates.y);
                return true;
            } else {
                return false;
            }
        }, function() {
            // Success
            geneos.endStep();
        }, function() {
            // Timeout
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });

    }).then(hook);
};
/**
 * function that checks if a given coordinate is within an element
 * 
 * @param locator
 *            an element locator
 * @param value
 *            the coordinates in #,# format (eg. 10,100)
 * @returns passed or failed and error message (if it fails)
 */
WebJS.prototype.checkElementCoordinates = function(locator, value) {
    return this.geneos.casper.evaluate(function(locator, value) {
        var elem = webhelper.getElement(locator);
        if (elem != undefined) {
            var clipRect = elem.getBoundingClientRect();
            var coordinates = value.split(",");
            coordinates[0] = coordinates[0] * 1; // convert to a number
            coordinates[1] = coordinates[1] * 1; // convert to a number
            if (clipRect.top < coordinates[1] && clipRect.bottom > coordinates[1] && clipRect.left < coordinates[0]
                    && clipRect.bottom > coordinates[0]) {
                return {
                    passed : true,
                    coordinates : {
                        x : coordinates[0],
                        y : coordinates[1]
                    }
                };
            } else {
                return {
                    passed : false,
                    message : "The Coordinates (" + coordinates[0] + " and " + coordinates[1]
                            + ") is not within the element (" + locator + ") ."
                };
            }
        } else {
            return {
                passed : false,
                message : "The Element (" + locator + ") is missing."
            };
        }
    }, {
        locator : locator,
        value : value
    });
};
/**
 * remove all selections in a multiple select box
 * 
 * @param locator
 *            an element locator
 * @param hook
 *            a custom function to be executed after the function
 */
WebJS.prototype.removeAllSelections = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var passed = this.evaluate(function(locator) {
            var elem = webhelper.getElement(locator);
            elem.selectedIndex = -1;
            return elem.value;
        }, {
            locator : locator
        });
        if (passed == "") {
            geneos.endStep();
        } else {
            geneos.endStep(false, messages.getMessage('ERROR_GEN_LOCATOR_NOT_FOUND', locator));
        }
    }).then(hook);
};
/**
 * Waits for condition to become true, otherwise it times out
 * 
 * @param locator
 *            conditional statement
 * @param value
 *            timeout time
 * @param hook
 *            a custom function to be executed after the function
 */
WebJS.prototype.waitForCondition = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        this.waitFor(function() {
            return eval(locator);
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        }, value);
    }).then(hook);
};
/**
 * Waits for text comparison to become true, otherwise it times out
 * 
 * @param locator
 *            an element locator
 * @param value
 *            text to be compared to
 * @param hook
 *            a custom function to be executed after the function
 */
WebJS.prototype.waitForText = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = null;
        this.waitFor(function() {
            result = geneos.assert.doCompareText(this, locator, value);
            return result.passed;
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};

/**
 * Waits for value comparison to become true, otherwise it times out
 * 
 * @param locator
 *            an element locator
 * @param value
 *            a value to compare the locator to
 * @param hook
 *            a custom function to be executed after the function
 */
WebJS.prototype.waitForValue = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = null;
        this.waitFor(function() {
            result = geneos.assert.doCompareValue(this, locator, value);
            return result.passed;
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};

/**
 * Waits for visibility to become visible, otherwise it times out
 * 
 * @param locator
 *            an element locator
 * @param hook
 *            a custom function to be executed after the function
 */
WebJS.prototype.waitForVisible = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = null;
        this.waitFor(function() {
            result = geneos.assert.doCheckVisibility(this, locator);
            return result.passed;
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};

/**
 * Waits for title comparison to become true, otherwise it times out
 * 
 * @param locator
 *            a pattern to match with the title of the page
 * @param hook
 *            a custom function to be executed after the function
 */
WebJS.prototype.waitForTitle = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        this.waitFor(function() {
            return this.getTitle() == locator;
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};

/**
 * Waits for body text comparison to become true, otherwise it times out
 * 
 * @param locator
 *            a pattern to match with the text of the page
 * @param hook
 *            a custom function to be executed after the function
 */
WebJS.prototype.waitForBodyText = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        this.waitFor(function() {
            return this.page.content == locator;
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};

/**
 * Waits for text comparison to become false, otherwise it times out
 * 
 * @param locator
 *            a pattern to match with the text of the page
 * @param hook
 *            a custom function to be executed after the function
 */
WebJS.prototype.waitForTextNotPresent = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        this.waitFor(function() {
            return !(this.page.plainText.match(locator));
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};

/**
 * function that will verify if an element is a textbox or not, then sets the
 * cursor position
 * 
 * @param host
 *            casper
 * @param locator
 *            an element locator pointing to an input element or textarea
 * @param value
 *            the numerical position of the cursor in the field; position should
 *            be 0 to move the position to the beginning of the field. You can
 *            also set the cursor to -1 to move it to the end of the field.
 * @returns result and message
 */
WebJS.prototype.doSetCursorPosition = function(host, locator, value) {
    return host.evaluate(function(locator, value) {
        var passed = false;
        var message = "";
        var obj = webhelper.getElement(locator);
        if (obj !== null) {
            if (obj.type == "text" || obj.type == "textarea") {
                if (value == -1) {
                    value = obj.textLength;
                }
                obj.focus();
                obj.setSelectionRange(value, value);
                if (obj.selectionStart == value) {
                    passed = true;
                } else {
                    message = "Unable to set the cursor position (" + value + ") in Element (" + locator
                            + "). Current Position is (" + obj.selectionStart + ").";
                }
            } else {
                message = "The Element (" + locator + ") has no cursor to set.";
            }
        } else {
            message = "The Element (" + locator + ") does not exist.";
        }
        return {
            passed : passed,
            message : message
        };
    }, {
        locator : locator,
        value : value
    });
};

/**
 * set the cursor position of a textfield or textarea
 * 
 * @param locator
 *            an element locator pointing to an input element or textarea
 * @param value
 *            the numerical position of the cursor in the field; position should
 *            be 0 to move the position to the beginning of the field. You can
 *            also set the cursor to -1 to move it to the end of the field.
 * @param hook
 *            A Custom Function
 */
WebJS.prototype.setCursorPosition = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.web.doSetCursorPosition(this, locator, value);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message);
        }
    }).then(hook);
};

/**
 * set the cursor position of a textfield or textarea until timeout
 * 
 * @param locator
 *            an element locator pointing to an input element or textarea
 * @param value
 *            the numerical position of the cursor in the field; position should
 *            be 0 to move the position to the beginning of the field. You can
 *            also set the cursor to -1 to move it to the end of the field.
 * @param hook
 *            A Custom Function
 */
WebJS.prototype.setCursorPositionAndWait = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = null;
        this.waitFor(function() {
            result = geneos.web.doSetCursorPosition(this, locator, value);
            return result.passed;
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};
/**
 * Selects a popup window using a window locator; once a popup window has been
 * selected, all commands go to that window.
 * 
 * @param locator
 *            is the JavaScript window ID of the window to select
 * @param hook
 *            is a custom function to be executed after the function
 */
// error assigning window.open to variable in casper - window.open always
// returns null or undefined, unless within an html page
WebJS.prototype.selectWindow = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.web.doSelectWindow(this, locator);
        if (result.passed) {
            geneos.endStep();
        } else {
            geneos.endStep(false, result.message);
        }
    }).then(hook);
};
/**
 * An INCOMPLETE AND DISFUNCTIONAL helper function to the window related actions
 * 
 * @param host
 *            an instance of casperjs
 * @param window
 *            the JavaScript window ID of the window to select
 * @param title
 *            title of the window object
 * @returns {___anonymous35185_35226}
 */
WebJS.prototype.doSelectWindow = function(host, window, title) {
    var message = "";
    var passed;

    // return host.evaluate(function(window, message){
    if (window !== null) {
        if (window.hasAttribute(title)) {
            if (Object.prototype.toString.call(window) == "[object Window]") {
                try {
                    window.focus;
                    passed = true;
                } catch (err) {
                    message = "Error while requesting focus on window (" + window + ")";
                    passed = false;
                }
            } else {
                passed = false;
                message = locator + " is not a window";
            }
        } else {
            passed = false;
            message = "Window, (" + window + "), does not contain attribute " + title;
        }
    } else {
        passed = false;
        message = "Window, (" + window + "), does not exist";
    }

    return {
        passed : passed,
        message : message
    };
    // }, {window:window, message:message});
};
/**
 * Creates a cookie
 * 
 * @param locator
 *            this is the name=value pair
 * @param value
 *            extra parameters (max_age, domain and path)
 * @param hook
 *            a custom function to be executed after the function
 */
WebJS.prototype.createCookie = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        var result = geneos.web.doCreateCookie(locator, value);
        if (result) {
            geneos.endStep();
        } else {
            geneos.endStep(false, "Cookie creation failed");
        }
    }).then(hook);
};
/**
 * Attemps to create a cookie until timeout
 * 
 * @param locator
 *            this is the name=value pair
 * @param value
 *            extra parameters (max_age, domain and path)
 * @param hook
 *            a custom function to be executed after the function
 */
WebJS.prototype.createCookieAndWait = function(locator, value, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        this.waitFor(function() {
            return geneos.web.doCreateCookie(locator, value);
        }, function() {
            geneos.endStep();
        }, function() {
            var defTimeout = this.defaultWaitTimeout * 1;
            geneos.endStep(false, messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time')));
        });
    }).then(hook);
};
/**
 * deletes a cookie
 * 
 * @param locator
 *            this is the name of the cookie
 * @param hook
 *            a custom function to be executed after the function
 */
WebJS.prototype.deleteCookie = function(locator, hook) {
    this.geneos.casper.then(function() {
        geneos.startStep();
        if (geneos.web.doCheckCookie(locator)) {
            geneos.web.doDeleteCookie(locator);
            geneos.endStep();
        } else {
            geneos.endStep(false, "Cookie does not exist");
        }
    }).then(hook);
};
// ----------- Cookie methods --------------------------------------------------
/**
 * Creates a Cookie
 * 
 * @param locator
 *            this is the name=value pair
 * @param value
 *            extra parameters (max_age, domain and path)
 */
WebJS.prototype.doCreateCookie = function(locator, value) {
    if (locator.indexOf("=") < 0) {
        return false;
    }

    var nameValuePair = locator.split("=");
    var optionsString = value.split(",");
    var temp = null;
    if (value.indexOf("max_age=") != -1) {
        for ( var ctr = 0; ctr < optionsString.length; ctr++) {
            temp = optionsString[ctr].split("=");
            if (temp[0] == "max_age") {
                break;
            }
        }
    } else {
        temp = new Array(60);
    }

    var cookieName = nameValuePair[0];
    var cookieValue = nameValuePair[1];
    var expiredays = temp[1];
    var expireDate = new Date();
    expireDate.setTime(expireDate.getTime() + (expiredays * 24 * 3600 * 1000));
    document.cookie = cookieName + "=" + escape(cookieValue)
            + ((expiredays == null) ? "" : ";expires=" + expireDate.toGMTString());
    return geneos.web.doCheckCookie(cookieName);
};
/**
 * check if cookie exists
 * 
 * @param name
 *            of cookie
 * @returns {Boolean}
 */
WebJS.prototype.doCheckCookie = function(locator) {
    var theCookie = geneos.web.doGetCookie(locator);
    if (theCookie != null && theCookie != "") {
        return true;
    } else {
        return false;
    }
};
/**
 * gets the cookie from document.cookie
 * 
 * @param name
 *            of cookie
 * @returns cookie object
 */
WebJS.prototype.doGetCookie = function(locator) {
    var ctr, tempX, tempY, ARRcookies = document.cookie.split(";");
    for (ctr = 0; ctr < ARRcookies.length; ctr++) {
        tempX = ARRcookies[ctr].substr(0, ARRcookies[ctr].indexOf("="));
        tempY = ARRcookies[ctr].substr(ARRcookies[ctr].indexOf("=") + 1);
        tempX = tempX.replace(/^\s+|\s+$/g, "");
        if (tempX == locator) {
            return unescape(tempY);
        }
    }
};
/**
 * delete the cookie
 * 
 * @param name
 *            of cookie
 */
WebJS.prototype.doDeleteCookie = function(locator) {
    if (geneos.web.doGetCookie(locator)) {
        document.cookie = locator + "=" + "; expires=Thu, 01-Jan-70 00:00:01 GMT";
    }
};

// ----------- helper methods --------------------------------------------------
WebJS.prototype.saveableHttpLocation = function(location) {
    filename = location;
    filename = filename.replace(/[><+%$*"'.:\\?;,&=#|\/\]]/g, "_");

    if (filename.length > 200) {
        filename = filename.substr(0, 200);
    }

    return filename;
};

WebJS.prototype.getBaseLocator = function(locator) {
    if (locator.startsWith("css=")) {
        return locator.substr(4);
    } else if (locator.startsWith("id=")) {
        return '#' + locator.substr(3);
    }

    return locator;
};

WebJS.prototype.getAttribute = function(locator) {
    // Split into locator + attributeName
    var attributePos = locator.lastIndexOf("@");
    var elementLocator = this.getBaseLocator(locator.slice(0, attributePos));
    var attributeName = locator.slice(attributePos + 1);

    return this.geneos.casper.evaluate(function(element, attribute) {
        return document.querySelector(element).getAttribute(attribute);
    }, {
        element : elementLocator,
        attribute : attributeName
    });
};

WebJS.prototype.getElementText = function(locator) {
    var elementLocator = this.getBaseLocator(locator);

    return this.geneos.casper.evaluate(function(element) {
        return document.querySelector(element).innerText;
    }, {
        element : elementLocator
    });
};

WebJS.prototype.isElementExists = function(locator) {
    return this.geneos.casper.evaluate(function(locator) {
        return webhelper.getElement(locator) != null;
    }, {
        locator : locator
    });
};

WebJS.prototype.toggleSelectionByLabel = function(locator, optionBy, selected) {
    var passed = this.geneos.casper.evaluate(function(locator, optionLabel, selection) {
        var elem = webhelper.getElement(locator);
        if (elem != null) {
            var selectedIndex = -1;
            for ( var i = 0; i < elem.options.length; i++) {
                if (elem.options[i] != null && ("label=" + elem.options[i].text) == optionLabel) {
                    selectedIndex = i;
                }
            }
            
            elem.options[selectedIndex].selected = selection;
            return true;
        }
        return false;
    }, {
        locator : locator,
        optionLabel : optionBy,
        selection : selected
    });

    return passed;
};

WebJS.prototype.getElement = function(locator) {
    var elementLocator = this.getBaseLocator(locator);
    return document.querySelector(elementLocator);
};

WebJS.prototype.getBaseLocator = function(locator) {
    if (locator.startsWith("css=")) {
        return locator.substr(4);
    } else if (locator.startsWith("id=")) {
        return '#' + locator.substr(3);
    }

    return locator;
};

exports.WebJS = WebJS;
