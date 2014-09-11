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
var qs = require("querystring");
var getD3Tree = require("./sentenceAnalyzer.js");

http.createServer(function (request, response) { 
	 
	 if (request.method == 'POST') {
	 	console.log("Here comes a post");
		var pathname = url.parse(request.url).pathname;

        var body = '';
        request.on('data', function (data) {
            body += data;
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6) { 
                // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
                request.connection.destroy();
            }
        });
        request.on('end', function () {

        response.writeHead(200, {
		  'Content-Type': 'application/json',
		  'Access-Control-Allow-Origin' : '*',
		});
	    

            var POST = JSON.parse(body);
            
            var Prom = getD3Tree(POST);
            Prom.then(function(roots){
		      var msg = JSON.stringify(roots);
			  response.end(msg);
			});

        });
    }
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
