/* 
 * Copyright 2012 ITRS Group Plc 
 * 
 * Code Generated Scenario Scripts 
 * -------------------------------------------------------------- 
 */ 

try { 
	 phantom.casperPath = 'plugins/euem/casperjs'; 
	 phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');  

	 phantom.geneosPath = 'plugins/euem';  
	 phantom.injectJs(phantom.geneosPath + '/lib/protos.js');  
	 phantom.injectJs(phantom.geneosPath + '/lib/bootstrap.js'); 
	 phantom.injectJs(phantom.geneosPath + '/lib/sjcl.js'); 

	 var geneos = geneos('geneos').create(); 
	 var system = require('system'); 

	 geneos.initialize({"homedir":"plugins/euem/catalog/EUEM on GENEOS","url":"http://192.168.142.20:7050","scenario":"ORB - Verify text and extract info","showall":true,"timeouts":{"scenarioTimeout":60,"stepTimeout":30}}); 

	 geneos.addStep({
    "target": "http://192.168.142.20:7050/orb",
    "value": "",
    "step": "open"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.addStep({
    "target": "//tr[3]/td[2]",
    "value": "Gateway version",
    "step": "storeText"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.addStep({
    "target": "${Gateway version}",
    "value": "",
    "step": "echo"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.addStep({
    "target": "css=div.timesamp",
    "value": "Page generated at",
    "step": "storeText"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.addStep({
    "target": "${Page generated at}",
    "value": "",
    "step": "echo"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.addStep({
    "target": "//tr[7]/td[2]",
    "value": "Built at",
    "step": "storeText"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.addStep({
    "target": "${Built at}",
    "value": "",
    "step": "echo"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.addStep({
    "target": "link=Show All Queues",
    "value": "",
    "step": "clickAndWait"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.addStep({
    "target": "Orb Diagnostic Mode",
    "value": "",
    "step": "verifyTextPresent"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.doSteps();
} catch(err) { 
  console.log('[euem][error] ' + err); 
  phantom.exit(1);
}
