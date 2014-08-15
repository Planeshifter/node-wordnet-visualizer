var util = require("util");
var wn = require("wordnet-magic");
var Promise = require("bluebird");
var tm = require("text-miner");
var _ = require('underscore');
//Import Underscore.string to separate object, because there are conflict functions (include, reverse, contains)
_.str = require('underscore.string');
//Mix in non-conflict functions to Underscore namespace if you want
_.mixin(_.str.exports());
//All functions, include conflict, will be available through _.str object
_.str.include('Underscore.string', 'string'); // => true

var http = require("http");
var url = require("url");

function sentenceAnalyzer(sentence){
	var corpus = new tm.Corpus(Array(sentence));
	corpus = corpus
			.removeInterpunctuation()
			.removeNewlines()
			.toLower()
			.removeWords(tm.STOPWORDS.EN)
			.clean();
	
	var wordArray = corpus.documents[0].split(" ");
	
	wordArray = wordArray.map(function(elem){
		return wn.morphy(elem);
	});
	
	processedSynsetArray = [];
	
	var synsetArrayPromise = Promise.all(wordArray).then(function(elem){
		var baseWords = elem.map(function(arr){
			return arr[0].lemma;
		});
			
		baseWords = baseWords.map(function(e){
	      return new wn.Word(e);
	    });
		
		var synsetArray = baseWords.map(function(w){
		  return w.getSynsets();
		});
		
		return synsetArray;
	});
	
	var firstSynsetArray = Promise.all(synsetArrayPromise).map(function(s){
		 return synset = s[0];
	});
		
	processedSynsetArray = firstSynsetArray.map(function(s){
	  s.hypernym = s.getHypernymTree();
	  var objPromise =  Promise.props(s);
	  objPromise.then(function(augSynset){ processObject(Array(augSynset)); });		
	  return objPromise;
	  }); 

	return processedSynsetArray;
		
}


var synsets = [];
var adjMatrix = [];

Object.defineProperty(synsets, "exists", {
	enumerable: false,
	configurable: false,
	writable: false,
	value: function(id){
		var ret = synsets.some(function(elem){
			return elem.synsetid == id;
		});
		return ret;
	}
});

function processObject(obj){
  obj.forEach(function(elem){
	  
	if (elem.hypernym.length === 1){
	  if (!adjMatrix[elem.hypernym[0].synsetid]){
	    adjMatrix[elem.hypernym[0].synsetid] = [];
	  }
	  adjMatrix[elem.hypernym[0].synsetid][elem.synsetid] = 1;  	
	}
	  
    if (!synsets.exists(elem.synsetid)){
	  synsets.push(elem); 
    }
    processObject(elem.hypernym);
  });
}

function getChildren(id, adjac){
	
	if (!adjac[id]) return [];
	
	var childrenIds = Object.keys(adjac[id]);
	var children = synsets.filter(function(elem){
	  return childrenIds.some(function(id){
	    return id == elem.synsetid;	  
	  });
	});
	return children;
}

function formD3Tree(synArray, adjac){
  var roots = [];
  
  synArray.forEach(function(elem){
  
    if (Array.isArray(elem.hypernym) && elem.hypernym.length === 0){
      roots.push(elem);
    }	
  });
  
  function attachChildren(arr){
	 return arr.map(function(elem){
		    var children = getChildren(elem.synsetid, adjac);  
		    delete elem.hypernym;
		    attachChildren(children);
			elem.children = children;	
			return elem;
		  }); 
  }
  
  attachChildren(roots);
  
  return roots;
}

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
			adjMatrix.length = 0;
			synsets.length = 0;
			var analyzerPromise = sentenceAnalyzer(decoded_query);
			analyzerPromise.then(function(){
		      roots = formD3Tree(synsets, adjMatrix);
		      var msg = JSON.stringify(roots);
		      console.log(msg);
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


