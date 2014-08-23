var tm = require("text-miner");
var wn = require("wordnet-magic");
var Promise = require("bluebird")

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

function sentenceAnalyzer(sentence){

	var corpus = new tm.Corpus(Array(sentence));
	corpus = corpus
			.removeInterpunctuation()
			.removeNewlines()
			.toLower()
			.removeWords(tm.STOPWORDS.EN)
			.clean();

	var wordArray = corpus.documents[0].split(" ");
	console.log(wordArray)
	var wordArrayPromise = wordArray.map(x => wn.morphy(x));
	var wordArrayDone = Promise.all(wordArrayPromise);
	var wordArrayPromise2 = wordArrayDone.then(elem => elem.filter(elem => elem.length >= 1)).then(elem => elem.map(arr => new wn.Word(arr[0].lemma,"n")));
    var synsetArrayPromise = wordArrayPromise2.then(arr => arr.map(w => w.getSynsets()));		
    var synsetArrayPromise2 = Promise.all(synsetArrayPromise);
    var flattenedArray = synsetArrayPromise2.then(arr => arr.reduce(function(a,b){ return a.concat(b); }));
    var processedSynsetArray = flattenedArray.then(arr => {
        return arr.map(function(s){
	    s.hypernym = s.getHypernymTree();
	    var objPromise =  Promise.props(s);
	    objPromise.then(function(augSynset){ processObject(Array(augSynset)); });		
	    return objPromise;
	  });
    });

	return Promise.all(processedSynsetArray);
}
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

export var getD3Tree = function(sentence){

  synsets.length = 0;
  adjMatrix.length = 0;
  
  var analyzerPromise = sentenceAnalyzer(sentence);
  
  return analyzerPromise.then(function(data){
    return formD3Tree(synsets, adjMatrix);
  });
}	

