var util = require("util");
var traceur = require("traceur");


var _ = require('underscore');
//Import Underscore.string to separate object, because there are conflict functions (include, reverse, contains)
_.str = require('underscore.string');
//Mix in non-conflict functions to Underscore namespace if you want
_.mixin(_.str.exports());
//All functions, include conflict, will be available through _.str object
_.str.include('Underscore.string', 'string'); // => true

var http = require("http");
var url = require("url");

var sentenceAnalyzer = traceur.require("./sentenceAnalyzer.js")


http.createServer(function (request, response) { 
	if(request.method == 'GET'){
	console.log("Hier kommt ein GET");
	var pathname = url.parse(request.url).pathname;
	var query = url.parse(request.url).query;
	var decoded_query = decodeURIComponent(query);
	
	switch(pathname){
	  case "/analyze_sentence":
		var roots;
	
		response.writeHead(200, {
			  'Content-Type': 'application/json',
			  'Access-Control-Allow-Origin' : '*',
		});
	    
		if(query !== ""){
			  var Prom = sentenceAnalyzer.getD3Tree(decoded_query);

			  Prom.then(function(roots){
		        var msg = JSON.stringify(roots);
			    response.end(msg);
			  });
		} else {
			msg = "Error: please enter a sentence.";
			respond.end(msg);
		}
		
	  break;
	}
	}
}).listen(12000);


