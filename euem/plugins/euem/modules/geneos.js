/*
 * Copyright 2012 ITRS Group Plc
 *
 * GeneosJS Object
 * Main Geneos EUEM Module
 * --------------------------------------------------------------
 * Requires: CasperJS
 * --------------------------------------------------------------
 */

var fs = require('fs');
var utils = require('utils');
var system = require('system');
var logger = geneos('logger').create();
var toolkit = geneos('toolkit').create();
var messages = geneos('messages').create();

exports.create = function create(options) {
    return new GeneosJS(options);
};

/**
 * GeneosJS constructor
 */
var GeneosJS = function (options) {
    this.options = typeof options !== 'undefined' ? options : {
        debug : false
    };
    
    // timers
    this.startTime = new Date();
    this.start = new Date();
    this.end = new Date();
    
    this.current_step_index = 0;
    this.current_step_start = null;
    this.current_step_end = null;
    this.show_element_details = false;
    
    this.alerts = [];
    
    // for page resource measurement
    this.resources = [];
    
    // objects
    instance = this;
    this.commands = geneos('commands').create();
    this.web = geneos('web').create(this);
    this.accessors = geneos('accessors').create(this);
    this.assert = geneos('assert').create(this);
    
    logger.setLevel(this.options.debug ? "debug" : "info");
    
    this.casper = require('casper').create({
            verbose : false,
            logLevel : "debug",
            onTimeout : function () {
                var timeoutInSeconds = instance.options.timeouts.scenarioTimeout * 1000;
                logger.error(messages.getMessage('ERROR_GEN_SCENARIO_TIMEOUT', timeoutInSeconds.format('time')));
                
                if (instance.current_step_start !== null && instance.current_step_end === null) {
                    if(this.pageLoadStarted) {
                        logger.debug('saving page resource performance data - ' + this.getCurrentUrl());
                        if (geneos.current_step_index != 0) {
                            var location = this.getCurrentUrl();
                            har = geneos.createHar(location, this.getTitle());
                            geneos.addPerformanceResult(har);
                            
                            savePath = geneos.current_output_folder + "/open_" + geneos.web.saveableHttpLocation(location) + ".har";
                            fs.write(savePath, JSON.stringify(har, undefined, 4), "w");
                        }
                    }
                } else {
                     this.current_step_start = new Date();
                }
                
                instance.endStep(false, messages.getMessage('ERROR_GEN_SCENARIO_TIMEOUT', timeoutInSeconds.format('time')));                
                instance.saveResults(instance);
                phantom.exit(5);
            },
            onResourceReceived : function (self, res) {
                // logger.debug("oResourceReceived: " + JSON.stringify(res, null, 4));
                if (res.url.startsWith("data:")) {
                    res.status = 200;
                    res.statusText = "OK";
                }
                
                // for step execution
                if (res.stage === 'start') {
                    if (instance.result.steps[instance.current_step_index - 1].details.step === 'open' &&
                        instance.result.steps[instance.current_step_index - 1].details.target === res.url) {
                        instance.result.steps[instance.current_step_index - 1].response.start = res;
                    }
                }
                if (res.stage === 'end') {
                    if (instance.result.steps[instance.current_step_index - 1].details.step === 'open' &&
                        instance.result.steps[instance.current_step_index - 1].details.target === res.url) {
                        instance.result.steps[instance.current_step_index - 1].response.end = res;
                    }
                }
                
                if (res.stage === 'ssl_error') {
                    instance.result.steps[instance.current_step_index - 1].response.ssl_errors = res;
                }
                
                // for performance measurement
                if (!instance.resources[res.id - 1]) {
                    instance.resources[res.id - 1] = {
                        request : null,
                        startReply : null,
                        endReply : null
                    };
                }
                
                if (res.stage === 'start') {
                    instance.resources[res.id - 1].startReply = res;
                }
                if (res.stage === 'end') {
                    instance.resources[res.id - 1].endReply = res;
                }
                if (res.stage === 'ssl_error') {
                    instance.resources[res.id - 1].ssl_errors = res;
                }
            },
            onResourceRequested : function (self, req) {
                // logger.debug("oResourceRequested: " + JSON.stringify(req, null, 4));
                
                if (!instance.resources) {
                    instance.resources = [];
                }
                instance.resources[req.id - 1] = {
                    request : req,
                    startReply : null,
                    endReply : null
                };
            },
            pageSettings : {
                loadImages : true,
                loadPlugins : true,
                userAgent : 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.13 (KHTML, like Gecko) Chrome/24.0.1284.0 Safari/537.13',
                webSecurityEnabled : false
            },
            viewportSize : {
                width : 1400,
                height : 1300
            }
        });
    
    this.casper.defaultWaitTimeout = 5000;
    
    this.casper.on('remote.alert', function (message) {
        geneos.alerts[geneos.alerts.length] = message;
    });
    
    this.casper.on('load.started', function (status) {
        logger.debug("Load Started.");
        this.openPageLoadFailed = false;
        this.pageLoadStarted = true;
        this.newPageLoaded = false;
    });
    
    this.casper.on('load.failed', function (data) {
        logger.debug("Load Failed. HTTP Status : " + data.http_status);
        this.openPageLoadFailed = true;
        this.pageLoadStarted = false;
        geneos.endStep(false, "Failed loading " + data.url + ".");
    });
    
    this.casper.on('load.finished', function (status) {
        this.authLoadFinished = true;
        this.pageLoadStarted = false;
        this.newPageLoaded = true;
        logger.debug("Load Finished. (" + status + ")");
        if (status !== "fail") {
            var stringsProtoPath = fs.pathJoin(phantom.geneosPath, 'lib', 'protos.js');
            if (true === this.page.injectJs(stringsProtoPath)) {
                logger.debug('successfully injected Geneos Native Type Protos module.');
            }
            
            var helperUtilsPath = fs.pathJoin(phantom.geneosPath, 'modules', 'helper.js');
            if (true === this.page.injectJs(helperUtilsPath)) {
                logger.debug('successfully injected Geneos Helper module.');
            }
            
            this.evaluate(function (framePath) {
                webhelper.framePath = framePath;
            }, {
                framePath : instance.web.framePath
            });
            
            logger.debug('saving page resource performance data - ' + this.getCurrentUrl());
            if (geneos.current_step_index != 0) {
                var location = this.getCurrentUrl();
                har = geneos.createHar(location, this.getTitle());
                geneos.addPerformanceResult(har);
                
                savePath = geneos.current_output_folder + "/open_" + geneos.web.saveableHttpLocation(location) + ".har";
                fs.write(savePath, JSON.stringify(har, undefined, 4), "w");
            }
        } else {
            logger.error("Failed to open target url.");
            geneos.saveResults(instance);
            this.exit(1);
        }
    });
    
    this.casper.on('page.error', function (msg, trace) {
        console.error(msg);
        trace.forEach(function _forEach(item) {
            console.log('  ', item.file, ':', item.line);
        });
    });
    
    this.casper.on('log', function (entry) {
        if (entry.level == "error") {
            geneos.updateCurrentStepMessage(entry.message);
        }
    });
    
    this.casper.setFilter('echo.message', function (message) {
        return "";
    });
    
    // results
    this.result = {
        info : {
            scenario : "",
            base : "",
            number_of_steps : 0,
            number_of_passed : 0,
            number_of_failed : 0
        },
        execution : {
            start : "",
            end : "",
            elapse : ""
        },
        variables : {
            system : {
                url : ''
            },
            user : {}
        },
        steps : []
    };
    
};

GeneosJS.prototype.storeSystemVariable = function (name, value) {
    this.result.variables.system[name] = value;
};

/**
 * Initialise scenario and start process
 *
 * @param options
 * @param hook
 */
GeneosJS.prototype.initialize = function (options, hook) {
    logger.debug("Geneos Scenario Initialised");
    
    if (!utils.isObject(options)) {
        this.options = {
            homedir : "geneos/catalog",
            url : "",
            scenario : "empty",
            showall : true,
            debug : "no",
            timeout : {
                scenarioTimeout : 5,
                stepTimeout : 5
            }
        };
    } else {
        utils.mergeObjects(this.options, options);
    }
    
    if (system.args.length > 1) {
        for (var i = 1; i < system.args.length; i++) {
            var arg = system.args[i];
            if (arg.startsWith("--")) {
                var idxEq = arg.indexOf("=");
                if (idxEq > 2) {
                    var argName = arg.substr(2, idxEq - 2);
                    var argValue = arg.substr(idxEq + 1);
                    
                    this.options[argName] = argValue;
                }
            }
        }
    }
    logger.debug("options " + JSON.stringify(this.options, null, 4));
    
    // check for debug options
    if ('debug' in this.options) {
        if (this.options.debug == 'yes') {
            logger.setLevel(this.options.debug ? 'debug' : 'info');
        }
    }
    
    this.start = new Date();
    if (!('saveto' in this.options)) {
        this.options['saveto'] = this.start.toFileTypeString();
    }
    
    this.result.info.scenario = this.options.scenario;
    this.result.execution.start = this.start.toISOString();
    this.result.info.base = this.options.url;
    
    // timeout + 1s to compensate initialization overhead of the process which does not 
    // include in actual scenario execution (average overhead is about 300~900ms) (PT:37838033)
    this.casper.options.timeout = (this.options.timeouts.scenarioTimeout * 1000) + 1000; 
    this.casper.defaultWaitTimeout = this.options.timeouts.stepTimeout * 1000;
    
    // store system variables
    this.storeSystemVariable("url", this.options.url);
    this.storeSystemVariable("scenarioTimeout", this.options.timeouts.scenarioTimeout);
    this.storeSystemVariable("stepTimeout", this.options.timeouts.stepTimeout);
    
    if ('showall' in this.options) {
        this.show_element_details = this.options.showall;
        logger.debug('showing all details - ' + this.show_element_details);
    } else {
        logger.debug('showing all details - disabled');
    }
    
    var stripped_scenario_name = toolkit.stripForFilename(this.options.scenario);
    this.current_output_folder = this.options.homedir + "/runs/" + stripped_scenario_name + "/" + this.options.saveto + "/";
    this.lastrun_output_folder = this.options.homedir + "/_last/";
    
    // load last run
    this.last_run_file = this.lastrun_output_folder + stripped_scenario_name + ".json";
    this.last_run_data = null;
    if (fs.exists(this.last_run_file)) {
        json_data = fs.read(this.last_run_file);
        try {
            this.last_run_data = JSON.parse(json_data);
        } catch (e) {
            this.last_run_data = null;
        }
    }
    this.casper.start();

};

GeneosJS.prototype.addStep = function (command, hook) {
    if (typeof(command.cipher) != "undefined") {
        command.ct = command.value;
        command.value = sjcl.decrypt("SUPAR SEKRIT PASSWORD", command.cipher);
        delete command.cipher;
    }
    
    var step_command = this.commands.get(command.step);
    this.result.info.number_of_steps++;
    this.result.steps[this.result.info.number_of_steps - 1] = {
        id : this.result.info.number_of_steps - 1,
        details : command,
        response : {},
        start : "",
        end : "",
        elapse : -1,
        downloadSize : -1,
        result : {
            passed : '',
            message : '',
            data : ''
        }
    };
    
    if (typeof step_command != "undefined") {
        try {
            eval(step_command);
        } catch (err) {
            logger.error('failed executing step "' +  + command.step + '" with error of ' + err);
        }
    } else {
        logger.debug('command not supported - ' + command.step);
        this.casper.then(function () {
            geneos.startStep();
            geneos.endStep(false, "command not supported");
        });
    }
};

GeneosJS.prototype.doSteps = function (hook) {
    this.result.info.number_of_steps = 0;
    instance = this;
    this.casper.run(function () {
        geneos.saveResults(instance);
        this.exit(0);
    });
    
};

GeneosJS.prototype.saveResults = function (instance) {
    logger.debug('execution completed.');
    
    instance.end = new Date();
    instance.result.execution.end = instance.end.toISOString();
    
    instance.result.info.number_of_steps = instance.result.steps.length;
    instance.result.info.number_of_failed = instance.result.info.number_of_steps - instance.result.info.number_of_passed;
    
    elapse = instance.end - instance.start;
    instance.result.execution.elapse = elapse;
    
    result_json = JSON.stringify(instance.result, null, 4);
    
    logger.debug('saving json results');
    var stripped_scenario_name = toolkit.stripForFilename(instance.result.info.scenario);
    fs.write(instance.current_output_folder + stripped_scenario_name + ".json",
        result_json, "w");
    
    var output_content = "";
    
    // if last run steps are not the same then the last run is different scenario
    if (instance.last_run_data != null) {
        if (instance.last_run_data.steps.length != instance.result.info.number_of_steps) {
            logger.debug('last run does not contain same number of steps as before : (' + instance.last_run_data.steps.length + " - " + instance.result.info.number_of_steps + ")");
            instance.last_run_data = null;
        }
    } else {
        logger.debug('last run does not have any value');
    }
    
    logger.debug('generating details output');
    var ictr = 0;
    var totalScenarioDuration = 0;
    var totalStepsPrecision = (instance.result.steps.length + "").length;
    instance.result.steps.forEach(function (step) {
        ictr++;
        
        var exTime = step.start.replace(/[TZ]/g, " ").trim();
        var totalTime = toolkit.getStepDuration(step);
        totalScenarioDuration = totalScenarioDuration + step.elapse;
        
        output_content = output_content + instance.extractRow(ictr, step,
                instance.last_run_data,
                totalStepsPrecision,
                instance.show_element_details) + "\n";
        
        if (instance.show_element_details) {
            if ("performance" in step) {
                output_content = output_content + instance.extractResources(ictr, step, instance.last_run_data, totalStepsPrecision);
            } else {
                var lastDuration = 'N/A';
                if (instance.last_run_data != null) {
                    time_last_run = instance.last_run_data.steps[step.id].elapse;
                    lastDuration = time_last_run.format('time');
                }
                
                var downloadSize = '';
                if (step.downloadSize > 0) {
                    downloadSize = step.downloadSize.format('data');
                }
                
                var step_details = toolkit.stripComma(step.details.target);
                
                var step_description = step.details.value;
                if ('ct' in step.details) {
                    step_description = step.details.ct;
                }
                
                step_description = toolkit.stripCRLF(toolkit.stripComma(step_description + ' ' + step.result.data));
                row_data = ["step" + ictr.padZero(totalStepsPrecision) + "#1", // step counter; step
                    step_details, // step id
                    (step.result.passed ? "OK" : "FAIL"), // status
                    step.elapse.format('time'), // step duration in seconds (displayable data)
                    lastDuration, // step last duration in seconds (displayable data)
                    '', // http response code
                    '', // http response text
                    downloadSize, // total download size
                    exTime, // execution time
                    step_description.trim(), // step description
                    "ELEMENT",
                    ''
                ].join(",");
                
                output_content = output_content + row_data + "\n";
            }
        }
        
    });
    
    instance.result.execution.totalDuration = totalScenarioDuration;
    
    logger.debug('generating header output');
    output_content = instance.extractHeadlines(instance.result) + "\n" + output_content;
    
    logger.info('saving results to ' + instance.current_output_folder, "debug");
    
    // output log information
    var result_file = instance.lastrun_output_folder + stripped_scenario_name + ".result";
    logger.debug('writing parsable output for dataview in ' + result_file);
    fs.write(result_file, output_content, {mode: 'w', charset: 'ISO-8859-1'});
    
    // save this as last run
    logger.debug('writing last run reference in ' + instance.last_run_file);
    fs.write(instance.last_run_file, result_json, "w");
    
    logger.info('cleaning and finishing.');
    logger.info('done.');
};

GeneosJS.prototype.extractHeadlines = function (result) {
    var duration = result.execution.totalDuration.format('time');
    var startExTime = result.execution.start.replace(/[TZ]/g, " ").trim();
    var endExTime = result.execution.end.replace(/[TZ]/g, " ").trim();
    var serverType = this.getServerType(result.steps[0]);
    
    var urlParts = result.info.base.split("//");
    var protocol = urlParts[0].substring(0, urlParts[0].length - 1);
    var hostPart = urlParts[1].split("/")[0].split(":");
    var basePort = hostPart.length > 1 ? hostPart[1] : "80";
    
    return [result.info.base, // base url
        result.info.number_of_steps, // total number of steps
        result.info.number_of_passed, // total steps passed
        result.info.number_of_failed, // total steps failed
        duration, // total scenario duration in seconds (displayable data)
        startExTime, // start execution time
        endExTime, // end execution time
        serverType, // initial url server type
        protocol, // server protocol on base url
        basePort // server port on base url
    ].join(",");
};

GeneosJS.prototype.extractRow = function (stepCtr, step, lastResult, totalStepsPrecision, showDetails) {
    var status = (step.result.passed ? "OK" : "FAIL");
    showDetails = typeof showDetails !== 'undefined' ? showDetails : true;
    
    // scenario duration
    var duration = step.elapse;
    duration = duration.format('time');
    
    // last duration or previous duration
    var lastDuration = "N/A";
    if (lastResult != null) {
        lastDurationTime = lastResult.steps[step.id].elapse;
        lastDuration = lastDurationTime.format('time');
    }
    
    var responseCode = '';
    var responseText = '';
    var downloadSize = '';
    
    if ("response" in step) {
        var resp = step.response;
        if ("start" in resp) {
            responseCode = resp.start.status;
            responseText = resp.start.statusText;
        }
        
        downloadSize = step.downloadSize.format('data');
    } else {
        if (step.downloadSize > 0) {
            downloadSize = step.downloadSize.format('data');
        }
    }
    
    var exTime = step.start.replace(/[TZ]/g, " ").trim();
   
    var step_command = toolkit.stripCRLF(toolkit.stripComma(step.details.step)); 
    var step_description = toolkit.stripCRLF(toolkit.stripComma(showDetails ? '' : step.details.target));
    var step_error_message = toolkit.stripCRLF(toolkit.stripComma(step.result.message)).trim();
    return ["step" + stepCtr.padZero(totalStepsPrecision), // step counter; step
        step_description, // step id
        status, // status
        duration, // step duration in seconds (displayable data)
        lastDuration, // step last duration in seconds (displayable data)
        responseCode, // http response code
        responseText, // http response text
        downloadSize, // total download size
        exTime, // execution time
        step_command, // step description
        "STEP",
        step_error_message // step error message if any
    ].join(",");
};

GeneosJS.prototype.extractResources = function (stepCtr, step, lastResult, totalStepsPrecision) {
    var resourcesDetails = "";
    var idctr = 0;
    var idlen = (step.performance.log.entries.length + "").length;
    step.performance.log.entries.forEach(function (res) {
        var resname = res.request.url;
        resname = toolkit.stripComma(resname.substring(resname.lastIndexOf("/") + 1).trim());
        
        var status = (res.response.status < 400 ? "OK" : "FAIL");
        var duration = res.time.format('time');
        
        var lastDuration = "N/A";
        if (lastResult != null) {
            now_step = res.request.url;
            if (lastResult.steps.length >= stepCtr) {
                if ("performance" in lastResult.steps[stepCtr - 1]) {
                    entry = geneos.searchPageResource(lastResult.steps[stepCtr - 1].performance, now_step, idctr);
                    if (entry != null) {
                        resource_old_duration = entry.time;
                        lastDuration = resource_old_duration.format('time');
                    }
                }
            }
        }
        idctr++;
        
        var downloadSize = res.response.bodySize.format('data'); //(res.response.bodySize / 1024).format('0,000.00') + " kb";
        var exTime = res.startedDateTime.replace(/[TZ]/g, " ").trim();
        
        var description = toolkit.stripComma(res.request.url);
        if (res.request.url.startsWith("data:")) {
            description = "embedded binary data (content stripped)";
        }
        
        if (resname == "") {
            resname = toolkit.stripComma(res.request.url);
        }
        
        var message = '';
        var ssl_errors = res.response.ssl_errors;
        if (ssl_errors !== undefined) {
            message = 'contains SSL errors';
            
            // emit to console
            var target_url = res.request.url;
            console.log(target_url + " contains SSL errors: ");
            ssl_errors.forEach(function (error) {
                console.log("   " + error);
            });
            console.log(" ");
        }
        
        var row_data = ["step" + stepCtr.padZero(totalStepsPrecision) + "#" + idctr.padZero(idlen), // step counter; step unique id
            resname, // step id - resource name
            status, // status
            duration, // resource duration in seconds (displayable data)
            lastDuration, // resource last duration in seconds (displayable data)
            res.response.status, // http response code
            res.response.statusText, // http response text
            downloadSize, // total download size
            exTime, // execution time
            description, // step description
            "ELEMENT",
            message
        ].join(",");
        resourcesDetails = resourcesDetails + row_data + "\n";
    });
    
    return resourcesDetails;
};

GeneosJS.prototype.getServerType = function (step) {
    var serverType = "UNKNOWN";
    if ("response" in step) {
        var response = step.response;
        if ("start" in response) {
            var httpHeaders = response.start.headers;
            httpHeaders.forEach(function (header) {
                if ("Server" == header.name) {
                    serverType = header.value;
                }
            });
        }
    }
    
    return serverType;
};

GeneosJS.prototype.startStep = function () {
    this.current_step_index++;
    this.current_step_start = new Date();
    this.current_step_end = null;
    
    this.result.info.number_of_steps = this.result.info.number_of_steps + 1;
    this.result.steps[this.current_step_index - 1].start = this.current_step_start.toISOString();
    
    logger.info('running step > ' + this.current_step_index + " > " + this.result.steps[this.current_step_index - 1].details.step + " > " + this.result.steps[this.current_step_index - 1].details.target);
    logger.debug('running step > ' + this.current_step_index + " > " + this.current_step_start);
};

GeneosJS.prototype.endStep = function (testresult, message, data, assertStep) {
    testresult = typeof testresult !== 'undefined' ? testresult : true;
    message = typeof message !== 'undefined' ? message : "";
    data = typeof data !== 'undefined' ? data : "";
    assertStep = typeof assertStep !== 'undefined' ? assertStep : false;
    
    this.current_step_end = new Date();
    elapse = this.current_step_end - this.current_step_start;
    
    /*
     * override for steps that can't be break due to call blocking of phantomjs
     * if step timeout is lesser the actuat step execution then override to failed step
     */
    if (testresult != false && this.casper.defaultWaitTimeout < elapse) {
        testresult = false;
        var defTimeout = this.casper.defaultWaitTimeout * 1;
        message = messages.getMessage('ERROR_STEP_TIMED_OUT', defTimeout.format('time'));
    }
    
    this.result.steps[this.current_step_index - 1].result.passed = testresult;
    this.result.steps[this.current_step_index - 1].result.data = data;
    
    if (message != "") {
        this.result.steps[this.current_step_index - 1].result.message = toolkit.stripCRLF(message);
    } else {
        if ("ssl_errors" in this.result.steps[this.current_step_index - 1].response) {
            this.result.steps[this.current_step_index - 1].result.message = "Contains SSL Errors";
        }
    }
    
    if (testresult) {
        this.result.info.number_of_passed = this.result.info.number_of_passed + 1;
    } else {
        this.result.info.number_of_failed = this.result.info.number_of_failed + 1;
    }
    
    this.result.steps[this.current_step_index - 1].end = this.current_step_end.toISOString();
    this.result.steps[this.current_step_index - 1].elapse = elapse;
    
    step_name = this.result.steps[this.current_step_index - 1].details.step;
    
    logger.debug('running end step > ' + this.current_step_index + " > " + this.current_step_end + " > duration: " + elapse);
    logger.info('        result > ' + (testresult ? "Passed" : "Failed") + " > " + message);
    
    this.current_step_start = null;
    this.current_step_end = null;
    
    if (assertStep && !testresult) {
        geneos.saveResults(instance);
        phantom.exit(5);
    }
};

GeneosJS.prototype.updateCurrentStepMessage = function (message) {
    message = typeof message !== 'undefined' ? message : "";
    this.result.steps[this.current_step_index - 1].result.message = toolkit.stripCRLF(message);
};

GeneosJS.prototype.resetPerformanceResult = function () {
    this.resources = [];
};

GeneosJS.prototype.addPerformanceResult = function (har) {
    // attached har information for this step
    this.result.steps[this.current_step_index - 1].performance = har;
    
    //compute for total size downloaded; and total time generated for each element
    var totalSize = 0;
    var startTime = new Date(Date.parse(har.log.entries[0].startedDateTime)).getTime();
    var endTime = startTime + har.log.entries[0].time;
    
    /*har.log.entries.forEach(function (res) {*/
    for (var i = 1; i < har.log.entries.length; i++) {
        var res = har.log.entries[i];
        totalSize = totalSize + res.response.bodySize;
        
        // var thisTime = (new Date(Date.parse(res.startedDateTime)).getTime()) + res.time;
        var thisTime = (new Date(Date.parse(res.startedDateTime)).getTime());
        logger.debug("recorded start time: > " + thisTime + " > " + startTime + " > " + endTime);
        
        if (startTime > thisTime) {
            startTime = thisTime;
        }
        
        if (endTime < thisTime) {
            endTime = thisTime + res.time;
        }
    }
    //});
    
    
    this.result.steps[this.current_step_index - 1].downloadSize = totalSize;
    this.result.steps[this.current_step_index - 1].totalTime = (endTime - startTime);
    
    logger.debug("step total duration > " + this.current_step_index + " > " + this.result.steps[this.current_step_index - 1].totalTime);
};

GeneosJS.prototype.updateStepDownloadSize = function (size) {
    this.result.steps[this.current_step_index - 1].downloadSize = size;
};

/**
 * Brute force searching for JSON entry
 * @param source
 * @param skey
 */
GeneosJS.prototype.searchPageResource = function (source, skey, cid) {
    var foundEntry = null;
    
    if (cid < source.log.entries.length) {
        foundEntry = source.log.entries[cid];
        if (skey == foundEntry.request.url) {
            return foundEntry;
        } else {
            foundEntry = null;
        }
    }
    
    for (var i = 0; i < source.log.entries.length; i++) {
        entry = source.log.entries[i];
        if (entry.request.url == skey) {
            foundEntry = entry;
            break;
        }
    }
    
    return foundEntry;
};

/**
 * Create HAR (HTTP Archive) Format (JSONP)
 */
GeneosJS.prototype.createHar = function (pageAddress, pageTitle) {
    var entries = [];
    
    this.resources.forEach(function (resource) {
        var request = resource.request,
        startReply = resource.startReply,
        endReply = resource.endReply;
        
        if (!request || !startReply || !endReply) {
            return;
        }
        
        var ssl_errors = [];
        if ("ssl_errors" in resource) {
            ssl_errors = resource.ssl_errors;
        }
        
        entries.push({
            startedDateTime : request.time.toISOString(),
            time : endReply.time - request.time,
            request : {
                method : request.method,
                url : request.url,
                httpVersion : "HTTP/1.1",
                cookies : [],
                headers : request.headers,
                queryString : [],
                headersSize : -1,
                bodySize : -1
            },
            response : {
                status : endReply.status,
                statusText : endReply.statusText,
                httpVersion : "HTTP/1.1",
                cookies : [],
                headers : endReply.headers,
                redirectURL : "",
                headersSize : -1,
                bodySize : startReply.bodySize,
                content : {
                    size : startReply.bodySize,
                    mimeType : endReply.contentType
                },
                ssl_errors : ssl_errors.errors
            },
            cache : {},
            timings : {
                blocked : 0,
                dns : -1,
                connect : -1,
                send : 0,
                wait : startReply.time - request.time,
                receive : endReply.time - startReply.time,
                ssl : -1
            }
        });
    });
    
    return {
        log : {
            version : '1.0',
            creator : {
                name : "Geneos EUEM",
                version : phantom.geneosVersion.toString()
            },
            pages : [{
                    startedDateTime : this.startTime.toISOString(),
                    id : pageAddress,
                    title : pageTitle,
                    pageTimings : {}
                }
            ],
            entries : entries
        }
    };
};

exports.GeneosJS = GeneosJS;
