var tm = require("text-miner");
var wn = require("wordnet-magic");
var Promise = require("bluebird");
var traceur = require("traceur");
var ndarray = require("ndarray");
var unpack = require("ndarray-unpack");
var sena = traceur.require("./sentenceHypernymTree3.js");

function getChildren(id, synArray, adjac){
	
	var ndarrayId = adjac.idStore.indexOf(id);
	var childrenNdArray = adjac.pick(ndarrayId, null);
	var childrenIds = [];
	for (var i=0; i < childrenNdArray.size; i++){
	  if (childrenNdArray.get(i) > 0) {
	    childrenIds.push(adjac.idStore[i]);
	  }  	
	}
	var children = synArray.filter(function(elem){
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
		    var children = getChildren(elem.synsetid, synArray, adjac);  
		    delete elem.hypernym;
		    attachChildren(children);
			elem.children = children;	
			return elem;
		  }); 
  }
  
  attachChildren(roots);
  return roots;
}

export var getD3Tree = function(corpus){

  var analyzerPromise = sena.analyzeCorpus(corpus);
  return analyzerPromise.then(function(data){
    return formD3Tree(data.synsets, data.adjMatrix);
  });
}	
