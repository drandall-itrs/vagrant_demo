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

	 geneos.initialize({"homedir":"plugins/euem/catalog/EUEM on GENEOS","url":"http://192.168.142.20:7050","scenario":"GATEWAY ORB","showall":true,"timeouts":{"scenarioTimeout":60,"stepTimeout":30}}); 

	 geneos.addStep({
    "target": "http://192.168.142.20:7050/orb/bdos/local",
    "value": "",
    "step": "open"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.addStep({
    "target": "link=Directory",
    "value": "",
    "step": "clickAndWait"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.doSteps();
} catch(err) { 
  console.log('[euem][error] ' + err); 
  phantom.exit(1);
}
