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

	 geneos.initialize({"homedir":"plugins/euem/catalog/EUEM on GENEOS","url":"http://192.168.142.20:8181/","scenario":"MONTAGE Detail","showall":true,"timeouts":{"scenarioTimeout":60,"stepTimeout":30}}); 

	 geneos.addStep({
    "target": "http://192.168.142.20:8181/geneos-web-logon/;jsessionid=5udez160p4pq1rsortwtkelsc",
    "value": "",
    "step": "open"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.addStep({
    "target": "name=j_username",
    "value": "lyZ5lwC4ssg32RZifA",
    "cipher": "{\"iv\":\"hfFXaXsoPQd6u9h2w/QIvQ\",\"salt\":\"vWejqrMFTqI\",\"ct\":\"lyZ5lwC4ssg32RZifA\"}",
    "step": "type"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.addStep({
    "target": "name=j_password",
    "value": "aAhyMsylmlbJ0NZvQQ",
    "cipher": "{\"iv\":\"ujsix27q0QzZqOrvHohoHg\",\"salt\":\"vWejqrMFTqI\",\"ct\":\"aAhyMsylmlbJ0NZvQQ\"}",
    "step": "type"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.addStep({
    "target": "id=geneos-id-logon-submit",
    "value": "",
    "step": "clickAndWait"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.addStep({
    "target": "link=Montage",
    "value": "",
    "step": "click"
}, function(){ 
		// add your custom code handler here 
	 }); 

	 geneos.doSteps();
} catch(err) { 
  console.log('[euem][error] ' + err); 
  phantom.exit(1);
}
