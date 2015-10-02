/*
 * Copyright 2012 ITRS Group Plc
 *
 * Geneos Scenario Code Generator
 * Generates code based on scenario created from Selenium IDE.
 * --------------------------------------------------------------
 * Requires: PhantomJS File
 * --------------------------------------------------------------
 * Usage:
 *     phantomjs codegen.js --source=[scenario-file] 
 *                          --sampler=[samplername] 
 *                          --name=[sceanrioname] 
 *                          --showall=[yes|no]
 *                          --timeout=[scenario,step] (in seconds)
 *                          
 *     phantomjs codegen.js --source=scenario.geuem
 *                          --sampler=EUEM
 *                          --name=scenario
 *                          --showall=yes
 *                          --timeout=5,5                          
 *
 * --------------------------------------------------------------
 */

try {
    var euemPath = 'plugins/euem';
    phantom.geneosPath = euemPath;
    phantom.injectJs(phantom.geneosPath + '/lib/protos.js');

    var fs = require('fs');
    var cg_options = {
        source : "",
        name : "",
        sampler : "",
        showall : "no",
        debug: "no",
        timeout: "5,5"
    };

    phantom.args.forEach(function _forEach(arg) {
        if (arg.indexOf('--') === 0) {
            var validArgs = arg.match(/^--(.*?)=(.*)/i);
            if (validArgs) {
                cg_options[validArgs[1]] = validArgs[2];
            }
        }
    });

    if (cg_options.source === "" || 
        cg_options.name === "" || 
        cg_options.sampler === "") {
        console.log('Invalid Geneos Code Generation Arguments');
        phantom.exit(1);
    }
    
    // expand timeouts
    var timeouts = cg_options.timeout.split(",");
    cg_options.timeout = {
            scenarioTimeout: isNaN(timeouts[0]) ? 5 : parseInt(timeouts[0], 10),
            stepTimeout: isNaN(timeouts[1]) ? 5 : parseInt(timeouts[1], 10)
    };
    
    if( cg_options.debug === "yes" ) {
        console.log('Geneos Scenario Code Generator');
        console.log('--------------------------------------------------------------');
        console.log(JSON.stringify(cg_options, null, 4));
        console.log('--------------------------------------------------------------');
    }
    
    if (!fs.exists(cg_options.source)) {
        console.log('Source file does not exists (' + cg_options.source + ').');
        phantom.exit(1);
    }

    var json_data = fs.read(cg_options.source);
    var source_data = {};
    try {
        source_data = JSON.parse(json_data);
    } catch (e) {
        console.log("<strong>Scenario Script Generation Failed.</strong><blockquote>Source file is not a valid Geneos Scenario. <br/>Please check your scenario file, it must be in proper JSON format.</blockquote>");
        phantom.exit(2);
    }

    var stripped_sampler_name = cg_options.sampler;
    var stripped_scenario_name = cg_options.name; 
    
    var home_dir = 'plugins/euem/catalog/' + stripped_sampler_name;
    cg_file = home_dir + '/gen/' + stripped_scenario_name + ".js";

    // write code comment
    comments = "/* \n" + " * Copyright 2012 ITRS Group Plc \n" + " * \n" + " * Code Generated Scenario Scripts \n"
            + " * -------------------------------------------------------------- \n" + " */ \n\n";
    fs.write(cg_file, comments, "w");

    fs.write(cg_file, "try { \n", "a");

    // write headers
    headers = "\t phantom.casperPath = '" + euemPath + "/casperjs'; \n" +
            "\t phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');  \n\n" +
            "\t phantom.geneosPath = '" + euemPath + "';  \n" +
            "\t phantom.injectJs(phantom.geneosPath + '/lib/protos.js');  \n" +
            "\t phantom.injectJs(phantom.geneosPath + '/lib/bootstrap.js'); \n" +
            "\t phantom.injectJs(phantom.geneosPath + '/lib/sjcl.js'); \n\n" +
            "\t var geneos = geneos('geneos').create(); \n" + "\t var system = require('system'); \n\n";
    fs.write(cg_file, headers, "a");

    // write initialisation
    var init_settings = {
        homedir : home_dir,
        url : source_data.url,
        scenario : cg_options.name,
        showall : (cg_options.showall == "yes"),
        timeouts : cg_options.timeout
    };
    init_code = '\t geneos.initialize(' + JSON.stringify(init_settings, null, '') + '); \n\n';
    fs.write(cg_file, init_code, "a");

    var first_step = source_data.steps[0];
    if (first_step.step !== "open" && first_step.step !== "loginWithBasicAuthentication") {
        // add open step
        console.log("> Scenario does not define first Open action, adding new open.");
        open_step = {
            step : "open",
            target : source_data.url,
            command : ""
        };
        open_step = JSON.stringify(open_step, null, 4);
        command_step = "\t geneos.addStep(" + open_step + ", function(){ \n"
                + "\t	// add your custom code handler here \n" + "\t }); \n\n";

        fs.write(cg_file, command_step, "a");
    }

    source_data.steps.forEach(function(step) {
        if (step.step !== "") {
            if (step.step === "open") {
                var open_url = step.target;
                if (open_url.match("^http://") != "http://") {
                    if (source_data.url.endsWith("/") && step.target.startsWith("/")) {
                        step.target = source_data.url + step.target.substr(1);
                    } else {
                        step.target = source_data.url + step.target;
                    }
                }
            }

            step_details = JSON.stringify(step, null, 4);
            command_step = "\t geneos.addStep(" + step_details + ", function(){ \n"
                    + "\t	// add your custom code handler here \n" + "\t }); \n\n";

            fs.write(cg_file, command_step, "a");
            console.log("> " + JSON.stringify(step));
        }
    });

    fs.write(cg_file, "\t geneos.doSteps();\n", "a");

    fs.write(cg_file, "} catch(err) { \n", "a");
    fs.write(cg_file, "  console.log('[euem][error] ' + err); \n", "a");
    fs.write(cg_file, "  phantom.exit(1);\n", "a");
    fs.write(cg_file, "}\n", "a");

    // remove last run if exists
    var last_run = home_dir + "/_last/" + stripped_scenario_name + ".json";
    if (fs.exists(last_run)) {
        fs.remove(last_run);
    }

    phantom.exit(0);
} catch (err) {
    console.log('[euem][error] ' + err);
    phantom.exit(1);
}
