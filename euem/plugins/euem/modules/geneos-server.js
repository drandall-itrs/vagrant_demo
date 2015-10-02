 /*
  * Copyright 2012 ITRS Group Plc
  *
  * Geneos HTTP Server
  * HTTP Server Listener PhantomJS Library for Geneos EUEM
  * Listens to HTTP port for incoming transfer of Geneos EUEM JSON 
  * Format to be translated and converted to a runnable PhantomJS
  * Script file. 
  * --------------------------------------------------------------
  * Requires: PhantomJS WebServer, PhantomJS File
  *           Geneos TranslateJS
  * --------------------------------------------------------------
  * Usage:
  * 		phantomjs geneos/modules/geneos-server.js 8080
  *
  * --------------------------------------------------------------
  * @args  http port to open; default 8080 
  * --------------------------------------------------------------
  */

var service;
var fs = require('fs');
var server = require('webserver').create();

phantom.geneosPath = '/phantomjs/geneos';
phantom.injectJs(phantom.geneosPath + '/lib/protos.js');
phantom.injectJs(phantom.geneosPath + '/modules/translate.js');

function getCommand(uri) {
	command = "";
	
	paramIndex = uri.indexOf("?");
	if(paramIndex > -1) {
		command = uri.substring(1, paramIndex);
	} else {
		command = uri.substring(1);
	}
	
	return command;
}

function manage(options) {
	
}

function execute(options) {

}

port = 8080;
if (phantom.args.length !== 1) {
} else {
    port = phantom.args[0];
}

service = server.listen(port, function (request, response) {

    response.statusCode = 200;
	command = getCommand(request.url);

	content_response = " ";
	
	var now=new Date();
	timeStamp = now.getMonth() + "/" + now.getDate() + "/" + now.getYear() + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
	console.log(timeStamp + " > geneos euem > " + command);
	switch (command) {
		case "store":
			get_data = request.url;
			get_data = get_data.substring(13);
			json_data = JSON.parse(decodeURIComponent(get_data));
			
			if(fs.exists(json_data.title)) {
			} else {
				fs.makeDirectory("geneos/scenarios/" + json_data.scenario);
			}
			
			fs.write("geneos/scenarios/" + json_data.scenario + "/" + json_data.scenario + ".geume", JSON.stringify(json_data, null, 4), "w");
			
			translate = new TranslateJS();
			translate.translate(json_data);
			
			content_response = '{"result":"OK"}';
			break;
		
		case "manage":
			content_response = manage(request.url);
			break;
		
		case "exec":
			content_response = exec(request.url);
			break;
			
		default:
			console.log("geneos euem: unknown command");
	}
	
    response.write(content_response);
});

if (!service) {
	console.log("Server Failed to Start.");
	phantom.exit();
} else {
	console.log("Server Running @ " + port);
}